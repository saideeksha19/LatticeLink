import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("LatticeLink.EmailService")

SMTP_TIMEOUT_SECONDS = 20


class SMTPConfigurationError(Exception):
    """Raised when the email provider is not configured."""
    pass


class SMTPSendError(Exception):
    """Raised when email delivery fails."""
    pass


def _get_mail_config():
    """
    Read the mail configuration from environment variables only.

    Required:
        MAIL_USERNAME          -> the sending Gmail address
        MAIL_PASSWORD          -> the Gmail App Password (never logged, returned, or stored)
        MAIL_DEFAULT_SENDER    -> the sender address shown to recipients
                                  (falls back to MAIL_FROM, then MAIL_USERNAME)

    Optional:
        MAIL_SERVER            -> defaults to smtp.gmail.com
        MAIL_PORT              -> defaults to 587
        MAIL_USE_TLS           -> defaults to true

    The credentials are read at call time and are never logged, returned,
    or embedded in error messages.
    """
    username = os.getenv("MAIL_USERNAME", "").strip()
    password = os.getenv("MAIL_PASSWORD", "").strip()

    if not username or not password:
        raise SMTPConfigurationError(
            "MAIL_USERNAME and MAIL_PASSWORD are not configured. "
            "Set them (Gmail address + Gmail App Password) in the "
            "Render environment variables."
        )

    sender = (
        os.getenv("MAIL_DEFAULT_SENDER", "").strip()
        or os.getenv("MAIL_FROM", "").strip()
        or username
    )

    server = os.getenv("MAIL_SERVER", "smtp.gmail.com").strip() or "smtp.gmail.com"

    try:
        port = int(os.getenv("MAIL_PORT", "587").strip() or "587")
    except ValueError:
        raise SMTPConfigurationError(
            "MAIL_PORT must be an integer (e.g. 587)."
        )

    use_tls = os.getenv("MAIL_USE_TLS", "true").strip().lower() in ("1", "true", "yes", "on")

    return server, port, use_tls, username, password, sender


def _send_email(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str
) -> bool:
    """
    Send email through Gmail SMTP using smtplib.
    """
    try:
        server_host, port, use_tls, username, password, sender = _get_mail_config()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"LatticeLink <{sender}>"
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        logger.info(
            "Sending OTP email via SMTP. From=%s To=%s Subject=%s",
            sender,
            to_email,
            subject
        )

        with smtplib.SMTP(server_host, port, timeout=SMTP_TIMEOUT_SECONDS) as server:
            if use_tls:
                server.starttls()
            server.login(username, password)
            server.sendmail(sender, [to_email], msg.as_string())

        logger.info(
            "Email successfully dispatched via SMTP to %s (Subject: %s)",
            to_email,
            subject
        )

        return True

    except SMTPConfigurationError:
        raise

    except smtplib.SMTPException as e:
        # Log only the exception class name: exception payloads must never
        # leak MAIL_PASSWORD or any other credential.
        logger.error(
            "SMTP dispatch to %s failed: %s",
            to_email,
            e.__class__.__name__
        )

        raise SMTPSendError(
            "Email delivery failed via SMTP. Verify MAIL_USERNAME, "
            "MAIL_PASSWORD (Gmail App Password), and network access to "
            "the mail server."
        )

    except Exception as e:
        logger.error(
            "Unexpected error during email dispatch to %s: %s",
            to_email,
            e.__class__.__name__
        )

        raise SMTPSendError(
            "Email delivery failed via SMTP: unexpected error."
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
