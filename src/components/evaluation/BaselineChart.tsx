import { memo } from 'react';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ScheduleResponse } from '@/lib/api';


type BaselineChartProps = Pick<
  ScheduleResponse,
  'peak_reduction_pct' | 'off_peak_shift_pct' | 'unmanaged_load' | 'optimized_load' | 'grid_safe_threshold'
>;

function formatHourLabel(hour: number) {
  const normalizedHour = hour % 24;
  const suffix = normalizedHour >= 12 ? 'PM' : 'AM';
  const displayHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  return `${displayHour} ${suffix}`;
}

function BaselineChartComponent({
  peak_reduction_pct,
  off_peak_shift_pct,
  unmanaged_load,
  optimized_load,
  grid_safe_threshold,
}: BaselineChartProps) {
  const chartData = unmanaged_load.map((unmanaged, hour) => {
    const optimized = optimized_load[hour] ?? 0;
    return {
      hour,
      unmanaged_load: unmanaged,
      optimized_load: optimized,
      reduction_band: Math.max(unmanaged - optimized, 0),
      grid_safe_threshold,
    };
  });

  const hoursAboveGridLimit = unmanaged_load.filter((load) => load > grid_safe_threshold).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-cyber-green/20 bg-cyber-green/10 px-4 py-3 text-sm font-medium text-cyber-green">
          Peak reduction: {peak_reduction_pct}%
        </div>
        <div className="rounded-2xl border border-electric-blue/20 bg-electric-blue/10 px-4 py-3 text-sm font-medium text-electric-blue">
          Load shifted to off-peak: {off_peak_shift_pct}%
        </div>
        <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm font-medium text-orange-300">
          Hours above grid limit (unmanaged): {hoursAboveGridLimit}
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%" debounce={120}>
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#ffffff0b" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHourLabel}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={2}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'MW', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip
              labelFormatter={(value) => formatHourLabel(Number(value))}
              formatter={(value: number, name: string) => {
                if (name === 'Unmanaged charging') return [`${value.toFixed(2)} MW`, name];
                if (name === 'Smart scheduled') return [`${value.toFixed(2)} MW`, name];
                return [`${value.toFixed(2)} MW`, 'Grid limit'];
              }}
              contentStyle={{ backgroundColor: '#081018', border: '1px solid #1e293b', borderRadius: '18px' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '18px' }} />
            <Area
              type="monotone"
              dataKey="optimized_load"
              stackId="load-gap"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
              activeDot={false}
            />
            <Area
              type="monotone"
              dataKey="reduction_band"
              stackId="load-gap"
              stroke="none"
              fill="#E24B4A"
              fillOpacity={0.1}
              isAnimationActive
              legendType="none"
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="unmanaged_load"
              stroke="#E24B4A"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              name="Unmanaged charging"
            />
            <Line
              type="monotone"
              dataKey="optimized_load"
              stroke="#1D9E75"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              name="Smart scheduled"
            />
            <Line
              type="monotone"
              dataKey="grid_safe_threshold"
              stroke="#EF9F27"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              isAnimationActive
              name="Grid limit"
            />
            <ReferenceLine
              y={grid_safe_threshold}
              stroke="#EF9F27"
              strokeDasharray="6 3"
              label={{ value: 'Grid limit', fill: '#EF9F27', position: 'insideTopRight' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const BaselineChart = memo(BaselineChartComponent);
