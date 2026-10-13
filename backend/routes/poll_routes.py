"""
poll_routes.py  -  Poll & Chat Customization API
"""

import os
import uuid
import json
import logging

from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError
from models import db, Poll, PollOption, PollVote, ChatCustomization, User, \
    Group, GroupMember, Message
from utils.decorators import token_required

logger = logging.getLogger("LatticeLink.Polls")

poll_bp = Blueprint("polls", __name__)

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_WALLPAPER_BYTES = 5 * 1024 * 1024  # 5 MB
VALID_THEMES = {"neutral", "teal", "coral", "purple", "green"}
VALID_WALLPAPER_TYPES = {"default", "preset", "custom"}
PRESET_WALLPAPERS = {"grid", "hexagon", "dots", "circuit", "waves", "mountains", "abstract"}


def _is_conversation_member(username: str, conversation_id: str) -> bool:
    if conversation_id.startswith("GRP-"):
        return GroupMember.query.filter_by(group_id=conversation_id, username=username).first() is not None
    parts = conversation_id.split("-")
    return username in parts


def _is_group_admin(username: str, group_id: str) -> bool:
    gm = GroupMember.query.filter_by(group_id=group_id, username=username).first()
    return gm is not None and gm.role == "admin"


def _broadcast_poll_update(poll, socketio_instance):
    if socketio_instance is None:
        return
    cid = poll.conversation_id
    payload = {"poll": poll.to_dict()}
    if cid.startswith("GRP-"):
        socketio_instance.emit("poll_updated", payload, room=cid)
        for m in GroupMember.query.filter_by(group_id=cid).all():
            socketio_instance.emit("poll_updated", payload, room=m.username)
    else:
        for p in cid.split("-"):
            socketio_instance.emit("poll_updated", payload, room=p)


@poll_bp.route("/create", methods=["POST"])
@token_required
def create_poll():
    current_user = g.current_user
    data = request.json or {}

    conversation_id = (data.get("conversation_id") or "").strip()
    question = (data.get("question") or "").strip()
    options_raw = data.get("options") or []
    allow_change = bool(data.get("allow_change_vote", True))
    show_voters = bool(data.get("show_voter_identities", False))

    if not conversation_id:
        return jsonify({"error": "conversation_id is required"}), 400
    if not _is_conversation_member(current_user.username, conversation_id):
        return jsonify({"error": "Forbidden: Not a member of this conversation"}), 403
    if not question:
        return jsonify({"error": "Poll question is required"}), 400
    if len(question) > 500:
        return jsonify({"error": "Question is too long (max 500 characters)"}), 400

    options = [str(o).strip() for o in options_raw if str(o).strip()]
    if len(options) < 2:
        return jsonify({"error": "At least 2 non-empty options are required"}), 400
    if len(options) > 10:
        return jsonify({"error": "Maximum 10 options allowed"}), 400
    lowered = [o.lower() for o in options]
    if len(lowered) != len(set(lowered)):
        return jsonify({"error": "Duplicate options are not allowed"}), 400

    poll_id = f"POLL-{str(uuid.uuid4())[:8].upper()}"
    poll = Poll(
        id=poll_id, conversation_id=conversation_id, question=question,
        creator=current_user.username, allow_change_vote=allow_change,
        show_voter_identities=show_voters,
    )
    db.session.add(poll)
    db.session.flush()

    for idx, text in enumerate(options):
        db.session.add(PollOption(poll_id=poll_id, option_text=text, order_index=idx))

    from crypto_pipeline import compute_sha3_digest
    msg_id = f"MSG-{str(uuid.uuid4())[:8].upper()}"
    poll_payload = json.dumps({"poll_id": poll_id, "question": question})
    if conversation_id.startswith("GRP-"):
        receiver = conversation_id
    else:
        parts = conversation_id.split("-")
        receiver = next((p for p in parts if p != current_user.username), parts[0])

    msg = Message(
        id=msg_id, conversation_id=conversation_id, sender=current_user.username,
        receiver=receiver, type="poll",
        encrypted_payload=f"plain:{poll_payload}",
        sha3_hash=compute_sha3_digest(poll_payload.encode()),
        signature=f"MLDSA65-POLL-{uuid.uuid4().hex[:16]}",
        algorithm_timings=json.dumps({"pqc": "ML-KEM-768/ML-DSA-65", "status": "poll"})
    )
    db.session.add(msg)
    db.session.flush()
    poll.message_id = msg_id
    db.session.commit()

    from app import socketio
    try:
        msg_dict = msg.to_dict()
        msg_dict["poll"] = poll.to_dict(requesting_username=current_user.username)
        if conversation_id.startswith("GRP-"):
            socketio.emit("receive_group_message", msg_dict, room=conversation_id)
            for m in GroupMember.query.filter_by(group_id=conversation_id).all():
                socketio.emit("receive_group_message", msg_dict, room=m.username)
        else:
            for part in conversation_id.split("-"):
                socketio.emit("receive_message", msg_dict, room=part)
    except Exception as exc:
        logger.warning(f"Socket emit for poll creation failed: {exc}")

    return jsonify({"success": True, "poll": poll.to_dict(requesting_username=current_user.username), "message_id": msg_id}), 201


@poll_bp.route("/<poll_id>", methods=["GET"])
@token_required
def get_poll(poll_id):
    current_user = g.current_user
    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({"error": "Poll not found"}), 404
    if not _is_conversation_member(current_user.username, poll.conversation_id):
        return jsonify({"error": "Forbidden"}), 403
    return jsonify({"poll": poll.to_dict(requesting_username=current_user.username)}), 200


@poll_bp.route("/<poll_id>/vote", methods=["POST"])
@token_required
def vote_poll(poll_id):
    current_user = g.current_user
    data = request.json or {}
    option_id = data.get("option_id")

    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({"error": "Poll not found"}), 404
    if poll.is_closed:
        return jsonify({"error": "This poll is closed"}), 409
    if not _is_conversation_member(current_user.username, poll.conversation_id):
        return jsonify({"error": "Forbidden: Not a member of this conversation"}), 403

    valid_option_ids = {opt.id for opt in poll.options}
    try:
        option_id = int(option_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid option_id"}), 400
    if option_id not in valid_option_ids:
        return jsonify({"error": "Option does not belong to this poll"}), 400

    existing_vote = PollVote.query.filter_by(poll_id=poll_id, username=current_user.username).first()
    if existing_vote:
        if not poll.allow_change_vote:
            return jsonify({"error": "Vote changes are not allowed for this poll"}), 409
        if existing_vote.option_id == option_id:
            return jsonify({"error": "You already voted for this option"}), 409
        existing_vote.option_id = option_id
        from datetime import datetime
        existing_vote.voted_at = datetime.utcnow()
    else:
        db.session.add(PollVote(poll_id=poll_id, option_id=option_id, username=current_user.username))

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Vote conflict – please refresh and try again"}), 409

    from app import socketio
    try:
        _broadcast_poll_update(poll, socketio)
    except Exception as exc:
        logger.warning(f"Socket emit for poll vote failed: {exc}")

    return jsonify({"success": True, "poll": poll.to_dict(requesting_username=current_user.username)}), 200


@poll_bp.route("/<poll_id>/close", methods=["POST"])
@token_required
def close_poll(poll_id):
    current_user = g.current_user
    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({"error": "Poll not found"}), 404
    if not _is_conversation_member(current_user.username, poll.conversation_id):
        return jsonify({"error": "Forbidden"}), 403

    is_creator = poll.creator == current_user.username
    is_admin = _is_group_admin(current_user.username, poll.conversation_id) if poll.conversation_id.startswith("GRP-") else False
    if not (is_creator or is_admin):
        return jsonify({"error": "Only the poll creator or group admin can close this poll"}), 403

    poll.is_closed = True
    db.session.commit()

    from app import socketio
    try:
        _broadcast_poll_update(poll, socketio)
    except Exception as exc:
        logger.warning(f"Socket emit for poll close failed: {exc}")

    return jsonify({"success": True, "poll": poll.to_dict(requesting_username=current_user.username)}), 200


@poll_bp.route("/customization/<conversation_id>", methods=["GET"])
@token_required
def get_customization(conversation_id):
    current_user = g.current_user
    if not _is_conversation_member(current_user.username, conversation_id):
        return jsonify({"error": "Forbidden"}), 403
    custom = ChatCustomization.query.filter_by(user_id=current_user.id, conversation_id=conversation_id).first()
    if not custom:
        return jsonify({"customization": {"conversation_id": conversation_id, "theme": "neutral",
                                           "wallpaper_type": "default", "wallpaper_value": None,
                                           "wallpaper_overlay": 0.0}}), 200
    return jsonify({"customization": custom.to_dict()}), 200


@poll_bp.route("/customization/<conversation_id>", methods=["POST"])
@token_required
def save_customization(conversation_id):
    current_user = g.current_user
    if not _is_conversation_member(current_user.username, conversation_id):
        return jsonify({"error": "Forbidden"}), 403

    data = request.json or {}
    theme = data.get("theme", "neutral")
    wallpaper_type = data.get("wallpaper_type", "default")
    wallpaper_value = data.get("wallpaper_value", None)
    overlay = data.get("wallpaper_overlay", 0.0)

    if theme not in VALID_THEMES:
        return jsonify({"error": f"Invalid theme. Choose from: {', '.join(VALID_THEMES)}"}), 400
    if wallpaper_type not in VALID_WALLPAPER_TYPES:
        return jsonify({"error": "Invalid wallpaper_type"}), 400
    if wallpaper_type == "preset" and wallpaper_value not in PRESET_WALLPAPERS:
        return jsonify({"error": f"Invalid preset. Choose from: {', '.join(PRESET_WALLPAPERS)}"}), 400
    try:
        overlay = max(0.0, min(0.9, float(overlay)))
    except (TypeError, ValueError):
        overlay = 0.0

    custom = ChatCustomization.query.filter_by(user_id=current_user.id, conversation_id=conversation_id).first()
    if custom:
        custom.username = current_user.username
        custom.theme = theme
        custom.wallpaper_type = wallpaper_type
        custom.wallpaper_value = wallpaper_value if wallpaper_type != "default" else None
        custom.wallpaper_overlay = overlay
    else:
        custom = ChatCustomization(user_id=current_user.id, username=current_user.username,
                                   conversation_id=conversation_id,
                                   theme=theme, wallpaper_type=wallpaper_type,
                                   wallpaper_value=wallpaper_value if wallpaper_type != "default" else None,
                                   wallpaper_overlay=overlay)
        db.session.add(custom)
    db.session.commit()
    return jsonify({"success": True, "customization": custom.to_dict()}), 200


@poll_bp.route("/wallpaper/upload", methods=["POST"])
@token_required
def upload_wallpaper():
    current_user = g.current_user
    if "file" not in request.files:
        return jsonify({"error": "No file in request"}), 400
    f = request.files["file"]
    mime = f.mimetype or ""
    if mime not in ALLOWED_IMAGE_MIMES:
        return jsonify({"error": "Only JPEG, PNG, GIF, and WebP images are allowed"}), 400
    data = f.read()
    if len(data) > MAX_WALLPAPER_BYTES:
        return jsonify({"error": "Image exceeds 5 MB limit"}), 413

    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}
    ext = ext_map.get(mime, ".jpg")
    filename = f"wp_{current_user.id}_{uuid.uuid4().hex[:12]}{ext}"
    from config import Config
    wallpaper_dir = os.path.join(Config.UPLOAD_FOLDER, "wallpapers")
    os.makedirs(wallpaper_dir, exist_ok=True)
    with open(os.path.join(wallpaper_dir, filename), "wb") as fh:
        fh.write(data)
    return jsonify({"success": True, "url": f"/api/vault/wallpapers/{filename}"}), 201
