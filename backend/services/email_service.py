import os
import re
import json
import logging
import urllib.request
import urllib.error
from html import escape

logger = logging.getLogger("LatticeLink.EmailService")

AGENTMAIL_API_URL_TEMPLATE = "https://api.agentmail.to/v0/inboxes/{inbox_id}/messages/send"
HTTP_TIMEOUT_SECONDS = 20

# Simple RFC-5322-style sanity check: local@domain.tld, no whitespace.
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SMTPConfigurationError(Exception):
    """Raised when the email provider is not configured."""
    pass


class SMTPSendError(Exception):
    """Raised when email delivery fails."""
    pass


def _get_agentmail_config():
    """
    Read the AgentMail configuration from environment variables only.

    Required:
        AGENTMAIL_API_KEY   -> AgentMail server API key (server-side only;
                               never logged, returned, or committed). Create
                               it in the AgentMail Console after completing
                               the one-time human account verification, which
                               unlocks sending to external recipients.

        AGENTMAIL_INBOX_ID  -> the ID of the single free @agentmail.to inbox
                               used as the SENDER for all LatticeLink OTP
                               emails. Recipients are arbitrary external
                               addresses (gmail.com, yahoo.com, etc.); no
                               custom domain is required.

    The API key and inbox ID are read at call time. The key is never
    logged, returned, or embedded in error messages. No SMTP credentials,
    mail passwords, or username/password pairs are used anywhere.
    """
    api_key = os.getenv("AGENTMAIL_API_KEY", "").strip()

    if not api_key:
        raise SMTPConfigurationError(
            "AGENTMAIL_API_KEY is not configured. Add the AgentMail API key "
            "to the Render environment variables (server-side only)."
        )

    inbox_id = os.getenv("AGENTMAIL_INBOX_ID", "").strip()

    if not inbox_id:
        raise SMTPConfigurationError(
            "AGENTMAIL_INBOX_ID is not configured. Set it to the ID of the "
            "AgentMail inbox used as the OTP sender."
        )

    return api_key, inbox_id


def _get_frontend_url() -> str:
    """Frontend URL used for the link inside OTP emails; empty when unset."""
    return os.getenv("FRONTEND_URL", "").strip().rstrip("/")


def _validate_recipient(to_email: str) -> str:
    """
    Validate the recipient address and return it in canonical form.
    Prevents header/API injection by rejecting anything that is not a
    plain single address.
    """
    recipient = (to_email or "").strip()

    if not recipient or len(recipient) > 254:
        raise SMTPSendError("Invalid recipient email address.")

    if recipient.count("@") != 1 or not _EMAIL_PATTERN.match(recipient):
        raise SMTPSendError("Invalid recipient email address.")

    return recipient


def _parse_agentmail_error(http_error: urllib.error.HTTPError) -> dict:
    """
    Safely extract what AgentMail actually returned for a failed request.

    Returns {'status', 'name', 'message'}. The message is AgentMail's own
    error text (or a sanitized snippet of a non-JSON error page). Any
    credential-like substrings are stripped before anything is stored,
    logged, or returned, so no secret can leak.
    """
    status = http_error.code

    name = None
    message = None

    try:
        raw = http_error.read().decode("utf-8", "replace")
    except Exception:
        raw = ""
    finally:
        try:
            http_error.close()
        except Exception:
            pass

    if raw:
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = None

        if isinstance(parsed, dict):
            name = parsed.get("name") or parsed.get("code") or parsed.get("type") or parsed.get("error")
            message = parsed.get("message") or parsed.get("error_description")
        else:
            # Non-JSON body (e.g. HTML error pages).
            name = "html_error_page"
            message = raw.strip()
    else:
        reason = getattr(http_error, "reason", None)
        message = str(reason) if reason else None
        name = None

    # Scrub anything that could resemble a credential before the text is
    # ever logged or returned.
    if isinstance(message, str) and message.strip():
        message = message.strip()[:200]
        lowered = message.lower()
        for marker in ("bearer ", "am_", "authorization"):
            idx = lowered.find(marker)
            while idx != -1:
                end = idx + len(marker)
                while end < len(message) and message[end].isalnum() or (end < len(message) and message[end] in "-_"):
                    end += 1
                message = message[:idx] + message[end:]
                lowered = message.lower()
                idx = lowered.find(marker)
        message = message or None
    else:
        message = None

    return {"status": status, "name": name, "message": message}


def _map_agentmail_http_error(provider_error: dict) -> str:
    """
    Map a parsed AgentMail HTTP error to a safe, accurate operator-facing
    message. Never includes secrets; never blames the API key when the
    cause is elsewhere.
    """
    status = provider_error["status"]
    name = (provider_error["name"] or "").lower()
    message = (provider_error["message"] or "").lower()
    combined = f"{name} {message}"

    # Raw provider detail is appended only for JSON bodies; raw HTML error
    # pages are never echoed back to clients.
    if provider_error["name"] == "html_error_page":
        detail = ""
    else:
        raw_message = provider_error["message"]
        detail = f" (AgentMail: {escape(raw_message)})" if raw_message else ""

    if status == 400:
        return (
            "AgentMail rejected the request as invalid (HTTP 400). Verify "
            f"the recipient address and try again.{detail}"
        )

    if status == 401:
        return (
            "AgentMail API key is missing or unauthorized (HTTP 401). "
            f"Check AGENTMAIL_API_KEY in the Render environment.{detail}"
        )

    if status == 403:
        # The dominant free-plan cause: the one-time account verification
        # has not been completed, so external recipients are locked.
        if (
            "verif" in combined
            or "external" in combined
            or "permission" in combined
            or "account" in combined
            or "restricted" in combined
        ):
            return (
                "AgentMail cannot send to external recipients (HTTP 403). "
                "Complete the one-time AgentMail account verification in "
                f"the AgentMail console, then retry.{detail}"
            )
        return (
            "AgentMail refused this send (HTTP 403). Check AGENTMAIL_API_KEY "
            "and account verification status in the AgentMail console."
            f"{detail}"
        )

    if status == 404:
        # Most often a wrong AGENTMAIL_INBOX_ID: the sender inbox does not
        # exist for this API key.
        if "inbox" in combined or "not_found" in combined or "not found" in combined:
            return (
                "AgentMail inbox not found (HTTP 404). Check that "
                "AGENTMAIL_INBOX_ID matches an inbox owned by this AgentMail "
                f"account.{detail}"
            )
        return (
            "AgentMail endpoint or inbox not found (HTTP 404). Verify "
            f"AGENTMAIL_INBOX_ID and the current API documentation.{detail}"
        )

    if status == 409:
        return (
            "AgentMail reported a conflict (HTTP 409). The send may already "
            "be in progress - check the inbox in the AgentMail console "
            f"before retrying.{detail}"
        )

    if status == 429:
        return (
            "AgentMail rate limit reached (HTTP 429). The free plan allows "
            f"100 emails per day / 3000 per month - wait and try again.{detail}"
        )

    if status is not None and 500 <= status < 600:
        return (
            f"Temporary AgentMail provider error (HTTP {status}). "
            f"Try again shortly.{detail}"
        )

    return f"Email delivery failed (provider HTTP {status}).{detail}"


def _send_email(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str
) -> bool:
    """
    Send email through the AgentMail REST API
    (POST /v0/inboxes/{inbox_id}/messages/send).

    The API key travels only in the Authorization header of this
    server-to-server call. It is never logged, returned to clients, or
    written to the database. The sender is the single free @agentmail.to
    inbox identified by AGENTMAIL_INBOX_ID (no custom domain required);
    recipients may be arbitrary external addresses.

    Returns True only when AgentMail ACCEPTS the message (HTTP 200 with a
    message_id), which is the documented success contract.
    """
    try:
        api_key, inbox_id = _get_agentmail_config()
        recipient = _validate_recipient(to_email)
        frontend_url = _get_frontend_url()

        if frontend_url:
            text_content = (
                f"{text_content}\n"
                f"Open LatticeLink: {frontend_url}\n"
            )
            html_content = html_content.replace(
                "</body>",
                '<p style="text-align:center;margin:16px 0 0;font-size:12px;">'
                f'<a href="{frontend_url}" style="color:#94a3b8;'
                'text-decoration:none;">Open LatticeLink</a></p>\n</body>',
                1
            )

        payload = {
            "to": [recipient],
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            AGENTMAIL_API_URL_TEMPLATE.format(inbox_id=inbox_id),
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "LatticeLink/1.0",
            },
        )

        # Log the recipient and subject only - never the API key, the inbox
        # ID is not a secret but is also not needed in logs, and never the OTP.
        logger.info(
            "Sending OTP email via AgentMail. To=%s Subject=%s",
            recipient,
            subject
        )

        with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
            status = getattr(response, "status", None)
            if not isinstance(status, int):
                status = response.getcode()
            response.read()
            response.close()

        if status is None or not (200 <= status < 300):
            raise SMTPSendError(
                f"Email delivery failed (provider HTTP {status})."
            )

        logger.info(
            "Email accepted by AgentMail (HTTP %s) to %s (Subject: %s)",
            status,
            recipient,
            subject
        )

        return True

    except SMTPConfigurationError:
        raise

    except urllib.error.HTTPError as e:
        # Parse what AgentMail actually returned so every failure maps to
        # an accurate, actionable message - never a blanket "bad credentials".
        provider_error = _parse_agentmail_error(e)

        # Log only scrubbed, secret-free fields.
        logger.error(
            "AgentMail HTTP error during email dispatch to %s. Status=%s ErrorName=%s Detail=%s",
            to_email,
            provider_error["status"],
            provider_error["name"] or "unknown",
            provider_error["message"] or "none"
        )

        raise SMTPSendError(_map_agentmail_http_error(provider_error))

    except urllib.error.URLError as e:
        # Covers DNS failures, refused connections and connection timeouts.
        logger.error(
            "AgentMail unreachable during email dispatch to %s. ErrorClass=%s",
            to_email,
            e.__class__.__name__
        )

        raise SMTPSendError(
            "Email delivery failed: provider unreachable (timeout or "
            "network error). Try again."
        )

    except TimeoutError as e:
        # Read timeouts can surface as a bare TimeoutError depending on the
        # platform; never include the underlying detail (it may echo URLs).
        logger.error(
            "AgentMail timeout during email dispatch to %s. ErrorClass=%s",
            to_email,
            e.__class__.__name__
        )

        raise SMTPSendError(
            "Email delivery failed: provider unreachable (timeout or "
            "network error). Try again."
        )

    except Exception as e:
        logger.error(
            "Unexpected error during email dispatch to %s. ErrorClass=%s",
            to_email,
            e.__class__.__name__
        )

        raise SMTPSendError(
            "Email delivery failed: unexpected error."
        )


def send_verification_otp(
    to_email: str,
    username: str,
    otp: str
) -> bool:

    subject = "LatticeLink — Verify your account"

    text = (
        "LatticeLink\n\n"
        "Verify your account\n\n"
        f"Hello {username},\n\n"
        "Your verification code is:\n\n"
        f"{otp}\n\n"
        "This code expires in 10 minutes.\n\n"
        "If you did not create this account, ignore this email.\n"
    )

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LatticeLink Verification</title>
</head>

<body style="
    margin:0;
    padding:24px;
    background-color:#05080f;
    font-family:-apple-system,BlinkMacSystemFont,
    'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    color:#f8fafc;
">

<div style="
    max-width:500px;
    margin:0 auto;
    background:#0b1120;
    border:1px solid #1e293b;
    border-radius:12px;
    padding:32px;
">

    <div style="
        text-align:center;
        margin-bottom:24px;
    ">

        <h2 style="
            color:#38bdf8;
            margin:0 0 6px;
            font-size:22px;
            letter-spacing:.5px;
        ">
            LatticeLink
        </h2>

        <p style="
            color:#94a3b8;
            font-size:14px;
            margin:0;
        ">
            Verify your account
        </p>

    </div>

    <div style="
        background:#0f172a;
        border-radius:8px;
        padding:24px;
        text-align:center;
        border:1px solid #1e293b;
    ">

        <p style="
            margin:0 0 12px;
            color:#cbd5e1;
            font-size:14px;
        ">
            Hello {username},
        </p>

        <p style="
            margin:0 0 12px;
            color:#cbd5e1;
            font-size:14px;
        ">
            Your verification code is:
        </p>

        <div style="
            display:inline-block;
            font-family:Consolas,monospace;
            font-size:36px;
            font-weight:bold;
            letter-spacing:8px;
            color:#38bdf8;
            padding:12px 24px;
            background:rgba(56,189,248,0.08);
            border:1px dashed #38bdf8;
            border-radius:6px;
            margin:8px 0 16px;
        ">
            {otp}
        </div>

        <p style="
            margin:0;
            color:#64748b;
            font-size:12px;
        ">
            This code expires in 10 minutes.
        </p>

    </div>

    <div style="
        margin-top:24px;
        text-align:center;
        color:#64748b;
        font-size:12px;
    ">

        <p style="margin:0;">
            If you did not create this account, ignore this email.
        </p>

    </div>

</div>

</body>
</html>
"""

    return _send_email(
        to_email,
        subject,
        text,
        html
    )


def send_password_reset_otp(
    to_email: str,
    username: str,
    otp: str
) -> bool:

    subject = "LatticeLink — Password Reset"

    text = (
        "LatticeLink\n\n"
        "Password Reset\n\n"
        f"Hello {username},\n\n"
        "Your password reset verification code is:\n\n"
        f"{otp}\n\n"
        "This code expires in 10 minutes.\n\n"
        "If you did not request a password reset, ignore this email.\n"
    )

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LatticeLink Password Reset</title>
</head>

<body style="
    margin:0;
    padding:24px;
    background-color:#05080f;
    font-family:-apple-system,BlinkMacSystemFont,
    'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    color:#f8fafc;
">

<div style="
    max-width:500px;
    margin:0 auto;
    background:#0b1120;
    border:1px solid #1e293b;
    border-radius:12px;
    padding:32px;
">

    <div style="
        text-align:center;
        margin-bottom:24px;
    ">

        <h2 style="
            color:#f87171;
            margin:0 0 6px;
            font-size:22px;
            letter-spacing:.5px;
        ">
            LatticeLink
        </h2>

        <p style="
            color:#94a3b8;
            font-size:14px;
            margin:0;
        ">
            Password Reset
        </p>

    </div>

    <div style="
        background:#0f172a;
        border-radius:8px;
        padding:24px;
        text-align:center;
        border:1px solid #1e293b;
    ">

        <p style="
            margin:0 0 12px;
            color:#cbd5e1;
            font-size:14px;
        ">
            Hello {username},
        </p>

        <p style="
            margin:0 0 12px;
            color:#cbd5e1;
            font-size:14px;
        ">
            Your password reset verification code is:
        </p>

        <div style="
            display:inline-block;
            font-family:Consolas,monospace;
            font-size:36px;
            font-weight:bold;
            letter-spacing:8px;
            color:#f87171;
            padding:12px 24px;
            background:rgba(239,68,68,0.08);
            border:1px dashed #f87171;
            border-radius:6px;
            margin:8px 0 16px;
        ">
            {otp}
        </div>

        <p style="
            margin:0;
            color:#64748b;
            font-size:12px;
        ">
            This code expires in 10 minutes.
        </p>

    </div>

    <div style="
        margin-top:24px;
        text-align:center;
        color:#64748b;
        font-size:12px;
    ">

        <p style="margin:0;">
            If you did not request a password reset, ignore this email.
        </p>

    </div>

</div>

</body>
</html>
"""

    return _send_email(
        to_email,
        subject,
        text,
        html
    )
