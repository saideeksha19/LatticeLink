"""
Unit tests for the Resend-based email service.

These tests mock the Resend SDK entirely: no network calls are made and no
real API key is required. They verify that:
  - verification and password-reset OTPs are dispatched via resend.Emails.send
  - RESEND_API_KEY and RESEND_FROM are sourced from the environment only
  - missing configuration raises SMTPConfigurationError (HTTP 503 path)
  - provider failures raise SMTPSendError (HTTP 500 path)
  - the API key never leaks into message content or parameters
"""
import os
import sys
import unittest
from unittest.mock import patch

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services.email_service import (
    _send_email,
    send_verification_otp,
    send_password_reset_otp,
    SMTPConfigurationError,
    SMTPSendError,
)

TEST_ENV = {
    'RESEND_API_KEY': 'test-dummy-resend-api-key',
    'RESEND_FROM': 'LatticeLink Test <test@latticelink.test>',
}


class TestResendEmailService(unittest.TestCase):
    def test_verification_otp_dispatches_via_resend(self):
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.resend.Emails.send') as mock_send:
                mock_send.return_value = {'id': 'test-email-id'}
                result = send_verification_otp('user@example.com', 'alice', '123456')

        self.assertTrue(result)
        mock_send.assert_called_once()
        params = mock_send.call_args[0][0]
        self.assertEqual(params['from'], 'LatticeLink Test <test@latticelink.test>')
        self.assertEqual(params['to'], ['user@example.com'])
        self.assertIn('123456', params['html'])
        self.assertIn('123456', params['text'])
        self.assertNotIn(TEST_ENV['RESEND_API_KEY'], params['html'])
        self.assertNotIn(TEST_ENV['RESEND_API_KEY'], params['text'])

    def test_password_reset_otp_dispatches_via_resend(self):
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.resend.Emails.send') as mock_send:
                mock_send.return_value = {'id': 'test-email-id'}
                result = send_password_reset_otp('user@example.com', 'bob', '654321')

        self.assertTrue(result)
        params = mock_send.call_args[0][0]
        self.assertIn('654321', params['html'])
        self.assertIn('654321', params['text'])
        self.assertNotIn(TEST_ENV['RESEND_API_KEY'], params['html'])

    def test_missing_resend_api_key_raises_configuration_error(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('RESEND_API_KEY', None)
            with patch('services.email_service.resend.Emails.send') as mock_send:
                with self.assertRaises(SMTPConfigurationError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        mock_send.assert_not_called()

    def test_missing_resend_from_raises_configuration_error(self):
        with patch.dict(os.environ, {'RESEND_API_KEY': 'test-dummy-resend-api-key'}, clear=False):
            os.environ.pop('RESEND_FROM', None)
            with patch('services.email_service.resend.Emails.send') as mock_send:
                with self.assertRaises(SMTPConfigurationError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        mock_send.assert_not_called()

    def test_resend_provider_failure_raises_send_error(self):
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.resend.Emails.send') as mock_send:
                mock_send.side_effect = Exception('Resend API unreachable')
                with self.assertRaises(SMTPSendError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')


if __name__ == '__main__':
    unittest.main(verbosity=2)
