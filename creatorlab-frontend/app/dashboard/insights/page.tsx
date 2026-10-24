'use client';

import React from 'react';
import Link from 'next/link';
import { useCreatorStore } from '@/lib/store';
import { fetchInsights } from '@/lib/api';
import { useChannelData } from '@/lib/useChannelData';
import { formatCompact, formatNumber } from '@/lib/utils';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ArrowDown, ArrowRight, ArrowUp, Minus } from 'lucide-react';
import type {
  Factor, InsightsData, OutlierVideo, SharedTrait, Verdict,
} from '@/lib/types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TOOLTIP_STYLE = {
  backgroundColor: '#0f0f24', borderColor: '#2a2a5a', fontSize: '12px', color: '#e6f7ff', borderRadius: '4px',
};

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** "India Standard Time" rather than an IANA id like "Asia/Calcutta" */
function timeZoneName(tz: string): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((x) => x.type === 'timeZoneName');
    return part?.value ?? tz;
  } catch {
    return tz;
  }
}

const DAY_MS = 86_400_000;

const times = (r: number | null | undefined) => (r == null ? '—' : `${r >= 10 ? r.toFixed(0) : r.toFixed(1)}×`);

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-5 py-3 border-b border-[#2a2a5a] flex items-baseline justify-between gap-3">
      <span className="text-[12px] text-[#9aa4d6]">{title}</span>
      {note && <span className="text-[11px] text-[#6a6aa8] text-right">{note}</span>}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-3 text-[12px] text-[#6a6aa8]">{children}</div>;
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const style = {
    clear:        { text: 'Clear effect',        cls: 'text-[#00ff9f] border-[#00ff9f]/40' },
    none:         { text: 'No clear difference', cls: 'text-[#9aa4d6] border-[#3d3d80]' },
    insufficient: { text: 'Not enough data',     cls: 'text-[#6a6aa8] border-[#2a2a5a]' },
  }[verdict];
  return (
    <span className={`shrink-0 text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-[3px] border ${style.cls}`}>
      {style.text}
    </span>
  );
}

function ratioColor(r: number): string {
  if (r >= 1.25) return 'text-[#00ff9f]';
  if (r <= 0.8) return 'text-[#ff3864]';
  return 'text-[#9aa4d6]';
}

function OutlierRow({ v }: { v: OutlierVideo }) {
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
        <div className="text-[11px] text-[#6a6aa8]">
          {formatCompact(v.view_count)} views · {v.age_days}d old{v.format === 'short' ? ' · Short' : ''}
        </div>
      </div>
      <span className={`text-[14px] tabular-nums shrink-0 ${ratioColor(v.ratio)}`}>{times(v.ratio)}</span>
    </a>
  );
}

function traitSentence(t: SharedTrait): string {
  const lead = `${t.top_count} of ${t.top_total} top videos`;
  const rest = `(vs ${t.rest_share}% of your other videos)`;
  switch (t.kind) {
    case 'tag':   return `${lead} use ${t.text} ${rest}`;
    case 'title': return `${lead} have ${t.text} ${rest}`;
    default:      return `${lead} ${t.text} ${rest}`;
  }
}

function factorSummary(f: Factor): string {
  if (f.verdict === 'insufficient' || !f.best) return 'Needs at least 3 videos in two or more groups.';
  if (f.verdict === 'clear') return `${f.best} does best: ${times(f.effect)} the others.`;
  return `${f.best} looks best (${times(f.effect)}), but the difference is within normal variation.`;
}

function FactorRow({ f }: { f: Factor }) {
  const max = Math.max(...f.groups.map((g) => g.median_ratio), 1);
  return (
    <div className="px-5 py-3 border-b border-[#2a2a5a]">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-[13px] text-[#e6f7ff]">{f.name}</span>
        <VerdictBadge verdict={f.verdict} />
      </div>
      <div className="text-[11px] text-[#9aa4d6] mb-2">{factorSummary(f)}</div>
      <div className="flex flex-col gap-1">
        {f.groups.map((g) => (
          <div key={g.label} className="flex items-center gap-2 text-[11px]">
            <span className={`w-[150px] truncate ${g.label === f.best && f.verdict === 'clear' ? 'text-[#00ff9f]' : 'text-[#9aa4d6]'}`}>
              {g.label}
            </span>
            <div className="flex-1 h-1.5 bg-[#1f1f3d] rounded-full overflow-hidden">
              <div
                className={`h-full ${g.label === f.best && f.verdict === 'clear' ? 'bg-[#00ff9f]' : 'bg-[#3d3d80]'}`}
                style={{ width: `${(g.median_ratio / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums text-[#9aa4d6]">{times(g.median_ratio)}</span>
            <span className="w-14 shrink-0 text-right tabular-nums text-[#6a6aa8] whitespace-nowrap">{g.n} vid{g.n === 1 ? '' : 's'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Heatmap({ data }: { data: NonNullable<InsightsData['what_works']> }) {
  const cell = new Map(data.heatmap.map((c) => [`${c.day}_${c.block}`, c]));
  const bg = (r: number) => {
    const strength = Math.min(1, Math.abs(Math.log(r)) / Math.log(3));
    const alpha = 0.15 + 0.7 * strength;
    return r >= 1 ? `rgba(0,255,159,${alpha})` : `rgba(255,56,100,${alpha})`;
  };
  return (
    <div className="px-5 py-4 overflow-x-auto">
      <div className="grid gap-1 min-w-[520px]" style={{ gridTemplateColumns: `48px repeat(${data.time_blocks.length}, 1fr)` }}>
        <div />
        {data.time_blocks.map((b) => (
          <div key={b} className="text-[10px] text-[#6a6aa8] text-center">{b}</div>
        ))}
        {DAY_SHORT.map((day, d) => (
          <React.Fragment key={day}>
            <div className="text-[11px] text-[#9aa4d6] flex items-center">{day}</div>
            {data.time_blocks.map((b, bi) => {
              const c = cell.get(`${d}_${bi}`);
              return (
                <div
                  key={b}
                  title={c ? `${day} ${b}: ${times(c.median_ratio)} typical (${c.n} video${c.n === 1 ? '' : 's'})` : `${day} ${b}: no uploads`}
                  className="h-7 rounded-[3px] flex items-center justify-center text-[10px] tabular-nums"
                  style={{ background: c ? bg(c.median_ratio) : '#141430', color: c ? '#e6f7ff' : '#3d3d80' }}
                >
                  {c ? c.n : ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <p className="text-[11px] text-[#6a6aa8] mt-2">
        Numbers are how many videos you uploaded in each slot. Green is above your typical video, red is below.
        Slots with 1–2 videos are mostly luck.
      </p>
    </div>
  );
}

export default function InsightsPage() {
  const { channelId, insights, setInsights } = useCreatorStore();
  const { error, retry } = useChannelData(
    insights,
    (id) => fetchInsights(id, browserTimeZone()),
    setInsights,
  );

  if (!channelId) {
    return <div className="flex h-[400px] items-center justify-center text-[13px] text-[#9aa4d6]">Enter a channel to see its performance insights</div>;
  }
  if (!insights && error) return <ErrorState message={error} onRetry={retry} />;
  if (!insights) {
    return <div className="flex h-[400px] items-center justify-center text-[13px] text-[#9aa4d6]">Analyzing your videos...</div>;
  }

  const d = insights;
  const growth = d.growth;

  if (d.status !== 'ok') {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-2 px-5 text-center">
        <p className="text-[13px] text-[#e6f7ff]">Not enough videos yet</p>
        <p className="text-[12px] text-[#6a6aa8] max-w-[460px]">
          Performance insights need at least {d.min_videos} videos that are more than a few days old.
          This channel has {d.videos_fetched}.
        </p>
      </div>
    );
  }

  const m = d.momentum!;
  const ww = d.what_works!;
  const out = d.outliers!;
  const model = d.model!;
  const clearTopics = ww.topics;
  // A factor where every video falls in one group has nothing to compare
  const factors = ww.factors.filter((f) => f.groups.length >= 2);
  const half = Math.ceil(factors.length / 2);

  const momentumText = {
    improving: `Your last ${m.recent_count} videos are doing ${times(m.change)} better than your earlier ones.`,
    declining: `Your last ${m.recent_count} videos are getting ${times(m.change)} the views of your earlier ones.`,
    steady:    `No clear change: your last ${m.recent_count} videos are at ${times(m.change)} your earlier ones, within normal variation.`,
  }[m.verdict];
  const MomentumIcon = m.verdict === 'improving' ? ArrowUp : m.verdict === 'declining' ? ArrowDown : Minus;
  const momentumColor = m.verdict === 'improving' ? 'text-[#00ff9f]' : m.verdict === 'declining' ? 'text-[#ff3864]' : 'text-[#9aa4d6]';

  const hist = growth.history;
  const first = hist[0];
  const last = hist[hist.length - 1];
  const spanDays = hist.length >= 2 ? Math.round((Date.parse(last.date) - Date.parse(first.date)) / DAY_MS) : 0;
  const tzName = timeZoneName(d.timezone);
  // Day-level ticks for spans under a year; month + year beyond that
  const series = m.series;
  const seriesSpanDays = series.length >= 2
    ? (Date.parse(series[series.length - 1].date) - Date.parse(series[0].date)) / DAY_MS
    : 0;
  const momentumTick = (v: string) => new Date(v).toLocaleString('default',
    seriesSpanDays > 365 ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col">
      {/* Basis */}
      <div className="border-b border-[#2a2a5a] px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-[#9aa4d6]">
          Based on {d.videos_scored} videos ({d.long_count} long-form, {d.short_count} Shorts) · upload times in {tzName}
        </span>
        <span className="text-[11px] text-[#6a6aa8]">
          2.0× = twice the views of your typical video of the same age
        </span>
      </div>

      {/* 1. Expected views */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle title="Expected Views for Your Next Video" note="Likely range after 30 days, from your recent videos" />
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#2a2a5a]">
          {(d.expected_next ?? []).map((e) => (
            <div key={e.format} className="px-5 py-4">
              <div className="text-[11px] uppercase tracking-wider text-[#6a6aa8] mb-1">{e.label}</div>
              <div className="text-[24px] tabular-nums text-[#e6f7ff]">
                {formatCompact(e.low)} – {formatCompact(e.high)}
              </div>
              <div className="text-[11px] text-[#6a6aa8] mt-1">
                Typical {formatCompact(e.typical)} views after {e.days} days · based on your last {e.based_on} {e.format === 'short' ? 'Shorts' : 'videos'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Momentum */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle title="Momentum" note="Each dot is a video; the line is the 5-video trend" />
        <div className={`px-5 pt-3 flex items-center gap-2 text-[13px] ${momentumColor}`}>
          <MomentumIcon className="w-4 h-4 shrink-0" />
          <span>{momentumText}</span>
        </div>
        <div className="h-[220px] w-full px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={m.series}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9aa4d6' }} minTickGap={40}
                tickFormatter={momentumTick} />
              <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: '#9aa4d6' }} tickFormatter={(v) => `${Number(v).toFixed(1)}×`} width={44} />
              <ReferenceLine y={1} stroke="#3d3d80" strokeDasharray="4 4" />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#9aa4d6' }}
                formatter={(value, name, item) => [times(Number(value)), name === 'ratio' ? (item?.payload?.title ?? 'Video') : '5-video trend']} />
              <Line dataKey="ratio" stroke="transparent" dot={{ r: 2.5, fill: '#00ffff', stroke: 'none' }} activeDot={{ r: 4 }} isAnimationActive={false} />
              <Line dataKey="trend" stroke="#ff006e" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Outliers */}
      <div className="border-b border-[#2a2a5a]">
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#2a2a5a]">
          <div>
            <SectionTitle title="Top Performers" note="Compared with videos of the same age" />
            {out.top.map((v) => <OutlierRow key={v.video_id} v={v} />)}
          </div>
          <div className="border-t md:border-t-0 border-[#2a2a5a]">
            <SectionTitle title="Underperformers" note="At least a week old" />
            {out.bottom.map((v) => <OutlierRow key={v.video_id} v={v} />)}
            {out.bottom.length === 0 && <Muted>No videos old enough yet</Muted>}
          </div>
        </div>
        <div className="border-t border-[#2a2a5a] px-5 py-3">
          <div className="text-[11px] uppercase tracking-wider text-[#6a6aa8] mb-1.5">What your top videos have in common</div>
          {out.top_share_traits.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {out.top_share_traits.map((t) => (
                <li key={`${t.kind}-${t.text}`} className="text-[12px] text-[#e6f7ff]">• {traitSentence(t)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#6a6aa8]">No trait stands out. Your best videos differ from each other in topic, length and title style.</p>
          )}
        </div>
      </div>

      {/* 4. What works */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle title="What Works on Your Channel" note="Medians, so one viral video can't skew a result" />
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[#2a2a5a]">
          <div>{factors.slice(0, half).map((f) => <FactorRow key={f.key} f={f} />)}</div>
          <div>{factors.slice(half).map((f) => <FactorRow key={f.key} f={f} />)}</div>
        </div>
      </div>

      <div className="border-b border-[#2a2a5a]">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[#2a2a5a]">
          <div>
            <SectionTitle title="Topics" note="Videos with each tag vs without it" />
            {clearTopics.map((t) => (
              <div key={t.topic} className="flex items-center gap-3 px-5 py-2 border-b border-[#2a2a5a]">
                <span className="text-[12px] text-[#e6f7ff] flex-1 truncate">{t.topic}</span>
                <span className="text-[11px] text-[#6a6aa8] tabular-nums">{t.n} videos</span>
                <span className={`w-12 text-right text-[12px] tabular-nums ${t.verdict === 'clear' ? ratioColor(t.effect) : 'text-[#9aa4d6]'}`}>{times(t.effect)}</span>
                <VerdictBadge verdict={t.verdict} />
              </div>
            ))}
            {clearTopics.length === 0 && <Muted>No tag is used on enough videos to compare (needs 3 with and 3 without).</Muted>}
          </div>
          <div className="border-t lg:border-t-0 border-[#2a2a5a]">
            <SectionTitle title="Upload Timing" note={tzName} />
            <Heatmap data={ww} />
          </div>
        </div>
      </div>

      {/* 5. ML model */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle title="What Drives Views on Your Channel" note="Machine learning, tested on videos it hadn't seen" />
        {model.status === 'reliable' ? (
          <div className="px-5 py-3">
            <p className="text-[12px] text-[#9aa4d6] mb-3">
              On videos it hadn&apos;t seen, the model&apos;s estimates were {model.improvement_pct}% closer than simply assuming
              a typical video. These are the things it relies on most:
            </p>
            <div className="flex flex-col gap-1.5">
              {(model.drivers ?? []).map((dr) => (
                <div key={dr.label} className="flex items-center gap-3 text-[12px]">
                  <span className="w-[200px] truncate text-[#e6f7ff]">{dr.label}</span>
                  <div className="flex-1 h-1.5 bg-[#1f1f3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ff006e]" style={{ width: `${dr.share}%` }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-[#9aa4d6]">{dr.share}%</span>
                  <span className={`w-[110px] text-[11px] ${dr.direction === 'up' ? 'text-[#00ff9f]' : dr.direction === 'down' ? 'text-[#ff3864]' : 'text-[#9aa4d6]'}`}>
                    {dr.direction === 'up' ? 'more → more views' : dr.direction === 'down' ? 'more → fewer views' : 'depends on value'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : model.status === 'not_reliable' ? (
          <Muted>
            The model couldn&apos;t predict this channel&apos;s results better than a simple guess when tested on videos it
            hadn&apos;t seen, so no drivers are shown. Views here likely depend on things not in the data, such as
            thumbnails or how timely a topic is.
          </Muted>
        ) : (
          <Muted>The model needs at least {model.min_videos} videos to be tested reliably. This channel has {model.n}.</Muted>
        )}
      </div>

      {/* 6. Growth */}
      <div className="border-b border-[#2a2a5a]">
        <SectionTitle
          title="Channel Growth"
          note={growth.tracking_since ? `Daily snapshots since ${new Date(growth.tracking_since).toLocaleDateString()}` : undefined}
        />
        {hist.length >= 2 ? (
          <>
            <div className="px-5 pt-3 flex flex-wrap gap-6 text-[12px]">
              <span className="text-[#9aa4d6]">Subscribers: <span className="text-[#e6f7ff] tabular-nums">{last.subscribers - first.subscribers >= 0 ? '+' : ''}{formatNumber(last.subscribers - first.subscribers)}</span></span>
              <span className="text-[#9aa4d6]">Views: <span className="text-[#e6f7ff] tabular-nums">{last.views - first.views >= 0 ? '+' : ''}{formatNumber(last.views - first.views)}</span></span>
              <span className="text-[#6a6aa8]">{hist.length} snapshots over {spanDays} day{spanDays === 1 ? '' : 's'}</span>
            </div>
            <div className="h-[200px] w-full px-2 py-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hist}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9aa4d6' }} minTickGap={30}
                    tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short', day: 'numeric' })} />
                  <YAxis yAxisId="subs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#00ffff' }} tickFormatter={(v) => formatCompact(Number(v))} width={48} domain={['auto', 'auto']} />
                  <YAxis yAxisId="views" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#ff006e' }} tickFormatter={(v) => formatCompact(Number(v))} width={48} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#9aa4d6' }} formatter={(v, name) => [formatNumber(Number(v)), name === 'subscribers' ? 'Subscribers' : 'Views']} />
                  <Line yAxisId="subs" dataKey="subscribers" stroke="#00ffff" strokeWidth={2} dot={false} />
                  <Line yAxisId="views" dataKey="views" stroke="#ff006e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <Muted>
            {growth.tracking_since
              ? `Tracking started ${new Date(growth.tracking_since).toLocaleDateString()}. The growth chart appears once there are two days of data. YouTube doesn't provide past numbers, so history builds up from here.`
              : 'Growth tracking is unavailable right now.'}
          </Muted>
        )}
        {growth.storage === 'local_file' && hist.length > 0 && (
          <div className="px-5 pb-3 text-[11px] text-[#6a6aa8]">Note: history is kept in temporary server storage and may reset when the server restarts.</div>
        )}
      </div>

      <Link href="/dashboard/trends" className="px-5 py-3 text-[12px] text-[#ff006e] flex items-center gap-1 hover:underline">
        Looking for what to make next? See Content Opportunities on the Trends page <ArrowRight size={12} />
      </Link>
    </div>
  );
}
