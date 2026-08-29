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
        border && 'border-b border-[#222228]',
        className
      )}
    >
      <div>
        <h2 className="text-[13px] font-semibold text-[#ededf0] tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#50505a] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}
