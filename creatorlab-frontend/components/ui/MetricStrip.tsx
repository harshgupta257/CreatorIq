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
        'grid divide-x divide-[#222228] border-b border-[#222228]',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}
    >
      {metrics.map((m, i) => (
        <div key={i} className="px-5 py-4">
          <div className="text-[11px] text-[#50505a] uppercase tracking-wider mb-1.5">{m.label}</div>
          <div className="text-[22px] font-semibold text-[#ededf0] tabular leading-none">{m.value}</div>
          {(m.change || m.sub) && (
            <div className="flex items-center gap-2 mt-1.5">
              {m.change && (
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    m.changePositive ? 'text-[#3fb950]' : 'text-[#f85149]'
                  )}
                >
                  {m.changePositive ? '↑' : '↓'} {m.change}
                </span>
              )}
              {m.sub && <span className="text-[11px] text-[#50505a]">{m.sub}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
