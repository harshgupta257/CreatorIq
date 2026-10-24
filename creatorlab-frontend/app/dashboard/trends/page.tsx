'use client';

import React from 'react';
import { useCreatorStore } from '@/lib/store';
import { fetchTrends } from '@/lib/api';
import { useChannelData } from '@/lib/useChannelData';
import { ErrorState } from '@/components/ui/ErrorState';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight } from 'lucide-react';

export default function TrendsPage() {
  const { channel, channelId, trends, setTrends } = useCreatorStore();
  const { error, retry } = useChannelData(
    trends,
    (id) => fetchTrends(channel?.title ?? '', id),
    setTrends,
  );

  if (!trends && error) return <ErrorState message={error} onRetry={retry} />;

  if (!trends) {
    return (
      <div className="flex h-[400px] items-center justify-center text-[13px] text-secondary">
        {channelId ? 'Gathering trends intelligence...' : 'Enter a channel to monitor trends'}
      </div>
    );
  }

  const { keywords_in_data = [], rate_limited, interest_over_time = [], related_queries, geographic_interest = {}, word_frequency = [] } = trends;
  
  const colors = ['#ff006e', '#00ffff', '#0080ff', '#ffd700', '#5d34d0'];

  const renderValue = (value: number | string) => {
    if (typeof value === 'number') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-[40px] h-1.5 bg-[#1f1f3d] rounded-full overflow-hidden">
            <div className="bg-[#ff006e] h-full" style={{ width: `${Math.min(100, value)}%` }} />
          </div>
          <span className="text-[#9aa4d6] w-8 text-right">{value}</span>
        </div>
      );
    }
    return <span className="text-[#00ff9f]">{value}</span>;
  };

  const geoEntries = Object.entries(geographic_interest)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
    
  const maxGeoValue = geoEntries.length > 0 ? Math.max(...geoEntries.map(([, v]) => v)) : 100;

  return (
    <div className="flex flex-col">
      {/* Section 1: Status bar */}
      <div className="border-b border-[#2a2a5a] px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6a6aa8] uppercase tracking-wider mr-2">Tracked Keywords</span>
          {keywords_in_data.map((kw, i) => (
            <span key={i} className="bg-[#1a1a2e] border border-[#2a2a5a] rounded-[3px] px-2 py-0.5 text-[10px] text-[#e6f7ff]">
              {kw}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {rate_limited ? (
            <div className="text-[11px] text-[#ffd700] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
              Google Trends is rate limiting requests. Try again later
            </div>
          ) : interest_over_time.length === 0 ? (
            <div className="text-[11px] text-[#6a6aa8] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6a6aa8]" />
              No Google Trends data for these keywords
            </div>
          ) : (
            <div className="text-[11px] text-[#00ff9f] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9f]" />
              Live data
            </div>
          )}
          <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(trends.query)}`} target="_blank" rel="noreferrer" className="text-[#ff006e] text-[11px] flex items-center gap-1 hover:underline">
            View on Google Trends
            <ArrowRight size={10} />
          </a>
        </div>
      </div>

      {/* Section 2: Interest Over Time */}
      <div className="border-b border-[#2a2a5a]">
        <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#9aa4d6]">
          Search Interest Trend
        </div>
        <div className="h-[220px] w-full pt-4 pr-5">
          {interest_over_time.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={interest_over_time}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9aa4d6' }} 
                  dy={10}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                  }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f0f24', borderColor: '#2a2a5a', fontSize: '12px', color: '#e6f7ff', borderRadius: '4px' }}
                  labelStyle={{ color: '#9aa4d6', marginBottom: '4px' }}
                />
                {keywords_in_data.map((kw, i) => (
                  <Line 
                    key={kw}
                    type="monotone" 
                    dataKey={kw} 
                    stroke={colors[i % colors.length]} 
                    strokeWidth={i === 0 ? 2 : 1} 
                    dot={false} 
                    activeDot={{ r: 4, fill: colors[i % colors.length] }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-8">
              <p className="text-[12px] text-[#6a6aa8]">
                Search interest unavailable. Topics from this channel&apos;s video tags:
              </p>
              <div className="flex items-center justify-center flex-wrap gap-2">
               {word_frequency.map((word, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-[3px] border border-[#2a2a5a] bg-[#0f0f24] text-[#9aa4d6] text-[12px]"
                >
                  {word.word} ({word.count})
                </span>
              ))}
              {word_frequency.length === 0 && <span className="text-[#6a6aa8] text-[12px]">No video tags found</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Two-column */}
      <div className="flex flex-col md:flex-row">
        {/* Left: Related Queries */}
        <div className="w-full md:w-1/2 border-r border-[#2a2a5a]">
          <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#9aa4d6]">Related Queries</div>
          
          <div className="px-5 py-2 bg-[#0f0f24] text-[11px] text-[#6a6aa8] uppercase tracking-wider border-b border-[#2a2a5a]">
            Rising
          </div>
          {related_queries?.rising?.slice(0, 5).map((q, i) => (
            <div key={`r-${i}`} className="flex justify-between items-center px-5 py-2 border-b border-[#2a2a5a] hover:bg-[#1a1a2e]">
              <span className="text-[12px] text-[#e6f7ff]">{q.query}</span>
              {renderValue(q.value)}
            </div>
          ))}
          {(!related_queries?.rising || related_queries.rising.length === 0) && (
            <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#6a6aa8]">No rising queries found</div>
          )}

          <div className="px-5 py-2 bg-[#0f0f24] text-[11px] text-[#6a6aa8] uppercase tracking-wider border-b border-[#2a2a5a]">
            Top
          </div>
          {related_queries?.top?.slice(0, 5).map((q, i) => (
            <div key={`t-${i}`} className="flex justify-between items-center px-5 py-2 border-b border-[#2a2a5a] hover:bg-[#1a1a2e]">
              <span className="text-[12px] text-[#e6f7ff]">{q.query}</span>
              {renderValue(q.value)}
            </div>
          ))}
          {(!related_queries?.top || related_queries.top.length === 0) && (
            <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#6a6aa8]">No top queries found</div>
          )}
        </div>

        {/* Right: Geographic Interest */}
        <div className="w-full md:w-1/2">
          <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#9aa4d6]">Geographic Interest</div>
          {geoEntries.map(([country, value], i) => (
            <div key={i} className="flex items-center px-5 py-2 border-b border-[#2a2a5a] hover:bg-[#1a1a2e]">
              <span className="w-6 text-[14px]">
                {/* Fallback to simple icon/emoji if real flag mapping isn't available */}
                🌎
              </span>
              <span className="text-[12px] text-[#e6f7ff] w-32 truncate mr-4">{country}</span>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-[60px] h-1.5 bg-[#1f1f3d] rounded-full overflow-hidden">
                  <div className="bg-[#ff006e] h-full" style={{ width: `${(value / maxGeoValue) * 100}%` }} />
                </div>
                <span className="text-[11px] text-[#9aa4d6]">{value}</span>
              </div>
            </div>
          ))}
          {geoEntries.length === 0 && (
             <div className="px-5 py-3 text-[12px] text-[#6a6aa8]">No geographic data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
