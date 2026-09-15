"""
Unit tests for the AgentMail-API email service.

These tests mock the AgentMail HTTP layer entirely: no network calls are
made and no real API key is used. They verify that:
  - verification and password-reset OTPs are dispatched to the RECIPIENT
    email passed in (dynamic per-user delivery)
  - the request contract matches the documented AgentMail API
    (POST /v0/inboxes/{inbox_id}/messages/send, Bearer auth, JSON body with
    to/subject/text/html, explicit User-Agent)
  - AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID are sourced from the
    environment only, and the API key never appears in logs, payloads,
    or error messages
  - missing configuration raises SMTPConfigurationError (HTTP 503 path)
  - provider errors are mapped accurately (invalid key, unverified account
    blocking external recipients, unknown inbox, conflicts, rate limits,
    5xx) instead of hiding the real cause
  - success is returned ONLY when AgentMail actually accepts the message
    (HTTP 200 with message_id)
  - invalid recipients are rejected before any API call
"""
import os
import sys
import json
import io
import unittest
from unittest.mock import patch, MagicMock

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import urllib.error

from services.email_service import (
    _send_email,
    send_verification_otp,
    send_password_reset_otp,
    SMTPConfigurationError,
    SMTPSendError,
)

TEST_ENV = {
    'AGENTMAIL_API_KEY': 'test-dummy-agentmail-api-key',
    'AGENTMAIL_INBOX_ID': 'test-inbox-id-123',
}

AGENTMAIL_URL = 'https://api.agentmail.to/v0/inboxes/test-inbox-id-123/messages/send'


def _make_urlopen_mock(status=200, body=b'{"message_id": "test-message-id", "thread_id": "test-thread-id"}'):
    """Build a mock for urllib.request.urlopen returning a response-like object.

    Mirrors the real urlopen contract: the object returned by the call is a
    context manager whose __enter__ yields itself (like HTTPResponse).
    """
    response = MagicMock()
    response.status = status
    response.read.return_value = body
    response.getcode.return_value = status
    factory = MagicMock(return_value=response)
    factory.return_value.__enter__.return_value = response
    factory.return_value.__exit__.return_value = False
    return factory


def _http_error(status, reason, body: bytes):
    """Build a real urllib.error.HTTPError like the one urlopen raises."""
    return urllib.error.HTTPError(
        AGENTMAIL_URL, status, reason, {}, io.BytesIO(body)
    )


def _assert_no_secrets(self, ctx):
    """The raised error must never contain key material."""
    text = str(ctx.exception)
    self.assertNotIn(TEST_ENV['AGENTMAIL_API_KEY'], text)
    self.assertNotIn('test-dummy-agentmail-api-key', text)
    self.assertNotIn('Bearer ', text)
    self.assertNotIn('am_', text.replace('AgentMail', ''))


class TestAgentMailEmailService(unittest.TestCase):
    # ---------------------------------------------------------------
    # Successful dispatch / dynamic recipients
    # ---------------------------------------------------------------
    def test_otp_sent_to_user_a_gmail(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(send_verification_otp('userA@gmail.com', 'alice', '123456'))

        payload = json.loads(urlopen.call_args[0][0].data.decode('utf-8'))
        self.assertEqual(payload['to'], ['userA@gmail.com'])
        self.assertIn('123456', payload['text'])
        self.assertIn('123456', payload['html'])

    def test_otp_sent_to_user_b_gmail(self):
        """Second user, same backend: recipient must be B's own address."""
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(send_verification_otp('userB@gmail.com', 'bob', '654321'))

        payload = json.loads(urlopen.call_args[0][0].data.decode('utf-8'))
        self.assertEqual(payload['to'], ['userB@gmail.com'])

    def test_password_reset_otp_sent_to_recipient(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(send_password_reset_otp('resetter@gmail.com', 'carol', '246810'))

        payload = json.loads(urlopen.call_args[0][0].data.decode('utf-8'))
        self.assertEqual(payload['to'], ['resetter@gmail.com'])
        self.assertIn('246810', payload['text'])
        self.assertIn('Password Reset', payload['subject'])

    def test_success_returns_true_only_on_agentmail_acceptance(self):
        """True is returned ONLY on a documented 200 acceptance."""
        urlopen = _make_urlopen_mock(status=200)
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(_send_email('user@example.com', 'S', 't', '<p>h</p>'))

    def test_request_contract_matches_agentmail_api(self):
        """URL (with inbox id), Bearer auth, JSON body, User-Agent."""
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                send_verification_otp('userA@gmail.com', 'alice', '123456')

        req = urlopen.call_args[0][0]
        self.assertEqual(req.full_url, AGENTMAIL_URL)
        self.assertEqual(req.get_method(), 'POST')
        self.assertEqual(req.headers.get('Authorization'), 'Bearer test-dummy-agentmail-api-key')
        self.assertEqual(req.headers.get('Content-type'), 'application/json')
        self.assertEqual(req.headers.get('User-agent'), 'LatticeLink/1.0')
        # API key must NOT appear anywhere in the JSON payload
        self.assertNotIn(TEST_ENV['AGENTMAIL_API_KEY'], req.data.decode('utf-8'))

        payload = json.loads(req.data.decode('utf-8'))
        self.assertEqual(set(payload.keys()), {'to', 'subject', 'text', 'html'})
        self.assertEqual(payload['to'], ['userA@gmail.com'])

    # ---------------------------------------------------------------
    # Configuration errors (HTTP 503 path)
    # ---------------------------------------------------------------
    def test_missing_api_key_raises_configuration_error(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('AGENTMAIL_API_KEY', None)
            os.environ.pop('AGENTMAIL_INBOX_ID', None)
            urlopen = _make_urlopen_mock()
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPConfigurationError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('AGENTMAIL_API_KEY is not configured', str(ctx.exception))
        urlopen.assert_not_called()

    def test_missing_inbox_id_raises_configuration_error(self):
        with patch.dict(os.environ, {'AGENTMAIL_API_KEY': 'test-dummy-agentmail-api-key'}, clear=False):
            os.environ.pop('AGENTMAIL_INBOX_ID', None)
            urlopen = _make_urlopen_mock()
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPConfigurationError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('AGENTMAIL_INBOX_ID is not configured', str(ctx.exception))
        urlopen.assert_not_called()

    # ---------------------------------------------------------------
    # Accurate provider error mapping
    # ---------------------------------------------------------------
    def test_400_validation_error(self):
        urlopen = MagicMock(side_effect=_http_error(
            400, 'Bad Request',
            b'{"name": "validation_error", "message": "Invalid field.", "code": "invalid_request"}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('HTTP 400', str(ctx.exception))
        _assert_no_secrets(self, ctx)

    def test_403_external_recipient_verification_error(self):
        """Unverified AgentMail accounts cannot email external recipients -
        the message must point at account verification, not the API key."""
        urlopen = MagicMock(side_effect=_http_error(
            403, 'Forbidden',
            b'{"name": "message_rejected", "code": "missing_permission", '
            b'"message": "Account is not verified. External recipients are restricted.", '
            b'"fix": "Complete account verification in the AgentMail console."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('other.user@gmail.com', 'Subject', 'text', '<p>html</p>')
        text = str(ctx.exception)
        self.assertIn('external recipients', text)
        self.assertIn('account verification', text)
        self.assertIn('one-time', text)
        self.assertIn('AgentMail console', text)
        _assert_no_secrets(self, ctx)

    def test_403_generic_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            403, 'Forbidden', b'{"name": "forbidden"}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('HTTP 403', str(ctx.exception))
        _assert_no_secrets(self, ctx)

    def test_404_inbox_not_found_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            404, 'Not Found',
            b'{"name": "not_found", "code": "not_found", "message": "Inbox not found."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        text = str(ctx.exception)
        self.assertIn('inbox not found', text.lower())
        self.assertIn('AGENTMAIL_INBOX_ID', text)
        _assert_no_secrets(self, ctx)

    def test_409_conflict_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            409, 'Conflict',
            b'{"name": "conflict", "code": "conflict", "message": "Duplicate send in progress."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('HTTP 409', str(ctx.exception))
        _assert_no_secrets(self, ctx)

    def test_429_rate_limit_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            429, 'Too Many Requests',
            b'{"name": "rate_limited", "message": "Daily limit reached."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        text = str(ctx.exception).lower()
        self.assertIn('rate limit', text)
        self.assertIn('100 emails per day', text)
        _assert_no_secrets(self, ctx)

    def test_5xx_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            503, 'Service Unavailable',
            b'{"name": "internal_error", "message": "Upstream failure."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('Temporary AgentMail provider error', str(ctx.exception))
        _assert_no_secrets(self, ctx)

    def test_html_error_page_never_echoed(self):
        urlopen = MagicMock(side_effect=_http_error(
            502, 'Bad Gateway',
            b'<html><body><h1>502 Gateway</h1><p>upstream proxy detail xyz</p></body></html>'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        text = str(ctx.exception)
        self.assertNotIn('<html>', text)
        self.assertNotIn('upstream proxy detail xyz', text)
        _assert_no_secrets(self, ctx)

    def test_error_with_key_in_provider_body_is_scrubbed(self):
        """A pathological provider response echoing credential-like text
        must still never surface it to the client."""
        urlopen = MagicMock(side_effect=_http_error(
            500, 'Internal Server Error',
            b'{"name": "internal_error", "message": "bad token Bearer test-dummy-agentmail-api-key leaked"}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_no_secrets(self, ctx)

    def test_timeout_raises_send_error_without_secrets(self):
        urlopen = MagicMock(side_effect=TimeoutError('timed out'))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('provider unreachable', str(ctx.exception))
        _assert_no_secrets(self, ctx)

    def test_urlerror_raises_send_error_without_secrets(self):
        urlopen = MagicMock(side_effect=urllib.error.URLError('connection refused'))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('provider unreachable', str(ctx.exception))
        _assert_no_secrets(self, ctx)

    def test_status_none_raises_send_error(self):
        urlopen = MagicMock()
        response = MagicMock()
        response.status = None
        response.getcode.return_value = None
        urlopen.return_value = response
        urlopen.return_value.__enter__.return_value = response
        urlopen.return_value.__exit__.return_value = False
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')

    # ---------------------------------------------------------------
    # Recipient validation / injection protection
    # ---------------------------------------------------------------
    def test_malformed_recipients_are_rejected_before_api_call(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                for bad in ['', 'not-an-email', 'a@b', 'a b@example.com',
                            'user@example.com\r\nBcc: victim@example.com']:
                    with self.assertRaises(SMTPSendError):
                        send_verification_otp(bad, 'mallory', '111111')
        urlopen.assert_not_called()

    # ---------------------------------------------------------------
    # Credential hygiene
    # ---------------------------------------------------------------
    def test_api_key_never_appears_in_payloads(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                send_verification_otp('user@example.com', 'alice', '123456')
                send_password_reset_otp('user@example.com', 'bob', '654321')

        for call in urlopen.call_args_list:
            payload = call[0][0].data.decode('utf-8')
            self.assertNotIn(TEST_ENV['AGENTMAIL_API_KEY'], payload)
            self.assertNotIn('Bearer', payload)


if __name__ == '__main__':
    unittest.main(verbosity=2)
