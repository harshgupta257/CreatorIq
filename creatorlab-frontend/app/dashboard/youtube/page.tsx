'use client';

import React, { useState, useMemo } from 'react';
import { useCreatorStore } from '@/lib/store';
import { Download, Clock } from 'lucide-react';

const TIME_SLOTS = [
  '12AM-4AM',
  '4AM-8AM',
  '8AM-12PM',
  '12PM-4PM',
  '4PM-8PM',
  '8PM-12AM'
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function YouTubeAnalyticsPage() {
  const { channel, videos, dateRange, setDateRange } = useCreatorStore();
  const [sortBy, setSortBy] = useState<'views' | 'date' | 'engagement'>('date');

  // Filter videos by dateRange
  const filteredVideos = useMemo(() => {
    if (!videos.length) return [];
    
    let cutoff = new Date(0);
    const now = new Date();
    if (dateRange === '30D') {
      cutoff = new Date(now.setDate(now.getDate() - 30));
    } else if (dateRange === '90D') {
      cutoff = new Date(now.setDate(now.getDate() - 90));
    } else if (dateRange === '7D') {
      cutoff = new Date(now.setDate(now.getDate() - 7));
    }
    
    let filtered = videos.filter(v => new Date(v.published_at) >= cutoff);
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'views') return b.view_count - a.view_count;
      if (sortBy === 'date') return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      if (sortBy === 'engagement') {
         const aEng = (a.like_count + a.comment_count) / (a.view_count || 1);
         const bEng = (b.like_count + b.comment_count) / (b.view_count || 1);
         return bEng - aEng;
      }
      return 0;
    });
    
    return filtered;
  }, [videos, dateRange, sortBy]);

  const maxViews = useMemo(() => {
    if (!filteredVideos.length) return 1;
    return Math.max(...filteredVideos.map(v => v.view_count));
  }, [filteredVideos]);

  // Formatters
  const formatNum = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Heatmap Data (Day x 4-Hour Slots)
  const heatmapData = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(6).fill(0));
    let maxCount = 0;
    
    filteredVideos.forEach(v => {
      const d = new Date(v.published_at);
      // JS getDay(): 0=Sun, 1=Mon. We want 0=Mon, 6=Sun
      let day = d.getDay() - 1;
      if (day === -1) day = 6;
      
      const hour = d.getHours();
      const slot = Math.floor(hour / 4);
      
      grid[day][slot]++;
      if (grid[day][slot] > maxCount) {
        maxCount = grid[day][slot];
      }
    });
    
    return { grid, maxCount };
  }, [filteredVideos]);

  // Best Time to Post
  const bestTimeInsight = useMemo(() => {
     let bestDayIdx = 0;
     let bestSlotIdx = 0;
     let bestAvgViews = 0;
     
     for (let d = 0; d < 7; d++) {
       for (let s = 0; s < 6; s++) {
         // Find all videos in this slot
         const vids = filteredVideos.filter(v => {
            const date = new Date(v.published_at);
            let day = date.getDay() - 1;
            if (day === -1) day = 6;
            const slot = Math.floor(date.getHours() / 4);
            return day === d && slot === s;
         });
         
         if (vids.length > 0) {
            const avg = vids.reduce((acc, v) => acc + v.view_count, 0) / vids.length;
            if (avg > bestAvgViews) {
               bestAvgViews = avg;
               bestDayIdx = d;
               bestSlotIdx = s;
            }
         }
       }
     }
     
     return {
       day: DAYS[bestDayIdx],
       time: TIME_SLOTS[bestSlotIdx],
       views: bestAvgViews
     };
  }, [filteredVideos]);

  const overallAvgViews = useMemo(() => {
    if (!filteredVideos.length) return 0;
    return filteredVideos.reduce((acc, v) => acc + v.view_count, 0) / filteredVideos.length;
  }, [filteredVideos]);
  
  const perfVsAvg = useMemo(() => {
    if (!overallAvgViews || !bestTimeInsight.views) return 0;
    return ((bestTimeInsight.views - overallAvgViews) / overallAvgViews) * 100;
  }, [overallAvgViews, bestTimeInsight.views]);

  // Calculate day with most uploads
  const mostUploadsDay = useMemo(() => {
    if (!filteredVideos.length) return '-';
    const dayCounts = [0,0,0,0,0,0,0];
    filteredVideos.forEach(v => {
      let day = new Date(v.published_at).getDay() - 1;
      if (day === -1) day = 6;
      dayCounts[day]++;
    });
    const maxIdx = dayCounts.indexOf(Math.max(...dayCounts));
    return DAYS[maxIdx];
  }, [filteredVideos]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] text-[#888892] text-sm">
        Analyze a channel to view YouTube analytics
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full text-[#ededf0] min-h-screen bg-[#0c0c0e]">
      
      {/* Section 1: Channel Overview Strip */}
      <div className="w-full border-b border-[#222228] px-5 py-4 flex items-center justify-between bg-[#111114]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[4px] bg-[#222228] overflow-hidden flex-shrink-0">
            {channel.thumbnail ? (
              <img src={channel.thumbnail} alt={channel.title} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold leading-tight">{channel.title}</span>
            <span className="text-[11px] text-[#50505a] mt-0.5">{channel.custom_url || channel.channel_id} {channel.country ? `• ${channel.country}` : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#888892] uppercase tracking-wider">Subscribers</span>
            <span className="text-[18px] font-medium leading-none mt-1 tabular-nums">{formatNum(channel.subscriber_count)}</span>
          </div>
          <div className="w-[1px] h-8 bg-[#222228]" />
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#888892] uppercase tracking-wider">Views</span>
            <span className="text-[14px] font-medium leading-none mt-1.5 tabular-nums">{formatNum(channel.view_count)}</span>
          </div>
          <div className="w-[1px] h-8 bg-[#222228]" />
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#888892] uppercase tracking-wider">Videos</span>
            <span className="text-[14px] font-medium leading-none mt-1.5 tabular-nums">{formatNum(channel.video_count)}</span>
          </div>
          <div className="w-[1px] h-8 bg-[#222228]" />
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#888892] uppercase tracking-wider">Since</span>
            <span className="text-[14px] font-medium leading-none mt-1.5 tabular-nums">
              {channel.published_at ? new Date(channel.published_at).getFullYear() : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Filter bar */}
      <div className="w-full border-b border-[#222228] px-5 py-2 flex items-center justify-between bg-[#111114]">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#111114] border border-[#222228] rounded-[4px] overflow-hidden">
            {[
              { label: 'Last 30', val: '30D' },
              { label: 'Last 90', val: '90D' },
              { label: 'All Time', val: '1Y' }
            ].map(range => (
              <button
                key={range.val}
                onClick={() => setDateRange(range.val as any)}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  dateRange === range.val || (dateRange === '1Y' && range.val === '1Y')
                    ? 'bg-[#5b6cf9] text-white' 
                    : 'text-[#888892] hover:bg-[#16161a] hover:text-[#ededf0]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-[#222228] mx-1" />

          <div className="flex items-center bg-[#111114] border border-[#222228] rounded-[4px] overflow-hidden">
            {[
              { label: 'Views', val: 'views' },
              { label: 'Date', val: 'date' },
              { label: 'Engagement', val: 'engagement' }
            ].map(sort => (
              <button
                key={sort.val}
                onClick={() => setSortBy(sort.val as any)}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  sortBy === sort.val
                    ? 'bg-[#222228] text-[#ededf0]' 
                    : 'text-[#888892] hover:bg-[#16161a] hover:text-[#ededf0]'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#888892] hover:text-[#ededf0] hover:bg-[#16161a] rounded-[4px] transition-colors border border-transparent hover:border-[#222228]">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Section 3: Video Performance Table */}
      <div className="w-full flex-1 overflow-auto bg-[#0c0c0e]">
        <table className="w-full text-left text-[12px]">
          <thead className="sticky top-0 bg-[#0c0c0e] border-b border-[#222228] shadow-[0_1px_0_#222228] z-10">
            <tr>
              <th className="px-5 py-3 font-medium text-[#888892] w-[40%]">Video</th>
              <th className="px-5 py-3 font-medium text-[#888892]">Published</th>
              <th className="px-5 py-3 font-medium text-[#888892] text-right">Views</th>
              <th className="px-5 py-3 font-medium text-[#888892] text-right">Likes</th>
              <th className="px-5 py-3 font-medium text-[#888892] text-right">Comments</th>
              <th className="px-5 py-3 font-medium text-[#888892] text-right">Eng. Rate</th>
              <th className="px-5 py-3 font-medium text-[#888892] w-[120px]">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222228]">
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[#50505a]">
                  No videos found for this time range.
                </td>
              </tr>
            ) : (
              filteredVideos.map(video => {
                const engRate = (video.like_count + video.comment_count) / (video.view_count || 1);
                const perfPct = Math.min(100, (video.view_count / maxViews) * 100);
                
                return (
                  <tr key={video.video_id} className="hover:bg-[#111114] group transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-[120px] h-[68px] rounded-[2px] bg-[#222228] overflow-hidden flex-shrink-0">
                           {video.thumbnail ? (
                             <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                           ) : null}
                        </div>
                        <span className="font-medium text-[#ededf0] line-clamp-2 leading-snug">
                          {video.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#50505a] whitespace-nowrap">
                      {new Date(video.published_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">
                      {video.view_count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[#888892]">
                      {video.like_count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[#888892]">
                      {video.comment_count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">
                      <span className={
                        engRate >= 0.03 ? 'text-[#3fb950]' : 
                        engRate <= 0.01 ? 'text-[#f85149]' : 'text-[#888892]'
                      }>
                        {(engRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-full h-[4px] bg-[#222228] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#5b6cf9] rounded-full" 
                          style={{ width: `${perfPct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Section 4: Posting Patterns */}
      <div className="w-full border-t border-[#222228] flex flex-col md:flex-row bg-[#111114]">
        {/* Left Column: Heatmap */}
        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-[#222228] flex flex-col">
          <div className="px-5 py-3 border-b border-[#222228]">
            <span className="text-[12px] text-[#888892] font-medium uppercase tracking-wider">Upload Frequency</span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <div className="flex">
              <div className="flex flex-col gap-1 pr-3 pt-6 justify-between text-[10px] text-[#50505a] font-medium text-right w-10">
                {DAYS.map(day => <span key={day} className="h-6 leading-6">{day}</span>)}
              </div>
              <div className="flex-1 overflow-x-auto pb-2">
                <div className="flex flex-col gap-1 min-w-max">
                  {/* Header row */}
                  <div className="flex gap-1 mb-1 ml-1 text-[10px] text-[#50505a] font-medium">
                     {TIME_SLOTS.map(slot => (
                       <span key={slot} className="w-[36px] text-center truncate">{slot.split('-')[0]}</span>
                     ))}
                  </div>
                  {/* Grid */}
                  {heatmapData.grid.map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-1">
                      {row.map((val, cIdx) => {
                         const opacity = heatmapData.maxCount > 0 ? 0.1 + (val / heatmapData.maxCount) * 0.9 : 0.05;
                         return (
                           <div 
                             key={`${rIdx}-${cIdx}`}
                             className="w-[36px] h-[24px] rounded-[2px] transition-opacity hover:ring-1 ring-[#5b6cf9]"
                             style={{ 
                               backgroundColor: val > 0 ? '#5b6cf9' : '#222228',
                               opacity: val > 0 ? opacity : 1
                             }}
                             title={`${DAYS[rIdx]} ${TIME_SLOTS[cIdx]}: ${val} videos`}
                           />
                         );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Best Time to Post */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="px-5 py-3 border-b border-[#222228]">
            <span className="text-[12px] text-[#888892] font-medium uppercase tracking-wider">Best Time to Post</span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center gap-6">
            
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-[4px] bg-[#5b6cf9]/10 border border-[#5b6cf9]/20 flex items-center justify-center text-[#5b6cf9]">
                <Clock size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-semibold text-[#ededf0] leading-none mb-1">
                  {bestTimeInsight.day}s <span className="text-[#888892] font-normal text-[18px]">at</span> {bestTimeInsight.time}
                </span>
                <span className="text-[13px] text-[#888892]">
                  Based on highest average views ({formatNum(bestTimeInsight.views)} avg)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-[#222228]">
                <span className="text-[12px] text-[#888892]">Most frequent upload day</span>
                <span className="text-[12px] font-medium text-[#ededf0]">{mostUploadsDay}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#222228]">
                <span className="text-[12px] text-[#888892]">Performance vs Average</span>
                <span className={`text-[12px] font-medium ${perfVsAvg >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                  {perfVsAvg >= 0 ? '+' : ''}{perfVsAvg.toFixed(1)}% views
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
