import os
import sys
import unittest
import json
import time
from datetime import datetime, timedelta
from unittest.mock import patch

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_uri = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'latticelink_test.db').replace(os.sep, '/')}"
os.environ['DATABASE_URL'] = test_db_uri

from config import Config
from app import app
from models import db, User, OtpChallenge, Session, Key
from utils.security import hash_otp, verify_otp, verify_password, verify_recovery_answer


class TestSteppedRegistration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_stepped_registration setUpClass", uri=test_db_uri)
            db.create_all()

    def setUp(self):
        self.client = app.test_client()

    def tearDown(self):
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_stepped_registration tearDown", uri=app.config['SQLALCHEMY_DATABASE_URI'])
            db.session.rollback()
            for table in reversed(db.metadata.sorted_tables):
                db.session.execute(table.delete())
            db.session.commit()
            db.session.remove()

    def test_username_validation(self):
        """Test username validation endpoint rejects invalid and duplicate usernames."""
        # Missing username
        res = self.client.post('/api/auth/validate-username', json={'username': ''})
        self.assertEqual(res.status_code, 400)

        # Too short (< 3)
        res = self.client.post('/api/auth/validate-username', json={'username': 'ab'})
        self.assertEqual(res.status_code, 400)

        # Invalid characters (e.g. spaces or symbols)
        res = self.client.post('/api/auth/validate-username', json={'username': 'user name!'})
        self.assertEqual(res.status_code, 400)

        # Valid username
        res = self.client.post('/api/auth/validate-username', json={'username': 'quantum_user_1'})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json().get('available'))

        # Create user then check duplicate
        with app.app_context():
            u = User(
                username='quantum_user_1',
                email='q1@example.com',
                password_hash='dummy',
                node_id='LL-11111111',
                is_verified=True
            )
            db.session.add(u)
            db.session.commit()

        res = self.client.post('/api/auth/validate-username', json={'username': 'quantum_user_1'})
        self.assertEqual(res.status_code, 409)
        self.assertFalse(res.get_json().get('available'))

    def test_email_otp_flow_and_security(self):
        """Test email OTP dispatch, OTP not exposed, wrong OTP, and OTP verify."""
        with patch('routes.auth_routes.send_verification_otp') as mock_send_email:
            res = self.client.post('/api/auth/send-otp', json={
                'username': 'alice_node',
                'method': 'email',
                'contact': 'alice@example.com'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            # CRITICAL SECURITY RULE: OTP is NEVER returned in API responses
            self.assertNotIn('otp', data)
            self.assertNotIn('token', data)
            self.assertIn('masked_contact', data)

            mock_send_email.assert_called_once()
            dispatched_otp = mock_send_email.call_args[0][2]
            self.assertEqual(len(dispatched_otp), 6)
            self.assertTrue(dispatched_otp.isdigit())

            # Attempt verification with wrong OTP
            res_wrong = self.client.post('/api/auth/verify-otp', json={
                'method': 'email',
                'contact': 'alice@example.com',
                'otp': '000000'
            })
            self.assertEqual(res_wrong.status_code, 400)
            self.assertIn('Invalid verification code', res_wrong.get_json().get('error', ''))

            # Verify with correct OTP
            res_ok = self.client.post('/api/auth/verify-otp', json={
                'method': 'email',
                'contact': 'alice@example.com',
                'otp': dispatched_otp
            })
            self.assertEqual(res_ok.status_code, 200)
            ok_data = res_ok.get_json()
            self.assertTrue(ok_data.get('verified'))
            self.assertIn('verification_token', ok_data)

            # OTP cannot be reused after successful verification
            res_reuse = self.client.post('/api/auth/verify-otp', json={
                'method': 'email',
                'contact': 'alice@example.com',
                'otp': dispatched_otp
            })
            self.assertEqual(res_reuse.status_code, 400)

    def test_phone_sms_otp_disabled(self):
        """Test phone/SMS registration method is completely disabled and returns HTTP 400."""
        # /send-otp with method='phone' returns 400
        res = self.client.post('/api/auth/send-otp', json={
            'username': 'bob_phone_user',
            'method': 'phone',
            'contact': '+12025550199'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('SMS verification is disabled', res.get_json().get('error', ''))

        # /send-sms-otp endpoint returns 400
        res_sms = self.client.post('/api/auth/send-sms-otp', json={
            'username': 'bob_phone_user',
            'phone': '+12025550199'
        })
        self.assertEqual(res_sms.status_code, 400)
        self.assertIn('SMS verification is disabled', res_sms.get_json().get('error', ''))

        # /verify-otp with method='phone' returns 400
        verify_res = self.client.post('/api/auth/verify-otp', json={
            'method': 'phone',
            'contact': '+12025550199',
            'otp': '123456'
        })
        self.assertEqual(verify_res.status_code, 400)
        self.assertIn('SMS verification is disabled', verify_res.get_json().get('error', ''))

    def test_otp_expiry_and_attempt_limit(self):
        """Test OTP expiry after 5 minutes and failure lockout after 5 attempts."""
        with patch('routes.auth_routes.send_verification_otp') as mock_email:
            self.client.post('/api/auth/send-otp', json={
                'username': 'charlie',
                'method': 'email',
                'contact': 'charlie@example.com'
            })
            otp = mock_email.call_args[0][2]

            # Fast forward expiry in DB to simulate expired OTP
            with app.app_context():
                c = OtpChallenge.query.filter_by(contact='charlie@example.com').first()
                c.expires_at = datetime.utcnow() - timedelta(minutes=1)
                db.session.commit()

            res_exp = self.client.post('/api/auth/verify-otp', json={
                'contact': 'charlie@example.com',
                'otp': otp
            })
            self.assertEqual(res_exp.status_code, 400)
            self.assertIn('expired', res_exp.get_json().get('error', '').lower())

    def test_otp_attempt_lockout(self):
        """Verify challenge is invalidated after 5 failed attempts."""
        with patch('routes.auth_routes.send_verification_otp'):
            self.client.post('/api/auth/send-otp', json={
                'username': 'dave',
                'method': 'email',
                'contact': 'dave@example.com'
            })

            # Attempt 5 wrong codes
            for _ in range(5):
                res = self.client.post('/api/auth/verify-otp', json={
                    'contact': 'dave@example.com',
                    'otp': '999999'
                })
                self.assertEqual(res.status_code, 400)

            # 6th attempt is rejected because attempts exceeded
            res6 = self.client.post('/api/auth/verify-otp', json={
                'contact': 'dave@example.com',
                'otp': '999999'
            })
            self.assertEqual(res6.status_code, 400)
            self.assertIn('attempts', res6.get_json().get('error', '').lower())

    def test_full_stepped_registration_flow(self):
        """
        Complete end-to-end registration flow:
        Username -> Verify Method (Email) -> OTP -> Password -> 6-Digit PIN -> Recovery Question -> Account Created
        """
        # Step 1: Validate Username
        u_res = self.client.post('/api/auth/validate-username', json={'username': 'eve_secure'})
        self.assertEqual(u_res.status_code, 200)

        # Step 2: Send OTP
        with patch('routes.auth_routes.send_verification_otp') as mock_email:
            otp_res = self.client.post('/api/auth/send-otp', json={
                'username': 'eve_secure',
                'method': 'email',
                'contact': 'eve@example.com'
            })
            self.assertEqual(otp_res.status_code, 200)
            dispatched_otp = mock_email.call_args[0][2]

        # Step 3: Verify OTP
        verify_res = self.client.post('/api/auth/verify-otp', json={
            'method': 'email',
            'contact': 'eve@example.com',
            'otp': dispatched_otp
        })
        self.assertEqual(verify_res.status_code, 200)
        v_token = verify_res.get_json().get('verification_token')
        self.assertIsNotNone(v_token)

        # Step 4: Password validations
        # Short password (< 8 chars)
        bad_pwd_res = self.client.post('/api/auth/register', json={
            'username': 'eve_secure',
            'verification_token': v_token,
            'password': 'short',
            'confirm_password': 'short',
            'security_pin': '123456',
            'confirm_security_pin': '123456',
            'security_question': "What was your favorite teacher's name?",
            'security_answer': 'Mr. Feynman'
        })
        self.assertEqual(bad_pwd_res.status_code, 400)
        self.assertIn('at least 8 characters', bad_pwd_res.get_json().get('error', ''))

        # Password mismatch
        mismatch_pwd_res = self.client.post('/api/auth/register', json={
            'username': 'eve_secure',
            'verification_token': v_token,
            'password': 'Password123!',
            'confirm_password': 'Password456!',
            'security_pin': '123456',
            'confirm_security_pin': '123456',
            'security_question': "What was your favorite teacher's name?",
            'security_answer': 'Mr. Feynman'
        })
        self.assertEqual(mismatch_pwd_res.status_code, 400)
        self.assertIn('do not match', mismatch_pwd_res.get_json().get('error', ''))

        # Step 5: PIN validations
        # PIN not 6 digits
        bad_pin_res = self.client.post('/api/auth/register', json={
            'username': 'eve_secure',
            'verification_token': v_token,
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'security_pin': '1234',
            'confirm_security_pin': '1234',
            'security_question': "What was your favorite teacher's name?",
            'security_answer': 'Mr. Feynman'
        })
        self.assertEqual(bad_pin_res.status_code, 400)
        self.assertIn('6 numeric digits', bad_pin_res.get_json().get('error', ''))

        # PIN mismatch
        pin_mismatch_res = self.client.post('/api/auth/register', json={
            'username': 'eve_secure',
            'verification_token': v_token,
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'security_pin': '123456',
            'confirm_security_pin': '654321',
            'security_question': "What was your favorite teacher's name?",
            'security_answer': 'Mr. Feynman'
        })
        self.assertEqual(pin_mismatch_res.status_code, 400)
        self.assertIn('PIN', pin_mismatch_res.get_json().get('error', ''))

        # Step 6: Successful Registration
        reg_ok_res = self.client.post('/api/auth/register', json={
            'username': 'eve_secure',
            'verification_token': v_token,
            'password': 'SecurePassword2026!',
            'confirm_password': 'SecurePassword2026!',
            'security_pin': '749281',
            'confirm_security_pin': '749281',
            'security_question': "What was your favorite teacher's name?",
            'security_answer': 'Mr. Feynman'
        })
        self.assertEqual(reg_ok_res.status_code, 201)
        reg_data = reg_ok_res.get_json()
        self.assertIn('user', reg_data)
        self.assertIn('session_token', reg_data)
        self.assertTrue(reg_data['user']['isVerified'])
        self.assertEqual(reg_data['user']['username'], 'eve_secure')
        self.assertEqual(reg_data['user']['email'], 'eve@example.com')
        self.assertEqual(reg_data['user']['verificationMethod'], 'email')

        # SECURITY CHECKS: Never return hashes through APIs
        self.assertNotIn('password', reg_data['user'])
        self.assertNotIn('password_hash', reg_data['user'])
        self.assertNotIn('security_pin', reg_data['user'])
        self.assertNotIn('security_pin_hash', reg_data['user'])
        self.assertNotIn('security_answer', reg_data['user'])
        self.assertNotIn('security_answer_hash', reg_data['user'])

        # Verify database security state
        with app.app_context():
            u = User.query.filter_by(username='eve_secure').first()
            self.assertIsNotNone(u)
            self.assertTrue(u.is_verified)
            # Password is cryptographically hashed (not plaintext)
            self.assertNotEqual(u.password_hash, 'SecurePassword2026!')
            self.assertTrue(verify_password(u.password_hash, 'SecurePassword2026!'))

            # Security PIN is cryptographically hashed (not plaintext)
            self.assertNotEqual(u.security_pin_hash, '749281')
            self.assertTrue(verify_password(u.security_pin_hash, '749281'))

            # Recovery answer is hashed (not plaintext)
            self.assertNotEqual(u.security_answer_hash, 'Mr. Feynman')
            self.assertTrue(verify_recovery_answer('mr. feynman', u.security_answer_hash))

            # PQC Key was initialized
            k = Key.query.filter_by(user_id=u.id).first()
            self.assertIsNotNone(k)

            # Session token is active
            sess = Session.query.filter_by(user_id=u.id, is_active=True).first()
            self.assertIsNotNone(sess)
            self.assertEqual(sess.session_token, reg_data['session_token'])

        # PIN verification rate-limited endpoint check
        sess_token = reg_data['session_token']
        pin_verify_res = self.client.post('/api/auth/verify-security-pin', 
            headers={'Authorization': f'Bearer {sess_token}'},
            json={'security_pin': '749281'}
        )
        self.assertEqual(pin_verify_res.status_code, 200)
        self.assertTrue(pin_verify_res.get_json().get('valid'))

    def test_dev_mock_email_otp_dispatch_and_no_leak(self):
        """Test mock email OTP dispatch in local development when email provider unconfigured."""
        from services.email_service import SMTPConfigurationError
        with patch('routes.auth_routes.send_verification_otp', side_effect=SMTPConfigurationError("AgentMail not configured")):
            res = self.client.post('/api/auth/send-otp', json={
                'username': 'mock_tester',
                'method': 'email',
                'contact': 'mock_tester@example.com'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data.get('is_mock'))
            self.assertEqual(data.get('provider'), 'dev_mock')
            # Crucial security check: OTP is NEVER leaked in API response
            self.assertNotIn('otp', data)
            self.assertEqual(data.get('masked_contact'), 'm****@example.com')

    def test_email_provider_failure_and_rollback(self):
        """Test that email provider failures do not leave committed un-sent challenges."""
        from services.email_service import SMTPConfigurationError, SMTPSendError

        # 1. Configuration error in production (returns 503)
        with patch('routes.auth_routes.is_production_environment', return_value=True):
            with patch('routes.auth_routes.send_verification_otp', side_effect=SMTPConfigurationError("AgentMail unconfigured")):
                res = self.client.post('/api/auth/send-otp', json={
                    'username': 'fail_user_1',
                    'method': 'email',
                    'contact': 'fail1@example.com'
                })
                self.assertEqual(res.status_code, 503)
                self.assertIn('AgentMail unconfigured', res.get_json().get('error', ''))

        # 2. Provider send error (e.g. network/rejected error -> returns 500)
        with patch('routes.auth_routes.send_verification_otp', side_effect=SMTPSendError("Provider delivery timeout")):
            res = self.client.post('/api/auth/send-otp', json={
                'username': 'fail_user_2',
                'method': 'email',
                'contact': 'fail2@example.com'
            })
            self.assertEqual(res.status_code, 500)
            self.assertIn('Provider delivery timeout', res.get_json().get('error', ''))

    def test_email_resend_cooldown_and_renewal(self):
        """Test email resend cooldown enforcement (429) and successful challenge renewal after cooldown."""
        email_addr = 'resend_tester@example.com'
        with patch('routes.auth_routes.send_verification_otp'):
            # 1. Initial send
            res1 = self.client.post('/api/auth/send-otp', json={
                'username': 'resend_user',
                'method': 'email',
                'contact': email_addr
            })
            self.assertEqual(res1.status_code, 200)

            # 2. Immediate resend attempt -> blocked by 60s cooldown (429)
            res_rapid = self.client.post('/api/auth/send-otp', json={
                'username': 'resend_user',
                'method': 'email',
                'contact': email_addr
            })
            self.assertEqual(res_rapid.status_code, 429)
            self.assertIn('cooldown', res_rapid.get_json())
            self.assertTrue(res_rapid.get_json()['cooldown'] > 0)

            # 3. Simulate passage of 61 seconds on the previous challenge
            with app.app_context():
                chal = OtpChallenge.query.filter_by(contact=email_addr).order_by(OtpChallenge.id.desc()).first()
                chal.last_resend_at = datetime.utcnow() - timedelta(seconds=65)
                db.session.commit()

            # 4. Now resend succeeds with a fresh OTP challenge
            res_ok = self.client.post('/api/auth/send-otp', json={
                'username': 'resend_user',
                'method': 'email',
                'contact': email_addr
            })
            self.assertEqual(res_ok.status_code, 200)

            with app.app_context():
                challenges = OtpChallenge.query.filter_by(contact=email_addr).order_by(OtpChallenge.id.asc()).all()
                self.assertEqual(len(challenges), 2)
                self.assertTrue(challenges[0].used)  # Old challenge marked used
                self.assertFalse(challenges[1].used)  # New challenge active
                self.assertEqual(challenges[1].resend_count, 1)

    def test_login_security_pin_and_recovery_flow(self):
        """
        Verify newly registered user can login with password, verify security PIN,
        and recover account via recovery question. Also test logout and session revocation.
        """
        # 1. Register user through 6-step flow
        u_res = self.client.post('/api/auth/validate-username', json={'username': 'reg_test_user'})
        self.assertEqual(u_res.status_code, 200)

        with patch('routes.auth_routes.send_verification_otp') as mock_email:
            otp_res = self.client.post('/api/auth/send-otp', json={
                'username': 'reg_test_user',
                'method': 'email',
                'contact': 'reg_test@example.com'
            })
            self.assertEqual(otp_res.status_code, 200)
            otp = mock_email.call_args[0][2]

        v_res = self.client.post('/api/auth/verify-otp', json={
            'method': 'email',
            'contact': 'reg_test@example.com',
            'otp': otp
        })
        self.assertEqual(v_res.status_code, 200)
        v_token = v_res.get_json()['verification_token']

        reg_res = self.client.post('/api/auth/register', json={
            'username': 'reg_test_user',
            'verification_token': v_token,
            'password': 'Password2026!@#',
            'confirm_password': 'Password2026!@#',
            'security_pin': '918273',
            'confirm_security_pin': '918273',
            'security_question': "What was your favorite teacher's name?",
            'security_answer': 'Professor Turing'
        })
        self.assertEqual(reg_res.status_code, 201)

        # 2. Test Login
        login_res = self.client.post('/api/auth/login', json={
            'username': 'reg_test_user',
            'password': 'Password2026!@#'
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertIn('session_token', login_data)
        sess_token = login_data['session_token']

        # Invalid password returns 401
        bad_login = self.client.post('/api/auth/login', json={
            'username': 'reg_test_user',
            'password': 'WrongPassword123'
        })
        self.assertEqual(bad_login.status_code, 401)

        # 3. Test Security PIN Verification
        pin_ok = self.client.post('/api/auth/verify-security-pin',
            headers={'Authorization': f'Bearer {sess_token}'},
            json={'security_pin': '918273'}
        )
        self.assertEqual(pin_ok.status_code, 200)
        self.assertTrue(pin_ok.get_json().get('valid'))

        # Wrong PIN returns 401
        pin_bad = self.client.post('/api/auth/verify-security-pin',
            headers={'Authorization': f'Bearer {sess_token}'},
            json={'security_pin': '000000'}
        )
        self.assertEqual(pin_bad.status_code, 401)

        # 4. Test Recovery Question Endpoint
        rq_res = self.client.get('/api/auth/recovery-question?username=reg_test_user')
        self.assertEqual(rq_res.status_code, 200)
        self.assertEqual(rq_res.get_json().get('security_question'), "What was your favorite teacher's name?")

        # 5. Test Account Recovery with Security Question
        # Wrong answer returns 401
        bad_rec = self.client.post('/api/auth/recover-with-security-question', json={
            'username': 'reg_test_user',
            'security_answer': 'Wrong Teacher',
            'new_password': 'BrandNewPassword2026!'
        })
        self.assertEqual(bad_rec.status_code, 401)

        # Correct answer resets password and revokes old sessions
        rec_ok = self.client.post('/api/auth/recover-with-security-question', json={
            'username': 'reg_test_user',
            'security_answer': 'professor turing',
            'new_password': 'BrandNewPassword2026!',
            'confirm_password': 'BrandNewPassword2026!'
        })
        self.assertEqual(rec_ok.status_code, 200)

        # Old session token is now revoked (invalidated)
        revoked_check = self.client.post('/api/auth/verify-security-pin',
            headers={'Authorization': f'Bearer {sess_token}'},
            json={'security_pin': '918273'}
        )
        self.assertEqual(revoked_check.status_code, 401)

        # Login with NEW password succeeds
        new_login = self.client.post('/api/auth/login', json={
            'username': 'reg_test_user',
            'password': 'BrandNewPassword2026!'
        })
        self.assertEqual(new_login.status_code, 200)
        new_token = new_login.get_json()['session_token']

        # 6. Test Logout
        logout_res = self.client.post('/api/auth/logout',
            headers={'Authorization': f'Bearer {new_token}'}
        )
        self.assertEqual(logout_res.status_code, 200)

        # Token after logout returns 401
        post_logout_check = self.client.post('/api/auth/verify-security-pin',
            headers={'Authorization': f'Bearer {new_token}'},
            json={'security_pin': '918273'}
        )
        self.assertEqual(post_logout_check.status_code, 401)


if __name__ == '__main__':
    unittest.main()


