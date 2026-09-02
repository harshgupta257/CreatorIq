import type {
  ApiResponse,
  ChannelData,
  VideosResponse,
  SentimentData,
  PredictionsData,
  TrendsData,
  HealthData,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

async function get<T>(path: string, timeoutMs = 20000): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth(): Promise<ApiResponse<HealthData>> {
  return get<HealthData>('/api/health', 4000);
}

export async function fetchChannel(url: string): Promise<ApiResponse<ChannelData>> {
  return get<ChannelData>(`/api/youtube/channel?url=${encodeURIComponent(url)}`, 15000);
}

export async function fetchVideos(channelId: string): Promise<ApiResponse<VideosResponse>> {
  return get<VideosResponse>(`/api/youtube/videos?channel_id=${channelId}`, 20000);
}

export async function fetchSentiment(
  channelId: string,
  channelName: string
): Promise<ApiResponse<SentimentData>> {
  return get<SentimentData>(
    `/api/sentiment/analyze?channel_id=${channelId}&channel_name=${encodeURIComponent(channelName)}`,
    25000
  );
}

export async function fetchPredictions(channelId: string): Promise<ApiResponse<PredictionsData>> {
  return get<PredictionsData>(`/api/predictions?channel_id=${channelId}`, 25000);
}

export async function fetchTrends(
  query: string,
  channelId: string
): Promise<ApiResponse<TrendsData>> {
  return get<TrendsData>(
    `/api/trends?query=${encodeURIComponent(query)}&channel_id=${channelId}`,
    40000
  );
}
