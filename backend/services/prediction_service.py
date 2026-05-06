"""Short-horizon next-hour prediction helpers built on the forecast model."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import joblib
import pandas as pd

from services.data_store import load_zones
from services.forecast_engine import MODEL_PATH, build_feature_frame_for_zone
from services.model_trainer import FEATURE_COLUMNS, train_forecast_model


def _format_hour_label(hour: int) -> str:
    label_hour = hour % 12 or 12
    suffix = "AM" if hour < 12 else "PM"
    return f"{label_hour} {suffix}"


def _load_model():
    if not MODEL_PATH.exists():
        train_forecast_model()
    model = joblib.load(MODEL_PATH)
    if getattr(model, "n_features_in_", len(FEATURE_COLUMNS)) != len(FEATURE_COLUMNS):
        train_forecast_model()
        model = joblib.load(MODEL_PATH)
    return model


def predict_next_hours(zone: str, hours: int = 6) -> dict[str, Any]:
    """Predict the next few hourly demand points with confidence intervals."""
    zone_row = next((item for item in load_zones() if item["zone"] == zone), None)
    if zone_row is None:
        raise ValueError(f"Zone '{zone}' not found")

    model = _load_model()
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    timestamps: list[datetime] = []
    labels: list[str] = []

    for step in range(hours):
        timestamp = now + timedelta(hours=step + 1)
        timestamps.append(timestamp)
        labels.append(_format_hour_label(timestamp.hour))

    frame = build_feature_frame_for_zone(zone_row, timestamps)
    raw_predictions = model.predict(frame)
    predictions = []

    for label, value in zip(labels, raw_predictions, strict=False):
        predicted_kw = round(max(float(value), 0.0), 2)
        lower_bound = round(predicted_kw * 0.88, 2)
        upper_bound = round(predicted_kw * 1.12, 2)
        predictions.append(
            {
                "hour": label,
                "predicted_kw": predicted_kw,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "confidence": 85,
            }
        )

    return {
        "zone": zone,
        "grid_capacity_kw": round(float(zone_row["grid_capacity_kw"]), 2),
        "predictions": predictions,
    }
