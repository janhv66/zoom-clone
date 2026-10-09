from datetime import timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

import schemas
from database import get_db
from models import Meeting, Participant, User
from auth import get_user_from_token
from services import (end_meeting, generate_code, get_meeting_or_404,
                      meeting_out, participant_out, require_host, utcnow)

router = APIRouter(prefix="/api/meetings", tags=["meetings"])
def current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required.")

    token = authorization.split(" ", 1)[1]
    return get_user_from_token(db, token)

@router.get("/upcoming")
def upcoming(user: User = Depends(current_user), db: Session = Depends(get_db)):
    now = utcnow()
    rows = (db.query(Meeting)
            .filter(Meeting.host_id == user.id, Meeting.type == "scheduled",
                    Meeting.status != "ended", Meeting.scheduled_at >= now - timedelta(days=1))
            .order_by(Meeting.scheduled_at).all())
    return [meeting_out(m, user.id) for m in rows
            if m.scheduled_at + timedelta(minutes=m.duration_min) >= now]


@router.get("/recent")
def recent(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = (db.query(Meeting).filter(Meeting.host_id == user.id, Meeting.status == "ended")
            .order_by(Meeting.ended_at.desc()).limit(10).all())
    return [meeting_out(m, user.id) for m in rows]


@router.post("/instant", status_code=201)
def create_instant(user: User = Depends(current_user), db: Session = Depends(get_db)):
    m = Meeting(code=generate_code(db), title=f"{user.name}'s Zoom Meeting", host_id=user.id,
                type="instant", duration_min=40)
    db.add(m)
    db.commit()
    return meeting_out(m, user.id)


@router.post("/schedule", status_code=201)
def schedule(
    body: schemas.ScheduleIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    when = body.scheduled_at
    if when.tzinfo:  # store everything as naive UTC
        when = when.astimezone(timezone.utc).replace(tzinfo=None)
    m = Meeting(code=generate_code(db), title=body.title, description=body.description.strip(),
                host_id=user.id, type="scheduled", scheduled_at=when,
                duration_min=body.duration_min)
    db.add(m)
    db.commit()
    return meeting_out(m, user.id)


@router.get("/{code}")
def get_meeting(
    code: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return meeting_out(get_meeting_or_404(db, code), user.id)


@router.delete("/{code}", status_code=204)
def delete_meeting(
    code: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    m = get_meeting_or_404(db, code)

    if m.host_id != user.id:
        raise HTTPException(403, "Only the host can delete this meeting.")

    db.delete(m)
    db.commit()


@router.post("/{code}/join")
def join(
    code: str,
    body: schemas.JoinIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    m = get_meeting_or_404(db, code)
    if m.status == "ended":
        raise HTTPException(410, "This meeting has ended.")
    is_host = body.as_host and m.host_id == user.id
    p = Participant(meeting_id=m.id, user_id=user.id if is_host else None,
                    display_name=body.display_name.strip(), role="host" if is_host else "participant")
    if m.status != "live":
        m.status, m.started_at = "live", utcnow()
    db.add(p)
    db.commit()
    return {"participant": participant_out(p), "meeting": meeting_out(m, user.id)}


@router.get("/{code}/participants")
@router.get("/{code}/participants")
def participants(
    code: str,
    me: Optional[int] = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    m = get_meeting_or_404(db, code)
    me_status = None
    if me is not None:
        mp = db.get(Participant, me)
        me_status = mp.status if mp and mp.meeting_id == m.id else "removed"
    return {"meeting_status": m.status, "me_status": me_status,
            "participants": [participant_out(p) for p in m.participants if p.status == "joined"]}


@router.post("/{code}/mute-all")
def mute_all(
    code: str,
    body: schemas.ActorIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    m = get_meeting_or_404(db, code)
    require_host(db, body.actor_id, m.id)

    if body.actor_id:
        actor = db.get(Participant, body.actor_id)
        if not actor or actor.user_id != user.id:
            raise HTTPException(403, "Invalid host identity.")
    for p in m.participants:
        if p.status == "joined" and p.role != "host":
            p.is_muted = True
    db.commit()
    return {"ok": True}


@router.post("/{code}/end")
def end(
    code: str,
    body: schemas.ActorIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    m = get_meeting_or_404(db, code)
    require_host(db, body.actor_id, m.id)

    actor = db.get(Participant, body.actor_id)
    if not actor or actor.user_id != user.id:
        raise HTTPException(403, "Invalid host identity.")

    end_meeting(m)
    db.commit()
    return {"ok": True}
