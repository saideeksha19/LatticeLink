from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

class SafeSQLAlchemy(SQLAlchemy):
    """
    Hardened SQLAlchemy extension that intercepts drop_all() calls.
    Refuses execution unless LATTICELINK_TEST_MODE is True AND the engine URL
    explicitly targets a designated isolated test database.
    """
    def drop_all(self, *args, **kwargs):
        from config import Config
        try:
            engine_url = str(self.engine.url)
        except Exception:
            engine_url = getattr(Config, 'SQLALCHEMY_DATABASE_URI', '')
        Config.assert_safe_for_destructive_action("db.drop_all()", uri=engine_url)
        return super().drop_all(*args, **kwargs)

db = SafeSQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    security_question = db.Column(db.String(255), nullable=True) # Kept nullable for backwards compatibility
    security_answer_hash = db.Column(db.String(255), nullable=True)
    node_id = db.Column(db.String(80), unique=True, nullable=False)
    role = db.Column(db.String(20), default='USER', nullable=False) # USER, SECURITY_ANALYST, ADMIN
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token_hash = db.Column(db.String(255), nullable=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)
    settings_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        settings = {}
        if self.settings_json:
            try:
                settings = json.loads(self.settings_json)
            except Exception:
                settings = {}
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'nodeId': self.node_id,
            'role': self.role,
            'isVerified': self.is_verified,
            'settings': settings,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


class EmailVerificationToken(db.Model):
    """
    Stores cryptographically hashed 6-digit OTPs for email verification.
    """
    __tablename__ = 'email_verification_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    salt = db.Column(db.String(64), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PasswordResetToken(db.Model):
    """
    Stores cryptographically hashed 6-digit OTPs for forgot-password workflows.
    """
    __tablename__ = 'password_reset_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    salt = db.Column(db.String(64), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Key(db.Model):
    __tablename__ = 'keys'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    key_version = db.Column(db.Integer, default=1, nullable=False)
    key_type = db.Column(db.String(50), default='ML-KEM-768/ML-DSA-65', nullable=False)
    mlkem_pub_key = db.Column(db.Text, nullable=False)
    mldsa_pub_key = db.Column(db.Text, nullable=False)
    aes_session_key = db.Column(db.Text, nullable=True) # Ephemeral/session key metadata
    sha3_identity = db.Column(db.Text, nullable=False)
    fingerprint = db.Column(db.String(128), nullable=True)
    status = db.Column(db.String(20), default='active', nullable=False) # active, revoked, archived
    revoked_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'key_version': self.key_version,
            'key_type': self.key_type,
            'mlkem_pub_key': self.mlkem_pub_key,
            'mldsa_pub_key': self.mldsa_pub_key,
            'sha3_identity': self.sha3_identity,
            'fingerprint': self.fingerprint or self.sha3_identity,
            'status': self.status,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


class Device(db.Model):
    __tablename__ = 'devices'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    device_name = db.Column(db.String(100), nullable=False)
    os = db.Column(db.String(50), nullable=True)
    browser = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='active', nullable=False) # active, disconnected, revoked
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'device_name': self.device_name,
            'os': self.os,
            'browser': self.browser,
            'status': self.status,
            'added_at': self.added_at.strftime('%Y-%m-%d %H:%M:%S') if self.added_at else ''
        }


class Session(db.Model):
    __tablename__ = 'sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    device_id = db.Column(db.Integer, db.ForeignKey('devices.id'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    ip_address = db.Column(db.String(50), nullable=False)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, nullable=False)


class File(db.Model):
    __tablename__ = 'files'
    id = db.Column(db.String(80), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    mimetype = db.Column(db.String(100), default='application/octet-stream', nullable=True)
    uploader = db.Column(db.String(80), nullable=False, index=True)
    receiver = db.Column(db.String(80), nullable=True, index=True) # Primary/initial shared recipient
    path = db.Column(db.String(255), nullable=False) # e.g. uploads/user_id/xyz.enc
    storage_path = db.synonym('path')
    aes_key_ref = db.Column(db.Text, default='', nullable=True) # Client-wrapped key metadata
    sha3_hash = db.Column(db.Text, nullable=False) # SHA3 file integrity
    download_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active', nullable=False) # active, deleted
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'mimetype': self.mimetype,
            'uploader': self.uploader,
            'receiver': self.receiver,
            'sha3_hash': self.sha3_hash,
            'download_count': self.download_count,
            'status': self.status,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else ''
        }


class FileShare(db.Model):
    """
    Stores explicit file access grants between nodes.
    """
    __tablename__ = 'file_shares'
    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(db.String(80), db.ForeignKey('files.id'), nullable=False, index=True)
    sender = db.Column(db.String(80), nullable=False, index=True)
    recipient = db.Column(db.String(80), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'file_id': self.file_id,
            'sender': self.sender,
            'recipient': self.recipient,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else '',
            'is_active': self.revoked_at is None
        }


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.String(80), primary_key=True)
    conversation_id = db.Column(db.String(120), nullable=False, index=True)
    sender = db.Column(db.String(80), nullable=False, index=True)
    receiver = db.Column(db.String(80), nullable=False, index=True)
    type = db.Column(db.String(20), default='text', nullable=False) # text, file, image, video, audio
    message_type = db.synonym('type')
    encrypted_payload = db.Column(db.Text, nullable=False) # AES-256-GCM ciphertext
    nonce = db.Column(db.String(64), nullable=True) # AES-256-GCM nonce / IV
    key_version = db.Column(db.Integer, default=1, nullable=False)
    file_id = db.Column(db.String(80), db.ForeignKey('files.id'), nullable=True, index=True)
    
    # Cryptographic integrity and signature
    sha3_hash = db.Column(db.Text, nullable=False)
    signature = db.Column(db.Text, nullable=False)
    kyber_cipher = db.Column(db.Text, nullable=True)
    algorithm_timings = db.Column(db.Text, nullable=True)
    
    # App message features (No plaintext stored!)
    image_data = db.Column(db.Text, nullable=True) # Encrypted preview / thumbnail if needed
    reply_to_id = db.Column(db.String(80), nullable=True)
    is_forwarded = db.Column(db.Boolean, default=False, nullable=False)
    is_edited = db.Column(db.Boolean, default=False, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        # Attach file metadata if this is a file message
        file_meta = None
        if self.file_id:
            f = File.query.get(self.file_id)
            if f:
                file_meta = {
                    'id': f.id,
                    'name': f.name,
                    'size': f.size,
                    'mimetype': f.mimetype,
                    'sha3_hash': f.sha3_hash,
                    'uploader': f.uploader
                }

        # For text messages, retrieve payload or fallback text representation
        display_text = ''
        if self.type == 'file':
            display_text = file_meta['name'] if file_meta else ''
        else:
            # First check if the encrypted_payload was saved in clear or can be decoded
            payload = self.encrypted_payload or ''
            if payload.startswith('b64:'):
                try:
                    import base64
                    display_text = base64.b64decode(payload[4:]).decode('utf-8')
                except Exception:
                    display_text = payload
            elif payload.startswith('plain:'):
                display_text = payload[6:]
            else:
                # Attempt AES-GCM server-side decrypt if possible
                try:
                    from crypto_pipeline import decrypt_secure_payload
                    # In this architecture, payload is ciphertext
                    display_text = payload
                except Exception:
                    display_text = payload

        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender': self.sender,
            'receiver': self.receiver,
            'type': self.type,
            'encrypted_payload': self.encrypted_payload,
            'nonce': self.nonce,
            'key_version': self.key_version,
            'file_id': self.file_id,
            'file_meta': file_meta,
            'sha3_hash': self.sha3_hash,
            'signature': self.signature,
            'kyber_cipher': self.kyber_cipher,
            'algorithm_timings': self.algorithm_timings,
            'image': self.image_data,
            'reply_to_id': self.reply_to_id,
            'is_forwarded': self.is_forwarded,
            'is_edited': self.is_edited,
            'is_deleted': self.is_deleted,
            'text': display_text,
            'timestamp': self.timestamp.strftime('%H:%M') if self.timestamp else ''
        }


class MessageStatus(db.Model):
    __tablename__ = 'message_status'
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.String(80), db.ForeignKey('messages.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.String(20), default='sent', nullable=False) # sent, delivered, read
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Call(db.Model):
    __tablename__ = 'calls'
    id = db.Column(db.String(80), primary_key=True)
    caller = db.Column(db.String(80), nullable=False, index=True)
    receiver = db.Column(db.String(80), nullable=False, index=True)
    type = db.Column(db.String(20), nullable=False) # audio, video
    status = db.Column(db.String(20), nullable=False) # missed, rejected, completed, active
    duration = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'caller': self.caller,
            'receiver': self.receiver,
            'type': self.type,
            'status': self.status,
            'duration': self.duration,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else ''
        }


class Group(db.Model):
    __tablename__ = 'groups'
    id = db.Column(db.String(80), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    created_by = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by': self.created_by,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


class GroupMember(db.Model):
    __tablename__ = 'group_members'
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.String(80), db.ForeignKey('groups.id'), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    role = db.Column(db.String(20), default='member', nullable=False) # admin, member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    target_user = db.Column(db.String(80), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False) # message, call, login, security
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'target_user': self.target_user,
            'type': self.type,
            'content': self.content,
            'is_read': self.is_read,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else ''
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(100), nullable=False, index=True)
    target = db.Column(db.String(120), nullable=False)
    actor = db.Column(db.String(80), nullable=True, index=True)
    severity = db.Column(db.String(20), nullable=False) # info, warning, critical
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'target': self.target,
            'actor': self.actor,
            'severity': self.severity,
            'details': self.details,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else ''
        }


class ContactRequest(db.Model):
    __tablename__ = 'contact_requests'
    id = db.Column(db.String(80), primary_key=True)
    sender = db.Column(db.String(80), nullable=False, index=True)
    receiver = db.Column(db.String(80), nullable=False, index=True)
    status = db.Column(db.String(20), default='pending', nullable=False) # pending, accepted, rejected
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'sender': self.sender,
            'receiver': self.receiver,
            'status': self.status,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else ''
        }


class GlobalNotification(db.Model):
    __tablename__ = 'global_notifications'
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'type': self.type,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else ''
        }


class ThreatLog(db.Model):
    __tablename__ = 'threat_logs'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(100), nullable=False)
    target = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'target': self.target,
            'status': self.status,
            'severity': self.severity,
            'timestamp': self.timestamp.strftime('%H:%M:%S') if self.timestamp else ''
        }
