import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:00 ${ampm}`;
}

export function formatPercent(n: number, decimals = 1): string {
  if (n == null || isNaN(n)) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function sentimentColor(compound: number): string {
  if (compound > 0.05) return 'var(--color-positive)';
  if (compound < -0.05) return 'var(--color-negative)';
  return 'var(--color-text-secondary)';
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    'A+': '#3fb950',
    'A': '#4ade80',
    'B': '#5b6cf9',
    'C': '#d29922',
    'D': '#f87171',
    'F': '#f85149',
  };
  return map[grade] ?? 'var(--color-text-secondary)';
}

export function calcEngagementRate(v: { like_count: number; comment_count: number; view_count: number }): number {
  if (!v.view_count) return 0;
  return ((v.like_count + v.comment_count) / v.view_count) * 100;
}

export function calcHealthScore(channel: {
  subscriber_count: number;
  view_count: number;
  video_count: number;
  published_at?: string;
}) {
  const avgViewsPerVideo = channel.video_count > 0 ? channel.view_count / channel.video_count : 0;
  const viewsPerSub = channel.subscriber_count > 0 ? channel.view_count / channel.subscriber_count : 0;
  
  // Age in months
  let uploadsPerMonth = 0;
  if (channel.published_at) {
    const ageMs = Date.now() - new Date(channel.published_at).getTime();
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30);
    uploadsPerMonth = ageMonths > 0 ? channel.video_count / ageMonths : 0;
  }

  // Score 0-100
  let score = 0;
  // Subscribers score
  if (channel.subscriber_count >= 1_000_000) score += 25;
  else if (channel.subscriber_count >= 100_000) score += 20;
  else if (channel.subscriber_count >= 10_000) score += 15;
  else if (channel.subscriber_count >= 1_000) score += 8;
  // Avg views/video score  
  if (avgViewsPerVideo >= 500_000) score += 25;
  else if (avgViewsPerVideo >= 100_000) score += 20;
  else if (avgViewsPerVideo >= 10_000) score += 12;
  else if (avgViewsPerVideo >= 1_000) score += 6;
  // Upload frequency
  if (uploadsPerMonth >= 8) score += 20;
  else if (uploadsPerMonth >= 4) score += 15;
  else if (uploadsPerMonth >= 2) score += 10;
  else if (uploadsPerMonth >= 1) score += 5;
  // Views/sub ratio
  if (viewsPerSub >= 50) score += 15;
  else if (viewsPerSub >= 20) score += 10;
  else if (viewsPerSub >= 5) score += 6;

  const grade =
    score >= 80 ? 'A+' :
    score >= 70 ? 'A' :
    score >= 55 ? 'B' :
    score >= 40 ? 'C' :
    score >= 25 ? 'D' : 'F';

  return { grade, score, avgViewsPerVideo, uploadsPerMonth, viewsPerSubscriber: viewsPerSub } as const;
}
