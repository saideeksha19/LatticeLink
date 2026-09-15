import os
import sys
import sqlite3
import subprocess
import unittest

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Dummy email provider configuration for the sandboxed registration proof
# below; the subprocess mocks the provider HTTP call, so nothing is dispatched.
os.environ.setdefault('BREVO_API_KEY', 'test-dummy-brevo-api-key')
os.environ.setdefault('MAIL_DEFAULT_SENDER', 'latticelink.test.sender@gmail.com')

DEV_DB_PATH = os.path.join(BASE_DIR, 'instance', 'latticelink.db')
TEST_DB_PATH = os.path.join(BASE_DIR, 'instance', 'latticelink_test.db')

class TestDatabaseSafetyArchitecture(unittest.TestCase):
    
    def test_01_config_safety_guard_blocks_destructive_action_on_dev_db(self):
        """Proof 1: assert_safe_for_destructive_action raises RuntimeError on development DB."""
        os.environ['LATTICELINK_TEST_MODE'] = 'False'
        from config import Config
        dev_uri = f"sqlite:///{DEV_DB_PATH.replace(os.sep, '/')}"
        
        # A) With LATTICELINK_TEST_MODE=False, MUST raise
        with self.assertRaises(RuntimeError) as ctx:
            Config.assert_safe_for_destructive_action("simulated drop_all", uri=dev_uri)
        self.assertIn("CRITICAL SAFETY VIOLATION", str(ctx.exception))
        self.assertIn("LATTICELINK_TEST_MODE is not enabled", str(ctx.exception))

        # B) Even if LATTICELINK_TEST_MODE=True, if URI points to latticelink.db, MUST raise
        os.environ['LATTICELINK_TEST_MODE'] = 'True'
        with self.assertRaises(RuntimeError) as ctx:
            Config.assert_safe_for_destructive_action("simulated drop_all", uri=dev_uri)
        self.assertIn("CRITICAL SAFETY VIOLATION", str(ctx.exception))
        self.assertIn("NOT a designated test database", str(ctx.exception))
        os.environ['LATTICELINK_TEST_MODE'] = 'False'

    def test_02_config_safety_guard_allows_test_db(self):
        """Proof 2: assert_safe_for_destructive_action succeeds ONLY when in test mode on test DB."""
        os.environ['LATTICELINK_TEST_MODE'] = 'True'
        from config import Config
        test_uri = f"sqlite:///{TEST_DB_PATH.replace(os.sep, '/')}"
        # Must not raise any error
        Config.assert_safe_for_destructive_action("test reset", uri=test_uri)
        os.environ['LATTICELINK_TEST_MODE'] = 'False'

    def test_03_endpoint_dev_reset_seed_forbidden_on_dev_db(self):
        """Proof 3: Calling /api/security/dev/reset-seed returns 403 Forbidden in dev mode."""
        os.environ['LATTICELINK_TEST_MODE'] = 'False'
        from app import app
        client = app.test_client()
        res = client.post('/api/security/dev/reset-seed')
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn("Forbidden", data.get('error', ''))

    def test_04_normal_app_startup_does_not_drop_users(self):
        """Proof 4: Restarting/reloading app context does NOT delete or recreate existing users."""
        conn = sqlite3.connect(DEV_DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM users")
        initial_user_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM keys")
        initial_key_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM messages")
        initial_msg_count = cur.fetchone()[0]
        conn.close()

        # Simulate normal application startup
        from app import app, auto_migrate_schema
        with app.app_context():
            from models import db
            db.create_all()
            auto_migrate_schema()

        # Verify all records remain completely untouched
        conn = sqlite3.connect(DEV_DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM users")
        post_user_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM keys")
        post_key_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM messages")
        post_msg_count = cur.fetchone()[0]
        conn.close()

        self.assertEqual(initial_user_count, post_user_count)
        self.assertEqual(initial_key_count, post_key_count)
        self.assertEqual(initial_msg_count, post_msg_count)

    def test_05_destructive_reset_affects_only_test_db(self):
        """Proof 5: Destructive test reset operates exclusively on test DB; real dev DB remains untouched."""
        # 1. First prove that calling db.drop_all() while connected to dev DB is blocked by SafeSQLAlchemy
        from app import app
        from models import db
        with app.app_context():
            with self.assertRaises(RuntimeError) as ctx:
                db.drop_all()
            self.assertIn("CRITICAL SAFETY VIOLATION", str(ctx.exception))

        # 2. Record users in dev DB before test reset
        conn_dev = sqlite3.connect(DEV_DB_PATH)
        cur_dev = conn_dev.cursor()
        cur_dev.execute("SELECT id, username FROM users ORDER BY id ASC")
        dev_users_before = cur_dev.fetchall()
        conn_dev.close()

        # 3. Execute isolated test DB reset in an isolated test subprocess
        sub_env = os.environ.copy()
        sub_env['LATTICELINK_TEST_MODE'] = 'True'
        test_db_uri = f"sqlite:///{TEST_DB_PATH.replace(os.sep, '/')}"
        sub_env['DATABASE_URL'] = test_db_uri
        
        py_exe = sys.executable
        reset_code = (
            "from app import app\n"
            "from models import db\n"
            "with app.app_context():\n"
            "    db.drop_all()\n"
            "    db.create_all()\n"
            "    print('TEST_DB_RESET_OK')\n"
        )
        res = subprocess.run([py_exe, "-c", reset_code], capture_output=True, text=True, env=sub_env, cwd=BASE_DIR)
        self.assertEqual(res.returncode, 0)
        self.assertIn("TEST_DB_RESET_OK", res.stdout)

        # 4. Verify dev DB was completely untouched
        conn_dev = sqlite3.connect(DEV_DB_PATH)
        cur_dev = conn_dev.cursor()
        cur_dev.execute("SELECT id, username FROM users ORDER BY id ASC")
        dev_users_after = cur_dev.fetchall()
        conn_dev.close()

        self.assertEqual(dev_users_before, dev_users_after)

    def test_06_registration_and_login_work_on_test_db_and_dev_db_untouched(self):
        """Proof 6: Registration and Login function correctly on test DB, leaving dev DB untouched."""
        import hashlib
        with open(DEV_DB_PATH, "rb") as f:
            dev_hash_before = hashlib.sha256(f.read()).hexdigest()

        # Run registration and login flow against isolated test database
        sub_env = os.environ.copy()
        sub_env['LATTICELINK_TEST_MODE'] = 'True'
        test_db_uri = f"sqlite:///{TEST_DB_PATH.replace(os.sep, '/')}"
        sub_env['DATABASE_URL'] = test_db_uri

        test_code = (
            "import os, sys, sqlite3, hmac, hashlib\n"
            "from unittest.mock import patch\n"
            "from app import app\n"
            "from models import db\n"
            "with app.app_context():\n"
            "    db.create_all()\n"
            "from unittest.mock import patch, MagicMock\n"
            "_resp = MagicMock(); _resp.status = 201; _resp.getcode.return_value = 201; _resp.read.return_value = b'{}'; _resp.close.return_value = None\n"
            "_u = MagicMock(return_value=_resp); _u.return_value.__enter__.return_value = _resp; _u.return_value.__exit__.return_value = False\n"
            "client = app.test_client()\n"
            "with patch('services.email_service.urllib.request.urlopen', _u):\n"
            "    reg_res = client.post('/api/auth/register', json={'username': 'SafetyVerifyUser', 'email': 'safety_verify@example.com', 'password': 'TestPassw0rd123!Secure'})\n"
            "    assert reg_res.status_code in (200, 201), f'Reg failed: {reg_res.status_code}'\n"
            "    conn = sqlite3.connect(r'" + TEST_DB_PATH + "')\n"
            "    cur = conn.cursor()\n"
            "    cur.execute('SELECT id FROM users WHERE username = ?', ('SafetyVerifyUser',))\n"
            "    uid = cur.fetchone()[0]\n"
            "    cur.execute('SELECT salt, token_hash FROM email_verification_tokens WHERE user_id = ? ORDER BY id DESC LIMIT 1', (uid,))\n"
            "    salt, thash = cur.fetchone()\n"
            "    conn.close()\n"
            "    found_otp = None\n"
            "    for num in range(100000, 1000000):\n"
            "        s = str(num)\n"
            "        if hmac.new(salt.encode('utf-8'), s.encode('utf-8'), hashlib.sha256).hexdigest() == thash:\n"
            "            found_otp = s\n"
            "            break\n"
            "    assert found_otp is not None\n"
            "    ver_res = client.post('/api/auth/verify-email', json={'username': 'SafetyVerifyUser', 'otp': found_otp})\n"
            "    assert ver_res.status_code == 200, f'Verify failed: {ver_res.status_code}'\n"
            "    login_res = client.post('/api/auth/login', json={'username': 'SafetyVerifyUser', 'password': 'TestPassw0rd123!Secure'})\n"
            "    assert login_res.status_code == 200, f'Login failed: {login_res.status_code}'\n"
            "    assert 'session_token' in login_res.get_json()\n"
            "    print('REG_LOGIN_TEST_PASSED')\n"
        )
        res = subprocess.run([sys.executable, "-c", test_code], capture_output=True, text=True, env=sub_env, cwd=BASE_DIR)
        self.assertEqual(res.returncode, 0, f"Subprocess failed:\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}")
        self.assertIn("REG_LOGIN_TEST_PASSED", res.stdout)

        # Verify DEV_DB_PATH was completely untouched
        with open(DEV_DB_PATH, "rb") as f:
            dev_hash_after = hashlib.sha256(f.read()).hexdigest()
        self.assertEqual(dev_hash_before, dev_hash_after)

    def test_07_messages_files_keys_persist_across_restart(self):
        """Proof 7: Existing messages, file metadata, and key rotation records remain persistent."""
        conn = sqlite3.connect(DEV_DB_PATH)
        cur = conn.cursor()
        
        # Verify messages exist (AuditUserA -> AuditUserB)
        cur.execute("SELECT count(*) FROM messages")
        self.assertGreaterEqual(cur.fetchone()[0], 2)

        # Verify keys exist (including rotated keys v1, v2, v3, v4 for AuditUserA)
        cur.execute("SELECT count(*) FROM keys WHERE user_id = 1")
        self.assertEqual(cur.fetchone()[0], 4)

        # Verify active key for AuditUserA is version 4
        cur.execute("SELECT key_version, status, fingerprint FROM keys WHERE user_id = 1 AND status = 'active'")
        active_key = cur.fetchone()
        self.assertIsNotNone(active_key)
        self.assertEqual(active_key[0], 4)
        self.assertTrue(active_key[2].startswith("1b41817c6c261a6e"))

        # Verify all 3 original users remain present
        cur.execute("SELECT username FROM users ORDER BY id ASC")
        usernames = [r[0] for r in cur.fetchall()]
        self.assertEqual(usernames, ['AuditUserA', 'AuditUserB', 'AuditUserC'])
        conn.close()

if __name__ == '__main__':
    unittest.main(verbosity=2)
