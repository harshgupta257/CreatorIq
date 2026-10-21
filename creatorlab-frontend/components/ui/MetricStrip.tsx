import { cn } from '@/lib/utils';

interface MetricItem {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  sub?: string;
}

interface MetricStripProps {
  metrics: MetricItem[];
  className?: string;
}

export function MetricStrip({ metrics, className }: MetricStripProps) {
  return (
    <div
      className={cn(
        'grid divide-x divide-[#2a2a5a] border-b border-[#2a2a5a]',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}
    >
      {metrics.map((m, i) => (
        <div key={i} className="px-5 py-4">
          <div className="text-[11px] text-[#6a6aa8] uppercase tracking-wider mb-1.5">{m.label}</div>
          <div className="font-display text-[24px] text-white [text-shadow:0_0_8px_rgba(0,255,255,0.55)] tabular leading-none">{m.value}</div>
          {(m.change || m.sub) && (
            <div className="flex items-center gap-2 mt-1.5">
              {m.change && (
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    m.changePositive ? 'text-[#00ff9f]' : 'text-[#ff3864]'
                  )}
                >
                  {m.changePositive ? '↑' : '↓'} {m.change}
                </span>
              )}
              {m.sub && <span className="text-[11px] text-[#6a6aa8]">{m.sub}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
