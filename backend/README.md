# ChargeFlow AI Backend

Hackathon-ready FastAPI backend for EV charging optimization and infrastructure planning for BESCOM.

## Run locally

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a root-level `.env` file from `.env.example` if you want optional integrations:

- `GEMINI_API_KEY` for Gemini-backed copilot answers
- `MONGO_URI` for session persistence
- `google_map_api` for Google Maps capability flags

4. Start the server from the `backend/` directory:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API routes

- `GET /api/forecast`
- `GET /api/schedule`
- `GET /api/planner`
- `POST /api/simulator`
- `GET /api/alerts`
- `POST /api/copilot`
- `GET /api/copilot/sessions`
- `GET /api/summary`
