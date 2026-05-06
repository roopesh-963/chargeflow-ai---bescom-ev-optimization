"""Shared helper utilities for AI-like response behavior."""

from __future__ import annotations

import random
import time


def simulate_processing_delay() -> None:
    """Add a short delay to mimic AI processing latency."""
    time.sleep(0.5)


def bounded_random(center: float, spread: float, lower: float, upper: float) -> float:
    """Return a slightly randomized value constrained within bounds."""
    return max(lower, min(upper, round(random.uniform(center - spread, center + spread), 2)))
