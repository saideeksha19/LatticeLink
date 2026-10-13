"""
WhatsApp-style Status Updates API.

Visibility model (mirrors the chat contact list):
  - a user always sees their own statuses,
  - plus statuses from accepted contacts and users they have exchanged
    messages with (the same "partners" set used by /api/chat/chats).

Expiry is enforced on the backend: every read path filters `expires_at > now`,
expired rows are purged (records + media files) opportunistically, and viewing
or streaming an expired status fails with 410.
"""

import os
import re
import uuid
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, g, send_file
from sqlalchemy.exc import IntegrityError

from config import Config
from models import db, Status, StatusView, ContactRequest, Message
from utils.decorators import token_required, rate_limit

status_bp = Blueprint('status', __name__)

socketio_instance = None


def init_socketio(socketio):
    """Register the shared Socket.IO server (called from app.py)."""
    global socketio_instance
    socketio_instance = socketio


# ---------------------------------------------------------------
# Validation constants
# ---------------------------------------------------------------

STATUS_TTL_HOURS = 24
MAX_TEXT_LENGTH = 500
MAX_MEDIA_BYTES = 15 * 1024 * 1024  # 15 MB per status media upload

ALLOWED_IMAGE_MIMES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
ALLOWED_VIDEO_MIMES = {'video/mp4', 'video/webm', 'video/quicktime'}
EXT_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
}

BG_COLOR_RE = re.compile(r'^#[0-9a-fA-F]{6}$')
DEFAULT_BG_COLOR = '#1e293b'

# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------

def _sniff_media_kind(header):
    """Identify media kind from magic bytes. Returns 'image' | 'video' | None."""
    if not header or len(header) < 12:
        return None
    if header[:3] == b'\xff\xd8\xff':
        return 'image'                                    # JPEG
    if header[:8] == b'\x89PNG\r\n\x1a\n':
        return 'image'                                    # PNG
    if header[:6] in (b'GIF87a', b'GIF89a'):
        return 'image'                                    # GIF
    if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        return 'image'                                    # WebP
    if header[4:8] == b'ftyp':
        return 'video'                                    # MP4 / MOV (ISO BMFF)
    if header[:4] == b'\x1aE\xdf\xa3':
        return 'video'                                    # WebM / Matroska
    return None


def _sanitize_text(raw):
    """Strip control characters and enforce length limits."""
    if raw is None:
        return ''
    text = ''.join(ch for ch in str(raw) if ch == '\n' or ch == '\t' or ord(ch) >= 32)
    text = text.strip()
    return text[:MAX_TEXT_LENGTH]


def _visible_usernames(username):
    """
    Self + accepted contacts + message partners (same partner set the
    chat list uses). Statuses stay inside the user's existing social graph.
    """
    visible = {username}

    contact_records = ContactRequest.query.filter(
        ((ContactRequest.sender == username) | (ContactRequest.receiver == username)) &
        (ContactRequest.status == 'accepted')
    ).all()
    for cr in contact_records:
        partner = cr.receiver if cr.sender == username else cr.sender
        visible.add(partner)

    msgs = Message.query.filter(
        (Message.sender == username) | (Message.receiver == username)
    ).limit(500).all()
    for m in msgs:
        if m.sender and not m.sender.startswith('GRP-'):
            visible.add(m.sender)
        if m.receiver and not m.receiver.startswith('GRP-'):
            visible.add(m.receiver)

    return visible


def _status_media_abs_path(status):
    """Resolve stored relative media path inside the uploads root (traversal-safe)."""
    if not status.media_path:
        return None
    allowed_root = os.path.abspath(Config.UPLOAD_FOLDER)
    normalized = os.path.abspath(os.path.join(allowed_root, status.media_path))
    if not (normalized == allowed_root or normalized.startswith(allowed_root + os.sep)):
        return None
    return normalized


def _remove_status_media(status):
    path = _status_media_abs_path(status)
    if path and os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            pass


def _purge_expired_statuses():
    """Backend expiry enforcement: delete expired rows and their media files."""
    try:
        expired = Status.query.filter(Status.expires_at <= datetime.utcnow()).all()
        for st in expired:
            _remove_status_media(st)
            StatusView.query.filter_by(status_id=st.id).delete()
            db.session.delete(st)
        if expired:
            db.session.commit()
    except Exception:
        db.session.rollback()


def _get_status_or_404(status_id):
    status = Status.query.get(status_id)
    if not status:
        return None, (jsonify({'error': 'Status not found'}), 404)
    return status, None


def _authorize_status_access(status, username):
    """
    Owner or member of the status creator's visible graph may read.
    Returns None when authorized, otherwise an Flask (response, code) tuple.
    """
    if status.creator == username:
        return None
    if username in _visible_usernames(status.creator):
        return None
    # Do not reveal private statuses to unrelated users
    return (jsonify({'error': 'Forbidden: Not authorized to view this status'}), 403)


def _status_payload(status, username):
    data = status.to_dict(requesting_username=username)
    token = request.args.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    if status.media_path:
        data['media_url'] = f"/api/status/{status.id}/media?token={token}"
    return data


def _notify_contacts(status, creator):
    """Emit a real-time new_status event to the creator's contacts."""
    if socketio_instance is None:
        return
    try:
        payload = {'status': status.to_dict(requesting_username=creator)}
        for username in _visible_usernames(status.creator):
            if username == creator:
                continue
            socketio_instance.emit('new_status', payload, room=username)
    except Exception:
        pass


# ---------------------------------------------------------------
# Routes
# ---------------------------------------------------------------

@status_bp.route('/create', methods=['POST'])
@token_required
@rate_limit(limit=30, period=60)
def create_status():
    """
    Create a text, image or video status.
    Multipart: text, bg_color, file
    JSON:      {type: 'text', text, bg_color}
    """
    current_user = g.current_user
    _purge_expired_statuses()

    text = ''
    bg_color = DEFAULT_BG_COLOR
    upload = None

    if request.mimetype == 'multipart/form-data' or request.files:
        upload = request.files.get('file')
        text = _sanitize_text(request.form.get('text', ''))
        raw_color = (request.form.get('bg_color') or '').strip()
    elif request.is_json:
        data = request.json or {}
        text = _sanitize_text(data.get('text', ''))
        raw_color = str(data.get('bg_color') or '').strip()
        if str(data.get('type', 'text')) != 'text':
            return jsonify({'error': 'JSON creation only supports text statuses; use multipart for media'}), 400
    else:
        return jsonify({'error': 'Unsupported payload: send JSON or multipart/form-data'}), 400

    if raw_color:
        if not BG_COLOR_RE.match(raw_color):
            return jsonify({'error': 'Invalid background color: expected #rrggbb'}), 400
        bg_color = raw_color.lower()

    status_type = 'text'
    media_path = None
    media_mimetype = None
    media_size = 0

    if upload is not None and upload.filename:
        filename = upload.filename or ''
        declared = (upload.mimetype or '').lower()

        if declared not in ALLOWED_IMAGE_MIMES and declared not in ALLOWED_VIDEO_MIMES:
            return jsonify({'error': f'Unsupported media type: {declared or "unknown"}'}), 415

        # Stream with size cap + magic-byte sniffing (never trust the client)
        status_id_preview = f"ST-{str(uuid.uuid4())[:8].upper()}"
        user_dir = os.path.join(Config.UPLOAD_FOLDER, 'status', str(current_user.id))
        os.makedirs(user_dir, exist_ok=True)
        ext = EXT_BY_MIME[declared]
        abs_path = os.path.join(user_dir, f"{status_id_preview}.{ext}")

        total = 0
        header = b''
        hasher_ok = True
        try:
            with open(abs_path, 'wb') as out:
                while True:
                    chunk = upload.read(65536)
                    if not chunk:
                        break
                    if len(header) < 16:
                        header += chunk[:16 - len(header)]
                    total += len(chunk)
                    if total > MAX_MEDIA_BYTES:
                        raise _MediaTooLarge()
                    out.write(chunk)
        except _MediaTooLarge:
            try:
                os.remove(abs_path)
            except OSError:
                pass
            return jsonify({'error': f'Media exceeds the {MAX_MEDIA_BYTES // (1024 * 1024)} MB status limit'}), 413
        except Exception:
            try:
                os.remove(abs_path)
            except OSError:
                pass
            return jsonify({'error': 'Failed to store uploaded media'}), 500

        kind = _sniff_media_kind(header)
        expected = 'image' if declared in ALLOWED_IMAGE_MIMES else 'video'
        if kind != expected or kind is None:
            try:
                os.remove(abs_path)
            except OSError:
                pass
            return jsonify({'error': 'Upload content does not match a valid image or video'}), 415

        status_type = expected
        media_mimetype = declared
        media_size = total
        media_path = os.path.relpath(abs_path, os.path.abspath(Config.UPLOAD_FOLDER)).replace(os.sep, '/')
        # Persist with the real ID (rename the file to its final ID below)
        final_id = f"ST-{str(uuid.uuid4())[:8].upper()}"
        final_abs = os.path.join(user_dir, f"{final_id}.{ext}")
        os.replace(abs_path, final_abs)
        media_path = os.path.relpath(final_abs, os.path.abspath(Config.UPLOAD_FOLDER)).replace(os.sep, '/')
        status_id = final_id
    else:
        if not text:
            return jsonify({'error': 'A text status requires content'}), 400
        status_id = f"ST-{str(uuid.uuid4())[:8].upper()}"

    if status_type == 'text' and not text:
        return jsonify({'error': 'A text status requires content'}), 400
    if status_type in ('image', 'video') and not text and not media_path:
        return jsonify({'error': 'Status media is missing'}), 400

    now = datetime.utcnow()
    status = Status(
        id=status_id,
        creator=current_user.username,
        type=status_type,
        text=text or None,
        bg_color=bg_color,
        media_path=media_path,
        media_mimetype=media_mimetype,
        media_size=media_size,
        created_at=now,
        expires_at=now + timedelta(hours=STATUS_TTL_HOURS),
    )
    db.session.add(status)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Could not create status (duplicate id)'}), 500

    _notify_contacts(status, current_user.username)
    return jsonify({'status': _status_payload(status, current_user.username)}), 201


class _MediaTooLarge(Exception):
    pass


@status_bp.route('/feed', methods=['GET'])
@token_required
def status_feed():
    """Active (non-expired) statuses visible to the requesting user, newest first."""
    current_user = g.current_user
    _purge_expired_statuses()

    visible = _visible_usernames(current_user.username)
    now = datetime.utcnow()
    rows = Status.query.filter(
        Status.creator.in_(visible),
        Status.expires_at > now
    ).order_by(Status.created_at.desc()).all()

    statuses = [_status_payload(s, current_user.username) for s in rows]
    return jsonify({
        'statuses': statuses,
        'now': now.strftime('%Y-%m-%d %H:%M:%S'),
        'ttl_hours': STATUS_TTL_HOURS,
    }), 200


@status_bp.route('/<status_id>', methods=['GET'])
@token_required
def get_status(status_id):
    current_user = g.current_user
    status, err = _get_status_or_404(status_id)
    if err:
        return err
    if status.is_expired():
        return jsonify({'error': 'This status has expired'}), 410
    denied = _authorize_status_access(status, current_user.username)
    if denied:
        return denied
    return jsonify({'status': _status_payload(status, current_user.username)}), 200


@status_bp.route('/<status_id>/media', methods=['GET'])
@token_required
def status_media(status_id):
    """Stream status media with authorization + traversal protection."""
    current_user = g.current_user
    status, err = _get_status_or_404(status_id)
    if err:
        return err
    denied = _authorize_status_access(status, current_user.username)
    if denied:
        return denied
    if status.is_expired():
        return jsonify({'error': 'This status has expired'}), 410
    if not status.media_path:
        return jsonify({'error': 'This status has no media'}), 404

    abs_path = _status_media_abs_path(status)
    if not abs_path or not os.path.isfile(abs_path):
        return jsonify({'error': 'Status media not found'}), 404

    return send_file(
        abs_path,
        mimetype=status.media_mimetype,
        as_attachment=False,
        download_name=os.path.basename(abs_path),
        max_age=0,
    )


@status_bp.route('/<status_id>/view', methods=['POST'])
@token_required
def view_status(status_id):
    """Record a view. Duplicate views for the same (status, viewer) are no-ops."""
    current_user = g.current_user
    status, err = _get_status_or_404(status_id)
    if err:
        return err
    if status.creator == current_user.username:
        return jsonify({'error': 'You cannot record a view on your own status'}), 400
    denied = _authorize_status_access(status, current_user.username)
    if denied:
        return denied
    if status.is_expired():
        return jsonify({'error': 'This status has expired'}), 410

    already_viewed = False
    existing = StatusView.query.filter_by(status_id=status.id, viewer=current_user.username).first()
    if existing is None:
        db.session.add(StatusView(status_id=status.id, viewer=current_user.username))
        try:
            db.session.commit()
        except IntegrityError:
            # Race-safe duplicate suppression via the unique constraint
            db.session.rollback()
            already_viewed = True
    else:
        already_viewed = True

    view_count = StatusView.query.filter_by(status_id=status.id).count()
    return jsonify({
        'status_id': status.id,
        'view_count': view_count,
        'already_viewed': already_viewed,
    }), 200


@status_bp.route('/<status_id>/views', methods=['GET'])
@token_required
def status_viewers(status_id):
    """Owner-only viewer list. Unrelated users get 403; details are never leaked."""
    current_user = g.current_user
    status, err = _get_status_or_404(status_id)
    if err:
        return err
    if status.creator != current_user.username:
        return jsonify({'error': 'Forbidden: Only the status owner can see viewers'}), 403

    viewers = [
        {'username': v.viewer,
         'viewed_at': v.viewed_at.strftime('%Y-%m-%d %H:%M:%S') if v.viewed_at else ''}
        for v in status.views
    ]
    return jsonify({'status_id': status.id, 'view_count': len(viewers), 'viewers': viewers}), 200


@status_bp.route('/<status_id>', methods=['DELETE'])
@token_required
def delete_status(status_id):
    """Delete own status only. Deleting someone else's status is forbidden."""
    current_user = g.current_user
    status, err = _get_status_or_404(status_id)
    if err:
        return err
    if status.creator != current_user.username:
        return jsonify({'error': 'Forbidden: You can only delete your own status'}), 403

    _remove_status_media(status)
    StatusView.query.filter_by(status_id=status.id).delete()
    db.session.delete(status)
    db.session.commit()
    return jsonify({'deleted': True, 'status_id': status_id}), 200
