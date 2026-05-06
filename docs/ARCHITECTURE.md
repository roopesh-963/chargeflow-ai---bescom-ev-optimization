# ChargeFlow AI Architecture

## Data Flow Diagram
```text
                      +----------------------+
                      |   Synthetic Data     |
                      | (training_data.csv)  |
                      +----------+-----------+
                                 |
                                 v
                      +----------------------+
                      |    Model Trainer     |
                      |   train.py / ML svc  |
                      +----------+-----------+
                                 |
                                 v
                      +----------------------+
                      |     XGBoost-style    |
                      |  boosted model file  |
                      | forecast_model.pkl   |
                      +----------+-----------+
                                 |
                                 v
+------------------+    +----------------------+    +-----------------------+    +----------------------+
|    zones.json    | -> |       Services       | -> |    FastAPI Routes     | -> |   React Frontend     |
| zone + ward data |    | forecast / planner   |    | /api/* REST endpoints |    | dashboard + charts   |
| demographic data |    | alerts / schedule    |    | summary / copilot     |    | maps + guided demo   |
+------------------+    +----------------------+    +-----------------------+    +----------------------+

                      +----------------------+
                      |     Gemini API       |
                      +----------+-----------+
                                 |
                                 v
                      +----------------------+
                      |   Copilot Service    |
                      | answer_copilot()     |
                      +----------+-----------+
                                 |
                                 v
                      +----------------------+
                      |   Structured JSON    |
                      | answer/confidence    |
                      | actions/severity     |
                      +----------+-----------+
                                 |
                                 v
                      +----------------------+
                      |       Chat UI        |
                      | StructuredResponse   |
                      +----------------------+
```

## Frontend Component Tree
```text
App
|- LandingPage
|  |- Navbar
|  |- Hero
|  |- StatsStrip
|  |- Features
|  |- MapPreview
|  |- WhyBescom
|  |- Architecture
|  `- Footer
`- Dashboard
   |- Sidebar
   |- Header
   |- ScrollArea
   |  `- DashboardContent
   |     |- OverviewPage
   |     |- ForecastPage
   |     |- AdoptionForecaster
   |     |- SchedulingPage
   |     |- PlannerPage
   |     |- GridStressPlayer
   |     |- SimulatorPage
   |     |- AlertsPage
   |     |- ReportsPage
   |     |- SettingsPage
   |     `- CopilotPage
   |- JudgeScorecard
   `- DemoMode
```

## Backend Services
### `data_store.py`
Loads and normalizes `zones.json` so downstream services can consume a consistent zone schema regardless of how the raw file is shaped.

### `data_generator.py`
Builds synthetic hourly training data from zone attributes, seasonal temperature assumptions, charger pressure, and grid capacity factors.

### `model_trainer.py`
Trains the persisted demand forecast model artifact and validates that the saved feature set matches the current pipeline.

### `forecast_engine.py`
Generates 24-hour zone-level EV demand forecasts, computes confidence, and produces SHAP-backed or fallback textual explanations.

### `planner_engine.py`
Ranks Bengaluru zones for charger expansion using EV demand, charger gap, and grid headroom to produce infrastructure recommendations.

### `shap_service.py`
Creates planner-focused explainability outputs so infrastructure ranking decisions can be defended to judges and operators.

### `optimizer.py`
Produces schedule-shift recommendations that help move flexible charging load into safer off-peak windows.

### `adoption_service.py`
Projects 12-month EV growth, charger requirements, demand, and stress levels under multiple scenarios.

### `copilot_engine.py`
Builds the local planning context, calls Gemini when configured, falls back to deterministic reasoning when needed, and returns structured copilot output.

### `map_context.py`
Maps named zones to coordinates and external map links for use in copilot responses and UI navigation.

### `database.py`
Handles optional MongoDB-backed session storage for the copilot, including session listing and message history.

### Route Modules
`summary.py`, `forecast.py`, `schedule.py`, `planner.py`, `gridstress.py`, `adoption.py`, `alerts.py`, `simulator.py`, `copilot.py`, and `healthcheck.py` expose the backend capabilities as focused REST endpoints.

## Security & Constraints
ChargeFlow AI is intentionally scoped as a planning and demonstration layer, not a control system. It does not write back into BESCOM operational infrastructure, does not reconfigure feeders, and does not automate charger dispatch. This satisfies the decision-support-only requirement.

The model pipeline operates on synthetic and masked zone data rather than unrestricted live utility telemetry. Sensitive raw data is therefore not required for demonstrations, judging, or architecture review. The persisted forecast model is stored locally in the backend model directory, and the optional Gemini integration is limited to copilot-style natural language assistance rather than core control logic.

## Notes
- Judge-facing language in the UI refers to an XGBoost-style forecasting workflow.
- The current backend implementation persists a gradient-boosted model artifact via scikit-learn.
- This keeps the architecture explainable, lightweight, and easy to run locally for review.
