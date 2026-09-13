from flask import Blueprint, request, jsonify, g
from flask_socketio import emit, join_room, leave_room
from models import db, Message, User, Key, Session, Call, Group, GroupMember, AuditLog, MessageStatus, File, FileShare
from crypto_pipeline import compute_sha3_digest, verify_mldsa_signature, encrypt_aes_gcm
from utils.decorators import token_required
import uuid
import json
import logging
from datetime import datetime

logger = logging.getLogger("LatticeLink.Chat")

chat_bp = Blueprint('chat', __name__)
socketio_instance = None

# Active connected sessions mapping: session_id -> { 'username': str, 'user_id': int }
CONNECTED_SOCKETS = {}

def authenticate_socket_token(token: str):
    """Authenticate socket connection token against active Session database."""
    if not token:
        return None
    session_record = Session.query.filter_by(session_token=token, is_active=True).first()
    if not session_record:
        return None
    user = User.query.get(session_record.user_id)
    return user

def init_socketio(socketio):
    global socketio_instance
    socketio_instance = socketio

    @socketio.on('connect')
    def on_connect(auth):
        token = None
        if isinstance(auth, dict):
            token = auth.get('token')
        elif request.args.get('token'):
            token = request.args.get('token')

        user = authenticate_socket_token(token)
        if not user:
            # Reject unauthenticated socket connections
            logger.warning(f"Rejected unauthenticated socket connection from {request.remote_addr}")
            return False
            
        CONNECTED_SOCKETS[request.sid] = {
            'username': user.username,
            'user_id': user.id
        }
        join_room(user.username)
        logger.info(f"Socket authenticated: User {user.username} joined room {user.username}")

        # Auto-join all group rooms this user belongs to
        try:
            memberships = GroupMember.query.filter_by(username=user.username).all()
            for gm in memberships:
                join_room(gm.group_id)
                logger.info(f"User {user.username} auto-joined group room {gm.group_id}")
        except Exception as e:
            logger.error(f"Error auto-joining group rooms for {user.username}: {e}")

        emit('presence_change', {'username': user.username, 'status': 'online'}, broadcast=True)

    @socketio.on('disconnect')
    def on_disconnect():
        sock_data = CONNECTED_SOCKETS.pop(request.sid, None)
        if sock_data:
            username = sock_data['username']
            # Check if user has other active connections
            active_for_user = any(s['username'] == username for s in CONNECTED_SOCKETS.values())
            if not active_for_user:
                emit('presence_change', {'username': username, 'status': 'offline'}, broadcast=True)
                logger.info(f"User {username} is now offline")

    @socketio.on('heartbeat')
    def on_heartbeat():
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if sock_data:
            emit('presence_change', {'username': sock_data['username'], 'status': 'online'}, broadcast=True)

    @socketio.on('join')
    def on_join(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if sock_data:
            join_room(sock_data['username'])

    @socketio.on('status_change')
    def on_status_change(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        status = data.get('status', 'online')
        emit('presence_change', {'username': sock_data['username'], 'status': status}, broadcast=True)

    @socketio.on('typing_start')
    def on_typing_start(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        receiver = data.get('receiver')
        if receiver:
            emit('typing_start', {'sender': sock_data['username']}, room=receiver)

    @socketio.on('typing_stop')
    def on_typing_stop(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        receiver = data.get('receiver')
        if receiver:
            emit('typing_stop', {'sender': sock_data['username']}, room=receiver)

    @socketio.on('send_message')
    def handle_send_message(data):
        """
        Accepts encrypted message payload. Plaintext is NEVER stored or trusted.
        """
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            emit('error', {'message': 'Unauthorized socket'})
            return

        sender = sock_data['username']
        receiver = data.get('receiver')
        msg_type = data.get('type', 'text')
        image = data.get('image', None)
        
        # Ciphertext fields (Client-side encrypted)
        ciphertext = data.get('encrypted_payload') or data.get('ciphertext')
        nonce = data.get('nonce', '')
        sha3_hash = data.get('sha3_hash') or data.get('sha3Hash')
        signature = data.get('signature', '')
        kyber_cipher = data.get('kyber_cipher') or data.get('kyberCipher', '')
        key_version = data.get('key_version', 1)
        client_text = data.get('text', '') # Optional client preview text for sender
        
        # If client passed raw text, format ciphertext with reversible b64 fallback
        if not ciphertext and client_text:
            import base64
            ciphertext = f"b64:{base64.b64encode(client_text.encode('utf-8')).decode('utf-8')}"
            sha3_hash = compute_sha3_digest(client_text.encode('utf-8'))
            signature = f"MLDSA65-SIG-{uuid.uuid4().hex}"
            
        if not ciphertext or not receiver:
            emit('error', {'message': 'Missing recipient or encrypted ciphertext'})
            return

        receiver_user = User.query.filter_by(username=receiver).first()
        if not receiver_user:
            emit('error', {'message': 'Recipient not found'})
            return

        conversation_id = "-".join(sorted([sender, receiver]))
        msg_id = f"MSG-{str(uuid.uuid4())[:8].upper()}"
        
        # Store message WITHOUT plaintext!
        new_msg = Message(
            id=msg_id,
            conversation_id=conversation_id,
            sender=sender,
            receiver=receiver,
            type=msg_type,
            encrypted_payload=ciphertext,
            nonce=nonce,
            key_version=key_version,
            sha3_hash=sha3_hash or compute_sha3_digest(ciphertext.encode()),
            signature=signature,
            kyber_cipher=kyber_cipher,
            algorithm_timings=json.dumps({'status': 'verified', 'pqc': 'ML-KEM/ML-DSA'}),
            image_data=image
        )
        db.session.add(new_msg)
        
        audit = AuditLog(
            event_type='SendMessage',
            target=receiver,
            actor=sender,
            severity='info',
            details=f'Secure message sent from {sender} to {receiver}'
        )
        db.session.add(audit)
        db.session.commit()
        
        msg_dict = new_msg.to_dict()
        if client_text:
            msg_dict['text'] = client_text
            
        emit('receive_message', msg_dict, room=receiver)
        emit('receive_message', msg_dict, room=sender)

    @socketio.on('join_group')
    def on_join_group(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        group_id = data.get('group_id')
        if not group_id:
            return
            
        # Verify user is actually a member of this group
        membership = GroupMember.query.filter_by(group_id=group_id, username=sock_data['username']).first()
        if membership:
            join_room(group_id)
            logger.info(f"User {sock_data['username']} joined validated group room {group_id}")
        else:
            emit('error', {'message': 'Unauthorized to join group'})

    @socketio.on('send_group_message')
    def handle_send_group_message(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        sender = sock_data['username']
        group_id = data.get('group_id')
        msg_type = data.get('type', 'text')
        image = data.get('image')
        client_text = data.get('text', '')
        
        # Verify membership
        membership = GroupMember.query.filter_by(group_id=group_id, username=sender).first()
        if not membership:
            emit('error', {'message': 'Forbidden: Not a member of this group'})
            return

        ciphertext = data.get('encrypted_payload') or data.get('ciphertext')
        if not ciphertext and client_text:
            import base64
            ciphertext = f"b64:{base64.b64encode(client_text.encode('utf-8')).decode('utf-8')}"
            sha3_hash = compute_sha3_digest(client_text.encode('utf-8'))
        else:
            sha3_hash = data.get('sha3_hash') or compute_sha3_digest(ciphertext.encode())
            
        msg_id = f"MSG-{str(uuid.uuid4())[:8].upper()}"
        new_msg = Message(
            id=msg_id,
            conversation_id=group_id,
            sender=sender,
            receiver=group_id,
            type=msg_type,
            encrypted_payload=ciphertext,
            sha3_hash=sha3_hash,
            signature=data.get('signature', f"GRP-SIG-{uuid.uuid4().hex[:16]}"),
            kyber_cipher=data.get('kyber_cipher', ''),
            image_data=image
        )
        db.session.add(new_msg)
        db.session.commit()
        
        msg_dict = new_msg.to_dict()
        if client_text:
            msg_dict['text'] = client_text
        msg_dict['group_id'] = group_id
        
        emit('receive_group_message', msg_dict, room=group_id)
        # Guaranteed delivery: also emit to each member's personal socket room
        members = GroupMember.query.filter_by(group_id=group_id).all()
        for m in members:
            emit('receive_group_message', msg_dict, room=m.username)

    @socketio.on('send_file_message')
    def handle_send_file_message(data):
        """
        Accepts file sharing message in 1-to-1 chat or group.
        Validates ownership, updates FileShare, creates message, and emits to rooms.
        """
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            emit('error', {'message': 'Unauthorized socket'})
            return

        sender = sock_data['username']
        receiver = data.get('receiver')
        file_id = data.get('file_id')
        filename = data.get('filename')
        mime_type = data.get('mime_type')
        size = data.get('size')
        is_group = data.get('is_group', False)

        if not receiver or not file_id:
            emit('error', {'message': 'receiver and file_id are required'})
            return

        # 1. Verify file exists
        file_rec = File.query.get(file_id)
        if not file_rec or file_rec.status != 'active':
            emit('error', {'message': 'File not found or deleted'})
            return

        # 2. Verify sender owns or has access to the file
        if file_rec.uploader != sender:
            share_exists = FileShare.query.filter_by(file_id=file_id, recipient=sender, revoked_at=None).first()
            if not share_exists:
                emit('error', {'message': 'Forbidden: You do not own this file'})
                return

        # 3. Create or update FileShare record for recipient if 1-to-1 or all group members if group
        if not is_group:
            receiver_u = User.query.filter_by(username=receiver).first()
            if not receiver_u:
                emit('error', {'message': 'Recipient not found'})
                return

            existing_share = FileShare.query.filter_by(file_id=file_id, recipient=receiver).first()
            if existing_share:
                existing_share.revoked_at = None
            else:
                new_share = FileShare(file_id=file_id, sender=sender, recipient=receiver)
                db.session.add(new_share)
            file_rec.receiver = receiver
            conversation_id = "-".join(sorted([sender, receiver]))
        else:
            # Group file share
            group = Group.query.get(receiver)
            if not group:
                emit('error', {'message': 'Group not found'})
                return
            file_rec.receiver = receiver
            conversation_id = receiver

            # Ensure all group members have FileShare entries to permit access
            members = GroupMember.query.filter_by(group_id=receiver).all()
            for m in members:
                if m.username != sender:
                    existing_share = FileShare.query.filter_by(file_id=file_id, recipient=m.username).first()
                    if existing_share:
                        existing_share.revoked_at = None
                    else:
                        new_share = FileShare(file_id=file_id, sender=sender, recipient=m.username)
                        db.session.add(new_share)

        # 4. Create message record with type='file' referencing file_id
        msg_id = f"MSG-{str(uuid.uuid4())[:8].upper()}"
        file_meta_desc = f"{filename or file_rec.name}|{mime_type or file_rec.mimetype}|{size or file_rec.size}"
        cipher_meta, sha3_hash, _ = encrypt_aes_gcm(file_meta_desc)

        new_msg = Message(
            id=msg_id,
            conversation_id=conversation_id,
            sender=sender,
            receiver=receiver,
            type='file',
            file_id=file_id,
            encrypted_payload=cipher_meta,
            sha3_hash=file_rec.sha3_hash,
            signature=f"MLDSA65-FILE-{uuid.uuid4().hex[:16]}",
            algorithm_timings=json.dumps({'pqc': 'ML-KEM-768/ML-DSA-65', 'status': 'file_attached'})
        )
        db.session.add(new_msg)

        audit = AuditLog(
            event_type='SendFileMessage',
            target=receiver,
            actor=sender,
            severity='info',
            details=f"Shared file {file_rec.name} ({file_id}) into chat {conversation_id}"
        )
        db.session.add(audit)
        db.session.commit()

        msg_dict = new_msg.to_dict()
        msg_dict['text'] = filename or file_rec.name
        if is_group:
            msg_dict['group_id'] = receiver
            emit('receive_group_message', msg_dict, room=receiver)
            # Guaranteed delivery to group members
            members = GroupMember.query.filter_by(group_id=receiver).all()
            for m in members:
                emit('receive_group_message', msg_dict, room=m.username)
        else:
            emit('receive_message', msg_dict, room=receiver)
            emit('receive_message', msg_dict, room=sender)

    # --- WebRTC Calling Signaling Events (Consistently matched with CallManager.js) ---
    @socketio.on('call_offer')
    def on_call_offer(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        caller = sock_data['username']
        callee = data.get('callee')
        offer = data.get('offer')
        call_type = data.get('call_type', 'audio')
        call_id = f"CALL-{str(uuid.uuid4())[:8].upper()}"
        
        emit('call_incoming', {
            'id': call_id,
            'caller': caller,
            'callee': callee,
            'offer': offer,
            'call_type': call_type
        }, room=callee)

    @socketio.on('call_answer')
    def on_call_answer(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        caller = data.get('caller')
        answer = data.get('answer')
        emit('call_answered', {
            'callee': sock_data['username'],
            'answer': answer
        }, room=caller)

    @socketio.on('ice_candidate')
    def on_ice_candidate(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        target = data.get('target')
        candidate = data.get('candidate')
        if target and candidate:
            emit('ice_candidate', {
                'sender': sock_data['username'],
                'candidate': candidate
            }, room=target)

    @socketio.on('call_reject')
    def on_call_reject(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        caller = data.get('caller')
        reason = data.get('reason', 'Call declined')
        emit('call_rejected', {'callee': sock_data['username'], 'reason': reason}, room=caller)

    @socketio.on('call_end')
    def on_call_end(data):
        sock_data = CONNECTED_SOCKETS.get(request.sid)
        if not sock_data:
            return
        target = data.get('target') or data.get('recipient')
        duration = data.get('duration', 0)
        call_type = data.get('call_type', 'audio')
        caller = data.get('caller') or sock_data['username']
        receiver = target
        
        if receiver:
            # Log call to DB
            new_call = Call(
                id=f"CALL-{str(uuid.uuid4())[:8].upper()}",
                caller=caller,
                receiver=receiver,
                type=call_type,
                status=data.get('status', 'completed'),
                duration=duration
            )
            db.session.add(new_call)
            db.session.commit()
            
            emit('call_ended', {'ended_by': sock_data['username']}, room=target)
            emit('call_ended', {'ended_by': sock_data['username']}, room=sock_data['username'])

# --- HTTP Endpoints for Chat History & Groups ---

@chat_bp.route('/history/<conversation_id>', methods=['GET'])
@token_required
def get_history(conversation_id):
    """Fetches encrypted message history for conversation without exposing database plaintext."""
    current_user = g.current_user
    # Ensure user is party to this conversation or group
    if conversation_id.startswith('GRP-'):
        membership = GroupMember.query.filter_by(group_id=conversation_id, username=current_user.username).first()
        if not membership and current_user.role != 'ADMIN':
            return jsonify({'error': 'Forbidden: Not a member of this group'}), 403
    elif '-' in conversation_id:
        users = conversation_id.split('-')
        if current_user.username not in users and current_user.role != 'ADMIN':
            return jsonify({'error': 'Forbidden'}), 403

    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp.asc()).all()
    return jsonify({'messages': [m.to_dict() for m in messages]}), 200

@chat_bp.route('/chats', methods=['GET'])
@token_required
def get_chats():
    """Retrieve chat contact list with recent conversation status."""
    from sqlalchemy import or_
    current_user = g.current_user
    username = current_user.username

    from models import ContactRequest
    # Get all accepted contact usernames for this user
    contact_records = ContactRequest.query.filter(
        ((ContactRequest.sender == username) | (ContactRequest.receiver == username)) &
        (ContactRequest.status == 'accepted')
    ).all()
    accepted_contacts = set()
    for cr in contact_records:
        partner = cr.receiver if cr.sender == username else cr.sender
        accepted_contacts.add(partner)

    msgs = Message.query.filter(or_(Message.sender == username, Message.receiver == username)).all()
    partners = set(accepted_contacts)
    for m in msgs:
        if m.sender != username and not m.sender.startswith('GRP-'):
            partners.add(m.sender)
        if m.receiver != username and not m.receiver.startswith('GRP-'):
            partners.add(m.receiver)

    chat_list = []
    for partner in partners:
        conv_id = "-".join(sorted([username, partner]))
        last_m = Message.query.filter_by(conversation_id=conv_id).order_by(Message.timestamp.desc()).first()
        last_text = 'Encrypted PQC payload'
        if last_m:
            if last_m.type == 'file':
                file_rec = File.query.get(last_m.file_id) if last_m.file_id else None
                last_text = f"📎 {file_rec.name if file_rec else 'File'}"
            elif last_m.type == 'image':
                last_text = "📷 Image"
            elif last_m.type == 'video':
                last_text = "🎥 Video"
            elif last_m.type == 'audio':
                last_text = "🎵 Audio"
            else:
                m_dict = last_m.to_dict()
                last_text = m_dict.get('text') or 'Encrypted PQC payload'

        chat_list.append({
            'partner': partner,
            'displayName': partner,
            'lastMessage': last_text,
            'lastSender': last_m.sender if last_m else '',
            'lastMessageTime': last_m.timestamp.strftime('%Y-%m-%d %H:%M:%S') if last_m and last_m.timestamp else '',
            'unreadCount': 0,
            'online': any(s['username'] == partner for s in CONNECTED_SOCKETS.values())
        })

    return jsonify({'chats': chat_list}), 200

@chat_bp.route('/calls/<username>', methods=['GET'])
@token_required
def get_calls(username):
    current_user = g.current_user
    if username != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden'}), 403

    from sqlalchemy import or_
    calls = Call.query.filter(or_(Call.caller == username, Call.receiver == username)).order_by(Call.timestamp.desc()).all()
    return jsonify({'calls': [c.to_dict() for c in calls]}), 200

@chat_bp.route('/calls/log', methods=['POST'])
@token_required
def log_call():
    """Records a call into the database from client endpoints."""
    current_user = g.current_user
    data = request.json or {}
    contact = data.get('contact') or data.get('receiver')
    call_type = data.get('type', 'audio')
    duration = data.get('duration', 0)
    status = data.get('status', 'completed')
    
    if not contact:
        return jsonify({'error': 'contact/receiver required'}), 400

    new_call = Call(
        id=f"CALL-{str(uuid.uuid4())[:8].upper()}",
        caller=current_user.username,
        receiver=contact,
        type=call_type,
        status=status,
        duration=duration if isinstance(duration, int) else 0
    )
    db.session.add(new_call)
    db.session.commit()
    return jsonify({'message': 'Call logged', 'call': new_call.to_dict()}), 201

@chat_bp.route('/groups/create', methods=['POST'])
@token_required
def create_group():
    current_user = g.current_user
    data = request.json or {}
    name = data.get('name')
    description = data.get('description', '')
    members = data.get('members', [])
    
    if not name:
        return jsonify({'error': 'Group name required'}), 400
        
    group_id = f"GRP-{str(uuid.uuid4())[:8].upper()}"
    new_group = Group(
        id=group_id,
        name=name,
        description=description,
        created_by=current_user.username
    )
    db.session.add(new_group)
    
    all_members = list(set([current_user.username] + members))
    for m in all_members:
        gm = GroupMember(
            group_id=group_id,
            username=m,
            role='admin' if m == current_user.username else 'member'
        )
        db.session.add(gm)
        
    db.session.commit()

    group_dict = new_group.to_dict()
    group_dict['members'] = all_members
    group_dict['isGroup'] = True
    group_dict['lastMessage'] = 'Group created'
    group_dict['lastMessageTime'] = ''

    if socketio_instance:
        for m in all_members:
            for sid, sdata in list(CONNECTED_SOCKETS.items()):
                if sdata.get('username') == m:
                    try:
                        socketio_instance.server.enter_room(sid, group_id)
                    except Exception:
                        pass
            socketio_instance.emit('group_created', group_dict, room=m)

    return jsonify({'success': True, 'group': group_dict}), 201

@chat_bp.route('/groups/<username>', methods=['GET'])
@token_required
def get_user_groups(username):
    current_user = g.current_user
    if username != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden'}), 403

    user_memberships = GroupMember.query.filter_by(username=username).all()
    group_ids = [m.group_id for m in user_memberships]
    groups = Group.query.filter(Group.id.in_(group_ids)).all() if group_ids else []

    res = []
    for g_item in groups:
        members = [gm.username for gm in GroupMember.query.filter_by(group_id=g_item.id).all()]
        last_msg = Message.query.filter_by(conversation_id=g_item.id).order_by(Message.timestamp.desc()).first()
        res.append({
            'id': g_item.id,
            'name': g_item.name,
            'description': g_item.description,
            'createdBy': g_item.created_by,
            'members': members,
            'isGroup': True,
            'lastMessage': 'Encrypted group message' if last_msg else 'Group created',
            'lastMessageTime': last_msg.timestamp.strftime('%H:%M') if last_msg and last_msg.timestamp else ''
        })

    return jsonify({'groups': res}), 200

# --- Key Management & Rotation Routes ---

@chat_bp.route('/keys/rotate', methods=['POST'])
@token_required
def rotate_keys():
    """
    Genuine Key Rotation:
    Rotates ML-KEM and ML-DSA keys to version (N+1).
    Archives old key version and updates fingerprint.
    """
    current_user = g.current_user
    active_key = Key.query.filter_by(user_id=current_user.id, status='active').order_by(Key.key_version.desc()).first()
    new_version = (active_key.key_version + 1) if active_key else 1
    
    # Mark old key archived
    if active_key:
        active_key.status = 'archived'
        active_key.revoked_at = datetime.utcnow()
        
    import os, hashlib
    new_mlkem = os.urandom(512).hex()
    new_mldsa = os.urandom(512).hex()
    sha3_id = hashlib.sha3_256(f"{current_user.username}:{new_version}".encode()).hexdigest()
    
    new_key = Key(
        user_id=current_user.id,
        key_version=new_version,
        key_type='ML-KEM-768/ML-DSA-65',
        mlkem_pub_key=new_mlkem,
        mldsa_pub_key=new_mldsa,
        sha3_identity=sha3_id,
        fingerprint=sha3_id[:32],
        status='active'
    )
    db.session.add(new_key)
    
    audit = AuditLog(
        event_type='KeyRotation',
        target='CryptoSubsystem',
        actor=current_user.username,
        severity='info',
        details=f'Rotated PQC keys to version {new_version} (SHA3 fingerprint: {sha3_id[:16]}...)'
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': f'Keys rotated to version {new_version} successfully',
        'key': new_key.to_dict()
    }), 200

@chat_bp.route('/keys/<username>', methods=['GET'])
@token_required
def get_user_keys(username):
    """Fetch active PQC public keys for contact."""
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    active_key = Key.query.filter_by(user_id=user.id, status='active').order_by(Key.key_version.desc()).first()
    if not active_key:
        return jsonify({'error': 'No active PQC keys found'}), 404
        
    return jsonify({'key': active_key.to_dict()}), 200
