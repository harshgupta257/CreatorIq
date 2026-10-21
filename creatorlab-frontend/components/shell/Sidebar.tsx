'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Play, MessageCircle, TrendingUp,
  Activity, Target, Camera, Settings, BarChart2
} from 'lucide-react';
import { useCreatorStore } from '@/lib/store';

const platformLinks = [
  { name: 'Overview',     href: '/dashboard',             icon: LayoutDashboard },
  { name: 'YouTube',      href: '/dashboard/youtube',     icon: Play },
  { name: 'Sentiment',    href: '/dashboard/sentiment',   icon: MessageCircle },
  { name: 'Predictions',  href: '/dashboard/predictions', icon: TrendingUp, badge: 'Beta' },
  { name: 'Trends',       href: '/dashboard/trends',      icon: Activity },
  { name: 'Competitor',   href: '/dashboard/competitor',  icon: Target },
  { name: 'Instagram',    href: '/dashboard/instagram',   icon: Camera },
];

const systemLinks = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const backendOnline = useCreatorStore((s) => s.backendOnline);

  function navItem(href: string, name: string, Icon: React.ElementType, badge?: string) {
    const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        className={[
          'h-8 flex items-center gap-2.5 text-[12px] uppercase tracking-wider mb-0.5 transition-all duration-200 cursor-pointer',
          isActive
            ? 'border-l-2 border-[#00ffff] bg-[#00ffff]/10 text-[#00ffff] [text-shadow:0_0_8px_#00ffff] shadow-[inset_8px_0_12px_-8px_#00ffff] pl-[9px] pr-2.5'
            : 'text-[#6a6aa8] hover:text-[#ff006e] hover:bg-[#ff006e]/5 pl-[11px] pr-2.5',
        ].join(' ')}
      >
        <Icon className="w-[14px] h-[14px] shrink-0" />
        <span className="flex-1">{name}</span>
        {badge && (
          <span className="text-[9px] bg-[#1f1f3d] text-[#6a6aa8] border border-[#2a2a5a] px-1.5 py-0.5 rounded-[3px] uppercase tracking-wide">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="w-[220px] min-h-screen bg-black/85 backdrop-blur-sm border-r border-[#ff006e]/40 shadow-[4px_0_24px_rgba(255,0,110,0.15)] flex flex-col shrink-0">
      {/* Logo */}
      <Link href="/" className="h-12 border-b border-[#2a2a5a] flex items-center px-4 gap-2.5 cursor-pointer group">
        <span className="w-6 h-6 grid place-items-center border border-[#00ffff] box-glow-cyan group-hover:border-[#ff006e] transition-all duration-300">
          <BarChart2 className="w-3.5 h-3.5 text-[#00ffff] group-hover:text-[#ff006e] transition-colors" />
        </span>
        <span className="font-display text-[14px] tracking-wider">
          <span className="text-white">CREATOR</span><span className="neon-pink">IQ</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col flex-1 px-2 py-3">
        <p className="px-2 pb-1.5 text-[10px] text-[#6a6aa8] uppercase tracking-widest font-medium">Platform</p>
        {platformLinks.map((l) => navItem(l.href, l.name, l.icon, l.badge))}

        <div className="mt-auto pt-4 border-t border-[#2a2a5a]">
          <p className="px-2 pb-1.5 text-[10px] text-[#6a6aa8] uppercase tracking-widest font-medium">System</p>
          {systemLinks.map((l) => navItem(l.href, l.name, l.icon))}
        </div>
      </nav>

      {/* Status footer */}
      <div className="border-t border-[#2a2a5a] px-4 py-2.5 flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: backendOnline ? '#00ff9f' : '#ff3864', boxShadow: `0 0 6px ${backendOnline ? '#00ff9f' : '#ff3864'}` }}
        />
        <span className="text-[11px] text-[#6a6aa8]">
          {backendOnline ? 'Live data' : 'Demo mode'}
        </span>
      </div>
    </aside>
  );
}
