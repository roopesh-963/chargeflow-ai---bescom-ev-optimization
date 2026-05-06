"""Environment-backed configuration for ChargeFlow AI services."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parent.parent

# Prefer a real `.env` file, but fall back to `.env.example` in this workspace.
load_dotenv(ROOT_DIR.parent / ".env", override=False)
load_dotenv(ROOT_DIR.parent / ".env.example", override=False)


class Settings:
    """Centralized service settings loaded from environment variables."""

    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    mongo_uri: str = os.getenv("MONGO_URI", "").strip()
    google_map_api_key: str = os.getenv("google_map_api", "").strip()
    mongo_database: str = os.getenv("MONGO_DB_NAME", "chargeflow_ai")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings object."""
    return Settings()
