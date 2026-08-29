'use client';

import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, BarChart2, MessageSquare, TrendingUp, Search, Layers, Camera } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const lenisRef = useRef<Lenis | null>(null);
  const router = useRouter();
  const [input, setInput] = useState('');

  useEffect(() => {
    const lenis = new Lenis({ 
      duration: 1.2, 
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) 
    });
    lenisRef.current = lenis;
    
    function raf(time: number) { 
      lenis.raf(time); 
      requestAnimationFrame(raf); 
    }
    
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  function handleAnalyze() {
    if (!input.trim()) return;
    localStorage.setItem('creatoriq-channel-input', input);
    router.push('/dashboard');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAnalyze();
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#ededf0] selection:bg-[#5b6cf9]/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-12 border-b border-[#222228] bg-[#0c0c0e]/95 backdrop-blur-sm z-50 flex items-center justify-between px-6">
        <div className="text-[13px] font-semibold tracking-wide">CreatorIQ</div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-[12px] font-medium text-[#ededf0] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#5b6cf9]/10 border border-[#5b6cf9]/20 hover:bg-[#5b6cf9]/20 transition-colors"
        >
          Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="min-h-[100vh] pt-12 flex flex-col md:flex-row items-center relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02] pointer-events-none" />

        <div className="w-full md:w-[55%] px-8 lg:px-16 xl:px-24 flex flex-col justify-center z-10 py-20 md:py-0">
          <div className="text-[11px] tracking-[0.2em] text-[#50505a] uppercase font-medium mb-6">
            Creator Intelligence Platform
          </div>
          
          <h1 className="text-[36px] md:text-[44px] lg:text-[52px] font-semibold text-[#ededf0] leading-[1.1] tracking-tight mb-6">
            Your channel data,<br />analyzed at depth.
          </h1>
          
          <p className="text-[14px] text-[#888892] max-w-[400px] leading-relaxed mb-8">
            CreatorIQ connects YouTube, Reddit, and Google Trends to give you analytics your platform doesn't provide.
          </p>
          
          <div className="max-w-[400px] w-full">
            <div className="flex h-10 w-full mb-3 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="YouTube Channel Handle (e.g. @mkbhd)"
                className="flex-1 h-full bg-[#111114] border border-r-0 border-[#2d2d35] rounded-l-[5px] px-3 text-[13px] text-[#ededf0] placeholder:text-[#50505a] focus:outline-none focus:border-[#5b6cf9] focus:ring-1 focus:ring-[#5b6cf9]/50 transition-all"
              />
              <button 
                onClick={handleAnalyze}
                className="h-full px-5 bg-[#5b6cf9] hover:bg-[#4a58d1] text-white text-[13px] font-medium rounded-r-[5px] transition-colors flex items-center gap-1.5"
              >
                Analyze <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[12px] text-[#50505a]">
              No account required. Enter any YouTube channel handle.
            </div>
          </div>
        </div>

        <div className="w-full md:w-[45%] h-[600px] md:h-screen flex items-center justify-start md:justify-end md:pr-12 lg:pr-24 relative z-10 opacity-90 md:opacity-100 hidden sm:flex">
          {/* UI Preview Art */}
          <div className="w-full max-w-[500px] h-[500px] bg-[#0c0c0e] border border-[#222228] rounded-[6px] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-8 border-b border-[#222228] bg-[#111114] flex items-center px-3 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2d2d35]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2d2d35]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2d2d35]" />
            </div>
            
            <div className="p-5 pt-12 flex-1 flex flex-col gap-4">
              {/* Header block */}
              <div className="flex items-center gap-4 border-b border-[#222228] pb-4">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1f] border border-[#2d2d35]" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="w-1/3 h-3 bg-[#ededf0] rounded-[2px]" />
                  <div className="w-1/4 h-2 bg-[#50505a] rounded-[2px]" />
                </div>
              </div>

              {/* Metric strip */}
              <div className="flex gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-1 bg-[#111114] border border-[#222228] rounded-[4px] p-3 flex flex-col gap-2">
                    <div className="w-1/2 h-1.5 bg-[#50505a] rounded-[2px]" />
                    <div className="w-3/4 h-4 bg-[#ededf0] rounded-[2px]" />
                  </div>
                ))}
              </div>

              {/* Chart Block */}
              <div className="flex-1 bg-[#111114] border border-[#222228] rounded-[4px] p-4 flex flex-col gap-3">
                <div className="w-1/4 h-2 bg-[#50505a] rounded-[2px]" />
                <div className="flex-1 flex items-end gap-1.5 mt-4">
                  {[20, 35, 25, 45, 60, 50, 75, 65, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#5b6cf9]/80 rounded-t-[2px]" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Overlay gradient to fade out bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0c0c0e] to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-[#222228] bg-[#0c0c0e] flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-[#222228]">
        {[
          { stat: "50K+", label: "Creators Analyzed" },
          { stat: "6", label: "Data Sources" },
          { stat: "ML", label: "Predictions" },
          { stat: "Live", label: "Real-time Analysis" }
        ].map((item, i) => (
          <div key={i} className="w-1/2 md:flex-1 px-8 py-6 flex flex-col">
            <span className="text-[20px] font-semibold text-[#ededf0]">{item.stat}</span>
            <span className="text-[11px] text-[#50505a] mt-1 uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 md:px-16 max-w-5xl mx-auto">
        <div className="mb-12">
          <h2 className="text-[24px] font-semibold text-[#ededf0] tracking-tight mb-2">What CreatorIQ provides</h2>
          <p className="text-[14px] text-[#888892]">Analytics your platform doesn't give you.</p>
        </div>

        <div className="flex flex-col">
          {[
            {
              icon: TrendingUp,
              title: "ML Growth Predictions",
              desc: "Forecast next 12 weeks using your historical data.",
              status: "Available"
            },
            {
              icon: MessageSquare,
              title: "Sentiment Analysis",
              desc: "YouTube comments + Reddit discussions analyzed for audience sentiment.",
              status: "Available"
            },
            {
              icon: Layers,
              title: "Competitor Intelligence",
              desc: "Compare up to 3 channels side-by-side on key performance metrics.",
              status: "Available"
            },
            {
              icon: Search,
              title: "Google Trends Integration",
              desc: "Track your channel's topic popularity over time globally.",
              status: "Available"
            },
            {
              icon: BarChart2,
              title: "Content Gap Analysis",
              desc: "Find topics competitors cover that you don't.",
              status: "Available"
            },
            {
              icon: Camera,

              title: "Instagram Analytics",
              desc: "Cross-platform analytics bridging YouTube and Meta ecosystems.",
              status: "Coming Soon"
            }
          ].map((feat, i) => (
            <div key={i} className="flex items-start gap-6 md:gap-8 py-8 border-b border-[#222228] last:border-0 hover:bg-[#111114]/50 transition-colors px-4 -mx-4 rounded-[6px]">
              <div className="bg-[#111114] border border-[#2d2d35] rounded-[6px] p-2.5 shrink-0">
                <feat.icon className="w-5 h-5 text-[#ededf0]" />
              </div>
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#ededf0] mb-1">{feat.title}</h3>
                  <p className="text-[13px] text-[#888892]">{feat.desc}</p>
                </div>
                <div className="shrink-0">
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-[4px] border ${
                    feat.status === 'Available' 
                      ? 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20' 
                      : 'bg-[#5b6cf9]/10 text-[#5b6cf9] border-[#5b6cf9]/20'
                  }`}>
                    {feat.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-[#222228] bg-[#111114] flex flex-col items-center justify-center px-6">
        <h2 className="text-[28px] font-semibold text-[#ededf0] tracking-tight mb-8 text-center">
          Start analyzing
        </h2>
        
        <div className="max-w-[400px] w-full flex flex-col items-center">
          <div className="flex h-10 w-full mb-4 shadow-lg">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YouTube Channel Handle"
              className="flex-1 h-full bg-[#0c0c0e] border border-r-0 border-[#2d2d35] rounded-l-[5px] px-3 text-[13px] text-[#ededf0] placeholder:text-[#50505a] focus:outline-none focus:border-[#5b6cf9] focus:ring-1 focus:ring-[#5b6cf9]/50 transition-all"
            />
            <button 
              onClick={handleAnalyze}
              className="h-full px-5 bg-[#5b6cf9] hover:bg-[#4a58d1] text-white text-[13px] font-medium rounded-r-[5px] transition-colors flex items-center gap-1.5"
            >
              Analyze <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[12px] text-[#50505a]">Free — No signup required</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#222228] py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0c0c0e]">
        <div className="text-[12px] text-[#50505a]">
          CreatorIQ — Creator Intelligence Platform
        </div>
        <div className="text-[12px] text-[#50505a]">
          © 2026 CreatorIQ
        </div>
      </footer>
    </div>
  );
}
