import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'accent' | 'positive' | 'warning' | 'negative' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[#1a1a2e] text-[#9aa4d6] border border-[#2a2a5a]',
  accent:   'bg-[rgba(255,0,110,0.1)] text-[#ff006e] border border-[rgba(255,0,110,0.2)]',
  positive: 'bg-[rgba(0,255,159,0.1)] text-[#00ff9f] border border-[rgba(0,255,159,0.2)]',
  warning:  'bg-[rgba(255,215,0,0.1)] text-[#ffd700] border border-[rgba(255,215,0,0.2)]',
  negative: 'bg-[rgba(255,56,100,0.1)] text-[#ff3864] border border-[rgba(255,56,100,0.2)]',
  outline:  'bg-transparent text-[#6a6aa8] border border-[#2a2a5a]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-[3px] uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
