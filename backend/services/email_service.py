import os
import logging
import resend

logger = logging.getLogger("LatticeLink.EmailService")


class SMTPConfigurationError(Exception):
    """Raised when the email provider is not configured."""
    pass


class SMTPSendError(Exception):
    """Raised when email delivery fails."""
    pass


def _get_resend_api_key():
    """
    Get the Resend API key from the environment.

    The key is read at call time and is never logged, returned, or stored.
    """
    api_key = os.getenv("RESEND_API_KEY", "").strip()

    if not api_key:
        raise SMTPConfigurationError(
            "RESEND_API_KEY is not configured. "
            "Add it to the Render environment variables."
        )

    return api_key


def _get_from_email():
    """
    Get the verified Resend sender identity from the RESEND_FROM
    environment variable (e.g. "LatticeLink <noreply@yourdomain.com>").

    It must be a sender identity verified in your Resend account.
    "onboarding@resend.dev" may be used for sandbox testing only.
    """

    from_email = os.getenv("RESEND_FROM", "").strip()

    if not from_email:
        raise SMTPConfigurationError(
            "RESEND_FROM is not configured. "
            "Add a verified sender identity to the Render environment variables."
        )

    return from_email


def _send_email(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str
) -> bool:
    """
    Send email through Resend API.
    """

    try:
        api_key = _get_resend_api_key()
        from_email = _get_from_email()

        resend.api_key = api_key

        params = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        logger.info(
            "Sending email through Resend. "
            "From=%s To=%s Subject=%s",
            from_email,
            to_email,
            subject
        )

        response = resend.Emails.send(params)

        logger.info(
            "Email successfully dispatched via Resend. Response=%s",
            response
        )

        return True

    except SMTPConfigurationError:
        raise

    except Exception as e:
        logger.error(
            "Resend email delivery failed. To=%s Error=%s",
            to_email,
            e
        )

        raise SMTPSendError(
            f"Email delivery failed: {str(e)}"
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