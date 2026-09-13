import os
import uuid
import hashlib
import base64
from datetime import datetime
from flask import Blueprint, request, jsonify, g, send_file
from models import db, File, FileShare, AuditLog, User, Message, Group, GroupMember
from utils.decorators import token_required
from config import Config

vault_bp = Blueprint('vault', __name__)

def safe_format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def get_file_category(filename: str, mimetype: str) -> str:
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    if ext in ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] or (mimetype and mimetype.startswith('image/')):
        return 'image'
    elif ext in ['mp4', 'webm', 'mov', 'mkv'] or (mimetype and mimetype.startswith('video/')):
        return 'video'
    elif ext in ['mp3', 'wav', 'ogg', 'm4a'] or (mimetype and mimetype.startswith('audio/')):
        return 'audio'
    elif ext in ['zip', 'tar', 'gz', 'rar', '7z']:
        return 'archive'
    else:
        return 'document'

def check_user_file_access(user_username: str, user_role: str, file_record: File) -> bool:
    """Verifies that the user owns the file, is the primary recipient, has a valid FileShare grant, is in a message with this file, is in a group receiving this file, or is ADMIN."""
    if user_role == 'ADMIN' or file_record.uploader == user_username or file_record.receiver == user_username:
        return True
    
    # Check FileShare table
    share = FileShare.query.filter_by(
        file_id=file_record.id,
        recipient=user_username,
        revoked_at=None
    ).first()
    if share is not None:
        return True

    # Check if this file was sent in a direct message involving this user
    msg = Message.query.filter_by(file_id=file_record.id).filter(
        (Message.sender == user_username) | (Message.receiver == user_username)
    ).first()
    if msg is not None:
        return True

    # Check if this file was sent in a group where the user is a member
    group_msg = Message.query.filter_by(file_id=file_record.id).filter(
        Message.receiver.like('GRP-%')
    ).first()
    if group_msg is not None:
        from models import GroupMember
        is_member = GroupMember.query.filter_by(group_id=group_msg.receiver, username=user_username).first()
        if is_member:
            return True

    # Check if file receiver is directly a group where user is a member
    if file_record.receiver and file_record.receiver.startswith('GRP-'):
        from models import GroupMember
        is_member = GroupMember.query.filter_by(group_id=file_record.receiver, username=user_username).first()
        if is_member:
            return True

    return False

@vault_bp.route('/files/<username>', methods=['GET'])
@token_required
def get_files(username):
    """
    Get files owned by or shared with username.
    Only the user themselves or an ADMIN can view their vault.
    """
    current_user = g.current_user
    if username != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: Cannot view another node vault'}), 403

    from sqlalchemy import or_
    
    # Find files where user is uploader, direct receiver, or in FileShare
    shared_file_ids = [s.file_id for s in FileShare.query.filter_by(recipient=username, revoked_at=None).all()]
    
    files = File.query.filter(
        or_(
            File.uploader == username,
            File.receiver == username,
            File.id.in_(shared_file_ids)
        ),
        File.status == 'active'
    ).order_by(File.timestamp.desc()).all()
    
    result = []
    for f in files:
        file_preview = ""
        if f.path and os.path.exists(f.path) and f.size < 5 * 1024 * 1024:
            try:
                with open(f.path, 'rb') as disk_file:
                    file_preview = f"data:{f.mimetype};base64,{base64.b64encode(disk_file.read()).decode('utf-8')}"
            except Exception:
                file_preview = ""
                
        result.append({
            'id': f.id,
            'name': f.name,
            'size': safe_format_size(f.size),
            'size_bytes': f.size,
            'mimetype': f.mimetype,
            'type': get_file_category(f.name, f.mimetype),
            'owner': {'username': f.uploader},
            'receiver': f.receiver,
            'uploadedAt': f.timestamp.strftime('%H:%M') if f.timestamp else '',
            'sha3_hash': f.sha3_hash,
            'download_count': f.download_count,
            'base64': file_preview
        })
        
    return jsonify({'files': result}), 200

@vault_bp.route('/upload', methods=['POST'])
@token_required
def upload_file():
    """
    Upload file directly to disk under uploads/<user_id>/<file_id>.enc.
    Does NOT store raw file contents in SQLite.
    Accepts both multipart/form-data and JSON payloads.
    """
    current_user = g.current_user
    file_id = f"VF-{str(uuid.uuid4())[:8].upper()}"
    
    user_upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    target_disk_path = os.path.abspath(os.path.join(user_upload_dir, f"{file_id}.enc"))
    file_name = "unnamed_file"
    mimetype = "application/octet-stream"
    file_size = 0
    sha3_hash = ""
    receiver = None
    
    # Check multipart upload
    if 'file' in request.files:
        upload_obj = request.files['file']
        file_name = upload_obj.filename or "file.bin"
        mimetype = upload_obj.mimetype or "application/octet-stream"
        receiver = request.form.get('receiver') or request.form.get('recipient')
        
        hasher = hashlib.sha3_256()
        with open(target_disk_path, 'wb') as f_out:
            while chunk := upload_obj.read(65536):
                f_out.write(chunk)
                hasher.update(chunk)
                file_size += len(chunk)
        sha3_hash = hasher.hexdigest()
    else:
        data = request.json or {}
        file_name = data.get('name', 'file.bin')
        mimetype = data.get('fileType', 'application/octet-stream')
        receiver = data.get('receiver') or data.get('recipient')
        raw_b64 = data.get('base64', '')
        
        if ',' in raw_b64:
            raw_b64 = raw_b64.split(',', 1)[1]
            
        try:
            file_bytes = base64.b64decode(raw_b64)
        except Exception:
            file_bytes = b''
            
        file_size = len(file_bytes)
        sha3_hash = hashlib.sha3_256(file_bytes).hexdigest()
        
        with open(target_disk_path, 'wb') as f_out:
            f_out.write(file_bytes)
            
    # Persist metadata
    new_file = File(
        id=file_id,
        name=file_name,
        size=file_size,
        mimetype=mimetype,
        uploader=current_user.username,
        receiver=receiver,
        path=target_disk_path,
        aes_key_ref=f"disk:{target_disk_path}",
        sha3_hash=sha3_hash,
        status='active'
    )
    db.session.add(new_file)
    
    # If receiver specified, create FileShare record
    if receiver:
        target_u = User.query.filter_by(username=receiver).first()
        if target_u:
            share = FileShare(file_id=file_id, sender=current_user.username, recipient=receiver)
            db.session.add(share)
            
    audit = AuditLog(
        event_type='Upload File',
        target='Vault',
        actor=current_user.username,
        severity='info',
        details=f"File {file_name} ({safe_format_size(file_size)}) stored on filesystem with SHA3 {sha3_hash[:16]}..."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'file': {
            'id': new_file.id,
            'name': new_file.name,
            'size': safe_format_size(new_file.size),
            'size_bytes': new_file.size,
            'type': get_file_category(new_file.name, new_file.mimetype),
            'mimetype': new_file.mimetype,
            'sha3_hash': new_file.sha3_hash,
            'owner': current_user.username,
            'receiver': receiver
        },
        'message': 'File uploaded and secured successfully'
    }), 201

def _serve_file_download(file_id: str):
    """Internal helper to securely stream a file with authentication and traversal prevention."""
    current_user = g.current_user
    file_record = File.query.get(file_id)
    if not file_record or file_record.status != 'active':
        return jsonify({'error': 'File not found or deleted'}), 404
        
    # Check authorization
    if not check_user_file_access(current_user.username, current_user.role, file_record):
        return jsonify({'error': 'Forbidden: You are not authorized to download this file'}), 403
        
    # Security: Prevent path traversal
    normalized_path = os.path.abspath(file_record.path)
    allowed_root = os.path.abspath(Config.UPLOAD_FOLDER)
    if not normalized_path.startswith(allowed_root):
        return jsonify({'error': 'Access denied: Invalid file location'}), 403

    if not os.path.exists(normalized_path):
        return jsonify({'error': 'File payload not found on server'}), 404
        
    file_record.download_count += 1
    db.session.commit()
    
    # Check if client requests inline viewing (default for media previews)
    as_attachment = request.args.get('inline', 'false').lower() != 'true'
    
    return send_file(
        normalized_path,
        mimetype=file_record.mimetype,
        as_attachment=as_attachment,
        download_name=file_record.name
    )

@vault_bp.route('/download/<file_id>', methods=['GET'])
@token_required
def download_file(file_id):
    return _serve_file_download(file_id)

@vault_bp.route('/files/<file_id>/download', methods=['GET'])
@token_required
def download_file_canonical(file_id):
    return _serve_file_download(file_id)

@vault_bp.route('/share', methods=['POST'])
@token_required
def share_file():
    """Share vault file with another authenticated node and record FileShare entry."""
    current_user = g.current_user
    data = request.json or {}
    file_id = data.get('file_id')
    receiver = data.get('receiver')
    
    if not file_id or not receiver:
        return jsonify({'error': 'file_id and receiver are required'}), 400
        
    file = File.query.get(file_id)
    if not file or file.status != 'active':
        return jsonify({'error': 'File not found'}), 404
        
    # Allow uploader, admin, or any authorized recipient with valid FileShare access
    if file.uploader != current_user.username and current_user.role != 'ADMIN':
        share_exists = FileShare.query.filter_by(file_id=file_id, recipient=current_user.username, revoked_at=None).first()
        if not share_exists:
            return jsonify({'error': 'Forbidden: You do not own or have access to share this file'}), 403
        
    target_user = User.query.filter_by(username=receiver).first()
    target_group = None
    if not target_user:
        target_group = Group.query.get(receiver)
        if not target_group:
            target_group = Group.query.filter_by(name=receiver).first()
            if target_group:
                receiver = target_group.id
        if not target_group:
            return jsonify({'error': 'Recipient user or group not found'}), 404
        
    file.receiver = receiver
    
    if target_group:
        members = GroupMember.query.filter_by(group_id=receiver).all()
        for m in members:
            if m.username != current_user.username:
                existing_share = FileShare.query.filter_by(file_id=file_id, recipient=m.username).first()
                if existing_share:
                    existing_share.revoked_at = None
                else:
                    new_share = FileShare(file_id=file_id, sender=current_user.username, recipient=m.username)
                    db.session.add(new_share)
    else:
        # Record or reactivate FileShare for single user
        existing_share = FileShare.query.filter_by(file_id=file_id, recipient=receiver).first()
        if existing_share:
            existing_share.revoked_at = None
        else:
            new_share = FileShare(file_id=file_id, sender=current_user.username, recipient=receiver)
            db.session.add(new_share)
    
    audit = AuditLog(
        event_type='Share File',
        target='Vault',
        actor=current_user.username,
        severity='info',
        details=f"File {file.name} shared with node {receiver}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': f'File shared with {receiver} successfully',
        'file_id': file.id,
        'filename': file.name,
        'mimetype': file.mimetype,
        'size': file.size
    }), 200

@vault_bp.route('/delete/<file_id>', methods=['DELETE'])
@token_required
def delete_file(file_id):
    """Securely deletes file from disk and revokes associated FileShares."""
    current_user = g.current_user
    file = File.query.get(file_id)
    if not file:
        return jsonify({'error': 'File not found'}), 404
        
    if file.uploader != current_user.username and current_user.role != 'ADMIN':
        return jsonify({'error': 'Forbidden: You do not own this file'}), 403
        
    # Remove from disk if present
    if file.path and os.path.exists(file.path):
        try:
            os.remove(file.path)
        except Exception:
            pass
            
    file.status = 'deleted'
    
    # Revoke all shares
    shares = FileShare.query.filter_by(file_id=file_id).all()
    for s in shares:
        s.revoked_at = datetime.utcnow()
        
    db.session.commit()
    
    audit = AuditLog(
        event_type='Delete File',
        target='Vault',
        actor=current_user.username,
        severity='warning',
        details=f"File {file.name} deleted by owner"
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({'message': 'File deleted successfully'}), 200
