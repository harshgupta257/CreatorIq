// All TypeScript interfaces matching the Flask backend response schemas

export interface ChannelData {
  channel_id: string;
  title: string;
  description: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  published_at: string;
  thumbnail: string;
  custom_url: string;
  country?: string;
}

export interface VideoData {
  video_id: string;
  title: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration: number;
  thumbnail: string;
  tags: string[];
}

export interface PostingFrequency {
  posts_per_week?: number;
  best_days: string[];
  day_distribution: Record<string, number>;
}

export interface BestPostingTime {
  best_hour: number;
  best_day?: string;
  avg_views_by_hour?: Record<string, number>;
}

export interface VideosResponse {
  videos: VideoData[];
  engagement_rate: { average_engagement_rate: number };
  posting_frequency: PostingFrequency;
  best_posting_times: BestPostingTime;
}

export interface SentimentBreakdown {
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  /** Per-source score (-1..1) */
  average_compound?: number;
  /** Score of the weighted combination of sources (-1..1) */
  combined_compound?: number;
  overall_label?: string;
  sample_count?: number;
  top_positive_comments?: CommentData[];
  top_negative_comments?: CommentData[];
}

export interface CommentData {
  text: string;
  author: string;
  likes: number;
}

export interface WordFrequencyItem {
  word: string;
  count: number;
}

export interface SentimentTimePoint {
  period: string;
  average_compound: number;
  label: string;
  count: number;
}

export interface SentimentData {
  youtube_sentiment: SentimentBreakdown;
  reddit_sentiment: SentimentBreakdown;
  news_sentiment: SentimentBreakdown;
  combined_sentiment: SentimentBreakdown;
  reddit_connected: boolean;
  word_frequency: WordFrequencyItem[];
  sentiment_over_time: SentimentTimePoint[];
}

// ── Performance Insights ──────────────────────────────────────────────────────
// "ratio" everywhere = a video's views ÷ the channel's typical video of the same
// age and format (1.0 = typical, 2.0 = twice the usual views).

export type Verdict = 'clear' | 'none' | 'insufficient';

export interface ExpectedViews {
  format: 'long' | 'short';
  label: string;
  days: number;
  low: number;
  typical: number;
  high: number;
  based_on: number;
}

export interface MomentumPoint {
  date: string;
  video_id: string;
  title: string;
  ratio: number;
  /** Rolling median of 5 videos */
  trend: number;
  format: 'long' | 'short';
}

export interface Momentum {
  verdict: 'improving' | 'declining' | 'steady';
  change: number;
  recent_count: number;
  earlier_count: number;
  p_value: number;
  series: MomentumPoint[];
}

export interface OutlierVideo {
  video_id: string;
  title: string;
  thumbnail: string;
  view_count: number;
  ratio: number;
  age_days: number;
  format: 'long' | 'short';
}

export interface SharedTrait {
  text: string;
  kind: 'tag' | 'format' | 'length' | 'title';
  top_count: number;
  top_total: number;
  /** % of the other videos that have it */
  rest_share: number;
}

export interface FactorGroup {
  label: string;
  n: number;
  median_ratio: number;
}

export interface Factor {
  key: string;
  name: string;
  groups: FactorGroup[];
  verdict: Verdict;
  best: string | null;
  effect: number | null;
  /** False-discovery-rate adjusted */
  p_value: number | null;
}

export interface TopicEffect {
  topic: string;
  n: number;
  effect: number;
  verdict: Verdict;
  p_value: number;
}

export interface HeatmapCell {
  day: number;
  block: number;
  n: number;
  median_ratio: number;
}

export interface ModelDriver {
  label: string;
  share: number;
  direction: 'up' | 'down' | 'mixed';
}

export interface DriversModel {
  status: 'reliable' | 'not_reliable' | 'insufficient_data';
  n: number;
  min_videos?: number;
  improvement_pct?: number;
  mae_model?: number;
  mae_baseline?: number;
  drivers?: ModelDriver[];
}

export interface GrowthSnapshot {
  date: string;
  subscribers: number;
  views: number;
  videos: number;
}

export interface InsightsData {
  channel_id: string;
  status: 'ok' | 'insufficient_data';
  timezone: string;
  videos_fetched: number;
  videos_scored: number;
  min_videos: number;
  long_count?: number;
  short_count?: number;
  min_age_days?: number;
  expected_next?: ExpectedViews[];
  momentum?: Momentum;
  outliers?: {
    top: OutlierVideo[];
    bottom: OutlierVideo[];
    top_share_traits: SharedTrait[];
    top_group_size: number;
  };
  what_works?: {
    factors: Factor[];
    heatmap: HeatmapCell[];
    time_blocks: string[];
    topics: TopicEffect[];
  };
  model?: DriversModel;
  growth: {
    storage: 'database' | 'local_file';
    history: GrowthSnapshot[];
    tracking_since: string | null;
  };
}

export interface TrendsDataPoint {
  date: string;
  [keyword: string]: number | string;
}

export interface RelatedQuery {
  query: string;
  value: number | string;
  /** The topic phrase this query is related to */
  keyword?: string;
}

export interface TrendVideo {
  video_id: string;
  title: string;
  channel_id: string;
  channel_title: string;
  published_at: string;
  view_count: number;
  like_count: number;
  thumbnail: string;
}

export interface GeoInterest {
  country: string;
  /** ISO 3166 alpha-2 code, used for the flag */
  code: string;
  value: number;
}

export interface ContentGap {
  topic: string;
  source: 'youtube_niche' | 'google_rising';
  /** youtube_niche: how many hot niche videos share this topic, and their views */
  video_count?: number;
  total_views?: number;
  example?: { video_id: string; title: string; channel_title: string; view_count: number };
  /** google_rising: search growth in percent (Google shows ≥5000 as "Breakout") */
  growth?: number;
}

/** ok · partial data with quota_cap / quota_exceeded / error explaining what is missing */
export type YouTubeSourceStatus = 'ok' | 'quota_cap' | 'quota_exceeded' | 'error';
export type GoogleTrendsStatus = 'ok' | 'no_data' | 'rate_limited' | 'unavailable';

export interface TrendsData {
  query: string;
  range: string;
  timeframe: string;
  keyword_used: string;
  /** The channel's main topics as search phrases */
  topic_keywords: string[];
  google_trends_status: GoogleTrendsStatus;
  google_trends_cached: boolean;
  rate_limited: boolean;
  keywords_in_data: string[];
  interest_over_time: TrendsDataPoint[];
  related_queries: { top: RelatedQuery[]; rising: RelatedQuery[] };
  geographic_interest: GeoInterest[];
  youtube_trending: {
    region: string;
    category_id: string;
    category_name: string;
    videos: TrendVideo[];
    status: YouTubeSourceStatus;
  };
  niche: {
    window_days: number;
    topics: { topic: string; videos: TrendVideo[] }[];
    status: YouTubeSourceStatus;
    resets_at: string | null;
  };
  content_gaps: ContentGap[];
  word_frequency: WordFrequencyItem[];
}

export interface CompetitorData {
  channel_id: string;
  title: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  thumbnail: string;
  custom_url?: string;
  published_at?: string;
  videos?: VideoData[];
  healthScore?: ChannelHealthScore;
}

export interface ChannelHealthScore {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  avgViewsPerVideo: number;
  uploadsPerMonth: number;
  viewsPerSubscriber: number;
}

export interface HealthData {
  status: string;
  api_keys_configured: {
    youtube: boolean;
    reddit: boolean;
    news: boolean;
    instagram: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export type TabId =
  | 'overview'
  | 'youtube'
  | 'sentiment'
  | 'insights'
  | 'trends'
  | 'competitor'
  | 'instagram'
  | 'settings';

export type DateRange = '7D' | '30D' | '90D' | '1Y';
