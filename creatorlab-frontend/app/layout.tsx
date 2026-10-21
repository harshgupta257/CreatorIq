import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistPixelSquare } from 'geist/font/pixel';
import './globals.css';

const title = 'CreatorIQ — Creator Intelligence Platform';
const description =
  'Neon-grade analytics for content creators. ML growth predictions, audience sentiment, competitor intelligence and Google Trends in one retro-futuristic command deck.';

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL('https://creator-iq-gules.vercel.app'),
  applicationName: 'CreatorIQ',
  keywords: [
    'creator analytics',
    'YouTube analytics',
    'sentiment analysis',
    'growth predictions',
    'competitor intelligence',
    'Google Trends',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'CreatorIQ',
    title,
    description,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistMono.variable} ${GeistPixelSquare.variable}`}>
      <body className="font-mono crt">
        {children}
      </body>
    </html>
  );
}
