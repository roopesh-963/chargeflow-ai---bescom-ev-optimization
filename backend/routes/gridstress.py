"""Grid stress playback API endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from services.common import simulate_processing_delay
from services.data_store import load_zones
from services.forecast_engine import generate_forecast
from utils.cache import api_cache
from utils.zone_utils import filter_zones, normalize_zone


router = APIRouter(prefix="/api/gridstress", tags=["Grid Stress"])

@router.get("")
def get_grid_stress_snapshots(zone: Optional[str] = Query(default=None)) -> dict:
    """Return 24 hourly demand and stress snapshots across all Bengaluru zones."""
    normalized_zone = normalize_zone(zone) if zone else None
    cache_key = f"/api/gridstress:{normalized_zone or 'all'}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        return cached

    simulate_processing_delay()

    zones = load_zones()
    filtered = filter_zones(zones, zone)
    print(f"Zone requested: {zone}, returning {len(filtered)} zones")

    if normalized_zone and normalized_zone.lower() not in {"all zones", "all"} and len(filtered) == 1:
        forecast_payload = generate_forecast(filtered[0]["zone"])
    else:
        forecast_payload = generate_forecast()

    forecast = [forecast_payload] if isinstance(forecast_payload, dict) else forecast_payload
    zone_lookup = {item["zone"]: item for item in zones}
    snapshots: list[dict[str, float | int | str]] = []

    for zone_forecast in forecast:
        zone_name = zone_forecast["zone"]
        zone_row = zone_lookup[zone_name]
        capacity_kw = round(float(zone_row["grid_capacity_kw"]), 2)

        for hour_index, point in enumerate(zone_forecast["hourly_forecast"]):
            demand_kw = round(float(point["predicted_demand_kw"]), 2)
            stress_pct = round((demand_kw / capacity_kw) * 100, 2) if capacity_kw else 0.0

            if stress_pct > 85:
                status = "critical"
            elif stress_pct > 65:
                status = "warning"
            else:
                status = "normal"

            snapshots.append(
                {
                    "hour": hour_index,
                    "zone_name": zone_name,
                    "demand_kw": demand_kw,
                    "capacity_kw": capacity_kw,
                    "stress_pct": stress_pct,
                    "status": status,
                }
            )

    response = {"success": True, "data": snapshots, "snapshots": snapshots}
    api_cache.set(cache_key, response, ttl_seconds=30)
    return response
