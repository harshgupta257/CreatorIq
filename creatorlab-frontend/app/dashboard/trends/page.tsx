'use client';

import React from 'react';
import { useCreatorStore } from '@/lib/store';
import { fetchTrends } from '@/lib/api';
import { useChannelData } from '@/lib/useChannelData';
import { formatCompact } from '@/lib/utils';
import { ErrorState } from '@/components/ui/ErrorState';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight } from 'lucide-react';
import type { ContentGap, TrendVideo, TrendsData } from '@/lib/types';

// Dashboard date range → Google Trends "date" parameter (for the outbound link)
const GT_DATE: Record<string, string> = {
  '7D': 'now 7-d', '30D': 'today 1-m', '90D': 'today 3-m', '1Y': 'today 12-m',
};

const COLORS = ['#ff006e', '#00ffff', '#0080ff', '#ffd700', '#5d34d0'];

/** ISO country code → flag emoji (regional indicator symbols) */
function flag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return '';
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function localTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-5 py-3 border-b border-[#2a2a5a] flex items-baseline justify-between gap-3">
      <span className="text-[12px] text-[#9aa4d6]">{title}</span>
      {note && <span className="text-[11px] text-[#6a6aa8] text-right">{note}</span>}
    </div>
  );
}

function Notice({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'warn' }) {
  return (
    <div className={`px-5 py-3 text-[12px] ${tone === 'warn' ? 'text-[#ffd700]' : 'text-[#6a6aa8]'}`}>
      {children}
    </div>
  );
}

function VideoRow({ v }: { v: TrendVideo }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${v.video_id}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-5 py-2 border-b border-[#2a2a5a] last:border-b-0 hover:bg-[#1a1a2e] transition-colors"
    >
      {v.thumbnail ? (
        <img src={v.thumbnail} alt="" className="w-[64px] h-[36px] object-cover rounded-[3px] shrink-0 bg-[#1f1f3d]" />
      ) : (
        <div className="w-[64px] h-[36px] rounded-[3px] shrink-0 bg-[#1f1f3d]" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-[#e6f7ff] truncate">{v.title}</div>
        <div className="text-[11px] text-[#6a6aa8] truncate">
          {v.channel_title} · {formatCompact(v.view_count)} views · {timeAgo(v.published_at)}
        </div>
      </div>
    </a>
  );
}

function GapRow({ gap }: { gap: ContentGap }) {
  const niche = gap.source === 'youtube_niche';
  const growth = typeof gap.growth === 'number'
    ? (gap.growth >= 5000 ? 'Breakout search' : `+${gap.growth}% searches`)
    : 'Rising search';
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-[#2a2a5a] last:border-b-0">
      <span
        className={`mt-0.5 shrink-0 text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] border ${
          niche ? 'text-[#00ffff] border-[#00ffff]/40' : 'text-[#ff006e] border-[#ff006e]/40'
        }`}
      >
        {niche ? 'Hot in niche' : 'Rising'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-[#e6f7ff]">{gap.topic}</div>
        <div className="text-[11px] text-[#6a6aa8] truncate">
          {niche
            ? `${gap.video_count} recent hit videos · ${formatCompact(gap.total_views ?? 0)} views${
                gap.example ? ` · e.g. “${gap.example.title}” by ${gap.example.channel_title}` : ''
              }`
            : `${growth} on YouTube`}
        </div>
      </div>
    </div>
  );
}

function nicheStatusText(t: TrendsData['niche']): string | null {
  switch (t.status) {
    case 'quota_cap':
      return `Today's limit for niche searches has been reached. It resets at ${localTime(t.resets_at)}.`;
    case 'quota_exceeded':
      return `The YouTube API quota is used up for today. It resets at ${localTime(t.resets_at)}.`;
    case 'error':
      return 'Some niche searches failed. Showing what was found.';
    default:
      return null;
  }
}

function googleStatusText(status: TrendsData['google_trends_status']): string {
  switch (status) {
    case 'rate_limited': return 'Google Trends is rate limiting requests right now. Try again later.';
    case 'unavailable':  return 'Google Trends is unavailable right now.';
    case 'no_data':      return 'Not enough YouTube search volume for these topics.';
    default:             return '';
  }
}

export default function TrendsPage() {
  const { channel, channelId, trends, setTrends, dateRange } = useCreatorStore();
  // Trends are fetched per date range; a different range triggers a new fetch
  const current = trends && trends.range === dateRange ? trends : null;
  const { error, retry } = useChannelData(
    current,
    (id) => fetchTrends(channel?.title ?? '', id, dateRange),
    setTrends,
  );

  if (!current && error) return <ErrorState message={error} onRetry={retry} />;

  if (!current) {
    return (
      <div className="flex h-[400px] items-center justify-center text-[13px] text-[#9aa4d6]">
        {channelId ? 'Gathering trends intelligence...' : 'Enter a channel to monitor trends'}
      </div>
    );
  }

  const t = current;
  const topics = t.topic_keywords ?? [];
  const gtOk = t.google_trends_status === 'ok';
  const chartKeys = t.keywords_in_data ?? [];
  const geo = t.geographic_interest ?? [];
  const maxGeo = geo.length ? Math.max(...geo.map((g) => g.value)) : 100;
  const nicheNote = nicheStatusText(t.niche);
  const trending = t.youtube_trending;

  const tickFormat = (val: string) => {
    const d = new Date(val);
    return dateRange === '1Y'
      ? d.toLocaleString('default', { month: 'short', year: 'numeric' })
      : d.toLocaleString('default', { month: 'short', day: 'numeric' });
  };

  const gtLink = `https://trends.google.com/trends/explore?gprop=youtube&date=${encodeURIComponent(
    GT_DATE[dateRange] ?? 'today 3-m'
  )}&q=${encodeURIComponent(topics.join(','))}`;

  return (
    <div className="flex flex-col">
      {/* Status bar: the channel's topics + Google Trends state */}
      <div className="border-b border-[#2a2a5a] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#6a6aa8] uppercase tracking-wider mr-1">Your topics</span>
          {topics.map((kw, i) => (
            <span key={kw} className="bg-[#1a1a2e] border border-[#2a2a5a] rounded-[3px] px-2 py-0.5 text-[11px]" style={{ color: COLORS[i % COLORS.length] }}>
              {kw}
            </span>
          ))}
          {topics.length === 0 && <span className="text-[11px] text-[#6a6aa8]">No topics found in this channel&apos;s tags</span>}
        </div>
        <a href={gtLink} target="_blank" rel="noreferrer" className="text-[#ff006e] text-[11px] flex items-center gap-1 hover:underline">
          Open in Google Trends <ArrowRight size={10} />
        </a>
      </div>

      {/* 1. Content opportunities */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle title="Content Opportunities" note="Hot topics in your niche that you haven't covered yet" />
        {t.content_gaps.map((g) => <GapRow key={`${g.source}-${g.topic}`} gap={g} />)}
        {t.content_gaps.length === 0 && (
          <Notice>
            {t.niche.topics.length > 0 || gtOk
              ? 'No gaps found. You already cover the topics that are hot in your niche right now.'
              : 'Not enough niche data to find gaps right now.'}
          </Notice>
        )}
      </div>

      {/* 2. Hot in your niche */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle title="Hot in Your Niche" note={`Most-viewed videos from other channels, last ${t.niche.window_days} days`} />
        {nicheNote && <Notice tone="warn">{nicheNote}</Notice>}
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-[#2a2a5a]">
          {t.niche.topics.map((topic) => (
            <div key={topic.topic} className="border-b lg:border-b-0 border-[#2a2a5a]">
              <div className="px-5 py-2 bg-[#0f0f24] text-[11px] text-[#e6f7ff] border-b border-[#2a2a5a] truncate">{topic.topic}</div>
              {topic.videos.map((v) => <VideoRow key={v.video_id} v={v} />)}
              {topic.videos.length === 0 && <Notice>No recent videos found</Notice>}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Trending on YouTube */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle
          title={`Trending on YouTube · ${trending.category_name || 'All categories'}`}
          note={`${flag(trending.region)} ${trending.region}`}
        />
        {trending.status !== 'ok' && trending.videos.length === 0 && (
          <Notice tone="warn">
            {trending.status === 'quota_exceeded'
              ? 'The YouTube API quota is used up for today.'
              : 'Trending videos are unavailable right now.'}
          </Notice>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#2a2a5a]">
          {[trending.videos.slice(0, 5), trending.videos.slice(5, 10)].map((col, i) => (
            <div key={i}>{col.map((v) => <VideoRow key={v.video_id} v={v} />)}</div>
          ))}
        </div>
      </div>

      {/* 4. YouTube search interest (Google Trends) */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle
          title="YouTube Search Interest"
          note={gtOk ? `Google Trends · relative interest (0-100)${t.google_trends_cached ? ' · cached' : ''}` : undefined}
        />
        <div className="h-[220px] w-full pt-4 pr-5">
          {gtOk && t.interest_over_time.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={t.interest_over_time}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9aa4d6' }} dy={10} tickFormatter={tickFormat} minTickGap={24} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f0f24', borderColor: '#2a2a5a', fontSize: '12px', color: '#e6f7ff', borderRadius: '4px' }}
                  labelStyle={{ color: '#9aa4d6', marginBottom: '4px' }}
                  labelFormatter={(val) => new Date(String(val)).toLocaleString()}
                />
                {chartKeys.map((kw) => {
                  const color = COLORS[Math.max(0, topics.indexOf(kw)) % COLORS.length];
                  return <Line key={kw} type="monotone" dataKey={kw} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
              <p className={`text-[12px] ${t.google_trends_status === 'rate_limited' ? 'text-[#ffd700]' : 'text-[#6a6aa8]'}`}>
                {gtOk ? 'No search interest over time for these topics.' : googleStatusText(t.google_trends_status)}
              </p>
              {t.word_frequency.length > 0 && (
                <>
                  <p className="text-[11px] text-[#6a6aa8]">Most used words in your video tags:</p>
                  <div className="flex items-center justify-center flex-wrap gap-2">
                    {t.word_frequency.slice(0, 15).map((w) => (
                      <span key={w.word} className="px-2 py-0.5 rounded-[3px] border border-[#2a2a5a] bg-[#0f0f24] text-[#9aa4d6] text-[12px]">
                        {w.word} ({w.count})
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Related searches + countries */}
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 md:border-r border-[#2a2a5a]">
          <SectionTitle title="Related YouTube Searches" />
          {(['rising', 'top'] as const).map((kind) => {
            const rows = t.related_queries?.[kind] ?? [];
            return (
              <div key={kind}>
                <div className="px-5 py-2 bg-[#0f0f24] text-[11px] text-[#6a6aa8] uppercase tracking-wider border-b border-[#2a2a5a]">
                  {kind}
                </div>
                {rows.slice(0, 6).map((q) => (
                  <div key={`${kind}-${q.query}`} className="flex justify-between items-center gap-3 px-5 py-2 border-b border-[#2a2a5a] hover:bg-[#1a1a2e]">
                    <span className="text-[12px] text-[#e6f7ff] truncate">{q.query}</span>
                    <span className={`text-[11px] shrink-0 ${kind === 'rising' ? 'text-[#00ff9f]' : 'text-[#9aa4d6]'}`}>
                      {kind === 'rising'
                        ? (Number(q.value) >= 5000 ? 'Breakout' : `+${q.value}%`)
                        : q.value}
                    </span>
                  </div>
                ))}
                {rows.length === 0 && (
                  <Notice>{gtOk ? `No ${kind} searches found` : 'Needs Google Trends data'}</Notice>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full md:w-1/2">
          <SectionTitle title="Where People Search for Your Topics" />
          {geo.map((g) => (
            <div key={g.code || g.country} className="flex items-center px-5 py-2 border-b border-[#2a2a5a] hover:bg-[#1a1a2e]">
              <span className="w-7 text-[15px]">{flag(g.code)}</span>
              <span className="text-[12px] text-[#e6f7ff] w-36 truncate mr-4">{g.country}</span>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-[80px] h-1.5 bg-[#1f1f3d] rounded-full overflow-hidden">
                  <div className="bg-[#ff006e] h-full" style={{ width: `${(g.value / maxGeo) * 100}%` }} />
                </div>
                <span className="text-[11px] text-[#9aa4d6]">{g.value}</span>
              </div>
            </div>
          ))}
          {geo.length === 0 && <Notice>{gtOk ? 'No country data available' : 'Needs Google Trends data'}</Notice>}
        </div>
      </div>
    </div>
  );
}
