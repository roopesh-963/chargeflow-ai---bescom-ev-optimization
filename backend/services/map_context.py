"""Map-aware helpers for planner and copilot responses."""

from __future__ import annotations

from urllib.parse import quote_plus

from services.config import get_settings


ZONE_COORDINATES = {
    "Whitefield": {"lat": 12.9698, "lng": 77.7499},
    "Koramangala": {"lat": 12.9352, "lng": 77.6245},
    "Electronic City": {"lat": 12.8399, "lng": 77.6770},
    "Hebbal": {"lat": 13.0358, "lng": 77.5970},
    "Sarjapur": {"lat": 12.9081, "lng": 77.6476},
    "Indiranagar": {"lat": 12.9784, "lng": 77.6408},
    "Yelahanka": {"lat": 13.1007, "lng": 77.5963},
}


def get_zone_map_context(zone_name: str) -> dict[str, str | float | bool]:
    """Return map coordinates and a Google Maps link for a zone."""
    coordinates = ZONE_COORDINATES.get(zone_name)
    if not coordinates:
        return {"available": False}

    query = quote_plus(f"{zone_name}, Bengaluru")
    settings = get_settings()
    maps_link = f"https://www.google.com/maps/search/?api=1&query={query}"

    payload: dict[str, str | float | bool] = {
        "available": True,
        "zone": zone_name,
        "lat": coordinates["lat"],
        "lng": coordinates["lng"],
        "maps_link": maps_link,
    }

    if settings.google_map_api_key:
        payload["maps_enabled"] = True

    return payload
