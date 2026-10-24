'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChannelData,
  VideoData,
  SentimentData,
  InsightsData,
  TrendsData,
  CompetitorData,
  DateRange,
} from './types';

export type BackendStatus = 'connecting' | 'online' | 'offline';

interface CreatorStore {
  // Channel
  channelInput: string;
  channelId: string | null;
  channel: ChannelData | null;

  // Loaded data
  videos: VideoData[];
  sentiment: SentimentData | null;
  insights: InsightsData | null;
  trends: TrendsData | null;
  competitors: CompetitorData[];

  // UI state
  isAnalyzing: boolean;
  instagramConnected: boolean;
  backendStatus: BackendStatus;
  dateRange: DateRange;
  dataLoadedAt: number | null;

  // Actions
  setChannelInput: (input: string) => void;
  setChannel: (ch: ChannelData) => void;
  setVideos: (v: VideoData[]) => void;
  setSentiment: (s: SentimentData) => void;
  setInsights: (i: InsightsData) => void;
  setTrends: (t: TrendsData) => void;
  setCompetitors: (c: CompetitorData[]) => void;
  addCompetitor: (c: CompetitorData) => void;
  removeCompetitor: (id: string) => void;
  setIsAnalyzing: (b: boolean) => void;
  setBackendStatus: (s: BackendStatus) => void;
  setDateRange: (r: DateRange) => void;
  reset: () => void;
}

const initialState = {
  channelInput: '',
  channelId: null,
  channel: null,
  videos: [],
  sentiment: null,
  insights: null,
  trends: null,
  competitors: [],
  isAnalyzing: false,
  instagramConnected: false,
  backendStatus: 'connecting' as BackendStatus,
  dateRange: '30D' as DateRange,
  dataLoadedAt: null,
};

export const useCreatorStore = create<CreatorStore>()(
  persist(
    (set) => ({
      ...initialState,

      setChannelInput: (input) => set({ channelInput: input }),
      // Real data arriving from the backend proves it is online.
      // A different channel drops the previous channel's results.
      setChannel: (ch) =>
        set((state) => ({
          channel: ch,
          channelId: ch.channel_id,
          backendStatus: 'online',
          ...(state.channelId !== ch.channel_id
            ? { videos: [], sentiment: null, insights: null, trends: null }
            : {}),
        })),
      setVideos: (v) => set({ videos: v, backendStatus: 'online' }),
      setSentiment: (s) => set({ sentiment: s, backendStatus: 'online' }),
      setInsights: (i) => set({ insights: i, backendStatus: 'online' }),
      setTrends: (t) => set({ trends: t, backendStatus: 'online' }),
      setCompetitors: (c) => set({ competitors: c }),
      addCompetitor: (c) =>
        set((state) => ({
          competitors:
            state.competitors.length < 3 && !state.competitors.find((x) => x.channel_id === c.channel_id)
              ? [...state.competitors, c]
              : state.competitors,
        })),
      removeCompetitor: (id) =>
        set((state) => ({ competitors: state.competitors.filter((c) => c.channel_id !== id) })),
      setIsAnalyzing: (b) => set({ isAnalyzing: b }),
      setBackendStatus: (s) => set({ backendStatus: s }),
      setDateRange: (r) => set({ dateRange: r }),
      reset: () => set(initialState),
    }),
    {
      name: 'creatoriq-store',
      partialize: (state) => ({
        channelInput: state.channelInput,
        channelId: state.channelId,
        channel: state.channel,
        dataLoadedAt: state.dataLoadedAt,
      }),
    }
  )
);
