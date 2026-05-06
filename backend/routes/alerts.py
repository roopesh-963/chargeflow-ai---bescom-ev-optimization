"""Grid alert API endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from services.common import simulate_processing_delay
from services.data_store import load_zones
from utils.zone_utils import filter_zones


router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
def get_alerts(zone: Optional[str] = Query(default=None)) -> dict:
    """Detect overload risk and return alert severity by zone."""
    simulate_processing_delay()

    alerts = []
    zones = load_zones()
    zones = filter_zones(zones, zone)
    print(f"Zone requested: {zone}, returning {len(zones)} zones")

    for zone_row in zones:
        load_indicator = zone_row["daily_demand_kw"] / max(zone_row["grid_capacity_kw"], 1)

        if load_indicator > 0.9:
            severity = "critical"
            message = f"{zone_row['zone']} transformer overload risk during evening peak."
        elif load_indicator > 0.72:
            severity = "warning"
            message = f"{zone_row['zone']} demand surge likely tomorrow."
        else:
            severity = "healthy"
            message = f"{zone_row['zone']} currently has healthy grid headroom."

        alerts.append(
            {
                "zone": zone_row["zone"],
                "severity": severity,
                "message": message,
                "explanation": [
                    "Derived from estimated daily EV charging demand",
                    "Compared against configured local grid capacity",
                ],
            }
        )

    return {"success": True, "data": alerts, "alerts": alerts}
