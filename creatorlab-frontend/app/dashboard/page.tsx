'use client';

import { useCreatorStore } from '@/lib/store';
import { formatNumber, formatCompact, calcEngagementRate } from '@/lib/utils';
import { PerformanceChart, SentimentOverview, TopVideosChart } from '@/components/dashboard/OverviewCharts';

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-[#9aa4d6]">{label}</span>
    </div>
  );
}

function InsightRow({ color, text, badge }: { color: string; text: string; badge: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#2a2a5a] last:border-0">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[13px] text-[#e6f7ff] flex-1">{text}</span>
      <span className="text-[10px] text-[#9aa4d6] uppercase tracking-wide border border-[#3d3d80] px-1.5 py-0.5 rounded-[3px] bg-[#1a1a2e] shrink-0">
        {badge}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { channel, videos, sentiment, predictions, isAnalyzing } = useCreatorStore();

  // Compute metrics
  const avgEngagement =
    videos.length > 0
      ? (videos.reduce((sum, v) => sum + calcEngagementRate(v), 0) / videos.length).toFixed(2) + '%'
      : '—';

  const avgViewsPerVideo =
    videos.length > 0
      ? formatCompact(Math.round(videos.reduce((s, v) => s + v.view_count, 0) / videos.length))
      : '—';

  const metrics = [
    { label: 'Total Views',     value: channel ? formatNumber(channel.view_count)       : '—' },
    { label: 'Subscribers',     value: channel ? formatNumber(channel.subscriber_count) : '—' },
    { label: 'Videos',          value: channel ? formatNumber(channel.video_count)      : '—' },
    { label: 'Avg Engagement',  value: avgEngagement },
    { label: 'Avg Views/Video', value: avgViewsPerVideo },
  ];

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Metric Strip ── */}
      <div
        className="grid border-b border-[#2a2a5a] divide-x divide-[#2a2a5a]"
        style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}
      >
        {metrics.map((m, i) =>
          isAnalyzing && !channel ? (
            <div key={i} className="px-5 py-4">
              <div className="w-16 h-2.5 bg-[#1a1a2e] rounded animate-pulse mb-2" />
              <div className="w-24 h-5 bg-[#0f0f24] rounded animate-pulse" />
            </div>
          ) : (
            <div key={i} className="px-5 py-4">
              <div className="text-[11px] text-[#6a6aa8] uppercase tracking-wider mb-1.5">
                {m.label}
              </div>
              <div className="text-[22px] font-semibold text-[#e6f7ff] tabular leading-none">
                {m.value}
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Channel info bar (when loaded) ── */}
      {channel && (
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2a2a5a]">
          {channel.thumbnail && (
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="w-8 h-8 rounded-full shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-medium text-[#e6f7ff] truncate block">{channel.title}</span>
            {channel.custom_url && (
              <span className="text-[11px] text-[#6a6aa8]">{channel.custom_url}</span>
            )}
          </div>
          {channel.country && (
            <span className="text-[11px] text-[#6a6aa8] shrink-0">{channel.country}</span>
          )}
        </div>
      )}

      {/* ── Performance Trend Chart (full width) ── */}
      <PerformanceChart videos={videos} />

      {/* ── Sentiment + Top Videos (two column) ── */}
      <div className="flex flex-col md:flex-row border-b border-[#2a2a5a]">
        <SentimentOverview sentiment={sentiment} />
        <TopVideosChart videos={videos} />
      </div>

      {/* ── Data Sources Status ── */}
      <div className="flex flex-wrap items-center gap-5 px-5 py-3 border-b border-[#2a2a5a]">
        <StatusDot color="#00ff9f" label="YouTube" />
        <StatusDot
          color={sentiment?.reddit_connected ? '#00ff9f' : '#6a6aa8'}
          label={`Reddit${sentiment?.reddit_connected ? '' : ' (not configured)'}`}
        />
        <StatusDot color="#00ff9f" label="Google Trends" />
        <StatusDot color="#00ff9f" label="News" />
        <StatusDot color="#6a6aa8" label="Instagram (coming soon)" />
      </div>

      {/* ── Intelligence Insights ── */}
      <div className="px-5 py-4">
        <h2 className="text-[12px] font-medium text-[#9aa4d6] mb-3">Intelligence Insights</h2>
        {predictions ? (
          <>
            <InsightRow
              color="#ff006e"
              text={`Viral score: ${predictions.viral_potential_score.label} — ${predictions.viral_potential_score.score}/100`}
              badge="Viral Score"
            />
            <InsightRow
              color="#00ff9f"
              text={`Best upload day: ${predictions.recommended_posting_time.best_day} at ${predictions.recommended_posting_time.best_hour_utc}:00 UTC`}
              badge="Optimization"
            />
            {predictions.topic_performance[0] && (
              <InsightRow
                color="#ffd700"
                text={`Top performing topic: "${predictions.topic_performance[0].topic}" — avg ${formatCompact(predictions.topic_performance[0].avg_views)} views`}
                badge="Content Strategy"
              />
            )}
            {predictions.duration_sweet_spot && (
              <InsightRow
                color="#ff006e"
                text={`${predictions.duration_sweet_spot.recommendation}`}
                badge="Duration"
              />
            )}
          </>
        ) : (
          <p className="text-[13px] text-[#6a6aa8]">
            → Analyze a channel then visit Predictions for AI-powered insights
          </p>
        )}
      </div>

    </div>
  );
}
