import os
import sys
import io
import unittest
import shutil
import tempfile
from datetime import datetime, timedelta
from unittest.mock import patch

# Ensure backend path is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Force isolated test environment (must be set before config import)
os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_uri = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'latticelink_test.db').replace(os.sep, '/')}"

if 'DATABASE_URL' not in os.environ:
    os.environ['DATABASE_URL'] = test_db_uri

from config import Config
from app import app
from models import db, User, Session, ContactRequest, Status, StatusView

PASSWORD = 'StatusTestPass123!'

# 1x1 transparent PNG (valid image magic bytes)
PNG_BYTES = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01'
    b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
)

# Minimal ISO-BMFF (MP4) header: 4-byte size + 'ftyp'
MP4_BYTES = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom' + b'\x00' * 64


class TestStatusFeature(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
        cls._media_dir = tempfile.mkdtemp(prefix='ll_status_test_')
        cls._patcher = patch.object(Config, 'UPLOAD_FOLDER', cls._media_dir)
        cls._patcher.start()
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_status_feature setUpClass", uri=test_db_uri)
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        cls._patcher.stop()
        shutil.rmtree(cls._media_dir, ignore_errors=True)

    def setUp(self):
        self.client = app.test_client()

    def tearDown(self):
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_status_feature tearDown",
                                                       uri=app.config['SQLALCHEMY_DATABASE_URI'])
            db.session.rollback()
            for table in reversed(db.metadata.sorted_tables):
                db.session.execute(table.delete())
            db.session.commit()
            db.session.remove()
        # remove media written during the test
        for root, _dirs, files in os.walk(self._media_dir):
            for f in files:
                try:
                    os.remove(os.path.join(root, f))
                except OSError:
                    pass

    # -----------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------

    def _register_and_login(self, username):
        """Register + verify + login through the real auth endpoints."""
        payload = {
            'username': username,
            'email': f'{username}@status.test',
            'password': PASSWORD,
            'security_question': 'Favorite cipher?',
            'security_answer': 'aes',
        }
        with patch('routes.auth_routes.send_verification_otp') as mock_send:
            res = self.client.post('/api/auth/register', json=payload)
            self.assertEqual(res.status_code, 201, res.get_json())
            otp = mock_send.call_args[0][2]
        res = self.client.post('/api/auth/verify-email',
                               json={'username': username, 'otp': otp})
        self.assertEqual(res.status_code, 200, res.get_json())

        res = self.client.post('/api/auth/login',
                               json={'username': username, 'password': PASSWORD})
        self.assertEqual(res.status_code, 200, res.get_json())
        return res.get_json()['session_token']

    @staticmethod
    def _auth(token):
        return {'Authorization': f'Bearer {token}'}

    def _make_contact(self, user_a, user_b):
        """Create an accepted contact relationship between two usernames."""
        with app.app_context():
            db.session.add(ContactRequest(
                id=f'CR-{user_a}-{user_b}',
                sender=user_a, receiver=user_b, status='accepted'
            ))
            db.session.commit()

    def _create_text_status(self, token, text='Hello status', color='#112233'):
        return self.client.post('/api/status/create',
                                headers=self._auth(token),
                                json={'type': 'text', 'text': text, 'bg_color': color})

    # -----------------------------------------------------------
    # A. Creation + authentication
    # -----------------------------------------------------------

    def test_create_requires_authentication(self):
        res = self.client.post('/api/status/create', json={'type': 'text', 'text': 'hi'})
        self.assertEqual(res.status_code, 401)

    def test_feed_requires_authentication(self):
        res = self.client.get('/api/status/feed')
        self.assertEqual(res.status_code, 401)

    def test_create_text_status(self):
        token = self._register_and_login('status_alice')
        res = self._create_text_status(token, text='Shipping day!', color='#3b82f6')
        self.assertEqual(res.status_code, 201, res.get_json())
        data = res.get_json()['status']
        self.assertTrue(data['id'].startswith('ST-'))
        self.assertEqual(data['type'], 'text')
        self.assertEqual(data['text'], 'Shipping day!')
        self.assertEqual(data['bg_color'], '#3b82f6')
        self.assertTrue(data['is_mine'])
        # Expiry is exactly 24h after creation
        created = datetime.strptime(data['created_at'], '%Y-%m-%d %H:%M:%S')
        expires = datetime.strptime(data['expires_at'], '%Y-%m-%d %H:%M:%S')
        self.assertAlmostEqual((expires - created).total_seconds(), 24 * 3600, delta=5)

    def test_create_text_status_via_multipart_without_file(self):
        """The UI composer always posts multipart/form-data, even for text-only
        statuses with no file part. That path must be accepted (regression)."""
        token = self._register_and_login('status_alice')
        res = self.client.post(
            '/api/status/create', headers=self._auth(token),
            data={'text': 'multipart text only', 'bg_color': '#10b981'},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201, res.get_json())
        status = res.get_json()['status']
        self.assertEqual(status['type'], 'text')
        self.assertEqual(status['text'], 'multipart text only')
        self.assertEqual(status['bg_color'], '#10b981')
        self.assertFalse(status['has_media'])

    def test_create_text_status_rejects_empty_and_bad_color(self):
        token = self._register_and_login('status_alice')
        res = self.client.post('/api/status/create', headers=self._auth(token),
                               json={'type': 'text', 'text': '   '})
        self.assertEqual(res.status_code, 400)

        res = self.client.post('/api/status/create', headers=self._auth(token),
                               json={'type': 'text', 'text': 'ok', 'bg_color': 'javascript:alert(1)'})
        self.assertEqual(res.status_code, 400)

    def test_create_image_status_uploads_media(self):
        token = self._register_and_login('status_alice')
        data = {'text': 'photo time', 'bg_color': '#101828'}
        res = self.client.post(
            '/api/status/create', headers=self._auth(token),
            data={'file': (io.BytesIO(PNG_BYTES), 'pic.png'),
                  'text': data['text'], 'bg_color': data['bg_color']},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201, res.get_json())
        status = res.get_json()['status']
        self.assertEqual(status['type'], 'image')
        self.assertTrue(status['has_media'])
        self.assertEqual(status['media_mimetype'], 'image/png')

        # media file exists under the isolated uploads root (no absolute path leak)
        with app.app_context():
            rec = Status.query.get(status['id'])
            self.assertIsNotNone(rec)
            abs_path = os.path.abspath(os.path.join(Config.UPLOAD_FOLDER, rec.media_path))
            self.assertTrue(abs_path.startswith(os.path.abspath(Config.UPLOAD_FOLDER)))
            self.assertTrue(os.path.isfile(abs_path))
            self.assertNotIn(Config.BASE_DIR + os.sep, rec.media_path)  # relative only

        # media streams back with 200
        res = self.client.get(f"/api/status/{status['id']}/media?token={token}")
        self.assertEqual(res.status_code, 200)

    def test_create_video_status(self):
        token = self._register_and_login('status_alice')
        res = self.client.post(
            '/api/status/create', headers=self._auth(token),
            data={'file': (io.BytesIO(MP4_BYTES), 'clip.mp4'), 'text': 'video'},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201, res.get_json())
        self.assertEqual(res.get_json()['status']['type'], 'video')

    # -----------------------------------------------------------
    # B. Media validation
    # -----------------------------------------------------------

    def test_rejects_unsupported_media_type(self):
        token = self._register_and_login('status_alice')
        res = self.client.post(
            '/api/status/create', headers=self._auth(token),
            data={'file': (io.BytesIO(b'#!/bin/sh\necho pwn\n'), 'evil.sh'),
                  'text': 'x'},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 415)

    def test_rejects_content_that_does_not_match_declared_type(self):
        """Client claims image/png but payload is plain text -> magic-byte sniff fails."""
        token = self._register_and_login('status_alice')
        res = self.client.post(
            '/api/status/create', headers=self._auth(token),
            data={'file': (io.BytesIO(b'this is definitely not an image at all'),
                           'fake.png'),
                  'text': 'x'},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 415)

    def test_rejects_oversized_media(self):
        token = self._register_and_login('status_alice')
        with patch('routes.status_routes.MAX_MEDIA_BYTES', 1024):
            res = self.client.post(
                '/api/status/create', headers=self._auth(token),
                data={'file': (io.BytesIO(PNG_BYTES + b'\x00' * 4096), 'big.png'),
                      'text': 'x'},
                content_type='multipart/form-data')
        self.assertEqual(res.status_code, 413)

    def test_sanitizes_text_and_enforces_length(self):
        token = self._register_and_login('status_alice')
        res = self.client.post('/api/status/create', headers=self._auth(token),
                               json={'type': 'text', 'text': 'A' * 2000})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(len(res.get_json()['status']['text']), 500)

        # control characters are stripped
        res = self.client.post('/api/status/create', headers=self._auth(token),
                               json={'type': 'text', 'text': 'bad\x00\x07ctrl'})
        self.assertEqual(res.status_code, 201)
        self.assertNotIn('\x00', res.get_json()['status']['text'])

    # -----------------------------------------------------------
    # C. Visibility / authorization
    # -----------------------------------------------------------

    def test_feed_shows_own_and_contact_statuses_only(self):
        alice = self._register_and_login('status_alice')
        bob = self._register_and_login('status_bob')
        carol = self._register_and_login('status_carol')  # NOT a contact of alice
        self._make_contact('status_alice', 'status_bob')

        self.assertEqual(self._create_text_status(alice, text='from alice').status_code, 201)
        self.assertEqual(self._create_text_status(bob, text='from bob').status_code, 201)
        self.assertEqual(self._create_text_status(carol, text='from carol').status_code, 201)

        res = self.client.get('/api/status/feed', headers=self._auth(alice))
        self.assertEqual(res.status_code, 200)
        creators = {s['creator'] for s in res.get_json()['statuses']}
        self.assertEqual(creators, {'status_alice', 'status_bob'})
        self.assertNotIn('status_carol', creators)

        # unrelated user cannot fetch alice's status directly
        with app.app_context():
            alice_status = Status.query.filter_by(creator='status_alice').first()
        res = self.client.get(f'/api/status/{alice_status.id}', headers=self._auth(carol))
        self.assertEqual(res.status_code, 403)
        res = self.client.get(f"/api/status/{alice_status.id}/media?token={carol}")
        self.assertEqual(res.status_code, 403)
        res = self.client.post(f'/api/status/{alice_status.id}/view', headers=self._auth(carol))
        self.assertEqual(res.status_code, 403)

    def test_feed_marks_viewed_unviewed_and_owner_counts(self):
        alice = self._register_and_login('status_alice')
        bob = self._register_and_login('status_bob')
        self._make_contact('status_alice', 'status_bob')

        self._create_text_status(alice, text='alice story')
        bob_status = self._create_text_status(bob, text='bob story').get_json()['status']

        # bob views alice's status
        with app.app_context():
            alice_status = Status.query.filter_by(creator='status_alice').first()
        res = self.client.post(f'/api/status/{alice_status.id}/view', headers=self._auth(bob))
        self.assertEqual(res.status_code, 200)

        # alice sees viewer count on her own status
        res = self.client.get('/api/status/feed', headers=self._auth(alice))
        own = [s for s in res.get_json()['statuses'] if s['creator'] == 'status_alice'][0]
        self.assertEqual(own['view_count'], 1)
        self.assertTrue(own['is_mine'])

        # bob's feed shows alice's status as viewed, his own as not applicable
        res = self.client.get('/api/status/feed', headers=self._auth(bob))
        feed = res.get_json()['statuses']
        alice_entry = [s for s in feed if s['creator'] == 'status_alice'][0]
        self.assertTrue(alice_entry['viewed'])
        self.assertIsNone(alice_entry['view_count'])  # private: others' counts hidden
        bob_entry = [s for s in feed if s['creator'] == 'status_bob'][0]
        self.assertFalse(bob_entry['viewed'])
        self.assertEqual(bob_entry['id'], bob_status['id'])

    def test_view_on_own_status_rejected(self):
        alice = self._register_and_login('status_alice')
        status_id = self._create_text_status(alice, text='mine').get_json()['status']['id']
        res = self.client.post(f'/api/status/{status_id}/view', headers=self._auth(alice))
        self.assertEqual(res.status_code, 400)

    # -----------------------------------------------------------
    # D. View tracking + duplicate prevention
    # -----------------------------------------------------------

    def test_duplicate_views_are_recorded_once(self):
        alice = self._register_and_login('status_alice')
        bob = self._register_and_login('status_bob')
        self._make_contact('status_alice', 'status_bob')
        status_id = self._create_text_status(alice, text='watch me').get_json()['status']['id']

        res = self.client.post(f'/api/status/{status_id}/view', headers=self._auth(bob))
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(body['view_count'], 1)
        self.assertFalse(body['already_viewed'])

        # second + third attempts must not create duplicate records
        res = self.client.post(f'/api/status/{status_id}/view', headers=self._auth(bob))
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertTrue(body['already_viewed'])
        self.assertEqual(body['view_count'], 1)

        with app.app_context():
            self.assertEqual(StatusView.query.filter_by(status_id=status_id).count(), 1)

    def test_owner_viewer_list_and_privacy(self):
        alice = self._register_and_login('status_alice')
        bob = self._register_and_login('status_bob')
        carol = self._register_and_login('status_carol')
        self._make_contact('status_alice', 'status_bob')
        status_id = self._create_text_status(alice, text='who saw me').get_json()['status']['id']

        self.client.post(f'/api/status/{status_id}/view', headers=self._auth(bob))

        # owner sees the viewer list
        res = self.client.get(f'/api/status/{status_id}/views', headers=self._auth(alice))
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(body['view_count'], 1)
        self.assertEqual(body['viewers'][0]['username'], 'status_bob')

        # non-owner (even a contact) cannot see private viewer info
        res = self.client.get(f'/api/status/{status_id}/views', headers=self._auth(bob))
        self.assertEqual(res.status_code, 403)
        # unrelated user also blocked
        res = self.client.get(f'/api/status/{status_id}/views', headers=self._auth(carol))
        self.assertEqual(res.status_code, 403)

    # -----------------------------------------------------------
    # E. Expiry enforcement (backend)
    # -----------------------------------------------------------

    def test_expired_status_excluded_and_inaccessible(self):
        alice = self._register_and_login('status_alice')
        bob = self._register_and_login('status_bob')
        self._make_contact('status_alice', 'status_bob')
        status_id = self._create_text_status(alice, text='old news').get_json()['status']['id']

        # force the status past its expiry
        with app.app_context():
            rec = Status.query.get(status_id)
            rec.expires_at = datetime.utcnow() - timedelta(minutes=1)
            db.session.commit()

        # direct fetch -> 410 Gone (before any purge-triggering call)
        res = self.client.get(f'/api/status/{status_id}', headers=self._auth(bob))
        self.assertEqual(res.status_code, 410)

        # viewing an expired status -> 410, and no view row is written
        res = self.client.post(f'/api/status/{status_id}/view', headers=self._auth(bob))
        self.assertEqual(res.status_code, 410)
        with app.app_context():
            self.assertEqual(StatusView.query.filter_by(status_id=status_id).count(), 0)

        # not in the active feed (and the expired row gets purged server-side)
        res = self.client.get('/api/status/feed', headers=self._auth(bob))
        self.assertEqual(res.status_code, 200)
        ids = [s['id'] for s in res.get_json()['statuses']]
        self.assertNotIn(status_id, ids)
        with app.app_context():
            self.assertIsNone(db.session.get(Status, status_id))

    def test_expired_media_returns_410_and_purges_rows(self):
        alice = self._register_and_login('status_alice')
        res = self.client.post(
            '/api/status/create', headers=self._auth(alice),
            data={'file': (io.BytesIO(PNG_BYTES), 'pic.png'), 'text': 'x'},
            content_type='multipart/form-data')
        status_id = res.get_json()['status']['id']

        with app.app_context():
            rec = Status.query.get(status_id)
            rec.expires_at = datetime.utcnow() - timedelta(hours=1)
            db.session.commit()

        res = self.client.get(f"/api/status/{status_id}/media?token={alice}")
        self.assertEqual(res.status_code, 410)

        # any subsequent feed access purges the expired rows (backend enforcement)
        res = self.client.get('/api/status/feed', headers=self._auth(alice))
        self.assertEqual(res.status_code, 200)
        with app.app_context():
            self.assertIsNone(db.session.get(Status, status_id))
            self.assertEqual(StatusView.query.filter_by(status_id=status_id).count(), 0)

    # -----------------------------------------------------------
    # F. Deletion permissions
    # -----------------------------------------------------------

    def test_owner_can_delete_own_status(self):
        alice = self._register_and_login('status_alice')
        status_id = self._create_text_status(alice, text='delete me').get_json()['status']['id']

        res = self.client.delete(f'/api/status/{status_id}', headers=self._auth(alice))
        self.assertEqual(res.status_code, 200)
        res = self.client.get(f'/api/status/{status_id}', headers=self._auth(alice))
        self.assertEqual(res.status_code, 404)
        with app.app_context():
            self.assertIsNone(db.session.get(Status, status_id))

    def test_cannot_delete_another_users_status(self):
        alice = self._register_and_login('status_alice')
        bob = self._register_and_login('status_bob')
        self._make_contact('status_alice', 'status_bob')
        status_id = self._create_text_status(alice, text='keep me').get_json()['status']['id']

        res = self.client.delete(f'/api/status/{status_id}', headers=self._auth(bob))
        self.assertEqual(res.status_code, 403)
        with app.app_context():
            self.assertIsNotNone(db.session.get(Status, status_id))

        # unauthenticated delete attempt
        res = self.client.delete(f'/api/status/{status_id}')
        self.assertEqual(res.status_code, 401)

    # -----------------------------------------------------------
    # G. Missing status handling
    # -----------------------------------------------------------

    def test_missing_status_returns_404(self):
        alice = self._register_and_login('status_alice')
        res = self.client.get('/api/status/ST-DOESNOT0', headers=self._auth(alice))
        self.assertEqual(res.status_code, 404)
        res = self.client.post('/api/status/ST-DOESNOT0/view', headers=self._auth(alice))
        self.assertEqual(res.status_code, 404)
        res = self.client.delete('/api/status/ST-DOESNOT0', headers=self._auth(alice))
        self.assertEqual(res.status_code, 404)


if __name__ == '__main__':
    unittest.main()
