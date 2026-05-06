import { memo, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotProps,
} from 'recharts';
import { AlertTriangle, Clock3, Radar } from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useZone } from '@/context/ZoneContext';
import { getAnomalies, type AnomalyPoint, type AnomalyResponse } from '@/lib/api';

function riskTone(level: AnomalyResponse['risk_level']) {
  if (level === 'high') return 'border-red-500/20 bg-red-500/10 text-red-300';
  if (level === 'medium') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-teal-400/20 bg-teal-400/10 text-teal-200';
}

function severityOrder(level: AnomalyPoint['severity']) {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
}

function CustomAnomalyDot(props: DotProps & { payload?: AnomalyPoint }) {
  const { cx, cy, payload } = props;
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null;
  if (payload.is_anomaly) {
    return (
      <path
        d={`M ${cx} ${cy - 8} L ${cx - 7} ${cy + 6} L ${cx + 7} ${cy + 6} Z`}
        fill="#ef4444"
        stroke="#fee2e2"
        strokeWidth={1}
      />
    );
  }

  return <circle cx={cx} cy={cy} r={4} fill="#14b8a6" stroke="#ccfbf1" strokeWidth={1} />;
}

function AnomalyDetectorComponent() {
  const { selectedZone, debouncedZone, zones } = useZone();
  const effectiveZone =
    debouncedZone === 'All Zones' ? zones.find((zone) => zone !== 'All Zones') ?? 'Whitefield' : debouncedZone;
  const [data, setData] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState('');
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getAnomalies(effectiveZone);
        if (!cancelled) {
          setData(result);
          setLastChecked(
            new Intl.DateTimeFormat('en-IN', {
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date()),
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          toast.error('Failed to load anomaly insights');
          setError(loadError instanceof Error ? loadError.message : 'Unable to load anomaly data');
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
  }, [effectiveZone, reloadIndex]);

  const sortedAnomalies = useMemo(
    () =>
      [...(data?.anomalies ?? [])]
        .filter((item) => item.is_anomaly)
        .sort((left, right) => severityOrder(right.severity) - severityOrder(left.severity)),
    [data],
  );

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadIndex((current) => current + 1)} />;
  }

  if (!loading && !data) {
    return <EmptyState zone={effectiveZone} message="No anomaly data is available right now." />;
  }

  return (
    <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
      <CardHeader>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
          IsolationForest anomaly detection
        </div>
        <CardTitle className="text-lg font-black text-white">Demand Anomaly Detector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`anomaly-pill-${index}`} height="76px" />)
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Anomalies detected
                </div>
                <div className="mt-2 text-3xl font-black text-white">{data?.total_anomalies ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  <Radar className="h-4 w-4 text-electric-blue" />
                  Risk level
                </div>
                <Badge className={`mt-3 ${riskTone(data?.risk_level ?? 'low')}`}>{data?.risk_level ?? 'low'}</Badge>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  <Clock3 className="h-4 w-4 text-cyber-green" />
                  Last checked
                </div>
                <div className="mt-2 text-xl font-bold text-white">{lastChecked || 'Just now'}</div>
              </div>
            </>
          )}
        </div>

        <div className="h-[220px] md:h-[320px]">
          {loading ? (
            <SkeletonCard height="320px" />
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={120}>
              <LineChart data={data?.anomalies ?? []}>
                <CartesianGrid stroke="#ffffff0b" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#081018', border: '1px solid #1e293b', borderRadius: '18px' }}
                  formatter={(value: number) => [`${Number(value).toFixed(2)} kW`, 'Demand']}
                  labelFormatter={(label, payload) => {
                    const point = payload?.[0]?.payload as AnomalyPoint | undefined;
                    return point?.is_anomaly ? `${label} • ${point.reason}` : String(label);
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="demand_kw"
                  stroke="#14b8a6"
                  strokeWidth={2.2}
                  dot={<CustomAnomalyDot />}
                  isAnimationActive={false}
                  activeDot={{ r: 5, fill: '#f8fafc' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <ScrollArea className="max-h-[520px] pr-2">
          <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`anomaly-card-${index}`} height="96px" />)
          ) : sortedAnomalies.length > 0 ? (
            sortedAnomalies.map((item) => (
              <div key={`${item.hour}-${item.reason}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.hour} • {item.demand_kw.toFixed(2)} kW
                    </div>
                    <div className="mt-1 text-sm text-slate-400">{item.reason}</div>
                  </div>
                  <Badge className={riskTone(item.severity === 'high' ? 'high' : item.severity === 'medium' ? 'medium' : 'low')}>
                    {item.severity}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
              No unusual charging patterns were detected in the last 24 hours for {effectiveZone}.
            </div>
          )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export const AnomalyDetector = memo(AnomalyDetectorComponent);
