'use client';

import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCreatorStore } from '@/lib/store';
import { fetchChannel, fetchVideos, checkHealth, errorMessage, isNetworkError } from '@/lib/api';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':             'Overview',
  '/dashboard/youtube':     'YouTube Analytics',
  '/dashboard/sentiment':   'Audience Sentiment',
  '/dashboard/insights':    'Performance Insights',
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
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Health check on mount
  useEffect(() => {
    // A failed check only marks the backend offline while it is still
    // 'connecting': it must not override real data that has already loaded.
    const markOffline = () => {
      if (useCreatorStore.getState().backendStatus === 'connecting') store.setBackendStatus('offline');
    };
    checkHealth()
      .then((r) => {
        if (r.success && ['healthy', 'ok'].includes(r.data?.status ?? '')) store.setBackendStatus('online');
        else markOffline();
      })
      .catch(markOffline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnalyze() {
    const input = localInput.trim();
    if (!input) return;
    store.setChannelInput(input);
    store.setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetchChannel(input);
      if (res.success && res.data) {
        store.setChannel(res.data);
        // Fetch videos in background — non-blocking; ignore it if the user
        // has moved on to another channel by the time it returns
        const id = res.data.channel_id;
        fetchVideos(id)
          .then((r) => {
            if (r.success && r.data?.videos && useCreatorStore.getState().channelId === id) {
              store.setVideos(r.data.videos);
            }
          })
          .catch(() => {});
      } else {
        setAnalyzeError(res.error || 'Channel not found.');
      }
    } catch (e) {
      if (isNetworkError(e)) store.setBackendStatus('offline');
      setAnalyzeError(errorMessage(e));
    } finally {
      store.setIsAnalyzing(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAnalyze();
  }

  return (
    <header className="h-12 shrink-0 flex items-center gap-4 px-5 bg-black/80 backdrop-blur-sm border-b border-[#00ffff]/30 shadow-[0_4px_20px_rgba(0,255,255,0.08)]">
      {/* Page title */}
      <span className="font-display text-[14px] uppercase tracking-wider neon-cyan min-w-[160px] shrink-0">
        {title}
      </span>

      {/* Search + channel pill */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {store.channel && (
          <span className="text-[11px] text-[#9aa4d6] bg-[#0f0f24] border border-[#2a2a5a] px-2 py-1 rounded-[4px] max-w-[180px] truncate shrink-0">
            {store.channel.title}
          </span>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder="Channel URL or @handle"
            value={localInput}
            onChange={(e) => { setLocalInput(e.target.value); setAnalyzeError(null); }}
            onKeyDown={handleKeyDown}
            aria-invalid={analyzeError ? true : undefined}
            className={[
              'w-[280px] h-8 bg-[#0f0f24] border rounded-[5px] text-[13px] text-[#e6f7ff] placeholder:text-[#6a6aa8] px-3 outline-none focus:border-[#00ffff] focus:shadow-[0_0_12px_rgba(0,255,255,0.4)] transition-all duration-200',
              analyzeError ? 'border-[#ff3864]' : 'border-[#2a2a5a]',
            ].join(' ')}
          />
          {analyzeError && (
            <p role="alert" className="absolute left-0 top-full mt-1 z-20 w-[280px] text-[11px] text-[#ff3864] bg-black/90 border border-[#ff3864]/40 rounded-[4px] px-2 py-1">
              {analyzeError}
            </p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Date range */}
        <div className="flex bg-[#0f0f24] border border-[#2a2a5a] rounded-[4px] overflow-hidden">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => store.setDateRange(r)}
              className={[
                'h-7 px-2.5 text-[11px] font-medium transition-colors duration-100 border-r border-[#2a2a5a] last:border-r-0',
                store.dateRange === r
                  ? 'bg-[#ff006e] text-white shadow-[0_0_10px_#ff006e]'
                  : 'text-[#9aa4d6] hover:text-[#e6f7ff] hover:bg-[#1a1a2e]',
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
          className="h-8 px-4 bg-[#ff006e] text-white text-[12px] font-medium rounded-[5px] hover:bg-[#ff10f0] hover:shadow-[0_0_16px_#ff006e] shadow-[0_0_10px_rgba(255,0,110,0.6)] uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all duration-200 flex items-center justify-center min-w-[80px]"
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
