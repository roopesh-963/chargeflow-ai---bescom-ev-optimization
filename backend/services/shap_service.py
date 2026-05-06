"""SHAP-backed helpers for planner explainability."""

from __future__ import annotations

from functools import lru_cache

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

try:
    import shap
except Exception:  # pragma: no cover - graceful fallback when dependency is unavailable
    shap = None


PLANNER_FEATURE_COLUMNS = ["ev_users", "chargers", "grid_capacity", "demand_growth"]


def _build_synthetic_planner_frame(samples: int = 200) -> pd.DataFrame:
    """Create a synthetic planner training set for SHAP-backed scoring explanations."""
    rng = np.random.default_rng(42)
    rows: list[dict[str, float]] = []

    for _ in range(samples):
        ev_users = int(rng.integers(1500, 4501))
        chargers = int(rng.integers(5, 25))
        grid_capacity = int(rng.integers(4000, 10001))
        demand_growth = float(rng.uniform(8, 36))

        charger_gap = ev_users / max(chargers, 1)
        suitability_score = (
            charger_gap * 1.8
            + demand_growth * 2.4
            + grid_capacity / 180
            + ev_users / 150
            - chargers * 2.0
        )

        rows.append(
            {
                "ev_users": ev_users,
                "chargers": chargers,
                "grid_capacity": grid_capacity,
                "demand_growth": round(demand_growth, 2),
                "suitability_score": round(suitability_score, 2),
            }
        )

    return pd.DataFrame(rows)


@lru_cache(maxsize=1)
def _load_planner_shap_artifacts() -> tuple[RandomForestRegressor, object] | tuple[None, None]:
    """Train and cache the planner explainer on first access."""
    if shap is None:
        return None, None

    frame = _build_synthetic_planner_frame()
    model = RandomForestRegressor(n_estimators=160, random_state=42)
    model.fit(frame[PLANNER_FEATURE_COLUMNS], frame["suitability_score"])
    explainer = shap.TreeExplainer(model)
    return model, explainer


def _format_planner_feature(feature_name: str, shap_value: float) -> str:
    """Map planner features to friendly explanation fragments."""
    magnitude = f"{abs(shap_value):.0f}"
    positive = shap_value >= 0

    if feature_name == "ev_users":
        return f"{'high EV density' if positive else 'lighter EV density'} ({'+' if positive else '-'}{magnitude} pts)"
    if feature_name == "chargers":
        return f"{'high charger gap' if positive else 'strong charger availability'} ({'+' if positive else '-'}{magnitude} pts)"
    if feature_name == "grid_capacity":
        return f"{'healthy grid headroom' if positive else 'tighter grid headroom'} ({'+' if positive else '-'}{magnitude} pts)"
    if feature_name == "demand_growth":
        return f"{'strong demand growth' if positive else 'slower demand growth'} ({'+' if positive else '-'}{magnitude} pts)"

    return f"{feature_name} ({'+' if positive else '-'}{magnitude} pts)"


def get_planner_shap(zone_features: dict) -> str:
    """Return a SHAP-based explanation for why a zone was prioritized."""
    _, explainer = _load_planner_shap_artifacts()
    if explainer is None:
        raise RuntimeError("SHAP planner explainer unavailable")

    row = pd.DataFrame(
        [
            {
                "ev_users": float(zone_features["ev_users"]),
                "chargers": float(zone_features["chargers"]),
                "grid_capacity": float(zone_features["grid_capacity"]),
                "demand_growth": float(zone_features["demand_growth"]),
            }
        ],
        columns=PLANNER_FEATURE_COLUMNS,
    )

    shap_values = explainer.shap_values(row)
    if isinstance(shap_values, list):
        values = np.array(shap_values[0], dtype=float)
    else:
        values = np.array(shap_values, dtype=float)

    if values.ndim == 2:
        values = values[0]

    top_indices = np.argsort(np.abs(values))[::-1][:2]
    top_fragments = [_format_planner_feature(PLANNER_FEATURE_COLUMNS[index], float(values[index])) for index in top_indices]

    if len(top_fragments) < 2:
        top_fragments.append("balanced infrastructure fit (+0 pts)")

    return f"Prioritized due to {top_fragments[0]} and {top_fragments[1]}"
