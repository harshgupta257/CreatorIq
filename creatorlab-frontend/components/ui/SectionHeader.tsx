import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  border?: boolean;
}

export function SectionHeader({ title, subtitle, action, className, border = false }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between py-3',
        border && 'border-b border-[#2a2a5a]',
        className
      )}
    >
      <div>
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#00ffff] [text-shadow:0_0_6px_rgba(0,255,255,0.6)]">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#6a6aa8] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}
