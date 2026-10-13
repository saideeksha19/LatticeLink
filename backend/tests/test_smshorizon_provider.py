import os
import sys
import unittest
import json
from unittest.mock import patch, MagicMock
import urllib.error

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_uri = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'latticelink_test.db').replace(os.sep, '/')}"
os.environ['DATABASE_URL'] = test_db_uri

from config import Config
from app import app
from models import db, OtpChallenge
from services.sms_service import (
    send_sms_otp,
    get_sms_config,
    format_smshorizon_mobile,
    normalize_phone_number,
    sanitize_provider_error,
    SMSConfigurationError,
    SMSSendError,
)


class TestSmsHorizonProvider(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_smshorizon setUpClass", uri=test_db_uri)
            db.create_all()

    def setUp(self):
        self.client = app.test_client()
        self.smshorizon_env = {
            "SMS_PROVIDER": "smshorizon",
            "SMSHORIZON_USER": "testuser",
            "SMSHORIZON_API_KEY": "test-smshorizon-api-key-12345",
            "SMSHORIZON_SENDER_ID": "HORIZN",
            "SMSHORIZON_TID": "1107160521253456789",
            "SMSHORIZON_API_URL": "https://smshorizon.co.in/api/v2/sendsms.php"
        }

    def tearDown(self):
        with app.app_context():
            Config.assert_safe_for_destructive_action("test_smshorizon tearDown", uri=app.config['SQLALCHEMY_DATABASE_URI'])
            db.session.rollback()
            for table in reversed(db.metadata.sorted_tables):
                db.session.execute(table.delete())
            db.session.commit()
            db.session.remove()

    def _mock_http_response(self, content_bytes: bytes, status_code: int = 200):
        mock_resp = MagicMock()
        mock_resp.read.return_value = content_bytes
        mock_resp.status = status_code
        mock_resp.getcode.return_value = status_code
        mock_resp.__enter__.return_value = mock_resp
        mock_resp.__exit__.return_value = False
        return mock_resp

    def test_missing_config_fails_clearly_without_fallback(self):
        """When SMS_PROVIDER=smshorizon but credentials are missing, fail clearly with 503/error."""
        with patch.dict(os.environ, {"SMS_PROVIDER": "smshorizon", "SMSHORIZON_USER": "", "SMSHORIZON_API_KEY": ""}, clear=False):
            with self.assertRaises(SMSConfigurationError) as ctx:
                send_sms_otp("+919876543210", "alice", "123456")
            self.assertIn("SMSHORIZON_USER", str(ctx.exception))
            self.assertIn("SMSHORIZON_API_KEY", str(ctx.exception))

    def test_phone_number_normalization_for_smshorizon(self):
        """Verify Indian and international phone normalization for SmsHorizon."""
        # 12-digit Indian number: strips 91 prefix for domestic SmsHorizon routing
        self.assertEqual(format_smshorizon_mobile("+919876543210"), "9876543210")
        # Standard 10-digit without country code (normalized first to E.164)
        canonical = normalize_phone_number("9876543210")
        self.assertEqual(format_smshorizon_mobile(canonical), "9876543210")
        # International number retains digits
        self.assertEqual(format_smshorizon_mobile("+8801712345495"), "8801712345495")

    def test_successful_delivery_json_response(self):
        """Test successful SMS dispatch when SmsHorizon returns standard JSON with msgid."""
        json_resp = json.dumps({
            "msgid": "938471625",
            "status": "queued",
            "balance_after": "4999"
        }).encode("utf-8")
        mock_resp = self._mock_http_response(json_resp)

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", return_value=mock_resp) as mock_url:
                result = send_sms_otp("+919876543210", "alice", "482910")

                self.assertEqual(result["provider"], "smshorizon")
                self.assertEqual(result["status"], "queued")
                self.assertNotEqual(result["status"], "delivered")  # Must not falsely claim confirmed delivery
                self.assertEqual(result["msgid"], "938471625")
                self.assertFalse(result["is_mock"])
                self.assertEqual(result["masked_to"], "+91******3210")
                mock_url.assert_called_once()

    def test_successful_delivery_plaintext_response(self):
        """Test successful SMS dispatch when SmsHorizon returns a plaintext message ID."""
        mock_resp = self._mock_http_response(b"938471625")

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", return_value=mock_resp):
                result = send_sms_otp("+919876543210", "bob", "112233")
                self.assertEqual(result["provider"], "smshorizon")
                self.assertEqual(result["status"], "queued")
                self.assertEqual(result["msgid"], "938471625")

    def test_invalid_credentials_error(self):
        """Test that invalid username or API key results in a clean error without leaking keys."""
        err_json = json.dumps({
            "status": "error",
            "message": "Invalid Username or API Key"
        }).encode("utf-8")
        mock_resp = self._mock_http_response(err_json)

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", return_value=mock_resp):
                with self.assertRaises(SMSSendError) as ctx:
                    send_sms_otp("+919876543210", "charlie", "123456")
                err_msg = str(ctx.exception)
                self.assertIn("authentication rejected", err_msg.lower())
                self.assertNotIn("test-smshorizon-api-key", err_msg)

    def test_http_401_unauthorized(self):
        """Test that an HTTP 401 error is converted to a clean SMSSendError."""
        err_bytes = b'{"status": "error", "message": "Unauthorized"}'
        http_err = urllib.error.HTTPError("https://smshorizon.co.in", 401, "Unauthorized", {}, MagicMock(read=lambda: err_bytes))

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", side_effect=http_err):
                with self.assertRaises(SMSSendError) as ctx:
                    send_sms_otp("+919876543210", "dave", "654321")
                self.assertIn("SMS delivery failed", str(ctx.exception))

    def test_insufficient_balance_error(self):
        """Test that insufficient balance response raises a descriptive SMSSendError."""
        err_json = json.dumps({
            "status": "error",
            "message": "Insufficient credits"
        }).encode("utf-8")
        mock_resp = self._mock_http_response(err_json)

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", return_value=mock_resp):
                with self.assertRaises(SMSSendError) as ctx:
                    send_sms_otp("+919876543210", "eve", "998877")
                self.assertIn("insufficient sms credits/balance", str(ctx.exception).lower())

    def test_rejected_sender_id_error(self):
        """Test that an invalid or unapproved Sender ID raises a descriptive error."""
        err_json = json.dumps({
            "status": "error",
            "message": "Invalid Sender ID"
        }).encode("utf-8")
        mock_resp = self._mock_http_response(err_json)

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", return_value=mock_resp):
                with self.assertRaises(SMSSendError) as ctx:
                    send_sms_otp("+919876543210", "frank", "554433")
                self.assertIn("sender id or dlt template", str(ctx.exception).lower())

    def test_provider_timeout_handling(self):
        """Test that network timeouts raise a clean SMSSendError indicating timeout."""
        timeout_err = urllib.error.URLError("Connection timed out")

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", side_effect=timeout_err):
                with self.assertRaises(SMSSendError) as ctx:
                    send_sms_otp("+919876543210", "grace", "332211")
                self.assertIn("timed out", str(ctx.exception).lower())

    def test_malformed_empty_response(self):
        """Test that an empty response from SmsHorizon raises a clean SMSSendError."""
        mock_resp = self._mock_http_response(b"")

        with patch.dict(os.environ, self.smshorizon_env, clear=False):
            with patch("urllib.request.urlopen", return_value=mock_resp):
                with self.assertRaises(SMSSendError) as ctx:
                    send_sms_otp("+919876543210", "heidi", "445566")
                self.assertIn("empty response", str(ctx.exception).lower())

    def test_dlt_template_and_custom_message_support(self):
        """Test that DLT Template ID (tid) and custom message templates are passed in the payload."""
        custom_env = dict(self.smshorizon_env)
        custom_env["SMSHORIZON_MESSAGE_TEMPLATE"] = "Your LatticeLink OTP is {#var#}. Valid for 5 mins."

        captured_requests = []

        def capture_urlopen(req, timeout=15):
            captured_requests.append(req)
            return self._mock_http_response(b'{"msgid": "88776655", "status": "queued"}')

        with patch.dict(os.environ, custom_env, clear=False):
            with patch("urllib.request.urlopen", side_effect=capture_urlopen):
                result = send_sms_otp("+919876543210", "ivan", "135790")
                self.assertEqual(result["status"], "queued")

                # Verify payload parameters
                sent_req = captured_requests[0]
                body_decoded = sent_req.data.decode("utf-8")
                self.assertIn("tid=1107160521253456789", body_decoded)
                self.assertIn("user=testuser", body_decoded)
                self.assertIn("senderid=HORIZN", body_decoded)
                self.assertIn("mobile=9876543210", body_decoded)
                self.assertIn("Your+LatticeLink+OTP+is+135790.+Valid+for+5+mins.", body_decoded)

    def test_send_otp_route_integration_with_smshorizon(self):
        """Test that /api/auth/send-otp rejects phone/SMS verification because email OTP is the sole method."""
        res = self.client.post("/api/auth/send-otp", json={
            "username": "horizon_user",
            "method": "phone",
            "contact": "+919876543210"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("SMS verification is disabled", res.get_json().get("error", ""))

    def test_real_sms_only_when_explicitly_configured(self):
        """Ensure real SMS is NOT sent unless SMS_PROVIDER is explicitly set, even if credentials exist in env."""
        env_with_creds_no_provider = dict(self.smshorizon_env)
        env_with_creds_no_provider["SMS_PROVIDER"] = ""  # Not explicitly set

        with patch.dict(os.environ, env_with_creds_no_provider, clear=False):
            config = get_sms_config()
            # Must remain mock by default in dev/test, not auto-activating smshorizon
            self.assertEqual(config["provider"], "mock")

            # Dispatching in this state uses mock, does NOT call external HTTP
            with patch("urllib.request.urlopen") as mock_url:
                result = send_sms_otp("+919876543210", "no_accidental_real_sms", "123456")
                self.assertTrue(result["is_mock"])
                self.assertEqual(result["provider"], "mock")
                mock_url.assert_not_called()


if __name__ == "__main__":
    unittest.main()
