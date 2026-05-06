import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getModelInfo, type ModelFeatureImportance, type ModelInfoResponse } from '@/lib/api';

function metricTone(value: number) {
  if (value > 0.85) return 'text-cyber-green';
  if (value > 0.7) return 'text-amber-300';
  return 'text-red-300';
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function ModelInfoCard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const payload = await getModelInfo();
        if (!cancelled) {
          setModelInfo(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load model metrics');
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
  }, []);

  const featureRows = useMemo<ModelFeatureImportance[]>(() => {
    if (!modelInfo) return [];
    return Object.entries(modelInfo.feature_importances)
      .map(([feature, importance]) => ({ feature, importance }))
      .sort((left, right) => right.importance - left.importance)
      .slice(0, 5);
  }, [modelInfo]);

  return (
    <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 md:p-6">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
              Model Details
            </div>
            <CardTitle className="text-lg font-black text-white">Model Performance</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="border border-electric-blue/20 bg-electric-blue/10 text-electric-blue">
              GradientBoostingRegressor · scikit-learn
            </Badge>
            <ChevronDown
              className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
            />
          </div>
        </CardHeader>
      </button>

      {open ? (
        <CardContent className="space-y-6 p-4 pt-0 md:p-6 md:pt-0">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading model metrics...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : modelInfo ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Test R²</div>
                  <div className={cn('mt-2 text-2xl font-black', metricTone(modelInfo.test_r2))}>
                    {formatPercent(modelInfo.test_r2)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Test RMSE</div>
                  <div className="mt-2 text-2xl font-black text-white">{modelInfo.test_rmse.toFixed(2)} kW</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">MAE</div>
                  <div className="mt-2 text-2xl font-black text-white">{modelInfo.mae.toFixed(2)} kW</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Training samples</div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {modelInfo.training_samples.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm font-semibold text-white">Top 5 Feature Importances</div>
                <div className="space-y-3">
                  {featureRows.map((item) => (
                    <div key={item.feature}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-300">{item.feature.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400">{(item.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-teal-400"
                          style={{ width: `${Math.max(6, item.importance * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
