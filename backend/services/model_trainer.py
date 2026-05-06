"""Training utilities for the ChargeFlow AI demand-forecast model."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from services.data_generator import TRAINING_DATA_PATH, generate_training_data
from services.data_store import load_zones


MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "forecast_model.pkl"
METRICS_PATH = Path(__file__).resolve().parent.parent / "models" / "model_metrics.json"
FEATURE_COLUMNS = [
    "hour",
    "hour_squared",
    "day_of_week",
    "is_monday",
    "is_weekend",
    "month",
    "temp_c",
    "zone_population",
    "zone_ev_users",
    "zone_chargers",
    "zone_grid_capacity",
    "ev_density",
]
TARGET_COLUMN = "ev_demand_kw"
FEATURE_EXPORT_NAMES = {
    "hour": "hour",
    "hour_squared": "hour_squared",
    "day_of_week": "day_of_week",
    "is_monday": "is_monday",
    "is_weekend": "is_weekend",
    "month": "month",
    "temp_c": "temp_c",
    "zone_population": "population",
    "zone_ev_users": "ev_users",
    "zone_chargers": "chargers",
    "zone_grid_capacity": "grid_capacity",
    "ev_density": "ev_density",
}


def _zone_area_lookup() -> dict[str, float]:
    return {str(zone["zone"]): float(zone.get("area_sqkm", 1.0) or 1.0) for zone in load_zones()}


def engineer_feature_frame(dataframe: pd.DataFrame) -> pd.DataFrame:
    """Enrich raw training rows with the governed forecast feature set."""
    frame = dataframe.copy()

    if "timestamp" not in frame.columns:
        raise ValueError("Training data must include a timestamp column")
    if "zone" not in frame.columns:
        raise ValueError("Training data must include a zone column")

    timestamps = pd.to_datetime(frame["timestamp"])
    frame["month"] = timestamps.dt.month.astype(int)
    frame["is_monday"] = (timestamps.dt.weekday == 0).astype(int)
    frame["hour_squared"] = frame["hour"].astype(float) ** 2

    area_lookup = _zone_area_lookup()
    frame["area_sqkm"] = frame["zone"].map(area_lookup).fillna(1.0)
    frame["ev_density"] = frame["zone_ev_users"].astype(float) / frame["area_sqkm"].clip(lower=0.1)

    return frame


def _load_training_frame() -> pd.DataFrame:
    """Load training data, generating it first if it does not exist yet."""
    if not TRAINING_DATA_PATH.exists():
        return engineer_feature_frame(generate_training_data())

    dataframe = pd.read_csv(TRAINING_DATA_PATH)
    required_columns = {
        "timestamp",
        "zone",
        "hour",
        "day_of_week",
        "is_weekend",
        "temp_c",
        "zone_population",
        "zone_ev_users",
        "zone_chargers",
        "zone_grid_capacity",
        TARGET_COLUMN,
    }
    if any(column not in dataframe.columns for column in required_columns):
        return engineer_feature_frame(generate_training_data())

    return engineer_feature_frame(dataframe)


def _round_metric(value: float) -> float:
    return round(float(value), 4)


def load_model_metrics() -> dict[str, Any]:
    """Load saved model metrics, training the model if needed."""
    if not METRICS_PATH.exists():
        train_forecast_model()

    with METRICS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def sorted_feature_importances(metrics: dict[str, Any] | None = None) -> list[dict[str, float | str]]:
    """Return saved feature importances as a descending list."""
    payload = metrics or load_model_metrics()
    feature_importances = payload.get("feature_importances", {})
    return [
        {"feature": str(feature), "importance": float(importance)}
        for feature, importance in sorted(
            feature_importances.items(),
            key=lambda item: float(item[1]),
            reverse=True,
        )
    ]


def train_forecast_model() -> dict[str, Any]:
    """Train the forecast model, save it, and persist judge-facing metrics."""
    dataframe = _load_training_frame()
    features = dataframe[FEATURE_COLUMNS]
    target = dataframe[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=0.2,
        random_state=42,
    )

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        random_state=42,
    )
    model.fit(X_train, y_train)

    train_predictions = model.predict(X_train)
    test_predictions = model.predict(X_test)

    feature_importance_pairs = sorted(
        zip(FEATURE_COLUMNS, model.feature_importances_, strict=True),
        key=lambda item: float(item[1]),
        reverse=True,
    )[:5]
    top_feature_importances = {
        FEATURE_EXPORT_NAMES[feature]: _round_metric(importance)
        for feature, importance in feature_importance_pairs
    }

    metrics: dict[str, Any] = {
        "model_type": "GradientBoostingRegressor",
        "train_rmse": _round_metric(mean_squared_error(y_train, train_predictions) ** 0.5),
        "test_rmse": _round_metric(mean_squared_error(y_test, test_predictions) ** 0.5),
        "train_r2": _round_metric(r2_score(y_train, train_predictions)),
        "test_r2": _round_metric(r2_score(y_test, test_predictions)),
        "mae": _round_metric(mean_absolute_error(y_test, test_predictions)),
        "feature_importances": top_feature_importances,
        "training_samples": int(len(dataframe)),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "feature_columns": FEATURE_COLUMNS,
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    with METRICS_PATH.open("w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=2)

    print(f"Train RMSE: {metrics['train_rmse']:.4f}")
    print(f"Test RMSE: {metrics['test_rmse']:.4f}")
    print(f"Train R2: {metrics['train_r2']:.4f}")
    print(f"Test R2: {metrics['test_r2']:.4f}")
    print(f"Test MAE: {metrics['mae']:.4f}")

    return {
        "model_path": str(MODEL_PATH),
        "metrics_path": str(METRICS_PATH),
        "rows": int(len(dataframe)),
        **metrics,
    }


if __name__ == "__main__":
    train_forecast_model()
