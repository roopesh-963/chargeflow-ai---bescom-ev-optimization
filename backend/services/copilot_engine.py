"""Gemini-backed copilot orchestration with MongoDB persistence and fallbacks."""

from __future__ import annotations

import json
from typing import Any

from google import genai

from services.common import bounded_random
from services.config import get_settings
from services.data_store import load_zones
from services.database import append_message, create_session, ensure_database_ready, get_recent_messages
from services.map_context import get_zone_map_context
from services.planner_engine import rank_zones_for_new_stations

DATA_POLICY = "synthetic/anonymised only"


SYSTEM_PROMPT = """
You are ChargeFlow AI — BESCOM's intelligent EV grid planning assistant 
for Bengaluru. You have access to data on 7 zones: Whitefield, Koramangala,
Electronic City, Hebbal, Sarjapur, Indiranagar, Yelahanka.
IMPORTANT: You only have access to synthetic/anonymised zone-level data. No real personal or operational BESCOM data is included in this conversation. Always clarify this in responses if asked about data sources.

You help operators and planners with:
- EV charging demand forecasts and peak risk
- Smart charging schedule recommendations  
- New charging station location decisions
- Grid capacity and overload alerts

ALWAYS respond in this exact JSON format, no extra text, no markdown:
{
  "answer": "Clear 2-3 sentence answer to the question",
  "confidence": 0.85,
  "zones_affected": ["Whitefield", "Koramangala"],
  "action_items": [
    "Action 1 the operator should take",
    "Action 2"
  ],
  "explanation": "One sentence explaining the reasoning",
  "severity": "info" | "warning" | "critical"
}
""".strip()


def _build_system_context() -> str:
    """Build the prompt context passed into the copilot model.

    Args:
        None.

    Returns:
        A formatted prompt string containing local zone and planner context.
    """
    planner = rank_zones_for_new_stations()[:5]
    zones = load_zones()
    zone_lines = [
        f"- {zone['zone']}: ev_users={zone['ev_users']}, chargers={zone['chargers']}, population={zone['population']}, grid_capacity_kw={zone['grid_capacity_kw']}"
        for zone in zones
    ]
    planner_lines = [
        f"- {item['zone']}: score={item['score']}, recommended_new_stations={item['recommended_new_stations']}, explanation={item.get('explanation', '')}"
        for item in planner
    ]

    return (
        f"{SYSTEM_PROMPT}\n\n"
        "Local zone data:\n"
        + "\n".join(zone_lines)
        + "\nPlanner highlights:\n"
        + "\n".join(planner_lines)
    )


def _default_structured_response(raw_text: str) -> dict[str, Any]:
    """Build the default structured response schema for fallback handling.

    Args:
        raw_text: Unstructured model text that may still contain useful content.

    Returns:
        A dictionary matching the copilot response schema.
    """
    return {
        "answer": raw_text.strip() or "ChargeFlow AI could not structure the response, but the request was received.",
        "confidence": 0.5,
        "zones_affected": [],
        "action_items": [],
        "explanation": "",
        "severity": "info",
    }


def _strip_markdown_fences(raw_text: str) -> str:
    """Remove markdown code fences from raw model output.

    Args:
        raw_text: Raw text returned by the model.

    Returns:
        A cleaned text string without outer markdown fences.
    """
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3 and lines[-1].strip() == "```":
            return "\n".join(lines[1:-1]).strip()
    return text


def _parse_structured_response(raw_text: str) -> dict[str, Any]:
    """Parse model output into the expected copilot response schema.

    Args:
        raw_text: Raw response text from Gemini or another source.

    Returns:
        A validated structured response dictionary.
    """
    cleaned = _strip_markdown_fences(raw_text)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        return _default_structured_response(raw_text)

    if not isinstance(parsed, dict):
        return _default_structured_response(raw_text)

    structured = _default_structured_response("")
    structured["answer"] = str(parsed.get("answer") or structured["answer"])

    try:
        structured["confidence"] = max(0.0, min(1.0, float(parsed.get("confidence", structured["confidence"]))))
    except (TypeError, ValueError):
        structured["confidence"] = 0.5

    zones = parsed.get("zones_affected", [])
    structured["zones_affected"] = [str(zone) for zone in zones] if isinstance(zones, list) else []

    action_items = parsed.get("action_items", [])
    structured["action_items"] = [str(item) for item in action_items] if isinstance(action_items, list) else []

    structured["explanation"] = str(parsed.get("explanation") or "")
    severity = str(parsed.get("severity") or "info").lower()
    structured["severity"] = severity if severity in {"info", "warning", "critical"} else "info"
    return structured


def _fallback_answer(query: str) -> tuple[dict[str, Any], str]:
    """Generate a deterministic copilot answer when Gemini is unavailable.

    Args:
        query: User-provided natural-language planning question.

    Returns:
        A tuple containing the structured fallback answer and the highlighted zone.
    """
    query_lower = query.lower()
    ranked = rank_zones_for_new_stations()
    top_zone = ranked[0]
    riskiest_zone = max(load_zones(), key=lambda zone: zone["daily_demand_kw"] / max(zone["grid_capacity_kw"], 1))

    if "charger" in query_lower or "needs chargers" in query_lower:
        return (
            {
                "answer": f"{top_zone['zone']} needs new chargers most urgently because demand pressure is high while charger coverage is still relatively thin. The zone also retains enough grid headroom to support a near-term rollout.",
                "confidence": 0.84,
                "zones_affected": [top_zone["zone"]],
                "action_items": [
                    f"Prioritize site screening in {top_zone['zone']}",
                    "Validate feeder headroom before committing new stations",
                ],
                "explanation": "Planner signals favor zones where EV demand, charger gap, and usable grid headroom align.",
                "severity": "warning",
            },
            top_zone["zone"],
        )

    if "risk" in query_lower or "overload" in query_lower:
        return (
            {
                "answer": f"{riskiest_zone['zone']} is the most exposed zone right now because evening charging demand is climbing faster than safe operating margin. This zone should be watched closely during the peak window.",
                "confidence": 0.87,
                "zones_affected": [riskiest_zone["zone"]],
                "action_items": [
                    f"Increase monitoring for {riskiest_zone['zone']} during evening hours",
                    "Push flexible charging into off-peak slots where possible",
                ],
                "explanation": "The local rules flag the highest ratio of charging pressure to available grid capacity as the near-term overload risk.",
                "severity": "critical",
            },
            riskiest_zone["zone"],
        )

    if "peak load" in query_lower or "reduce" in query_lower:
        return (
            {
                "answer": "The fastest way to reduce evening peak load is to shift flexible charging after 10 PM and reinforce that behavior in the highest-growth corridors. Whitefield and Electronic City are the best initial targets for that intervention.",
                "confidence": 0.86,
                "zones_affected": ["Whitefield", "Electronic City"],
                "action_items": [
                    "Increase night-charging incentives after 10 PM",
                    "Run feeder-aware scheduling campaigns in Whitefield and Electronic City",
                ],
                "explanation": "Peak suppression improves most when charging is moved from the evening cluster into lower-stress off-peak windows.",
                "severity": "warning",
            },
            "Whitefield",
        )

    return (
        {
            "answer": "ChargeFlow AI recommends focusing first on high-growth zones where charger coverage is lagging but grid headroom remains workable. Keep smart scheduling active so new infrastructure and load management improve together.",
            "confidence": 0.79,
            "zones_affected": [top_zone["zone"]],
            "action_items": [
                f"Review rollout readiness for {top_zone['zone']}",
                "Maintain scheduling controls alongside infrastructure expansion",
            ],
            "explanation": "The fallback logic balances charger demand, grid headroom, and planning priority to produce operator-facing guidance.",
            "severity": "info",
        },
        top_zone["zone"],
    )


def _call_gemini(query: str, session_id: str | None = None) -> tuple[str, dict[str, Any], str]:
    """Generate a structured copilot answer using Gemini and recent chat context.

    Args:
        query: User-provided copilot question.
        session_id: Optional conversation session identifier.

    Returns:
        A tuple containing raw text, parsed structured output, and a highlighted zone.
    """
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    context = _build_system_context()
    recent_messages = get_recent_messages(session_id, limit=6) if session_id else []
    history = "\n".join(f"{item['role']}: {item['content']}" for item in recent_messages)

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = (
        f"{context}\n\n"
        f"Recent conversation:\n{history or 'No prior history'}\n\n"
        f"User question: {query}"
    )
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )
    raw_text = (response.text or "").strip()
    structured = _parse_structured_response(raw_text)

    ranked = rank_zones_for_new_stations()
    referenced_zone = next(
        (
            zone
            for zone in structured["zones_affected"]
            if any(item["zone"].lower() == zone.lower() for item in ranked)
        ),
        ranked[0]["zone"],
    )
    return raw_text, structured, referenced_zone


def answer_copilot(query: str, session_id: str | None = None) -> dict[str, Any]:
    """Generate, persist, and return a copilot response payload.

    Args:
        query: User-provided planning question.
        session_id: Optional active session identifier.

    Returns:
        A response dictionary containing structured answer, confidence, and metadata.
    """
    db_state = ensure_database_ready()
    active_session_id = session_id or create_session(query)

    provider = "rules"
    try:
        raw_response, structured, highlighted_zone = _call_gemini(query, active_session_id)
        provider = "gemini"
    except Exception:
        structured, highlighted_zone = _fallback_answer(query)
        raw_response = json.dumps(structured, ensure_ascii=True)

    append_message(active_session_id, "user", query)
    append_message(
        active_session_id,
        "assistant",
        raw_response,
        metadata={"provider": provider, "zone": highlighted_zone},
    )

    return {
        "query": query,
        "answer": structured["answer"],
        "response": raw_response,
        "structured": structured,
        "confidence": structured["confidence"],
        "explanation": [structured["explanation"]] if structured["explanation"] else [],
        "session_id": active_session_id,
        "provider": provider,
        "data_policy": DATA_POLICY,
        "database": db_state,
        "map_context": get_zone_map_context(highlighted_zone),
    }
