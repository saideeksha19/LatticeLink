"""
Unit tests for the Resend-API email service.

These tests mock the Resend HTTP layer entirely: no network calls are made
and no real API key is used. They verify that:
  - verification and password-reset OTPs are dispatched to the RECIPIENT
    email passed in (dynamic per-user delivery)
  - the request contract matches Resend (URL, Authorization: Bearer,
    Content-Type, and the explicit User-Agent header)
  - RESEND_API_KEY and RESEND_FROM are sourced from the environment only,
    and the API key never appears in logs, payloads, or error messages
  - missing configuration raises SMTPConfigurationError (HTTP 503 path)
  - provider errors are mapped ACCURATELY (invalid key vs sandbox-only
    sending vs unverified domain vs Cloudflare 1010 vs rate limit vs 5xx)
    instead of blaming the API key for every failure
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
    'RESEND_API_KEY': 'test-dummy-resend-api-key',
    'RESEND_FROM': 'LatticeLink <latticelink.test.sender@yourdomain.com>',
}

RESEND_URL = 'https://api.resend.com/emails'


def _make_urlopen_mock(status=200, body=b'{"id": "test-message-id"}'):
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
        RESEND_URL, status, reason, {}, io.BytesIO(body)
    )


def _assert_error(self, ctx, expected_fragments):
    """Shared assertions: accurate message, no key material anywhere."""
    text = str(ctx.exception)
    for fragment in expected_fragments:
        self.assertIn(fragment, text)
    self.assertNotIn(TEST_ENV['RESEND_API_KEY'], text)
    self.assertNotIn('test-dummy-resend-api-key', text)
    self.assertNotIn('Bearer ', text)


class TestResendEmailService(unittest.TestCase):
    # ---------------------------------------------------------------
    # Successful dispatch / dynamic recipients / request contract
    # ---------------------------------------------------------------
    def test_verification_otp_sent_to_dynamic_recipient(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(send_verification_otp('userA@example.com', 'alice', '123456'))
                self.assertTrue(send_verification_otp('userB@yahoo.com', 'bob', '654321'))

        self.assertEqual(urlopen.call_count, 2)
        first_req, second_req = urlopen.call_args_list[0][0][0], urlopen.call_args_list[1][0][0]
        self.assertEqual(json.loads(first_req.data.decode('utf-8'))['to'], ['userA@example.com'])
        self.assertEqual(json.loads(second_req.data.decode('utf-8'))['to'], ['userB@yahoo.com'])

    def test_password_reset_otp_sent_to_recipient(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(send_password_reset_otp('resetter@gmail.com', 'carol', '246810'))

        payload = json.loads(urlopen.call_args[0][0].data.decode('utf-8'))
        self.assertEqual(payload['to'], ['resetter@gmail.com'])
        self.assertIn('246810', payload['text'])
        self.assertIn('Password Reset', payload['subject'])

    def test_request_contract_matches_resend_api(self):
        """Headers must include Bearer auth, JSON content type, and the
        explicit User-Agent that Resend/Cloudflare require."""
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                send_verification_otp('userA@example.com', 'alice', '123456')

        req = urlopen.call_args[0][0]
        self.assertEqual(req.full_url, RESEND_URL)
        self.assertEqual(req.get_method(), 'POST')
        self.assertEqual(req.headers.get('Authorization'), 'Bearer test-dummy-resend-api-key')
        self.assertEqual(req.headers.get('Content-type'), 'application/json')
        self.assertEqual(req.headers.get('User-agent'), 'LatticeLink/1.0')
        # API key must NOT appear anywhere in the JSON payload
        self.assertNotIn(TEST_ENV['RESEND_API_KEY'], req.data.decode('utf-8'))

        payload = json.loads(req.data.decode('utf-8'))
        self.assertEqual(payload['from'], TEST_ENV['RESEND_FROM'])
        self.assertIn('123456', payload['text'])
        self.assertIn('123456', payload['html'])

    # ---------------------------------------------------------------
    # Configuration errors (HTTP 503 path)
    # ---------------------------------------------------------------
    def test_missing_api_key_raises_configuration_error(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('RESEND_API_KEY', None)
            urlopen = _make_urlopen_mock()
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPConfigurationError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('RESEND_API_KEY is not configured', str(ctx.exception))
        urlopen.assert_not_called()

    def test_missing_sender_raises_configuration_error(self):
        with patch.dict(os.environ, {'RESEND_API_KEY': 'test-dummy-resend-api-key'}, clear=False):
            os.environ.pop('RESEND_FROM', None)
            urlopen = _make_urlopen_mock()
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPConfigurationError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('RESEND_FROM is not configured', str(ctx.exception))
        urlopen.assert_not_called()

    def test_invalid_sender_raises_configuration_error(self):
        with patch.dict(os.environ, {
            'RESEND_API_KEY': 'test-dummy-resend-api-key',
            'RESEND_FROM': 'not-an-email-address',
        }, clear=False):
            urlopen = _make_urlopen_mock()
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPConfigurationError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        urlopen.assert_not_called()

    # ---------------------------------------------------------------
    # Accurate provider error mapping
    # ---------------------------------------------------------------
    def test_invalid_api_key_response(self):
        """Resend reports an invalid key by name - must not be confused
        with a 403 domain/sandbox problem."""
        urlopen = MagicMock(side_effect=_http_error(
            403, 'Forbidden',
            b'{"name": "invalid_api_key", "message": "The API key provided is invalid."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['Resend API key is invalid', 'RESEND_API_KEY'])

    def test_403_sandbox_recipient_restriction_response(self):
        """Free Resend accounts without a verified domain may only send to
        their own account address - the message must say so."""
        urlopen = MagicMock(side_effect=_http_error(
            403, 'Forbidden',
            b'{"name": "validation_error", "message": "You can only send testing emails to your own email address (user@resend.dev) until you verify a domain."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('other.user@gmail.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['sandbox sender', 'verified sending domain'])

    def test_403_unverified_domain_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            403, 'Forbidden',
            b'{"name": "validation_error", "message": "The from address you specified (latticelink.test.sender@yourdomain.com) is not verified."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['not verified in Resend', 'Domains'])

    def test_403_code_1010_user_agent_response(self):
        """Cloudflare error 1010 arrives as an HTML block page with no JSON;
        the message must name the missing User-Agent, not the credentials."""
        html_block_page = (
            b'<html><head><title>Error 1010 Ray ID: 8f</title></head>'
            b'<body><h1>Error 1010</h1><p>The owner of this website has banned '
            b'your access based on your browser\'s signature.</p></body></html>'
        )
        urlopen = MagicMock(side_effect=_http_error(403, 'Forbidden', html_block_page))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['User-Agent header is missing', '1010'])
        # The raw HTML page must never be echoed back
        self.assertNotIn('<html>', str(ctx.exception))

    def test_401_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            401, 'Unauthorized',
            b'{"name": "validation_error", "message": "Missing Authorization header."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['missing or unauthorized', 'HTTP 401'])

    def test_429_rate_limit_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            429, 'Too Many Requests',
            b'{"name": "rate_limit_exceeded", "message": "Too many requests."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['rate limit', '100 emails per day'])

    def test_5xx_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            503, 'Service Unavailable',
            b'{"name": "internal_server_error", "message": "Upstream error."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['Temporary Resend provider error', 'Try again shortly'])

    def test_422_unprocessable_entity_response(self):
        urlopen = MagicMock(side_effect=_http_error(
            422, 'Unprocessable Entity',
            b'{"name": "validation_error", "message": "Invalid to field."}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        _assert_error(self, ctx, ['HTTP 422', 'verified'])

    def test_error_with_key_in_provider_body_is_scrubbed(self):
        """A pathological provider response echoing credential-like text
        must still never surface it to the client."""
        urlopen = MagicMock(side_effect=_http_error(
            500, 'Internal Server Error',
            b'{"name": "internal_server_error", "message": "bad token Bearer test-dummy-resend-api-key leaked"}'
        ))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertNotIn('test-dummy-resend-api-key', str(ctx.exception))

    def test_timeout_raises_send_error_without_secrets(self):
        urlopen = MagicMock(side_effect=TimeoutError('timed out'))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertNotIn('test-dummy-resend-api-key', str(ctx.exception))

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
    def test_invalid_recipients_are_rejected_before_api_call(self):
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
            self.assertNotIn(TEST_ENV['RESEND_API_KEY'], call[0][0].data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main(verbosity=2)
