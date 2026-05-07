export interface SummaryResponse {
  total_demand: number;
  peak_reduction_percent: number;
  suggested_stations: number;
  high_risk_zones: string[];
  selected_zone?: string | null;
  peak_hour?: string | null;
  charger_count?: number;
  grid_stress_percent?: number;
  baseline_comparison?: {
    vs_unmanaged_peak_reduction_pct: number;
    vs_uniform_placement_coverage_gain_pct: number;
    zones_automated: number;
    method: string;
  };
}

export interface ForecastPoint {
  time: string;
  predicted_demand: number;
  predicted_demand_kw?: number;
  predicted_kw?: number;
  lower_bound?: number;
  upper_bound?: number;
  confidence?: number;
  top_factors?: string[];
}

export interface GridStressSnapshot {
  hour: number;
  zone_name: string;
  demand_kw: number;
  capacity_kw: number;
  stress_pct: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface AnomalyPoint {
  hour: string;
  demand_kw: number;
  is_anomaly: boolean;
  anomaly_score: number;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  timestamp?: string;
}

export interface AnomalyResponse {
  zone: string;
  anomalies: AnomalyPoint[];
  total_anomalies: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface NextHourPredictionPoint {
  hour: string;
  predicted_kw: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
}

export interface NextHourPredictionResponse {
  zone: string;
  grid_capacity_kw: number;
  predictions: NextHourPredictionPoint[];
}

export interface LiveZoneSnapshot {
  name: string;
  current_demand_kw: number;
  grid_stress_pct: number;
  active_sessions: number;
  status: 'normal' | 'warning' | 'critical';
  delta_from_last: number;
}

export interface LiveSnapshot {
  timestamp: string;
  zones: LiveZoneSnapshot[];
  system_status: 'normal' | 'warning' | 'critical';
  total_active_evs: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: 'admin' | 'operator' | 'planner';
  username: string;
}

export interface AuthUser {
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'planner';
  zone_access: string[];
}

export interface AdoptionProjection {
  month_index: number;
  month_label: string;
  zone: string;
  scenario: 'conservative' | 'moderate' | 'aggressive';
  current_chargers: number;
  grid_capacity: number;
  ev_count: number;
  required_chargers: number;
  demand_kw: number;
  grid_stress_pct: number;
}

export interface ForecastZone {
  zone: string;
  hourly_forecast: ForecastPoint[];
  peak_hour: string;
  low_hour?: string;
  confidence: number;
  explanation: string;
  explanation_source?: 'shap' | 'fallback';
  average_demand_kw?: number;
  peak_demand_kw?: number;
  low_demand_kw?: number;
  next_hour_demand_kw?: number;
}

export interface ModelInfoResponse {
  model_type: string;
  train_rmse: number;
  test_rmse: number;
  train_r2: number;
  test_r2: number;
  mae: number;
  feature_importances: Record<string, number>;
  training_samples: number;
  trained_at: string;
}

export interface ModelFeatureImportance {
  feature: string;
  importance: number;
}

export interface ScheduleRecommendation {
  zone: string;
  method?: string;
  current_peak_slot: string;
  recommended_slot: string;
  shift_percent: number;
  peak_reduction_percent: number;
  off_peak_shift_pct?: number;
  is_applied?: boolean;
  explanation: string;
  solver_status?: string;
  grid_safe_threshold?: number;
  recommended_slots?: Array<{
    hour: number;
    label: string;
    available_kw: number;
    recommended: boolean;
  }>;
}

export interface ScheduleResponse {
  zone_schedules: ScheduleRecommendation[];
  peak_reduction_pct: number;
  off_peak_shift_pct: number;
  scheduling_summary: string;
  unmanaged_load: number[];
  optimized_load: number[];
  grid_safe_threshold: number;
  optimizer?: string;
  method?: string;
  solver_status?: string;
  explanation?: string;
  selected_zone?: string | null;
}

export interface ApplyScheduleResponse extends ScheduleResponse {
  applied_zones: string[];
}

export interface PlannerRecommendation {
  zone: string;
  score: number;
  recommended_new_stations: number;
  roi_estimate_percent: number;
  grid_capacity_score: number;
  demand_growth_score: number;
  reasons: string[];
  explanation?: string;
  explanation_source?: 'shap' | 'fallback';
}

export interface AlertItem {
  zone: string;
  severity: 'critical' | 'warning' | 'healthy';
  message: string;
  explanation: string[];
}

export interface SimulatorResult {
  peak_load_impact_percent: number;
  grid_risk: number;
  confidence: number;
  recommendation: string;
}

export interface StructuredCopilotResponse {
  answer: string;
  confidence: number;
  zones_affected: string[];
  action_items: string[];
  explanation: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface CopilotResult {
  query: string;
  answer: string;
  response: string;
  structured: StructuredCopilotResponse | null;
  confidence: number;
  explanation: string[];
  session_id: string;
  provider: string;
  data_policy: string;
  database: {
    available: boolean;
    database?: string;
    reason?: string;
  };
  map_context: {
    available: boolean;
    zone?: string;
    lat?: number;
    lng?: number;
    maps_link?: string;
    maps_enabled?: boolean;
  };
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
const CACHE_TTL = 30000;
const cache = new Map<string, { data: any; timestamp: number }>();

export function clearApiCache() {
  cache.clear();
}

async function apiRequest(path: string, init?: RequestInit, options?: { skipAuthRedirect?: boolean }): Promise<any> {
  const token = localStorage.getItem('chargeflow_token');
  const method = (init?.method ?? 'GET').toUpperCase();
  const cacheKey = `${method}:${path}:${token ?? 'anon'}`;
  const isCacheable = method === 'GET';

  if (isCacheable) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Make sure the FastAPI backend is running.');
    }
    throw error;
  }

  if (response.status === 401) {
    if (!options?.skipAuthRedirect) {
      localStorage.removeItem('chargeflow_token');
      window.dispatchEvent(new Event('chargeflow:unauthorized'));
    }
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const errorDetail =
      typeof errorPayload?.detail === 'string'
        ? errorPayload.detail
        : typeof errorPayload?.message === 'string'
          ? errorPayload.message
          : null;

    if (response.status === 404 && path === '/api/schedule/apply') {
      throw new Error(
        'Smart Scheduling apply is unavailable because the backend needs a restart. Restart FastAPI and try again.',
      );
    }

    if (errorDetail) {
      throw new Error(`API request failed for ${path}: ${response.status}. ${errorDetail}`);
    }

    throw new Error(`API request failed for ${path}: ${response.status}`);
  }

  const payload = await response.json();
  if (isCacheable) {
    cache.set(cacheKey, { data: payload, timestamp: Date.now() });
  }
  return payload;
}

export function safeArray(data: any, key: string): any[] {
  return Array.isArray(data?.[key]) ? data[key] : [];
}

function safeObject<T>(data: any, key: string, fallback: T): T {
  return data?.[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) ? data[key] : fallback;
}

function withZoneQuery(path: string, zone?: string) {
  if (!zone || zone === 'All Zones') {
    return path;
  }

  const params = new URLSearchParams({ zone });
  return `${path}?${params.toString()}`;
}

function normalizeZoneParam(zone?: string) {
  return zone === 'All Zones' ? undefined : zone;
}

export async function getSummary(zone?: string) {
  const payload = await apiRequest(withZoneQuery('/api/summary', normalizeZoneParam(zone)));
  return safeObject<SummaryResponse>(payload, 'data', {
    total_demand: 0,
    peak_reduction_percent: 0,
    suggested_stations: 0,
    high_risk_zones: [],
    selected_zone: null,
    peak_hour: null,
    charger_count: 0,
    grid_stress_percent: 0,
    baseline_comparison: {
      vs_unmanaged_peak_reduction_pct: 34,
      vs_uniform_placement_coverage_gain_pct: 28,
      zones_automated: 7,
      method: 'LP optimizer vs unmanaged heuristic',
    },
  });
}

export async function getForecast(zone?: string) {
  const payload = await apiRequest(withZoneQuery('/api/forecast', normalizeZoneParam(zone)));
  return safeArray(payload, 'data') as ForecastZone[];
}

export async function getModelInfo() {
  const payload = await apiRequest('/api/model/info');
  const fallback: ModelInfoResponse = {
    model_type: 'GradientBoostingRegressor',
    train_rmse: 0,
    test_rmse: 0,
    train_r2: 0,
    test_r2: 0,
    mae: 0,
    feature_importances: {},
    training_samples: 0,
    trained_at: '',
  };
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as ModelInfoResponse)
    : fallback;
}

export async function getModelFeatures() {
  const payload = await apiRequest('/api/model/features');
  return safeArray(payload, 'data') as ModelFeatureImportance[];
}

export async function getGridStress(zone?: string) {
  const payload = await apiRequest(withZoneQuery('/api/gridstress', normalizeZoneParam(zone)));
  return safeArray(payload, 'data') as GridStressSnapshot[];
}

export async function getAnomalies(zone: string) {
  const params = new URLSearchParams({ zone });
  const payload = await apiRequest(`/api/anomalies?${params.toString()}`);
  return {
    zone: typeof payload?.zone === 'string' ? payload.zone : zone,
    anomalies: Array.isArray(payload?.anomalies) ? (payload.anomalies as AnomalyPoint[]) : [],
    total_anomalies: typeof payload?.total_anomalies === 'number' ? payload.total_anomalies : 0,
    risk_level: (payload?.risk_level ?? 'low') as AnomalyResponse['risk_level'],
  } satisfies AnomalyResponse;
}

export async function getNextHourPredictions(zone: string, hours = 6) {
  const params = new URLSearchParams({ zone, hours: String(hours) });
  const payload = await apiRequest(`/api/predictions?${params.toString()}`);
  return {
    zone: typeof payload?.zone === 'string' ? payload.zone : zone,
    grid_capacity_kw: typeof payload?.grid_capacity_kw === 'number' ? payload.grid_capacity_kw : 0,
    predictions: Array.isArray(payload?.predictions)
      ? (payload.predictions as NextHourPredictionPoint[])
      : [],
  } satisfies NextHourPredictionResponse;
}

export async function getAdoptionForecast(zone: string, scenario: 'conservative' | 'moderate' | 'aggressive') {
  const params = new URLSearchParams({ zone, scenario });
  const payload = await apiRequest(`/api/adoption?${params.toString()}`);
  return safeArray(payload, 'data') as AdoptionProjection[];
}

export async function getAdoptionSummary() {
  const payload = await apiRequest('/api/adoption/summary');
  return safeArray(payload, 'data') as AdoptionProjection[];
}

export async function getSchedule(zone?: string) {
  const payload = await apiRequest(withZoneQuery('/api/schedule', normalizeZoneParam(zone)));
  return safeObject<ScheduleResponse>(payload, 'data', {
    zone_schedules: [],
    peak_reduction_pct: 0,
    off_peak_shift_pct: 0,
    scheduling_summary: '',
    unmanaged_load: [],
    optimized_load: [],
    grid_safe_threshold: 0,
    optimizer: '',
    method: '',
    solver_status: '',
    explanation: '',
    selected_zone: null,
  });
}

export async function applyScheduleOptimization(zone?: string) {
  const payload = await apiRequest('/api/schedule/apply', {
    method: 'POST',
    body: JSON.stringify({ zone: normalizeZoneParam(zone) }),
  });

  const data = safeObject<ScheduleResponse>(payload, 'data', {
    zone_schedules: [],
    peak_reduction_pct: 0,
    off_peak_shift_pct: 0,
    scheduling_summary: '',
    unmanaged_load: [],
    optimized_load: [],
    grid_safe_threshold: 0,
    optimizer: '',
    method: '',
    solver_status: '',
    explanation: '',
    selected_zone: null,
  });

  return {
    ...data,
    applied_zones: Array.isArray(payload?.applied_zones) ? (payload.applied_zones as string[]) : [],
  } satisfies ApplyScheduleResponse;
}

export async function getPlanner(zone?: string) {
  const payload = await apiRequest(withZoneQuery('/api/planner', normalizeZoneParam(zone)));
  return safeArray(payload, 'data') as PlannerRecommendation[];
}

export async function getAlerts(zone?: string) {
  const payload = await apiRequest(withZoneQuery('/api/alerts', normalizeZoneParam(zone)));
  return safeArray(payload, 'data') as AlertItem[];
}

export async function getZones() {
  const payload = await apiRequest('/api/zones');
  return safeArray(payload, 'data') as string[];
}

export async function runSimulation(input: {
  ev_growth: number;
  new_stations: number;
  night_incentive: number;
}) {
  const payload = await apiRequest('/api/simulator', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return safeObject<SimulatorResult>(payload, 'data', {
    peak_load_impact_percent: 0,
    grid_risk: 0,
    confidence: 0,
    recommendation: 'Simulation data unavailable.',
  });
}

export async function askCopilot(query: string, session_id?: string) {
  const payload = await apiRequest('/api/copilot', {
    method: 'POST',
    body: JSON.stringify({ query, session_id }),
  });
  return safeObject<CopilotResult>(payload, 'data', {
    query,
    answer: 'Copilot response unavailable.',
    response: 'Copilot response unavailable.',
    structured: null,
    confidence: 0,
    explanation: [],
    session_id: '',
    provider: 'unknown',
    data_policy: 'synthetic/anonymised only',
    database: { available: false, reason: 'No response payload received' },
    map_context: { available: false },
  });
}

export function getWebSocketUrl() {
  if (!WS_URL) return null;
  return `${WS_URL.replace(/\/$/, '')}/ws/live`;
}

export async function loginRequest(username: string, password: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || 'Login failed');
    }

    return (await response.json()) as LoginResponse;
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Make sure the backend is running.');
    }
    throw error;
  }
}

export async function getCurrentUser() {
  return (await apiRequest('/api/auth/me')) as AuthUser;
}
