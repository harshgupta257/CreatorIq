'use client';

import React, { useEffect } from 'react';
import { useCreatorStore } from '@/lib/store';
import { fetchSentiment } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function SentimentPage() {
  const { channel, channelId, sentiment, setSentiment } = useCreatorStore();

  useEffect(() => {
    if (channelId && !sentiment) {
      fetchSentiment(channelId, channel?.title ?? '').then(r => {
        if (r.success) setSentiment(r.data);
      });
    }
  }, [channelId, sentiment, channel?.title, setSentiment]);

  if (!sentiment) {
    return (
      <div className="flex h-[400px] items-center justify-center text-[13px] text-[#9aa4d6]">
        {channelId ? 'Analyzing sentiment across platforms...' : 'Enter a channel to analyze sentiment'}
      </div>
    );
  }

  const sources = [
    { name: 'YouTube Comments', data: sentiment.youtube_sentiment },
    { name: 'Reddit Discussions', data: sentiment.reddit_sentiment, notConnected: !sentiment.reddit_connected },
    { name: 'News & Web', data: sentiment.news_sentiment },
  ];

  const getColor = (compound = 0) => {
    if (compound > 0.05) return 'text-[#00ff9f]';
    if (compound < -0.05) return 'text-[#ff3864]';
    return 'text-[#9aa4d6]';
  };

  const getWordColor = (count: number, maxCount: number) => {
    if (count > maxCount * 0.7) return 'text-[#e6f7ff]';
    if (count > maxCount * 0.3) return 'text-[#9aa4d6]';
    return 'text-[#6a6aa8]';
  };

  const maxWordCount = sentiment.word_frequency.length ? Math.max(...sentiment.word_frequency.map(w => w.count)) : 1;

  return (
    <div className="flex flex-col">
      {/* Section 1: Source Comparison */}
      <div className="flex border-b border-[#2a2a5a] divide-x divide-[#2a2a5a]">
        {sources.map((src, i) => (
          <div key={i} className="flex-1 px-5 py-4">
            <div className="text-[12px] font-medium text-[#9aa4d6] mb-1 flex items-center justify-between">
              {src.name}
              {src.notConnected && <span className="text-[11px] text-[#6a6aa8]">Not Connected</span>}
            </div>
            
            {src.notConnected ? (
              <div className="text-[28px] font-semibold text-[#6a6aa8] mt-2 mb-3">--</div>
            ) : (
              <div className={`text-[28px] font-semibold mt-2 mb-3 ${getColor(src.data?.compound)}`}>
                {src.data?.compound !== undefined ? Math.round(src.data.compound * 100) : '--'}
              </div>
            )}
            
            <div className="flex w-full h-[3px] bg-[#1f1f3d] rounded-full overflow-hidden mb-1.5">
              {!src.notConnected && src.data && (
                <>
                  <div style={{ width: `${src.data.positive_pct}%` }} className="bg-[#00ff9f] h-full" />
                  <div style={{ width: `${src.data.neutral_pct}%` }} className="bg-[#9aa4d6] h-full" />
                  <div style={{ width: `${src.data.negative_pct}%` }} className="bg-[#ff3864] h-full" />
                </>
              )}
            </div>
            <div className="flex justify-between text-[11px]">
              <span className={src.notConnected ? 'text-[#6a6aa8]' : 'text-[#00ff9f]'}>
                {src.notConnected || !src.data ? '--%' : `${Math.round(src.data.positive_pct)}%`}
              </span>
              <span className={src.notConnected ? 'text-[#6a6aa8]' : 'text-[#9aa4d6]'}>
                {src.notConnected || !src.data ? '--%' : `${Math.round(src.data.neutral_pct)}%`}
              </span>
              <span className={src.notConnected ? 'text-[#6a6aa8]' : 'text-[#ff3864]'}>
                {src.notConnected || !src.data ? '--%' : `${Math.round(src.data.negative_pct)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Two-column row */}
      <div className="flex border-b border-[#2a2a5a] flex-col md:flex-row">
        {/* Left: Word Frequency */}
        <div className="w-full md:w-1/2 border-r border-[#2a2a5a] flex flex-col">
          <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#9aa4d6]">Word Frequency</div>
          <div className="px-5 py-4 flex flex-wrap gap-1.5 flex-1">
            {sentiment.word_frequency?.map((word, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-[3px] border border-[#2a2a5a] bg-[#0f0f24] ${getWordColor(word.count, maxWordCount)}`}
                style={{ fontSize: `${Math.max(11, Math.min(14, 10 + (word.count / maxWordCount) * 4))}px` }}
              >
                {word.word}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Sentiment Over Time */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#9aa4d6]">Sentiment Over Time</div>
          <div className="h-[200px] w-full pt-4 pr-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentiment.sentiment_over_time}>
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9aa4d6' }} 
                  dy={10} 
                />
                <YAxis 
                  domain={[-1, 1]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9aa4d6' }} 
                  width={40} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f0f24', borderColor: '#2a2a5a', fontSize: '12px', color: '#e6f7ff', borderRadius: '4px' }}
                  itemStyle={{ color: '#ff006e' }}
                />
                <ReferenceLine y={0} stroke="#2a2a5a" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="average_compound" 
                  stroke="#ff006e" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4, fill: '#ff006e' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Comments */}
      <div className="flex flex-col md:flex-row">
        {/* Top Positive */}
        <div className="w-full md:w-1/2 border-r border-[#2a2a5a]">
          <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#9aa4d6]">Top Positive Comments</div>
          <div className="flex flex-col">
            {sentiment.combined_sentiment?.top_positive_comments?.map((comment, i) => (
              <div key={i} className="px-5 py-3 border-b border-[#2a2a5a] hover:bg-[#1a1a2e] transition-colors">
                <div className="text-[13px] text-[#e6f7ff] line-clamp-2 mb-2 leading-relaxed">"{comment.text}"</div>
                <div className="flex justify-between text-[11px] text-[#6a6aa8]">
                  <span>@{comment.author}</span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                    {comment.likes}
                  </span>
                </div>
              </div>
            ))}
            {(!sentiment.combined_sentiment?.top_positive_comments || sentiment.combined_sentiment.top_positive_comments.length === 0) && (
              <div className="px-5 py-4 text-[12px] text-[#6a6aa8]">No positive comments found.</div>
            )}
          </div>
        </div>

        {/* Top Critical */}
        <div className="w-full md:w-1/2">
          <div className="px-5 py-3 border-b border-[#2a2a5a] text-[12px] text-[#9aa4d6]">Top Critical Comments</div>
          <div className="flex flex-col">
            {sentiment.combined_sentiment?.top_negative_comments?.map((comment, i) => (
              <div key={i} className="px-5 py-3 border-b border-[#2a2a5a] hover:bg-[#1a1a2e] transition-colors">
                <div className="text-[13px] text-[#e6f7ff] line-clamp-2 mb-2 leading-relaxed">"{comment.text}"</div>
                <div className="flex justify-between text-[11px] text-[#6a6aa8]">
                  <span>@{comment.author}</span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                    {comment.likes}
                  </span>
                </div>
              </div>
            ))}
            {(!sentiment.combined_sentiment?.top_negative_comments || sentiment.combined_sentiment.top_negative_comments.length === 0) && (
              <div className="px-5 py-4 text-[12px] text-[#6a6aa8]">No critical comments found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
