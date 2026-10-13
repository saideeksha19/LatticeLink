import os
import sys
import json
import unittest
from unittest.mock import patch

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ['LATTICELINK_TEST_MODE'] = 'True'
_test_db_uri = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'latticelink_test.db').replace(os.sep, '/')}"
os.environ['DATABASE_URL'] = _test_db_uri

from config import Config
from app import app
from models import db, User, Poll, PollOption, PollVote, ChatCustomization


def _hdr(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


def _register_and_login(client, username):
    """Register, force-verify, and login a test user. Returns session_token."""
    with patch('routes.auth_routes.send_verification_otp') as mock_send:
        r = client.post('/api/auth/register', json={
            'username': username,
            'email': f'{username}@pt.latticelink',
            'password': 'SecurePass123!',
            'securityQuestion': 'Pet?',
            'securityAnswer': 'cat',
            'verificationMethod': 'email'
        })
        # Force-verify by reading the dispatched OTP
        if mock_send.called and r.status_code == 201:
            otp_code = mock_send.call_args[0][2] if mock_send.call_args[0] else None
            if otp_code:
                client.post('/api/auth/verify-email', json={'username': username, 'otp': otp_code})

    # Also force-verify directly in DB as fallback
    with app.app_context():
        u = User.query.filter_by(username=username).first()
        if u:
            u.is_verified = True
            db.session.commit()

    r2 = client.post('/api/auth/login', json={
        'username': username,
        'password': 'SecurePass123!'
    })
    data = r2.get_json() or {}
    return data.get('session_token') or data.get('token') or ''


class PollThemeTestCase(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = _test_db_uri
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_polls_and_themes setUpClass", uri=_test_db_uri)
            db.create_all()
        cls.client = app.test_client()

    def setUp(self):
        # Clean poll/customization tables before each test
        with app.app_context():
            PollVote.query.delete()
            PollOption.query.delete()
            Poll.query.delete()
            ChatCustomization.query.delete()
            db.session.commit()

        self.t1 = _register_and_login(self.client, 'polluser1')
        self.t2 = _register_and_login(self.client, 'polluser2')
        self.t3 = _register_and_login(self.client, 'outsider99')

    def _conv_id(self, a, b):
        return '-'.join(sorted([a, b]))

    def _create_poll(self, creator_token=None, conv=None, allow_change=True, options=None):
        if creator_token is None:
            creator_token = self.t1
        if conv is None:
            conv = self._conv_id('polluser1', 'polluser2')
        r = self.client.post('/api/polls/create',
            headers=_hdr(creator_token),
            json={
                'conversation_id': conv,
                'question': 'Vote test?',
                'options': options or ['Alpha', 'Beta'],
                'allow_change_vote': allow_change
            })
        self.assertEqual(r.status_code, 201, r.get_data(as_text=True))
        data = r.get_json()
        return data['poll']['id'], data['poll']['options']

    # ── Creation ──────────────────────────────────────────────────────────────

    def test_create_poll_success(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post('/api/polls/create',
            headers=_hdr(self.t1),
            json={'conversation_id': cid, 'question': 'Best PQC?',
                  'options': ['ML-KEM', 'ML-DSA', 'SPHINCS+']})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(r.get_json()['poll']['options']), 3)

    def test_create_poll_too_few_options(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post('/api/polls/create',
            headers=_hdr(self.t1),
            json={'conversation_id': cid, 'question': 'Q?', 'options': ['Only one']})
        self.assertEqual(r.status_code, 400)

    def test_create_poll_too_many_options(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post('/api/polls/create',
            headers=_hdr(self.t1),
            json={'conversation_id': cid, 'question': 'Q?',
                  'options': [f'opt{i}' for i in range(11)]})
        self.assertEqual(r.status_code, 400)

    def test_create_poll_duplicate_options(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post('/api/polls/create',
            headers=_hdr(self.t1),
            json={'conversation_id': cid, 'question': 'Q?', 'options': ['yes', 'Yes']})
        self.assertEqual(r.status_code, 400)

    def test_create_poll_empty_question(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post('/api/polls/create',
            headers=_hdr(self.t1),
            json={'conversation_id': cid, 'question': '', 'options': ['A', 'B']})
        self.assertEqual(r.status_code, 400)

    def test_outsider_cannot_create_poll(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post('/api/polls/create',
            headers=_hdr(self.t3),
            json={'conversation_id': cid, 'question': 'Snoop?', 'options': ['A', 'B']})
        self.assertEqual(r.status_code, 403)

    # ── Voting ────────────────────────────────────────────────────────────────

    def test_vote_success(self):
        poll_id, opts = self._create_poll()
        r = self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t2), json={'option_id': opts[0]['id']})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()['poll']['total_votes'], 1)

    def test_duplicate_vote_rejected_when_change_disabled(self):
        poll_id, opts = self._create_poll(allow_change=False)
        self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t2), json={'option_id': opts[0]['id']})
        r2 = self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t2), json={'option_id': opts[1]['id']})
        self.assertEqual(r2.status_code, 409)

    def test_vote_change_allowed_when_enabled(self):
        poll_id, opts = self._create_poll(allow_change=True)
        self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t2), json={'option_id': opts[0]['id']})
        r2 = self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t2), json={'option_id': opts[1]['id']})
        self.assertEqual(r2.status_code, 200)

    def test_outsider_cannot_vote(self):
        poll_id, opts = self._create_poll()
        r = self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t3), json={'option_id': opts[0]['id']})
        self.assertEqual(r.status_code, 403)

    def test_vote_on_closed_poll_rejected(self):
        poll_id, opts = self._create_poll()
        self.client.post(f'/api/polls/{poll_id}/close', headers=_hdr(self.t1))
        r = self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t2), json={'option_id': opts[0]['id']})
        self.assertEqual(r.status_code, 409)

    def test_invalid_option_id_rejected(self):
        poll_id, _ = self._create_poll()
        r = self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t2), json={'option_id': 999999})
        self.assertEqual(r.status_code, 400)

    # ── Closure ───────────────────────────────────────────────────────────────

    def test_creator_can_close_poll(self):
        poll_id, _ = self._create_poll()
        r = self.client.post(f'/api/polls/{poll_id}/close', headers=_hdr(self.t1))
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()['poll']['is_closed'])

    def test_non_creator_cannot_close_poll(self):
        poll_id, _ = self._create_poll()
        r = self.client.post(f'/api/polls/{poll_id}/close', headers=_hdr(self.t2))
        self.assertEqual(r.status_code, 403)

    def test_outsider_cannot_close_poll(self):
        poll_id, _ = self._create_poll()
        r = self.client.post(f'/api/polls/{poll_id}/close', headers=_hdr(self.t3))
        self.assertEqual(r.status_code, 403)

    # ── Results ───────────────────────────────────────────────────────────────

    def test_get_poll_with_results(self):
        poll_id, opts = self._create_poll()
        self.client.post(f'/api/polls/{poll_id}/vote',
            headers=_hdr(self.t1), json={'option_id': opts[0]['id']})
        r = self.client.get(f'/api/polls/{poll_id}', headers=_hdr(self.t2))
        self.assertEqual(r.status_code, 200)
        data = r.get_json()['poll']
        self.assertEqual(data['total_votes'], 1)
        vote_opt = next(o for o in data['options'] if o['id'] == opts[0]['id'])
        self.assertEqual(vote_opt['count'], 1)
        self.assertEqual(vote_opt['percentage'], 100.0)

    def test_outsider_cannot_fetch_poll(self):
        poll_id, _ = self._create_poll()
        r = self.client.get(f'/api/polls/{poll_id}', headers=_hdr(self.t3))
        self.assertEqual(r.status_code, 403)

    # ── Chat Customization ────────────────────────────────────────────────────

    def test_save_and_fetch_customization(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post(f'/api/polls/customization/{cid}',
            headers=_hdr(self.t1),
            json={'theme': 'teal', 'wallpaper_type': 'preset',
                  'wallpaper_value': 'circuit', 'wallpaper_overlay': 0.3})
        self.assertEqual(r.status_code, 200)
        r2 = self.client.get(f'/api/polls/customization/{cid}', headers=_hdr(self.t1))
        cust = r2.get_json()['customization']
        self.assertEqual(cust['theme'], 'teal')
        self.assertAlmostEqual(cust['wallpaper_overlay'], 0.3, places=2)

    def test_invalid_theme_rejected(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post(f'/api/polls/customization/{cid}',
            headers=_hdr(self.t1), json={'theme': 'rainbow'})
        self.assertEqual(r.status_code, 400)

    def test_outsider_cannot_set_customization(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post(f'/api/polls/customization/{cid}',
            headers=_hdr(self.t3), json={'theme': 'neutral'})
        self.assertEqual(r.status_code, 403)

    def test_customization_is_per_user(self):
        cid = self._conv_id('polluser1', 'polluser2')
        self.client.post(f'/api/polls/customization/{cid}',
            headers=_hdr(self.t1), json={'theme': 'coral'})
        self.client.post(f'/api/polls/customization/{cid}',
            headers=_hdr(self.t2), json={'theme': 'purple'})
        r1 = self.client.get(f'/api/polls/customization/{cid}', headers=_hdr(self.t1))
        r2 = self.client.get(f'/api/polls/customization/{cid}', headers=_hdr(self.t2))
        self.assertEqual(r1.get_json()['customization']['theme'], 'coral')
        self.assertEqual(r2.get_json()['customization']['theme'], 'purple')

    def test_wallpaper_overlay_clamped(self):
        cid = self._conv_id('polluser1', 'polluser2')
        r = self.client.post(f'/api/polls/customization/{cid}',
            headers=_hdr(self.t1),
            json={'theme': 'neutral', 'wallpaper_overlay': 5.0})
        self.assertEqual(r.status_code, 200)
        self.assertLessEqual(r.get_json()['customization']['wallpaper_overlay'], 0.9)

    def test_default_customization_when_not_set(self):
        cid = self._conv_id('outsider99', 'polluser1')
        r = self.client.get(f'/api/polls/customization/{cid}', headers=_hdr(self.t3))
        self.assertEqual(r.status_code, 200)
        cust = r.get_json()['customization']
        self.assertEqual(cust['theme'], 'neutral')
        self.assertEqual(cust['wallpaper_type'], 'default')

    # ── Appearance (via User Settings) ────────────────────────────────────────

    def test_save_appearance_setting(self):
        r = self.client.post('/api/user/update_profile',
            headers=_hdr(self.t1),
            json={'settings': {'appearance': {'darkMode': False, 'mode': 'light'}}})
        self.assertIn(r.status_code, [200, 201])
        settings = r.get_json()['user']['settings']
        self.assertEqual(settings['appearance']['mode'], 'light')


if __name__ == '__main__':
    unittest.main()
