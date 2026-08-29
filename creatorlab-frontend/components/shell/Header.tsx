'use client';

import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCreatorStore } from '@/lib/store';
import { fetchChannel, fetchVideos, checkHealth } from '@/lib/api';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':             'Overview',
  '/dashboard/youtube':     'YouTube Analytics',
  '/dashboard/sentiment':   'Audience Sentiment',
  '/dashboard/predictions': 'Growth Predictions',
  '/dashboard/trends':      'Market Trends',
  '/dashboard/competitor':  'Competitor Intelligence',
  '/dashboard/instagram':   'Instagram',
  '/dashboard/settings':    'Settings',
};

const DATE_RANGES = ['7D', '30D', '90D', '1Y'] as const;

export function Header() {
  const pathname = usePathname();
  const store = useCreatorStore();
  const title = PAGE_TITLES[pathname ?? ''] ?? 'Dashboard';

  const [localInput, setLocalInput] = useState(store.channelInput ?? '');

  // Health check on mount
  useEffect(() => {
    checkHealth()
      .then((r) => store.setBackendOnline(r.success && r.data?.status === 'ok'))
      .catch(() => store.setBackendOnline(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnalyze() {
    const input = localInput.trim();
    if (!input) return;
    store.setChannelInput(input);
    store.setIsAnalyzing(true);
    try {
      const res = await fetchChannel(input);
      if (res.success && res.data) {
        store.setChannel(res.data);
        // Fetch videos in background — non-blocking
        fetchVideos(res.data.channel_id).then((r) => {
          if (r.success && r.data?.videos) store.setVideos(r.data.videos);
        });
      }
    } catch (e) {
      console.error('Analysis failed:', e);
    } finally {
      store.setIsAnalyzing(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAnalyze();
  }

  return (
    <header className="h-12 shrink-0 flex items-center gap-4 px-5 bg-[#0c0c0e] border-b border-[#222228]">
      {/* Page title */}
      <span className="text-[13px] font-medium text-[#ededf0] min-w-[160px] shrink-0">
        {title}
      </span>

      {/* Search + channel pill */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {store.channel && (
          <span className="text-[11px] text-[#888892] bg-[#111114] border border-[#222228] px-2 py-1 rounded-[4px] max-w-[180px] truncate shrink-0">
            {store.channel.title}
          </span>
        )}
        <input
          type="text"
          placeholder="Channel URL or @handle"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-[280px] h-8 bg-[#111114] border border-[#222228] rounded-[5px] text-[13px] text-[#ededf0] placeholder:text-[#50505a] px-3 outline-none focus:border-[#5b6cf9] transition-colors duration-100"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Date range */}
        <div className="flex bg-[#111114] border border-[#222228] rounded-[4px] overflow-hidden">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => store.setDateRange(r)}
              className={[
                'h-7 px-2.5 text-[11px] font-medium transition-colors duration-100 border-r border-[#222228] last:border-r-0',
                store.dateRange === r
                  ? 'bg-[#5b6cf9] text-white'
                  : 'text-[#888892] hover:text-[#ededf0] hover:bg-[#16161a]',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Analyze */}
        <button
          onClick={handleAnalyze}
          disabled={store.isAnalyzing}
          className="h-8 px-4 bg-[#5b6cf9] text-white text-[12px] font-medium rounded-[5px] hover:bg-[#4a5be8] disabled:opacity-50 transition-colors duration-100 flex items-center justify-center min-w-[80px]"
        >
          {store.isAnalyzing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : 'Analyze'
          }
        </button>
      </div>
    </header>
  );
}
