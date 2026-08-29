import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'accent' | 'positive' | 'warning' | 'negative' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[#16161a] text-[#888892] border border-[#222228]',
  accent:   'bg-[rgba(91,108,249,0.1)] text-[#5b6cf9] border border-[rgba(91,108,249,0.2)]',
  positive: 'bg-[rgba(63,185,80,0.1)] text-[#3fb950] border border-[rgba(63,185,80,0.2)]',
  warning:  'bg-[rgba(210,153,34,0.1)] text-[#d29922] border border-[rgba(210,153,34,0.2)]',
  negative: 'bg-[rgba(248,81,73,0.1)] text-[#f85149] border border-[rgba(248,81,73,0.2)]',
  outline:  'bg-transparent text-[#50505a] border border-[#222228]',
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
