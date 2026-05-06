"""Scenario simulation API endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.common import bounded_random, simulate_processing_delay


router = APIRouter(prefix="/api/simulator", tags=["Simulator"])


class SimulatorRequest(BaseModel):
    """Input payload for EV scenario simulation."""

    ev_growth: float = Field(..., ge=0, le=100)
    new_stations: int = Field(..., ge=0, le=50)
    night_incentive: float = Field(..., ge=0, le=50)


@router.post("")
def run_simulation(payload: SimulatorRequest) -> dict:
    """Return future peak load impact, grid risk, and recommended action."""
    simulate_processing_delay()

    peak_load_impact = round((payload.ev_growth * 0.65) - (payload.new_stations * 0.45) - (payload.night_incentive * 0.35), 2)
    grid_risk_score = max(5, min(95, round(52 + (payload.ev_growth * 0.6) - (payload.new_stations * 0.8) - (payload.night_incentive * 0.55), 2)))

    if grid_risk_score > 75:
        recommendation = "Urgently add off-peak incentives and fast chargers in high-growth corridors."
    elif grid_risk_score > 55:
        recommendation = "Monitor evening peaks and phase new stations into East and South Bengaluru."
    else:
        recommendation = "Scenario is stable; proceed with expansion and maintain current pricing controls."

    return {
        "success": True,
        "data": {
            "peak_load_impact_percent": peak_load_impact,
            "grid_risk": grid_risk_score,
            "confidence": bounded_random(0.9, 0.04, 0.84, 0.97),
            "recommendation": recommendation,
        },
    }
