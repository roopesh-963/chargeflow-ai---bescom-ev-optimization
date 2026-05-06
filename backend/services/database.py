"""MongoDB helpers for ChargeFlow AI copilot persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from services.config import get_settings


_mongo_client: MongoClient | None = None
_database_ready = False


def get_client() -> MongoClient | None:
    """Create or reuse the MongoDB client when a URI is configured."""
    global _mongo_client
    settings = get_settings()

    if not settings.mongo_uri:
      return None

    if _mongo_client is None:
        _mongo_client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=4000)

    return _mongo_client


def get_database():
    """Return the configured MongoDB database, if available."""
    client = get_client()
    if client is None:
        return None
    return client[get_settings().mongo_database]


def ensure_database_ready() -> dict[str, Any]:
    """
    Ping MongoDB and create the project database/collections on first access.

    MongoDB creates the database lazily when we first insert documents.
    """
    global _database_ready
    database = get_database()

    if database is None:
        return {"available": False, "reason": "MONGO_URI not configured"}

    if _database_ready:
        return {"available": True, "database": database.name}

    try:
        database.command("ping")
        database["copilot_sessions"].create_index("session_id", unique=True)
        database["copilot_messages"].create_index("session_id")
        database["copilot_messages"].create_index("created_at")
        database["metadata"].update_one(
            {"_id": "project"},
            {
                "$set": {
                    "project": "ChargeFlow AI",
                    "initialized_at": datetime.now(timezone.utc),
                    "database": database.name,
                }
            },
            upsert=True,
        )
        _database_ready = True
        return {"available": True, "database": database.name}
    except PyMongoError as exc:
        return {"available": False, "reason": str(exc)}


def create_session(query: str) -> str:
    """Create a new copilot session and return its ID."""
    database = get_database()
    if database is None:
        return uuid4().hex

    session_id = uuid4().hex
    database["copilot_sessions"].insert_one(
        {
            "session_id": session_id,
            "title": query[:80],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
    )
    return session_id


def append_message(session_id: str, role: str, content: str, metadata: dict[str, Any] | None = None) -> None:
    """Persist one copilot chat message if MongoDB is available."""
    database = get_database()
    if database is None:
        return

    payload = {
        "session_id": session_id,
        "role": role,
        "content": content,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc),
    }
    database["copilot_messages"].insert_one(payload)
    database["copilot_sessions"].update_one(
        {"session_id": session_id},
        {"$set": {"updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


def get_recent_messages(session_id: str, limit: int = 8) -> list[dict[str, Any]]:
    """Return recent session messages in chronological order."""
    database = get_database()
    if database is None:
        return []

    cursor = (
        database["copilot_messages"]
        .find({"session_id": session_id}, {"_id": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    return list(reversed(list(cursor)))


def list_sessions(limit: int = 20) -> list[dict[str, Any]]:
    """Return recent copilot sessions for optional UI use."""
    database = get_database()
    if database is None:
        return []

    cursor = (
        database["copilot_sessions"]
        .find({}, {"_id": 0})
        .sort("updated_at", -1)
        .limit(limit)
    )
    return list(cursor)
