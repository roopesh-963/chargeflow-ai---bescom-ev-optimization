"""Authentication endpoints for seeded ChargeFlow users."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from auth.auth_service import create_access_token, verify_password
from auth.dependencies import get_current_user
from auth.models import LoginRequest, SEEDED_USERS, Token, UserInDB


router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest) -> Token:
    user = SEEDED_USERS.get(payload.username)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    access_token = create_access_token(
        {
            "sub": user.username,
            "role": user.role,
            "zone_access": user.zone_access,
        }
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        username=user.username,
    )


@router.get("/me")
def me(current_user: UserInDB = Depends(get_current_user)) -> dict:
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "zone_access": current_user.zone_access,
    }
