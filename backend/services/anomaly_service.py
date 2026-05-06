"""IsolationForest-powered anomaly detection for EV charging demand."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from services.data_generator import get_average_temp_c
from services.data_store import load_zones


_zone_model_cache: dict[str, IsolationForest] = {}

_OFF_PEAK_HOURS = {0, 1, 2, 3, 4, 5, 23}


def _hour_multiplier(hour: int) -> float:
    if hour in {18, 19, 20, 21}:
        return 1.45
    if hour in {8, 9, 10}:
        return 1.15
    if hour in _OFF_PEAK_HOURS:
        return 0.58
    return 0.92


def _format_hour_label(hour: int) -> str:
    label_hour = hour % 12 or 12
    suffix = "AM" if hour < 12 else "PM"
    return f"{label_hour} {suffix}"


def _build_zone_history(zone_name: str, days: int = 30) -> list[dict[str, Any]]:
    zone = next((item for item in load_zones() if item["zone"] == zone_name), None)
    if zone is None:
        raise ValueError(f"Zone '{zone_name}' not found")

    seed = abs(hash(zone_name)) % (2**32)
    rng = np.random.default_rng(seed)
    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(hours=(days * 24) - 1)
    base_demand = max(float(zone["daily_demand_kw"]) / 24.0, 20.0)
    zone_pressure = zone["ev_users"] / max(zone["chargers"], 1)
    rows: list[dict[str, Any]] = []

    for offset in range(days * 24):
        timestamp = start_time + timedelta(hours=offset)
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        temp_c = round(get_average_temp_c(timestamp.month) + rng.normal(0, 1.4), 2)
        demand_kw = base_demand * _hour_multiplier(hour) * (1.0 + zone_pressure / 550.0)
        demand_kw *= 0.9 if day_of_week >= 5 else 1.0
        demand_kw *= 1.0 + ((temp_c - 23.5) * 0.012)
        demand_kw *= 1.0 + rng.normal(0, 0.08)
        demand_kw = max(demand_kw, 6.0)

        if rng.random() < 0.045:
            demand_kw *= rng.choice([0.52, 0.6, 1.38, 1.55])

        ev_sessions = max(int(round(demand_kw / 7.5 + rng.normal(0, 2.0))), 1)

        rows.append(
            {
                "zone": zone_name,
                "timestamp": timestamp.isoformat(),
                "hour_index": hour,
                "hour": _format_hour_label(hour),
                "day_of_week": day_of_week,
                "demand_kw": round(float(demand_kw), 2),
                "temp_c": temp_c,
                "ev_sessions": ev_sessions,
            }
        )

    return rows


def _history_frame(zone_data: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "hour": int(item["hour_index"]),
                "day_of_week": int(item["day_of_week"]),
                "demand_kw": float(item["demand_kw"]),
                "temp_c": float(item["temp_c"]),
                "ev_sessions": float(item["ev_sessions"]),
            }
            for item in zone_data
        ]
    )


def _get_zone_model(zone_name: str, zone_data: list[dict[str, Any]]) -> IsolationForest:
    if zone_name in _zone_model_cache:
        return _zone_model_cache[zone_name]

    frame = _history_frame(zone_data)
    model = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=200,
    )
    model.fit(frame)
    _zone_model_cache[zone_name] = model
    return model


def detect_anomalies(zone_data: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Flag anomalous hourly demand points for a zone history."""
    if not zone_data:
        return []

    zone_name = str(zone_data[0].get("zone", "default"))
    frame = _history_frame(zone_data)
    model = _get_zone_model(zone_name, zone_data)
    predictions = model.predict(frame)
    scores = model.score_samples(frame)
    zone_average = float(frame["demand_kw"].mean())

    results: list[dict[str, Any]] = []
    for item, prediction, score in zip(zone_data, predictions, scores, strict=False):
        demand_kw = float(item["demand_kw"])
        hour_index = int(item["hour_index"])
        is_anomaly = bool(prediction == -1)
        severity = "low"
        reason = "Demand within expected range"

        if demand_kw >= zone_average * 1.3:
            reason = "Unusual demand spike"
            severity = "high" if demand_kw >= zone_average * 1.5 else "medium"
            is_anomaly = True
        elif demand_kw <= zone_average * 0.7:
            reason = "Unexpected demand drop"
            severity = "high" if demand_kw <= zone_average * 0.55 else "medium"
            is_anomaly = True
        elif hour_index in _OFF_PEAK_HOURS and demand_kw >= zone_average * 1.1:
            reason = "Abnormal off-peak activity"
            severity = "high" if demand_kw >= zone_average * 1.35 else "medium"
            is_anomaly = True
        elif is_anomaly:
            reason = "Irregular demand behavior"
            severity = "low"

        results.append(
            {
                "hour": item["hour"],
                "demand_kw": round(demand_kw, 2),
                "is_anomaly": is_anomaly,
                "anomaly_score": round(abs(float(score)), 4),
                "reason": reason,
                "severity": severity if is_anomaly else "low",
                "timestamp": item["timestamp"],
            }
        )

    return results


def get_zone_anomaly_snapshot(zone_name: str) -> dict[str, Any]:
    """Return last 24 hours of anomaly-annotated zone demand."""
    history = _build_zone_history(zone_name, days=30)
    detected = detect_anomalies(history)
    last_24 = detected[-24:]
    total_anomalies = sum(1 for item in last_24 if item["is_anomaly"])
    high_count = sum(1 for item in last_24 if item["severity"] == "high")

    if high_count >= 2 or total_anomalies >= 5:
        risk_level = "high"
    elif total_anomalies >= 2:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "zone": zone_name,
        "anomalies": last_24,
        "total_anomalies": total_anomalies,
        "risk_level": risk_level,
    }
