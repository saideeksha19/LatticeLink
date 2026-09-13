import time
import threading
from functools import wraps
from flask import request, jsonify, g, current_app
from models import Session, User, db

# Thread-safe in-memory rate limiter registry
RATE_LIMIT_DATA = {}
rate_limit_lock = threading.Lock()

def get_auth_token():
    """Extract Bearer token or session_token from request headers, query args, or JSON body."""
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return auth.split(' ', 1)[1].strip()
    
    # Check custom header
    if request.headers.get('X-Session-Token'):
        return request.headers.get('X-Session-Token').strip()
        
    # Check query param
    if request.args.get('token'):
        return request.args.get('token').strip()
        
    # Check JSON body if available
    if request.is_json and request.json:
        return request.json.get('session_token')
        
    return None

def token_required(f):
    """
    Validates the active session token against the SQLite database.
    Injects current_user into flask.g.current_user.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_auth_token()
        if not token:
            return jsonify({'error': 'Unauthorized: Missing session token'}), 401
            
        session_record = Session.query.filter_by(session_token=token, is_active=True).first()
        if not session_record:
            return jsonify({'error': 'Unauthorized: Invalid or expired session token'}), 401
            
        user = User.query.get(session_record.user_id)
        if not user:
            return jsonify({'error': 'Unauthorized: User account not found'}), 401
            
        g.current_user = user
        g.current_session = session_record
        return f(*args, **kwargs)
    return decorated

def require_role(*roles):
    """
    Requires the authenticated user to hold one of the specified roles (e.g. 'ADMIN', 'SECURITY_ANALYST').
    Must be used with or after @token_required.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_auth_token()
            if not token:
                return jsonify({'error': 'Unauthorized: Authentication required'}), 401
                
            session_record = Session.query.filter_by(session_token=token, is_active=True).first()
            if not session_record:
                return jsonify({'error': 'Unauthorized: Invalid session'}), 401
                
            user = User.query.get(session_record.user_id)
            if not user:
                return jsonify({'error': 'Unauthorized: User not found'}), 401
                
            g.current_user = user
            g.current_session = session_record
            
            user_role = (user.role or 'User').upper()
            allowed_roles = [r.upper() for r in roles]
            
            if user_role not in allowed_roles:
                return jsonify({
                    'error': f'Forbidden: Insufficient privileges. Required: {", ".join(roles)}'
                }), 403
                
            return f(*args, **kwargs)
        return decorated
    return decorator

def rate_limit(limit=100, period=60):
    """Sliding-window IP rate limiter decorator."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                if current_app and current_app.config.get('TESTING'):
                    return f(*args, **kwargs)
            except Exception:
                pass
            ip = request.remote_addr or '127.0.0.1'
            now = time.time()
            
            with rate_limit_lock:
                if ip not in RATE_LIMIT_DATA:
                    RATE_LIMIT_DATA[ip] = []
                RATE_LIMIT_DATA[ip] = [t for t in RATE_LIMIT_DATA[ip] if now - t < period]
                
                if len(RATE_LIMIT_DATA[ip]) >= limit:
                    return jsonify({'error': 'Too many requests. Please slow down.'}), 429
                    
                RATE_LIMIT_DATA[ip].append(now)
                
            return f(*args, **kwargs)
        return decorated
    return decorator
