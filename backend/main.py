"""Main FastAPI entrypoint for ChargeFlow AI backend."""

from __future__ import annotations

import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from routes.adoption import router as adoption_router
from routes.anomalies import router as ai_insights_router
from routes.alerts import router as alerts_router
from routes.auth import router as auth_router
from routes.copilot import router as copilot_router
from routes.forecast import router as forecast_router
from routes.gridstress import router as gridstress_router
from routes.healthcheck import build_health_payload
from routes.healthcheck import router as health_router
from routes.modelinfo import router as modelinfo_router
from routes.planner import router as planner_router
from routes.schedule import router as schedule_router
from routes.simulator import router as simulator_router
from routes.summary import router as summary_router
from routes.zones import router as zones_router
from services.anomaly_service import get_zone_anomaly_snapshot
from services.data_store import load_zones
from services.database import ensure_database_ready
from services.forecast_engine import _load_forecast_model, generate_forecast
from services.live_service import generate_live_snapshot
from utils.cache import api_cache


app = FastAPI(
    title="ChargeFlow AI Backend",
    description="AI decision support backend for EV charging optimization and infrastructure planning for BESCOM.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.active_connections:
            self.active_connections.remove(ws)

    async def broadcast(self, message: dict) -> None:
        stale_connections: list[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(connection)


manager = ConnectionManager()
live_broadcast_task: asyncio.Task[None] | None = None
warmup_task: asyncio.Task[None] | None = None


async def _broadcast_live_updates() -> None:
    while True:
        if manager.active_connections:
            payload = await generate_live_snapshot()
            await manager.broadcast(payload)
        await asyncio.sleep(10)


def _run_warmup_models_and_cache() -> None:
    """Warm up cache and integrations with blocking work off the event loop."""
    try:
        ensure_database_ready()
        _load_forecast_model()
        all_forecasts = generate_forecast()
        api_cache.set(
            "/api/forecast:all",
            {
                "success": True,
                "data": all_forecasts,
                "zones": all_forecasts,
                "summary": {"requested_zone": "All Zones"},
            },
            ttl_seconds=60,
        )
        for zone in load_zones():
            zone_name = zone["zone"]
            zone_forecast = generate_forecast(zone_name)
            api_cache.set(
                f"/api/forecast:{zone_name}",
                {
                    "success": True,
                    "data": [zone_forecast],
                    "zones": [zone_forecast],
                    "summary": {"requested_zone": zone_name},
                },
                ttl_seconds=60,
            )
            get_zone_anomaly_snapshot(zone_name)
        print("ChargeFlow AI ready - warmup complete")
    except Exception as exc:
        # Keep the API available even if optional warmup tasks fail.
        print(f"ChargeFlow AI warmup skipped: {exc}")


async def _warmup_models_and_cache() -> None:
    await asyncio.to_thread(_run_warmup_models_and_cache)


app.include_router(auth_router)
app.include_router(health_router)
app.include_router(forecast_router)
app.include_router(adoption_router)
app.include_router(ai_insights_router)
app.include_router(gridstress_router)
app.include_router(modelinfo_router)
app.include_router(schedule_router)
app.include_router(planner_router)
app.include_router(simulator_router)
app.include_router(alerts_router)
app.include_router(copilot_router)
app.include_router(summary_router)
app.include_router(zones_router)


@app.on_event("startup")
async def startup_event() -> None:
    """Bring the API up immediately, then warm optional services in the background."""
    global live_broadcast_task
    global warmup_task
    live_broadcast_task = asyncio.create_task(_broadcast_live_updates())
    warmup_task = asyncio.create_task(_warmup_models_and_cache())
    print("ChargeFlow AI startup complete")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Stop background tasks cleanly."""
    global live_broadcast_task
    global warmup_task
    if live_broadcast_task is not None:
        live_broadcast_task.cancel()
        try:
            await live_broadcast_task
        except asyncio.CancelledError:
            pass
        live_broadcast_task = None
    if warmup_task is not None:
        warmup_task.cancel()
        try:
            await warmup_task
        except asyncio.CancelledError:
            pass
        warmup_task = None


@app.get("/")
def root() -> dict[str, str]:
    """Simple health check endpoint."""
    return {"status": "ok", "service": "ChargeFlow AI"}


@app.get("/api/health")
async def health() -> dict:
    return build_health_payload()


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        await websocket.send_json(await generate_live_snapshot())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
