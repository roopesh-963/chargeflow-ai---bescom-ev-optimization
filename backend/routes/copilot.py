"""Gemini-backed AI copilot API endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.common import simulate_processing_delay
from services.copilot_engine import answer_copilot
from services.database import list_sessions


router = APIRouter(prefix="/api/copilot", tags=["Copilot"])


class CopilotRequest(BaseModel):
    """Input payload for the ChargeFlow AI copilot."""

    query: str = Field(..., min_length=3)
    session_id: str | None = Field(default=None)


@router.post("")
def ask_copilot(payload: CopilotRequest) -> dict:
    """Return a natural-language answer using Gemini with a local fallback."""
    simulate_processing_delay()
    return {
        "success": True,
        "data": answer_copilot(query=payload.query, session_id=payload.session_id),
    }


@router.get("/sessions")
def get_copilot_sessions() -> dict:
    """Return recent copilot sessions stored in MongoDB."""
    simulate_processing_delay()
    return {"success": True, "data": list_sessions()}
