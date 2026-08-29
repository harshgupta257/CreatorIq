'use client';

import React from 'react';
import { cn, formatCompact } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { VideoPrediction } from '@/lib/types';

export function VideoTable({ videoPredictions }: { videoPredictions: VideoPrediction[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border text-[11px] text-text-tertiary uppercase tracking-wider">
            <th className="px-5 py-2 font-normal">Video</th>
            <th className="px-5 py-2 font-normal">Actual Views</th>
            <th className="px-5 py-2 font-normal">Predicted Views</th>
            <th className="px-5 py-2 font-normal">Delta</th>
            <th className="px-5 py-2 font-normal w-32">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(videoPredictions || []).slice(0, 5).map((vp) => {
            const diff = vp.actual_views - vp.predicted_views;
            const pct =
              vp.predicted_views > 0
                ? (diff / vp.predicted_views) * 100
                : 0;
            const isPos = diff >= 0;
            return (
              <tr
                key={vp.video_id}
                className="hover:bg-bg-hover transition-colors"
              >
                <td className="px-5 py-2.5">
                  <div className="flex items-center space-x-3">
                    <img
                      src={vp.thumbnail}
                      alt=""
                      className="w-7 h-7 object-cover rounded-[2px]"
                    />
                    <span className="truncate max-w-[200px] text-[12px]">
                      {vp.title}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-2.5 tabular-nums text-[12px]">
                  {formatCompact(vp.actual_views)}
                </td>
                <td className="px-5 py-2.5 tabular-nums text-[12px] text-text-secondary">
                  {formatCompact(vp.predicted_views)}
                </td>
                <td className="px-5 py-2.5">
                  <div
                    className={cn(
                      'flex items-center text-[12px] tabular-nums',
                      isPos ? 'text-positive' : 'text-negative'
                    )}
                  >
                    {isPos ? (
                      <ArrowUp className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(pct).toFixed(1)}%
                  </div>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${vp.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-tertiary tabular-nums">
                      {(vp.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
