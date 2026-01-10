from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import hashlib
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week
ACCESS_TOKEN_EXPIRE_MINUTES_LONG = 60 * 24 * 30 # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    # Fix for bcrypt 72 character limit bug in passlib + newer bcrypt
    if len(plain_password) > 72:
        plain_password = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Fix for bcrypt 72 character limit bug in passlib + newer bcrypt
    if len(password) > 72:
        password = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
