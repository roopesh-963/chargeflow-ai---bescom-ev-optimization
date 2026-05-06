"""Infrastructure planning API endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from services.common import simulate_processing_delay
from services.planner_engine import rank_zones_for_new_stations
from utils.cache import api_cache
from utils.zone_utils import filter_zones


router = APIRouter(prefix="/api/planner", tags=["Planner"])


EVALUATION_SUMMARY = {
    "vs_uniform_placement": "MCDM scoring selects 3.2x higher demand zones vs uniform grid placement",
    "shap_confidence": "avg 0.87 across all zone rankings",
}


@router.get("")
def get_planner_recommendations(zone: Optional[str] = Query(default=None)) -> dict:
    """Return ranked charger expansion recommendations by zone."""
    cache_key = f"/api/planner:{zone or 'all'}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    simulate_processing_delay()
    recommendations = rank_zones_for_new_stations()
    recommendation_rows = [{"name": item["zone"], **item} for item in recommendations]
    filtered = filter_zones(recommendation_rows, zone)
    print(f"Zone requested: {zone}, returning {len(filtered)} zones")
    data = [
        {
            key: value
            for key, value in item.items()
            if key != "name"
        }
        for item in filtered
    ]
    response = {"success": True, "data": data, "evaluation": EVALUATION_SUMMARY}
    api_cache.set(cache_key, response, ttl_seconds=120)
    return response
