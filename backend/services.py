import os
import random
import re
import string
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Meeting, Participant

DEFAULT_USER_ID = 1  # no auth: a default user is always "logged in"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(dt):
    return dt.isoformat() + "Z" if dt else None


def generate_code(db: Session) -> str:
    while True:
        code = "".join(random.choices(string.digits, k=10))
        if code[0] != "0" and not db.query(Meeting).filter_by(code=code).first():
            return code


def parse_code(raw: str):
    """Accepts '823 456 7890', '823-456-7890' or a full invite link."""
    cleaned = re.sub(r"[\s-]", "", raw or "")
    m = re.search(r"\d{9,11}", cleaned)
    return m.group(0) if m else None


def get_meeting_or_404(db: Session, raw: str) -> Meeting:
    code = parse_code(raw)
    meeting = db.query(Meeting).filter_by(code=code).first() if code else None
    if not meeting:
        raise HTTPException(404, "Invalid meeting ID. Please check and try again.")
    return meeting


def meeting_out(m: Meeting, actor_id: int | None = None) -> dict:
    return {
        "id": m.id,
        "code": m.code,
        "title": m.title,
        "description": m.description,
        "type": m.type,
        "status": m.status,
        "scheduled_at": iso(m.scheduled_at),
        "duration_min": m.duration_min,
        "started_at": iso(m.started_at),
        "ended_at": iso(m.ended_at),
        "host_name": m.host.name,
        "is_host": actor_id is not None and m.host_id == actor_id,
        "invite_link": f"{FRONTEND_URL}/j/{m.code}",
    }


def participant_out(p: Participant) -> dict:
    return {
        "id": p.id,
        "display_name": p.display_name,
        "role": p.role,
        "is_muted": p.is_muted,
        "is_video_on": p.is_video_on,
        "status": p.status,
    }


def end_meeting(m: Meeting):
    now = utcnow()
    m.status, m.ended_at = "ended", now
    for p in m.participants:
        if p.status == "joined":
            p.status, p.left_at = "left", now


def require_host(db: Session, actor_id: int, meeting_id: int) -> Participant:
    actor = db.get(Participant, actor_id)
    if not actor or actor.meeting_id != meeting_id or actor.role != "host" or actor.status != "joined":
        raise HTTPException(403, "Only the host can do this.")
    return actor
