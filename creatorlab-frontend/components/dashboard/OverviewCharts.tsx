'use client';

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { VideoData, SentimentData } from '@/lib/types';
import { formatCompact } from '@/lib/utils';

// ─── Performance Trend Chart ─────────────────────────────────────────────────

interface PerformanceChartProps {
  videos: VideoData[];
}

export function PerformanceChart({ videos }: PerformanceChartProps) {
  const chartData = [...videos]
    .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime())
    .slice(-30)
    .map((v) => ({
      date: new Date(v.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: v.view_count,
    }));

  return (
    <div className="border-b border-[#222228]">
      <div className="px-5 py-3 border-b border-[#222228]">
        <h2 className="text-[12px] font-medium text-[#888892]">Performance Trend</h2>
      </div>
      <div className="w-full h-[260px] pt-4 pr-4 pb-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#5b6cf9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5b6cf9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222228" />
              <XAxis
                dataKey="date"
                stroke="#50505a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#50505a' }}
              />
              <YAxis
                stroke="#50505a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#50505a' }}
                tickFormatter={(v) => formatCompact(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111114',
                  borderColor: '#222228',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#ededf0',
                }}
                itemStyle={{ color: '#5b6cf9' }}
                cursor={{ stroke: '#2d2d35', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#5b6cf9"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#perfGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[12px] text-[#50505a]">
            Analyze a channel to view performance trend
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sentiment Bars ───────────────────────────────────────────────────────────

interface SentimentOverviewProps {
  sentiment: SentimentData | null;
}

export function SentimentOverview({ sentiment }: SentimentOverviewProps) {
  const combined = sentiment?.combined_sentiment;

  const bars = [
    { label: 'Positive', pct: combined ? Math.round(combined.positive_pct * 100) : 0, color: '#3fb950' },
    { label: 'Neutral',  pct: combined ? Math.round(combined.neutral_pct * 100)  : 0, color: '#888892' },
    { label: 'Negative', pct: combined ? Math.round(combined.negative_pct * 100) : 0, color: '#f85149' },
  ];

  return (
    <div className="w-full md:w-[40%] md:border-r border-[#222228] flex flex-col border-t md:border-t-0 border-[#222228]">
      <div className="px-5 py-3 border-b border-[#222228]">
        <h2 className="text-[12px] font-medium text-[#888892]">Audience Sentiment</h2>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4 flex-1 justify-center">
        {sentiment ? (
          bars.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-16 text-[12px] text-[#ededf0]">{b.label}</span>
              <div className="flex-1 h-1.5 bg-[#16161a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                />
              </div>
              <span className="w-8 text-right text-[12px] text-[#888892] tabular">{b.pct}%</span>
            </div>
          ))
        ) : (
          <p className="text-[12px] text-[#50505a] text-center">
            Run sentiment analysis to view
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Top Videos Bar Chart ─────────────────────────────────────────────────────

interface TopVideosChartProps {
  videos: VideoData[];
}

export function TopVideosChart({ videos }: TopVideosChartProps) {
  const topVideos = [...videos]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 6)
    .map((v) => ({
      title: v.title.length > 36 ? v.title.slice(0, 36) + '…' : v.title,
      views: v.view_count,
    }));

  return (
    <div className="w-full md:w-[60%] flex flex-col border-t md:border-t-0 border-[#222228]">
      <div className="px-5 py-3 border-b border-[#222228]">
        <h2 className="text-[12px] font-medium text-[#888892]">Top Videos by Views</h2>
      </div>
      <div className="p-4 h-[200px]">
        {topVideos.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topVideos} layout="vertical" margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="title"
                stroke="#888892"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={150}
                tick={{ fill: '#888892' }}
              />
              <Tooltip
                cursor={{ fill: '#16161a' }}
                contentStyle={{
                  backgroundColor: '#111114',
                  borderColor: '#222228',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#ededf0',
                }}
                formatter={(v: unknown) => [formatCompact(v as number), 'Views']}

              />
              <Bar dataKey="views" fill="#5b6cf9" radius={[0, 2, 2, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[12px] text-[#50505a]">
            No video data available
          </div>
        )}
      </div>
    </div>
  );
}
