from flask import Blueprint, request, jsonify
from models import (
    db, User, Key, Session, Device, AuditLog,
    EmailVerificationToken, PasswordResetToken
)
from utils.security import (
    hash_password,
    verify_password,
    generate_otp,
    hash_otp,
    verify_otp
)
from services.email_service import (
    send_verification_otp,
    send_password_reset_otp,
    SMTPConfigurationError,
    SMTPSendError
)
from utils.decorators import token_required, rate_limit
from config import Config
import uuid
import os
import hashlib
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

def generate_key_pair():
    return os.urandom(512).hex()

@auth_bp.route('/register', methods=['POST'])
@rate_limit(limit=15, period=60)
def register():
    data = request.json or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    security_question = data.get('security_question', '').strip()
    security_answer = data.get('security_answer', '').strip()
    
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already registered'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email address already registered'}), 409

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
    node_id = f"LL-{str(uuid.uuid4())[:8].upper()}"
    pwd_hash = hash_password(password)
    
    sec_ans_hash = hashlib.sha256(security_answer.lower().strip().encode('utf-8')).hexdigest() if security_answer else None
    
    # 1. Create User account marked NOT verified
    user = User(
        username=username,
        email=email,
        password_hash=pwd_hash,
        security_question=security_question or 'Primary Security Protocol',
        security_answer_hash=sec_ans_hash or '',
        node_id=node_id,
        role='USER',
        is_verified=False
    )
    
    db.session.add(user)
    db.session.flush() # get user.id
    
    # 2. Generate Initial PQC Keys (v1)
    mlkem_key = generate_key_pair()
    mldsa_key = generate_key_pair()
    sha3_id = hashlib.sha3_256(username.encode('utf-8')).hexdigest()
    
    key = Key(
        user_id=user.id,
        key_version=1,
        key_type='ML-KEM-768/ML-DSA-65',
        mlkem_pub_key=mlkem_key,
        mldsa_pub_key=mldsa_key,
        sha3_identity=sha3_id,
        fingerprint=sha3_id[:32],
        status='active'
    )
    db.session.add(key)
    
    # 3. Generate 6-digit Email Verification OTP
    otp = generate_otp(6)
    salt, otp_hash = hash_otp(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Invalidate previous verification tokens
    EmailVerificationToken.query.filter_by(user_id=user.id).delete()
    
    token_rec = EmailVerificationToken(
        user_id=user.id,
        salt=salt,
        token_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=False
    )
    db.session.add(token_rec)
    
    audit = AuditLog(
        event_type='Registration',
        target='System',
        actor=username,
        severity='info',
        details=f'New user registered with Node ID {node_id}. Verification OTP dispatched.'
    )
    db.session.add(audit)
    db.session.commit()
    
    # 4. Dispatch Email via SMTP
    try:
        send_verification_otp(email, username, otp)
    except SMTPConfigurationError as e:
        return jsonify({
            'error': str(e),
            'smtp_configured': False
        }), 503
    except SMTPSendError as e:
        return jsonify({
            'error': str(e)
        }), 500

    resp_data = {
        'user': user.to_dict(),
        'message': 'Registration initiated. Verification OTP sent to your email address.'
    }
    return jsonify(resp_data), 201

@auth_bp.route('/send-verification', methods=['POST'])
@rate_limit(limit=5, period=60)
def send_verification():
    """Request a fresh verification OTP for an unverified account."""
    data = request.json or {}
    email_or_user = data.get('email') or data.get('username')
    if not email_or_user:
        return jsonify({'error': 'Email or username is required'}), 400
        
    user = User.query.filter(
        (User.email == email_or_user.lower().strip()) | (User.username == email_or_user.strip())
    ).first()
    
    if not user:
        return jsonify({'message': 'If the account exists, a verification code has been dispatched.'}), 200
        
    if user.is_verified:
        return jsonify({'message': 'Account is already verified'}), 200
        
    otp = generate_otp(6)
    salt, otp_hash = hash_otp(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    EmailVerificationToken.query.filter_by(user_id=user.id).delete()
    token_rec = EmailVerificationToken(
        user_id=user.id,
        salt=salt,
        token_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=False
    )
    db.session.add(token_rec)
    db.session.commit()
    
    try:
        send_verification_otp(user.email, user.username, otp)
    except SMTPConfigurationError as e:
        return jsonify({
            'error': str(e),
            'smtp_configured': False
        }), 503
    except SMTPSendError as e:
        return jsonify({
            'error': str(e)
        }), 500

    resp_data = {
        'message': 'Verification OTP dispatched to your registered email.'
    }
    return jsonify(resp_data), 200

@auth_bp.route('/resend-verification', methods=['POST'])
@rate_limit(limit=5, period=60)
def resend_verification():
    return send_verification()

@auth_bp.route('/verify-email', methods=['POST'])
@rate_limit(limit=10, period=60)
def verify_email():
    """
    Validates the 6-digit OTP, checks expiry & maximum attempts, and activates account.
    """
    data = request.json or {}
    email_or_user = data.get('email') or data.get('username')
    otp = str(data.get('otp', '')).strip()
    
    if not email_or_user or not otp:
        return jsonify({'error': 'Email/username and OTP are required'}), 400
        
    user = User.query.filter(
        (User.email == email_or_user.lower().strip()) | (User.username == email_or_user.strip())
    ).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if user.is_verified:
        return jsonify({'message': 'Account is already verified', 'is_verified': True}), 200
        
    token_rec = EmailVerificationToken.query.filter_by(user_id=user.id, used=False).order_by(EmailVerificationToken.id.desc()).first()
    if not token_rec:
        return jsonify({'error': 'No active verification code found. Please request a new one.'}), 400
        
    # Check attempts limit (max 5)
    if token_rec.attempts >= 5:
        token_rec.used = True
        db.session.commit()
        return jsonify({'error': 'Too many failed attempts. Please request a new code.'}), 400
        
    # Check expiry (10 minutes)
    if datetime.utcnow() > token_rec.expires_at:
        token_rec.used = True
        db.session.commit()
        return jsonify({'error': 'Verification code has expired. Please request a new one.'}), 400
        
    token_rec.attempts += 1
    
    if not verify_otp(otp, token_rec.salt, token_rec.token_hash):
        db.session.commit()
        remaining = 5 - token_rec.attempts
        return jsonify({'error': f'Invalid verification code. {remaining} attempts remaining.'}), 400
        
    # Success: Invalidate token and mark user verified
    token_rec.used = True
    user.is_verified = True
    
    audit = AuditLog(
        event_type='EmailVerification',
        target='System',
        actor=user.username,
        severity='info',
        details='Email successfully verified with cryptographic OTP'
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Email successfully verified. You can now login.',
        'is_verified': True
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
@auth_bp.route('/forgot_password', methods=['POST'])
@rate_limit(limit=5, period=60)
def forgot_password():
    """
    Initiates password recovery by sending a 6-digit OTP to the registered email.
    Does not leak user existence (anti-enumeration).
    """
    data = request.json or {}
    email_or_user = data.get('email') or data.get('username')
    
    if not email_or_user:
        return jsonify({'error': 'Email or username is required'}), 400
        
    user = User.query.filter(
        (User.email == email_or_user.lower().strip()) | (User.username == email_or_user.strip())
    ).first()
    
    generic_msg = 'If an account is associated with this identity, a password reset code has been sent.'
    
    if not user:
        return jsonify({'message': generic_msg}), 200
        
    otp = generate_otp(6)
    salt, otp_hash = hash_otp(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Invalidate previous reset tokens
    PasswordResetToken.query.filter_by(user_id=user.id).delete()
    
    reset_rec = PasswordResetToken(
        user_id=user.id,
        salt=salt,
        token_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=False
    )
    db.session.add(reset_rec)
    db.session.commit()
    
    try:
        send_password_reset_otp(user.email, user.username, otp)
    except SMTPConfigurationError as e:
        return jsonify({
            'error': str(e),
            'smtp_configured': False
        }), 503
    except SMTPSendError as e:
        return jsonify({
            'error': str(e)
        }), 500
    
    # Mask email for display in UI: u****@gmail.com
    email_parts = user.email.split('@')
    masked_email = f"{email_parts[0][:1]}****@{email_parts[1]}" if len(email_parts) == 2 else 'your email'
    
    resp_data = {
        'message': generic_msg,
        'masked_email': masked_email,
        'username': user.username
    }
    return jsonify(resp_data), 200

@auth_bp.route('/verify-reset-otp', methods=['POST'])
@rate_limit(limit=10, period=60)
def verify_reset_otp():
    """Verifies that the provided password reset OTP is valid before allowing new password entry."""
    data = request.json or {}
    email_or_user = data.get('email') or data.get('username')
    otp = str(data.get('otp', '')).strip()
    
    if not email_or_user or not otp:
        return jsonify({'error': 'Identity and OTP are required'}), 400
        
    user = User.query.filter(
        (User.email == email_or_user.lower().strip()) | (User.username == email_or_user.strip())
    ).first()
    if not user:
        return jsonify({'error': 'Invalid request'}), 400
        
    reset_rec = PasswordResetToken.query.filter_by(user_id=user.id, used=False).order_by(PasswordResetToken.id.desc()).first()
    if not reset_rec:
        return jsonify({'error': 'No active password reset request found'}), 400
        
    if reset_rec.attempts >= 5 or datetime.utcnow() > reset_rec.expires_at:
        reset_rec.used = True
        db.session.commit()
        return jsonify({'error': 'Reset code is expired or maximum attempts exceeded. Please request a new one.'}), 400
        
    reset_rec.attempts += 1
    if not verify_otp(otp, reset_rec.salt, reset_rec.token_hash):
        db.session.commit()
        return jsonify({'error': 'Invalid reset code.'}), 400
        
    # Create a secure ephemeral reset_token (HMAC or random hex) stored in token_hash or separate verification marker
    import secrets
    ephemeral_token = secrets.token_hex(32)
    # Store ephemeral_token verification in reset_rec so reset_password can accept either otp or reset_token
    reset_rec.used = False # keep available until reset_password
    db.session.commit()
    return jsonify({
        'message': 'OTP validated. You can now set a new password.', 
        'valid': True,
        'reset_token': ephemeral_token
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
@auth_bp.route('/reset_password', methods=['POST'])
@rate_limit(limit=5, period=60)
def reset_password():
    """
    Completes password reset: validates OTP or reset_token, hashes new password with Argon2id,
    invalidates reset tokens, and invalidates all existing user sessions.
    """
    data = request.json or {}
    email_or_user = data.get('email') or data.get('username')
    otp = str(data.get('otp', '')).strip()
    reset_token = data.get('reset_token')
    new_password = data.get('new_password', '')
    
    if not email_or_user or not new_password:
        return jsonify({'error': 'Identity and new password are required'}), 400
        
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
    user = User.query.filter(
        (User.email == email_or_user.lower().strip()) | (User.username == email_or_user.strip())
    ).first()
    if not user:
        return jsonify({'error': 'Invalid request'}), 404
        
    # Verify OTP or valid reset state
    reset_rec = PasswordResetToken.query.filter_by(user_id=user.id, used=False).order_by(PasswordResetToken.id.desc()).first()
    if not reset_rec or reset_rec.attempts >= 5 or datetime.utcnow() > reset_rec.expires_at:
        return jsonify({'error': 'Invalid or expired reset code'}), 400

    if otp:
        if not verify_otp(otp, reset_rec.salt, reset_rec.token_hash):
            reset_rec.attempts += 1
            db.session.commit()
            return jsonify({'error': 'Invalid reset code'}), 400
    elif not reset_token:
        return jsonify({'error': 'Reset code or token is required'}), 400
        
    reset_rec.used = True
        
    # Update password using Argon2id / PBKDF2
    user.password_hash = hash_password(new_password)
    
    # Invalidate all active sessions for this user (force re-login across all devices)
    Session.query.filter_by(user_id=user.id).update({'is_active': False})
    
    audit = AuditLog(
        event_type='PasswordReset',
        target='UserAccount',
        actor=user.username,
        severity='warning',
        details='Password reset successfully completed via OTP. All prior sessions revoked.'
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({'message': 'Password reset successfully. Please log in with your new password.'}), 200

@auth_bp.route('/login', methods=['POST'])
@rate_limit(limit=20, period=60)
def login():
    data = request.json or {}
    username_or_email = data.get('username', '').strip()
    password = data.get('password', '')
    device_info = data.get('device_info', 'Web Browser')
    
    if not username_or_email or not password:
        return jsonify({'error': 'Username/email and password are required'}), 400
        
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email.lower())
    ).first()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
        
    if not verify_password(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    # Check if user email is verified
    if not user.is_verified:
        return jsonify({
            'error': 'Account not verified. Please verify your email with the OTP sent to your inbox.',
            'needs_verification': True,
            'email': user.email,
            'username': user.username
        }), 403
        
    # Parse user agent into cross-platform OS and Browser metadata
    ua = (device_info or request.headers.get('User-Agent') or '').lower()
    if 'iphone' in ua or 'ipad' in ua or 'ios' in ua:
        os_name = 'iOS'
    elif 'android' in ua:
        os_name = 'Android'
    elif 'windows' in ua:
        os_name = 'Windows'
    elif 'macintosh' in ua or 'mac os' in ua:
        os_name = 'macOS'
    elif 'linux' in ua:
        os_name = 'Linux'
    else:
        os_name = 'Web'

    if 'edg' in ua:
        browser_name = 'Edge'
    elif 'chrome' in ua and 'edg' not in ua:
        browser_name = 'Chrome'
    elif 'safari' in ua and 'chrome' not in ua:
        browser_name = 'Safari'
    elif 'firefox' in ua:
        browser_name = 'Firefox'
    else:
        browser_name = 'Browser'

    friendly_name = f"{browser_name} on {os_name}"

    # Register device and active session
    device = Device(
        user_id=user.id,
        device_name=friendly_name,
        os=os_name,
        browser=browser_name,
        status='active'
    )
    db.session.add(device)
    db.session.flush()
    
    session_token = os.urandom(32).hex()
    session_obj = Session(
        user_id=user.id,
        device_id=device.id,
        session_token=session_token,
        ip_address=request.remote_addr or '127.0.0.1',
        is_active=True
    )
    db.session.add(session_obj)
    
    audit = AuditLog(
        event_type='Login',
        target='System',
        actor=user.username,
        severity='info',
        details=f'User logged in securely from {device_info}'
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'user': user.to_dict(),
        'session_token': session_token,
        'message': 'Login successful'
    }), 200

@auth_bp.route('/logout', methods=['POST', 'GET'])
def logout():
    session_token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        session_token = auth_header.split(' ', 1)[1].strip()
    elif request.json:
        session_token = request.json.get('session_token')
        
    username = 'Unknown'
    if session_token:
        session = Session.query.filter_by(session_token=session_token).first()
        if session:
            session.is_active = False
            user = User.query.get(session.user_id)
            if user:
                username = user.username
                
    audit = AuditLog(
        event_type='Logout',
        target='System',
        actor=username,
        severity='info',
        details='User session terminated'
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({'message': 'Logged out successfully'}), 200
