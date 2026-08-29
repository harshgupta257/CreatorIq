'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Bell, Info } from 'lucide-react';

export default function InstagramPage() {
  const features = [
    'Post & Reel performance breakdown',
    'Audience demographics',
    'Follower growth trajectory',
    'Cross-platform correlation with YouTube',
    'Best posting times',
    'Story & carousel analytics'
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0e] min-h-screen text-[#ededf0]">
      {/* Top Banner */}
      <div className="px-5 py-4 border-b border-[#222228] flex items-center justify-between sticky top-0 bg-[#0c0c0e]/90 backdrop-blur-sm z-10">
        <h1 className="text-[14px] font-semibold text-[#ededf0]">Instagram Analytics</h1>
        <span className="px-2 py-0.5 rounded-[4px] bg-[#5b6cf9]/10 text-[#5b6cf9] border border-[#5b6cf9]/20 text-[11px] font-medium flex items-center gap-1.5">
          <Info className="w-3 h-3" />
          Coming Soon
        </span>
      </div>

      {/* Main Content */}
      <div className="px-5 py-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
        
        {/* Left Side: Info */}
        <div className="w-full md:w-[40%] flex flex-col">
          <h2 className="text-[20px] font-semibold text-[#ededf0] mb-3">
            Unlock Cross-Platform Intelligence
          </h2>
          <p className="text-[13px] text-[#888892] mb-8 leading-relaxed">
            Connect your Instagram account to unlock a complete view of your creator ecosystem. See how your Reels perform alongside your Shorts and TikToks.
          </p>

          <div className="space-y-4 mb-8">
            <h3 className="text-[11px] font-medium text-[#50505a] uppercase tracking-wider mb-2">What you'll get</h3>
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                className="flex items-start gap-2.5"
              >
                <div className="mt-0.5 w-3.5 h-3.5 rounded-[3px] bg-[#3fb950]/10 flex items-center justify-center shrink-0 border border-[#3fb950]/20">
                  <Check className="w-2.5 h-2.5 text-[#3fb950]" />
                </div>
                <span className="text-[13px] text-[#888892]">{feature}</span>
              </motion.div>
            ))}
          </div>

          <button className="h-9 px-4 rounded-[5px] bg-[#1a1a1f] hover:bg-[#222228] border border-[#2d2d35] text-[#ededf0] text-[13px] font-medium flex items-center justify-center gap-2 transition-colors w-max">
            <Bell className="w-4 h-4 text-[#888892]" />
            Notify me when available
          </button>
        </div>

        {/* Right Side: Wireframe */}
        <div className="w-full md:w-[60%] flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 h-32 border border-[#222228] rounded-[6px] bg-[#111114] p-4 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#0c0c0e]/40 z-0 transition-opacity" />
              <div className="w-8 h-2 bg-[#1a1a1f] rounded-[2px] mb-2 relative z-10" />
              <div className="w-20 h-6 bg-[#1a1a1f] rounded-[3px] relative z-10" />
              <div className="w-full mt-auto h-12 flex items-end gap-1 opacity-20 relative z-10">
                {[40, 25, 60, 45, 80, 55, 90].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#888892] rounded-t-[2px]" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-[11px] font-medium text-[#50505a] tracking-wider uppercase bg-[#111114] px-2 py-1 rounded-[4px] border border-[#222228]">Follower Growth Chart</span>
              </div>
            </div>

            <div className="flex-1 h-32 border border-[#222228] rounded-[6px] bg-[#111114] p-4 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#0c0c0e]/40 z-0 transition-opacity" />
              <div className="w-8 h-2 bg-[#1a1a1f] rounded-[2px] mb-2 relative z-10" />
              <div className="w-20 h-6 bg-[#1a1a1f] rounded-[3px] relative z-10" />
              <div className="w-full mt-auto flex items-center gap-2 opacity-20 relative z-10">
                <div className="w-10 h-10 rounded-full border-[3px] border-[#888892] border-t-transparent" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="w-full h-1.5 bg-[#888892] rounded-[2px]" />
                  <div className="w-2/3 h-1.5 bg-[#888892] rounded-[2px]" />
                  <div className="w-1/2 h-1.5 bg-[#888892] rounded-[2px]" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-[11px] font-medium text-[#50505a] tracking-wider uppercase bg-[#111114] px-2 py-1 rounded-[4px] border border-[#222228]">Audience Demographics</span>
              </div>
            </div>
          </div>

          <div className="w-full h-64 border border-[#222228] rounded-[6px] bg-[#111114] p-4 flex flex-col relative overflow-hidden">
             <div className="absolute inset-0 bg-[#0c0c0e]/40 z-0" />
             <div className="w-32 h-3 bg-[#1a1a1f] rounded-[2px] mb-6 relative z-10" />
             
             <div className="flex-1 flex gap-4 opacity-20 relative z-10">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1 border border-[#2d2d35] rounded-[4px] p-3 flex flex-col gap-2">
                    <div className="w-full aspect-[4/5] bg-[#1a1a1f] rounded-[3px]" />
                    <div className="w-full h-2 bg-[#1a1a1f] rounded-[2px]" />
                    <div className="w-2/3 h-2 bg-[#1a1a1f] rounded-[2px]" />
                  </div>
                ))}
             </div>
             
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-[11px] font-medium text-[#50505a] tracking-wider uppercase bg-[#111114] px-2 py-1 rounded-[4px] border border-[#222228]">Top Performing Posts</span>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
