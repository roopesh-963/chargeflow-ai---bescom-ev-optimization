"""Monthly EV adoption growth projections by zone and scenario."""

from __future__ import annotations

import math
from calendar import month_abbr
from datetime import datetime
from typing import Any

from services.data_store import load_zones
from utils.zone_utils import normalize_zone


SCENARIO_GROWTH_RATES = {
    "conservative": 0.02,
    "moderate": 0.04,
    "aggressive": 0.07,
}


def _get_zone(zone_name: str) -> dict[str, Any]:
    """Return the configured zone row or raise if not found."""
    normalized_zone_name = normalize_zone(zone_name)
    for zone in load_zones():
        if zone["zone"].lower() == normalized_zone_name.lower():
            return zone
    raise ValueError(f"Zone '{zone_name}' not found")


def forecast_adoption(zone: str, months: int = 12, scenario: str = "moderate") -> list[dict[str, Any]]:
    """Project EV adoption, charger need, demand, and stress for one zone."""
    normalized_scenario = scenario.lower()
    if normalized_scenario not in SCENARIO_GROWTH_RATES:
        raise ValueError(f"Scenario '{scenario}' not supported")

    zone_row = _get_zone(zone)
    growth_rate = SCENARIO_GROWTH_RATES[normalized_scenario]
    base_ev_count = int(zone_row["ev_users"])
    current_chargers = int(zone_row["chargers"])
    grid_capacity = float(zone_row["grid_capacity_kw"])

    projections: list[dict[str, Any]] = []
    current_date = datetime(2025, 6, 1)

    for month_index in range(1, months + 1):
        projection_date = datetime(
            current_date.year + ((current_date.month - 1 + month_index - 1) // 12),
            ((current_date.month - 1 + month_index - 1) % 12) + 1,
            1,
        )
        ev_count = math.ceil(base_ev_count * ((1 + growth_rate) ** month_index))
        required_chargers = math.ceil(ev_count / 8)
        demand_kw = round(ev_count * 0.45, 2)
        grid_stress_pct = round((demand_kw / grid_capacity) * 100, 2) if grid_capacity else 0.0

        projections.append(
            {
                "month_index": month_index,
                "month_label": f"{month_abbr[projection_date.month]} {projection_date.year}",
                "zone": zone_row["zone"],
                "scenario": normalized_scenario,
                "current_chargers": current_chargers,
                "grid_capacity": grid_capacity,
                "ev_count": ev_count,
                "required_chargers": required_chargers,
                "demand_kw": demand_kw,
                "grid_stress_pct": grid_stress_pct,
            }
        )

    return projections


def summarize_adoption(months: int = 12) -> list[dict[str, Any]]:
    """Return month-12 summaries for all zones under all scenarios."""
    summary: list[dict[str, Any]] = []

    for zone in load_zones():
        for scenario in SCENARIO_GROWTH_RATES:
            summary.append(forecast_adoption(zone["zone"], months=months, scenario=scenario)[-1])

    return summary
