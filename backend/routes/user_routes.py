from flask import Blueprint, request, jsonify, g
from models import db, User, ContactRequest, GlobalNotification, AuditLog
from utils.decorators import token_required, require_role
import uuid
import datetime

user_bp = Blueprint('user', __name__)

@user_bp.route('/directory', methods=['GET'])
@token_required
def get_directory():
    """Returns directory of users for authenticated nodes."""
    users = User.query.all()
    return jsonify({'directory': [u.to_dict() for u in users]}), 200

@user_bp.route('/profile/<username>', methods=['GET'])
@token_required
def get_profile(username):
    """Get public profile of a user node."""
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200

@user_bp.route('/update_profile', methods=['POST'])
@token_required
def update_profile():
    """Allows user to update their own profile and preferences."""
    current_user = g.current_user
    data = request.json or {}
    
    # Verify user can only update their own profile unless ADMIN
    target_username = data.get('username')
    if target_username and target_username != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Cannot update another user profile'}), 403
        
    user = User.query.filter_by(username=target_username or current_user.username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if 'settings' in data:
        import json
        user.settings_json = json.dumps(data['settings'])
        
    db.session.commit()
    return jsonify({'user': user.to_dict(), 'message': 'Profile updated successfully'}), 200

@user_bp.route('/contacts/<username>', methods=['GET'])
@token_required
def get_contacts(username):
    """Get accepted contacts for a user. Restricted to the user themselves or ADMIN."""
    current_user = g.current_user
    if username != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Cannot access contacts of another user'}), 403

    requests = ContactRequest.query.filter(
        ((ContactRequest.sender == username) | (ContactRequest.receiver == username)) &
        (ContactRequest.status == 'accepted')
    ).all()
    
    contact_usernames = set()
    for req in requests:
        if req.sender == username:
            contact_usernames.add(req.receiver)
        else:
            contact_usernames.add(req.sender)
            
    users = User.query.filter(User.username.in_(contact_usernames)).all()
    return jsonify({'contacts': [u.to_dict() for u in users]}), 200

@user_bp.route('/contacts/requests/<username>', methods=['GET'])
@token_required
def get_contact_requests(username):
    """Get pending contact requests for the user."""
    current_user = g.current_user
    if username != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Cannot access contact requests of another user'}), 403

    requests = ContactRequest.query.filter_by(receiver=username, status='pending').all()
    sender_usernames = [r.sender for r in requests]
    senders = User.query.filter(User.username.in_(sender_usernames)).all()
    
    result = []
    for req in requests:
        sender_info = next((u for u in senders if u.username == req.sender), None)
        if sender_info:
            result.append({
                'requestId': req.id,
                'user': sender_info.to_dict(),
                'timestamp': req.timestamp.strftime('%I:%M %p') if req.timestamp else ''
            })
            
    return jsonify({'requests': result}), 200

@user_bp.route('/contacts/request', methods=['POST'])
@token_required
def send_request():
    """Send a contact request. Sender identity is taken from authenticated session."""
    current_user = g.current_user
    data = request.json or {}
    receiver = data.get('receiver')
    
    if not receiver:
        return jsonify({'error': 'Receiver username required'}), 400
        
    if receiver == current_user.username:
        return jsonify({'error': 'Cannot add yourself as contact'}), 400
        
    target_user = User.query.filter_by(username=receiver).first()
    if not target_user:
        return jsonify({'error': 'Target user not found'}), 404
        
    # Check existing request
    existing = ContactRequest.query.filter(
        ((ContactRequest.sender == current_user.username) & (ContactRequest.receiver == receiver)) |
        ((ContactRequest.sender == receiver) & (ContactRequest.receiver == current_user.username))
    ).first()
    
    if existing:
        return jsonify({'error': f'A contact request already exists with status: {existing.status}'}), 400
        
    req_id = f"REQ-{str(uuid.uuid4())[:8].upper()}"
    new_req = ContactRequest(
        id=req_id,
        sender=current_user.username,
        receiver=receiver,
        status='pending'
    )
    db.session.add(new_req)
    db.session.commit()
    
    return jsonify({'message': 'Contact request sent', 'request': new_req.to_dict()}), 201

@user_bp.route('/contacts/respond', methods=['POST'])
@user_bp.route('/contacts/request/accept', methods=['POST'])
@user_bp.route('/contacts/request/decline', methods=['POST'])
@token_required
def respond_request():
    """Accept or reject incoming contact request."""
    current_user = g.current_user
    data = request.json or {}
    request_id = data.get('requestId')
    action = data.get('action') # 'accept' or 'reject'
    if not action:
        if request.path.endswith('/accept'):
            action = 'accept'
        elif request.path.endswith('/decline'):
            action = 'reject'
    
    if not request_id or action not in ['accept', 'reject']:
        return jsonify({'error': 'Invalid request parameters'}), 400
        
    req = ContactRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Contact request not found'}), 404
        
    if req.receiver != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Cannot respond to requests sent to other users'}), 403
        
    req.status = 'accepted' if action == 'accept' else 'rejected'
    db.session.commit()
    
    return jsonify({'message': f'Request {req.status}', 'request': req.to_dict()}), 200

@user_bp.route('/admin/users', methods=['GET'])
@require_role('ADMIN')
def admin_get_users():
    """Admin-only route to inspect user accounts and assigned roles."""
    users = User.query.all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@user_bp.route('/admin/set_role', methods=['POST'])
@require_role('ADMIN')
def admin_set_role():
    """Admin-only route to elevate or modify user roles."""
    data = request.json or {}
    target_username = data.get('username')
    new_role = data.get('role', 'USER').upper()
    
    if new_role not in ['USER', 'SECURITY_ANALYST', 'ADMIN']:
        return jsonify({'error': 'Invalid role'}), 400
        
    user = User.query.filter_by(username=target_username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    user.role = new_role
    
    audit = AuditLog(
        event_type='RoleChange',
        target=user.username,
        actor=g.current_user.username,
        severity='warning',
        details=f'Changed role to {new_role}'
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({'message': f'Role updated to {new_role}', 'user': user.to_dict()}), 200

@user_bp.route('/admin/stats', methods=['GET'])
def get_enterprise_stats():
    """Returns database telemetry metrics for the landing page and SOC dashboard."""
    try:
        from models import Session, Message, File
        users_count = User.query.count()
        sessions_count = Session.query.filter_by(is_active=True).count()
        messages_count = Message.query.count()
        files_count = File.query.count()
        threats_count = AuditLog.query.filter(AuditLog.severity.in_(['warning', 'danger', 'high'])).count()
        return jsonify({
            'users': users_count,
            'sessions': sessions_count,
            'messages': messages_count,
            'files': files_count,
            'threats': threats_count
        }), 200
    except Exception as e:
        return jsonify({
            'users': 2,
            'sessions': 1,
            'messages': 0,
            'files': 0,
            'threats': 0,
            'error': str(e)
        }), 200

@user_bp.route('/<int:user_id>/devices', methods=['GET'])
@user_bp.route('/devices', methods=['GET'])
@token_required
def get_user_devices(user_id=None):
    """Fetch active devices and sessions for a user node."""
    current_user = g.current_user
    target_id = user_id or current_user.id
    if current_user.id != target_id and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Cannot inspect another user devices'}), 403
        
    from models import Device, Session
    devices = Device.query.filter_by(user_id=target_id).filter(Device.status != 'revoked').order_by(Device.id.desc()).all()
    
    device_list = []
    for d in devices:
        active_sess = Session.query.filter_by(device_id=d.id, is_active=True).first()
        device_list.append({
            'id': d.id,
            'name': d.device_name or 'Web Browser',
            'os': d.os or 'Web',
            'browser': d.browser or 'Browser',
            'status': d.status,
            'added_at': d.added_at.strftime('%Y-%m-%d %H:%M:%S') if d.added_at else '',
            'ip': active_sess.ip_address if active_sess else '127.0.0.1',
            'last_active': active_sess.last_active.strftime('%I:%M %p') if active_sess and active_sess.last_active else 'Recently',
            'session': 'Active' if active_sess else 'Inactive',
            'is_active': bool(active_sess),
            'score': 98 if (d.os in ['iOS', 'macOS', 'Windows']) else 92
        })
        
    return jsonify({'devices': device_list}), 200

@user_bp.route('/<int:user_id>/devices/<int:device_id>', methods=['DELETE'])
@user_bp.route('/devices/<int:device_id>', methods=['DELETE'])
@token_required
def revoke_user_device(device_id, user_id=None):
    """Revoke a device and terminate associated active sessions."""
    current_user = g.current_user
    target_id = user_id or current_user.id
    if current_user.id != target_id and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Cannot revoke another user device'}), 403
        
    from models import Device, Session
    device = Device.query.filter_by(id=device_id, user_id=target_id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
        
    device.status = 'revoked'
    Session.query.filter_by(device_id=device_id).update({'is_active': False})
    
    audit = AuditLog(
        event_type='DeviceRevocation',
        target=f'Device:{device_id}',
        actor=current_user.username,
        severity='warning',
        details=f'Device {device.device_name} revoked by {current_user.username}'
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Device and sessions revoked successfully'}), 200

