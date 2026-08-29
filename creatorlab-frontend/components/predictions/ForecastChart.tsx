'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatCompact } from '@/lib/utils';
import type { GrowthForecast } from '@/lib/types';

export function ForecastChart({ growthForecast }: { growthForecast: GrowthForecast }) {
  const growthData = [
    ...(growthForecast?.historical || []).map((d) => ({
      week: `W${d.week}`,
      historicalViews: d.cum_views,
      forecastViews: null as number | null,
    })),
    ...(growthForecast?.forecast_points || []).map((d) => ({
      week: d.label,
      historicalViews: null as number | null,
      forecastViews: d.predicted_cum_views,
    })),
  ];

  if (growthForecast?.historical?.length > 0) {
    const lastHistIdx = growthForecast.historical.length - 1;
    if (growthData[lastHistIdx]) {
      growthData[lastHistIdx].forecastViews =
        growthForecast.historical[lastHistIdx].cum_views;
    }
  }

  const splitWeek = growthData.find((d) => d.forecastViews !== null && d.historicalViews === null)?.week;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-elevated border border-border p-2 text-[11px] shadow-sm rounded-[2px]">
          <p className="text-text-secondary mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCompact(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={growthData}
        margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="week"
          stroke="var(--color-text-tertiary)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-text-tertiary)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCompact(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="historicalViews"
          name="Historical"
          stroke="none"
          fill="var(--color-accent)"
          fillOpacity={0.1}
        />
        <Line
          type="monotone"
          dataKey="historicalViews"
          name="Historical"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="forecastViews"
          name="Forecast"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeDasharray="4 4"
          opacity={0.5}
          dot={false}
        />
        {splitWeek && (
          <ReferenceLine
            x={splitWeek}
            stroke="var(--color-text-tertiary)"
            strokeDasharray="3 3"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
