# === CHARGEFLOW AI — FULL PROJECT REPORT ===

## SECTION 1: PROJECT STRUCTURE
- Total frontend files count: `54` files under `src/`
- Total backend files count: `89` files under `backend/` including runtime logs and `__pycache__`; `39` Python source files excluding `__pycache__`
- Total public files count: `2`
- Frontend pages:
  - `/` -> `LandingPage`
  - `/login` -> `LoginPage`
  - `/dashboard` -> redirect to `/dashboard/overview`
  - `/dashboard/:pageId` -> dashboard shell with these page IDs:
    - `overview`
    - `forecast`
    - `adoption`
    - `scheduling`
    - `planner`
    - `gridstress`
    - `simulator`
    - `alerts`
    - `aiinsights`
    - `reports`
    - `settings`
    - `copilot`
- Frontend component inventory:
  - Core shell: `Dashboard`, `dashboard/Header`, `dashboard/Sidebar`, `dashboard/DashboardContent`, `dashboard/dashboardData`
  - Landing: `landing/LandingNavbar`, `landing/HeroContent`, `landing/StatsSection`, `landing/FeaturesSection`, `landing/VideoBackground`
  - Domain widgets: `adoption/AdoptionForecaster`, `anomaly/AnomalyDetector`, `gridstress/GridStressPlayer`, `planner/ZoneRankingTable`, `predictions/NextHourPrediction`, `evaluation/BaselineChart`, `live/LiveFeed`, `live/LiveIndicator`, `copilot/StructuredResponse`
  - Shared: `ExportButton`, `EmptyState`, `ErrorState`, `SkeletonCard`, `JudgeScorecard`
  - UI primitives: `avatar`, `badge`, `button`, `card`, `input`, `scroll-area`, `slider`
  - Legacy / marketing components present in repo: `Architecture`, `Features`, `Footer`, `Hero`, `MapPreview`, `Navbar`, `StatsStrip`, `WhyBescom`
- Backend major folders:
  - `routes/` -> API route modules
  - `services/` -> forecasting, planner, scheduling, copilot, anomaly, live, DB helpers
  - `auth/` -> JWT auth + seeded user models
  - `utils/` -> TTL cache and zone normalization helpers
  - `data/` -> `zones.json`, `training_data.csv`
  - `models/` -> `forecast_model.pkl`

### API endpoints list
- `GET /` -> root health response from `backend/main.py`
- `GET /api/health` -> lightweight service health from `backend/main.py`
- `WS /ws/live` -> live snapshot stream, broadcasts every 10 seconds
- `POST /api/auth/login` -> issue JWT for seeded user
- `GET /api/auth/me` -> return authenticated user profile
- `GET /api/forecast` -> hourly EV demand forecast for one zone or all zones
- `GET /api/adoption` -> 12-month EV adoption projection by zone/scenario
- `GET /api/adoption/summary` -> month-12 outcomes across zones/scenarios
- `GET /api/anomalies` -> last 24 hours anomaly-annotated demand for one zone
- `GET /api/predictions` -> next-hour prediction window with confidence bounds
- `GET /api/gridstress` -> 24-hour zone stress playback snapshots
- `GET /api/schedule` -> charging schedule recommendations + baseline/optimized curves
- `POST /api/schedule/apply` -> mark optimization as applied in-memory and return refreshed schedule
- `GET /api/planner` -> ranked infrastructure recommendations
- `POST /api/simulator` -> what-if simulation for growth/stations/incentives
- `GET /api/alerts` -> overload/healthy alert list by zone
- `POST /api/copilot` -> Gemini-backed or fallback planning assistant response
- `GET /api/copilot/sessions` -> recent persisted copilot sessions from MongoDB
- `GET /api/summary` -> dashboard KPIs for all zones or selected zone
- `GET /api/zones` -> selectable zone names

## SECTION 2: FEATURES IMPLEMENTED

✅ Landing experience
- What it does: video-backed landing page with sticky cinematic background, stats, and feature storytelling
- Files involved: `src/pages/LandingPage.tsx`, `src/components/landing/*`
- API endpoint: none
- ML model used: none

✅ Login screen and role concept
- What it does: presents demo credentials and enters dashboard
- Files involved: `src/pages/LoginPage.tsx`, `src/context/AuthContext.tsx`, `backend/routes/auth.py`, `backend/auth/*`
- API endpoint: backend has `POST /api/auth/login`, `GET /api/auth/me`
- ML model used: none

✅ Dashboard shell with page routing
- What it does: role-aware sidebar, sticky header, page switching, notifications, zone/date context, floating copilot
- Files involved: `src/components/Dashboard.tsx`, `src/components/dashboard/*`, `src/context/ZoneContext.tsx`, `src/context/DashboardUIContext.tsx`
- API endpoint: indirect, via all dashboard APIs
- ML model used: none

✅ Demand forecasting
- What it does: 24-hour zone-level EV charging demand forecasts, peak/low hour identification, explanations, confidence
- Files involved: `src/components/dashboard/DashboardContent.tsx`, `backend/routes/forecast.py`, `backend/services/forecast_engine.py`, `backend/services/model_trainer.py`, `backend/services/data_generator.py`
- API endpoint: `GET /api/forecast`
- ML model used: `GradientBoostingRegressor` persisted in `backend/models/forecast_model.pkl`

✅ Summary KPI layer
- What it does: top-level KPIs for total demand, peak reduction, suggested stations, high-risk zones, selected-zone stats
- Files involved: `src/components/dashboard/DashboardContent.tsx`, `backend/routes/summary.py`
- API endpoint: `GET /api/summary`
- ML model used: uses forecast + planner + schedule outputs, not a standalone model

✅ Smart scheduling
- What it does: recommends off-peak charging slots, reports peak reduction and off-peak shift, offers an apply action
- Files involved: `src/components/dashboard/DashboardContent.tsx`, `backend/routes/schedule.py`, `backend/services/optimizer.py`
- API endpoint: `GET /api/schedule`, `POST /api/schedule/apply`
- ML model used: no ML; heuristic scheduling logic

✅ Infrastructure planner
- What it does: ranks zones for new charging stations, gives reasons, map context, ROI estimate, and SHAP explanation text
- Files involved: `src/components/dashboard/DashboardContent.tsx`, `src/components/planner/ZoneRankingTable.tsx`, `backend/routes/planner.py`, `backend/services/planner_engine.py`, `backend/services/shap_service.py`
- API endpoint: `GET /api/planner`
- ML model used: `RandomForestRegressor` inside `shap_service.py` for explainability support

✅ Grid stress playback
- What it does: Leaflet-based control room playback of hourly stress buildup, stations, ward overlays, speed control, live mode toggle
- Files involved: `src/components/gridstress/GridStressPlayer.tsx`, `backend/routes/gridstress.py`, `backend/services/live_service.py`, `backend/services/forecast_engine.py`
- API endpoint: `GET /api/gridstress`, `WS /ws/live`
- ML model used: forecast model drives stress snapshots; live view is synthetic generator based

✅ Grid alerts
- What it does: severity-tagged overload alerts and timeline based on demand-to-capacity ratio
- Files involved: `src/components/dashboard/DashboardContent.tsx`, `backend/routes/alerts.py`
- API endpoint: `GET /api/alerts`
- ML model used: no standalone model; rule-based thresholds

✅ Adoption forecasting
- What it does: 12-month conservative/moderate/aggressive EV adoption scenarios with charger need, demand, and stress
- Files involved: `src/components/adoption/AdoptionForecaster.tsx`, `backend/routes/adoption.py`, `backend/services/adoption_service.py`
- API endpoint: `GET /api/adoption`, `GET /api/adoption/summary`
- ML model used: no ML; formula-based scenario growth

✅ AI insights
- What it does: anomaly detection and next-hour predictions with charting and confidence bands
- Files involved: `src/components/anomaly/AnomalyDetector.tsx`, `src/components/predictions/NextHourPrediction.tsx`, `backend/routes/anomalies.py`, `backend/services/anomaly_service.py`, `backend/services/prediction_service.py`
- API endpoint: `GET /api/anomalies`, `GET /api/predictions`
- ML model used: `IsolationForest` for anomalies, `GradientBoostingRegressor` for short-horizon predictions

✅ Scenario simulator
- What it does: lets users change EV growth, charger rollout, and night incentive sliders to see projected risk/impact
- Files involved: `src/components/dashboard/DashboardContent.tsx`, `backend/routes/simulator.py`
- API endpoint: `POST /api/simulator`
- ML model used: no ML; formula-based simulation

✅ AI copilot
- What it does: structured planning assistant with Gemini primary path, deterministic fallback, Mongo session persistence, map links
- Files involved: `src/components/dashboard/DashboardContent.tsx`, `src/components/copilot/StructuredResponse.tsx`, `backend/routes/copilot.py`, `backend/services/copilot_engine.py`, `backend/services/database.py`, `backend/services/map_context.py`
- API endpoint: `POST /api/copilot`, `GET /api/copilot/sessions`
- ML model used: Gemini hosted model (`gemini-2.5-flash` by default) with local fallback rules

✅ Live WebSocket widgets
- What it does: live indicator and feed powered by backend snapshots
- Files involved: `src/components/live/LiveIndicator.tsx`, `src/components/live/LiveFeed.tsx`, `src/hooks/useWebSocket.ts`, `backend/main.py`, `backend/services/live_service.py`
- API endpoint: `WS /ws/live`
- ML model used: none

✅ Export/reporting
- What it does: exports dashboard/planner pages as PDF and reports page as PNG snapshot
- Files involved: `src/components/shared/ExportButton.tsx`, `src/components/dashboard/DashboardContent.tsx`
- API endpoint: none
- ML model used: none

✅ Governance/settings layer
- What it does: stores explainability, masked-data, threshold, and optimization mode preferences in local storage
- Files involved: `src/context/DashboardUIContext.tsx`, `src/components/dashboard/DashboardContent.tsx`
- API endpoint: none
- ML model used: none

## SECTION 3: AI & ML CAPABILITIES
- Models trained / used:
  - `GradientBoostingRegressor` for demand forecasting and next-hour prediction
  - `IsolationForest` for anomaly detection
  - `RandomForestRegressor` used to generate SHAP-backed planner explanations
  - Gemini (`gemini-2.5-flash` by config) for copilot responses
- Training data description:
  - `backend/services/data_generator.py` builds synthetic hourly EV-demand data using:
    - hour of day
    - day of week
    - weekend flag
    - Bengaluru monthly temperature profile
    - zone population
    - EV users
    - chargers
    - grid capacity
  - Current `backend/data/training_data.csv` contains `30,240` rows and only `7` zones:
    - `Electronic City, Hebbal, Indiranagar, Koramangala, Sarjapur, Whitefield, Yelahanka`
- SHAP explainability: `yes`
  - Forecast explanations in `backend/services/forecast_engine.py`
  - Planner explanations in `backend/services/shap_service.py` and `backend/services/planner_engine.py`
- Prediction endpoints:
  - `GET /api/forecast`
  - `GET /api/predictions`
  - `GET /api/adoption`
- Anomaly detection: `yes`
  - `GET /api/anomalies`
  - powered by `IsolationForest`
- Important accuracy note:
  - UI text and some labels say `XGBoost`, but backend code actually uses `GradientBoostingRegressor`; `xgboost` is installed but not used in current source

## SECTION 4: DATA LAYER
- Zone count in `backend/data/zones.json`: `24`
- Zone attributes present:
  - `name`
  - `lat`, `lon`
  - `ward`
  - `population`
  - `area_sqkm`
  - `ev_users`
  - `chargers`
  - `grid_capacity_kw`
  - `daily_demand_kw`
  - `avg_income`
  - `major_poi`
  - `existing_stations[]` with `name`, `lat`, `lon`, `chargers`
- Synthetic data approach:
  - demand forecasting data is synthetic
  - anomaly history is synthetic
  - live WebSocket data is synthetic
  - simulator is synthetic/formula-based
  - scheduling and alerts are heuristic/rule-driven from masked/synthetic zone metrics
- Real Bengaluru data used:
  - real Bengaluru zone names
  - ward names
  - approximate coordinates
  - recognizable POIs and stations
  - Bengaluru temperature seasonality profile
- Data normalization:
  - `backend/services/data_store.py` normalizes `name/zone`, `lon/lng`, and station coordinates for backend consumers

## SECTION 5: FRONTEND FEATURES
- Pages and what each page shows:
  - `LandingPage`: hero video, stats, features
  - `LoginPage`: demo sign-in
  - `overview`: KPIs, charts, live feed, alert/planner snapshots
  - `forecast`: 24-hour zone forecast, ranking
  - `adoption`: 12-month EV adoption scenarios
  - `scheduling`: schedule recommendations and before/after load curves
  - `planner`: map + zone ranking + reasons
  - `gridstress`: live/playback stress map and POI/station intelligence
  - `simulator`: what-if sliders with live outputs
  - `alerts`: overload alerts and timeline
  - `aiinsights`: anomaly detector + next-hour predictions
  - `reports`: baseline comparison and export snapshot
  - `settings`: governance controls
  - `copilot`: full conversational assistant
- Interactive features:
  - Leaflet maps in planner and grid stress
  - Recharts line/area/bar charts across forecast, adoption, scheduling, AI insights
  - sliders in simulator
  - searchable header with page/zone/station/POI search
  - notifications tray
  - profile editor
  - floating mini copilot on all dashboard pages
  - zone/date switching
  - export buttons
- WebSocket: `yes`
  - frontend hook `useWebSocket`
  - consumes `/ws/live`
- Auth: `yes, but split implementation`
  - backend has JWT auth with roles `admin`, `operator`, `planner`
  - frontend `AuthContext` is currently demo-stubbed and always treats the user as authenticated `admin`
- Mobile responsive: `yes`
  - responsive header/sidebar/cards are implemented
- PDF export: `yes`
  - overview + planner export to PDF
- Snapshot export: `yes`
  - reports page export to PNG
- Demo mode: `partial`
  - `src/components/demo/DemoMode.tsx` exists
  - appears not to be mounted in the current dashboard shell

## SECTION 6: BACKEND FEATURES
- API routes:
  - Auth: login, me
  - Forecast
  - Adoption
  - Anomalies
  - Predictions
  - Grid stress
  - Scheduling
  - Planner
  - Simulator
  - Alerts
  - Copilot
  - Summary
  - Zones
  - Root health
  - Live WebSocket
- Middleware:
  - `CORSMiddleware`
  - `GZipMiddleware(minimum_size=1000)`
- Caching: `yes`
  - `backend/utils/cache.py`
  - used by forecast, anomalies, gridstress, planner
  - warmup seeds forecast cache at startup
- WebSocket: `yes`
  - `/ws/live`
  - connection manager broadcasts every 10 seconds
- Startup warming: `yes`
  - DB readiness check
  - forecast model load
  - forecast cache prefill for all zones and each zone
  - anomaly snapshot pre-touch
- Optional integrations:
  - MongoDB for copilot persistence
  - Gemini API for copilot answers
  - Google Maps API flag support

## SECTION 7: NON-NEGOTIABLES COMPLIANCE
- ✅ No modification to existing distribution systems
  - app produces recommendations, simulations, and in-memory “apply” flags only
- ✅ Works as decision-support layer only
  - dashboard copy, settings, and architecture all position it as advisory
- ✅ Uses synthetic/masked data
  - forecasting/anomaly/live/training layers are synthetic; zone data is planning metadata
- ✅ Outputs are explainable
  - SHAP text explanations for forecast/planner; structured copilot reasoning
- ✅ Grid constraints considered
  - capacity, stress %, alert thresholds, schedule safety threshold, planner headroom all appear in code
- ✅ No hosted LLM on sensitive data
  - current copilot sends synthetic/masked planning context to Gemini; no evidence of real sensitive utility telemetry being sent

## SECTION 8: GAPS & MISSING FEATURES
- Frontend auth is not actually wired to backend JWT login:
  - `AuthContext` hardcodes a demo admin user and `demo-access` token
  - backend auth exists but is not truly consumed in the frontend flow
- Role restrictions are partially theoretical:
  - dashboard nav visibility supports roles, but frontend always boots as admin
- Forecasting stack mismatch:
  - UI repeatedly claims `XGBoost`
  - backend uses `GradientBoostingRegressor`
  - `xgboost` dependency is installed but unused
- Data mismatch across the project:
  - `zones.json` now has `24` zones
  - `training_data.csv` only covers `7` zones
  - `copilot_engine` system prompt still names `7` zones
  - `map_context.py` only contains coordinates for `7` zones
- Scheduling is not a true LP optimizer:
  - despite UI copy saying LP-optimized, backend uses heuristic/randomized logic in `optimizer.py`
- Simulator is formula-based, not model-based
- Health route inconsistency:
  - `backend/routes/healthcheck.py` defines a router but is not included in `main.py`
  - `main.py` separately defines `/api/health`
- Demo mode component exists but appears unused
- Judge scorecard component exists but appears unused
- Export feature is implemented client-side only and depends on DOM capture quality
- Backend folder contains runtime logs and `__pycache__` artifacts in-repo
- Several marketing/legacy components in `src/components/` appear unused by current landing flow
- Copilot persists to Mongo only if configured; otherwise silently falls back to ephemeral sessions

## SECTION 9: BESCOM JUDGE SCORECARD
- Clarity of problem understanding: `9/10`
- Demand prediction strength: `7/10`
- Scheduling logic quality: `6/10`
- Location planning quality: `8/10`
- Grid constraint integration: `8/10`
- Explainability of outputs: `8/10`
- Practicality and actionability: `8/10`
- Architecture quality: `8/10`
- Risk handling: `7/10`
- TOTAL: `69/90`

## SECTION 10: RECOMMENDATION
### Top 3 things to improve before demo day
1. Align the implementation story:
   - either switch to real XGBoost or update all UI/demo claims to match `GradientBoostingRegressor`
2. Reconcile the zone model/data mismatch:
   - regenerate training data for all `24` zones
   - expand copilot prompt context and `map_context.py` to all zones
3. Replace demo-stub auth with real backend JWT login and role-scoped behavior

### Top 3 strongest selling points to highlight
1. End-to-end operator workflow:
   - forecast -> schedule -> planner -> stress -> alerts -> report -> copilot
2. Explainability:
   - SHAP-backed reasoning and structured copilot outputs make recommendations defendable
3. BESCOM-safe posture:
   - decision-support only, synthetic/masked data, visible grid-constraint logic

### Suggested demo flow
1. Open landing page and explain the problem statement in one minute
2. Go to `Overview` for KPIs and live feed
3. Show `Demand Forecast` to explain time-and-zone prediction
4. Show `Smart Scheduling` to explain peak shifting and reduction
5. Show `Infrastructure Planner` for SHAP-based charger placement
6. Show `Grid Stress Player` for control-room realism
7. Show `Grid Alerts` and `AI Insights` for risk/anomaly handling
8. Show `Reports` for baseline comparison
9. End with `AI Copilot` for operator Q&A

## APPENDIX A: SRC FILE INVENTORY
```text
src\App.tsx
src\components\Architecture.tsx
src\components\Dashboard.tsx
src\components\Features.tsx
src\components\Footer.tsx
src\components\Hero.tsx
src\components\MapPreview.tsx
src\components\Navbar.tsx
src\components\StatsStrip.tsx
src\components\WhyBescom.tsx
src\components\adoption\AdoptionForecaster.tsx
src\components\anomaly\AnomalyDetector.tsx
src\components\copilot\StructuredResponse.tsx
src\components\dashboard\DashboardContent.tsx
src\components\dashboard\dashboardData.ts
src\components\dashboard\Header.tsx
src\components\dashboard\Sidebar.tsx
src\components\demo\DemoMode.tsx
src\components\evaluation\BaselineChart.tsx
src\components\gridstress\GridStressPlayer.tsx
src\components\landing\FeaturesSection.tsx
src\components\landing\HeroContent.tsx
src\components\landing\LandingNavbar.tsx
src\components\landing\StatsSection.tsx
src\components\landing\VideoBackground.tsx
src\components\live\LiveFeed.tsx
src\components\live\LiveIndicator.tsx
src\components\planner\ZoneRankingTable.tsx
src\components\predictions\NextHourPrediction.tsx
src\components\shared\EmptyState.tsx
src\components\shared\ErrorState.tsx
src\components\shared\ExportButton.tsx
src\components\shared\JudgeScorecard.tsx
src\components\shared\SkeletonCard.tsx
src\components\ui\avatar.tsx
src\components\ui\badge.tsx
src\components\ui\button.tsx
src\components\ui\card.tsx
src\components\ui\input.tsx
src\components\ui\scroll-area.tsx
src\components\ui\slider.tsx
src\context\AuthContext.tsx
src\context\DashboardUIContext.tsx
src\context\ZoneContext.tsx
src\data\bengaluruZones.ts
src\hooks\useDebounce.ts
src\hooks\useWebSocket.ts
src\index.css
src\lib\api.ts
src\lib\utils.ts
src\main.tsx
src\pages\LandingPage.tsx
src\pages\LoginPage.tsx
src\vite-env.d.ts
```

## APPENDIX B: BACKEND FILE INVENTORY
```text
backend\README.md
backend\auth\auth_service.py
backend\auth\dependencies.py
backend\auth\models.py
backend\data\training_data.csv
backend\data\zones.json
backend\live-backend.err.log
backend\live-backend.out.log
backend\main.py
backend\models\forecast_model.pkl
backend\requirements.txt
backend\routes\__init__.py
backend\routes\adoption.py
backend\routes\alerts.py
backend\routes\anomalies.py
backend\routes\auth.py
backend\routes\copilot.py
backend\routes\forecast.py
backend\routes\gridstress.py
backend\routes\healthcheck.py
backend\routes\planner.py
backend\routes\schedule.py
backend\routes\simulator.py
backend\routes\summary.py
backend\routes\zones.py
backend\services\__init__.py
backend\services\adoption_service.py
backend\services\anomaly_service.py
backend\services\common.py
backend\services\config.py
backend\services\copilot_engine.py
backend\services\data_generator.py
backend\services\data_store.py
backend\services\database.py
backend\services\forecast_engine.py
backend\services\live_service.py
backend\services\map_context.py
backend\services\model_trainer.py
backend\services\optimizer.py
backend\services\planner_engine.py
backend\services\prediction_service.py
backend\services\shap_service.py
backend\train.py
backend\utils\__init__.py
backend\utils\cache.py
backend\utils\zone_utils.py
backend\uvicorn-auth.err.log
backend\uvicorn-auth.out.log
backend\verify-auth.err.log
backend\verify-auth.out.log
...plus `__pycache__` artifacts under `backend/auth`, `backend/routes`, `backend/services`, `backend/utils`, and `backend/`
```

## APPENDIX C: PUBLIC FILE INVENTORY
```text
public\videos\bescom-poster.jpg
public\videos\bescom.mp4
```
