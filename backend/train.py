"""Convenience entrypoint for regenerating training data and retraining the forecast model."""

from __future__ import annotations

from services.data_generator import generate_training_data
from services.model_trainer import train_forecast_model


def main() -> None:
    """Generate synthetic training data and train the persisted model artifact."""
    frame = generate_training_data()
    print(f"Training rows generated: {len(frame)}")
    metrics = train_forecast_model()
    print(f"Model saved to: {metrics['model_path']}")


if __name__ == "__main__":
    main()
