import os
import sys
import io
import unittest
import shutil
import tempfile
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
from models import db, User, ChatCustomization, ChatWallpaperMedia, ContactRequest

PASSWORD = 'ThemeTestPass123!'

PNG_BYTES = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01'
    b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
)

CONV_AB = 'theme_alice-theme_bob'   # sorted username pair, like getConversationId()


class TestChatThemes(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
        cls._media_dir = tempfile.mkdtemp(prefix='ll_theme_test_')
        cls._patcher = patch.object(Config, 'UPLOAD_FOLDER', cls._media_dir)
        cls._patcher.start()
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_chat_themes setUpClass", uri=test_db_uri)
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        cls._patcher.stop()
        shutil.rmtree(cls._media_dir, ignore_errors=True)

    def setUp(self):
        self.client = app.test_client()

    def tearDown(self):
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_chat_themes tearDown",
                                                       uri=app.config['SQLALCHEMY_DATABASE_URI'])
            db.session.rollback()
            for table in reversed(db.metadata.sorted_tables):
                db.session.execute(table.delete())
            db.session.commit()
            db.session.remove()
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
        payload = {
            'username': username,
            'email': f'{username}@theme.test',
            'password': PASSWORD,
            'security_question': 'Favorite cipher?',
            'security_answer': 'aes',
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

    @staticmethod
    def _auth(token):
        return {'Authorization': f'Bearer {token}'}

    def _make_contact(self, a, b):
        with app.app_context():
            db.session.add(ContactRequest(id=f'CR-{a}-{b}', sender=a, receiver=b, status='accepted'))
            db.session.commit()

    # -----------------------------------------------------------
    # A. Defaults
    # -----------------------------------------------------------

    def test_defaults_for_existing_conversations(self):
        token = self._register_and_login('theme_alice')
        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['is_default'])
        self.assertEqual(data['theme'], 'default')
        self.assertEqual(data['wallpaper'], {'kind': 'default', 'value': None})
        # no row was written just for reading defaults
        with app.app_context():
            self.assertEqual(ChatCustomization.query.count(), 0)

    def test_requires_authentication(self):
        res = self.client.get(f'/api/chat/custom/{CONV_AB}')
        self.assertEqual(res.status_code, 401)
        res = self.client.post(f'/api/chat/custom/{CONV_AB}', json={'theme': 'ocean'})
        self.assertEqual(res.status_code, 401)
        res = self.client.delete(f'/api/chat/custom/{CONV_AB}')
        self.assertEqual(res.status_code, 401)
        res = self.client.post(f'/api/chat/custom/{CONV_AB}/wallpaper',
                               data={'file': (io.BytesIO(PNG_BYTES), 'w.png')},
                               content_type='multipart/form-data')
        self.assertEqual(res.status_code, 401)

    def test_non_member_cannot_access_conversation_prefs(self):
        alice = self._register_and_login('theme_alice')
        bob = self._register_and_login('theme_bob')
        carol = self._register_and_login('theme_carol')  # not in CONV_AB
        self._make_contact('theme_alice', 'theme_bob')

        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(carol))
        self.assertEqual(res.status_code, 403)
        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(carol),
                               json={'theme': 'rose'})
        self.assertEqual(res.status_code, 403)
        res = self.client.delete(f'/api/chat/custom/{CONV_AB}', headers=self._auth(carol))
        self.assertEqual(res.status_code, 403)
        res = self.client.post(f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(carol),
                               data={'file': (io.BytesIO(PNG_BYTES), 'w.png')},
                               content_type='multipart/form-data')
        self.assertEqual(res.status_code, 403)

    # -----------------------------------------------------------
    # B. Saving & restoring preferences
    # -----------------------------------------------------------

    def test_save_and_restore_theme(self):
        token = self._register_and_login('theme_alice')
        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                               json={'theme': 'emerald'})
        self.assertEqual(res.status_code, 200, res.get_json())
        self.assertEqual(res.get_json()['customization']['theme'], 'emerald')

        # restore: a fresh GET (as after page refresh / re-login) returns it
        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertFalse(data['is_default'])
        self.assertEqual(data['theme'], 'emerald')

    def test_save_and_restore_wallpaper(self):
        token = self._register_and_login('theme_alice')
        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                               json={'wallpaper_kind': 'solid', 'wallpaper_value': 'midnight'})
        self.assertEqual(res.status_code, 200, res.get_json())

        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        wp = res.get_json()['wallpaper']
        self.assertEqual(wp['kind'], 'solid')
        self.assertEqual(wp['value'], 'midnight')

        # switch to a gradient
        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                               json={'wallpaper_kind': 'gradient', 'wallpaper_value': 'aurora'})
        self.assertEqual(res.status_code, 200)
        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        self.assertEqual(res.get_json()['wallpaper'], {'kind': 'gradient', 'value': 'aurora'})

    def test_all_whitelisted_themes_accepted(self):
        token = self._register_and_login('theme_alice')
        for theme in ['default', 'emerald', 'ocean', 'violet', 'rose', 'amber', 'monochrome']:
            res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                                   json={'theme': theme})
            self.assertEqual(res.status_code, 200, (theme, res.get_json()))
            self.assertEqual(res.get_json()['customization']['theme'], theme)

    def test_invalid_values_rejected(self):
        token = self._register_and_login('theme_alice')
        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                               json={'theme': 'rainbow'})
        self.assertEqual(res.status_code, 400)

        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                               json={'wallpaper_kind': 'solid', 'wallpaper_value': 'javascript:alert(1)'})
        self.assertEqual(res.status_code, 400)

        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                               json={'wallpaper_kind': 'gradient', 'wallpaper_value': 'nope'})
        self.assertEqual(res.status_code, 400)

        # arbitrary CSS / filesystem paths can never be stored
        res = self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                               json={'wallpaper_kind': 'image', 'wallpaper_value': 'C:\\secret\\x.png'})
        self.assertEqual(res.status_code, 400)

        with app.app_context():
            for row in ChatCustomization.query.all():
                self.assertNotIn('javascript', row.wallpaper_value or '')
                self.assertNotIn('secret', row.wallpaper_value or '')

    # -----------------------------------------------------------
    # C. Isolation between users and conversations
    # -----------------------------------------------------------

    def test_isolation_between_users(self):
        alice = self._register_and_login('theme_alice')
        bob = self._register_and_login('theme_bob')
        self._make_contact('theme_alice', 'theme_bob')

        self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(alice),
                         json={'theme': 'rose', 'wallpaper_kind': 'solid', 'wallpaper_value': 'wine'})

        # Bob's prefs for the same conversation are untouched defaults
        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(bob))
        data = res.get_json()
        self.assertTrue(data['is_default'])
        self.assertEqual(data['theme'], 'default')

        # Alice still has hers
        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(alice))
        self.assertEqual(res.get_json()['theme'], 'rose')

    def test_isolation_between_conversations(self):
        token = self._register_and_login('theme_alice')
        conv2 = 'theme_alice-theme_carol'
        self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                         json={'theme': 'amber'})
        self.client.post(f'/api/chat/custom/{conv2}', headers=self._auth(token),
                         json={'theme': 'violet'})

        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        self.assertEqual(res.get_json()['theme'], 'amber')
        res = self.client.get(f'/api/chat/custom/{conv2}', headers=self._auth(token))
        self.assertEqual(res.get_json()['theme'], 'violet')

    # -----------------------------------------------------------
    # D. Reset
    # -----------------------------------------------------------

    def test_reset_returns_defaults(self):
        token = self._register_and_login('theme_alice')
        self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token),
                         json={'theme': 'ocean', 'wallpaper_kind': 'solid', 'wallpaper_value': 'teal'})

        res = self.client.delete(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['reset'])
        self.assertEqual(data['theme'], 'default')

        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        self.assertTrue(res.get_json()['is_default'])
        with app.app_context():
            self.assertEqual(ChatCustomization.query.count(), 0)

    def test_reset_only_touches_own_row(self):
        alice = self._register_and_login('theme_alice')
        bob = self._register_and_login('theme_bob')
        self._make_contact('theme_alice', 'theme_bob')
        self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(alice), json={'theme': 'rose'})
        self.client.post(f'/api/chat/custom/{CONV_AB}', headers=self._auth(bob), json={'theme': 'ocean'})

        self.client.delete(f'/api/chat/custom/{CONV_AB}', headers=self._auth(alice))
        res = self.client.get(f'/api/chat/custom/{CONV_AB}', headers=self._auth(bob))
        self.assertEqual(res.get_json()['theme'], 'ocean')

    # -----------------------------------------------------------
    # E. Custom wallpaper uploads
    # -----------------------------------------------------------

    def test_valid_image_upload_sets_image_wallpaper(self):
        token = self._register_and_login('theme_alice')
        res = self.client.post(
            f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(token),
            data={'file': (io.BytesIO(PNG_BYTES), 'wall.png')},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201, res.get_json())
        body = res.get_json()
        media_id = body['media']['id']
        self.assertTrue(media_id.startswith('CW-'))
        self.assertEqual(body['customization']['wallpaper']['kind'], 'image')
        self.assertEqual(body['customization']['wallpaper']['value'], media_id)
        self.assertIn('url', body['customization']['wallpaper'])

        # media streams back to owner only
        res = self.client.get(f'/api/chat/custom/wallpaper/{media_id}?token={token}')
        self.assertEqual(res.status_code, 200)

        # stored on disk under the uploads root with a relative DB path
        with app.app_context():
            media = ChatWallpaperMedia.query.get(media_id)
            abs_path = os.path.abspath(os.path.join(Config.UPLOAD_FOLDER, media.path))
            self.assertTrue(abs_path.startswith(os.path.abspath(Config.UPLOAD_FOLDER)))
            self.assertTrue(os.path.isfile(abs_path))

    def test_rejects_unsupported_and_spoofed_images(self):
        token = self._register_and_login('theme_alice')

        # wrong declared type
        res = self.client.post(
            f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(token),
            data={'file': (io.BytesIO(b'#!/bin/sh\necho hi'), 'x.sh')},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 415)

        # declared image/png but content is text -> magic-byte sniff fails
        res = self.client.post(
            f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(token),
            data={'file': (io.BytesIO(b'this is definitely not an image'), 'fake.png')},
            content_type='multipart/form-data')
        self.assertEqual(res.status_code, 415)

        # no file part
        res = self.client.post(
            f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(token),
            data={}, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 400)

    def test_rejects_oversized_upload(self):
        token = self._register_and_login('theme_alice')
        with patch('routes.customization_routes.MAX_WALLPAPER_BYTES', 1024):
            res = self.client.post(
                f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(token),
                data={'file': (io.BytesIO(PNG_BYTES + b'\x00' * 4096), 'big.png')},
                content_type='multipart/form-data')
        self.assertEqual(res.status_code, 413)

    def test_wallpaper_media_owner_only(self):
        alice = self._register_and_login('theme_alice')
        bob = self._register_and_login('theme_bob')
        self._make_contact('theme_alice', 'theme_bob')

        res = self.client.post(
            f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(alice),
            data={'file': (io.BytesIO(PNG_BYTES), 'wall.png')},
            content_type='multipart/form-data')
        media_id = res.get_json()['media']['id']

        res = self.client.get(f'/api/chat/custom/wallpaper/{media_id}?token={bob}')
        self.assertEqual(res.status_code, 403)
        res = self.client.get(f'/api/chat/custom/wallpaper/{media_id}')
        self.assertEqual(res.status_code, 401)

    def test_reset_removes_uploaded_media(self):
        token = self._register_and_login('theme_alice')
        res = self.client.post(
            f'/api/chat/custom/{CONV_AB}/wallpaper', headers=self._auth(token),
            data={'file': (io.BytesIO(PNG_BYTES), 'wall.png')},
            content_type='multipart/form-data')
        media_id = res.get_json()['media']['id']

        res = self.client.delete(f'/api/chat/custom/{CONV_AB}', headers=self._auth(token))
        self.assertEqual(res.status_code, 200)
        with app.app_context():
            self.assertIsNone(db.session.get(ChatWallpaperMedia, media_id))
        res = self.client.get(f'/api/chat/custom/wallpaper/{media_id}?token={token}')
        self.assertEqual(res.status_code, 404)


if __name__ == '__main__':
    unittest.main()
