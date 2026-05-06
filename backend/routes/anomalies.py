"""Anomaly detection and next-hour prediction API endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from services.anomaly_service import get_zone_anomaly_snapshot
from services.common import simulate_processing_delay
from services.data_store import load_zones
from services.prediction_service import predict_next_hours
from utils.cache import api_cache
from utils.zone_utils import filter_zones, normalize_zone


router = APIRouter(tags=["AI Insights"])


@router.get("/api/anomalies")
def get_anomalies(zone: Optional[str] = Query(default=None)) -> dict:
    """Return last 24 hours of anomaly-annotated demand for a zone."""
    normalized_zone = normalize_zone(zone) if zone else None
    cache_key = f"/api/anomalies:{normalized_zone or 'all'}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    simulate_processing_delay()
    zones = load_zones()
    filtered = filter_zones(zones, zone)

    if normalized_zone and normalized_zone.lower() not in {"all zones", "all"} and filtered:
        zone_name = filtered[0]["zone"]
    elif filtered:
        zone_name = filtered[0]["zone"]
    else:
        raise HTTPException(status_code=404, detail="Zone not found")

    try:
        snapshot = get_zone_anomaly_snapshot(zone_name)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    response = {"success": True, **snapshot}
    api_cache.set(cache_key, response, ttl_seconds=45)
    return response


@router.get("/api/predictions")
def get_predictions(zone: Optional[str] = Query(default=None), hours: int = Query(default=6, ge=1, le=12)) -> dict:
    """Return next-hour demand predictions and confidence intervals."""
    simulate_processing_delay()
    zones = load_zones()
    filtered = filter_zones(zones, zone)
    normalized_zone = normalize_zone(zone) if zone else None

    if normalized_zone and normalized_zone.lower() not in {"all zones", "all"} and filtered:
        zone_name = filtered[0]["zone"]
    elif filtered:
        zone_name = filtered[0]["zone"]
    else:
        raise HTTPException(status_code=404, detail="Zone not found")

    try:
        result = predict_next_hours(zone_name, hours=hours)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {"success": True, **result}
