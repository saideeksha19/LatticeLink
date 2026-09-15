"""
Unit tests for the Brevo-API email service.

These tests mock the provider HTTP layer entirely: no network calls are made
and no real API key is used. They verify that:
  - verification and password-reset OTPs are dispatched to the RECIPIENT
    email passed in (dynamic per-user delivery)
  - BREVO_API_KEY and MAIL_DEFAULT_SENDER are sourced from the environment
    only, and the API key never appears in logs, payloads, or error messages
  - missing configuration raises SMTPConfigurationError (HTTP 503 path)
  - provider errors (401/403/500, timeouts, network failures) raise
    SMTPSendError (HTTP 500 path) without leaking secrets
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
    'BREVO_API_KEY': 'test-dummy-brevo-api-key',
    'MAIL_DEFAULT_SENDER': 'latticelink.test.sender@gmail.com',
}


def _make_urlopen_mock(status=201, body=b'{"messageId": "test-message-id"}'):
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


class TestBrevoEmailService(unittest.TestCase):
    # ---------------------------------------------------------------
    # A. New registration-style dispatch / F. dynamic recipients
    # ---------------------------------------------------------------
    def test_verification_otp_sent_to_dynamic_recipient(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(send_verification_otp('userA@example.com', 'alice', '123456'))
                self.assertTrue(send_verification_otp('userB@yahoo.com', 'bob', '654321'))

        self.assertEqual(urlopen.call_count, 2)
        first_req, second_req = urlopen.call_args_list[0][0][0], urlopen.call_args_list[1][0][0]
        self.assertEqual(json.loads(first_req.data.decode('utf-8'))['to'], [{'email': 'userA@example.com'}])
        self.assertEqual(json.loads(second_req.data.decode('utf-8'))['to'], [{'email': 'userB@yahoo.com'}])

    def test_request_contract_matches_brevo_api(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                send_verification_otp('userA@example.com', 'alice', '123456')

        req = urlopen.call_args[0][0]
        self.assertEqual(req.full_url, 'https://api.brevo.com/v3/smtp/email')
        self.assertEqual(req.get_method(), 'POST')
        # API key travels in the header only
        self.assertEqual(req.headers.get('Api-key'), 'test-dummy-brevo-api-key')
        self.assertEqual(req.headers.get('Content-type'), 'application/json')
        # API key must NOT appear anywhere in the JSON payload
        self.assertNotIn(TEST_ENV['BREVO_API_KEY'], req.data.decode('utf-8'))

        payload = json.loads(req.data.decode('utf-8'))
        self.assertEqual(payload['sender'], {'name': 'LatticeLink', 'email': 'latticelink.test.sender@gmail.com'})
        self.assertIn('123456', payload['textContent'])
        self.assertIn('123456', payload['htmlContent'])

    # ---------------------------------------------------------------
    # E. Password reset dispatch
    # ---------------------------------------------------------------
    def test_password_reset_otp_sent_to_recipient(self):
        urlopen = _make_urlopen_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                self.assertTrue(send_password_reset_otp('resetter@gmail.com', 'carol', '246810'))

        payload = json.loads(urlopen.call_args[0][0].data.decode('utf-8'))
        self.assertEqual(payload['to'], [{'email': 'resetter@gmail.com'}])
        self.assertIn('246810', payload['textContent'])
        self.assertIn('Password Reset', payload['subject'])

    # ---------------------------------------------------------------
    # G. Missing configuration -> safe, clear error, no provider call
    # ---------------------------------------------------------------
    def test_missing_api_key_raises_configuration_error(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('BREVO_API_KEY', None)
            urlopen = _make_urlopen_mock()
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPConfigurationError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('BREVO_API_KEY is not configured', str(ctx.exception))
        urlopen.assert_not_called()

    def test_missing_sender_raises_configuration_error(self):
        with patch.dict(os.environ, {'BREVO_API_KEY': 'test-dummy-brevo-api-key'}, clear=False):
            os.environ.pop('MAIL_DEFAULT_SENDER', None)
            os.environ.pop('MAIL_FROM', None)
            urlopen = _make_urlopen_mock()
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPConfigurationError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('MAIL_DEFAULT_SENDER is not configured', str(ctx.exception))
        urlopen.assert_not_called()

    # ---------------------------------------------------------------
    # Provider failure paths (C/D-adjacent: delivery errors, not OTP logic)
    # ---------------------------------------------------------------
    def test_provider_401_raises_send_error_without_leaking_key(self):
        http_error = urllib.error.HTTPError(
            'https://api.brevo.com/v3/smtp/email', 401, 'Unauthorized', {},
            io.BytesIO(b'{"code": "unauthorized", "message": "invalid key test-dummy-brevo-api-key"}')
        )
        urlopen = MagicMock(side_effect=http_error)
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertIn('rejected the server credentials', str(ctx.exception))
        self.assertNotIn(TEST_ENV['BREVO_API_KEY'], str(ctx.exception))

    def test_provider_500_raises_generic_send_error(self):
        http_error = urllib.error.HTTPError(
            'https://api.brevo.com/v3/smtp/email', 500, 'Internal Server Error', {},
            io.BytesIO(b'{"code": "server_error"}')
        )
        urlopen = MagicMock(side_effect=http_error)
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')

    def test_provider_timeout_raises_send_error(self):
        urlopen = MagicMock(side_effect=TimeoutError('timed out'))
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.urllib.request.urlopen', urlopen):
                with self.assertRaises(SMTPSendError) as ctx:
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        self.assertNotIn('test-dummy-brevo-api-key', str(ctx.exception))

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
            self.assertNotIn(TEST_ENV['BREVO_API_KEY'], call[0][0].data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main(verbosity=2)
