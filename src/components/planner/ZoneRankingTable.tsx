import { memo } from 'react';
import { ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { cn } from '@/lib/utils';
import type { ForecastZone, PlannerRecommendation } from '@/lib/api';


function explanationTone(source?: 'shap' | 'fallback') {
  return source === 'shap'
    ? 'border-teal-400/20 bg-teal-400/10 text-teal-200'
    : 'border-white/10 bg-white/[0.03] text-slate-300';
}

function ZoneRankingTableComponent({
  planner,
  forecast,
  selectedZone = 'All Zones',
  loading = false,
  skeletonRows = 3,
  scrollClassName,
}: {
  planner: PlannerRecommendation[];
  forecast: ForecastZone[];
  selectedZone?: string;
  loading?: boolean;
  skeletonRows?: number;
  scrollClassName?: string;
}) {
  const rows = planner.map((item) => {
    const zoneForecast = forecast.find((zone) => zone.zone === item.zone);
    const peak = zoneForecast?.hourly_forecast.reduce((best, current) =>
      current.predicted_demand > best.predicted_demand ? current : best,
    );

    return {
      zone: item.zone,
      predictedDemand: peak?.predicted_demand ?? 0,
      growth: item.demand_growth_score,
      capacityScore: Math.round(item.grid_capacity_score * 100),
      confidence: zoneForecast ? Math.round(zoneForecast.confidence * 100) : 89,
      risk: item.score > 95 ? 'Critical' : item.score > 90 ? 'High' : 'Watch',
      explanation:
        item.explanation ??
        `Prioritized due to ${(item.reasons[0] ?? 'balanced charger demand profile').toLowerCase()} and ${(
          item.reasons[item.reasons.length - 1] ?? item.reasons[0] ?? 'rollout readiness'
        ).toLowerCase()}`,
      explanationSource: item.explanation_source ?? 'fallback',
      reasons: item.reasons,
    };
  });

  return (
    <Card className="glass overflow-hidden border-white/8 bg-white/[0.03]">
      <CardHeader>
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-electric-blue/80">
            Demand and grid constraint view
          </div>
          <CardTitle className="text-lg font-black text-white">Priority Zone Ranking</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(scrollClassName)}>
          <div className="space-y-4">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, index) => (
                  <SkeletonCard key={`zone-skeleton-${index}`} height="150px" />
                ))
              : rows.map((zone) => (
                  <div
                    key={zone.zone}
                    className={cn(
                      'rounded-3xl border border-white/8 bg-black/20 p-4 transition-all',
                      selectedZone === zone.zone &&
                        'border-white/30 bg-electric-blue/10 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]',
                    )}
                  >
                    <div className="grid gap-3 md:gap-4 xl:grid-cols-[1.4fr_repeat(4,minmax(0,0.75fr))] xl:items-center">
                      <div>
                        <div className="font-semibold text-white">{zone.zone}</div>
                        <div className="text-xs text-slate-500">{zone.risk} risk profile</div>
                      </div>
                      <div className="text-sm text-white">{zone.predictedDemand.toFixed(2)} MWh</div>
                      <div className="flex items-center gap-2 text-sm text-cyber-green">
                        <ArrowUpRight className="h-4 w-4" />+{zone.growth}%
                      </div>
                      <div className="hidden text-sm text-slate-300 md:block">{zone.capacityScore}/100</div>
                      <div className="hidden md:block">
                        <Badge className="bg-electric-blue/10 text-electric-blue">{zone.confidence}%</Badge>
                      </div>
                    </div>

                    <div className={cn('mt-4 rounded-2xl border px-4 py-3', explanationTone(zone.explanationSource))}>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm leading-relaxed">{zone.explanation}</div>
                        {zone.explanationSource === 'shap' ? (
                          <Badge className="border-0 bg-teal-400/15 px-2 py-1 text-[10px] text-teal-200">
                            <Sparkles className="mr-1 h-3 w-3" />
                            AI explained
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <details className="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-200">
                        Why this zone?
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </summary>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {zone.reasons.map((reason) => (
                          <Badge key={reason} className="bg-white/5 text-slate-300">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export const ZoneRankingTable = memo(ZoneRankingTableComponent);
