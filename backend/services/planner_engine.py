"""Infrastructure planning logic for charger expansion recommendations."""

from __future__ import annotations

from typing import Any

from services.common import bounded_random
from services.data_store import load_zones
from services.shap_service import get_planner_shap


def rank_zones_for_new_stations() -> list[dict[str, Any]]:
    """Rank Bengaluru zones for new charging station rollout.

    Args:
        None.

    Returns:
        A sorted list of planner recommendation dictionaries by descending priority.
    """
    ranked: list[dict[str, Any]] = []

    for zone in load_zones():
        charger_gap = zone["ev_users"] / max(zone["chargers"], 1)
        demand_score = zone["ev_users"] / 140
        gap_bonus = charger_gap * 1.9
        coverage_penalty = zone["chargers"] * 2.2
        capacity_bonus = zone["grid_capacity_kw"] / 180
        score = round(demand_score + gap_bonus - coverage_penalty + capacity_bonus, 2)
        demand_growth_score = bounded_random(zone["ev_users"] / 700, 3, 10, 35)

        reasons = []
        if zone["ev_users"] > 3000:
            reasons.append("High EV adoption")
        if charger_gap > 220:
            reasons.append("High charger gap")
        if zone["grid_capacity_kw"] > 6000:
            reasons.append("Adequate grid headroom")

        try:
            explanation = get_planner_shap(
                {
                    "ev_users": zone["ev_users"],
                    "chargers": zone["chargers"],
                    "grid_capacity": zone["grid_capacity_kw"],
                    "demand_growth": demand_growth_score,
                }
            )
            explanation_source = "shap"
        except Exception:
            fallback_reasons = reasons or ["Balanced charger demand profile", "Moderate rollout readiness"]
            explanation = f"Prioritized due to {fallback_reasons[0].lower()} and {fallback_reasons[-1].lower()}"
            explanation_source = "fallback"

        ranked.append(
            {
                "zone": zone["zone"],
                "score": score,
                "recommended_new_stations": max(2, round(charger_gap / 90)),
                "roi_estimate_percent": bounded_random(17, 5, 10, 28),
                "grid_capacity_score": round(zone["grid_capacity_kw"] / 10000, 2),
                "demand_growth_score": demand_growth_score,
                "reasons": reasons,
                "explanation": explanation,
                "explanation_source": explanation_source,
            }
        )

    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked
