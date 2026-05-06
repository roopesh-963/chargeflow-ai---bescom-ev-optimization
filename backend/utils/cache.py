"""Simple TTL cache helpers for API response reuse."""

from __future__ import annotations

import time
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: int = 60) -> None:
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, tuple[float, int, Any]] = {}

    def get(self, key: str) -> Any | None:
        record = self._store.get(key)
        if record is None:
            return None
        timestamp, ttl_seconds, value = record
        if time.time() - timestamp > ttl_seconds:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        self._store[key] = (time.time(), ttl_seconds or self.ttl_seconds, value)

    def invalidate(self, key: str) -> None:
        self._store.pop(key, None)


api_cache = TTLCache(ttl_seconds=60)
