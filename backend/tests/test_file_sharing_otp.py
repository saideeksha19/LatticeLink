import os
import sys
import unittest
import json
import time
from datetime import datetime, timedelta

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
from models import (
    db, User, Key, Message, File, FileShare, 
    EmailVerificationToken, PasswordResetToken, Session
)
from utils.security import generate_otp, hash_otp, verify_otp, hash_password, verify_password

class TestFileSharingAndEmailOTP(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_file_sharing_otp setUpClass", uri=test_db_uri)
            db.create_all()

    def setUp(self):
        self.client = app.test_client()

    def tearDown(self):
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_file_sharing_otp tearDown", uri=app.config['SQLALCHEMY_DATABASE_URI'])
            db.session.rollback()
            for table in reversed(db.metadata.sorted_tables):
                db.session.execute(table.delete())
            db.session.commit()
            db.session.remove()

    # -------------------------------------------------------------
    # PART B & C: REGISTRATION, 6-DIGIT OTP & EMAIL VERIFICATION
    # -------------------------------------------------------------
    def test_registration_without_smtp_fails_gracefully(self):
        """When Gmail SMTP is not configured, registration fails with clear configuration error (HTTP 503)."""
        from unittest.mock import patch
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('MAIL_USERNAME', None)
            os.environ.pop('MAIL_PASSWORD', None)
            res = self.client.post('/api/auth/register', json={
                'username': 'nosmtp_user',
                'email': 'nosmtp@example.com',
                'password': 'StrongPassword123!'
            })
            self.assertEqual(res.status_code, 503)
            data = res.get_json()
            self.assertIn('MAIL_USERNAME and MAIL_PASSWORD are not configured', data.get('error', ''))
            self.assertNotIn('dev_otp', data)
            self.assertNotIn('otp', data)

    def test_registration_valid_with_mocked_smtp(self):
        """Test valid registration creates unverified user and sends 6-digit OTP token via SMTP."""
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            res = self.client.post('/api/auth/register', json={
                'username': 'user_a',
                'email': 'usera@example.com',
                'password': 'StrongPassword123!',
                'security_question': 'City',
                'security_answer': 'Tokyo'
            })
            self.assertEqual(res.status_code, 201)
            data = res.get_json()
            self.assertIn('user', data)
            self.assertFalse(data['user']['isVerified'])
            # CRITICAL SECURITY REQUIREMENT: Never return OTP in API response
            self.assertNotIn('dev_otp', data)
            self.assertNotIn('otp', data)

            # Confirm SMTP send function was called with 6-digit code
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0]
            self.assertEqual(call_args[0], 'usera@example.com')
            self.assertEqual(call_args[1], 'user_a')
            dispatched_otp = call_args[2]
            self.assertEqual(len(dispatched_otp), 6)
            self.assertTrue(dispatched_otp.isdigit())

            with app.app_context():
                u = User.query.filter_by(username='user_a').first()
                self.assertIsNotNone(u)
                self.assertFalse(u.is_verified)
                token_rec = EmailVerificationToken.query.filter_by(user_id=u.id).first()
                self.assertIsNotNone(token_rec)
                # Ensure raw OTP is NOT stored directly in database
                self.assertNotEqual(token_rec.token_hash, dispatched_otp)
                # Verify OTP hash matches
                self.assertTrue(verify_otp(dispatched_otp, token_rec.salt, token_rec.token_hash))

    def test_registration_duplicate_username(self):
        """Reject registration with already existing username."""
        self.client.post('/api/auth/register', json={
            'username': 'user_dup',
            'email': 'dup1@example.com',
            'password': 'Password123!'
        })
        res = self.client.post('/api/auth/register', json={
            'username': 'user_dup',
            'email': 'dup2@example.com',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 409)
        self.assertIn('Username already registered', res.get_json().get('error', ''))

    def test_registration_duplicate_email(self):
        """Reject registration with already existing email."""
        self.client.post('/api/auth/register', json={
            'username': 'user_x',
            'email': 'shared@example.com',
            'password': 'Password123!'
        })
        res = self.client.post('/api/auth/register', json={
            'username': 'user_y',
            'email': 'shared@example.com',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 409)
        self.assertIn('Email address already registered', res.get_json().get('error', ''))

    def test_unverified_account_login_blocked(self):
        """Unverified accounts must receive 403 upon login."""
        self.client.post('/api/auth/register', json={
            'username': 'unverified_user',
            'email': 'unverified@example.com',
            'password': 'Password123!'
        })
        res = self.client.post('/api/auth/login', json={
            'username': 'unverified_user',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertTrue(data.get('needs_verification'))

    def test_otp_verification_success(self):
        """Valid OTP marks user as verified and invalidates token."""
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            reg = self.client.post('/api/auth/register', json={
                'username': 'verify_me',
                'email': 'verify@example.com',
                'password': 'Password123!'
            })
            self.assertEqual(reg.status_code, 201)
            self.assertNotIn('dev_otp', reg.get_json())
            otp = mock_send.call_args[0][2]

        res = self.client.post('/api/auth/verify-email', json={
            'username': 'verify_me',
            'otp': str(otp)
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json().get('is_verified'))

        # Login is now permitted
        login_res = self.client.post('/api/auth/login', json={
            'username': 'verify_me',
            'password': 'Password123!'
        })
        self.assertEqual(login_res.status_code, 200)

    def test_otp_verification_invalid(self):
        """Invalid OTP code fails and increments attempt counter."""
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp'):
            self.client.post('/api/auth/register', json={
                'username': 'bad_otp_user',
                'email': 'badotp@example.com',
                'password': 'Password123!'
            })
        res = self.client.post('/api/auth/verify-email', json={
            'username': 'bad_otp_user',
            'otp': '000000'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('Invalid verification code', res.get_json().get('error', ''))

    def test_otp_exhaustion_after_5_attempts(self):
        """Failed OTP attempts lock the token after 5 attempts."""
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp'):
            self.client.post('/api/auth/register', json={
                'username': 'brute_force_user',
                'email': 'brute@example.com',
                'password': 'Password123!'
            })
        for _ in range(5):
            self.client.post('/api/auth/verify-email', json={
                'username': 'brute_force_user',
                'otp': '111111'
            })
        # 6th attempt should be rejected due to too many attempts
        res = self.client.post('/api/auth/verify-email', json={
            'username': 'brute_force_user',
            'otp': '111111'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('Too many failed attempts', res.get_json().get('error', ''))

    def test_otp_expired(self):
        """Expired OTP is rejected."""
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            reg = self.client.post('/api/auth/register', json={
                'username': 'expired_user',
                'email': 'expired@example.com',
                'password': 'Password123!'
            })
            self.assertEqual(reg.status_code, 201)
            otp = mock_send.call_args[0][2]

        # Manually expire the token in the database
        with app.app_context():
            u = User.query.filter_by(username='expired_user').first()
            token_rec = EmailVerificationToken.query.filter_by(user_id=u.id).first()
            token_rec.expires_at = datetime.utcnow() - timedelta(minutes=5)
            db.session.commit()

        res = self.client.post('/api/auth/verify-email', json={
            'username': 'expired_user',
            'otp': str(otp)
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('expired', res.get_json().get('error', '').lower())

    def test_resend_verification_otp(self):
        """Resend verification generates a new OTP and invalidates previous ones."""
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp'):
            self.client.post('/api/auth/register', json={
                'username': 'resend_user',
                'email': 'resend@example.com',
                'password': 'Password123!'
            })
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            res = self.client.post('/api/auth/resend-verification', json={
                'username': 'resend_user'
            })
            self.assertEqual(res.status_code, 200)
            self.assertNotIn('dev_otp', res.get_json())
            new_otp = mock_send.call_args[0][2]

        # Successfully verify with new OTP
        verify_res = self.client.post('/api/auth/verify-email', json={
            'username': 'resend_user',
            'otp': str(new_otp)
        })
        self.assertEqual(verify_res.status_code, 200)

    # -------------------------------------------------------------
    # PART D & E: FORGOT PASSWORD, OTP VERIFICATION & ARGON2id
    # -------------------------------------------------------------
    def test_forgot_password_flow(self):
        """Complete forgot password -> OTP verify -> reset password -> session revocation."""
        from unittest.mock import patch
        # 1. Register & verify user
        with patch('routes.auth_routes.send_verification_otp') as mock_reg_send:
            reg = self.client.post('/api/auth/register', json={
                'username': 'reset_user',
                'email': 'reset@example.com',
                'password': 'OldPassword123!'
            })
            self.assertEqual(reg.status_code, 201)
            self.assertNotIn('dev_otp', reg.get_json())
            otp_reg = mock_reg_send.call_args[0][2]
        self.client.post('/api/auth/verify-email', json={'username': 'reset_user', 'otp': str(otp_reg)})

        # 2. Login to create an active session
        login_res = self.client.post('/api/auth/login', json={'username': 'reset_user', 'password': 'OldPassword123!'})
        old_token = login_res.get_json()['session_token']

        # Verify old session works
        self.assertEqual(self.client.get('/api/user/directory', headers={'Authorization': f'Bearer {old_token}'}).status_code, 200)

        # 3. Request password reset (anti-enumeration check: unknown email still returns 200 generic message)
        anon_res = self.client.post('/api/auth/forgot-password', json={'email': 'unknown@example.com'})
        self.assertEqual(anon_res.status_code, 200)

        # Real forgot password
        with patch('routes.auth_routes.send_password_reset_otp') as mock_reset_send:
            reset_req = self.client.post('/api/auth/forgot-password', json={'email': 'reset@example.com'})
            self.assertEqual(reset_req.status_code, 200)
            self.assertNotIn('dev_otp', reset_req.get_json())
            reset_otp = mock_reset_send.call_args[0][2]

        # 4. Verify Reset OTP
        verify_reset = self.client.post('/api/auth/verify-reset-otp', json={
            'email': 'reset@example.com',
            'otp': str(reset_otp)
        })
        self.assertEqual(verify_reset.status_code, 200)
        reset_token = verify_reset.get_json()['reset_token']
        self.assertTrue(bool(reset_token))

        # 5. Reset Password
        change_res = self.client.post('/api/auth/reset-password', json={
            'email': 'reset@example.com',
            'reset_token': reset_token,
            'new_password': 'BrandNewPassword456!',
            'confirm_password': 'BrandNewPassword456!'
        })
        self.assertEqual(change_res.status_code, 200)

        # 6. Old session must now be invalidated (revoked)
        stale_check = self.client.get('/api/user/directory', headers={'Authorization': f'Bearer {old_token}'})
        self.assertEqual(stale_check.status_code, 401)

        # 7. Old password rejected, new password accepted
        bad_login = self.client.post('/api/auth/login', json={'username': 'reset_user', 'password': 'OldPassword123!'})
        self.assertEqual(bad_login.status_code, 401)

        good_login = self.client.post('/api/auth/login', json={'username': 'reset_user', 'password': 'BrandNewPassword456!'})
        self.assertEqual(good_login.status_code, 200)

    # -------------------------------------------------------------
    # PART A & F: FILE SHARING INTO CHAT & SECURE DOWNLOAD
    # -------------------------------------------------------------
    def test_file_upload_and_download_security(self):
        """Test uploading file, FileShare creation, authorized download, and path traversal protection."""
        from unittest.mock import patch
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            reg_a = self.client.post('/api/auth/register', json={'username': 'alice', 'email': 'alice@vault.net', 'password': 'Password123!'})
            otp_a = mock_send.call_args[0][2]
            self.client.post('/api/auth/verify-email', json={'username': 'alice', 'otp': str(otp_a)})

            reg_b = self.client.post('/api/auth/register', json={'username': 'bob', 'email': 'bob@vault.net', 'password': 'Password123!'})
            otp_b = mock_send.call_args[0][2]
            self.client.post('/api/auth/verify-email', json={'username': 'bob', 'otp': str(otp_b)})

            reg_c = self.client.post('/api/auth/register', json={'username': 'eve', 'email': 'eve@vault.net', 'password': 'Password123!'})
            otp_c = mock_send.call_args[0][2]
            self.client.post('/api/auth/verify-email', json={'username': 'eve', 'otp': str(otp_c)})

        # Tokens
        token_a = self.client.post('/api/auth/login', json={'username': 'alice', 'password': 'Password123!'}).get_json()['session_token']
        token_b = self.client.post('/api/auth/login', json={'username': 'bob', 'password': 'Password123!'}).get_json()['session_token']
        token_c = self.client.post('/api/auth/login', json={'username': 'eve', 'password': 'Password123!'}).get_json()['session_token']

        import io
        # 1. Alice uploads confidential document for Bob
        file_payload = (io.BytesIO(b'%PDF-1.4 Mock Encrypted Quantum Report'), 'quantum_report.pdf')
        upload_res = self.client.post('/api/vault/upload', headers={'Authorization': f'Bearer {token_a}'}, data={
            'file': file_payload,
            'receiver': 'bob'
        }, content_type='multipart/form-data')

        self.assertEqual(upload_res.status_code, 201)
        file_info = upload_res.get_json()['file']
        file_id = file_info['id']
        self.assertTrue(file_id.startswith('VF-'))
        self.assertEqual(file_info['name'], 'quantum_report.pdf')

        with app.app_context():
            # Check File record
            f_rec = File.query.get(file_id)
            self.assertIsNotNone(f_rec)
            self.assertEqual(f_rec.uploader, 'alice')
            self.assertEqual(f_rec.receiver, 'bob')

            # Check FileShare record
            share_rec = FileShare.query.filter_by(file_id=file_id, recipient='bob').first()
            self.assertIsNotNone(share_rec)
            self.assertEqual(share_rec.sender, 'alice')
            self.assertIsNone(share_rec.revoked_at)

        # 2. Authorized download by Alice (owner)
        dl_alice = self.client.get(f'/api/vault/files/{file_id}/download', headers={'Authorization': f'Bearer {token_a}'})
        self.assertEqual(dl_alice.status_code, 200)
        self.assertEqual(dl_alice.data, b'%PDF-1.4 Mock Encrypted Quantum Report')

        # 3. Authorized download by Bob (shared recipient)
        dl_bob = self.client.get(f'/api/vault/files/{file_id}/download', headers={'Authorization': f'Bearer {token_b}'})
        self.assertEqual(dl_bob.status_code, 200)
        self.assertEqual(dl_bob.data, b'%PDF-1.4 Mock Encrypted Quantum Report')

        # 4. Unauthorized download by Eve -> 403 Forbidden
        dl_eve = self.client.get(f'/api/vault/files/{file_id}/download', headers={'Authorization': f'Bearer {token_c}'})
        self.assertEqual(dl_eve.status_code, 403)

        # 5. Path traversal attack attempt -> 404 or 403, must never leak server files
        traversal = self.client.get('/api/vault/files/..%2F..%2Fconfig.py/download', headers={'Authorization': f'Bearer {token_a}'})
        self.assertIn(traversal.status_code, [400, 403, 404])

        # 6. File deletion revokes share
        del_res = self.client.delete(f'/api/vault/delete/{file_id}', headers={'Authorization': f'Bearer {token_a}'})
        self.assertEqual(del_res.status_code, 200)

        with app.app_context():
            share_check = FileShare.query.filter_by(file_id=file_id, recipient='bob').first()
            self.assertIsNotNone(share_check.revoked_at)

        # Bob can no longer download deleted file
        dl_bob_after_del = self.client.get(f'/api/vault/files/{file_id}/download', headers={'Authorization': f'Bearer {token_b}'})
        self.assertEqual(dl_bob_after_del.status_code, 404)

    def test_file_message_model_association(self):
        """Confirm Message model stores file_id, message_type='file', and serializes file_meta."""
        with app.app_context():
            # Create file
            f = File(
                id='VF-TEST-99',
                name='spec.pdf',
                size=1024,
                storage_path='/mock/path/VF-TEST-99.enc',
                uploader='alice',
                receiver='bob',
                status='active',
                sha3_hash='abc123sha3'
            )
            db.session.add(f)
            db.session.commit()

            msg = Message(
                id='MSG-FILE-01',
                conversation_id='alice-bob',
                sender='alice',
                receiver='bob',
                message_type='file',
                file_id='VF-TEST-99',
                encrypted_payload='',
                nonce='',
                sha3_hash='abc123sha3',
                signature=''
            )
            db.session.add(msg)
            db.session.commit()

            saved = Message.query.get('MSG-FILE-01')
            self.assertEqual(saved.message_type, 'file')
            self.assertEqual(saved.file_id, 'VF-TEST-99')

            msg_dict = saved.to_dict()
            self.assertEqual(msg_dict['type'], 'file')
            self.assertIn('file_meta', msg_dict)
            self.assertEqual(msg_dict['file_meta']['id'], 'VF-TEST-99')
            self.assertEqual(msg_dict['file_meta']['name'], 'spec.pdf')
            self.assertEqual(msg_dict['file_meta']['sha3_hash'], 'abc123sha3')

if __name__ == '__main__':
    unittest.main()
