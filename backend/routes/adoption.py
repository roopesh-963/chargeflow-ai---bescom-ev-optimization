"""EV adoption growth forecast API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from services.adoption_service import forecast_adoption, summarize_adoption
from services.common import simulate_processing_delay


router = APIRouter(prefix="/api/adoption", tags=["Adoption"])


@router.get("")
def get_adoption_forecast(
    zone: str = Query(...),
    scenario: str = Query(default="moderate"),
) -> dict:
    """Return a 12-month adoption projection for one zone and scenario."""
    simulate_processing_delay()

    try:
        data = forecast_adoption(zone=zone, months=12, scenario=scenario)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"success": True, "data": data}


@router.get("/summary")
def get_adoption_summary() -> dict:
    """Return month-12 adoption outcomes for every zone and scenario."""
    simulate_processing_delay()
    return {"success": True, "data": summarize_adoption(months=12)}
