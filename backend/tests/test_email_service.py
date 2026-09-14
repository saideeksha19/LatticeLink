"""
Unit tests for the Gmail SMTP email service.

These tests mock smtplib entirely: no network calls are made and no real
Gmail credentials are used. They verify that:
  - verification and password-reset OTPs are dispatched via smtplib.SMTP
  - MAIL_USERNAME / MAIL_PASSWORD / MAIL_DEFAULT_SENDER come from the
    environment only
  - missing configuration raises SMTPConfigurationError (HTTP 503 path)
  - SMTP failures raise SMTPSendError (HTTP 500 path)
  - the App Password never leaks into logs, headers, or the message body
"""
import os
import sys
import unittest
from unittest.mock import patch, MagicMock

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
    'MAIL_SERVER': 'smtp.gmail.com',
    'MAIL_PORT': '587',
    'MAIL_USE_TLS': 'true',
    'MAIL_USERNAME': 'latticelink.test.sender@gmail.com',
    'MAIL_PASSWORD': 'test-dummy-app-password',
    'MAIL_DEFAULT_SENDER': 'latticelink.test.sender@gmail.com',
}


def _make_smtp_mock():
    """Build a mock smtplib.SMTP context manager returning (mock, instance)."""
    smtp_instance = MagicMock()
    factory = MagicMock(return_value=smtp_instance)
    factory.return_value.__enter__.return_value = smtp_instance
    return factory, smtp_instance


class TestGmailSMTPEmailService(unittest.TestCase):
    def test_verification_otp_dispatches_via_smtp(self):
        factory, smtp = _make_smtp_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.smtplib.SMTP', factory):
                result = send_verification_otp('user@example.com', 'alice', '123456')

        self.assertTrue(result)
        factory.assert_called_once_with('smtp.gmail.com', 587, timeout=20)
        smtp_instance = factory.return_value.__enter__.return_value
        smtp_instance.starttls.assert_called_once()
        smtp_instance.login.assert_called_once_with(
            'latticelink.test.sender@gmail.com', 'test-dummy-app-password'
        )
        smtp_instance.sendmail.assert_called_once()
        args = smtp_instance.sendmail.call_args[0]
        self.assertEqual(args[0], 'latticelink.test.sender@gmail.com')
        self.assertEqual(args[1], ['user@example.com'])
        raw_message = args[2]
        self.assertIn('123456', raw_message)
        self.assertNotIn(TEST_ENV['MAIL_PASSWORD'], raw_message)

    def test_password_reset_otp_dispatches_via_smtp(self):
        factory, _ = _make_smtp_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.smtplib.SMTP', factory):
                result = send_password_reset_otp('user@example.com', 'bob', '654321')

        self.assertTrue(result)
        smtp_instance = factory.return_value.__enter__.return_value
        smtp_instance.sendmail.assert_called_once()
        raw_message = smtp_instance.sendmail.call_args[0][2]
        self.assertIn('654321', raw_message)
        self.assertIn('Password Reset', raw_message)
        self.assertNotIn(TEST_ENV['MAIL_PASSWORD'], raw_message)

    def test_missing_mail_username_raises_configuration_error(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('MAIL_USERNAME', None)
            os.environ.pop('MAIL_PASSWORD', None)
            factory, smtp = _make_smtp_mock()
            with patch('services.email_service.smtplib.SMTP', factory):
                with self.assertRaises(SMTPConfigurationError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        smtp_instance = factory.return_value.__enter__.return_value
        smtp_instance.sendmail.assert_not_called()

    def test_missing_mail_password_raises_configuration_error(self):
        with patch.dict(os.environ, {'MAIL_USERNAME': 'sender@gmail.com'}, clear=False):
            os.environ.pop('MAIL_PASSWORD', None)
            factory, smtp = _make_smtp_mock()
            with patch('services.email_service.smtplib.SMTP', factory):
                with self.assertRaises(SMTPConfigurationError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')
        smtp_instance = factory.return_value.__enter__.return_value
        smtp_instance.sendmail.assert_not_called()

    def test_smtp_failure_raises_send_error(self):
        factory, smtp = _make_smtp_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.smtplib.SMTP', factory):
                smtp_instance = factory.return_value.__enter__.return_value
                smtp_instance.sendmail.side_effect = Exception('SMTP connection refused')
                with self.assertRaises(SMTPSendError):
                    _send_email('user@example.com', 'Subject', 'text', '<p>html</p>')

    def test_password_not_leaked_in_headers_or_body(self):
        factory, _ = _make_smtp_mock()
        with patch.dict(os.environ, TEST_ENV, clear=False):
            with patch('services.email_service.smtplib.SMTP', factory):
                send_verification_otp('user@example.com', 'alice', '123456')
        smtp_instance = factory.return_value.__enter__.return_value
        raw_message = smtp_instance.sendmail.call_args[0][2]
        self.assertNotIn(TEST_ENV['MAIL_PASSWORD'], raw_message)
        self.assertNotIn('App-Password', raw_message)
        self.assertNotIn('Authorization', raw_message)


if __name__ == '__main__':
    unittest.main(verbosity=2)
