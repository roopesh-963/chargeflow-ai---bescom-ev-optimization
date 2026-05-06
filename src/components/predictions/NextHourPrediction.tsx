import { memo, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Gauge, ShieldCheck, TimerReset } from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useZone } from '@/context/ZoneContext';
import {
  getNextHourPredictions,
  type NextHourPredictionPoint,
  type NextHourPredictionResponse,
} from '@/lib/api';

function PredictionConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
        <span>Confidence</span>
        <span>{confidence}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-electric-blue transition-[width]"
          style={{ width: `${Math.max(0, Math.min(confidence, 100))}%` }}
        />
      </div>
    </div>
  );
}

function NextHourPredictionComponent() {
  const { selectedZone, debouncedZone, zones } = useZone();
  const effectiveZone =
    debouncedZone === 'All Zones' ? zones.find((zone) => zone !== 'All Zones') ?? 'Whitefield' : debouncedZone;
  const [data, setData] = useState<NextHourPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getNextHourPredictions(effectiveZone, 6);
        if (!cancelled) {
          setData(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          toast.error('Failed to load next-hour predictions');
          setError(loadError instanceof Error ? loadError.message : 'Unable to load prediction data');
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

  const chartData = useMemo(
    () =>
      (data?.predictions ?? []).map((point) => ({
        ...point,
        confidencePercent: point.confidence,
        confidenceBand: Number((point.upper_bound - point.lower_bound).toFixed(2)),
      })),
    [data],
  );

  const hasHighDemandWarning = useMemo(
    () =>
      (data?.predictions ?? []).some(
        (point) => point.predicted_kw > (data?.grid_capacity_kw ?? 0) * 0.8,
      ),
    [data],
  );

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadIndex((current) => current + 1)} />;
  }

  if (!loading && !data) {
    return <EmptyState zone={effectiveZone} message="No prediction data is available right now." />;
  }

  return (
    <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
      <CardHeader>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
          GradientBoostingRegressor 6-hour predictions
        </div>
        <CardTitle className="text-lg font-black text-white">Next-Hour Demand Outlook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={`prediction-pill-${index}`} height="76px" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <Gauge className="h-4 w-4 text-electric-blue" />
                Grid capacity
              </div>
              <div className="mt-2 text-2xl font-black text-white">{data?.grid_capacity_kw.toFixed(0)} kW</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-cyber-green" />
                Window coverage
              </div>
              <div className="mt-2 text-2xl font-black text-white">{data?.predictions.length ?? 0} hours</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <TimerReset className="h-4 w-4 text-teal-300" />
                Confidence band
              </div>
              <div className="mt-2 text-2xl font-black text-white">+/-15%</div>
            </div>
          </div>
        )}

        {hasHighDemandWarning ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-red-300" />
              High demand warning
            </div>
            <div className="mt-1 text-red-100/85">
              At least one predicted hour crosses 80% of {effectiveZone}&apos;s grid capacity.
            </div>
          </div>
        ) : null}

        <div className="h-[220px] md:h-[320px]">
          {loading ? (
            <SkeletonCard height="320px" />
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={120}>
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#ffffff0b" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#081018', border: '1px solid #1e293b', borderRadius: '18px' }}
                  formatter={(value: number, name: string, item) => {
                    if (name === 'predicted_kw') return [`${Number(value).toFixed(2)} kW`, 'Predicted'];
                    if (name === 'confidenceBand') {
                      const point = item.payload as NextHourPredictionPoint & { lower_bound: number; upper_bound: number };
                      return [`${point.lower_bound.toFixed(2)} - ${point.upper_bound.toFixed(2)} kW`, 'Confidence interval'];
                    }
                    return [`${Number(value).toFixed(2)} kW`, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="lower_bound"
                  stackId="confidence"
                  stroke="transparent"
                  fill="transparent"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="confidenceBand"
                  stackId="confidence"
                  stroke="transparent"
                  fill="#14b8a6"
                  fillOpacity={0.15}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_kw"
                  stroke="#14b8a6"
                  strokeWidth={2.4}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 5, fill: '#f8fafc' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <ScrollArea className="max-h-[420px] pr-2">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={`prediction-card-${index}`} height="136px" />
              ))
            ) : (
              (data?.predictions ?? []).map((item) => (
                <div key={item.hour} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.hour}</div>
                  <div className="mt-2 text-xl font-black text-white md:text-2xl">{item.predicted_kw.toFixed(1)}</div>
                  <div className="text-sm text-slate-400">kW demand</div>
                  <Badge className="mt-3 bg-teal-400/10 text-teal-200">
                    {item.lower_bound.toFixed(0)} - {item.upper_bound.toFixed(0)} kW
                  </Badge>
                  <PredictionConfidenceBar confidence={item.confidence} />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export const NextHourPrediction = memo(NextHourPredictionComponent);
