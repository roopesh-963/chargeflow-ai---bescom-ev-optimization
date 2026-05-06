"""Zone normalization and filtering helpers for API routes."""

from __future__ import annotations

from typing import Any


ZONE_VARIATIONS = {
    "electronic_city": "Electronic City",
    "electronic city": "Electronic City",
    "whitefield": "Whitefield",
    "koramangala": "Koramangala",
    "hebbal": "Hebbal",
    "sarjapur": "Sarjapur",
    "indiranagar": "Indiranagar",
    "yelahanka": "Yelahanka",
}


def normalize_zone(zone: str | None) -> str:
    """Normalize a user-provided zone label to a canonical display name.

    Args:
        zone: Raw zone name from the client or query string.

    Returns:
        Canonical zone display name, or an empty string when no zone is provided.
    """
    if not zone:
        return ""

    cleaned = zone.strip()
    if not cleaned:
        return ""

    lowered = cleaned.lower()
    if lowered in ZONE_VARIATIONS:
        return ZONE_VARIATIONS[lowered]

    return " ".join(part.capitalize() for part in cleaned.replace("_", " ").split())


def filter_zones(zones: list[dict[str, Any]], zone: str | None) -> list[dict[str, Any]]:
    """Filter a zone list safely while guaranteeing a non-empty fallback.

    Args:
        zones: Normalized zone dictionaries loaded from the data store.
        zone: Optional requested zone name.

    Returns:
        Matching zone rows, or the original input list when the zone is empty,
        refers to all zones, or produces no matches.
    """
    if not zone or zone.strip().lower() in {"all zones", "all"}:
        return zones

    normalized = normalize_zone(zone)
    filtered = [
        item
        for item in zones
        if str(item.get("name", item.get("zone", ""))).strip().lower() == normalized.lower()
    ]
    return filtered or zones
