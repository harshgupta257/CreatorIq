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
  compound?: number;
  label?: string;
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

export interface ViralScore {
  score: number;
  label: string;
  limited_data?: boolean;
}

export interface PostingTimeData {
  best_day: string;
  best_day_idx: number;
  best_hour_utc: number;
  based_on_videos: number;
  heatmap: Record<string, number>;
}

export interface TitleWord {
  word: string;
  avg_views: number;
  count: number;
}

export interface TitlePatternInsights {
  best_length_bucket: string;
  numbers_boost_pct: number;
  questions_boost_pct: number;
  has_colon_boost_pct: number;
  top_title_words: TitleWord[];
  best_example: { title: string; views: number };
  limited_data?: boolean;
}

export interface TopicPerformanceItem {
  topic: string;
  avg_views: number;
  video_count: number;
}

export interface DurationSweetSpot {
  best_range: string;
  recommendation: string;
}

export interface GrowthForecastPoint {
  week: number;
  cum_views: number;
}

export interface ForecastPoint {
  label: string;
  predicted_cum_views: number;
}

export interface GrowthForecast {
  slope_views_week: number;
  r2?: number;
  historical: GrowthForecastPoint[];
  forecast_points: ForecastPoint[];
}

export interface VideoPrediction {
  video_id: string;
  title: string;
  thumbnail: string;
  predicted_views: number;
  actual_views: number;
  confidence: number;
}

export interface ContentRecommendation {
  topic: string;
  reason: string;
  type: 'proven' | 'trending';
}

export interface TrainingResult {
  status: 'trained' | 'heuristic';
  r2_score?: number;
  samples?: number;
}

export interface PredictionsData {
  channel_id: string;
  video_count: number;
  limited_data: boolean;
  training_result: TrainingResult;
  viral_potential_score: ViralScore;
  recommended_posting_time: PostingTimeData;
  title_pattern_insights: TitlePatternInsights;
  topic_performance: TopicPerformanceItem[];
  duration_sweet_spot: DurationSweetSpot;
  growth_forecast: GrowthForecast;
  video_predictions: VideoPrediction[];
  recommended_topics: ContentRecommendation[];
  feature_importance?: Record<string, number>;
}

export interface TrendsDataPoint {
  date: string;
  [keyword: string]: number | string;
}

export interface RelatedQuery {
  query: string;
  value: number | string;
}

export interface TrendsData {
  keyword_used: string;
  query: string;
  keywords_in_data: string[];
  topic_keywords: string[];
  rate_limited: boolean;
  interest_over_time: TrendsDataPoint[];
  related_queries: { top: RelatedQuery[]; rising: RelatedQuery[] };
  geographic_interest: Record<string, number>;
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
  | 'predictions'
  | 'trends'
  | 'competitor'
  | 'instagram'
  | 'settings';

export type DateRange = '7D' | '30D' | '90D' | '1Y';
