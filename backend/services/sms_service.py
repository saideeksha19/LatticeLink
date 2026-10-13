import os
import re
import sys
import json
import base64
import logging
import urllib.request
import urllib.error
import urllib.parse

logger = logging.getLogger("LatticeLink.SMSService")

# ITU-T E.164 phone number pattern: + followed by 7 to 15 digits
_PHONE_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")


class SMSConfigurationError(Exception):
    """Raised when SMS provider credentials or configuration is invalid."""
    pass


class SMSSendError(Exception):
    """Raised when SMS delivery fails."""
    pass


def is_production_environment() -> bool:
    """Returns True if running in a production deployment (e.g. Render)."""
    flask_env = os.getenv("FLASK_ENV", "").strip().lower()
    is_render = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID"))
    return flask_env == "production" or is_render


def get_sms_config() -> dict:
    """
    Read SMS provider configuration from environment variables.
    Supported providers:
      - 'mock': Local development / test mock provider
      - 'twilio': Real cellular SMS delivery via Twilio Messages API
      - 'smshorizon': Real cellular SMS delivery via SmsHorizon HTTP/REST API
    """
    raw_provider = os.getenv("SMS_PROVIDER", "").strip().lower()

    # Twilio configuration
    twilio_account_id = (
        os.getenv("SMS_ACCOUNT_ID") or 
        os.getenv("TWILIO_ACCOUNT_SID") or 
        os.getenv("TWILIO_ACCOUNT_ID") or 
        ""
    ).strip()

    twilio_auth_token = (
        os.getenv("SMS_AUTH_TOKEN") or 
        os.getenv("TWILIO_AUTH_TOKEN") or 
        ""
    ).strip()

    twilio_from_number = (
        os.getenv("SMS_FROM_NUMBER") or 
        os.getenv("TWILIO_PHONE_NUMBER") or 
        os.getenv("TWILIO_FROM_NUMBER") or 
        os.getenv("TWILIO_MESSAGING_SERVICE_SID") or 
        ""
    ).strip()

    # SmsHorizon configuration
    smshorizon_user = (
        os.getenv("SMSHORIZON_USER") or 
        os.getenv("SMSHORIZON_USERNAME") or 
        ""
    ).strip()

    smshorizon_api_key = os.getenv("SMSHORIZON_API_KEY", "").strip()

    smshorizon_sender_id = (
        os.getenv("SMSHORIZON_SENDER_ID") or 
        os.getenv("SMSHORIZON_SENDERID") or 
        ""
    ).strip()

    smshorizon_tid = (
        os.getenv("SMSHORIZON_TID") or 
        os.getenv("SMSHORIZON_TEMPLATE_ID") or 
        ""
    ).strip()

    smshorizon_api_url = (
        os.getenv("SMSHORIZON_API_URL") or 
        "https://smshorizon.co.in/api/v2/sendsms.php"
    ).strip()

    smshorizon_message_template = os.getenv("SMSHORIZON_MESSAGE_TEMPLATE", "").strip()

    # Provider resolution: Real SMS is sent ONLY when SMS_PROVIDER is explicitly configured
    if raw_provider:
        provider = raw_provider
    elif is_production_environment():
        provider = "unconfigured"
    else:
        provider = "mock"

    return {
        "provider": provider,
        "is_production": is_production_environment(),
        # Twilio
        "account_id": twilio_account_id,
        "auth_token": twilio_auth_token,
        "from_number": twilio_from_number,
        # SmsHorizon
        "smshorizon_user": smshorizon_user,
        "smshorizon_api_key": smshorizon_api_key,
        "smshorizon_sender_id": smshorizon_sender_id,
        "smshorizon_tid": smshorizon_tid,
        "smshorizon_api_url": smshorizon_api_url,
        "smshorizon_message_template": smshorizon_message_template
    }


def normalize_phone_number(phone: str) -> str:
    """
    Validates and normalizes phone number to strict E.164 standard.
    Strips formatting characters (spaces, dashes, parens, dots).
    Handles international prefixes ('00' -> '+') and prepends '+' if omitted.
    """
    if not phone:
        raise SMSSendError("Phone number is required.")
    
    cleaned = re.sub(r"[\s\-\(\)\.]", "", str(phone).strip())
    if not cleaned:
        raise SMSSendError("Invalid phone number.")

    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
        
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned

    if not _PHONE_PATTERN.match(cleaned):
        raise SMSSendError(
            "Invalid phone number format. Please provide a valid international phone number "
            "with country code (e.g. +8801712345678 or +12345678901)."
        )

    return cleaned


def format_smshorizon_mobile(canonical_phone: str) -> str:
    """
    Formats an E.164 phone number for SmsHorizon.
    SmsHorizon accepts digits; for 12-digit Indian numbers starting with '91',
    it extracts the standard 10-digit mobile number for domestic routing.
    For other countries, retains full digits.
    """
    digits = re.sub(r"\D", "", canonical_phone)
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    return digits


def mask_phone_number(phone: str) -> str:
    """Mask phone number for safe display and logging (e.g. +88******5495)."""
    if not phone or len(phone) < 6:
        return "****"
    return f"{phone[:3]}******{phone[-4:]}"


def sanitize_provider_error(raw_err: str) -> str:
    """
    Cleans provider error messages to prevent leaking API keys, tokens,
    or internal secrets, and maps recognized errors to user-friendly messages.
    """
    if not raw_err:
        return "Provider rejected request."
    cleaned = re.sub(r"(Bearer\s+)[A-Za-z0-9_\-]+", r"\1[REDACTED]", str(raw_err), flags=re.IGNORECASE)
    cleaned = re.sub(r"(apikey=)[^&\s]+", r"\1[REDACTED]", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"(password=)[^&\s]+", r"\1[REDACTED]", cleaned, flags=re.IGNORECASE)

    lower = cleaned.lower()
    if any(k in lower for k in ("invalid user", "invalid apikey", "invalid api key", "unauthorized", "auth failed")):
        return "SmsHorizon authentication rejected (invalid username or API key)."
    if any(k in lower for k in ("insufficient", "low balance", "no balance", "no credits")):
        return "SmsHorizon account has insufficient SMS credits/balance."
    if any(k in lower for k in ("senderid", "sender id", "invalid sender", "dlt", "template")):
        return "SmsHorizon rejected Sender ID or DLT template."

    return cleaned.strip()


def send_sms_via_smshorizon(canonical_phone: str, username: str, otp: str, config: dict) -> dict:
    """
    Dispatches a 6-digit registration OTP via SmsHorizon HTTP/REST API.
    Does not invent Sender ID or DLT template ID; uses configured values from server environment.
    Never exposes API keys or credentials in error messages or logs.
    """
    user = config.get("smshorizon_user")
    api_key = config.get("smshorizon_api_key")
    sender_id = config.get("smshorizon_sender_id")
    tid = config.get("smshorizon_tid")
    api_url = config.get("smshorizon_api_url") or "https://smshorizon.co.in/api/v2/sendsms.php"
    template = config.get("smshorizon_message_template")

    if not user or not api_key or not sender_id:
        missing = []
        if not user: missing.append("SMSHORIZON_USER")
        if not api_key: missing.append("SMSHORIZON_API_KEY")
        if not sender_id: missing.append("SMSHORIZON_SENDER_ID")
        raise SMSConfigurationError(
            f"SmsHorizon provider is configured but missing required environment variables: {', '.join(missing)}."
        )

    masked = mask_phone_number(canonical_phone)
    mobile = format_smshorizon_mobile(canonical_phone)

    # Format message text
    if template and "{otp}" in template:
        body_text = template.replace("{otp}", otp)
    elif template and "{#var#}" in template:
        body_text = template.replace("{#var#}", otp)
    else:
        body_text = f"Your LatticeLink verification code is: {otp}. Valid for 5 minutes. Do not share this code."

    payload = {
        "user": user,
        "apikey": api_key,
        "mobile": mobile,
        "senderid": sender_id,
        "message": body_text,
        "type": "txt",
        "prettyprint": "1"
    }

    if tid:
        payload["tid"] = tid

    data_bytes = urllib.parse.urlencode(payload).encode("utf-8")
    req = urllib.request.Request(api_url, data=data_bytes, method="POST")
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("User-Agent", "LatticeLink-SMS-Client/1.0")

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            resp_bytes = response.read()
            resp_text = resp_bytes.decode("utf-8", errors="replace").strip()
    except urllib.error.HTTPError as e:
        err_bytes = e.read()
        err_text = err_bytes.decode("utf-8", errors="replace").strip()
        sanitized = sanitize_provider_error(err_text or f"HTTP {e.code}")
        logger.error(f"SmsHorizon HTTP error for {masked}: {sanitized}")
        raise SMSSendError(f"SMS delivery failed: {sanitized}")
    except (urllib.error.URLError, TimeoutError) as e:
        err_str = str(e)
        if "timed out" in err_str.lower():
            logger.error(f"SmsHorizon connection timed out for {masked}.")
            raise SMSSendError("SMS delivery failed: SmsHorizon service timed out.")
        logger.error(f"SmsHorizon network connection error for {masked}: {err_str}")
        raise SMSSendError(f"SMS delivery network error: {sanitize_provider_error(err_str)}")
    except Exception as e:
        logger.error(f"Unexpected error communicating with SmsHorizon: {e}")
        raise SMSSendError(f"SMS delivery failed: {sanitize_provider_error(str(e))}")

    if not resp_text:
        raise SMSSendError("SMS delivery failed: Empty response received from SmsHorizon.")

    # Try parsing as JSON first
    try:
        resp_json = json.loads(resp_text)
    except json.JSONDecodeError:
        resp_json = None

    if isinstance(resp_json, dict):
        status = str(resp_json.get("status", "")).strip().lower()
        msgid = resp_json.get("msgid") or resp_json.get("message_id")
        error_msg = resp_json.get("error") or resp_json.get("message") or resp_json.get("desc")

        if status in ("error", "failed", "failure") or (error_msg and not msgid and status not in ("queued", "success", "sent")):
            sanitized_err = sanitize_provider_error(error_msg or "Request rejected by SmsHorizon")
            logger.error(f"SmsHorizon delivery rejected for {masked}: {sanitized_err}")
            raise SMSSendError(f"SMS delivery failed: {sanitized_err}")

        provider_status = status if status in ("queued", "sent", "delivered") else "queued"
        logger.info(f"SmsHorizon SMS accepted/queued for delivery to {masked} (MsgID: {msgid}, Status: {provider_status}).")
        return {
            "provider": "smshorizon",
            "status": provider_status,
            "msgid": str(msgid) if msgid else "accepted",
            "masked_to": masked,
            "is_mock": False
        }
    else:
        # Plaintext response
        lower_text = resp_text.lower()
        if any(k in lower_text for k in ("error", "invalid", "insufficient", "fail", "reject")):
            sanitized_err = sanitize_provider_error(resp_text)
            logger.error(f"SmsHorizon text error for {masked}: {sanitized_err}")
            raise SMSSendError(f"SMS delivery failed: {sanitized_err}")

        logger.info(f"SmsHorizon SMS accepted/queued for delivery to {masked} (Response: {resp_text}).")
        return {
            "provider": "smshorizon",
            "status": "queued",
            "msgid": resp_text,
            "masked_to": masked,
            "is_mock": False
        }


def send_sms_otp(to_phone: str, username: str, otp: str) -> dict:
    """
    Dispatches a 6-digit registration OTP via SMS.
    
    - In local development with mock provider:
      Prints the generated OTP clearly to the backend terminal only and logs delivery.
    - In production or with Twilio / SmsHorizon configured:
      Validates credentials and dispatches via provider API over HTTPS.
      Never exposes the OTP in API responses or production logs.
    """
    canonical_phone = normalize_phone_number(to_phone)
    config = get_sms_config()
    provider = config["provider"]
    masked = mask_phone_number(canonical_phone)

    if provider in ("mock", "console", "dev"):
        # Development / test mode mock provider
        if config["is_production"]:
            raise SMSConfigurationError(
                "SMS provider is not configured for production. Mock SMS is disabled in production. "
                "Please configure Twilio or SmsHorizon credentials in your server environment variables."
            )

        # Prominently print development OTP to backend terminal
        print("\n" + "=" * 58, flush=True)
        print("[DEVELOPMENT ONLY - MOCK SMS OTP DISPATCHED]", flush=True)
        print(f"Destination:  {canonical_phone} ({masked})", flush=True)
        print(f"Username:     {username}", flush=True)
        print(f"OTP Code:     {otp}", flush=True)
        print(f"Expires In:   5 minutes", flush=True)
        print(f"Note:         Real SMS is NOT sent in mock mode.", flush=True)
        print("=" * 58 + "\n", flush=True)

        logger.info(f"[Mock SMS] Dispatched development OTP to {masked} for '{username}'.")
        return {
            "provider": "mock",
            "status": "delivered",
            "masked_to": masked,
            "is_mock": True
        }

    elif provider == "smshorizon":
        return send_sms_via_smshorizon(canonical_phone, username, otp, config)

    elif provider == "twilio":
        account_id = config["account_id"]
        auth_token = config["auth_token"]
        from_number = config["from_number"]

        if not account_id or not auth_token or not from_number:
            raise SMSConfigurationError(
                "SMS provider is set to 'twilio' but TWILIO_ACCOUNT_SID (or SMS_ACCOUNT_ID), "
                "TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER is missing."
            )

        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_id}/Messages.json"
        body_text = f"Your LatticeLink verification code is: {otp}. Valid for 5 minutes. Do not share this code."

        payload_dict = {
            "To": canonical_phone,
            "Body": body_text
        }

        # Twilio Messaging Service SID starts with 'MG', phone numbers start with '+' or digits
        if from_number.upper().startswith("MG"):
            payload_dict["MessagingServiceSid"] = from_number
        else:
            payload_dict["From"] = from_number

        data_payload = urllib.parse.urlencode(payload_dict).encode("utf-8")

        req = urllib.request.Request(url, data=data_payload, method="POST")
        auth_header_val = base64.b64encode(f"{account_id}:{auth_token}".encode("utf-8")).decode("utf-8")
        req.add_header("Authorization", f"Basic {auth_header_val}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                resp_bytes = response.read()
                resp_json = json.loads(resp_bytes.decode("utf-8"))
                sid = resp_json.get("sid", "")
                logger.info(f"Twilio SMS accepted for delivery to {masked} (SID: {sid}).")
                return {
                    "provider": "twilio",
                    "status": "queued",
                    "sid": sid,
                    "masked_to": masked,
                    "is_mock": False
                }
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
                err_code = err_body.get("code")
                err_msg = err_body.get("message", f"HTTP {e.code}")
                formatted_err = f"Twilio Error {err_code}: {err_msg}" if err_code else f"Twilio Error: {err_msg}"
            except Exception:
                formatted_err = f"Twilio HTTP {e.code}"
            logger.error(f"Twilio SMS delivery failed: {formatted_err}")
            raise SMSSendError(f"SMS delivery failed: {formatted_err}")
        except Exception as e:
            logger.error(f"Twilio SMS network error: {e}")
            raise SMSSendError(f"SMS network error: {str(e)}")

    elif provider == "unconfigured":
        raise SMSConfigurationError(
            "SMS service is not configured. To send real SMS, configure SmsHorizon credentials "
            "(SMSHORIZON_USER, SMSHORIZON_API_KEY, SMSHORIZON_SENDER_ID) or Twilio credentials. "
            "For local testing without SMS gateway credentials, set SMS_PROVIDER=mock."
        )

    else:
        raise SMSConfigurationError(f"Unsupported SMS provider: '{provider}'")
