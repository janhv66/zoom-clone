from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
from auth import create_token, hash_password, verify_password
from database import get_db
from models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def generate_personal_meeting_id(db: Session) -> str:
    import random
    import string

    while True:
        code = "".join(random.choices(string.digits, k=10))

        if code[0] == "0":
            continue

        existing = (
            db.query(User)
            .filter_by(personal_meeting_id=code)
            .first()
        )

        if not existing:
            return code


@router.post("/signup", status_code=201)
def signup(body: schemas.SignupIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()

    existing = db.query(User).filter_by(email=email).first()

    if existing:
        raise HTTPException(
            409,
            "An account with this email already exists.",
        )

    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        personal_meeting_id=generate_personal_meeting_id(db),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "personal_meeting_id": user.personal_meeting_id,
        },
    }


@router.post("/login")
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()

    user = db.query(User).filter_by(email=email).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")

    token = create_token(user.id)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "personal_meeting_id": user.personal_meeting_id,
        },
    }