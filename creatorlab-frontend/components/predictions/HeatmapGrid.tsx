'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { PostingTimeData } from '@/lib/types';

export function HeatmapGrid({ recommendedPostingTime }: { recommendedPostingTime: PostingTimeData }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];
  
  const heatmapValues = Object.values(recommendedPostingTime?.heatmap || {}) as number[];
  const maxHeatmapVal = heatmapValues.length ? Math.max(...heatmapValues) : 1;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max">
        <div className="flex">
          <div className="w-10"></div>
          {times.map((t, i) => (
            <div
              key={i}
              className="w-11 text-center text-[10px] text-text-tertiary mb-2"
            >
              {t}
            </div>
          ))}
        </div>
        {days.map((day, dIdx) => (
          <div key={day} className="flex items-center mb-1">
            <div className="w-10 text-[10px] text-text-tertiary pr-2 text-right">
              {day}
            </div>
            {times.map((t, tIdx) => {
              const key = `${dIdx}_${tIdx}`;
              const val = recommendedPostingTime?.heatmap?.[key] || 0;
              const opacity = maxHeatmapVal > 0 ? val / maxHeatmapVal : 0;
              const isBest = val === maxHeatmapVal && val > 0;

              return (
                <div
                  key={key}
                  className={cn(
                    'w-11 h-7 mx-0.5 rounded-[2px]',
                    isBest ? 'border border-accent' : 'border border-transparent'
                  )}
                  style={{
                    backgroundColor: `rgba(91, 108, 249, ${opacity * 0.8 + 0.1})`,
                  }}
                  title={`${day} ${t}: ${val.toFixed(2)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
