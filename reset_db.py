import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from config import Config

if '--test-only' not in sys.argv or '--confirm-test-wipe' not in sys.argv:
    print("CRITICAL SAFETY GUARD: Destructive reset script disabled on active database.", file=sys.stderr)
    print("To reset the isolated test database, you must explicitly run:", file=sys.stderr)
    print("  python reset_db.py --test-only --confirm-test-wipe", file=sys.stderr)
    sys.exit(1)

# Enforce test mode and route to isolated test database BEFORE importing app
os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_uri = f"sqlite:///{Config.TEST_DB_PATH.replace(os.sep, '/')}"
os.environ['DATABASE_URL'] = test_db_uri

try:
    Config.assert_safe_for_destructive_action("reset_db.py", uri=test_db_uri)
except RuntimeError as e:
    print(f"SAFETY ABORT: {e}", file=sys.stderr)
    sys.exit(1)

from app import app
from models import db, User, Key, Session, Device, AuditLog, EmailVerificationToken, PasswordResetToken, ContactRequest, Message, Group, GroupMember, File
from utils.security import hash_password

def reset_and_seed():
    with app.app_context():
        print(f"Wiping isolated test database tables ({Config.TEST_DB_PATH})...")
        # Drop all tables to clean everything out
        db.drop_all()
        # Re-create all tables with proper current schema
        db.create_all()
        print("Database schema recreated successfully.")

        # Seed test user 1: alice
        alice_pwd = hash_password("Password123!")
        alice = User(
            username="alice",
            email="alice@latticelink.test",
            password_hash=alice_pwd,
            node_id="LL-NODE-ALICE-768",
            role="ADMIN",
            is_verified=True
        )

        # Seed test user 2: bob
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

        # Generate cryptographic keys for both test users
        key_alice = Key(
            user_id=alice.id,
            mlkem_pub_key="04" + os.urandom(64).hex(),
            mldsa_pub_key="04" + os.urandom(64).hex(),
            sha3_identity=os.urandom(32).hex(),
            key_version=1,
            key_type="ML-KEM-768/ML-DSA-65",
            fingerprint=os.urandom(32).hex()
        )
        key_bob = Key(
            user_id=bob.id,
            mlkem_pub_key="04" + os.urandom(64).hex(),
            mldsa_pub_key="04" + os.urandom(64).hex(),
            sha3_identity=os.urandom(32).hex(),
            key_version=1,
            key_type="ML-KEM-768/ML-DSA-65",
            fingerprint=os.urandom(32).hex()
        )
        db.session.add(key_alice)
        db.session.add(key_bob)

        # Add mutual accepted connection between alice and bob so test connections work immediately
        contact_conn = ContactRequest(
            id="REQ-TEST-INIT01",
            sender="alice",
            receiver="bob",
            status="accepted"
        )
        db.session.add(contact_conn)

        # Audit log entry
        audit = AuditLog(
            event_type="DatabaseReset",
            target="System",
            actor="admin",
            severity="warning",
            details="Database purged and seeded with test users 'alice' and 'bob'."
        )
        db.session.add(audit)
        db.session.commit()

        print("=== Database Reset & Seed Completed ===")
        print("Created User 1: alice (Email: alice@latticelink.test, Password: Password123!, Role: ADMIN, Verified: True)")
        print("Created User 2: bob   (Email: bob@latticelink.test,   Password: Password123!, Role: USER,  Verified: True)")
        print("Connection established: alice <-> bob")

if __name__ == '__main__':
    reset_and_seed()
