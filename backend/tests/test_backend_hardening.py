import os
import sys
import unittest
import json

# Ensure backend path is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Force isolated test environment
os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_uri = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'latticelink_test.db').replace(os.sep, '/')}"
os.environ['DATABASE_URL'] = test_db_uri

from config import Config
from app import app
from models import db, User, Key, Message, File, Session

class TestCanonicalBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_backend_hardening setUpClass", uri=test_db_uri)
            db.create_all()

    def setUp(self):
        self.client = app.test_client()

    def tearDown(self):
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_backend_hardening tearDown", uri=app.config['SQLALCHEMY_DATABASE_URI'])
            db.session.rollback()
            for table in reversed(db.metadata.sorted_tables):
                db.session.execute(table.delete())
            db.session.commit()
            db.session.remove()

    def test_health_endpoint(self):
        """Test GET /api/health returns 200, connected db, and version."""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'ok')
        self.assertEqual(data.get('database'), 'connected')
        self.assertEqual(data.get('socketio'), 'ready')
        self.assertIn('version', data)

    def test_registration_and_email_verification(self):
        """Test user registration with password hashing and email verification."""
        reg_payload = {
            'username': 'alice_node',
            'email': 'alice@lattice.network',
            'password': 'StrongPassword123!',
            'security_question': 'Favorite quantum algorithm?',
            'security_answer': 'Shor'
        }
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            res = self.client.post('/api/auth/register', json=reg_payload)
            self.assertEqual(res.status_code, 201)
            data = res.get_json()
            self.assertIn('user', data)
            self.assertFalse(data['user']['isVerified'])
            self.assertNotIn('dev_verification_token', data)
            self.assertNotIn('otp', data)
            dispatched_otp = mock_send.call_args[0][2]

            # Attempt verification
            verify_res = self.client.post('/api/auth/verify-email', json={
                'username': 'alice_node',
                'otp': dispatched_otp
            })
            self.assertEqual(verify_res.status_code, 200)
            self.assertTrue(verify_res.get_json().get('is_verified'))

    def test_password_hashing_is_salted_pbkdf2(self):
        """Confirm password is NOT stored as raw unsalted sha256."""
        reg_payload = {
            'username': 'bob_node',
            'email': 'bob@lattice.network',
            'password': 'MySecretPassword',
            'security_question': 'City',
            'security_answer': 'Bangalore'
        }
        self.client.post('/api/auth/register', json=reg_payload)
        with app.app_context():
            user = User.query.filter_by(username='bob_node').first()
            self.assertIsNotNone(user)
            self.assertTrue(user.password_hash.startswith('pbkdf2_sha256$'))
            # Distinct hashes for same password (salted)
            from utils.security import hash_password
            second_hash = hash_password('MySecretPassword')
            self.assertNotEqual(user.password_hash, second_hash)

    def test_authentication_and_rbac_enforcement(self):
        """Verify 401 when unauthenticated and 403 when role is insufficient."""
        # Unauthenticated access to protected route -> 401
        res = self.client.get('/api/user/directory')
        self.assertEqual(res.status_code, 401)

        # Register normal user
        self.client.post('/api/auth/register', json={
            'username': 'charlie_node',
            'email': 'charlie@lattice.network',
            'password': 'CharliePassword123',
            'security_question': 'City',
            'security_answer': 'Mysore'
        })
        with app.app_context():
            u = User.query.filter_by(username='charlie_node').first()
            u.is_verified = True
            db.session.commit()

        login_res = self.client.post('/api/auth/login', json={
            'username': 'charlie_node',
            'password': 'CharliePassword123'
        })
        token = login_res.get_json()['session_token']

        # Normal user accessing directory -> 200
        headers = {'Authorization': f'Bearer {token}'}
        dir_res = self.client.get('/api/user/directory', headers=headers)
        self.assertEqual(dir_res.status_code, 200)

        # Normal user accessing ADMIN route -> 403
        admin_res = self.client.get('/api/user/admin/users', headers=headers)
        self.assertEqual(admin_res.status_code, 403)

    def test_no_plaintext_messages_stored(self):
        """Security regression: ensure message plaintext is never in Message model or table."""
        with app.app_context():
            # Confirm Message model does not have plaintext column
            self.assertFalse(hasattr(Message, 'plaintext'))
            
            # Create encrypted message record
            msg = Message(
                id='MSG-TEST-01',
                conversation_id='alice-bob',
                sender='alice',
                receiver='bob',
                encrypted_payload='ENCRYPTED_AES256_GCM_CIPHERTEXT',
                nonce='mock_nonce_12',
                sha3_hash='sha3_hash_hex',
                signature='mldsa_sig_hex'
            )
            db.session.add(msg)
            db.session.commit()

            fetched = db.session.get(Message, 'MSG-TEST-01')
            self.assertEqual(fetched.encrypted_payload, 'ENCRYPTED_AES256_GCM_CIPHERTEXT')
            self.assertNotIn('plaintext', fetched.to_dict())

    def test_key_rotation_flow(self):
        """Verify genuine key rotation increases version and updates fingerprint."""
        self.client.post('/api/auth/register', json={
            'username': 'dave_node',
            'email': 'dave@lattice.network',
            'password': 'DavePassword123',
            'security_question': 'City',
            'security_answer': 'Delhi'
        })
        with app.app_context():
            u = User.query.filter_by(username='dave_node').first()
            u.is_verified = True
            db.session.commit()

        login_res = self.client.post('/api/auth/login', json={
            'username': 'dave_node',
            'password': 'DavePassword123'
        })
        token = login_res.get_json()['session_token']
        headers = {'Authorization': f'Bearer {token}'}

        rotate_res = self.client.post('/api/chat/keys/rotate', headers=headers)
        self.assertEqual(rotate_res.status_code, 200)
        key_data = rotate_res.get_json()['key']
        self.assertEqual(key_data['key_version'], 2)
        self.assertEqual(key_data['key_type'], 'ML-KEM-768/ML-DSA-65')
        self.assertTrue(bool(key_data['fingerprint']))

if __name__ == '__main__':
    unittest.main()
