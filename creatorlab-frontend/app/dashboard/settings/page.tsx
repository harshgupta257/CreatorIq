'use client';

import React, { useState } from 'react';
import { Play, Activity, Camera, Link2, Unlink } from 'lucide-react';
import { useCreatorStore } from '@/lib/store';
import type { DateRange } from '@/lib/types';



// A simple Reddit icon component since it's not always in lucide-react default set
const RedditIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 8v4"></path>
  </svg>
);

export default function SettingsPage() {
  const channel = useCreatorStore(state => state.channel);
  const { dateRange, setDateRange } = useCreatorStore();
  const [maxCompetitors, setMaxCompetitors] = useState('3');

  const youtubeConnected = !!channel;

  const redditConnected = false; // Reddit connects when sentiment data loads


  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0e] min-h-screen text-[#ededf0]">
      <div className="px-5 py-4 border-b border-[#222228] sticky top-0 bg-[#0c0c0e] z-10">
        <h1 className="text-[14px] font-semibold text-[#ededf0]">Settings</h1>
      </div>

      <div className="max-w-4xl">
        
        {/* Channel Connection */}
        <section className="px-5 py-5 border-b border-[#222228]">
          <h2 className="text-[14px] font-semibold text-[#ededf0] mb-4">Connected Platforms</h2>
          <div className="flex flex-col space-y-1">
            
            {/* YouTube */}
            <div className="flex items-center justify-between p-3 rounded-[6px] hover:bg-[#111114] transition-colors border border-transparent hover:border-[#222228]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[5px] bg-[#ff0000]/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-[#ff0000]" />

                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#ededf0]">YouTube Analytics</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${youtubeConnected ? 'bg-[#3fb950]' : 'bg-[#50505a]'}`} />
                    <span className="text-[11px] text-[#888892]">{youtubeConnected ? 'Connected' : 'Not connected'}</span>
                  </div>
                </div>
              </div>
              <button className={`h-8 px-3 rounded-[4px] text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
                youtubeConnected 
                  ? 'bg-transparent text-[#888892] hover:text-[#f85149] hover:bg-[#f85149]/10' 
                  : 'bg-[#1a1a1f] text-[#ededf0] border border-[#2d2d35] hover:bg-[#222228]'
              }`}>
                {youtubeConnected ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                {youtubeConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* Reddit */}
            <div className="flex items-center justify-between p-3 rounded-[6px] hover:bg-[#111114] transition-colors border border-transparent hover:border-[#222228]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[5px] bg-[#ff4500]/10 flex items-center justify-center">
                  <RedditIcon className="w-4 h-4 text-[#ff4500]" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#ededf0]">Reddit Discussions</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${redditConnected ? 'bg-[#3fb950]' : 'bg-[#50505a]'}`} />
                    <span className="text-[11px] text-[#888892]">{redditConnected ? 'Connected' : 'Not connected'}</span>
                  </div>
                </div>
              </div>
              <button className={`h-8 px-3 rounded-[4px] text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
                redditConnected 
                  ? 'bg-transparent text-[#888892] hover:text-[#f85149] hover:bg-[#f85149]/10' 
                  : 'bg-[#1a1a1f] text-[#ededf0] border border-[#2d2d35] hover:bg-[#222228]'
              }`}>
                {redditConnected ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                {redditConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* Google Trends */}
            <div className="flex items-center justify-between p-3 rounded-[6px] hover:bg-[#111114] transition-colors border border-transparent hover:border-[#222228]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[5px] bg-[#4285f4]/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#4285f4]" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#ededf0]">Google Trends</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                    <span className="text-[11px] text-[#888892]">Active</span>
                  </div>
                </div>
              </div>
              <button className="h-8 px-3 rounded-[4px] bg-transparent text-[#888892] text-[12px] font-medium cursor-default opacity-50 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Linked
              </button>
            </div>

            {/* Instagram (Coming Soon) */}
            <div className="flex items-center justify-between p-3 rounded-[6px] hover:bg-[#111114] transition-colors border border-transparent hover:border-[#222228] opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[5px] bg-[#e1306c]/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-[#e1306c]" />

                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#ededf0]">Instagram</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#50505a]" />
                    <span className="text-[11px] text-[#888892]">Coming soon</span>
                  </div>
                </div>
              </div>
              <button disabled className="h-8 px-3 rounded-[4px] bg-transparent text-[#888892] text-[12px] font-medium border border-[#222228]">
                Waitlist
              </button>
            </div>

          </div>
        </section>

        {/* Analysis Preferences */}
        <section className="px-5 py-6 border-b border-[#222228]">
          <h2 className="text-[14px] font-semibold text-[#ededf0] mb-5">Analysis Settings</h2>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] text-[#888892]">Default Date Range</label>
              <div className="flex bg-[#111114] p-0.5 rounded-[5px] border border-[#222228] w-max">
                {['7D', '30D', '90D', '1Y'].map(r => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r as DateRange)}

                    className={`px-4 py-1.5 text-[12px] font-medium rounded-[4px] transition-colors ${
                      dateRange === r 
                        ? 'bg-[#1a1a1f] text-[#ededf0] border border-[#2d2d35]' 
                        : 'text-[#888892] hover:text-[#ededf0] border border-transparent'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] text-[#888892]">Max Competitor Channels (Intelligence Page)</label>
              <div className="flex bg-[#111114] p-0.5 rounded-[5px] border border-[#222228] w-max">
                {['1', '2', '3'].map(c => (
                  <button
                    key={c}
                    onClick={() => setMaxCompetitors(c)}
                    className={`px-4 py-1.5 text-[12px] font-medium rounded-[4px] transition-colors ${
                      maxCompetitors === c 
                        ? 'bg-[#1a1a1f] text-[#ededf0] border border-[#2d2d35]' 
                        : 'text-[#888892] hover:text-[#ededf0] border border-transparent'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="px-5 py-6 border-b border-[#222228]">
          <h2 className="text-[14px] font-semibold text-[#ededf0] mb-4">Data</h2>
          <div className="flex flex-col gap-3">
            <button className="w-max h-8 px-4 rounded-[4px] bg-[#1a1a1f] border border-[#2d2d35] hover:bg-[#222228] text-[#ededf0] text-[12px] font-medium transition-colors">
              Clear cached data
            </button>
            <p className="text-[11px] text-[#50505a]">
              Data is processed locally and not stored on any server. Clearing cache will remove temporary session data.
            </p>
          </div>
        </section>

        {/* About */}
        <section className="px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#ededf0]">CreatorIQ v1.0.0</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                <span className="text-[11px] text-[#888892]">
                  Backend API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
                </span>
              </div>
            </div>
            <a href="#" className="text-[12px] text-[#5b6cf9] hover:underline">View on GitHub</a>
          </div>
        </section>

      </div>
    </div>
  );
}
