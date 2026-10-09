import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import Base, SessionLocal, engine, get_db
from routers import auth, meetings, participants, signaling
from seed import seed
from fastapi import Header, HTTPException
from auth import get_user_from_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="Zoom Clone API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(meetings.router)
app.include_router(participants.router)
app.include_router(signaling.router)
app.include_router(auth.router)


@app.get("/api/me")
def me(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required.")

    token = authorization.split(" ", 1)[1]
    u = get_user_from_token(db, token)

    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "personal_meeting_id": u.personal_meeting_id,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
