"""Scheduling API endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel
from fastapi import APIRouter, Query

from services.common import simulate_processing_delay
from services.data_store import load_zones
from services.optimizer import apply_schedule_optimization, optimize_all_zones
from utils.zone_utils import filter_zones, normalize_zone


router = APIRouter(prefix="/api/schedule", tags=["Scheduling"])


class ApplyScheduleRequest(BaseModel):
    zone: str | None = None


@router.get("")
def get_schedule_recommendations(zone: Optional[str] = Query(default=None)) -> dict:
    """Return smart charging schedule recommendations and optimized load curves."""
    simulate_processing_delay()
    zones = filter_zones(load_zones(), zone)
    optimized = optimize_all_zones(zones)
    zone_schedules = optimized["zones"]
    summary = optimized["summary"]
    print(f"Zone requested: {zone}, returning {len(zones)} zones")

    total_grid_capacity = sum(zone["grid_capacity_kw"] for zone in zones)
    grid_safe_threshold = round(total_grid_capacity * 0.85, 2)

    unmanaged_load = [
        round(sum(item["unmanaged_load"][hour] for item in zone_schedules), 2)
        for hour in range(24)
    ]
    optimized_load = [
        round(sum(item["optimized_load"][hour] for item in zone_schedules), 2)
        for hour in range(24)
    ]

    unmanaged_peak = max(unmanaged_load) if unmanaged_load else 0
    optimized_peak = max(optimized_load) if optimized_load else 0
    peak_reduction_pct = round(((unmanaged_peak - optimized_peak) / unmanaged_peak) * 100, 2) if unmanaged_peak else 0
    off_peak_shift_pct = round(
        sum(item["off_peak_shift_pct"] for item in zone_schedules) / max(len(zone_schedules), 1),
        2,
    )

    applied_count = sum(1 for item in zone_schedules if item.get("is_applied"))
    scheduling_summary = summary["explanation"]
    if applied_count:
        scheduling_summary += f" Optimization has been applied to {applied_count} zone(s) in this view."

    normalized_zone = normalize_zone(zone) if zone else None

    return {
        "success": True,
        "data": {
            "zone_schedules": zone_schedules,
            "peak_reduction_pct": peak_reduction_pct,
            "off_peak_shift_pct": off_peak_shift_pct,
            "scheduling_summary": scheduling_summary,
            "unmanaged_load": unmanaged_load,
            "optimized_load": optimized_load,
            "grid_safe_threshold": grid_safe_threshold,
            "optimizer": "priority-based load shifter",
            "method": summary["method"],
            "solver_status": zone_schedules[0]["solver_status"] if zone_schedules else "no-zones",
            "explanation": summary["explanation"],
            "selected_zone": normalized_zone,
        },
    }


@router.post("/apply")
def apply_schedule(zone_request: ApplyScheduleRequest) -> dict:
    """Apply schedule optimization to one zone or the current filtered set."""
    applied_zones = apply_schedule_optimization(zone_request.zone)
    refreshed = get_schedule_recommendations(zone_request.zone)
    return {
        "success": True,
        "applied_zones": applied_zones,
        **refreshed,
    }
