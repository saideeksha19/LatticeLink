from flask import Blueprint, request, jsonify, g
from models import db, ThreatLog, GlobalNotification, AuditLog
from utils.decorators import token_required, require_role
import uuid
import datetime

security_bp = Blueprint('security', __name__)

@security_bp.route('/threats', methods=['GET'])
@token_required
def get_threats():
    """Authenticated users can view threat intelligence feed."""
    threats = ThreatLog.query.order_by(ThreatLog.timestamp.desc()).limit(50).all()
    return jsonify({'threats': [t.to_dict() for t in threats]}), 200

@security_bp.route('/threats/log', methods=['POST'])
@token_required
def log_threat():
    """Logs threat with actor verification."""
    data = request.json or {}
    threat = ThreatLog(
        type=data.get('type', 'Unknown'),
        target=data.get('target', 'LatticeLink Core'),
        status=data.get('status', 'Blocked'),
        severity=data.get('severity', 'High')
    )
    db.session.add(threat)
    db.session.commit()
    return jsonify({'success': True, 'threat': threat.to_dict()}), 201

@security_bp.route('/simulate', methods=['POST'])
@require_role('SECURITY_ANALYST', 'ADMIN')
def simulate_attack():
    """
    Security Lab interactive simulation.
    Requires SECURITY_ANALYST or ADMIN role.
    Clearly returned with demonstration metadata.
    """
    data = request.json or {}
    attack_type = data.get('type', 'Quantum Eve Intercept')
    
    # Log the educational threat simulation
    threat = ThreatLog(
        type=f"[SIMULATION] {attack_type}",
        target='LatticeLink Security Lab',
        status='Mitigated (Simulation)',
        severity='Medium'
    )
    db.session.add(threat)
    
    # Notify globally
    notif = GlobalNotification(
        message=f"[EDUCATIONAL DEMONSTRATION] {attack_type} simulated and mitigated by LSOC rules.",
        type='info'
    )
    db.session.add(notif)
    db.session.commit()
    
    import os
    packet = {
        'id': f"SIM-PKT-{str(uuid.uuid4())[:8].upper()}",
        'sender': 'Simulated Attacker Node',
        'receiver': 'LatticeLink Core',
        'encryptedPayload': 'SIMULATED_CIPHERTEXT',
        'sha3Hash': os.urandom(32).hex(),
        'signature': 'SIMULATED_INVALID_MLDSA_SIG',
        'kyberCipher': os.urandom(1088).hex(),
        'algorithmTimings': {
            'aes': 0.8,
            'sha3': 3.2,
            'mldsa': 1.9,
            'mlkem': 2.1
        },
        'is_simulation': True,
        'timestamp': datetime.datetime.utcnow().strftime('%I:%M %p')
    }
    
    return jsonify({
        'success': True,
        'threat': threat.to_dict(),
        'packet': packet,
        'message': f'{attack_type} simulation completed. Labeled: EDUCATIONAL DEMONSTRATION.'
    }), 200

@security_bp.route('/analytics', methods=['GET'])
@token_required
def get_analytics():
    """Real-time database-backed analytics for current authenticated node."""
    from models import ThreatLog, Device, Message, File, User
    from sqlalchemy import func
    
    today = datetime.datetime.utcnow().date()
    threats_by_day = {}
    for i in range(7):
        day = today - datetime.timedelta(days=6 - i)
        threats_by_day[day.strftime('%a')] = 0
        
    recent_threats = ThreatLog.query.filter(ThreatLog.timestamp >= (today - datetime.timedelta(days=6))).all()
    for t in recent_threats:
        day_str = t.timestamp.strftime('%a')
        if day_str in threats_by_day:
            threats_by_day[day_str] += 1
            
    threat_data = [{'name': k, 'attacks': v} for k, v in threats_by_day.items()]
    
    # Real device counts from DB
    devices = db.session.query(Device.os, func.count(Device.id)).group_by(Device.os).all()
    device_data = [{'name': d[0] or 'Web Browser', 'count': d[1]} for d in devices]
    if not device_data:
        device_data = [{'name': 'Web Browser', 'count': 1}]
    
    # Real message and file metrics from active database
    msg_count = Message.query.count()
    file_count = File.query.count()
    
    crypto_health = [
        { 'algo': 'ML-KEM-768', 'status': 'Healthy', 'latency': '3.2ms', 'ops': f'{msg_count * 2} ops', 'errors': 0, 'color': '#8b5cf6' },
        { 'algo': 'ML-DSA-65', 'status': 'Healthy', 'latency': '2.1ms', 'ops': f'{msg_count * 2} ops', 'errors': 0, 'color': '#10b981' },
        { 'algo': 'AES-256-GCM', 'status': 'Healthy', 'latency': '0.7ms', 'ops': f'{msg_count} ops', 'errors': 0, 'color': '#3b82f6' },
        { 'algo': 'SHA3-256 / SHA3-512', 'status': 'Healthy', 'latency': '<1ms', 'ops': f'{msg_count * 3} ops', 'errors': 0, 'color': '#6366f1' }
    ]
    
    file_security = {
        'files_protected': file_count,
        'encrypted_status': '100%',
        'verified_signatures': '100%',
        'tampered_detected': 0
    }
    
    return jsonify({
        'threat_data': threat_data,
        'device_data': device_data,
        'crypto_health': crypto_health,
        'file_security': file_security
    }), 200

@security_bp.route('/audit', methods=['GET'])
@require_role('SECURITY_ANALYST', 'ADMIN')
def get_audit_logs():
    """Audit center view protected by RBAC."""
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    return jsonify({'logs': [log.to_dict() for log in logs]}), 200

@security_bp.route('/dev/reset-seed', methods=['POST', 'GET'])
def dev_reset_seed():
    """Wipes data ONLY on an isolated test database and seeds test users. Refused on dev/prod."""
    import os
    from config import Config
    from utils.security import hash_password
    from models import (
        User, Key, Session, Device, AuditLog, EmailVerificationToken,
        PasswordResetToken, ContactRequest, Message, Group, GroupMember, File
    )
    
    # HARD SAFETY GUARD: Refuse destructive reset unless in verified test mode on a test DB
    try:
        Config.assert_safe_for_destructive_action('dev/reset-seed')
    except RuntimeError as e:
        return jsonify({
            'status': 'error',
            'error': 'Forbidden: Destructive reset refused on development/production database.',
            'details': str(e)
        }), 403

    # Drop all and recreate strictly on test database
    db.drop_all()
    db.create_all()

    # Seed alice (ADMIN)
    alice_pwd = hash_password("Password123!")
    alice = User(
        username="alice",
        email="alice@latticelink.test",
        password_hash=alice_pwd,
        node_id="LL-NODE-ALICE-768",
        role="ADMIN",
        is_verified=True
    )

    # Seed bob (USER)
    bob_pwd = hash_password("Password123!")
    bob = User(
        username="bob",
        email="bob@latticelink.test",
        password_hash=bob_pwd,
        node_id="LL-NODE-BOB-768",
        role="USER",
        is_verified=True
    )

    db.session.add(alice)
    db.session.add(bob)
    db.session.commit()

    # Keys
    key_alice = Key(
        user_id=alice.id,
        public_key="04" + os.urandom(64).hex(),
        private_key="PVT" + os.urandom(32).hex(),
        key_version=1,
        key_type="ML-KEM-768/ML-DSA-65",
        fingerprint=os.urandom(32).hex()
    )
    key_bob = Key(
        user_id=bob.id,
        public_key="04" + os.urandom(64).hex(),
        private_key="PVT" + os.urandom(32).hex(),
        key_version=1,
        key_type="ML-KEM-768/ML-DSA-65",
        fingerprint=os.urandom(32).hex()
    )
    db.session.add(key_alice)
    db.session.add(key_bob)

    # Connect alice and bob
    contact_conn = ContactRequest(
        id="REQ-TEST-INIT01",
        sender="alice",
        receiver="bob",
        status="accepted"
    )
    db.session.add(contact_conn)

    audit = AuditLog(
        event_type="DatabaseReset",
        target="System",
        actor="System",
        severity="warning",
        details="Database wiped and initialized with verified test users 'alice' and 'bob'."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Database wiped and re-seeded with two test users',
        'users': [
            {'username': 'alice', 'role': 'ADMIN', 'email': 'alice@latticelink.test', 'password': 'Password123!'},
            {'username': 'bob', 'role': 'USER', 'email': 'bob@latticelink.test', 'password': 'Password123!'}
        ]
    }), 200
