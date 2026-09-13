import hashlib
import secrets
import hmac
from datetime import datetime, timedelta
import logging

logger = logging.getLogger("LatticeLink.Security")

# Try to import argon2-cffi if installed, otherwise fallback to cryptographically secure PBKDF2-HMAC-SHA256 (100,000 iterations)
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    _argon2_ph = PasswordHasher(
        time_cost=2,
        memory_cost=65536,
        parallelism=2,
        hash_len=32,
        salt_len=16
    )
    HAS_ARGON2 = True
    logger.info("Argon2id password hashing engine initialized.")
except ImportError:
    HAS_ARGON2 = False
    _argon2_ph = None
    logger.info("argon2-cffi not installed; using PBKDF2-HMAC-SHA256 (100,000 rounds) engine.")

def hash_password(password: str) -> str:
    """Hash password using Argon2id if available, otherwise PBKDF2-HMAC-SHA256 with unique random salt."""
    if not password:
        raise ValueError("Password cannot be empty")
    
    if HAS_ARGON2:
        return _argon2_ph.hash(password)
    
    salt = secrets.token_hex(16)
    iterations = 100000
    derived = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    ).hex()
    return f"pbkdf2_sha256${iterations}${salt}${derived}"

def verify_password(stored_hash: str, candidate_password: str) -> bool:
    """Verify password against stored hash, supporting Argon2id, PBKDF2, and legacy formats."""
    if not stored_hash or not candidate_password:
        return False

    try:
        # Check Argon2id hash format ($argon2id$ or $argon2i$)
        if stored_hash.startswith("$argon2"):
            if HAS_ARGON2:
                try:
                    return _argon2_ph.verify(stored_hash, candidate_password)
                except VerifyMismatchError:
                    return False
            return False

        # PBKDF2 format: pbkdf2_sha256$<iter>$<salt>$<hash>
        if stored_hash.startswith("pbkdf2_sha256$"):
            parts = stored_hash.split("$")
            if len(parts) != 4:
                return False
            _, iterations_str, salt, target_hash = parts
            iterations = int(iterations_str)
            computed = hashlib.pbkdf2_hmac(
                'sha256',
                candidate_password.encode('utf-8'),
                salt.encode('utf-8'),
                iterations
            ).hex()
            return hmac.compare_digest(computed, target_hash)
            
        # Legacy salt:hash format from whatsapp (2)
        elif ":" in stored_hash:
            salt, target_hash = stored_hash.split(":", 1)
            computed = hashlib.pbkdf2_hmac(
                'sha256',
                candidate_password.encode('utf-8'),
                salt.encode('utf-8'),
                100000
            ).hex()
            return hmac.compare_digest(computed, target_hash)
            
        else:
            # Legacy raw SHA256 (unsalted) compatibility check
            legacy_hash = hashlib.sha256(candidate_password.encode('utf-8')).hexdigest()
            return hmac.compare_digest(legacy_hash, stored_hash)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

# --- Cryptographic OTP Helpers (6 Digits) ---

def generate_otp(length: int = 6) -> str:
    """Generate cryptographically secure numeric OTP."""
    # 6 digits between 100000 and 999999
    return str(secrets.randbelow(900000) + 100000)

def hash_otp(otp: str, salt: str = None) -> tuple[str, str]:
    """
    Returns (salt, otp_hash).
    Uses HMAC-SHA256 with random salt to securely store OTPs.
    """
    if not salt:
        salt = secrets.token_hex(16)
    computed_hash = hmac.new(salt.encode('utf-8'), otp.encode('utf-8'), hashlib.sha256).hexdigest()
    return salt, computed_hash

def verify_otp(candidate_otp: str, stored_salt: str, stored_hash: str) -> bool:
    """Validates candidate OTP against stored hash with timing attack prevention."""
    if not candidate_otp or not stored_salt or not stored_hash:
        return False
    computed_hash = hmac.new(stored_salt.encode('utf-8'), candidate_otp.strip().encode('utf-8'), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_hash, stored_hash)
