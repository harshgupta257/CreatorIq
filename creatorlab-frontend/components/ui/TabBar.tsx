'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export interface Tab {
  id: string;
  label: string;
  badge?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeId, onChange, className }: TabBarProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-[--color-border-strong]', className)}>
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative h-9 px-4 text-[12px] font-medium transition-colors outline-none whitespace-nowrap flex items-center gap-2',
              isActive
                ? 'text-[--color-text-primary]'
                : 'text-[--color-text-tertiary] hover:text-[--color-text-secondary]'
            )}
          >
            {tab.label}
            {tab.badge && (
              <Badge variant={isActive ? 'default' : 'outline'} className="ml-1 text-[9px] py-0 px-1">
                {tab.badge}
              </Badge>
            )}
            
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-[--color-accent]"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
