"""
Password hashing utilities using passlib and bcrypt.
Bcrypt accepts at most 72 bytes; we normalize input to avoid ValueError.
"""
import warnings
import logging
from passlib.context import CryptContext

# Suppress bcrypt version warning
warnings.filterwarnings(
    "ignore",
    message=".*__about__.*",
    category=UserWarning
)

# Also suppress via logging
logging.getLogger(
    "passlib.handlers.bcrypt"
).setLevel(logging.ERROR)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain: str, hashed: str
) -> bool:
    try:
        return pwd_context.verify(
            plain, hashed
        )
    except Exception:
        return False
