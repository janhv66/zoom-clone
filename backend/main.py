import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import Base, SessionLocal, engine, get_db
from routers import meetings, participants, signaling
from seed import seed
from services import DEFAULT_USER_ID


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


@app.get("/api/me")
def me(db: Session = Depends(get_db)):
    u = db.get(models.User, DEFAULT_USER_ID)
    return {"id": u.id, "name": u.name, "email": u.email}


@app.get("/api/health")
def health():
    return {"status": "ok"}
