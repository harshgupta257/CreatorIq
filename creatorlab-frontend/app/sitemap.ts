import type { MetadataRoute } from 'next';

const BASE = 'https://creator-iq-gules.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/dashboard', '/privacy', '/terms'].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.6,
  }));
}
