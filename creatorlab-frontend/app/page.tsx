'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCreatorStore } from '@/lib/store';
import {
  ArrowRight, Menu, X, Zap, Check, Terminal, Play, Star, Quote,
  BrainCircuit, MessageSquareText, Crosshair, Mail, Shield, Activity,
} from 'lucide-react';

/* ───────────────────────── Content ───────────────────────── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Signals', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Launch', href: '#cta' },
];

const SOURCES = ['YOUTUBE DATA API', 'REDDIT', 'GOOGLE TRENDS', 'NEWS FEEDS', 'INSTAGRAM GRAPH', 'VADER NLP', 'PROPHET ML', 'COMPETITOR SCAN'];

const FEATURES = [
  {
    icon: BrainCircuit,
    tag: 'MODULE_01',
    title: 'Growth Forecasting',
    desc: 'Machine-learning models trained on your upload history project views and subscribers 12 weeks into the future — with confidence bands, not guesses.',
    stat: '12 WK',
    statLabel: 'forecast horizon',
    color: 'cyan' as const,
  },
  {
    icon: MessageSquareText,
    tag: 'MODULE_02',
    title: 'Sentiment Radar',
    desc: 'Every YouTube comment and Reddit thread about you, scored for mood and toxicity. Know how your audience feels before the numbers move.',
    stat: '10K+',
    statLabel: 'comments / scan',
    color: 'pink' as const,
  },
  {
    icon: Crosshair,
    tag: 'MODULE_03',
    title: 'Competitor Lock-On',
    desc: 'Put up to three rival channels side by side. Compare upload cadence and engagement, and spot the topic gaps they leave open for you.',
    stat: '3X',
    statLabel: 'channels compared',
    color: 'blue' as const,
  },
];

const TESTIMONIALS = [
  {
    quote: 'The forecast told me my Shorts pivot would plateau in week 6. It did — to the day. I re-planned and hit 100K two months early.',
    name: 'Maya Okafor',
    role: 'Tech reviewer · 412K subs',
    initials: 'MO',
    color: 'cyan' as const,
  },
  {
    quote: 'Sentiment Radar caught a brewing Reddit backlash before it reached my comments. That one alert saved a sponsorship.',
    name: 'Diego Ramírez',
    role: 'Gaming creator · 1.2M subs',
    initials: 'DR',
    color: 'pink' as const,
  },
  {
    quote: 'We manage nine channels. Competitor Lock-On replaced three spreadsheets and a weekly two-hour meeting. Pure signal.',
    name: 'Priya Nair',
    role: 'Head of Growth · Neon Pixel Media',
    initials: 'PN',
    color: 'blue' as const,
  },
];

const PLANS = [
  {
    name: 'Rookie',
    price: '0',
    period: 'forever',
    desc: 'For new creators running their first scans.',
    features: ['1 channel tracked', 'Overview + YouTube analytics', 'Weekly sentiment snapshot', 'Google Trends lookup', 'Community support'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Synth Pro',
    price: '19',
    period: '/ month',
    desc: 'The full command deck for growing channels.',
    features: ['5 channels tracked', '12-week ML growth forecasts', 'Real-time sentiment radar', 'Competitor Lock-On (3 rivals)', 'Content-gap reports', 'Priority email support'],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    name: 'Mainframe',
    price: '79',
    period: '/ month',
    desc: 'For agencies and multi-channel networks.',
    features: ['Unlimited channels', 'Team seats + roles', 'API access & CSV export', 'Custom alert webhooks', 'Dedicated success engineer'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Growth Predictions', href: '/dashboard/predictions' },
      { label: 'Sentiment Analysis', href: '/dashboard/sentiment' },
      { label: 'Competitor Intel', href: '/dashboard/competitor' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'YouTube Analytics Guide', href: '#features' },
      { label: 'Creator Growth Tools', href: '#features' },
      { label: 'Audience Sentiment 101', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', href: 'mailto:hello@creatoriq.app' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Status', href: '/dashboard/settings' },
    ],
  },
];

/* ───────────────────────── Icons (brand, Lucide-style strokes) ───────────────────────── */

type IconProps = { className?: string };

const YoutubeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);
const XIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M4 4l16 16M20 4 4 20" />
  </svg>
);
const GithubIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
const InstagramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
const LinkedinIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SOCIALS = [
  { label: 'YouTube', href: 'https://youtube.com', Icon: YoutubeIcon },
  { label: 'X (Twitter)', href: 'https://x.com', Icon: XIcon },
  { label: 'Instagram', href: 'https://instagram.com', Icon: InstagramIcon },
  { label: 'GitHub', href: 'https://github.com/harshgupta257/CreatorIq', Icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: LinkedinIcon },
];

/* ───────────────────────── Helpers ───────────────────────── */

const ACCENTS = {
  cyan: { text: 'neon-cyan', border: 'border-[#00ffff]', glow: 'box-glow-cyan', hex: '#00ffff' },
  pink: { text: 'neon-pink', border: 'border-[#ff006e]', glow: 'box-glow-pink', hex: '#ff006e' },
  blue: { text: 'neon-blue', border: 'border-[#0080ff]', glow: 'box-glow-blue', hex: '#0080ff' },
};

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
      <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.35em] uppercase neon-pink mb-5">
        <span className="w-6 h-px bg-[#ff006e]" /> {kicker} <span className="w-6 h-px bg-[#ff006e]" />
      </div>
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase neon-silver leading-tight mb-5">
        {title}
      </h2>
      <p className="text-sm md:text-base text-[#9aa4d6] leading-relaxed">{sub}</p>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 cursor-pointer transition-all duration-300">
      <span className="relative w-9 h-9 grid place-items-center border-2 border-[#00ffff] box-glow-cyan group-hover:border-[#ff006e] group-hover:shadow-[0_0_16px_#ff006e] transition-all duration-300">
        <Activity className="w-4 h-4 text-[#00ffff] group-hover:text-[#ff006e] transition-colors" />
      </span>
      <span className="font-display text-lg tracking-wider">
        <span className="text-white">CREATOR</span><span className="neon-pink">IQ</span>
      </span>
    </Link>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function LandingPage() {
  const router = useRouter();
  const setChannelInput = useCreatorStore((s) => s.setChannelInput);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleAnalyze() {
    const value = input.trim();
    if (value) setChannelInput(value);
    router.push('/dashboard');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAnalyze();
  }

  const channelInput = (id: string) => (
    <div className="relative w-full group">
      <label htmlFor={id} className="sr-only">YouTube channel handle</label>
      <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ffff] pointer-events-none" />
      <input
        id={id}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="> enter @channel_handle"
        className="w-full h-14 bg-black/70 border border-[#00ffff]/40 pl-11 pr-4 text-sm text-[#e6f7ff] placeholder:text-[#6a6aa8] outline-none transition-all duration-300 focus:border-[#00ffff] focus:shadow-[0_0_18px_rgba(0,255,255,0.45)] hover:border-[#00ffff]/70"
      />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-black text-[#e6f7ff] overflow-x-hidden font-mono">

      {/* ═════════ NAVBAR ═════════ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-md border-b border-[#ff006e]/40 shadow-[0_0_24px_rgba(255,0,110,0.25)]' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto h-16 md:h-20 px-5 md:px-8 flex items-center justify-between" aria-label="Primary">
          <Logo />

          <ul className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="relative text-xs uppercase tracking-[0.25em] text-[#9aa4d6] hover:text-[#00ffff] hover:[text-shadow:0_0_8px_#00ffff] transition-all duration-300 cursor-pointer after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-[#00ffff] after:shadow-[0_0_6px_#00ffff] after:transition-all after:duration-300 hover:after:w-full"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-xs uppercase tracking-[0.2em] text-[#c0c0c0] hover:text-white transition-all duration-300 cursor-pointer">
              Log in
            </Link>
            <button onClick={() => router.push('/dashboard')} className="btn-neon btn-neon-pink h-11 px-6 text-[11px]">
              Launch App <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            className="md:hidden w-11 h-11 grid place-items-center border border-[#00ffff]/50 text-[#00ffff] hover:bg-[#00ffff]/10 hover:shadow-[0_0_12px_#00ffff] transition-all duration-300 cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-b border-[#ff006e]/40 px-5 py-6 flex flex-col gap-5">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm uppercase tracking-[0.25em] text-[#9aa4d6] hover:text-[#00ffff] transition-all duration-300 cursor-pointer"
              >
                <span className="text-[#ff006e] mr-2">&gt;</span>{l.label}
              </a>
            ))}
            <button onClick={() => router.push('/dashboard')} className="btn-neon btn-neon-pink h-12 px-6 text-xs w-full mt-2">
              Launch App <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main>
        {/* ═════════ HERO ═════════ */}
        <section className="relative min-h-screen pt-28 md:pt-32 pb-16 overflow-hidden flex items-center" aria-labelledby="hero-title">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a1a2e_0%,#000_65%)]" />
          <div className="absolute inset-0 dot-matrix opacity-40" />
          <div className="absolute inset-x-0 bottom-0 h-[55%] overflow-hidden pointer-events-none">
            <div className="synth-floor" />
          </div>
          <div className="absolute inset-x-0 bottom-[55%] h-px bg-[#ff10f0] shadow-[0_0_20px_4px_rgba(255,16,240,0.7)]" />

          <div className="relative z-10 max-w-7xl mx-auto w-full px-5 md:px-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-6 items-center">
            {/* Copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 border border-[#00ffff]/40 bg-[#00ffff]/5 px-3 py-1.5 mb-8 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#00ffff]"
              >
                <span className="w-1.5 h-1.5 bg-[#00ff9f] shadow-[0_0_6px_#00ff9f] animate-pulse-dot" />
                System online · v2.6 · ML core loaded
              </motion.div>

              <motion.h1
                id="hero-title"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display uppercase leading-[0.95] text-[44px] sm:text-6xl md:text-7xl xl:text-[88px] mb-7"
              >
                <span className="glitch neon-silver" data-text="Decode">Decode</span>
                <br />
                <span className="glitch neon-cyan" data-text="your channel">your channel</span>
                <br />
                <span className="neon-pink">from the future</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-sm md:text-base text-[#9aa4d6] max-w-xl mx-auto lg:mx-0 leading-relaxed mb-9"
              >
                CreatorIQ pulls in YouTube, Reddit and Google Trends data and runs ML forecasts on it, so you can see where
                your audience is heading. Free to start, no signup needed<span className="blink text-[#00ffff]">_</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="max-w-xl mx-auto lg:mx-0 flex flex-col gap-4"
              >
                {channelInput('hero-channel')}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleAnalyze} className="btn-neon btn-neon-pink h-14 px-8 text-xs sm:flex-1">
                    <Zap className="w-4 h-4" /> Analyze Channel
                  </button>
                  <button onClick={() => router.push('/dashboard')} className="btn-neon btn-neon-ghost h-14 px-8 text-xs sm:flex-1">
                    <Play className="w-4 h-4" /> View Live Demo
                  </button>
                </div>
              </motion.div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                {[
                  { v: '50K+', l: 'Channels scanned', c: 'neon-cyan' },
                  { v: '6', l: 'Data sources', c: 'neon-pink' },
                  { v: '94%', l: 'Forecast accuracy', c: 'neon-gold' },
                ].map((s) => (
                  <div key={s.l} className="border-l-2 border-[#5d34d0] pl-3 text-left">
                    <div className={`font-display text-2xl md:text-3xl ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] uppercase tracking-widest text-[#6a6aa8] mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D / abstract visual */}
            <div className="relative h-[380px] sm:h-[460px] lg:h-[560px] flex items-center justify-center" aria-hidden>
              <div className="synth-sun absolute w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px]" />

              <div className="cube-scene relative animate-float [--cube-size:120px] sm:[--cube-size:150px]">
                <div className="cube">
                  <div className="cube-face f1" />
                  <div className="cube-face f2" />
                  <div className="cube-face f3" />
                  <div className="cube-face f4" />
                  <div className="cube-face f5" />
                  <div className="cube-face f6" />
                </div>
              </div>

              {/* Orbit ring */}
              <div className="absolute w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] border border-dashed border-[#00ffff]/30 rounded-full animate-[spin_40s_linear_infinite]">
                <span className="absolute -top-1.5 left-1/2 w-3 h-3 bg-[#00ffff] shadow-[0_0_12px_#00ffff]" />
              </div>

              {/* Floating HUD cards */}
              <div className="absolute top-4 left-0 sm:left-2 neon-card neon-card-corners px-4 py-3 animate-float [animation-delay:-2s]">
                <div className="text-[9px] uppercase tracking-[0.25em] text-[#6a6aa8]">Proj. views · 12wk</div>
                <div className="font-display text-xl neon-cyan mt-1">+218%</div>
                <svg viewBox="0 0 100 28" className="w-28 h-7 mt-1">
                  <polyline points="0,24 14,20 28,22 42,14 56,16 70,8 84,10 100,2" fill="none" stroke="#00ffff" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 3px #00ffff)' }} />
                </svg>
              </div>
              <div className="absolute bottom-10 right-0 sm:right-2 neon-card px-4 py-3 border-[#ff006e]/40 animate-float [animation-delay:-4s]">
                <div className="text-[9px] uppercase tracking-[0.25em] text-[#6a6aa8]">Audience mood</div>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {[40, 65, 50, 85, 70, 95].map((h, i) => (
                    <span key={i} className="w-2.5 bg-[#ff006e] shadow-[0_0_6px_#ff006e]" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="text-[10px] text-[#00ff9f] mt-1.5">82% POSITIVE</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════ SOURCE TICKER ═════════ */}
        <div className="relative border-y border-[#5d34d0]/60 bg-[#1a1a2e]/60 py-4 overflow-hidden" aria-label="Integrated data sources">
          <div className="flex w-max animate-marquee">
            {[...SOURCES, ...SOURCES].map((s, i) => (
              <span key={i} className="flex items-center gap-6 px-6 text-xs tracking-[0.35em] text-[#c0c0c0] whitespace-nowrap">
                {s}
                <span className="w-2 h-2 rotate-45 bg-[#ff006e] shadow-[0_0_8px_#ff006e]" />
              </span>
            ))}
          </div>
        </div>

        {/* ═════════ FEATURES ═════════ */}
        <section id="features" className="relative py-24 md:py-32 px-5 md:px-8 retro-grid-bg scroll-mt-20" aria-label="Features">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
          <div className="relative max-w-7xl mx-auto">
            <SectionTitle
              kicker="Core modules"
              title="Built for the creator economy"
              sub="Three modules that cover what your platform's built-in analytics don't."
            />

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {FEATURES.map((f, i) => {
                const a = ACCENTS[f.color];
                return (
                  <Reveal key={f.title} delay={i * 0.12}>
                    <article className="neon-card neon-card-corners group h-full p-7 md:p-8 flex flex-col cursor-pointer">
                      <div className="flex items-center justify-between mb-8">
                        <div className={`w-14 h-14 grid place-items-center border-2 ${a.border} ${a.glow} group-hover:rotate-[8deg] transition-all duration-300`}>
                          <f.icon className="w-6 h-6" style={{ color: a.hex }} />
                        </div>
                        <span className="text-[10px] tracking-[0.3em] text-[#6a6aa8]">{f.tag}</span>
                      </div>
                      <h3 className="font-display text-xl md:text-2xl uppercase text-white mb-4 group-hover:[text-shadow:0_0_10px_rgba(255,255,255,0.6)] transition-all duration-300">
                        {f.title}
                      </h3>
                      <p className="text-sm text-[#9aa4d6] leading-relaxed flex-1">{f.desc}</p>
                      <div className="mt-8 pt-5 border-t border-dashed border-[#3d3d80] flex items-end justify-between">
                        <div>
                          <div className={`font-display text-2xl ${a.text}`}>{f.stat}</div>
                          <div className="text-[10px] uppercase tracking-widest text-[#6a6aa8]">{f.statLabel}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#6a6aa8] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═════════ TESTIMONIALS ═════════ */}
        <section id="testimonials" className="relative py-24 md:py-32 px-5 md:px-8 bg-[#05050c] scroll-mt-20" aria-label="Testimonials">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00ffff] to-transparent opacity-60" />
          <div className="max-w-7xl mx-auto">
            <SectionTitle
              kicker="Incoming transmissions"
              title="Creators tuned in"
              sub="What creators say after their first month with the data."
            />

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {TESTIMONIALS.map((t, i) => {
                const a = ACCENTS[t.color];
                return (
                  <Reveal key={t.name} delay={i * 0.12}>
                    <figure className="neon-card h-full p-7 md:p-8 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <Quote className="w-8 h-8" style={{ color: a.hex, filter: `drop-shadow(0 0 6px ${a.hex})` }} />
                        <div className="flex gap-1" aria-label="5 out of 5 stars">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star key={s} className="w-3.5 h-3.5 fill-[#ffd700] text-[#ffd700]" />
                          ))}
                        </div>
                      </div>
                      <blockquote className="text-sm md:text-[15px] text-[#e6f7ff] leading-relaxed flex-1">
                        &ldquo;{t.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-8 flex items-center gap-4">
                        <span className={`w-12 h-12 grid place-items-center border-2 ${a.border} ${a.glow} font-display text-sm`} style={{ color: a.hex }}>
                          {t.initials}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-white">{t.name}</span>
                          <span className="block text-[11px] text-[#6a6aa8] tracking-wide">{t.role}</span>
                        </span>
                      </figcaption>
                    </figure>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═════════ PRICING ═════════ */}
        <section id="pricing" className="relative py-24 md:py-32 px-5 md:px-8 overflow-hidden scroll-mt-20" aria-label="Pricing">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(93,52,208,0.35)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto">
            <SectionTitle
              kicker="Select your tier"
              title="Pick your power level"
              sub="Start free and upgrade when you need more. Cancel anytime."
            />

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.12} className={p.highlight ? 'md:-my-6 relative z-10' : ''}>
                  <div
                    className={`relative h-full flex flex-col p-7 md:p-8 transition-all duration-300 cursor-pointer ${
                      p.highlight
                        ? 'bg-gradient-to-b from-[#2a0a3a] via-[#1a1a2e] to-black border-2 border-[#ff006e] shadow-[0_0_40px_rgba(255,0,110,0.45),inset_0_0_30px_rgba(255,0,110,0.12)] hover:shadow-[0_0_60px_rgba(255,0,110,0.65)] hover:-translate-y-1'
                        : 'neon-card'
                    }`}
                  >
                    {p.highlight && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ff006e] text-white text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 shadow-[0_0_16px_#ff006e] flex items-center gap-1.5 whitespace-nowrap">
                        <Zap className="w-3 h-3" /> Most popular
                      </div>
                    )}
                    <div className={`text-xs tracking-[0.3em] uppercase mb-3 ${p.highlight ? 'neon-pink' : 'text-[#00ffff]'}`}>{p.name}</div>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="font-display text-5xl md:text-6xl neon-silver">${p.price}</span>
                      <span className="text-xs text-[#6a6aa8] mb-2">{p.period}</span>
                    </div>
                    <p className="text-sm text-[#9aa4d6] mb-7">{p.desc}</p>
                    <ul className="flex flex-col gap-3.5 mb-9 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-[#e6f7ff]">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? 'text-[#ff006e]' : 'text-[#00ffff]'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => (p.name === 'Mainframe' ? (window.location.href = 'mailto:hello@creatoriq.app') : router.push('/dashboard'))}
                      className={`btn-neon h-12 px-6 text-[11px] w-full ${p.highlight ? 'btn-neon-pink' : 'btn-neon-ghost'}`}
                    >
                      {p.cta} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════ FINAL CTA ═════════ */}
        <section id="cta" className="relative py-24 md:py-32 px-5 md:px-8 scroll-mt-20" aria-label="Get started">
          <Reveal className="relative max-w-5xl mx-auto">
            <div className="relative overflow-hidden border-2 border-[#00ffff] shadow-[0_0_40px_rgba(0,255,255,0.35),inset_0_0_40px_rgba(0,255,255,0.08)] bg-black px-6 py-16 md:px-16 md:py-20 text-center">
              <div className="absolute inset-0 retro-grid-bg opacity-60" />
              <div className="absolute inset-0 hue-cycle pointer-events-none">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ff006e]/25 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#0080ff]/25 blur-3xl" />
              </div>

              <div className="relative">
                <div className="text-[11px] tracking-[0.35em] uppercase neon-gold mb-6">{'// Ready player one'}</div>
                <h2 className="font-display uppercase text-3xl sm:text-5xl md:text-6xl leading-tight mb-6">
                  <span className="glitch neon-silver" data-text="Your next">Your next</span>{' '}
                  <span className="neon-pink">breakout</span>
                  <br />
                  <span className="neon-cyan">starts now</span>
                </h2>
                <p className="text-sm md:text-base text-[#9aa4d6] max-w-xl mx-auto mb-10">
                  Enter any YouTube handle and get your first full analysis in under 30 seconds. No account, no credit card.
                </p>
                <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
                  {channelInput('cta-channel')}
                  <button onClick={handleAnalyze} className="btn-neon btn-neon-pink h-14 px-8 text-xs shrink-0">
                    Initialize <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-[#6a6aa8]">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#00ff9f]" /> Read-only access</span>
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#00ff9f]" /> Free forever tier</span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ═════════ FOOTER ═════════ */}
      <footer className="relative border-t border-[#ff006e]/50 bg-[#05050c] shadow-[0_-10px_40px_rgba(255,0,110,0.12)]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-[#0080ff] via-[#ff006e] to-[#00ffff]" />
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-16 pb-10">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-5 text-sm text-[#9aa4d6] leading-relaxed max-w-xs">
                Analytics, sentiment and forecasts for YouTube creators, built on ML.
              </p>
              <a
                href="mailto:hello@creatoriq.app"
                className="mt-6 inline-flex items-center gap-2 text-sm text-[#00ffff] hover:[text-shadow:0_0_8px_#00ffff] transition-all duration-300 cursor-pointer"
              >
                <Mail className="w-4 h-4" /> hello@creatoriq.app
              </a>
              <div className="mt-7 flex gap-3">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 grid place-items-center border border-[#3d3d80] text-[#9aa4d6] hover:text-[#00ffff] hover:border-[#00ffff] hover:shadow-[0_0_12px_rgba(0,255,255,0.6)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-xs uppercase tracking-[0.3em] neon-pink mb-5">{col.title}</h3>
                <ul className="flex flex-col gap-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-[#9aa4d6] hover:text-white hover:pl-1.5 transition-all duration-300 cursor-pointer"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-[#2a2a5a] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-widest text-[#6a6aa8]">
            <span>© 2026 CreatorIQ. All rights reserved.</span>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="/privacy" className="hover:text-[#00ffff] transition-all duration-300 cursor-pointer">Privacy Policy</a>
              <a href="/terms" className="hover:text-[#00ffff] transition-all duration-300 cursor-pointer">Terms of Use</a>
              <a href="mailto:hello@creatoriq.app" className="hover:text-[#00ffff] transition-all duration-300 cursor-pointer">Contact</a>
              <a href="/sitemap.xml" className="hover:text-[#00ffff] transition-all duration-300 cursor-pointer">Sitemap</a>
            </div>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00ff9f] shadow-[0_0_6px_#00ff9f]" /> All systems nominal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
