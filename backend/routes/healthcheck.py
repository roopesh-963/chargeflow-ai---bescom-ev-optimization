"""Backend healthcheck endpoint for demo readiness."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from services.data_store import load_zones
from services.model_trainer import MODEL_PATH


router = APIRouter(prefix="/api/health", tags=["Health"])
_last_prediction_time: str | None = None


def build_health_payload() -> dict:
    """Return the public health payload used by all health endpoints."""
    return {
        "status": "ok",
        "version": "ChargeFlow AI v2.0",
        "model_loaded": MODEL_PATH.exists(),
        "zones_count": min(7, len(load_zones())),
        "optimizer": "priority-based load shifter",
        "ai_models": [
            "GradientBoostingRegressor",
            "IsolationForest",
            "RandomForestRegressor",
        ],
        "data_mode": "synthetic/masked",
        "copilot_data_policy": "anonymised synthetic only",
    }


def mark_prediction_completed() -> None:
    """Track the most recent forecast execution time for health reporting."""
    global _last_prediction_time
    _last_prediction_time = datetime.now(timezone.utc).isoformat()


@router.get("")
def get_healthcheck() -> dict:
    """Return backend status for judge/demo workflows."""
    return build_health_payload()
