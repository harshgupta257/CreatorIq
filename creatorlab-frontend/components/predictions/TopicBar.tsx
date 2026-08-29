'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCompact } from '@/lib/utils';
import type { TopicPerformanceItem } from '@/lib/types';

export function TopicBar({ topicPerformance }: { topicPerformance: TopicPerformanceItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={topicPerformance || []}
        layout="vertical"
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
          stroke="var(--color-border)"
        />
        <XAxis type="number" hide />
        <YAxis
          dataKey="topic"
          type="category"
          width={100}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-bg-hover)' }}
          contentStyle={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            fontSize: '11px',
            color: 'var(--color-text-primary)',
            borderRadius: '2px',
          }}
          formatter={(val: unknown) => formatCompact(val as number)}

        />
        <Bar
          dataKey="avg_views"
          fill="var(--color-accent)"
          barSize={12}
          radius={[0, 2, 2, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
