"""Model-backed EV demand forecasting for synthetic Bengaluru zones."""

from __future__ import annotations

from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any

import joblib
import numpy as np
import pandas as pd

from services.data_generator import get_average_temp_c
from services.model_trainer import FEATURE_COLUMNS, METRICS_PATH, load_model_metrics, train_forecast_model
from utils.zone_utils import normalize_zone
from services.data_store import load_zones

try:
    import shap
except Exception:  # pragma: no cover - graceful fallback when dependency is unavailable
    shap = None


MODEL_PATH = METRICS_PATH.parent / "forecast_model.pkl"
FEATURE_LABELS = {
    "hour": "peak hour",
    "hour_squared": "non-linear peak shape",
    "day_of_week": "weekday pattern",
    "is_monday": "Monday commute demand",
    "is_weekend": "weekend behavior",
    "month": "seasonal month effect",
    "temp_c": "warmer temperatures",
    "zone_population": "dense catchment population",
    "zone_ev_users": "high EV density",
    "zone_chargers": "charger availability",
    "zone_grid_capacity": "grid headroom",
    "ev_density": "EV concentration per sq km",
}


def _fallback_top_factors(zone: dict[str, Any], peak_hour: int) -> list[str]:
    driver = "peak hour (+0.0 kW)"
    secondary = "high EV density (+0.0 kW)" if zone["ev_users"] >= 3000 else "charger availability (+0.0 kW)"

    if peak_hour not in {18, 19, 20, 21}:
        driver = "Monday commute demand (+0.0 kW)"

    return [driver, secondary]


def _fallback_zone_explanation(zone: dict[str, Any], peak_hour: int) -> str:
    top_factors = _fallback_top_factors(zone, peak_hour)
    return f"High demand driven by {top_factors[0]} and {top_factors[1]}"


def build_feature_frame_for_zone(zone: dict[str, Any], timestamps: list[datetime]) -> pd.DataFrame:
    """Construct the model feature frame for one zone across the requested timestamps."""
    area_sqkm = max(float(zone.get("area_sqkm", 1.0) or 1.0), 0.1)
    rows: list[dict[str, float | int]] = []

    for timestamp in timestamps:
        rows.append(
            {
                "hour": timestamp.hour,
                "hour_squared": timestamp.hour ** 2,
                "day_of_week": timestamp.weekday(),
                "is_monday": int(timestamp.weekday() == 0),
                "is_weekend": int(timestamp.weekday() >= 5),
                "month": timestamp.month,
                "temp_c": get_average_temp_c(timestamp.month),
                "zone_population": int(zone["population"]),
                "zone_ev_users": int(zone["ev_users"]),
                "zone_chargers": int(zone["chargers"]),
                "zone_grid_capacity": int(zone["grid_capacity"]),
                "ev_density": round(float(zone["ev_users"]) / area_sqkm, 4),
            }
        )

    return pd.DataFrame(rows, columns=FEATURE_COLUMNS)


def _build_feature_frame(zone: dict[str, Any], horizon_hours: int = 24) -> tuple[pd.DataFrame, list[datetime]]:
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    timestamps = [now + timedelta(hours=step) for step in range(horizon_hours)]
    return build_feature_frame_for_zone(zone, timestamps), timestamps


def _model_needs_refresh() -> bool:
    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        return True
    try:
        metrics = load_model_metrics()
    except Exception:
        return True
    saved_columns = metrics.get("feature_columns")
    return saved_columns != FEATURE_COLUMNS


@lru_cache(maxsize=1)
def _load_forecast_model():
    """Load the persisted demand model and retrain if the artifact is stale."""
    if _model_needs_refresh():
        train_forecast_model()
    try:
        model = joblib.load(MODEL_PATH)
    except Exception:
        train_forecast_model()
        model = joblib.load(MODEL_PATH)
    if getattr(model, "n_features_in_", len(FEATURE_COLUMNS)) != len(FEATURE_COLUMNS):
        train_forecast_model()
        model = joblib.load(MODEL_PATH)
    return model


@lru_cache(maxsize=1)
def _load_forecast_explainer():
    """Create and cache a SHAP explainer for the forecast model."""
    if shap is None:
        return None
    model = _load_forecast_model()
    return shap.TreeExplainer(model)


def _feature_display_name(feature_name: str) -> str:
    return FEATURE_LABELS.get(feature_name, feature_name)


def _frame_top_factors(feature_frame: pd.DataFrame, zone: dict[str, Any]) -> tuple[list[list[str]], str]:
    """Build per-row top-factor summaries from SHAP or fallback rules."""
    explainer = _load_forecast_explainer()
    if explainer is None:
        fallback = [
            _fallback_top_factors(zone, int(row["hour"]))
            for row in feature_frame.to_dict(orient="records")
        ]
        return fallback, "fallback"

    try:
        shap_values = explainer.shap_values(feature_frame)
        if isinstance(shap_values, list):
            values = np.array(shap_values[0], dtype=float)
        else:
            values = np.array(shap_values, dtype=float)

        if values.ndim == 1:
            values = values.reshape(1, -1)

        top_factors: list[list[str]] = []
        for row_values, row in zip(values, feature_frame.to_dict(orient="records"), strict=False):
            top_indices = np.argsort(np.abs(row_values))[::-1][:3]
            fragments = [
                f"{_feature_display_name(FEATURE_COLUMNS[index])} ({float(row_values[index]):+.1f} kW)"
                for index in top_indices
            ]
            while len(fragments) < 3:
                fragments.append("baseline demand (+0.0 kW)")
            top_factors.append(fragments)
        return top_factors, "shap"
    except Exception:
        fallback = [
            _fallback_top_factors(zone, int(row["hour"]))
            for row in feature_frame.to_dict(orient="records")
        ]
        return fallback, "fallback"


def _explanation_from_factors(prediction: float, top_factors: list[str], zone: dict[str, Any], peak_hour: int) -> str:
    if not top_factors:
        return _fallback_zone_explanation(zone, peak_hour)
    lead_in = "High demand driven by" if prediction >= 0 else "Demand shaped by"
    return f"{lead_in} {top_factors[0]} and {top_factors[1]}"


def _confidence_from_predictions(predictions: list[float]) -> float:
    """Estimate forecast confidence from relative volatility in predictions."""
    if not predictions:
        return 0.0

    mean_value = sum(predictions) / len(predictions)
    if mean_value <= 0:
        return 0.0

    variance = sum((value - mean_value) ** 2 for value in predictions) / len(predictions)
    std_dev = variance ** 0.5
    stability_confidence = max(0.0, min(1.0, 1 - ((std_dev / mean_value) * 0.6)))

    try:
        test_r2 = float(load_model_metrics().get("test_r2", 0.85))
    except Exception:
        test_r2 = 0.85

    confidence = (stability_confidence * 0.55) + (max(0.0, min(1.0, test_r2)) * 0.45)
    return round(max(0.72, min(0.98, confidence)), 2)


def _average_demand(predictions: list[float]) -> float:
    if not predictions:
        return 0.0
    return round(sum(predictions) / len(predictions), 2)


def _hourly_forecast_for_zone(zone: dict[str, Any]) -> dict[str, Any]:
    """Generate the full hourly forecast payload for one zone."""
    model = _load_forecast_model()
    feature_frame, timestamps = _build_feature_frame(zone)
    raw_predictions = model.predict(feature_frame)
    predictions = [round(max(float(value), 0.0), 2) for value in raw_predictions]

    peak_index, peak_value = max(enumerate(predictions), key=lambda item: item[1])
    min_index, min_value = min(enumerate(predictions), key=lambda item: item[1])
    confidence = _confidence_from_predictions(predictions)
    avg_demand_kw = _average_demand(predictions)
    per_row_top_factors, explanation_source = _frame_top_factors(feature_frame, zone)
    explanation = _explanation_from_factors(
        predictions[peak_index],
        per_row_top_factors[peak_index] if per_row_top_factors else [],
        zone,
        int(feature_frame.iloc[peak_index]["hour"]),
    )

    hourly_forecast: list[dict[str, Any]] = []
    for timestamp, row, predicted_value, top_factors in zip(
        timestamps,
        feature_frame.to_dict(orient="records"),
        predictions,
        per_row_top_factors,
        strict=False,
    ):
        lower_bound = round(predicted_value * 0.88, 2)
        upper_bound = round(predicted_value * 1.12, 2)
        hourly_forecast.append(
            {
                "time": timestamp.strftime("%H:00"),
                "hour": int(row["hour"]),
                "predicted_demand": predicted_value,
                "predicted_demand_kw": predicted_value,
                "predicted_kw": predicted_value,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "confidence": confidence,
                "top_factors": top_factors,
                "peak_flag": int(row["hour"]) == int(feature_frame.iloc[peak_index]["hour"]),
            }
        )

    return {
        "zone": zone["zone"],
        "hourly_forecast": hourly_forecast,
        "peak_hour": f"{int(feature_frame.iloc[peak_index]['hour']):02d}:00",
        "low_hour": f"{int(feature_frame.iloc[min_index]['hour']):02d}:00",
        "confidence": confidence,
        "explanation": explanation,
        "explanation_source": explanation_source,
        "average_demand_kw": avg_demand_kw,
        "peak_demand_kw": round(peak_value, 2),
        "low_demand_kw": round(min_value, 2),
        "next_hour_demand_kw": predictions[0] if predictions else 0.0,
    }


def generate_forecast(zone_name: str | None = None) -> list[dict[str, Any]] | dict[str, Any]:
    """Generate demand forecasts for all zones or a single requested zone."""
    zones = load_zones()

    if zone_name:
        normalized_zone_name = normalize_zone(zone_name)
        for zone in zones:
            if zone["zone"].lower() == normalized_zone_name.lower():
                return _hourly_forecast_for_zone(zone)
        raise ValueError(f"Zone '{zone_name}' not found")

    return [_hourly_forecast_for_zone(zone) for zone in zones]
