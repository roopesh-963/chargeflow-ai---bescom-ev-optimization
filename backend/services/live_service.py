"""Real-time synthetic live snapshot generation for WebSocket clients."""

from __future__ import annotations

import random
from datetime import datetime
from typing import Any

from services.data_store import load_zones


_last_zone_demand: dict[str, float] = {}


def _current_hour_factor(hour: int) -> float:
    if 7 <= hour <= 10:
        return 1.06
    if 17 <= hour <= 22:
        return 1.18
    if 0 <= hour <= 5:
        return 0.82
    return 0.96


async def generate_live_snapshot() -> dict[str, Any]:
    """Return a fluctuating synthetic live status snapshot for all zones."""
    now = datetime.now()
    hour_factor = _current_hour_factor(now.hour)
    zones: list[dict[str, Any]] = []
    critical_count = 0
    warning_count = 0
    total_active_evs = 0

    for zone in load_zones():
        zone_name = str(zone["zone"])
        base_demand = max(float(zone.get("daily_demand_kw", 0)) / 24, 1.0)
        fluctuated_demand = base_demand * hour_factor * random.uniform(0.97, 1.03)
        current_demand_kw = round(fluctuated_demand, 2)
        capacity_kw = max(float(zone.get("grid_capacity_kw", 1)), 1.0)
        grid_stress_pct = round((current_demand_kw / capacity_kw) * 100, 2)

        if grid_stress_pct > 85:
            status = "critical"
            critical_count += 1
        elif grid_stress_pct > 65:
            status = "warning"
            warning_count += 1
        else:
            status = "normal"

        active_sessions = max(
            1,
            round(
                float(zone.get("ev_users", 0))
                * (0.011 if 17 <= now.hour <= 22 else 0.0085 if 7 <= now.hour <= 10 else 0.006)
                * random.uniform(0.96, 1.04)
            ),
        )
        previous = _last_zone_demand.get(zone_name, current_demand_kw)
        delta_from_last = round(current_demand_kw - previous, 2)
        _last_zone_demand[zone_name] = current_demand_kw
        total_active_evs += active_sessions

        zones.append(
            {
                "name": zone_name,
                "current_demand_kw": current_demand_kw,
                "grid_stress_pct": grid_stress_pct,
                "active_sessions": active_sessions,
                "status": status,
                "delta_from_last": delta_from_last,
            }
        )

    if critical_count > 0:
        system_status = "critical"
    elif warning_count > 0:
        system_status = "warning"
    else:
        system_status = "normal"

    return {
        "timestamp": now.isoformat(),
        "zones": zones,
        "system_status": system_status,
        "total_active_evs": total_active_evs,
    }
