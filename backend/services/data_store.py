"""Shared data-loading utilities for Bengaluru EV planning data."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "zones.json"


def load_zones() -> list[dict[str, Any]]:
    """Load zone data from disk and normalize fields for backend consumers."""
    with DATA_PATH.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    raw_zones = payload.get("zones", payload) if isinstance(payload, dict) else payload
    normalized: list[dict[str, Any]] = []

    for zone in raw_zones:
        existing_stations = [
            {
                **station,
                "lng": station.get("lng", station.get("lon")),
            }
            for station in zone.get("existing_stations", [])
        ]
        normalized.append(
            {
                **zone,
                "zone": zone.get("zone", zone.get("name")),
                "name": zone.get("name", zone.get("zone")),
                "lng": zone.get("lng", zone.get("lon")),
                "grid_capacity": zone.get("grid_capacity", zone.get("grid_capacity_kw", 0)),
                "grid_capacity_kw": zone.get("grid_capacity_kw", zone.get("grid_capacity", 0)),
                "daily_demand_kw": zone.get("daily_demand_kw", 0),
                "existing_stations": existing_stations,
            }
        )

    return normalized
