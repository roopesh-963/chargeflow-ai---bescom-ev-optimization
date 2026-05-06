"""Authentication models and seeded hackathon users."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from auth.auth_service import hash_password


UserRole = Literal["admin", "operator", "planner"]


class UserInDB(BaseModel):
    username: str
    email: str
    hashed_password: str
    role: UserRole
    zone_access: list[str]


class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str


SEEDED_USERS: dict[str, UserInDB] = {
    "admin": UserInDB(
        username="admin",
        email="admin@chargeflow.ai",
        hashed_password=hash_password("bescom2025"),
        role="admin",
        zone_access=["all"],
    ),
    "operator1": UserInDB(
        username="operator1",
        email="operator1@chargeflow.ai",
        hashed_password=hash_password("operator123"),
        role="operator",
        zone_access=["Whitefield", "Koramangala"],
    ),
    "planner": UserInDB(
        username="planner",
        email="planner@chargeflow.ai",
        hashed_password=hash_password("planner123"),
        role="planner",
        zone_access=["all"],
    ),
}
