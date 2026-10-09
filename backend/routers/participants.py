from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
from database import get_db
from models import Participant
from services import end_meeting, require_host, utcnow

router = APIRouter(prefix="/api/participants", tags=["participants"])


def _get(db: Session, pid: int) -> Participant:
    p = db.get(Participant, pid)
    if not p:
        raise HTTPException(404, "Participant not found")
    return p


@router.post("/{pid}/state")
def update_state(pid: int, body: schemas.StateIn, db: Session = Depends(get_db)):
    p = _get(db, pid)
    if body.is_muted is not None:
        p.is_muted = body.is_muted
    if body.is_video_on is not None:
        p.is_video_on = body.is_video_on
    db.commit()
    return {"ok": True}


@router.post("/{pid}/leave")
def leave(pid: int, body: schemas.LeaveIn, db: Session = Depends(get_db)):
    p = _get(db, pid)
    if body.end_meeting and p.role == "host":
        end_meeting(p.meeting)
    elif p.status == "joined":
        p.status, p.left_at = "left", utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{pid}/remove")
def remove(pid: int, body: schemas.ActorIn, db: Session = Depends(get_db)):
    target = _get(db, pid)
    require_host(db, body.actor_id, target.meeting_id)
    if target.role == "host":
        raise HTTPException(400, "The host cannot be removed.")
    target.status, target.left_at = "removed", utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{pid}/mute")
def mute(pid: int, body: schemas.ActorIn, db: Session = Depends(get_db)):
    target = _get(db, pid)
    require_host(db, body.actor_id, target.meeting_id)
    target.is_muted = True
    db.commit()
    return {"ok": True}
