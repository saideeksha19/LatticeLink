import os
import sys
import unittest
from unittest.mock import patch

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_uri = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'latticelink_test.db').replace(os.sep, '/')}"
if 'DATABASE_URL' not in os.environ:
    os.environ['DATABASE_URL'] = test_db_uri

from config import Config
from app import app
from models import db, User, Session

PASSWORD = 'SearchTestPass123!'


class TestUserSearch(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_user_search setUpClass", uri=test_db_uri)
            db.create_all()

    def setUp(self):
        self.client = app.test_client()

    def tearDown(self):
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_user_search tearDown", uri=app.config['SQLALCHEMY_DATABASE_URI'])
            db.session.rollback()
            for table in reversed(db.metadata.sorted_tables):
                db.session.execute(table.delete())
            db.session.commit()
            db.session.remove()

    def _register_and_login(self, username, email):
        payload = {
            'username': username,
            'email': email,
            'password': PASSWORD,
            'security_question': 'Favorite cipher?',
            'security_answer': 'argon2',
        }
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            res = self.client.post('/api/auth/register', json=payload)
            self.assertEqual(res.status_code, 201, res.get_json())
            otp = mock_send.call_args[0][2]

        res = self.client.post('/api/auth/verify-email', json={'username': username, 'otp': otp})
        self.assertEqual(res.status_code, 200, res.get_json())

        res = self.client.post('/api/auth/login', json={'username': username, 'password': PASSWORD})
        self.assertEqual(res.status_code, 200, res.get_json())
        return res.get_json()['session_token']

    def test_two_registered_users_find_each_other(self):
        """Regression test: Two users register successfully and find each other in user search."""
        token_a = self._register_and_login('alice_operator', 'alice@operator.org')
        token_b = self._register_and_login('bob_operator', 'bob@operator.org')

        auth_a = {'Authorization': f'Bearer {token_a}'}
        auth_b = {'Authorization': f'Bearer {token_b}'}

        # 1. Alice searches for Bob by full username
        res = self.client.get('/api/user/search?q=bob_operator', headers=auth_a)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        usernames = [u['username'] for u in data.get('users', [])]
        self.assertIn('bob_operator', usernames)
        self.assertNotIn('alice_operator', [u['username'] for u in data.get('users', []) if u['username'] == 'bob_operator'])

        # 2. Bob searches for Alice by full username
        res = self.client.get('/api/user/search?q=alice_operator', headers=auth_b)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        usernames = [u['username'] for u in data.get('users', [])]
        self.assertIn('alice_operator', usernames)

    def test_search_case_insensitivity_and_prefix_normalization(self):
        """User search normalizes case, whitespace, and '@' prefix."""
        token_a = self._register_and_login('charlie_node', 'charlie@node.org')
        token_b = self._register_and_login('diana_node', 'diana@node.org')

        auth_a = {'Authorization': f'Bearer {token_a}'}

        # Uppercase search
        res = self.client.get('/api/user/search?q=DIANA_NODE', headers=auth_a)
        self.assertEqual(res.status_code, 200)
        usernames = [u['username'] for u in res.get_json().get('users', [])]
        self.assertIn('diana_node', usernames)

        # Leading '@' prefix search
        res = self.client.get('/api/user/search?q=@diana_node', headers=auth_a)
        self.assertEqual(res.status_code, 200)
        usernames = [u['username'] for u in res.get_json().get('users', [])]
        self.assertIn('diana_node', usernames)

        # Substring search
        res = self.client.get('/api/user/search?q=diana', headers=auth_a)
        self.assertEqual(res.status_code, 200)
        usernames = [u['username'] for u in res.get_json().get('users', [])]
        self.assertIn('diana_node', usernames)

        # By email search
        res = self.client.get('/api/user/search?q=diana@node.org', headers=auth_a)
        self.assertEqual(res.status_code, 200)
        usernames = [u['username'] for u in res.get_json().get('users', [])]
        self.assertIn('diana_node', usernames)

    def test_search_requires_authentication(self):
        """Unauthenticated requests to /api/user/search are rejected with 401."""
        res = self.client.get('/api/user/search?q=anyone')
        self.assertEqual(res.status_code, 401)

    def test_empty_search_query_returns_empty_results(self):
        token = self._register_and_login('echo_user', 'echo@test.com')
        res = self.client.get('/api/user/search?q=', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json().get('users'), [])


if __name__ == '__main__':
    unittest.main()
