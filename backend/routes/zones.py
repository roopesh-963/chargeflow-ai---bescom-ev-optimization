"""Available zone metadata endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from services.data_store import load_zones


router = APIRouter(prefix="/api/zones", tags=["Zones"])


@router.get("")
def get_zones() -> dict:
    """Return the exact list of selectable zones for the frontend."""
    zone_names = ["All Zones", *[zone["name"] for zone in load_zones()]]
    return {"success": True, "data": zone_names, "zones": zone_names}
