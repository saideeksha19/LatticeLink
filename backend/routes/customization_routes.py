"""
Per-user, per-conversation chat appearance preferences (themes & wallpapers).

Storage model:
  - Preferences live in `chat_customizations`, one row per (username,
    conversation_id). No row == LatticeLink defaults, so existing users and
    conversations keep their current look with zero migration.
  - Built-in solid/gradient wallpapers are stored as (kind, id) pairs that the
    frontend renders locally. Custom uploaded wallpapers are stored on disk
    under uploads/chat_wallpaper/<user_id>/ and referenced by media id; the
    image is only served through this authenticated, owner-checked endpoint.

Every endpoint is authenticated; conversation membership is enforced; theme
and wallpaper values are validated against strict whitelists — a client can
never store arbitrary CSS or a filesystem path.
"""

import os
import re
import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify, g, send_file
from sqlalchemy.exc import IntegrityError

from config import Config
from models import db, User, ChatCustomization, ChatWallpaperMedia, ContactRequest, GroupMember, Message
from utils.decorators import token_required, rate_limit

custom_bp = Blueprint('chat_custom', __name__)

# ---------------------------------------------------------------
# Validation constants (must match the frontend option sets)
# ---------------------------------------------------------------

ALLOWED_THEMES = {'default', 'emerald', 'ocean', 'violet', 'rose', 'amber', 'monochrome'}
ALLOWED_WALLPAPER_KINDS = {'default', 'solid', 'gradient', 'image'}

SOLID_COLORS = {
    'midnight', 'slate', 'forest', 'navy', 'plum', 'charcoal', 'teal', 'wine',
}
GRADIENT_IDS = {
    'aurora', 'sunset', 'ocean-deep', 'nebula', 'forest-mist', 'ember', 'frost', 'dusk',
}

HEX_COLOR_RE = re.compile(r'^#[0-9a-fA-F]{6}$')

MAX_WALLPAPER_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_MIMES = {'image/jpeg', 'image/png', 'image/webp'}
EXT_BY_MIME = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}

MAX_CONVERSATION_ID_LEN = 120


# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------

class _MediaTooLarge(Exception):
    pass


def _is_conversation_member(username, conversation_id):
    """Same membership rule used elsewhere: direct conv contains the username; group conv requires membership."""
    if conversation_id.startswith('GRP-'):
        return GroupMember.query.filter_by(group_id=conversation_id, username=username).first() is not None
    parts = conversation_id.split('-')
    return username in parts


def _sniff_image_kind(header):
    """Identify a real image from magic bytes. Returns extension or None."""
    if not header or len(header) < 12:
        return None
    if header[:3] == b'\xff\xd8\xff':
        return 'jpg'
    if header[:8] == b'\x89PNG\r\n\x1a\n':
        return 'png'
    if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        return 'webp'
    return None


def _media_abs_path(media):
    if not media or not media.path:
        return None
    allowed_root = os.path.abspath(Config.UPLOAD_FOLDER)
    normalized = os.path.abspath(os.path.join(allowed_root, media.path))
    if not (normalized == allowed_root or normalized.startswith(allowed_root + os.sep)):
        return None
    return normalized


def _remove_media(media):
    path = _media_abs_path(media)
    if path and os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            pass


def _defaults_payload(conversation_id):
    return {
        'conversation_id': conversation_id,
        'theme': 'default',
        'wallpaper': {'kind': 'default', 'value': None},
        'is_default': True,
    }


def _payload(row, conversation_id, token):
    data = dict(row.to_dict(), is_default=False)
    wp = data['wallpaper']
    if wp['kind'] == 'image' and wp['value']:
        wp['url'] = f"/api/chat/custom/wallpaper/{wp['value']}?token={token}"
    return data


def _validate_preferences(data):
    """
    Validate a preferences dict. Returns (cleaned, error_response).
    cleaned keys may be absent when the client didn't send them.
    """
    cleaned = {}

    if 'theme' in data and data['theme'] is not None:
        theme = str(data['theme']).strip().lower()
        if theme not in ALLOWED_THEMES:
            return None, (jsonify({'error': f'Unknown theme: {theme}'}), 400)
        cleaned['theme'] = theme

    if 'wallpaper_kind' in data and data['wallpaper_kind'] is not None:
        kind = str(data['wallpaper_kind']).strip().lower()
        if kind not in ALLOWED_WALLPAPER_KINDS:
            return None, (jsonify({'error': f'Unknown wallpaper kind: {kind}'}), 400)
        if kind == 'image':
            return None, (jsonify({'error': 'Image wallpapers are set via the upload endpoint'}), 400)
        cleaned['wallpaper_kind'] = kind

    if 'wallpaper_value' in data:
        value = data['wallpaper_value']
        kind = cleaned.get('wallpaper_kind')
        if value in (None, ''):
            cleaned['wallpaper_value'] = None
        elif kind == 'solid':
            if str(value).lower() not in SOLID_COLORS:
                return None, (jsonify({'error': f'Unknown solid color: {value}'}), 400)
            cleaned['wallpaper_value'] = str(value).lower()
        elif kind == 'gradient':
            if str(value).lower() not in GRADIENT_IDS:
                return None, (jsonify({'error': f'Unknown gradient: {value}'}), 400)
            cleaned['wallpaper_value'] = str(value).lower()
        elif kind == 'default':
            cleaned['wallpaper_value'] = None
        else:
            return None, (jsonify({'error': 'wallpaper_value requires wallpaper_kind (solid|gradient)'}), 400)

    # wallpaper_kind without value (or vice versa) sanity
    if 'wallpaper_kind' in cleaned and cleaned['wallpaper_kind'] in ('solid', 'gradient') and 'wallpaper_value' not in cleaned:
        return None, (jsonify({'error': 'wallpaper_value is required for solid/gradient wallpapers'}), 400)

    return cleaned, None


def _get_or_create_row(username, conversation_id):
    row = ChatCustomization.query.filter_by(username=username, conversation_id=conversation_id).first()
    if row is None:
        user = User.query.filter_by(username=username).first()
        user_id = user.id if user else getattr(getattr(g, 'current_user', None), 'id', None)
        row = ChatCustomization(
            username=username,
            user_id=user_id,
            conversation_id=conversation_id,
            theme='default',
            wallpaper_kind='default',
            wallpaper_type='default',
            wallpaper_overlay=0.0
        )
        db.session.add(row)
    else:
        if not row.user_id:
            user = User.query.filter_by(username=username).first()
            if user:
                row.user_id = user.id
        if not row.theme:
            row.theme = 'default'
        if not row.wallpaper_kind:
            row.wallpaper_kind = 'default'
        if not row.wallpaper_type:
            row.wallpaper_type = 'default'
        if row.wallpaper_overlay is None:
            row.wallpaper_overlay = 0.0
    return row


# ---------------------------------------------------------------
# Routes
# ---------------------------------------------------------------

@custom_bp.route('/<conversation_id>', methods=['GET'])
@token_required
def get_customization(conversation_id):
    """Own preferences for a conversation. Defaults are returned when unset."""
    current_user = g.current_user
    if not conversation_id or len(conversation_id) > MAX_CONVERSATION_ID_LEN:
        return jsonify({'error': 'Invalid conversation id'}), 400
    if not _is_conversation_member(current_user.username, conversation_id):
        return jsonify({'error': 'Forbidden: Not a member of this conversation'}), 403

    token = request.args.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    row = ChatCustomization.query.filter_by(
        username=current_user.username, conversation_id=conversation_id).first()
    if row is None:
        return jsonify(_defaults_payload(conversation_id)), 200
    return jsonify(_payload(row, conversation_id, token)), 200


@custom_bp.route('/<conversation_id>', methods=['POST'])
@token_required
@rate_limit(limit=60, period=60)
def save_customization(conversation_id):
    """Upsert own preferences for a conversation (partial updates supported)."""
    current_user = g.current_user
    if not conversation_id or len(conversation_id) > MAX_CONVERSATION_ID_LEN:
        return jsonify({'error': 'Invalid conversation id'}), 400
    if not _is_conversation_member(current_user.username, conversation_id):
        return jsonify({'error': 'Forbidden: Not a member of this conversation'}), 403

    data = request.json or {}
    cleaned, err = _validate_preferences(data)
    if err:
        return err
    if not cleaned:
        return jsonify({'error': 'No valid preferences supplied'}), 400

    row = _get_or_create_row(current_user.username, conversation_id)

    if 'theme' in cleaned:
        row.theme = cleaned['theme'] or 'default'
    if 'wallpaper_kind' in cleaned:
        row.wallpaper_kind = cleaned['wallpaper_kind'] or 'default'
        row.wallpaper_type = row.wallpaper_kind
        if row.wallpaper_kind == 'default':
            row.wallpaper_value = None
    if 'wallpaper_value' in cleaned:
        row.wallpaper_value = cleaned['wallpaper_value']

    if not row.theme:
        row.theme = 'default'
    if not row.wallpaper_kind:
        row.wallpaper_kind = 'default'
    if not row.wallpaper_type:
        row.wallpaper_type = row.wallpaper_kind or 'default'
    if row.wallpaper_overlay is None:
        row.wallpaper_overlay = 0.0

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Could not save preferences'}), 500

    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    return jsonify({'saved': True, 'customization': _payload(row, conversation_id, token)}), 200


@custom_bp.route('/<conversation_id>/wallpaper', methods=['POST'])
@token_required
@rate_limit(limit=30, period=60)
def upload_wallpaper(conversation_id):
    """Upload a custom wallpaper image for a conversation (validated server-side)."""
    current_user = g.current_user
    if not conversation_id or len(conversation_id) > MAX_CONVERSATION_ID_LEN:
        return jsonify({'error': 'Invalid conversation id'}), 400
    if not _is_conversation_member(current_user.username, conversation_id):
        return jsonify({'error': 'Forbidden: Not a member of this conversation'}), 403

    upload = request.files.get('file')
    if upload is None or not upload.filename:
        return jsonify({'error': 'No image file provided'}), 400

    declared = (upload.mimetype or '').lower()
    if declared not in ALLOWED_IMAGE_MIMES:
        return jsonify({'error': f'Unsupported image type: {declared or "unknown"}'}), 415

    media_id = f"CW-{str(uuid.uuid4())[:8].upper()}"
    user_dir = os.path.join(Config.UPLOAD_FOLDER, 'chat_wallpaper', str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)

    # provisional filename; renamed to the sniffed extension below
    abs_path = os.path.join(user_dir, f"{media_id}.upload")

    total = 0
    header = b''
    try:
        with open(abs_path, 'wb') as out:
            while True:
                chunk = upload.read(65536)
                if not chunk:
                    break
                if len(header) < 16:
                    header += chunk[:16 - len(header)]
                total += len(chunk)
                if total > MAX_WALLPAPER_BYTES:
                    raise _MediaTooLarge()
                out.write(chunk)
    except _MediaTooLarge:
        try:
            os.remove(abs_path)
        except OSError:
            pass
        return jsonify({'error': 'Wallpaper exceeds the 5 MB limit'}), 413
    except Exception:
        try:
            os.remove(abs_path)
        except OSError:
            pass
        return jsonify({'error': 'Failed to store wallpaper'}), 500

    ext = _sniff_image_kind(header)
    if ext is None:
        try:
            os.remove(abs_path)
        except OSError:
            pass
        return jsonify({'error': 'Upload is not a valid JPEG, PNG or WebP image'}), 415

    final_abs = os.path.join(user_dir, f"{media_id}.{ext}")
    os.replace(abs_path, final_abs)
    rel_path = os.path.relpath(final_abs, os.path.abspath(Config.UPLOAD_FOLDER)).replace(os.sep, '/')

    media = ChatWallpaperMedia(
        id=media_id, owner=current_user.username, path=rel_path,
        mimetype=declared, size=total,
    )
    db.session.add(media)

    row = _get_or_create_row(current_user.username, conversation_id)
    row.wallpaper_kind = 'image'
    row.wallpaper_type = 'image'
    row.wallpaper_value = media_id
    if not row.theme:
        row.theme = 'default'
    if row.wallpaper_overlay is None:
        row.wallpaper_overlay = 0.0
    db.session.commit()

    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    return jsonify({
        'uploaded': True,
        'media': media.to_dict(),
        'customization': _payload(row, conversation_id, token),
    }), 201


@custom_bp.route('/wallpaper/<media_id>', methods=['GET'])
@token_required
def serve_wallpaper(media_id):
    """Stream an uploaded wallpaper to its owner only."""
    current_user = g.current_user
    media = ChatWallpaperMedia.query.get(media_id)
    if not media:
        return jsonify({'error': 'Wallpaper not found'}), 404
    if media.owner != current_user.username:
        return jsonify({'error': 'Forbidden: Not your wallpaper'}), 403

    abs_path = _media_abs_path(media)
    if not abs_path or not os.path.isfile(abs_path):
        return jsonify({'error': 'Wallpaper file missing'}), 404

    return send_file(abs_path, mimetype=media.mimetype, as_attachment=False, max_age=3600)


@custom_bp.route('/<conversation_id>', methods=['DELETE'])
@token_required
def reset_customization(conversation_id):
    """Reset own preferences for a conversation back to LatticeLink defaults."""
    current_user = g.current_user
    if not conversation_id or len(conversation_id) > MAX_CONVERSATION_ID_LEN:
        return jsonify({'error': 'Invalid conversation id'}), 400
    if not _is_conversation_member(current_user.username, conversation_id):
        return jsonify({'error': 'Forbidden: Not a member of this conversation'}), 403

    row = ChatCustomization.query.filter_by(
        username=current_user.username, conversation_id=conversation_id).first()
    if row:
        # release any uploaded wallpaper media owned by this user for this row
        if row.wallpaper_kind == 'image' and row.wallpaper_value:
            media = ChatWallpaperMedia.query.filter_by(
                id=row.wallpaper_value, owner=current_user.username).first()
            if media:
                _remove_media(media)
                db.session.delete(media)
        db.session.delete(row)
        db.session.commit()

    return jsonify({'reset': True, **_defaults_payload(conversation_id)}), 200
