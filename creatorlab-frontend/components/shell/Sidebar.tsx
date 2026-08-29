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
          'h-7 flex items-center gap-2.5 rounded-[4px] text-[12px] mb-0.5 transition-colors duration-100',
          isActive
            ? 'border-l-2 border-[#5b6cf9] bg-[#16161a] text-[#ededf0] pl-[9px] pr-2.5'
            : 'text-[#50505a] hover:text-[#888892] hover:bg-[#16161a] pl-[11px] pr-2.5',
        ].join(' ')}
      >
        <Icon className="w-[14px] h-[14px] shrink-0" />
        <span className="flex-1">{name}</span>
        {badge && (
          <span className="text-[9px] bg-[#1a1a1f] text-[#50505a] border border-[#222228] px-1.5 py-0.5 rounded-[3px] uppercase tracking-wide">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="w-[220px] min-h-screen bg-[#111114] border-r border-[#222228] flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-12 border-b border-[#222228] flex items-center px-4 gap-2.5">
        <BarChart2 className="w-4 h-4 text-[#5b6cf9]" />
        <span className="text-[13px] font-semibold text-[#ededf0] tracking-tight">CreatorIQ</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 px-2 py-3">
        <p className="px-2 pb-1.5 text-[10px] text-[#50505a] uppercase tracking-widest font-medium">Platform</p>
        {platformLinks.map((l) => navItem(l.href, l.name, l.icon, l.badge))}

        <div className="mt-auto pt-4 border-t border-[#222228]">
          <p className="px-2 pb-1.5 text-[10px] text-[#50505a] uppercase tracking-widest font-medium">System</p>
          {systemLinks.map((l) => navItem(l.href, l.name, l.icon))}
        </div>
      </nav>

      {/* Status footer */}
      <div className="border-t border-[#222228] px-4 py-2.5 flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: backendOnline ? '#3fb950' : '#f85149' }}
        />
        <span className="text-[11px] text-[#50505a]">
          {backendOnline ? 'Live data' : 'Demo mode'}
        </span>
      </div>
    </aside>
  );
}
