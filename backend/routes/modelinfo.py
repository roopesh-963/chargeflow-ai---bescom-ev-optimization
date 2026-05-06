"""Model metrics and feature-importance API endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from services.model_trainer import load_model_metrics, sorted_feature_importances


router = APIRouter(prefix="/api/model", tags=["Model"])


@router.get("/info")
def get_model_info() -> dict:
    """Return persisted forecast model evaluation metrics."""
    return load_model_metrics()


@router.get("/features")
def get_model_features() -> dict:
    """Return the top saved feature importances in descending order."""
    metrics = load_model_metrics()
    return {
        "model_type": metrics.get("model_type", "GradientBoostingRegressor"),
        "data": sorted_feature_importances(metrics),
    }
