"""Synthetic training-data generation for ChargeFlow AI demand forecasting."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from services.data_store import load_zones


TRAINING_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "training_data.csv"

# Typical Bengaluru monthly average temperatures in Celsius.
MONTHLY_AVG_TEMP_C = {
    1: 22.5,
    2: 24.1,
    3: 26.8,
    4: 28.9,
    5: 27.1,
    6: 24.5,
    7: 23.6,
    8: 23.8,
    9: 23.7,
    10: 23.2,
    11: 22.4,
    12: 21.7,
}


@dataclass(frozen=True)
class ZoneFeatures:
    """Static zone attributes used by the model."""

    zone: str
    zone_population: int
    zone_ev_users: int
    zone_chargers: int
    zone_grid_capacity: int


def get_average_temp_c(month: int) -> float:
    """Return the average Bengaluru temperature for a given month."""
    return MONTHLY_AVG_TEMP_C[month]


def _hour_multiplier(hour: int) -> float:
    """Create morning and evening peaks for EV charging behavior."""
    morning_peak = 1.0 if hour in {8, 9} else 0.0
    evening_peak = 1.35 if hour in {18, 19, 20, 21} else 0.0
    shoulder = 0.28 if hour in {7, 10, 17, 22} else 0.0
    overnight_penalty = -0.22 if hour in {0, 1, 2, 3, 4, 5} else 0.0
    office_tail = 0.12 if hour in {11, 12, 13, 14, 15, 16} else 0.0
    return 1.0 + morning_peak + evening_peak + shoulder + office_tail + overnight_penalty


def _weekend_multiplier(is_weekend: bool) -> float:
    """Weekend charging demand is typically lower for commuter-heavy patterns."""
    return 0.84 if is_weekend else 1.0


def _temperature_multiplier(temp_c: float) -> float:
    """Mild temperature sensitivity for cooling and travel patterns."""
    return 1.0 + ((temp_c - 23.5) * 0.015)


def _charger_pressure_multiplier(ev_users: int, chargers: int) -> float:
    """Capture latent demand from EV users competing for limited chargers."""
    pressure = ev_users / max(chargers, 1)
    return 0.92 + min(pressure / 260.0, 0.42)


def _population_multiplier(population: int) -> float:
    """Capture how denser residential/commercial catchments lift demand."""
    return 0.88 + min(population / 400000.0, 0.42)


def _grid_capacity_multiplier(grid_capacity: int) -> float:
    """Slightly damp demand where local capacity is more constrained."""
    return 0.9 + (grid_capacity / 200.0)


def _build_zone_features() -> list[ZoneFeatures]:
    """Load static feature rows from the configured zone dataset."""
    return [
      ZoneFeatures(
          zone=zone["zone"],
          zone_population=int(zone["population"]),
          zone_ev_users=int(zone["ev_users"]),
          zone_chargers=int(zone["chargers"]),
          zone_grid_capacity=int(zone["grid_capacity"]),
      )
      for zone in load_zones()
    ]


def generate_training_data(days: int = 180, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic hourly EV-demand training data and save it to CSV."""
    rng = np.random.default_rng(seed)
    end_date = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=days - 1)
    zone_features = _build_zone_features()

    rows: list[dict[str, object]] = []
    for day_offset in range(days):
        current_day = start_date + timedelta(days=day_offset)
        day_of_week = current_day.weekday()
        is_weekend = day_of_week >= 5
        base_temp = get_average_temp_c(current_day.month)
        temp_c = float(np.round(base_temp + rng.normal(0, 1.6), 2))

        for zone in zone_features:
            zone_scale = zone.zone_ev_users / 100.0
            population_factor = _population_multiplier(zone.zone_population)
            charger_factor = _charger_pressure_multiplier(zone.zone_ev_users, zone.zone_chargers)
            grid_factor = _grid_capacity_multiplier(zone.zone_grid_capacity)

            for hour in range(24):
                lambda_kw = (
                    zone_scale
                    * _hour_multiplier(hour)
                    * _weekend_multiplier(is_weekend)
                    * _temperature_multiplier(temp_c)
                    * population_factor
                    * charger_factor
                    * grid_factor
                )
                lambda_kw *= 1.0 + rng.normal(0, 0.045)
                lambda_kw = max(lambda_kw, 5.0)
                demand_kw = int(rng.poisson(lambda_kw))

                rows.append(
                    {
                        "timestamp": (current_day + timedelta(hours=hour)).isoformat(),
                        "zone": zone.zone,
                        "hour": hour,
                        "day_of_week": day_of_week,
                        "is_weekend": int(is_weekend),
                        "temp_c": temp_c,
                        "zone_population": zone.zone_population,
                        "zone_ev_users": zone.zone_ev_users,
                        "zone_chargers": zone.zone_chargers,
                        "zone_grid_capacity": zone.zone_grid_capacity,
                        "ev_demand_kw": demand_kw,
                    }
                )

    dataframe = pd.DataFrame(rows)
    TRAINING_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_csv(TRAINING_DATA_PATH, index=False)
    return dataframe


if __name__ == "__main__":
    frame = generate_training_data()
    print(f"Generated {len(frame)} training rows at {TRAINING_DATA_PATH}")
