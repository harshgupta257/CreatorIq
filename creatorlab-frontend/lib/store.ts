'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChannelData,
  VideoData,
  SentimentData,
  PredictionsData,
  TrendsData,
  CompetitorData,
  DateRange,
} from './types';

interface CreatorStore {
  // Channel
  channelInput: string;
  channelId: string | null;
  channel: ChannelData | null;

  // Loaded data
  videos: VideoData[];
  sentiment: SentimentData | null;
  predictions: PredictionsData | null;
  trends: TrendsData | null;
  competitors: CompetitorData[];

  // UI state
  isAnalyzing: boolean;
  instagramConnected: boolean;
  backendOnline: boolean;
  dateRange: DateRange;
  dataLoadedAt: number | null;

  // Actions
  setChannelInput: (input: string) => void;
  setChannel: (ch: ChannelData) => void;
  setVideos: (v: VideoData[]) => void;
  setSentiment: (s: SentimentData) => void;
  setPredictions: (p: PredictionsData) => void;
  setTrends: (t: TrendsData) => void;
  setCompetitors: (c: CompetitorData[]) => void;
  addCompetitor: (c: CompetitorData) => void;
  removeCompetitor: (id: string) => void;
  setIsAnalyzing: (b: boolean) => void;
  setBackendOnline: (b: boolean) => void;
  setDateRange: (r: DateRange) => void;
  reset: () => void;
}

const initialState = {
  channelInput: '',
  channelId: null,
  channel: null,
  videos: [],
  sentiment: null,
  predictions: null,
  trends: null,
  competitors: [],
  isAnalyzing: false,
  instagramConnected: false,
  backendOnline: false,
  dateRange: '30D' as DateRange,
  dataLoadedAt: null,
};

export const useCreatorStore = create<CreatorStore>()(
  persist(
    (set) => ({
      ...initialState,

      setChannelInput: (input) => set({ channelInput: input }),
      setChannel: (ch) => set({ channel: ch, channelId: ch.channel_id }),
      setVideos: (v) => set({ videos: v }),
      setSentiment: (s) => set({ sentiment: s }),
      setPredictions: (p) => set({ predictions: p }),
      setTrends: (t) => set({ trends: t }),
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
      setBackendOnline: (b) => set({ backendOnline: b }),
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
