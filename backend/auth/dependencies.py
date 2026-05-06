"""FastAPI dependencies for authenticated ChargeFlow API access."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.auth_service import verify_token
from auth.models import SEEDED_USERS, UserInDB


security = HTTPBearer(auto_error=True)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInDB:
    payload = verify_token(credentials.credentials)
    username = payload.get("sub")
    user = SEEDED_USERS.get(username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authenticated user not found")
    return user


def require_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def require_operator_or_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role not in {"admin", "operator", "planner"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator access required")
    return current_user
