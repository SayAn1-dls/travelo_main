import os
import logging
import httpx
from db import db
from models import utcnow

logger = logging.getLogger("travelo.email")


async def send_email(to: str, subject: str, html: str) -> bool:
    provider = os.environ.get("EMAIL_PROVIDER", "console")
    api_key = os.environ.get("SENDGRID_API_KEY", "")
    status = "logged"
    if provider == "sendgrid" and api_key:
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "personalizations": [{"to": [{"email": to}]}],
                        "from": {"email": os.environ.get("EMAIL_SENDER", "noreply@travelo.app"), "name": "Travelo"},
                        "subject": subject,
                        "content": [{"type": "text/html", "value": html}],
                    },
                )
            status = "sent" if r.status_code in (200, 202) else f"failed:{r.status_code}"
        except httpx.HTTPError as e:
            status = f"failed:{e}"
    else:
        logger.info(f"[EMAIL:console] to={to} | subject={subject}\n{html}")
    await db.email_log.insert_one({"to": to, "subject": subject, "html": html,
                                   "provider": provider, "status": status, "created_at": utcnow()})
    return status in ("sent", "logged")
