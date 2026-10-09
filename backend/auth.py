import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import User

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "dev-secret-change-this")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        120_000,
    )

    return (
        base64.urlsafe_b64encode(salt).decode()
        + "$"
        + base64.urlsafe_b64encode(hashed).decode()
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_b64, hash_b64 = stored.split("$", 1)

        salt = base64.urlsafe_b64decode(salt_b64)
        expected = base64.urlsafe_b64decode(hash_b64)

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            salt,
            120_000,
        )

        return hmac.compare_digest(actual, expected)

    except (ValueError, TypeError):
        return False


def create_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "exp": expires,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_user_from_token(db: Session, token: str) -> User:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(401, "Invalid authentication token.")

        user = db.get(User, int(user_id))

        if not user:
            raise HTTPException(401, "User no longer exists.")

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Authentication token has expired.")

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(401, "Invalid authentication token.")