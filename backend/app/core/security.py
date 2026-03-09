"""
Password hashing utilities using passlib and bcrypt.
Bcrypt accepts at most 72 bytes; we normalize input to avoid ValueError.
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def _normalize_for_bcrypt(password: str) -> str:
    """Ensure password is str and at most 72 bytes (bcrypt limit)."""
    if not isinstance(password, str):
        password = str(password)
    raw = password.encode("utf-8")
    if len(raw) > 72:
        raw = raw[:72]
    return raw.decode("utf-8", errors="ignore") or password[:1]


def hash_password(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(_normalize_for_bcrypt(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(_normalize_for_bcrypt(plain_password), hashed_password)
