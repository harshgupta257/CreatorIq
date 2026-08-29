'use client';

import React, { useEffect } from 'react';
import { useCreatorStore } from '@/lib/store';
import { fetchPredictions } from '@/lib/api';
import { formatNumber, cn } from '@/lib/utils';
import { ForecastChart } from '@/components/predictions/ForecastChart';
import { TopicBar } from '@/components/predictions/TopicBar';
import { HeatmapGrid } from '@/components/predictions/HeatmapGrid';
import { VideoTable } from '@/components/predictions/VideoTable';

export default function PredictionsPage() {
  const { channelId, predictions, setPredictions } = useCreatorStore();

  useEffect(() => {
    if (channelId && !predictions) {
      fetchPredictions(channelId).then((r) => {
        if (r.success) setPredictions(r.data);
      });
    }
  }, [channelId, predictions, setPredictions]);

  if (!channelId) {
    return (
      <div className="p-5 text-[13px] text-text-secondary">
        Please search for a channel first.
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="p-5 flex flex-col space-y-4 animate-pulse">
        <div className="h-10 bg-bg-hover rounded-[4px]" />
        <div className="h-24 bg-bg-hover rounded-[4px]" />
        <div className="h-64 bg-bg-hover rounded-[4px]" />
      </div>
    );
  }

  const p = predictions;
  const isHeuristic = p.training_result.status === 'heuristic';

  return (
    <div className="w-full flex flex-col text-[13px] text-text-primary">
      {/* Section 1: Model Status Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
        <div className="flex items-center space-x-2">
          {isHeuristic ? (
            <>
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-[11px] text-warning">
                Limited data mode — add more videos for better predictions
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-positive" />
              <span className="text-[11px] text-text-tertiary">
                Model trained on {p.video_count || 0} videos
              </span>
            </>
          )}
        </div>
        <div className="text-[11px] text-text-secondary font-mono">
          {p.training_result.r2_score
            ? `Model accuracy: ${(p.training_result.r2_score * 100).toFixed(1)}%`
            : 'Accuracy: N/A'}
        </div>
      </div>

      {p.limited_data && (
        <div className="px-5 py-2 border-b border-warning/30 bg-warning/10 text-warning text-[11px]">
          Forecasts may be less accurate due to limited historical data.
        </div>
      )}

      {/* Section 2: Forecast Summary */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="px-5 py-4 flex flex-col">
          <span className="text-[11px] uppercase text-text-tertiary tracking-wider mb-1">
            Projected Weekly Views
          </span>
          <span className="text-[22px] tabular-nums font-medium text-text-primary">
            {formatNumber(p.growth_forecast?.slope_views_week || 0)}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1">
            Expected trajectory
          </span>
        </div>
        <div className="px-5 py-4 flex flex-col">
          <span className="text-[11px] uppercase text-text-tertiary tracking-wider mb-1">
            Viral Potential
          </span>
          <span className="text-[22px] tabular-nums font-medium text-text-primary">
            {p.viral_potential_score?.score || 0}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1">
            {p.viral_potential_score?.label || 'Unknown'}
          </span>
        </div>
        <div className="px-5 py-4 flex flex-col">
          <span className="text-[11px] uppercase text-text-tertiary tracking-wider mb-1">
            Best Upload Day
          </span>
          <span className="text-[22px] tabular-nums font-medium text-text-primary">
            {p.recommended_posting_time?.best_day || '—'}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1">
            Based on engagement
          </span>
        </div>
        <div className="px-5 py-4 flex flex-col">
          <span className="text-[11px] uppercase text-text-tertiary tracking-wider mb-1">
            Optimal Duration
          </span>
          <span className="text-[22px] tabular-nums font-medium text-text-primary">
            {p.duration_sweet_spot?.best_range || '—'}
          </span>
          <span className="text-[11px] text-text-tertiary mt-1">
            {p.duration_sweet_spot?.recommendation || '—'}
          </span>
        </div>
      </div>

      {/* Section 3: Growth Forecast Chart */}
      <div className="flex flex-col border-b border-border">
        <div className="px-5 py-3 border-b border-border flex items-center space-x-2">
          <span className="text-[12px] text-text-secondary">
            Growth Trajectory —{' '}
          </span>
          <span className="text-[12px] text-warning italic">
            Estimated Projection
          </span>
        </div>
        <div className="w-full h-[240px] px-5 py-4">
          <ForecastChart growthForecast={p.growth_forecast} />
        </div>
      </div>

      {/* Section 4: Two-column section */}
      <div className="flex w-full border-b border-border">
        {/* Left: Title Intelligence */}
        <div className="w-[48%] border-r border-border flex flex-col">
          <div className="px-5 py-3 border-b border-border text-[12px] text-text-secondary">
            Title Intelligence
          </div>
          <div className="flex justify-between px-5 py-2.5 border-b border-border">
            <span className="text-[12px] text-text-primary">Numbers in title</span>
            <span
              className={cn(
                'text-[12px]',
                p.title_pattern_insights?.numbers_boost_pct > 0
                  ? 'text-positive'
                  : 'text-negative'
              )}
            >
              {p.title_pattern_insights?.numbers_boost_pct > 0 ? '+' : ''}
              {p.title_pattern_insights?.numbers_boost_pct || 0}% views
            </span>
          </div>
          <div className="flex justify-between px-5 py-2.5 border-b border-border">
            <span className="text-[12px] text-text-primary">Question mark titles</span>
            <span
              className={cn(
                'text-[12px]',
                p.title_pattern_insights?.questions_boost_pct > 0
                  ? 'text-positive'
                  : 'text-negative'
              )}
            >
              {p.title_pattern_insights?.questions_boost_pct > 0 ? '+' : ''}
              {p.title_pattern_insights?.questions_boost_pct || 0}% views
            </span>
          </div>
          <div className="flex justify-between px-5 py-2.5 border-b border-border">
            <span className="text-[12px] text-text-primary">Colon separator</span>
            <span
              className={cn(
                'text-[12px]',
                p.title_pattern_insights?.has_colon_boost_pct > 0
                  ? 'text-positive'
                  : 'text-negative'
              )}
            >
              {p.title_pattern_insights?.has_colon_boost_pct > 0 ? '+' : ''}
              {p.title_pattern_insights?.has_colon_boost_pct || 0}% views
            </span>
          </div>
          <div className="flex justify-between px-5 py-2.5 border-b border-border">
            <span className="text-[12px] text-text-primary">Best title length</span>
            <span className="text-[12px] text-text-primary tabular-nums">
              {p.title_pattern_insights?.best_length_bucket || '—'}
            </span>
          </div>

          <div className="px-5 py-3 border-b border-border">
            <div className="text-[11px] text-text-tertiary mb-2 uppercase tracking-wide">
              Power Words
            </div>
            <div className="flex flex-wrap gap-2">
              {(p.title_pattern_insights?.top_title_words || [])
                .slice(0, 5)
                .map((w, i) => (
                  <span
                    key={i}
                    className="bg-bg-hover text-text-primary px-2 py-0.5 rounded-[3px] text-[11px]"
                  >
                    {w.word}
                  </span>
                ))}
            </div>
          </div>

          <div className="px-5 py-3 text-[12px] text-text-secondary truncate">
            Best title: {p.title_pattern_insights?.best_example?.title || '—'}
          </div>
        </div>

        {/* Right: Topic Performance */}
        <div className="w-[52%] flex flex-col">
          <div className="px-5 py-3 border-b border-border text-[12px] text-text-secondary">
            Topic Performance
          </div>
          <div className="px-5 py-4 flex-1 h-[220px]">
            <TopicBar topicPerformance={p.topic_performance} />
          </div>
        </div>
      </div>

      {/* Section 5: Upload Time Optimizer */}
      <div className="flex flex-col border-b border-border">
        <div className="px-5 py-3 border-b border-border text-[12px] text-text-secondary">
          Optimal Upload Windows
        </div>
        <div className="px-5 py-4">
          <HeatmapGrid recommendedPostingTime={p.recommended_posting_time} />
        </div>
      </div>

      {/* Section 6: Video Predictions Table */}
      <div className="flex flex-col border-b border-border">
        <div className="px-5 py-3 border-b border-border text-[12px] text-text-secondary">
          Video Performance Predictions
        </div>
        <VideoTable videoPredictions={p.video_predictions} />
      </div>

      {/* Section 7: Content Recommendations */}
      <div className="flex flex-col">
        <div className="px-5 py-3 border-b border-border text-[12px] text-text-secondary">
          Content Recommendations
        </div>
        {(p.recommended_topics || []).map((rt, i) => (
          <div
            key={i}
            className="flex justify-between items-center px-5 py-2.5 border-b border-border last:border-b-0 hover:bg-bg-hover transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-[2px] text-[9px] uppercase tracking-wider font-medium',
                  rt.type === 'proven'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-warning/10 text-warning'
                )}
              >
                {rt.type}
              </span>
              <span className="text-[13px] text-text-primary">{rt.topic}</span>
            </div>
            <span className="text-[12px] text-text-tertiary italic max-w-[400px] truncate text-right">
              {rt.reason}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
