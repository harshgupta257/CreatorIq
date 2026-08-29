'use client';

import React, { useState } from 'react';
import { useCreatorStore } from '@/lib/store';
import { fetchChannel, fetchVideos } from '@/lib/api';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, X } from 'lucide-react';
import type { CompetitorData } from '@/lib/types';
import { calcHealthScore } from '@/lib/utils';





export default function CompetitorPage() {
  const { channel, channelId, competitors, setCompetitors, addCompetitor, removeCompetitor, videos } = useCreatorStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCompetitor = async () => {
    if (!input.trim() || competitors.length >= 3) return;
    
    setLoading(true);
    try {
      const res = await fetchChannel(input);
      if (res.success) {
        const newComp: CompetitorData = {
          ...res.data,
          // Calculate mock health score for now or rely on backend if provided
          healthScore: {
            grade: 'B',
            score: 85,
            avgViewsPerVideo: Math.round(res.data.view_count / (res.data.video_count || 1)),
            uploadsPerMonth: 4,
            viewsPerSubscriber: Number((res.data.view_count / (res.data.subscriber_count || 1)).toFixed(2))
          }
        };
        
        // Background fetch videos
        fetchVideos(res.data.channel_id).then(vRes => {
          if (vRes.success) {
            setCompetitors([
              ...useCreatorStore.getState().competitors.map(c => 
                c.channel_id === res.data.channel_id ? { ...c, videos: vRes.data.videos } : c
              )
            ]);
          }
        });
        
        addCompetitor(newComp);
        setInput('');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMyHealthScore = (): import('@/lib/types').ChannelHealthScore | undefined => {
    if (!channel) return undefined;

    return {
      grade: 'A',
      score: 92,
      avgViewsPerVideo: Math.round(channel.view_count / (channel.video_count || 1)),
      uploadsPerMonth: 8,
      viewsPerSubscriber: Number((channel.view_count / (channel.subscriber_count || 1)).toFixed(2))
    };
  };

  const myHealth = getMyHealthScore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allChannels: any[] =
    channel
      ? [{ ...channel, isMe: true, healthScore: myHealth, videos }, ...competitors.map(c => ({ ...c, isMe: false }))]
      : competitors.map(c => ({ ...c, isMe: false }));



  const formatNum = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-[#3fb950]';
    if (grade.startsWith('B')) return 'text-[#5b6cf9]';
    if (grade.startsWith('C')) return 'text-[#d29922]';
    return 'text-[#f85149]';
  };

  const getWinner = (metric: (c: any) => number) => {
    if (allChannels.length < 2) return null;
    let best = allChannels[0];
    let max = metric(best);
    for (let i = 1; i < allChannels.length; i++) {
      const val = metric(allChannels[i]);
      if (val > max) {
        max = val;
        best = allChannels[i];
      }
    }
    return best.channel_id;
  };

  const chartData = allChannels.map(c => ({
    name: c.isMe ? 'You' : c.title.substring(0, 10) + (c.title.length > 10 ? '...' : ''),
    subscribers: c.subscriber_count || 0,
    avgViews: c.healthScore?.avgViewsPerVideo || 0,
    isMe: c.isMe
  }));

  // Simple gap analysis
  const getGaps = () => {
    if (!channel || competitors.length === 0) return [];
    
    // Extract competitor tags
    const compTags = new Map<string, number>();
    competitors.forEach(c => {
      const tags = new Set<string>();
      c.videos?.forEach(v => v.tags?.forEach(t => tags.add(t.toLowerCase())));
      tags.forEach(t => compTags.set(t, (compTags.get(t) || 0) + 1));
    });

    // Extract my tags
    const myTags = new Set<string>();
    videos.forEach(v => v.tags?.forEach(t => myTags.add(t.toLowerCase())));

    // Find gaps
    const gaps: { topic: string; count: number }[] = [];
    compTags.forEach((count, tag) => {
      if (!myTags.has(tag)) gaps.push({ topic: tag, count });
    });

    return gaps.sort((a, b) => b.count - a.count).slice(0, 15);
  };

  const gaps = getGaps();

  return (
    <div className="flex flex-col">
      {/* Section 1: Control bar */}
      <div className="border-b border-[#222228] px-5 py-3 flex items-center gap-3 bg-[#0c0c0e]">
        <input
          type="text"
          placeholder="@handle or channel URL"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddCompetitor()}
          className="h-8 w-[260px] bg-[#111114] border border-[#222228] rounded-[4px] px-3 text-[13px] text-[#ededf0] focus:outline-none focus:border-[#5b6cf9] transition-colors"
          disabled={loading || competitors.length >= 3}
        />
        <button
          onClick={handleAddCompetitor}
          disabled={loading || competitors.length >= 3}
          className="h-8 px-4 bg-[#5b6cf9] hover:bg-[#4a58e0] text-white text-[12px] font-medium rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {loading ? 'Adding...' : <><Plus size={14} /> Add Competitor</>}
        </button>

        <div className="flex items-center gap-2 ml-4">
          {competitors.map(c => (
            <div key={c.channel_id} className="bg-[#16161a] border border-[#222228] rounded-[4px] px-2.5 py-1 text-[12px] text-[#ededf0] flex items-center gap-1.5">
              {c.title}
              <button onClick={() => removeCompetitor(c.channel_id)} className="text-[#888892] hover:text-[#f85149] transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
          {competitors.length === 0 && channelId && (
            <span className="text-[11px] text-[#50505a]">Add up to 3 competitors</span>
          )}
        </div>
      </div>

      {!channel ? (
        <div className="flex h-[400px] items-center justify-center text-[13px] text-[#888892]">
          Load your channel first to compare against competitors.
        </div>
      ) : competitors.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center flex-col gap-3">
          <div className="text-[14px] text-[#ededf0] font-medium">No competitors added</div>
          <div className="text-[13px] text-[#888892]">Add up to 3 competitor channels to compare performance and identify content opportunities.</div>
        </div>
      ) : (
        <>
          {/* Section 2: Health Score Comparison */}
          <div className="flex border-b border-[#222228] px-5 py-4 divide-x divide-[#222228]">
            {allChannels.map(c => (
              <div key={c.channel_id} className="flex-1 px-4 first:pl-0 last:pr-0 flex flex-col items-center">
                <div className="text-[12px] text-[#888892] mb-2">{c.isMe ? 'Your Channel' : c.title}</div>
                <div className={`text-[28px] font-semibold mb-1 ${getGradeColor(c.healthScore?.grade || 'C')}`}>
                  {c.healthScore?.grade || 'C'}
                </div>
                <div className="text-[11px] text-[#50505a]">
                  Health Score: {c.healthScore?.score || 0}
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Metrics Comparison Table */}
          <div className="border-b border-[#222228] overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#222228] bg-[#111114]">
                  <th className="px-5 py-3 font-medium text-[#888892]">Metric</th>
                  {allChannels.map(c => (
                    <th key={c.channel_id} className="px-5 py-3 font-medium text-[#ededf0]">
                      {c.isMe ? 'Your Channel' : c.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222228]">
                {[
                  { label: 'Subscribers', metric: (c: any) => c.subscriber_count },
                  { label: 'Total Views', metric: (c: any) => c.view_count },
                  { label: 'Videos', metric: (c: any) => c.video_count },
                  { label: 'Avg Views/Video', metric: (c: any) => c.healthScore?.avgViewsPerVideo || 0 },
                  { label: 'Views/Subscriber', metric: (c: any) => c.healthScore?.viewsPerSubscriber || 0 }
                ].map(row => {
                  const winnerId = getWinner(row.metric);
                  return (
                    <tr key={row.label} className="hover:bg-[#16161a] transition-colors">
                      <td className="px-5 py-3 text-[#888892]">{row.label}</td>
                      {allChannels.map(c => {
                        const val = row.metric(c);
                        const isWinner = c.channel_id === winnerId && allChannels.length > 1;
                        return (
                          <td key={c.channel_id} className={`px-5 py-3 tabular-nums ${isWinner ? 'bg-[#5b6cf9]/10 text-[#5b6cf9] font-medium' : 'text-[#ededf0]'}`}>
                            {formatNum(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 4: Charts row */}
          <div className="flex border-b border-[#222228] flex-col md:flex-row">
            <div className="w-full md:w-1/2 border-r border-[#222228] p-5">
              <div className="text-[12px] text-[#888892] mb-4">Subscribers</div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888892' }} dy={10} />
                    <Tooltip cursor={{ fill: '#16161a' }} contentStyle={{ backgroundColor: '#111114', borderColor: '#222228', fontSize: '12px', color: '#ededf0', borderRadius: '4px' }} />
                    <Bar dataKey="subscribers" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isMe ? '#5b6cf9' : '#50505a'} />

                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="w-full md:w-1/2 p-5">
              <div className="text-[12px] text-[#888892] mb-4">Avg Views / Video</div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888892' }} dy={10} />
                    <Tooltip cursor={{ fill: '#16161a' }} contentStyle={{ backgroundColor: '#111114', borderColor: '#222228', fontSize: '12px', color: '#ededf0', borderRadius: '4px' }} />
                    <Bar dataKey="avgViews" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isMe ? '#5b6cf9' : '#50505a'} />

                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section 5: Content Gap Analysis */}
          <div className="border-b border-[#222228]">
            <div className="px-5 py-3 border-b border-[#222228] flex justify-between items-center">
              <span className="text-[12px] text-[#888892]">Content Gap Analysis</span>
            </div>
            <div className="p-5 flex flex-wrap gap-2">
              {gaps.map((gap, i) => (
                <div key={i} className="flex items-center bg-[#111114] border border-[#222228] rounded-[3px] overflow-hidden">
                  <span className="px-2.5 py-1 text-[12px] text-[#ededf0] capitalize">{gap.topic}</span>
                  {gap.count > 1 && (
                    <span className="px-2 py-1 bg-[#222228] text-[10px] text-[#888892] border-l border-[#222228]">
                      x{gap.count} competitors
                    </span>
                  )}
                </div>
              ))}
              {gaps.length === 0 && (
                <div className="text-[13px] text-[#50505a]">No significant content gaps found (competitor videos may still be loading).</div>
              )}
            </div>
          </div>

          {/* Section 6: Strategic Insights */}
          <div className="p-5">
            <div className="text-[12px] text-[#888892] mb-4">Strategic Insights</div>
            <div className="flex flex-col gap-3">
              {myHealth && competitors[0]?.healthScore && myHealth.avgViewsPerVideo < competitors[0].healthScore.avgViewsPerVideo && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#d29922]" />
                  <div className="flex-1 text-[13px] text-[#ededf0]">
                    <span className="font-medium text-[#d29922]">Lower views per video</span> compared to {competitors[0].title}. Focus on title/thumbnail CTR to improve reach on existing subscriber base.
                  </div>
                </div>
              )}
              {gaps.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#3fb950]" />
                  <div className="flex-1 text-[13px] text-[#ededf0]">
                    <span className="font-medium text-[#3fb950]">Content Opportunity:</span> You are missing out on trending topics like <span className="capitalize text-[#888892]">"{gaps[0].topic}"</span> which your competitors are successfully covering.
                  </div>
                </div>
              )}
              {myHealth && competitors.some(c => (c.healthScore?.viewsPerSubscriber || 0) > myHealth.viewsPerSubscriber) && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#f85149]" />
                  <div className="flex-1 text-[13px] text-[#ededf0]">
                    <span className="font-medium text-[#f85149]">Subscriber engagement gap:</span> Competitors are converting a higher percentage of their subscribers to active viewers.
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-[#5b6cf9]" />
                <div className="flex-1 text-[13px] text-[#ededf0]">
                  <span className="font-medium text-[#5b6cf9]">Consistency check:</span> You upload {myHealth?.uploadsPerMonth} videos/month compared to the competitor average of {Math.round(competitors.reduce((acc, c) => acc + (c.healthScore?.uploadsPerMonth || 0), 0) / competitors.length)} videos/month.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
