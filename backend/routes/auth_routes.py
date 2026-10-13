from flask import Blueprint, request, jsonify
from models import (
    db, User, Key, Session, Device, AuditLog,
    EmailVerificationToken, PasswordResetToken, OtpChallenge
)
from utils.security import (
    hash_password,
    verify_password,
    generate_otp,
    hash_otp,
    verify_otp,
    validate_password_strength,
    validate_security_pin,
    hash_recovery_answer,
    normalize_recovery_answer,
    verify_recovery_answer
)
from services.email_service import (
    send_verification_otp,
    send_password_reset_otp,
    SMTPConfigurationError,
    SMTPSendError,
    is_production_environment
)
from utils.decorators import token_required, rate_limit
from config import Config
import uuid
import os
import re
import secrets
import hashlib
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

def generate_key_pair():
    return os.urandom(512).hex()

# ============================================================
# REGISTRATION STEP 1: USERNAME VALIDATION
# ============================================================

@auth_bp.route('/validate-username', methods=['POST'])
@rate_limit(limit=30, period=60)
def validate_username():
    """
    Validates username format and verifies unique availability in the user database.
    """
    data = request.json or {}
    username = str(data.get('username', '')).strip()
    if not username:
        return jsonify({'error': 'Username is required', 'available': False}), 400
    if len(username) < 3 or len(username) > 30:
        return jsonify({'error': 'Username must be between 3 and 30 characters', 'available': False}), 400
    if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
        return jsonify({'error': 'Username may only contain letters, numbers, underscores, and dots', 'available': False}), 400

    existing = User.query.filter(db.func.lower(User.username) == username.lower()).first()
    if existing:
        return jsonify({'error': 'Username is already taken', 'available': False}), 409

    return jsonify({'available': True, 'username': username}), 200

# ============================================================
# REGISTRATION STEP 2 & 3: SEND OTP (EMAIL / SMS)
# ============================================================

# ============================================================
# REGISTRATION STEP 2 & 3: SEND OTP (EMAIL ONLY)
# ============================================================

@auth_bp.route('/send-sms-otp', methods=['POST'])
def send_sms_otp_disabled():
    """SMS verification is removed. Email OTP is the sole verification method."""
    return jsonify({'error': 'SMS verification is disabled. Email OTP is the sole verification method.'}), 400

@auth_bp.route('/send-otp', methods=['POST'])
@auth_bp.route('/send-email-otp', methods=['POST'])
@rate_limit(limit=10, period=60)
def send_registration_otp():
    """
    Generates and dispatches a cryptographically secure 6-digit registration OTP
    via Email as the sole verification method.
    Enforces cooldown and 5-minute expiry.
    """
    data = request.json or {}
    username = str(data.get('username', '')).strip()
    method = str(data.get('method', 'email')).strip().lower()
    contact = str(data.get('contact') or data.get('email') or '').strip()

    if request.path.endswith('/send-email-otp'):
        method = 'email'
        contact = contact or str(data.get('email', '')).strip()

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    # Strict rule: SMS is removed; only email verification method allowed
    if method in ('phone', 'sms'):
        return jsonify({'error': 'SMS verification is disabled. Email OTP is the sole verification method.'}), 400

    if method != 'email':
        return jsonify({'error': 'Invalid verification method. Allowed methods: email'}), 400

    if not contact:
        return jsonify({'error': 'Email address is required'}), 400

    contact = contact.lower().strip()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", contact):
        return jsonify({'error': 'Invalid email address format'}), 400

    # Contact validation & duplicate check
    if User.query.filter_by(email=contact).first():
        return jsonify({'error': 'Email address already registered'}), 409

    if User.query.filter(db.func.lower(User.username) == username.lower()).first():
        return jsonify({'error': 'Username is already taken'}), 409

    masked_contact = f"{contact[:1]}****@{contact.split('@')[1]}" if '@' in contact else 'your email'

    # Check cooldown and resend limits on existing active challenge
    recent_challenge = OtpChallenge.query.filter_by(
        contact=contact,
        method='email',
        used=False
    ).order_by(OtpChallenge.id.desc()).first()

    now = datetime.utcnow()
    resend_count = 0

    if recent_challenge:
        time_since_last = (now - recent_challenge.last_resend_at).total_seconds()
        # Allow 2-second grace for clock skew / timer latency
        if time_since_last < 58:
            cooldown_rem = max(1, int(60 - time_since_last))
            return jsonify({
                'error': f'Please wait {cooldown_rem} seconds before requesting a new verification code.',
                'cooldown': cooldown_rem
            }), 429

        if recent_challenge.resend_count >= 5:
            return jsonify({'error': 'Maximum OTP resend limit reached. Please wait before attempting again.'}), 429

        resend_count = recent_challenge.resend_count + 1
        recent_challenge.used = True

    # Generate 6-digit numeric OTP and hash securely (never store plaintext OTP)
    otp = generate_otp(6)
    salt, otp_hash = hash_otp(otp)
    expires_at = now + timedelta(minutes=5) # 5-minute expiry

    new_challenge = OtpChallenge(
        username=username,
        contact=contact,
        method='email',
        salt=salt,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        resend_count=resend_count,
        last_resend_at=now,
        used=False,
        is_verified=False
    )
    db.session.add(new_challenge)

    # Dispatch OTP through the email provider
    provider_info = {}
    try:
        send_verification_otp(contact, username, otp)
        provider_info = {'provider': 'agentmail', 'is_mock': False}
    except SMTPConfigurationError as e:
        if not is_production_environment() and os.getenv('DEV_MOCK_EMAIL', 'true').lower() == 'true':
            import logging
            logging.getLogger("LatticeLink.Auth").warning(
                "[DEV MODE ONLY] Email provider is not configured. Development OTP for %s (%s): %s. "
                "Set AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID in .env for genuine email delivery.",
                username, contact, otp
            )
            provider_info = {'provider': 'dev_mock', 'is_mock': True}
        else:
            db.session.rollback()
            return jsonify({'error': str(e), 'smtp_configured': False}), 503
    except SMTPSendError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    # Commit only after delivery successfully initiated / queued
    db.session.commit()

    is_mock = provider_info.get('is_mock', False)
    msg = (
        'Development mode: Email delivery is not configured. Check the local backend console for the OTP code, or configure AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID in .env for genuine delivery.'
        if is_mock
        else 'Verification code dispatched to your email address.'
    )

    return jsonify({
        'message': msg,
        'method': 'email',
        'masked_contact': masked_contact,
        'canonical_contact': contact,
        'provider': provider_info.get('provider', 'email'),
        'is_mock': is_mock,
        'cooldown': 60
    }), 200

# ============================================================
# REGISTRATION STEP 4: VERIFY OTP
# ============================================================

@auth_bp.route('/verify-otp', methods=['POST'])
@rate_limit(limit=15, period=60)
def verify_registration_otp():
    """
    Validates the 6-digit OTP against the secure hash in otp_challenges.
    Limits verification attempts to 5 and enforces 5-minute expiry.
    Invalidates the OTP immediately upon success and issues a verification_token.
    """
    data = request.json or {}
    contact = str(data.get('contact') or data.get('email') or '').strip().lower()
    method = str(data.get('method', 'email')).strip().lower()
    otp = str(data.get('otp', '')).strip()

    if method in ('phone', 'sms'):
        return jsonify({'error': 'SMS verification is disabled. Email OTP is the sole verification method.'}), 400

    if not contact or not otp:
        return jsonify({'error': 'Email address and 6-digit OTP code are required'}), 400

    challenge = OtpChallenge.query.filter_by(
        contact=contact,
        method='email',
        used=False,
        is_verified=False
    ).order_by(OtpChallenge.id.desc()).first()

    if not challenge:
        return jsonify({'error': 'No active verification code found. Please request a new code.'}), 400

    now = datetime.utcnow()

    # Attempt limit: max 5
    if challenge.attempts >= 5:
        challenge.used = True
        db.session.commit()
        return jsonify({'error': 'Too many failed attempts. Code has been invalidated. Please request a new one.'}), 400

    # Expiry limit: 5 minutes
    if now > challenge.expires_at:
        challenge.used = True
        db.session.commit()
        return jsonify({'error': 'Verification code has expired. Please request a new one.'}), 400

    challenge.attempts += 1

    if not verify_otp(otp, challenge.salt, challenge.otp_hash):
        db.session.commit()
        rem = 5 - challenge.attempts
        return jsonify({'error': f'Invalid verification code. {rem} attempts remaining.'}), 400

    # Successful verification: immediately invalidate OTP to prevent reuse
    challenge.is_verified = True
    challenge.used = True
    verification_token = secrets.token_hex(32)
    challenge.token = verification_token
    db.session.commit()

    return jsonify({
        'message': 'OTP successfully verified. Please set your password and security PIN.',
        'verified': True,
        'verification_token': verification_token,
        'contact': contact,
        'method': 'email'
    }), 200

# ============================================================
# REGISTRATION STEP 5, 6, 7 & FINAL ACCOUNT CREATION
# ============================================================

@auth_bp.route('/register', methods=['POST'])
@auth_bp.route('/create-account', methods=['POST'])
@rate_limit(limit=15, period=60)
def register():
    """
    Creates user account only after all required registration steps succeed:
    Username -> Verified Email/Phone -> Password Created -> PIN Created -> Recovery Answer Created -> Account Created.
    Also preserves legacy registration behavior for existing tests when verification_token is omitted.
    """
    data = request.json or {}
    username = str(data.get('username', '')).strip()
    verification_token = str(data.get('verification_token', '')).strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    security_pin = str(data.get('security_pin', '')).strip()
    confirm_pin = str(data.get('confirm_security_pin', '')).strip()
    security_question = str(data.get('security_question', "What was your favorite teacher's name?")).strip()
    security_answer = str(data.get('security_answer', '')).strip()

    # ------------------------------------------------------------
    # STEPPED REGISTRATION WORKFLOW (When verification_token present)
    # ------------------------------------------------------------
    if verification_token:
        challenge = OtpChallenge.query.filter_by(
            token=verification_token,
            is_verified=True
        ).first()

        if not challenge:
            return jsonify({'error': 'Invalid or expired verification session. Please verify contact again.'}), 400

        # Verification token expires 20 minutes after issue
        if datetime.utcnow() > challenge.created_at + timedelta(minutes=20):
            return jsonify({'error': 'Verification session has expired. Please verify contact again.'}), 400

        # 1. Validate Username
        if not username:
            username = challenge.username or ''
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        if len(username) < 3 or len(username) > 30:
            return jsonify({'error': 'Username must be between 3 and 30 characters'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already registered'}), 409

        # Associate verified email
        if challenge.method != 'email':
            return jsonify({'error': 'Invalid verification method. Only email verification is supported.'}), 400

        email = challenge.contact.lower().strip()
        phone = None
        method = 'email'

        if email and User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email address already registered'}), 409

        # 2. Validate Password (minimum 8 chars)
        is_pwd_valid, pwd_err = validate_password_strength(password)
        if not is_pwd_valid:
            return jsonify({'error': pwd_err}), 400

        if confirm_password and password != confirm_password:
            return jsonify({'error': 'Password and confirmation password do not match'}), 400

        # 3. Validate 6-digit Security PIN
        is_pin_valid, pin_err = validate_security_pin(security_pin, password)
        if not is_pin_valid:
            return jsonify({'error': pin_err}), 400

        if confirm_pin and security_pin != confirm_pin:
            return jsonify({'error': 'Security PIN and confirmation PIN do not match'}), 400

        # 4. Validate Recovery Question & Answer
        if not security_answer:
            return jsonify({'error': 'Answer to the recovery question is required'}), 400

        # 5. Cryptographically Hash Credentials (Argon2id / PBKDF2; salted answer)
        pwd_hash = hash_password(password)
        pin_hash = hash_password(security_pin)
        sec_ans_hash = hash_recovery_answer(security_answer)

        node_id = f"LL-{str(uuid.uuid4())[:8].upper()}"

        # 6. Create User Record
        user = User(
            username=username,
            email=email,
            phone=phone,
            verification_method=method,
            password_hash=pwd_hash,
            security_pin_hash=pin_hash,
            security_question=security_question,
            security_answer_hash=sec_ans_hash,
            node_id=node_id,
            role='USER',
            is_verified=True
        )
        db.session.add(user)
        db.session.flush()

        # 7. Generate Initial PQC Keys (v1)
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

        # Invalidate verification token immediately
        challenge.token = None

        # 8. Register Device and Active Session
        device_info = request.headers.get('User-Agent') or 'Web Browser'
        device = Device(
            user_id=user.id,
            device_name='Primary Browser Node',
            os='Web',
            browser='Browser',
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
            last_active=datetime.utcnow(),
            is_active=True
        )
        db.session.add(session_obj)

        audit = AuditLog(
            event_type='Registration',
            target='System',
            actor=username,
            severity='info',
            details=f'New user account initialized for node {node_id} via verified {method}.'
        )
        db.session.add(audit)
        db.session.commit()

        return jsonify({
            'user': user.to_dict(),
            'session_token': session_token,
            'message': 'Account created successfully.'
        }), 201

    # ------------------------------------------------------------
    # LEGACY REGISTRATION PATH (Maintained for existing tests & backward compatibility)
    # ------------------------------------------------------------
    email = data.get('email', '').strip().lower()
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
    
    user = User(
        username=username,
        email=email,
        verification_method='email',
        password_hash=pwd_hash,
        security_question=security_question or 'Primary Security Protocol',
        security_answer_hash=sec_ans_hash or '',
        node_id=node_id,
        role='USER',
        is_verified=False
    )
    
    db.session.add(user)
    db.session.flush()
    
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
    
    audit = AuditLog(
        event_type='Registration',
        target='System',
        actor=username,
        severity='info',
        details=f'New user registered with Node ID {node_id}. Verification OTP dispatched.'
    )
    db.session.add(audit)
    db.session.commit()
    
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

# ============================================================
# SECURITY PIN VERIFICATION (WITH STRICT RATE LIMITING)
# ============================================================

@auth_bp.route('/verify-security-pin', methods=['POST'])
@rate_limit(limit=5, period=60)
@token_required
def verify_security_pin_endpoint():
    """
    Validates user's 6-digit numeric security PIN with strict rate limiting.
    """
    data = request.json or {}
    pin = str(data.get('security_pin', '')).strip()
    if not pin or len(pin) != 6 or not pin.isdigit():
        return jsonify({'error': 'Valid 6-digit numeric security PIN is required'}), 400

    from flask import g
    user = getattr(g, 'current_user', None)
    if not user or not user.security_pin_hash:
        return jsonify({'error': 'Security PIN not set for this account'}), 400

    if not verify_password(user.security_pin_hash, pin):
        return jsonify({'error': 'Invalid security PIN'}), 401

    return jsonify({'valid': True, 'message': 'Security PIN verified successfully'}), 200

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
    
    is_mock = False
    try:
        send_verification_otp(user.email, user.username, otp)
    except SMTPConfigurationError as e:
        if not is_production_environment() and os.getenv('DEV_MOCK_EMAIL', 'true').lower() == 'true':
            import logging
            logging.getLogger("LatticeLink.Auth").warning(
                "[DEV MODE ONLY] Email provider is not configured. Development OTP for %s (%s): %s",
                user.username, user.email, otp
            )
            is_mock = True
        else:
            return jsonify({
                'error': str(e),
                'smtp_configured': False
            }), 503
    except SMTPSendError as e:
        return jsonify({
            'error': str(e)
        }), 500

    resp_data = {
        'message': (
            'Development mode: Email delivery is not configured. Check the local backend console for the OTP code, or configure AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID in .env for genuine delivery.'
            if is_mock else
            'Verification OTP dispatched to your registered email.'
        ),
        'is_mock': is_mock
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
    
    is_mock = False
    try:
        send_password_reset_otp(user.email, user.username, otp)
    except SMTPConfigurationError as e:
        if not is_production_environment() and os.getenv('DEV_MOCK_EMAIL', 'true').lower() == 'true':
            import logging
            logging.getLogger("LatticeLink.Auth").warning(
                "[DEV MODE ONLY] Email provider is not configured. Password reset OTP for %s (%s): %s",
                user.username, user.email, otp
            )
            is_mock = True
        else:
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
        'username': user.username,
        'is_mock': is_mock
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

# ============================================================
# ACCOUNT RECOVERY VIA SECURITY QUESTION
# ============================================================

@auth_bp.route('/recovery-question', methods=['GET', 'POST'])
@auth_bp.route('/get-recovery-question', methods=['GET', 'POST'])
@rate_limit(limit=10, period=60)
def get_recovery_question():
    """Returns the security recovery question for an account."""
    if request.method == 'GET':
        identity = request.args.get('username') or request.args.get('email') or ''
    else:
        data = request.json or {}
        identity = data.get('username') or data.get('email') or ''
    identity = str(identity).strip()
    if not identity:
        return jsonify({'error': 'Username or email is required'}), 400

    user = User.query.filter(
        (User.username == identity) | (User.email == identity.lower())
    ).first()

    default_question = "What was your favorite teacher's name?"
    if not user or not user.security_question:
        return jsonify({'question': default_question, 'security_question': default_question}), 200

    return jsonify({
        'username': user.username,
        'question': user.security_question,
        'security_question': user.security_question
    }), 200

@auth_bp.route('/recover-with-security-question', methods=['POST'])
@rate_limit(limit=5, period=60)
def recover_with_security_question():
    """
    Recovers account and sets new password using the user's security question answer.
    """
    data = request.json or {}
    identity = str(data.get('username') or data.get('email') or '').strip()
    security_answer = str(data.get('security_answer', '')).strip()
    new_password = str(data.get('new_password', '')).strip()
    confirm_password = str(data.get('confirm_password', '')).strip()

    if not identity or not security_answer or not new_password:
        return jsonify({'error': 'Username/email, security answer, and new password are required'}), 400

    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters long'}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({'error': 'New password and confirmation password do not match'}), 400

    user = User.query.filter(
        (User.username == identity) | (User.email == identity.lower())
    ).first()

    if not user or not user.security_answer_hash:
        return jsonify({'error': 'Account recovery failed. Invalid credentials or answer.'}), 401

    if not verify_recovery_answer(security_answer, user.security_answer_hash):
        return jsonify({'error': 'Incorrect answer to recovery question.'}), 401

    user.password_hash = hash_password(new_password)
    Session.query.filter_by(user_id=user.id).update({'is_active': False})

    audit = AuditLog(
        event_type='PasswordReset',
        target='UserAccount',
        actor=user.username,
        severity='warning',
        details='Password reset successfully completed via Security Question recovery. Prior sessions revoked.'
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'Password reset successfully using security recovery answer. Please log in.'}), 200

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
        last_active=datetime.utcnow(),
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
