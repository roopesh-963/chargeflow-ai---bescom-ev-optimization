import {
  Activity,
  BatteryCharging,
  BrainCircuit,
  Bot,
  ChartColumnIncreasing,
  FileText,
  LayoutDashboard,
  MapPin,
  ScanSearch,
  Settings,
  ShieldAlert,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DashboardPageId =
  | 'overview'
  | 'forecast'
  | 'adoption'
  | 'scheduling'
  | 'planner'
  | 'gridstress'
  | 'simulator'
  | 'alerts'
  | 'aiinsights'
  | 'reports'
  | 'settings'
  | 'copilot';

export interface DashboardNavItem {
  id: DashboardPageId;
  label: string;
  icon: LucideIcon;
  shortLabel: string;
}

export type DashboardRole = 'admin' | 'operator' | 'planner';

const dashboardPageIds: DashboardPageId[] = [
  'overview',
  'forecast',
  'adoption',
  'scheduling',
  'planner',
  'gridstress',
  'simulator',
  'alerts',
  'aiinsights',
  'reports',
  'settings',
  'copilot',
];

export const navItems: DashboardNavItem[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { id: 'forecast', label: 'Demand Forecast', shortLabel: 'Forecast', icon: TrendingUp },
  { id: 'adoption', label: 'Adoption Forecast', shortLabel: 'Adoption', icon: ChartColumnIncreasing },
  { id: 'scheduling', label: 'Smart Scheduling', shortLabel: 'Scheduling', icon: Zap },
  { id: 'planner', label: 'Infrastructure Planner', shortLabel: 'Planner', icon: MapPin },
  { id: 'gridstress', label: 'Grid Stress Player', shortLabel: 'Stress', icon: Activity },
  { id: 'simulator', label: 'Scenario Simulator', shortLabel: 'Simulator', icon: ScanSearch },
  { id: 'alerts', label: 'Grid Alerts', shortLabel: 'Alerts', icon: ShieldAlert },
  { id: 'aiinsights', label: 'AI Insights', shortLabel: 'Insights', icon: BrainCircuit },
  { id: 'reports', label: 'Evaluation & Baselines', shortLabel: 'Evaluation', icon: FileText },
  { id: 'settings', label: 'Governance & Constraints', shortLabel: 'Governance', icon: Settings },
  { id: 'copilot', label: 'AI Copilot', shortLabel: 'Copilot', icon: BatteryCharging },
];

export const pageMeta: Record<
  DashboardPageId,
  { title: string; description: string; accent: string; confidence: number }
> = {
  overview: {
    title: 'Dashboard',
    description: 'Live decision-support for BESCOM grid operators',
    accent: 'Decision support for BESCOM',
    confidence: 96,
  },
  forecast: {
    title: 'Demand Forecast',
    description: 'GradientBoostingRegressor-powered 24-hour EV demand prediction by zone',
    accent: 'Part A: demand prediction',
    confidence: 94,
  },
  adoption: {
    title: 'Adoption Forecast',
    description: 'A 12-month EV growth forecaster that projects vehicle counts, charger requirements, charging demand, and grid stress under conservative, moderate, and aggressive growth scenarios.',
    accent: 'EV adoption scenarios',
    confidence: 93,
  },
  scheduling: {
    title: 'Smart Scheduler',
    description: 'LP-optimized charging slots aligned to grid capacity',
    accent: 'Part A: schedule optimization',
    confidence: 92,
  },
  planner: {
    title: 'Infrastructure Planner',
    description: 'SHAP-explained infrastructure location recommendations',
    accent: 'Part B: location planning',
    confidence: 91,
  },
  gridstress: {
    title: 'Grid Stress Player',
    description: 'A live control-room playback of hourly demand buildup across Bengaluru zones, showing where feeder stress escalates from normal to critical.',
    accent: 'Real-time grid stress simulation',
    confidence: 95,
  },
  simulator: {
    title: 'Scenario Simulator',
    description: 'What-if modeling for EV growth, new station rollout, and incentive strategies to compare future outcomes against unmanaged charging.',
    accent: 'Scenario comparison',
    confidence: 90,
  },
  alerts: {
    title: 'Grid Alerts',
    description: 'Predicted overload zones with operator action priority',
    accent: 'Grid-aware recommendations',
    confidence: 95,
  },
  aiinsights: {
    title: 'AI Insights',
    description: 'IsolationForest anomaly detection + GradientBoostingRegressor 6-hour predictions',
    accent: 'Predictive anomaly intelligence',
    confidence: 95,
  },
  reports: {
    title: 'Evaluation & Baselines',
    description: 'Comparison against unmanaged charging and uniform infrastructure placement, with implementation milestones, risks, and measurable success criteria.',
    accent: 'Feasibility and baselines',
    confidence: 93,
  },
  settings: {
    title: 'Governance & Constraints',
    description: 'Controls and guardrails that keep the solution explainable, non-intrusive, synthetic-data-safe, and aligned with BESCOM operational constraints.',
    accent: 'Non-negotiables and trust',
    confidence: 88,
  },
  copilot: {
    title: 'ChargeFlow AI Copilot',
    description: 'Gemini-powered planning assistant with structured insights',
    accent: 'Explainable operator assistant',
    confidence: 97,
  },
};

export function isDashboardPageId(value: string): value is DashboardPageId {
  return dashboardPageIds.includes(value as DashboardPageId);
}

export function getDashboardPagePath(page: DashboardPageId) {
  return `/dashboard/${page}`;
}

export function isPageVisibleForRole(page: DashboardPageId, role: DashboardRole) {
  if (role === 'operator' && (page === 'planner' || page === 'adoption')) return false;
  if (role === 'planner' && page === 'alerts') return false;
  return true;
}

export function getVisibleNavItems(role: DashboardRole) {
  return navItems.filter((item) => isPageVisibleForRole(item.id, role));
}

export function getDefaultPageForRole(role: DashboardRole): DashboardPageId {
  const firstVisiblePage = navItems.find((item) => isPageVisibleForRole(item.id, role));
  return firstVisiblePage?.id ?? 'overview';
}
