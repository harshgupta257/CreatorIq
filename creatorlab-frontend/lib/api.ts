import type {
  ApiResponse,
  ChannelData,
  VideosResponse,
  SentimentData,
  InsightsData,
  TrendsData,
  HealthData,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export class ApiError extends Error {
  constructor(message: string, readonly kind: 'network' | 'timeout' | 'server') {
    super(message);
  }
}

/** True when the backend could not be reached at all. */
export function isNetworkError(e: unknown): boolean {
  return e instanceof ApiError && e.kind === 'network';
}

/** A message that is safe and useful to show the user. */
export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
}

/**
 * GET a backend endpoint. Backend errors come back as `{ success: false, error }`
 * so callers can show the server's message; only network failures, timeouts
 * and non-JSON responses throw an ApiError.
 */
async function get<T>(path: string, timeoutMs = 20000): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store' });
    } catch {
      if (controller.signal.aborted) {
        throw new ApiError('The request timed out. The server may be waking up, so try again in a moment.', 'timeout');
      }
      throw new ApiError("Can't reach the CreatorIQ server. Check your connection and try again.", 'network');
    }
    const body = await res.json().catch(() => null);
    if (body && typeof body.success === 'boolean') return body as ApiResponse<T>;
    throw new ApiError(`The server returned an unexpected response (HTTP ${res.status}).`, 'server');
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth(): Promise<ApiResponse<HealthData>> {
  // Long timeout: the free-tier backend can take ~30s to wake up
  return get<HealthData>('/api/health', 60000);
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

export async function fetchInsights(channelId: string, timeZone: string): Promise<ApiResponse<InsightsData>> {
  return get<InsightsData>(
    `/api/insights?channel_id=${channelId}&tz=${encodeURIComponent(timeZone)}`,
    45000
  );
}

export async function fetchTrends(
  query: string,
  channelId: string,
  range: string
): Promise<ApiResponse<TrendsData>> {
  return get<TrendsData>(
    `/api/trends?query=${encodeURIComponent(query)}&channel_id=${channelId}&range=${encodeURIComponent(range)}`,
    45000
  );
}
