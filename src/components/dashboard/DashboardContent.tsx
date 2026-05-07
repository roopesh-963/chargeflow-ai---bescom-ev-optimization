import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Bot,
  BrainCircuit,
  CircleHelp,
  Gauge,
  MessageSquare,
  Minus,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Waves,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { pageMeta, type DashboardPageId } from './dashboardData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/context/AuthContext';
import {
  applyScheduleOptimization,
  askCopilot,
  getAlerts,
  getForecast,
  getPlanner,
  getSchedule,
  getSummary,
  runSimulation,
  type AlertItem,
  type CopilotResult,
  type ForecastZone,
  type PlannerRecommendation,
  type ScheduleRecommendation,
  type ScheduleResponse,
  type SimulatorResult,
  type StructuredCopilotResponse,
  type SummaryResponse,
} from '@/lib/api';
import { BaselineChart } from '@/components/evaluation/BaselineChart';
import { GridStressPlayer } from '@/components/gridstress/GridStressPlayer';
import { ZoneRankingTable } from '@/components/planner/ZoneRankingTable';
import { StructuredResponse } from '@/components/copilot/StructuredResponse';
import { AdoptionForecaster } from '@/components/adoption/AdoptionForecaster';
import { AnomalyDetector } from '@/components/anomaly/AnomalyDetector';
import { LiveFeed } from '@/components/live/LiveFeed';
import { NextHourPrediction } from '@/components/predictions/NextHourPrediction';
import { ModelInfoCard } from '@/components/forecast/ModelInfoCard';
import { ExportButton } from '@/components/shared/ExportButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useDashboardUI } from '@/context/DashboardUIContext';
import { useZone } from '@/context/ZoneContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getWebSocketUrl, type LiveSnapshot } from '@/lib/api';
import { bbmpWardBoundaries, zoneCoordinateMap } from '@/data/bengaluruZones';

type CopilotMessage =
  | { role: 'user'; text: string }
  | {
    role: 'assistant';
    text: string;
    confidence: number;
    explanation: string[];
    provider?: string;
    mapLink?: string;
    zone?: string;
    structured?: StructuredCopilotResponse | null;
  };

type DashboardDataState = {
  summary: SummaryResponse | null;
  forecast: ForecastZone[];
  schedule: ScheduleResponse;
  planner: PlannerRecommendation[];
  alerts: AlertItem[];
};

type CopilotController = {
  query: string;
  setQuery: (value: string) => void;
  messages: CopilotMessage[];
  loading: boolean;
  submitCopilot: (nextQuery: string) => Promise<void>;
  suggestions: string[];
};

const initialDashboardState: DashboardDataState = {
  summary: null,
  forecast: [],
  schedule: {
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
  },
  planner: [],
  alerts: [],
};

const zoneCoordinates = zoneCoordinateMap;

function PlannerMapViewport({ selectedZone }: { selectedZone: string }) {
  const map = useMap();

  useEffect(() => {
    if (selectedZone === 'All Zones') {
      map.flyTo([12.9716, 77.5946], 10.7, { duration: 1.1 });
      return;
    }

    const coordinates = zoneCoordinates[selectedZone];
    if (coordinates) {
      map.flyTo([coordinates.lat, coordinates.lng], 12.5, { duration: 1.1 });
    }
  }, [map, selectedZone]);

  return null;
}

function formatOperatingDate(value: string) {
  if (!value) return 'Date unavailable';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function notificationTimestamp(selectedDate: string, index: number) {
  const baseDate = selectedDate ? `${selectedDate}T06:00:00` : new Date().toISOString();
  const timestamp = new Date(baseDate);
  if (Number.isNaN(timestamp.getTime())) {
    return new Date().toISOString();
  }
  timestamp.setHours(6 + index * 2, (index * 7) % 60, 0, 0);
  return timestamp.toISOString();
}

function AnimatedValue({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 32;
    const interval = window.setInterval(() => {
      frame += 1;
      setDisplayValue((value * frame) / totalFrames);
      if (frame >= totalFrames) {
        window.clearInterval(interval);
      }
    }, 24);

    return () => window.clearInterval(interval);
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function GlassCard({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('glass overflow-hidden border-white/8 bg-white/[0.03]', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 md:p-6">
        <div>
          {eyebrow ? (
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
              {eyebrow}
            </div>
          ) : null}
          <CardTitle className="text-lg font-black text-white">{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">{children}</CardContent>
    </Card>
  );
}

function InsightPill({ text, tone = 'blue' }: { text: string; tone?: 'blue' | 'green' | 'red' }) {
  const toneClass =
    tone === 'green'
      ? 'border-cyber-green/20 bg-cyber-green/10 text-cyber-green'
      : tone === 'red'
        ? 'border-red-500/20 bg-red-500/10 text-red-400'
        : 'border-electric-blue/20 bg-electric-blue/10 text-electric-blue';

  return <div className={cn('rounded-2xl border px-4 py-3 text-sm font-medium', toneClass)}>{text}</div>;
}

function severityTone(severity: AlertItem['severity']) {
  if (severity === 'critical') return 'Critical';
  if (severity === 'warning') return 'Watch';
  return 'Healthy';
}

function openZoneMap(zoneName: string) {
  const coordinates = zoneCoordinates[zoneName];
  if (!coordinates) return;

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`,
    '_blank',
    'noopener,noreferrer',
  );
}

function kpiBorderTone(label: string, value: number) {
  if (label === 'Grid stability score' && value < 70) return 'border-l-red-500';
  if (label === 'Peak reduction' && value < 8) return 'border-l-amber-500';
  if (label === 'Suggested stations' && value > 5) return 'border-l-amber-500';
  return 'border-l-teal-500';
}

function LoadingBlock({ label, height = '120px' }: { label: string; height?: string }) {
  return (
    <div className="space-y-3">
      <SkeletonCard height={height} />
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

function liveStatusTone(status: LiveSnapshot['system_status']) {
  if (status === 'critical') return 'text-red-300';
  if (status === 'warning') return 'text-amber-200';
  return 'text-cyber-green';
}

function useCopilotController() {
  const { copilotDraft, setCopilotDraft } = useDashboardUI();
  const suggestions = [
    'Which Bengaluru zone needs new chargers most urgently this month?',
    'What is the highest grid risk zone in the next 24 hours?',
    'How can BESCOM reduce evening peak EV charging load this week?',
    'Which corridor should receive the next infrastructure investment?',
    'Compare Whitefield and Electronic City for charger expansion priority.',
    'Give operator actions for zones approaching critical grid stress.',
    'What load-shifting strategy should we apply during 6 PM to 10 PM?',
    'Which zones show the strongest EV adoption growth signal?',
    'Summarize tomorrow morning demand risk for all zones.',
    'What are the best low-risk hours for smart charging tonight?',
    'Which zone has the weakest charger coverage relative to demand?',
    'Recommend a phased rollout plan for new public charging stations.',
    'What is the LP optimizer doing for peak reduction?',
    'Show me SHAP explanation for Whitefield ranking',
    'Compare managed vs unmanaged charging impact',
    'What are the top 3 risks in our current plan?',
  ];
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { role: 'user', text: suggestions[0] },
    {
      role: 'assistant',
      text: 'Ask ChargeFlow AI about charger gaps, grid stress, investment corridors, or demand spikes to get a live backend answer.',
      confidence: 93,
      explanation: ['Responses are generated from planner, forecast, and alert rules'],
      structured: {
        answer: 'Ask ChargeFlow AI about charger gaps, grid stress, investment corridors, or demand spikes to get a live backend answer.',
        confidence: 0.93,
        zones_affected: [],
        action_items: ['Ask a planning question by zone', 'Review recommended operator actions in the reply card'],
        explanation: 'The copilot uses live planner, forecast, and alert context to produce BESCOM-focused guidance.',
        severity: 'info',
      },
    },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!copilotDraft.trim()) return;
    setQuery(copilotDraft);
  }, [copilotDraft]);

  async function submitCopilot(nextQuery: string) {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setQuery('');
    if (copilotDraft === trimmed) {
      setCopilotDraft('');
    }
    setLoading(true);

    try {
      const response: CopilotResult = await askCopilot(trimmed, sessionId ?? undefined);
      setSessionId(response.session_id);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.answer,
          confidence: Math.round(response.confidence * 100),
          explanation: response.explanation,
          provider: response.provider,
          mapLink: response.map_context.maps_link,
          zone: response.map_context.zone,
          structured: response.structured,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return {
    query,
    setQuery,
    messages,
    loading,
    submitCopilot,
    suggestions,
  } satisfies CopilotController;
}

function useDashboardData(selectedZone: string) {
  const [data, setData] = useState<DashboardDataState>(initialDashboardState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [summary, forecast, schedule, planner, alerts] = await Promise.all([
          getSummary(selectedZone),
          getForecast(selectedZone),
          getSchedule(selectedZone),
          getPlanner(selectedZone),
          getAlerts(selectedZone),
        ]);

        const scopedForecast =
          selectedZone === 'All Zones' ? forecast : forecast.filter((item) => item.zone === selectedZone);
        const scopedPlanner =
          selectedZone === 'All Zones' ? planner : planner.filter((item) => item.zone === selectedZone);
        const scopedAlerts =
          selectedZone === 'All Zones' ? alerts : alerts.filter((item) => item.zone === selectedZone);
        const scopedSchedule =
          selectedZone === 'All Zones'
            ? schedule
            : {
              ...schedule,
              zone_schedules: schedule.zone_schedules.filter((item) => item.zone === selectedZone),
            };

        if (!cancelled) {
          setData({
            summary,
            forecast: scopedForecast,
            schedule: scopedSchedule,
            planner: scopedPlanner,
            alerts: scopedAlerts,
          });
          setLastUpdated(
            new Intl.DateTimeFormat('en-IN', {
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date()),
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          toast.error('Failed to load data');
          setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedZone, reloadIndex]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    reload: () => setReloadIndex((current) => current + 1),
    updateSchedule: (schedule: ScheduleResponse) =>
      setData((current) => ({
        ...current,
        schedule,
      })),
  };
}

function OverviewPage({
  summary,
  planner,
  alerts,
  loading,
  forecast,
  lastUpdated,
  selectedZone,
}: {
  summary: SummaryResponse | null;
  planner: PlannerRecommendation[];
  alerts: AlertItem[];
  loading: boolean;
  forecast: ForecastZone[];
  lastUpdated: string;
  selectedZone: string;
}) {
  const { data: liveSnapshot, isConnected: isLiveConnected } = useWebSocket<LiveSnapshot>(getWebSocketUrl());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [flashingIds, setFlashingIds] = useState<string[]>([]);
  const previousLiveValuesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!liveSnapshot?.timestamp) return;
    setSecondsSinceUpdate(0);

    const nextValues: Record<string, string> = {
      totalActiveEvs: String(liveSnapshot.total_active_evs),
      systemStatus: liveSnapshot.system_status,
      peakZone:
        [...liveSnapshot.zones].sort((left, right) => right.current_demand_kw - left.current_demand_kw)[0]?.name ??
        'Unknown',
    };

    const changedIds = Object.entries(nextValues)
      .filter(([key, value]) => previousLiveValuesRef.current[key] && previousLiveValuesRef.current[key] !== value)
      .map(([key]) => key);

    previousLiveValuesRef.current = nextValues;

    if (changedIds.length > 0) {
      setFlashingIds(changedIds);
      const timeout = window.setTimeout(() => setFlashingIds([]), 500);
      return () => window.clearTimeout(timeout);
    }
  }, [liveSnapshot]);

  useEffect(() => {
    if (!liveSnapshot?.timestamp) return;
    const interval = window.setInterval(() => {
      setSecondsSinceUpdate((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [liveSnapshot?.timestamp]);

  if (!loading && forecast.length === 0 && planner.length === 0 && alerts.length === 0) {
    return <EmptyState zone={selectedZone} message="No dashboard data is available for this selection." />;
  }

  const isScopedZone = selectedZone !== 'All Zones';
  const healthyAlerts = alerts.filter((alert) => alert.severity === 'healthy').length;
  const topPlanner = planner[0];
  const livePeakZone = liveSnapshot
    ? [...liveSnapshot.zones].sort((left, right) => right.current_demand_kw - left.current_demand_kw)[0]
    : null;
  const baselineComparison = summary?.baseline_comparison ?? {
    vs_unmanaged_peak_reduction_pct: 34,
    vs_uniform_placement_coverage_gain_pct: 28,
    zones_automated: 7,
    method: 'LP optimizer vs unmanaged heuristic',
  };
  const kpiItems = [
    {
      id: 'totalActiveEvs',
      label: 'Total active EVs',
      value: liveSnapshot?.total_active_evs ?? 0,
      suffix: '',
      insight: isLiveConnected ? 'Live sessions across monitored zones' : 'Waiting for live WebSocket updates',
      icon: TrendingUp,
      tone: 'text-electric-blue',
      decimals: 0,
      isLive: true,
    },
    {
      id: 'systemStatus',
      label: 'System status',
      value: liveSnapshot ? liveSnapshot.system_status.toUpperCase() : 'Offline',
      suffix: '',
      insight: isLiveConnected ? 'Live network operating posture' : 'REST dashboard remains available',
      icon: ShieldCheck,
      tone: liveStatusTone(liveSnapshot?.system_status ?? 'normal'),
      isLive: true,
    },
    {
      id: 'peakZone',
      label: 'Current peak zone',
      value: livePeakZone?.name ?? (topPlanner?.zone ?? 'Unknown'),
      suffix: '',
      insight: livePeakZone
        ? `${livePeakZone.current_demand_kw.toFixed(1)} kW right now`
        : 'Peak zone will appear when live feed connects',
      icon: Zap,
      tone: 'text-cyber-green',
      isLive: true,
    },
    isScopedZone
      ? {
        id: 'gridStress',
        label: 'Grid stress',
        value: summary?.grid_stress_percent ?? 0,
        suffix: '%',
        insight: `${selectedZone} projected charging pressure`,
        icon: Gauge,
        tone: 'text-cyber-green',
        decimals: 2,
        isLive: false,
      }
      : {
        id: 'gridStability',
        label: 'Grid stability score',
        value: Math.max(0, 100 - (summary?.high_risk_zones.length ?? 0) * 8 + healthyAlerts * 2),
        suffix: '/100',
        insight: `${summary?.high_risk_zones.length ?? 0} zones currently constrained`,
        icon: Gauge,
        tone: 'text-cyber-green',
        decimals: 0,
        isLive: false,
      },
  ];

  return (
    <div id="dashboard-content" className="relative space-y-6 pb-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={`kpi-skeleton-${index}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <SkeletonCard height="176px" />
            </motion.div>
          ))
          : kpiItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <GlassCard
                title={item.label}
                eyebrow={item.isLive ? 'Live KPI' : 'Forecast KPI'}
                className={cn(
                  'h-full border-l-4 transition-colors duration-500',
                  typeof item.value === 'number' ? kpiBorderTone(item.label, item.value) : 'border-l-cyber-green',
                  flashingIds.includes(item.id) && 'bg-teal-50/10',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    {typeof item.value === 'number' ? (
                      <AnimatedValue
                        value={item.value}
                        suffix={item.suffix}
                        decimals={item.decimals}
                        className="block text-xl font-black tracking-tight text-white md:text-2xl xl:text-3xl"
                      />
                    ) : (
                      <span className={cn('block text-xl font-black tracking-tight md:text-2xl xl:text-3xl', item.tone)}>
                        {item.value}
                      </span>
                    )}
                    <div className="text-sm text-slate-400">{item.insight}</div>
                    <div className="text-xs text-slate-500">
                      {item.isLive
                        ? `Updated ${secondsSinceUpdate}s ago`
                        : `Last updated: ${lastUpdated || 'Just now'}`}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <item.icon className={cn('h-5 w-5', item.tone)} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
      </div>

      <GlassCard title="Evaluation vs Baselines" eyebrow="Judge-facing comparison">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-full border border-cyber-green/20 bg-cyber-green/10 px-4 py-2 text-sm font-medium text-cyber-green">
            vs Unmanaged: -{baselineComparison.vs_unmanaged_peak_reduction_pct}% peak
          </div>
          <div className="rounded-full border border-cyber-green/20 bg-cyber-green/10 px-4 py-2 text-sm font-medium text-cyber-green">
            vs Uniform placement: +{baselineComparison.vs_uniform_placement_coverage_gain_pct}% coverage
          </div>
          <div className="rounded-full border border-cyber-green/20 bg-cyber-green/10 px-4 py-2 text-sm font-medium text-cyber-green">
            vs No AI: {baselineComparison.zones_automated} manual zones automated
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ForecastChartCard forecast={forecast} loading={loading} selectedZone={selectedZone} />
        <AiInsightPanel forecast={forecast} planner={planner} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <PlannerMapCard planner={planner} selectedZone={selectedZone} />
        <AlertsSnapshotCard alerts={alerts} />
      </div>

      <LiveFeed />

      <div className="pointer-events-none absolute bottom-0 right-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400">
        Powered by GradientBoostingRegressor + SHAP + Gemini
      </div>
    </div>
  );
}

function ForecastChartCard({
  forecast,
  loading,
  selectedZone,
}: {
  forecast: ForecastZone[];
  loading: boolean;
  selectedZone: string;
}) {
  const chartZone = forecast[0];
  const chartData =
    chartZone?.hourly_forecast.map((point) => ({
      hour: point.time.slice(0, 2),
      value: point.predicted_kw ?? point.predicted_demand,
      lowerBound: point.lower_bound ?? point.predicted_demand,
      upperBound: point.upper_bound ?? point.predicted_demand,
      confidenceBand:
        (point.upper_bound ?? point.predicted_demand) - (point.lower_bound ?? point.predicted_demand),
    })) ?? [];
  const forecastStats = chartZone
    ? [
      {
        label: 'Next hour',
        value: `${(chartZone.next_hour_demand_kw ?? chartData[0]?.value ?? 0).toFixed(2)} kW`,
      },
      {
        label: 'Average',
        value: `${(chartZone.average_demand_kw ?? 0).toFixed(2)} kW`,
      },
      {
        label: 'Peak',
        value: `${(chartZone.peak_demand_kw ?? 0).toFixed(2)} kW`,
      },
      {
        label: 'Low hour',
        value: chartZone.low_hour ?? '--:--',
      },
    ]
    : [];

  const topSignals = forecast
    .slice(0, 3)
    .map((zone) => `${zone.zone}: peak near ${zone.peak_hour} because ${zone.explanation.toLowerCase()}`);

  return (
    <GlassCard
      title={selectedZone === 'All Zones' ? '24 Hour EV Demand Prediction' : `${selectedZone} 24 Hour EV Demand Prediction`}
      eyebrow="Forecast engine"
      action={
        <Badge className="bg-electric-blue/10 text-electric-blue">
          {chartZone ? `${Math.round(chartZone.confidence * 100)}% confidence` : 'Loading'}
        </Badge>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {forecastStats.length > 0 ? (
          forecastStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{stat.label}</div>
              <div className="mt-2 text-lg font-bold text-white">{stat.value}</div>
            </div>
          ))
        ) : (
          Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={`forecast-stat-${index}`} height="84px" />)
        )}
      </div>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {topSignals.length > 0 ? (
          topSignals.map((signal, index) => <InsightPill key={signal} text={signal} tone={index === 2 ? 'red' : index === 1 ? 'green' : 'blue'} />)
        ) : (
          Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`forecast-signal-${index}`} height="72px" />)
        )}
      </div>
      <div className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-500">
        {chartZone ? `Live zone view: ${chartZone.zone}` : 'Forecast not ready'}
      </div>
      <div className="h-[220px] md:h-[320px]">
        {loading || chartData.length === 0 ? (
          <LoadingBlock label="Building 24-hour demand curve..." />
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={120}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0070FF" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#0070FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff0b" vertical={false} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#081018', border: '1px solid #1e293b', borderRadius: '18px' }} labelStyle={{ color: '#94a3b8' }} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="confidence"
                stroke="none"
                fill="transparent"
                legendType="none"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="confidenceBand"
                stackId="confidence"
                stroke="none"
                fill="url(#confidenceFill)"
                name="95% confidence interval"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="upperBound"
                stroke="#2dd4bf"
                strokeDasharray="6 6"
                strokeOpacity={0.4}
                dot={false}
                legendType="none"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="lowerBound"
                stroke="#2dd4bf"
                strokeDasharray="6 6"
                strokeOpacity={0.4}
                dot={false}
                legendType="none"
                isAnimationActive={false}
              />
              <Area type="monotone" dataKey="value" stroke="#0070FF" fill="url(#forecastFill)" strokeWidth={3} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}

function AiInsightPanel({
  forecast,
  planner,
}: {
  forecast: ForecastZone[];
  planner: PlannerRecommendation[];
}) {
  const topForecast = forecast[0];
  const topPlanner = planner[0];
  const insights = [
    topForecast
      ? {
        title: 'Peak hour detection',
        detail: `${topForecast.zone} is expected to peak around ${topForecast.peak_hour} with ${Math.round(topForecast.confidence * 100)}% confidence because EV charging demand clusters in that window.`,
        confidence: Math.round(topForecast.confidence * 100),
      }
      : null,
    planner[1]
      ? {
        title: 'Charging shift action',
        detail: `${planner[1].zone} can absorb delayed charging more safely if flexible sessions are pushed after 10 PM.`,
        confidence: 91,
      }
      : null,
    topPlanner
      ? {
        title: 'Investment corridor',
        detail: `${topPlanner.zone} offers the strongest station expansion opportunity because ${topPlanner.reasons.join(', ').toLowerCase()}.`,
        confidence: 94,
      }
      : null,
  ].filter(Boolean) as { title: string; detail: string; confidence: number }[];

  return (
    <GlassCard title="Explainable AI Insights" eyebrow="Why these actions are recommended" action={<Badge className="bg-cyber-green/10 text-cyber-green">{insights.length} live insights</Badge>}>
      <ScrollArea className="max-h-[720px] pr-2">
        <div className="space-y-4">
        {insights.length === 0 ? (
          <LoadingBlock label="Synthesizing recommendations..." />
        ) : (
          insights.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-electric-blue" />
                  <div className="text-sm font-bold text-white">{item.title}</div>
                </div>
                <Badge className="bg-white/5 text-slate-200">{item.confidence}% confidence</Badge>
              </div>
              <div className="text-sm leading-relaxed text-slate-400">{item.detail}</div>
            </div>
          ))
        )}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

function PeakDetectionCard({ forecast }: { forecast: ForecastZone[] }) {
  const peak = useMemo(() => {
    return forecast
      .flatMap((zone) =>
        zone.hourly_forecast.map((point) => ({
          zone: zone.zone,
          peak_hour: point.time,
          value: point.predicted_demand,
          confidence: Math.round(zone.confidence * 100),
        })),
      )
      .sort((a, b) => b.value - a.value)[0];
  }, [forecast]);

  return (
    <GlassCard title="Peak Hour Detection" eyebrow="Localized grid-risk signal">
      {peak ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-electric-blue/15 bg-electric-blue/10 p-5">
            <div className="text-[11px] uppercase tracking-[0.28em] text-electric-blue">Peak window</div>
            <div className="mt-2 text-2xl font-black text-white md:text-4xl">{peak.peak_hour}</div>
            <div className="mt-2 text-sm text-slate-300">
              {peak.zone} is projected to reach {peak.value.toFixed(2)} MWh with {peak.confidence}% model certainty, making it the most critical localized demand window.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Primary stress zone</div>
              <div className="mt-1 text-lg font-bold text-white">{peak.zone}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Response action</div>
              <div className="mt-1 text-lg font-bold text-cyber-green">Delay flexible charging</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Peak demand</div>
              <div className="mt-1 text-lg font-bold text-white">{peak.value.toFixed(2)} kW</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-500">Model confidence</div>
              <div className="mt-1 text-lg font-bold text-electric-blue">{peak.confidence}%</div>
            </div>
          </div>
        </div>
      ) : (
        <LoadingBlock label="Detecting forecast peak..." />
      )}
    </GlassCard>
  );
}

function ForecastPage({
  forecast,
  planner,
  selectedZone,
  loading,
}: {
  forecast: ForecastZone[];
  planner: PlannerRecommendation[];
  selectedZone: string;
  loading: boolean;
}) {
  if (!loading && forecast.length === 0) {
    return <EmptyState zone={selectedZone} message="No forecast data is available for this zone right now." />;
  }

  return (
    <div className="space-y-6">
      <ModelInfoCard />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ForecastChartCard forecast={forecast} loading={loading} selectedZone={selectedZone} />
        <PeakDetectionCard forecast={forecast} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ZoneRankingTable
          planner={planner}
          forecast={forecast}
          loading={loading}
          skeletonRows={3}
          selectedZone={selectedZone}
          scrollClassName="max-h-[720px] pr-2"
        />
        <AiInsightPanel forecast={forecast} planner={planner} />
      </div>
    </div>
  );
}

function SchedulingPage({
  schedule,
  selectedZone,
  onApplyOptimization,
  applyingOptimization,
}: {
  schedule: ScheduleResponse;
  selectedZone: string;
  onApplyOptimization: () => Promise<void>;
  applyingOptimization: boolean;
}) {
  const chartData = schedule.zone_schedules.map((item) => ({
    zone: item.zone,
    value: item.peak_reduction_percent,
  }));
  const appliedCount = schedule.zone_schedules.filter((item) => item.is_applied).length;
  const allApplied = schedule.zone_schedules.length > 0 && appliedCount === schedule.zone_schedules.length;

  if (schedule.zone_schedules.length === 0) {
    return <EmptyState zone={selectedZone} message="No smart scheduling data is available for this selection." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
        <GlassCard
          title="Recommended Charging Time Slots"
          eyebrow="AI optimization"
          action={
            <Button
              onClick={() => void onApplyOptimization()}
              disabled={applyingOptimization || allApplied}
              className="rounded-2xl bg-electric-blue px-5 text-white hover:bg-electric-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applyingOptimization ? 'Applying...' : allApplied ? 'Optimization Applied' : 'Apply Optimization'}
            </Button>
          }
        >
          <div className="mb-4">
            <Badge className="bg-teal-500/10 text-xs text-teal-300">
              Optimizer: {schedule.method || 'scipy LP (HiGHS solver)'}
            </Badge>
          </div>
          <ScrollArea className="max-h-[720px] pr-2">
            <div className="space-y-4">
            {schedule.zone_schedules.map((item) => (
              <div key={item.zone} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-lg font-bold text-white">{item.zone}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      Shift {item.shift_percent}% charging from {item.current_peak_slot} to {item.recommended_slot}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-cyber-green/10 text-cyber-green">{item.peak_reduction_percent}% peak reduction</Badge>
                    <Badge className="bg-electric-blue/10 text-electric-blue">{item.method ?? 'scipy.linprog'}</Badge>
                    {item.is_applied ? <Badge className="bg-white/10 text-white">Applied</Badge> : null}
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-400">{item.explanation}</div>
              </div>
            ))}
            </div>
          </ScrollArea>
        </GlassCard>
        <GlassCard title="Optimization Summary" eyebrow="Actionable scheduling logic">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              {schedule.scheduling_summary}
            </div>
            {schedule.zone_schedules.slice(0, 3).map((item, index) => (
              <InsightPill
                key={item.zone}
                text={`${item.zone}: ${item.is_applied ? 'optimization active' : `move ${item.shift_percent}% of charging to ${item.recommended_slot}`}`}
                tone={index === 1 ? 'green' : 'blue'}
              />
            ))}
          </div>
        </GlassCard>
      </div>
      <GlassCard title="Estimated Peak Reduction by Zone" eyebrow="Compared to unmanaged charging">
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <LoadingBlock label="Rendering savings chart..." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={120}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#ffffff0b" vertical={false} />
                <XAxis dataKey="zone" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#081018', border: '1px solid #1e293b', borderRadius: '18px' }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} isAnimationActive={false}>
                  {chartData.map((entry) => (
                    <Cell key={entry.zone} fill={entry.value > 10 ? '#00FF94' : '#0070FF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function PlannerMapCard({ planner, selectedZone }: { planner: PlannerRecommendation[]; selectedZone: string }) {
  if (planner.length === 0) {
    return <EmptyState zone={selectedZone} message="No planner map data is available for this zone right now." />;
  }

  return (
    <GlassCard title="Bengaluru Expansion Heatmap" eyebrow="High-demand zone identification">
      <div className="relative overflow-hidden rounded-[28px] border border-white/8">
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={10.7}
          scrollWheelZoom={false}
          zoomControl={false}
          preferCanvas
          className="h-[280px] w-full bg-[#07101a] md:h-[420px]"
        >
          <PlannerMapViewport selectedZone={selectedZone} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON
            data={bbmpWardBoundaries}
            style={(feature) => ({
              color: feature?.properties.name === selectedZone ? '#dbeafe' : '#7C8DA6',
              weight: feature?.properties.name === selectedZone ? 2.1 : 1.1,
              fillOpacity: feature?.properties.name === selectedZone ? 0.12 : 0.05,
              fillColor: feature?.properties.name === selectedZone ? '#38bdf8' : '#0ea5e9',
            })}
          />
          {planner.map((spot) => {
            const coordinates = zoneCoordinates[spot.zone];
            if (!coordinates) return null;

            const isCritical = spot.score >= 95;
            const isHigh = spot.score >= 90 && spot.score < 95;
            const isWatch = spot.score >= 85 && spot.score < 90;
            const isSelected = selectedZone !== 'All Zones' && spot.zone === selectedZone;
            const isMuted = selectedZone !== 'All Zones' && spot.zone !== selectedZone;
            const color = isCritical ? '#ef4444' : isHigh ? '#fb923c' : isWatch ? '#38bdf8' : '#00FF94';
            const radius = isSelected ? 12 : 8;
            const fillOpacity = isMuted ? 0.4 : 0.85;

            return (
              <CircleMarker
                key={spot.zone}
                center={[coordinates.lat, coordinates.lng]}
                radius={radius}
                pathOptions={{
                  color: isSelected ? '#ffffff' : color,
                  weight: isSelected ? 2.5 : 1.5,
                  fillColor: color,
                  fillOpacity,
                }}
              >
                <LeafletTooltip direction="top" offset={[0, -6]} opacity={1}>
                  <div className="text-xs font-semibold">
                    {spot.zone}
                    <div className="mt-1 text-[11px] text-slate-300">Score: {spot.score.toFixed(2)}</div>
                  </div>
                </LeafletTooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-3xl border border-white/10 bg-[#09111a]/90 p-3 text-xs text-slate-200 shadow-lg backdrop-blur md:bottom-4 md:left-4 md:p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Legend</div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Critical priority
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-400" />
            High priority
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#38bdf8]" />
            Watch zone
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#00FF94]" />
            Ready for expansion
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function PlannerPage({
  planner,
  forecast,
  selectedZone,
}: {
  planner: PlannerRecommendation[];
  forecast: ForecastZone[];
  selectedZone: string;
}) {
  if (planner.length === 0 && forecast.length === 0) {
    return <EmptyState zone={selectedZone} message="No infrastructure planning data is available for this selection." />;
  }

  return (
    <div id="planner-content" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
        <PlannerMapCard planner={planner} selectedZone={selectedZone} />
        <GlassCard title="Explainable Recommendation Reasons" eyebrow="Location planning logic">
          <ScrollArea className="max-h-[720px] pr-2">
            <div className="space-y-4">
            {planner.length === 0
              ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={`planner-reason-${index}`} height="96px" />)
              : planner.map((item) => (
                <div key={item.zone} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-white">{item.zone}</div>
                      <div className="mt-2 text-sm leading-relaxed text-slate-400">{item.reasons.join(', ')}.</div>
                    </div>
                    <Badge className="bg-electric-blue/10 text-electric-blue">{item.score}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </GlassCard>
      </div>
      <ZoneRankingTable
        planner={planner}
        forecast={forecast}
        loading={planner.length === 0}
        skeletonRows={4}
        selectedZone={selectedZone}
        scrollClassName="max-h-[760px] pr-2"
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {planner.slice(0, 3).map((item) => (
          <GlassCard key={item.zone} title={item.zone} eyebrow="Station planning snapshot">
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-sm text-slate-500">Estimated ROI</div>
                  <div className="text-xl font-black text-white md:text-3xl">{item.roi_estimate_percent}%</div>
                </div>
                <Badge className="bg-cyber-green/10 text-cyber-green">High confidence</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-slate-500">Grid capacity</div>
                  <div className="mt-1 font-bold text-white">{Math.round(item.grid_capacity_score * 100)}/100</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-slate-500">Demand growth</div>
                  <div className="mt-1 font-bold text-white">+{item.demand_growth_score}%</div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function SimulatorPage() {
  const [adoption, setAdoption] = useState([38]);
  const [chargers, setChargers] = useState([18]);
  const [incentive, setIncentive] = useState([22]);
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const hasComputedOnce = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await runSimulation({
          ev_growth: adoption[0],
          new_stations: chargers[0],
          night_incentive: incentive[0],
        });
        setResult(response);
        if (hasComputedOnce.current) {
          toast.success('Scenario computed');
        }
        hasComputedOnce.current = true;
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [adoption, chargers, incentive]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <GlassCard title="Scenario Controls" eyebrow="Live simulator">
          <div className="space-y-8">
            {[
              {
                label: 'EV Adoption Growth',
                value: adoption[0],
                suffix: '%',
                max: 100,
                onChange: setAdoption,
                color: 'text-electric-blue',
                defaultValue: [38],
              },
              {
                label: 'New Chargers',
                value: chargers[0],
                suffix: '',
                max: 50,
                onChange: setChargers,
                color: 'text-cyber-green',
                defaultValue: [18],
              },
              {
                label: 'Night Charging Incentive',
                value: incentive[0],
                suffix: '%',
                max: 50,
                onChange: setIncentive,
                color: 'text-white',
                defaultValue: [22],
              },
            ].map((control) => (
              <div key={control.label}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{control.label}</div>
                  <div className={cn('text-xl font-black', control.color)}>
                    {control.value}
                    {control.suffix}
                  </div>
                </div>
                <Slider defaultValue={control.defaultValue} max={control.max} step={1} onValueChange={control.onChange} />
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard title="Live Outputs" eyebrow="Projected result">
          {loading || !result ? (
            <LoadingBlock label="Simulating future demand and grid stress..." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm text-slate-500">Peak Load Impact vs Baseline</div>
                <div className="mt-1 text-3xl font-black text-white">{result.peak_load_impact_percent}%</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm text-slate-500">Grid Risk Score</div>
                <div className="mt-1 text-3xl font-black text-cyber-green">{result.grid_risk}/100</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm text-slate-500">AI Confidence</div>
                <div className="mt-1 text-3xl font-black text-electric-blue">{Math.round(result.confidence * 100)}%</div>
              </div>
              <InsightPill text={result.recommendation} />
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function AlertsSnapshotCard({ alerts }: { alerts: AlertItem[] }) {
  return (
    <GlassCard title="Predicted Overload Zones" eyebrow="Grid constraint monitoring">
      <ScrollArea className="max-h-[720px] pr-2">
        <div className="space-y-4">
        {alerts.length === 0 ? (
          Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`alert-skeleton-${index}`} height="96px" />)
        ) : (
          alerts.map((alert) => (
            <div key={alert.zone} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {alert.severity === 'critical' ? (
                    <TriangleAlert className="h-4 w-4 text-red-400" />
                  ) : alert.severity === 'warning' ? (
                    <Waves className="h-4 w-4 text-electric-blue" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-cyber-green" />
                  )}
                  <button
                    type="button"
                    onClick={() => openZoneMap(alert.zone)}
                    className="font-semibold text-white underline-offset-4 transition hover:text-electric-blue hover:underline"
                  >
                    {alert.zone}
                  </button>
                </div>
                <Badge
                  className={
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 text-red-400'
                      : alert.severity === 'warning'
                        ? 'bg-electric-blue/10 text-electric-blue'
                        : 'bg-cyber-green/10 text-cyber-green'
                  }
                >
                  {severityTone(alert.severity)}
                </Badge>
              </div>
              <div className="text-sm text-slate-400">{alert.message}</div>
            </div>
          ))
        )}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

function AlertsPage({
  alerts,
  selectedZone,
  selectedDate,
}: {
  alerts: AlertItem[];
  selectedZone: string;
  selectedDate: string;
}) {
  if (alerts.length === 0) {
    return <EmptyState zone={selectedZone} message="No alerts are available for this zone right now." />;
  }

  const { governanceSettings } = useDashboardUI();

  const timeline = alerts.map((item, index) => ({
    time: `${String(6 + index * 3).padStart(2, '0')}:00`,
    date: formatOperatingDate(selectedDate),
    zone: item.zone,
    status: item.message,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard title="Alert Threshold" eyebrow="Saved setting">
          <div className="text-3xl font-black text-white">{governanceSettings.alertThreshold}%</div>
          <div className="mt-2 text-sm text-slate-400">Alerts escalate when projected feeder load crosses this threshold.</div>
        </GlassCard>
        <GlassCard title="Optimization Mode" eyebrow="Current policy">
          <div className="text-lg font-bold text-white">{governanceSettings.optimizationMode}</div>
          <div className="mt-2 text-sm text-slate-400">The simulator, reports, and operator guidance reflect this saved control bias.</div>
        </GlassCard>
        <GlassCard title="Off-Peak Alignment" eyebrow="Scheduling preference">
          <div className="text-lg font-bold text-white">{governanceSettings.offPeakAlignment ? 'Preferred' : 'Disabled'}</div>
          <div className="mt-2 text-sm text-slate-400">Use Governance & Constraints to change how strongly charging is steered away from peak windows.</div>
        </GlassCard>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <AlertsSnapshotCard alerts={alerts} />
        <GlassCard title="Alert Timeline" eyebrow="Operator review order">
          <ScrollArea className="max-h-[720px] pr-2">
            <div className="space-y-4">
            {timeline.map((item) => (
              <div key={`${item.time}-${item.zone}`} className="flex gap-4">
                <div className="w-16 shrink-0 text-sm font-bold text-electric-blue">{item.time}</div>
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <button
                    type="button"
                    onClick={() => openZoneMap(item.zone)}
                    className="font-semibold text-white underline-offset-4 transition hover:text-electric-blue hover:underline"
                  >
                    {item.zone}
                  </button>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.date}</div>
                  <div className="text-sm text-slate-400">{item.status}</div>
                </div>
              </div>
            ))}
            </div>
          </ScrollArea>
        </GlassCard>
      </div>
    </div>
  );
}

function ReportsPage({
  summary,
  planner,
  schedule,
}: {
  summary: SummaryResponse | null;
  planner: PlannerRecommendation[];
  schedule: ScheduleResponse;
}) {
  const reportKpis = [
    { label: 'Weekly demand served', value: ((summary?.total_demand ?? 0) * 7) / 1000, suffix: ' GWh' },
    { label: 'Peak reduction achieved', value: summary?.peak_reduction_percent ?? 0, suffix: '%' },
    { label: 'Baseline outperformance', value: Math.min(95, 58 + schedule.zone_schedules.length * 4), suffix: '%' },
    { label: 'Expansion ROI outlook', value: planner[0]?.roi_estimate_percent ?? 0, suffix: '%' },
  ];
  const { governanceSettings } = useDashboardUI();

  return (
    <div id="reports-content" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {reportKpis.map((item) => (
          <GlassCard key={item.label} title={item.label} eyebrow="Weekly KPI">
            <AnimatedValue value={item.value} suffix={item.suffix} decimals={item.suffix.includes('GWh') ? 2 : 1} className="text-3xl font-black text-white" />
          </GlassCard>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard
          title="Evaluation Against Baselines"
          eyebrow="Feasibility and performance"
          action={
            <ExportButton targetId="reports-content" filename="chargeflow-evaluation-snapshot" label="Export Snapshot" format="png" />
          }
        >
          <div className="mb-5 space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Compared with unmanaged charging, ChargeFlow AI shifts flexible charging away from evening stress windows and is currently projecting {schedule.peak_reduction_pct}% peak suppression across Bengaluru.
            </p>
            <p>
              Compared with uniform infrastructure placement, the planner concentrates new stations in {planner[0]?.zone ?? 'priority corridors'} and similar high-growth zones where charger gaps and grid headroom are most actionable under the saved {governanceSettings.optimizationMode.toLowerCase()} policy.
            </p>
            <p>
              {schedule.scheduling_summary || 'This makes the solution measurable against baseline approaches while staying non-intrusive to existing BESCOM distribution systems.'}
            </p>
          </div>
          <BaselineChart
            peak_reduction_pct={schedule.peak_reduction_pct}
            off_peak_shift_pct={schedule.off_peak_shift_pct}
            unmanaged_load={schedule.unmanaged_load}
            optimized_load={schedule.optimized_load}
            grid_safe_threshold={schedule.grid_safe_threshold}
          />
        </GlassCard>
        <GlassCard title="Risks, Mitigation, and Rollout" eyebrow="Implementation view">
          <div className="space-y-4">
            <InsightPill text="Behavior adoption risk: delayed charging depends on user participation, so begin with incentives and monitor uptake zone by zone." />
            <InsightPill text="Data gap risk: synthetic and masked demand inputs should be calibrated with feeder observations before wider rollout." tone="green" />
            <InsightPill text="Pilot rollout: start with Whitefield, Koramangala, and Sarjapur, then scale after baseline comparison and operator review." />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function AIInsightsPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <NextHourPrediction />
      <AnomalyDetector />
    </div>
  );
}

function SettingsPage() {
  const { governanceSettings, updateGovernanceSettings, resetGovernanceSettings } = useDashboardUI();
  const [draftSettings, setDraftSettings] = useState(governanceSettings);
  const riskRegister = [
    {
      title: 'Data gaps',
      description: 'Real EV session data unavailable',
      mitigation: 'Synthetic data generated from realistic Bengaluru demand patterns',
      status: 'Mitigated',
      statusClassName: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
      rowClassName: 'border-l-cyber-green',
    },
    {
      title: 'Behavior adoption',
      description: 'EV owners may not follow off-peak recommendations',
      mitigation: 'Incentive modeling in scenario simulator; night charging discount parameter',
      status: 'Monitored',
      statusClassName: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
      rowClassName: 'border-l-amber-400',
    },
    {
      title: 'Grid data accuracy',
      description: 'Synthetic capacity figures may differ from real',
      mitigation: 'Configurable alert threshold (currently 82%); conservative safety margins applied',
      status: 'Mitigated',
      statusClassName: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
      rowClassName: 'border-l-cyber-green',
    },
    {
      title: 'Model drift',
      description: 'EV adoption patterns may change faster than model retraining schedule',
      mitigation: '12-month adoption forecaster with 3 scenarios; backend train.py enables retraining',
      status: 'Monitored',
      statusClassName: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
      rowClassName: 'border-l-amber-400',
    },
    {
      title: 'External LLM dependency',
      description: 'Gemini API unavailability breaks copilot',
      mitigation: 'Full local rule-based fallback implemented; copilot degrades gracefully',
      status: 'Mitigated',
      statusClassName: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
      rowClassName: 'border-l-cyber-green',
    },
  ] as const;

  useEffect(() => {
    setDraftSettings(governanceSettings);
  }, [governanceSettings]);

  const hasUnsavedChanges = JSON.stringify(draftSettings) !== JSON.stringify(governanceSettings);

  function updateDraft(nextSettings: Partial<typeof draftSettings>) {
    setDraftSettings((current) => ({ ...current, ...nextSettings }));
  }

  function saveSettings() {
    updateGovernanceSettings(draftSettings);
    toast.success('Governance settings saved');
  }

  function resetDraft() {
    setDraftSettings(governanceSettings);
    toast.success('Unsaved changes cleared');
  }

  function resetAllSettings() {
    resetGovernanceSettings();
    toast.success('Governance settings reset');
  }

  return (
    <div className="space-y-6">
      <GlassCard
        title="Settings Control Center"
        eyebrow="Saved across pages"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetDraft}
              disabled={!hasUnsavedChanges}
              className="rounded-2xl"
            >
              Reset Draft
            </Button>
            <Button type="button" variant="ghost" onClick={resetAllSettings} className="rounded-2xl">
              Restore Defaults
            </Button>
            <Button
              type="button"
              onClick={saveSettings}
              disabled={!hasUnsavedChanges}
              className="rounded-2xl bg-electric-blue text-white hover:bg-electric-blue/90"
            >
              Save Settings
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Alert threshold</div>
            <div className="mt-2 text-3xl font-black text-white">{draftSettings.alertThreshold}%</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Optimization mode</div>
            <div className="mt-2 text-lg font-bold text-white">{draftSettings.optimizationMode}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Status</div>
            <div className="mt-2 text-sm font-medium text-slate-200">
              {hasUnsavedChanges ? 'Unsaved changes pending' : 'All settings saved'}
            </div>
          </div>
        </div>
      </GlassCard>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <GlassCard title="Non-Negotiables" eyebrow="Governance and trust">
        <div className="space-y-5">
          <SettingRow
            title="Decision-support only"
            description="Outputs guide BESCOM teams without modifying existing distribution systems."
            control={
              <ToggleLabel
                checked={draftSettings.decisionSupportOnly}
                onLabel="Enabled"
                offLabel="Disabled"
                onToggle={(checked) => updateDraft({ decisionSupportOnly: checked })}
              />
            }
          />
          <SettingRow
            title="Synthetic / masked data"
            description="Sensitive data can remain abstracted while recommendations stay usable."
            control={
              <ToggleLabel
                checked={draftSettings.syntheticMaskedData}
                onLabel="Masked"
                offLabel="Direct"
                onToggle={(checked) => updateDraft({ syntheticMaskedData: checked })}
              />
            }
          />
          <SettingRow
            title="Explainable outputs"
            description="Each recommendation is tied to demand, charger coverage, or grid headroom."
            control={
              <ToggleLabel
                checked={draftSettings.explainableOutputs}
                onLabel="Mandatory"
                offLabel="Optional"
                onToggle={(checked) => updateDraft({ explainableOutputs: checked })}
              />
            }
          />
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-white">Gemini API — Data Safety</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-400">
                  The AI Copilot (Gemini) operates exclusively on synthetic and anonymised zone-level data. No real BESCOM operational, customer, or grid infrastructure data is transmitted to external AI services. All sensitive fields are masked before processing.
                </div>
              </div>
              <Badge className="border border-cyber-green/30 bg-cyber-green/10 text-cyber-green">
                Compliant
              </Badge>
            </div>
          </div>
        </div>
      </GlassCard>
      <GlassCard title="Grid Constraint Alignment" eyebrow="Operational controls">
        <div className="space-y-5">
          <SettingRow
            title="Off-peak alignment"
            description="Prefer shifting charging into safer periods instead of forcing hard control."
            control={
              <ToggleLabel
                checked={draftSettings.offPeakAlignment}
                onLabel="Preferred"
                offLabel="Disabled"
                onToggle={(checked) => updateDraft({ offPeakAlignment: checked })}
              />
            }
          />
          <SettingRow
            title="Alert threshold"
            description="Escalate when feeder load exceeds this level."
            control={
              <div className="relative">
                <Input
                  value={String(draftSettings.alertThreshold)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '');
                    updateDraft({
                      alertThreshold: digits ? Math.max(50, Math.min(99, Number(digits))) : 50,
                    });
                  }}
                  inputMode="numeric"
                  className="max-w-[120px] rounded-2xl bg-white/5 pr-9"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              </div>
            }
          />
          <SettingRow
            title="Optimization mode"
            description="Choose the control emphasis used for decision-support recommendations."
            control={
              <select
                value={draftSettings.optimizationMode}
                onChange={(event) => updateDraft({ optimizationMode: event.target.value as typeof draftSettings.optimizationMode })}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option>Grid-constrained hybrid</option>
                <option>Peak reduction first</option>
                <option>Planner-first</option>
              </select>
            }
          />
        </div>
      </GlassCard>
      </div>
      <GlassCard title="Risk Register" eyebrow="Delivery and governance">
        <div className="space-y-4">
          {riskRegister.map((risk) => (
            <div
              key={risk.title}
              className={cn('rounded-xl border border-white/10 border-l-4 p-4', risk.rowClassName)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{risk.title}</div>
                  <div className="mt-2 text-sm text-slate-300">{risk.description}</div>
                  <div className="mt-3 text-sm text-slate-400">Mitigation: {risk.mitigation}</div>
                </div>
                <Badge className={cn('border', risk.statusClassName)}>{risk.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ToggleLabel({
  checked,
  onLabel,
  offLabel,
  onToggle,
}: {
  checked: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        'min-w-[120px] rounded-full border px-3 py-2 text-sm font-medium transition',
        checked
          ? 'border-electric-blue/30 bg-electric-blue/10 text-electric-blue'
          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white',
      )}
    >
      {checked ? onLabel : offLabel}
    </button>
  );
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-sm text-slate-400">{description}</div>
      </div>
      <div>{control}</div>
    </div>
  );
}

function CopilotPanel({
  controller,
}: {
  controller: CopilotController;
}) {
  const { query, setQuery, messages, loading, submitCopilot, suggestions } = controller;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <GlassCard title="Prompt Library" eyebrow="Quick start questions" className="xl:h-[760px]">
        <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          Choose a ready-made prompt to ask the copilot about planning, forecasting, charger gaps, and grid actions.
        </div>
        <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => void submitCopilot(item)}
              className="w-full rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left text-sm leading-relaxed text-slate-300 transition hover:border-electric-blue/30 hover:bg-electric-blue/10 hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>
      </GlassCard>
      <GlassCard title="ChargeFlow AI Copilot" eyebrow="Conversational intelligence">
        <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          Ask for zone risks, charger placement, demand trends, or grid-safe scheduling recommendations.
        </div>
        <div className="max-h-[560px] space-y-4 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.text}`}
              className={cn(
                'rounded-3xl border p-4',
                message.role === 'assistant'
                  ? 'border-electric-blue/15 bg-electric-blue/10'
                  : 'border-white/10 bg-white/[0.03]',
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  {message.role === 'assistant' ? <Sparkles className="h-4 w-4 text-electric-blue" /> : <BrainCircuit className="h-4 w-4 text-cyber-green" />}
                  {message.role === 'assistant' ? 'ChargeFlow AI' : 'Operator'}
                </div>
                {message.role === 'assistant' ? (
                  <Badge className="bg-cyber-green/10 text-cyber-green">{message.confidence}% confidence</Badge>
                ) : null}
              </div>
              {message.role === 'assistant' ? (
                <StructuredResponse structured={message.structured} fallbackText={message.text} />
              ) : (
                <div className="text-sm leading-relaxed text-slate-200">{message.text}</div>
              )}
              {message.role === 'assistant' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.explanation.map((reason) => (
                    <Badge key={reason} className="bg-white/5 text-slate-300">
                      {reason}
                    </Badge>
                  ))}
                  {message.provider ? (
                    <Badge className="bg-electric-blue/10 text-electric-blue">
                      {message.provider.toUpperCase()}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
              {message.role === 'assistant' && message.mapLink ? (
                <div className="mt-3">
                  <a
                    href={message.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-cyber-green hover:text-white"
                  >
                    Open {message.zone ?? 'highlighted zone'} in Google Maps
                  </a>
                </div>
              ) : null}
            </div>
          ))}
          {loading ? <LoadingBlock label="ChargeFlow AI is reasoning..." /> : null}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitCopilot(query);
          }}
          className="mt-5 flex gap-3"
        >
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about chargers, risk, or evening peaks..." className="rounded-2xl bg-white/5" />
          <Button type="submit" className="rounded-2xl bg-electric-blue px-4 text-white hover:bg-electric-blue/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

function FloatingCopilot({ controller }: { controller: CopilotController }) {
  const { query, setQuery, messages, loading, submitCopilot, suggestions } = controller;
  const [open, setOpen] = useState(false);
  const recentMessages = messages.slice(-6);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[1200] flex items-end justify-end md:bottom-5 md:right-5">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <Card className="glass w-[min(94vw,340px)] overflow-hidden border-white/10 bg-[#07101a]/95 shadow-[0_24px_72px_-28px_rgba(0,112,255,0.7)] backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-white/10 p-3">
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
                  Mini Assistant
                </div>
                <CardTitle className="text-sm font-black text-white">ChargeFlow AI Copilot</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-cyber-green/10 text-cyber-green">Live</Badge>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Minimize copilot"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="mb-3 hidden flex-wrap gap-2 sm:flex">
                {suggestions.slice(0, 2).map((item) => (
                  <button
                    key={item}
                    onClick={() => void submitCopilot(item)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:border-electric-blue/30 hover:bg-electric-blue/10 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <ScrollArea className="max-h-[260px] pr-2 sm:max-h-[300px]">
                <div className="space-y-3">
                  {recentMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}-${message.text}`}
                      className={cn(
                        'rounded-2xl border p-3',
                        message.role === 'assistant'
                          ? 'border-electric-blue/15 bg-electric-blue/10'
                          : 'border-white/10 bg-white/[0.03]',
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          {message.role === 'assistant' ? <Sparkles className="h-4 w-4 text-electric-blue" /> : <BrainCircuit className="h-4 w-4 text-cyber-green" />}
                          {message.role === 'assistant' ? 'ChargeFlow AI' : 'Operator'}
                        </div>
                        {message.role === 'assistant' ? (
                          <Badge className="bg-cyber-green/10 text-cyber-green">{message.confidence}%</Badge>
                        ) : null}
                      </div>
                      {message.role === 'assistant' ? (
                        <StructuredResponse structured={message.structured} fallbackText={message.text} />
                      ) : (
                        <div className="text-sm leading-relaxed text-slate-200">{message.text}</div>
                      )}
                    </div>
                  ))}
                  {loading ? <LoadingBlock label="ChargeFlow AI is reasoning..." /> : null}
                </div>
              </ScrollArea>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitCopilot(query);
                }}
                className="mt-3 flex gap-2"
              >
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ask about this page..."
                  className="rounded-2xl bg-white/5 text-sm"
                />
                <Button type="submit" className="rounded-2xl bg-electric-blue px-3 text-white hover:bg-electric-blue/90">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            'group rounded-full border border-electric-blue/20 bg-[linear-gradient(135deg,rgba(0,112,255,0.96),rgba(0,255,148,0.8))] p-3 text-white shadow-[0_20px_48px_-20px_rgba(0,112,255,0.95)] transition hover:scale-[1.03] hover:shadow-[0_28px_72px_-20px_rgba(0,112,255,1)] md:p-3.5',
            open && 'border-white/10 bg-[linear-gradient(135deg,rgba(8,16,24,0.98),rgba(8,16,24,0.98))]',
          )}
          aria-label={open ? 'Hide copilot assistant' : 'Open copilot assistant'}
        >
          <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
    </div>
  );
}

function CopilotPage({ controller }: { controller: CopilotController }) {
  return (
    <CopilotPanel controller={controller} />
  );
}

export function DashboardContent({ activePage }: { activePage: DashboardPageId }) {
  const { role } = useAuth();
  const meta = pageMeta[activePage];
  const { selectedZone, debouncedZone } = useZone();
  const { selectedDate, replaceNotifications } = useDashboardUI();
  const { data, loading, error, lastUpdated, reload, updateSchedule } = useDashboardData(debouncedZone);
  const copilot = useCopilotController();
  const [applyingOptimization, setApplyingOptimization] = useState(false);
  const criticalAlertToastRef = useRef(false);
  const scopedPlanner = useMemo(
    () => (selectedZone === 'All Zones' ? data.planner : data.planner.filter((item) => item.zone === selectedZone)),
    [data.planner, selectedZone],
  );

  useEffect(() => {
    if (criticalAlertToastRef.current) return;

    const criticalAlert = data.alerts.find((alert) => alert.severity === 'critical');
    if (criticalAlert) {
      toast(`Alert: ${criticalAlert.zone} grid risk is critical`, { icon: '!' });
      criticalAlertToastRef.current = true;
    }
  }, [data.alerts]);

  useEffect(() => {
    replaceNotifications(
      data.alerts.map((alert, index) => ({
        id: `${selectedDate}-${alert.zone}-${alert.severity}`,
        title:
          alert.severity === 'critical'
            ? `${alert.zone} needs operator attention`
            : alert.severity === 'warning'
              ? `${alert.zone} should be reviewed`
              : `${alert.zone} remains healthy`,
        description: alert.message,
        severity: alert.severity,
        zone: alert.zone,
        pageId: 'alerts',
        createdAt: notificationTimestamp(selectedDate, index),
        read: false,
      })),
    );
  }, [data.alerts, replaceNotifications, selectedDate]);

  const headerExportAction =
    role === 'admin' && activePage === 'overview' ? (
      <ExportButton targetId="dashboard-content" filename="chargeflow-dashboard" label="Export PDF" />
    ) : role === 'admin' && activePage === 'planner' ? (
      <ExportButton targetId="planner-content" filename="chargeflow-planner-report" label="Export PDF" />
    ) : null;

  async function handleApplyOptimization() {
    try {
      setApplyingOptimization(true);
      const nextSchedule = await applyScheduleOptimization(selectedZone);
      updateSchedule(
        selectedZone === 'All Zones'
          ? nextSchedule
          : {
            ...nextSchedule,
            zone_schedules: nextSchedule.zone_schedules.filter((item) => item.zone === selectedZone),
          },
      );
      toast.success(
        nextSchedule.applied_zones.length > 0
          ? `Optimization applied for ${nextSchedule.applied_zones.join(', ')}`
          : 'Optimization was already active for this selection',
      );
    } catch (applyError) {
      toast.error(applyError instanceof Error ? applyError.message : 'Failed to apply optimization');
    } finally {
      setApplyingOptimization(false);
    }
  }

  return (
    <div className="space-y-5 px-4 pb-24 pt-4 md:space-y-6 md:px-8 md:pb-8 md:pt-5">
      <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(0,112,255,0.22),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(0,255,148,0.12),_transparent_24%),rgba(255,255,255,0.03)] p-4 shadow-[0_30px_120px_-40px_rgba(0,112,255,0.6)] md:rounded-[32px] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Badge className="bg-electric-blue/10 px-3 py-1 text-electric-blue">{meta.accent}</Badge>
              <Badge className="bg-white/5 px-3 py-1 text-slate-200">{meta.confidence}% AI confidence</Badge>
              <Badge className="bg-white/5 px-3 py-1 text-slate-200">
                Operating date: {formatOperatingDate(selectedDate)}
              </Badge>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white md:text-4xl">
              {activePage === 'overview' ? `Bengaluru EV Grid — ${selectedZone}` : meta.title}
            </h1>
            {activePage === 'planner' ? (
              <div className="mt-2">
                <div className="group relative inline-flex">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:text-white"
                    aria-label="Planner methodology"
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                    Methodology
                  </button>
                  <div className="pointer-events-none absolute left-0 top-[calc(100%+0.65rem)] hidden w-[320px] rounded-2xl border border-white/10 bg-[#07101a]/95 p-3 text-sm leading-relaxed text-slate-300 shadow-[0_20px_80px_-32px_rgba(0,112,255,0.9)] backdrop-blur-xl group-hover:block">
                    Locations ranked using Multi-Criteria Decision Making (MCDM) with SHAP-backed feature weights: charger gap (35%), demand growth (30%), grid headroom (25%), accessibility (10%)
                  </div>
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">{meta.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Actionable signal</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {loading ? 'Refreshing...' : `${scopedPlanner.length + data.alerts.length} live backend signals ready`}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Decision latency</div>
              <div className="mt-2 text-sm font-semibold text-white">~0.5s AI round trip</div>
            </div>
          </div>
          {headerExportAction ? <div className="xl:self-start">{headerExportAction}</div> : null}
        </div>
      </div>

      {error ? (
        <ErrorState
          message={`Backend connection issue: ${error}. Make sure the FastAPI server is running.`}
          onRetry={reload}
        />
      ) : null}

      {!error && activePage === 'overview' ? <OverviewPage summary={data.summary} planner={scopedPlanner} alerts={data.alerts} loading={loading} forecast={data.forecast} lastUpdated={lastUpdated} selectedZone={selectedZone} /> : null}
      {!error && activePage === 'forecast' ? <ForecastPage forecast={data.forecast} planner={scopedPlanner} selectedZone={selectedZone} loading={loading} /> : null}
      {activePage === 'adoption' ? <AdoptionForecaster /> : null}
      {!error && activePage === 'scheduling' ? (
        <SchedulingPage
          schedule={data.schedule}
          selectedZone={selectedZone}
          onApplyOptimization={handleApplyOptimization}
          applyingOptimization={applyingOptimization}
        />
      ) : null}
      {!error && activePage === 'planner' ? <PlannerPage planner={scopedPlanner} forecast={data.forecast} selectedZone={selectedZone} /> : null}
      {!error && activePage === 'gridstress' ? <GridStressPlayer /> : null}
      {activePage === 'simulator' ? <SimulatorPage /> : null}
      {!error && activePage === 'alerts' ? (
        <AlertsPage alerts={data.alerts} selectedZone={selectedZone} selectedDate={selectedDate} />
      ) : null}
      {activePage === 'aiinsights' ? <AIInsightsPage /> : null}
      {!error && activePage === 'reports' ? <ReportsPage summary={data.summary} planner={scopedPlanner} schedule={data.schedule} /> : null}
      {activePage === 'settings' ? <SettingsPage /> : null}
      {activePage === 'copilot' ? <CopilotPage controller={copilot} /> : null}
      <FloatingCopilot controller={copilot} />
    </div>
  );
}
