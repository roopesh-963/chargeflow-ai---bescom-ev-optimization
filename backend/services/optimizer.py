"""Charging schedule optimization logic."""

from __future__ import annotations

from typing import Any

import numpy as np
from scipy.optimize import linprog

from services.data_store import load_zones
from utils.zone_utils import filter_zones

OFF_PEAK_HOURS = list(range(22, 24)) + list(range(0, 7))
RESERVED_PEAK_HOURS = {8, 9}
_applied_zones: set[str] = set()


def _build_unmanaged_schedule(ev_daily_demand: float, hours: int) -> list[float]:
    unmanaged: list[float] = []
    weights = [
        3.5 if 18 <= hour <= 21 else 2.0 if 7 <= hour <= 9 else 0.3
        for hour in range(hours)
    ]
    weight_total = sum(weights) or 1.0

    for hour in range(hours):
        factor = 3.5 if 18 <= hour <= 21 else 2.0 if 7 <= hour <= 9 else 0.3
        unmanaged.append(ev_daily_demand * factor / weight_total)

    return unmanaged


def _slot_label(hour: int) -> str:
    return f"{hour:02d}:00 - {(hour + 1) % 24:02d}:00"


def _peak_slot(schedule: list[float]) -> str:
    peak_hour = max(range(len(schedule)), key=lambda hour: schedule[hour])
    return _slot_label(peak_hour)


def optimize_schedule(zone: dict[str, Any], hours: int = 24) -> dict[str, Any]:
    """
    LP optimizer for EV charging schedule.

    Objective: Minimize peak-hour charging cost while respecting feeder limits.
    """
    ev_daily_demand = float(zone["ev_users"]) * 0.45
    grid_cap = float(zone["grid_capacity_kw"])
    base_load = float(zone["daily_demand_kw"]) / hours

    c = np.full(hours + 1, 0.001)
    c[-1] = 1.0
    for hour in range(hours):
        if 6 <= hour <= 9:
            c[hour] = 0.010
        elif 18 <= hour <= 22:
            c[hour] = 0.010
        elif hour >= 22 or hour <= 6:
            c[hour] = 0.0001
        else:
            c[hour] = 0.003

    A_eq = [np.append(np.ones(hours), 0.0)]
    b_eq = [ev_daily_demand]

    hourly_limit = grid_cap * 0.30
    A_ub = []
    b_ub = []
    for hour in range(hours):
        hourly_cap_row = np.zeros(hours + 1)
        hourly_cap_row[hour] = 1.0
        A_ub.append(hourly_cap_row)
        b_ub.append(hourly_limit)

        peak_row = np.zeros(hours + 1)
        peak_row[hour] = 1.0
        peak_row[-1] = -1.0
        A_ub.append(peak_row)
        b_ub.append(0.0)

    for hour in RESERVED_PEAK_HOURS:
        b_ub[hour * 2] = 0.0

    bounds = [(0.0, hourly_limit) for _ in range(hours)] + [(0.0, None)]
    for hour in RESERVED_PEAK_HOURS:
        bounds[hour] = (0.0, 0.0)

    result = linprog(
        c,
        A_ub=np.array(A_ub),
        b_ub=np.array(b_ub),
        A_eq=A_eq,
        b_eq=b_eq,
        bounds=bounds,
        method="highs",
    )

    if not result.success or result.x is None:
        optimized = [ev_daily_demand / hours] * hours
        solver_status = result.message if hasattr(result, "message") else "fallback"
    else:
        optimized = result.x[:hours].tolist()
        solver_status = result.message if hasattr(result, "message") else "optimized"

    unmanaged = _build_unmanaged_schedule(ev_daily_demand, hours)

    total_unmanaged = [base_load + value for value in unmanaged]
    total_optimized = [base_load + value for value in optimized]

    peak_unmanaged = max(total_unmanaged)
    peak_optimized = max(total_optimized)
    peak_reduction_pct = round(
        (peak_unmanaged - peak_optimized) / peak_unmanaged * 100,
        1,
    )

    off_peak_load = sum(optimized[hour] for hour in OFF_PEAK_HOURS)
    off_peak_shift_pct = round(
        off_peak_load / ev_daily_demand * 100,
        1,
    ) if ev_daily_demand else 0.0

    available = [
        (hour, hourly_limit - total_optimized[hour])
        for hour in OFF_PEAK_HOURS
    ]
    available.sort(key=lambda item: -item[1])
    recommended_slots = [
        {
            "hour": hour,
            "label": _slot_label(hour),
            "available_kw": round(capacity, 1),
            "recommended": True,
        }
        for hour, capacity in available[:6]
    ]

    return {
        "zone": zone["name"],
        "method": "scipy.linprog (HiGHS solver)",
        "current_peak_slot": _peak_slot(unmanaged),
        "recommended_slot": recommended_slots[0]["label"] if recommended_slots else "22:00 - 23:00",
        "shift_percent": off_peak_shift_pct,
        "peak_reduction_percent": peak_reduction_pct,
        "is_applied": is_schedule_applied(zone["name"]),
        "unmanaged_load": [round(value, 2) for value in total_unmanaged],
        "optimized_load": [round(value, 2) for value in total_optimized],
        "unmanaged_hourly_schedule": [round(value, 2) for value in unmanaged],
        "optimized_hourly_schedule": [round(value, 2) for value in optimized],
        "grid_safe_threshold": round(grid_cap * 0.85, 2),
        "off_peak_shift_pct": off_peak_shift_pct,
        "recommended_slots": recommended_slots,
        "solver_status": solver_status,
        "ev_daily_demand_kw": round(ev_daily_demand, 2),
        "explanation": (
            f"LP optimizer shifted {off_peak_shift_pct}% of {zone['name']} EV demand to off-peak hours, "
            f"reducing peak load by {peak_reduction_pct}% while satisfying grid capacity constraint of "
            f"{grid_cap:.0f} kW per feeder."
        ),
    }


def optimize_all_zones(zones: list[dict[str, Any]]) -> dict[str, Any]:
    results = [optimize_schedule(zone) for zone in zones]
    total_peak_reduction = round(
        sum(item["peak_reduction_percent"] for item in results) / len(results),
        1,
    ) if results else 0.0
    return {
        "zones": results,
        "summary": {
            "avg_peak_reduction_pct": total_peak_reduction,
            "method": "scipy LP (HiGHS)",
            "total_zones_optimized": len(results),
            "explanation": (
                f"LP optimizer reduced average peak load by {total_peak_reduction}% across {len(results)} zones "
                f"by shifting EV charging to off-peak hours."
            ),
        },
    }


def apply_schedule_optimization(zone_name: str | None = None) -> list[str]:
    """Mark one or more zones as having optimization applied."""
    zones = filter_zones(load_zones(), zone_name)
    applied_now: list[str] = []

    for zone in zones:
        zone_key = zone["zone"]
        if zone_key not in _applied_zones:
            _applied_zones.add(zone_key)
            applied_now.append(zone_key)

    return applied_now


def is_schedule_applied(zone_name: str) -> bool:
    return zone_name in _applied_zones
