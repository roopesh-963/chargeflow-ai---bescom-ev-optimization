"""Forecast API endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from routes.healthcheck import mark_prediction_completed
from services.common import simulate_processing_delay
from services.data_store import load_zones
from services.forecast_engine import generate_forecast
from utils.cache import api_cache
from utils.zone_utils import filter_zones, normalize_zone


router = APIRouter(prefix="/api/forecast", tags=["Forecast"])


@router.get("")
def get_forecast(zone: Optional[str] = Query(default=None)) -> dict:
    """Return hourly EV demand forecast data for one zone or all zones."""
    normalized_zone = normalize_zone(zone) if zone else None
    cache_key = f"/api/forecast:{normalized_zone or 'all'}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    simulate_processing_delay()
    zones = load_zones()
    filtered = filter_zones(zones, zone)
    print(f"Zone requested: {zone}, returning {len(filtered)} zones")

    try:
        if normalized_zone and normalized_zone.lower() not in {"all zones", "all"} and len(filtered) == 1:
            result = generate_forecast(filtered[0]["zone"])
        else:
            result = generate_forecast()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    data = [result] if isinstance(result, dict) else result
    mark_prediction_completed()
    response = {
        "success": True,
        "data": data,
        "zones": data,
        "summary": {"requested_zone": normalized_zone or "All Zones"},
    }
    api_cache.set(cache_key, response, ttl_seconds=60)
    return response
