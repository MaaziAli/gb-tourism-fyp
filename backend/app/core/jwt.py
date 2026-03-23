"""
JWT token creation and verification utilities.
"""
from datetime import datetime, timedelta
import os

from jose import JWTError, jwt

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "gb-tourism-secret-key-2024-very-long"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode, SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise Exception(
            f"JWT decode failed: {str(e)}"
        )
