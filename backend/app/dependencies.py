from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from . import auth, crud, models, database
from .auth import SECRET_KEY, ALGORITHM

def get_current_user(request: Request, db: Session = Depends(database.get_db)):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        email_str: str = str(email)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = crud.get_user_by_email(db, email=email_str)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if str(current_user.role) != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user
