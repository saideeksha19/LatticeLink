import os
import re
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger("LatticeLink.EmailService")

RESEND_API_URL = "https://api.resend.com/emails"
HTTP_TIMEOUT_SECONDS = 20

# Simple RFC-5322-style sanity check: local@domain.tld, no whitespace.
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# Optional display-name form: 'LatticeLink <noreply@yourdomain.com>'
_DISPLAY_NAME_PATTERN = re.compile(r"^(?P<name>[^<>]+)<(?P<addr>[^<>@\s]+@[^<>\s]+)>$")


class SMTPConfigurationError(Exception):
    """Raised when the email provider is not configured."""
    pass


class SMTPSendError(Exception):
    """Raised when email delivery fails."""
    pass


def _extract_email_address(sender_value: str) -> str:
    """
    Accept both plain addresses ('user@domain.com') and the display-name
    form ('LatticeLink <user@domain.com>') and return the bare address
    for validation.
    """
    value = (sender_value or "").strip()
    match = _DISPLAY_NAME_PATTERN.match(value)
    if match:
        return match.group("addr").strip()
    return value


def _get_resend_config():
    """
    Read the Resend configuration from environment variables only.

    Required:
        RESEND_API_KEY -> Resend API key (server-side only; never logged,
                          returned, or committed). Create it for free at
                          https://dashboard.resend.com/api-keys.

        RESEND_FROM    -> the sender shown to recipients, either a plain
                          address or a display-name form. It must belong to
                          a domain verified in the Resend account (the
                          shared onboarding@resend.dev sandbox sender can
                          only deliver to your own account email).

    Optional:
        FRONTEND_URL   -> included as a link inside OTP emails when set.

    The API key is read at call time and is never logged, returned, or
    embedded in error messages. No SMTP credentials, mail passwords, or
    username/password pairs are used anywhere — only the Resend API key.
    """
    api_key = os.getenv("RESEND_API_KEY", "").strip()

    if not api_key:
        raise SMTPConfigurationError(
            "RESEND_API_KEY is not configured. Add the Resend API key to the "
            "Render environment variables (server-side only)."
        )

    sender = os.getenv("RESEND_FROM", "").strip()

    if not sender:
        raise SMTPConfigurationError(
            "RESEND_FROM is not configured. Set it to an address on a domain "
            "verified in your Resend account, e.g. 'LatticeLink "
            "<noreply@yourdomain.com>'."
        )

    sender_address = _extract_email_address(sender)
    if not _EMAIL_PATTERN.match(sender_address):
        raise SMTPConfigurationError(
            "RESEND_FROM must be a valid email address, optionally with a "
            "display name, e.g. 'LatticeLink <noreply@yourdomain.com>'."
        )

    return api_key, sender


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


def _send_email(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str
) -> bool:
    """
    Send email through the Resend transactional email API (free tier).

    The API key travels only in the Authorization header of this
    server-to-server call. It is never logged, returned to clients, or
    written to the database.
    """
    try:
        api_key, sender = _get_resend_config()
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
            "from": sender,
            "to": [recipient],
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            RESEND_API_URL,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "latticelink-backend",
            },
        )

        logger.info(
            "Sending OTP email via Resend. From=%s To=%s Subject=%s",
            sender,
            recipient,
            subject
        )

        with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
            status = getattr(response, "status", None)
            if not isinstance(status, int):
                status = response.getcode()
            response.read()
            response.close()

        if status is None or not (200 <= status < 400):
            raise SMTPSendError(
                f"Email delivery failed (provider HTTP {status})."
            )

        logger.info(
            "Email successfully dispatched via Resend to %s (Subject: %s, HTTP %s)",
            recipient,
            subject,
            status
        )

        return True

    except SMTPConfigurationError:
        raise

    except urllib.error.HTTPError as e:
        # Log only the status code and provider error type: response payloads
        # must never leak credentials, and provider messages stay out of logs.
        provider_error_type = None
        try:
            error_body = e.read().decode("utf-8", "replace")
            provider_error_type = json.loads(error_body).get("name")
        except Exception:
            provider_error_type = None

        logger.error(
            "Resend HTTP error during email dispatch to %s. Status=%s ErrorType=%s",
            to_email,
            e.code,
            provider_error_type or "unknown"
        )

        if e.code in (401, 403):
            raise SMTPSendError(
                "Email delivery failed: Resend rejected the server "
                "credentials. Check RESEND_API_KEY in the Render environment."
            )

        if e.code == 422:
            raise SMTPSendError(
                "Email delivery rejected by Resend (HTTP 422). Ensure "
                "RESEND_FROM is an address on a domain verified in your "
                "Resend account; the sandbox sender can only deliver to "
                "your own account email."
            )

        raise SMTPSendError(
            f"Email delivery failed (provider HTTP {e.code})."
        )

    except urllib.error.URLError as e:
        # Covers DNS failures, refused connections and connection timeouts.
        logger.error(
            "Resend unreachable during email dispatch to %s. ErrorClass=%s",
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
            "Resend timeout during email dispatch to %s. ErrorClass=%s",
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
