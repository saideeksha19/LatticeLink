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
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(30), unique=True, nullable=True, index=True)
    verification_method = db.Column(db.String(20), default='email', nullable=True) # 'email' or 'phone'
    password_hash = db.Column(db.String(255), nullable=False)
    security_pin_hash = db.Column(db.String(255), nullable=True) # Securely hashed 6-digit PIN
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
            'email': self.email or '',
            'phone': self.phone or '',
            'verificationMethod': self.verification_method or 'email',
            'nodeId': self.node_id,
            'role': self.role,
            'isVerified': self.is_verified,
            'settings': settings,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


class OtpChallenge(db.Model):
    """
    Stores cryptographically hashed 6-digit OTP challenges for registration
    (supporting email and SMS verification methods).
    """
    __tablename__ = 'otp_challenges'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=True, index=True)
    contact = db.Column(db.String(120), nullable=False, index=True)
    method = db.Column(db.String(20), nullable=False) # 'email' or 'phone'
    salt = db.Column(db.String(64), nullable=False)
    otp_hash = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=True, index=True)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    resend_count = db.Column(db.Integer, default=0, nullable=False)
    last_resend_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'method': self.method,
            'is_verified': self.is_verified,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
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


# ─────────────────────────── POLLS ──────────────────────────────────────────

class Poll(db.Model):
    __tablename__ = 'polls'
    id = db.Column(db.String(80), primary_key=True)
    conversation_id = db.Column(db.String(120), nullable=False, index=True)
    message_id = db.Column(db.String(80), db.ForeignKey('messages.id'), nullable=True, index=True)
    question = db.Column(db.String(500), nullable=False)
    creator = db.Column(db.String(80), nullable=False, index=True)
    is_closed = db.Column(db.Boolean, default=False, nullable=False)
    allow_change_vote = db.Column(db.Boolean, default=True, nullable=False)
    show_voter_identities = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    options = db.relationship('PollOption', backref='poll', cascade='all, delete-orphan', order_by='PollOption.order_index')
    votes = db.relationship('PollVote', backref='poll', cascade='all, delete-orphan')

    def to_dict(self, requesting_username=None):
        opts = []
        total_votes = 0
        vote_counts = {}
        for v in self.votes:
            vote_counts[v.option_id] = vote_counts.get(v.option_id, 0) + 1
            total_votes += 1

        user_voted_option = None
        if requesting_username:
            for v in self.votes:
                if v.username == requesting_username:
                    user_voted_option = v.option_id
                    break

        for opt in self.options:
            count = vote_counts.get(opt.id, 0)
            pct = round((count / total_votes * 100) if total_votes > 0 else 0, 1)
            voters = []
            if self.show_voter_identities and requesting_username:
                voters = [v.username for v in self.votes if v.option_id == opt.id]
            opts.append({
                'id': opt.id,
                'text': opt.option_text,
                'order': opt.order_index,
                'count': count,
                'percentage': pct,
                'voters': voters
            })

        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'message_id': self.message_id,
            'question': self.question,
            'creator': self.creator,
            'is_closed': self.is_closed,
            'allow_change_vote': self.allow_change_vote,
            'show_voter_identities': self.show_voter_identities,
            'total_votes': total_votes,
            'user_voted_option': user_voted_option,
            'options': opts,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


class PollOption(db.Model):
    __tablename__ = 'poll_options'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    poll_id = db.Column(db.String(80), db.ForeignKey('polls.id'), nullable=False, index=True)
    option_text = db.Column(db.String(255), nullable=False)
    order_index = db.Column(db.Integer, default=0, nullable=False)


class PollVote(db.Model):
    __tablename__ = 'poll_votes'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    poll_id = db.Column(db.String(80), db.ForeignKey('polls.id'), nullable=False, index=True)
    option_id = db.Column(db.Integer, db.ForeignKey('poll_options.id'), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    voted_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('poll_id', 'username', name='uq_poll_vote_per_user'),
    )


# ─────────────────────── STATUS FEATURE ───────────────────────────────────────

class Status(db.Model):
    """
    WhatsApp-style status update (story).
    Statuses expire STATUS_TTL_HOURS after creation; expiry is enforced
    by the backend on every read (feed, single fetch, media streaming).
    """
    __tablename__ = 'statuses'

    id = db.Column(db.String(80), primary_key=True)  # ST-XXXXXXXX
    creator = db.Column(db.String(80), nullable=False, index=True)
    type = db.Column(db.String(10), nullable=False, default='text')  # text | image | video
    text = db.Column(db.Text, nullable=True)
    bg_color = db.Column(db.String(20), nullable=True)  # hex color for text statuses
    media_path = db.Column(db.String(255), nullable=True)  # relative to UPLOAD_FOLDER
    media_mimetype = db.Column(db.String(100), nullable=True)
    media_size = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)

    views = db.relationship('StatusView', backref='status', lazy=True,
                            cascade='all, delete-orphan')

    def is_expired(self, now=None):
        now = now or datetime.utcnow()
        return self.expires_at is None or self.expires_at <= now

    def to_dict(self, requesting_username=None, include_viewers=False):
        view_count = len(self.views) if requesting_username == self.creator else None
        viewed = False
        if requesting_username and requesting_username != self.creator:
            viewed = any(v.viewer == requesting_username for v in self.views)

        data = {
            'id': self.id,
            'creator': self.creator,
            'type': self.type,
            'text': self.text,
            'bg_color': self.bg_color,
            'media_mimetype': self.media_mimetype,
            'has_media': bool(self.media_path),
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else '',
            'expires_at': self.expires_at.strftime('%Y-%m-%d %H:%M:%S') if self.expires_at else '',
            'viewed': viewed,
            'view_count': view_count,
            'is_mine': requesting_username == self.creator,
        }
        if include_viewers:
            data['viewers'] = [
                {'username': v.viewer,
                 'viewed_at': v.viewed_at.strftime('%Y-%m-%d %H:%M:%S') if v.viewed_at else ''}
                for v in self.views
            ]
        return data


class StatusView(db.Model):
    """
    One row per (status, viewer). The unique constraint guarantees a viewer
    can never be recorded twice for the same status.
    """
    __tablename__ = 'status_views'

    id = db.Column(db.Integer, primary_key=True)
    status_id = db.Column(db.String(80), db.ForeignKey('statuses.id'), nullable=False, index=True)
    viewer = db.Column(db.String(80), nullable=False, index=True)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('status_id', 'viewer', name='uq_status_viewer'),
    )


# ─────────────────────── CHAT CUSTOMIZATION & THEMES ──────────────────────────

class ChatCustomization(db.Model):
    """
    Per-user, per-conversation appearance preferences (theme + wallpaper).
    One row per (username, conversation_id); absence of a row means defaults.
    Media wallpapers are stored on disk and referenced by wallpaper_value.
    """
    __tablename__ = 'chat_customizations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    conversation_id = db.Column(db.String(120), nullable=False, index=True)
    theme = db.Column(db.String(30), default='default', nullable=False)              # 'default' or named theme
    wallpaper_kind = db.Column(db.String(20), default='default', nullable=True)     # default|solid|gradient|image
    wallpaper_type = db.Column(db.String(20), default='default', nullable=False)  # default | preset | custom
    wallpaper_value = db.Column(db.String(512), nullable=True)   # color/gradient id/media id
    wallpaper_overlay = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('username', 'conversation_id', name='uq_user_conversation_custom'),
    )

    def to_dict(self):
        return {
            'conversation_id': self.conversation_id,
            'theme': self.theme or 'default',
            'wallpaper': {
                'kind': self.wallpaper_kind or 'default',
                'value': self.wallpaper_value or None,
            },
            'wallpaper_type': self.wallpaper_type or 'default',
            'wallpaper_value': self.wallpaper_value,
            'wallpaper_overlay': self.wallpaper_overlay if self.wallpaper_overlay is not None else 0.0,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else '',
        }


class ChatWallpaperMedia(db.Model):
    """Uploaded custom wallpaper images (validated server-side)."""
    __tablename__ = 'chat_wallpaper_media'

    id = db.Column(db.String(80), primary_key=True)  # CW-XXXXXXXX
    owner = db.Column(db.String(80), nullable=False, index=True)
    path = db.Column(db.String(255), nullable=False)  # relative to UPLOAD_FOLDER
    mimetype = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'owner': self.owner,
            'mimetype': self.mimetype,
            'size': self.size,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else '',
        }

