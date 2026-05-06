import { memo, useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { getAdoptionForecast, getAdoptionSummary, type AdoptionProjection } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useZone } from '@/context/ZoneContext';


type Scenario = 'conservative' | 'moderate' | 'aggressive';

const scenarioLabels: Record<Scenario, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
};

const scenarioColors: Record<Scenario, string> = {
  conservative: '#1D9E75',
  moderate: '#0070FF',
  aggressive: '#E24B4A',
};

function AdoptionForecasterComponent() {
  const { selectedZone, debouncedZone } = useZone();
  const [summary, setSummary] = useState<AdoptionProjection[]>([]);
  const [localZone, setLocalZone] = useState('Whitefield');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('moderate');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);
  const [projections, setProjections] = useState<Record<Scenario, AdoptionProjection[]>>({
    conservative: [],
    moderate: [],
    aggressive: [],
  });
  const effectiveZone = debouncedZone === 'All Zones' ? localZone : debouncedZone;

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const response = await getAdoptionSummary();
        if (!cancelled) {
          setSummary(response);
          if (response.length > 0 && !response.some((item) => item.zone === localZone)) {
            setLocalZone(response[0].zone);
          }
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load adoption summary');
          setError('Unable to load adoption summary.');
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [reloadIndex]);

  useEffect(() => {
    let cancelled = false;

    async function loadZoneProjections() {
      setLoading(true);
      setError(null);
      try {
        const [conservative, moderate, aggressive] = await Promise.all([
          getAdoptionForecast(effectiveZone, 'conservative'),
          getAdoptionForecast(effectiveZone, 'moderate'),
          getAdoptionForecast(effectiveZone, 'aggressive'),
        ]);

        if (!cancelled) {
          setProjections({ conservative, moderate, aggressive });
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load adoption forecast');
          setError(`Unable to load adoption forecast for ${effectiveZone}.`);
          setProjections({
            conservative: [],
            moderate: [],
            aggressive: [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadZoneProjections();

    return () => {
      cancelled = true;
    };
  }, [effectiveZone, reloadIndex]);

  const zoneOptions = useMemo(() => {
    const uniqueZones = new Set(summary.map((item) => item.zone));
    return Array.from(uniqueZones).sort();
  }, [summary]);

  const chartData = useMemo(() => {
    const base = projections.conservative;
    return base.map((point, index) => ({
      month_label: point.month_label,
      conservative: projections.conservative[index]?.ev_count ?? 0,
      moderate: projections.moderate[index]?.ev_count ?? 0,
      aggressive: projections.aggressive[index]?.ev_count ?? 0,
    }));
  }, [projections]);

  const selectedProjection = projections[selectedScenario][11] ?? null;
  const chargerGapAlert =
    selectedProjection &&
    selectedProjection.required_chargers > selectedProjection.current_chargers * 1.5;
  const hasProjectionData = chartData.length > 0 && Boolean(selectedProjection);

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadIndex((current) => current + 1)} />;
  }

  if (!loading && summary.length === 0) {
    return <EmptyState zone={selectedZone} message="No adoption summary is available for this selection." />;
  }

  if (!loading && !hasProjectionData) {
    return <EmptyState zone={effectiveZone} message="No adoption forecast is available for this zone right now." />;
  }

  return (
    <div className="space-y-6">
      <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
                12-month EV growth planning
              </div>
              <CardTitle className="text-lg font-black text-white">Zone-Level Adoption Forecaster</CardTitle>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={effectiveZone}
                onChange={(event) => setLocalZone(event.target.value)}
                disabled={selectedZone !== 'All Zones'}
                className="min-h-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                {(zoneOptions.length > 0 ? zoneOptions : ['Whitefield']).map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
                {(Object.keys(scenarioLabels) as Scenario[]).map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    onClick={() => setSelectedScenario(scenario)}
                    className={cn(
                      'min-h-10 w-full rounded-full border px-4 py-2 text-sm font-medium transition md:w-auto',
                      selectedScenario === scenario
                        ? 'border-electric-blue/30 bg-electric-blue/15 text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white',
                    )}
                  >
                    {scenarioLabels[scenario]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonCard height="380px" />
          ) : (
            <div className="space-y-6">
              {chargerGapAlert ? (
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
                  <div className="font-semibold">Charger Gap Alert</div>
                  <div className="mt-1">
                    {effectiveZone} will need {selectedProjection.required_chargers} chargers under the {scenarioLabels[selectedScenario].toLowerCase()} scenario, which is more than 1.5x the current charger base.
                  </div>
                </div>
              ) : null}

              <div className="h-[260px] md:h-[360px]">
                <ResponsiveContainer width="100%" height="100%" debounce={120}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="month_label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#081018', border: '1px solid #1e293b', borderRadius: '18px' }}
                      formatter={(value: number, name: string) => [Number(value).toLocaleString(), scenarioLabels[name as Scenario] ?? name]}
                    />
                    {(Object.keys(scenarioLabels) as Scenario[]).map((scenario) => (
                      <Line
                        key={scenario}
                        type="monotone"
                        dataKey={scenario}
                        stroke={scenarioColors[scenario]}
                        strokeWidth={selectedScenario === scenario ? 3.5 : 2.5}
                        isAnimationActive={false}
                        dot={(props) =>
                          props.index === chartData.length - 1 ? (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={5}
                              fill={scenarioColors[scenario]}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ) : undefined
                        }
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading || !selectedProjection ? (
          Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={`adoption-kpi-${index}`} height="144px" />)
        ) : (
          [
            { label: 'Projected EVs', value: selectedProjection.ev_count.toLocaleString(), tone: 'text-white' },
            { label: 'Chargers Needed', value: selectedProjection.required_chargers.toLocaleString(), tone: 'text-electric-blue' },
            { label: 'Peak Demand (kW)', value: selectedProjection.demand_kw.toLocaleString(), tone: 'text-cyber-green' },
            {
              label: 'Grid Stress (%)',
              value: selectedProjection.grid_stress_pct.toFixed(1),
              tone: selectedProjection.grid_stress_pct > 85 ? 'text-red-400' : 'text-white',
              border: selectedProjection.grid_stress_pct > 85 ? 'border-red-500/20 bg-red-500/10' : 'border-white/10 bg-white/[0.03]',
            },
          ].map((card) => (
            <Card
              key={card.label}
              className={cn('glass overflow-hidden border bg-white/[0.03]', card.border ?? 'border-white/10')}
            >
              <CardContent className="p-4 md:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{card.label}</div>
                  <Badge className="bg-white/5 text-slate-300">{scenarioLabels[selectedScenario]}</Badge>
                </div>
                <div className={cn('text-xl font-black md:text-3xl', card.tone)}>{card.value}</div>
                <div className="mt-2 text-sm text-slate-400">Month 12 outcome for {effectiveZone}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export const AdoptionForecaster = memo(AdoptionForecasterComponent);
