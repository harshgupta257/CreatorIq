import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Panel({ children, className, noPadding }: PanelProps) {
  return (
    <div
      className={cn(
        'bg-[#0f0f24]/90 border border-[#2a2a5a] rounded-[2px] shadow-[inset_0_0_20px_rgba(93,52,208,0.08)] hover:border-[#00ffff]/40 transition-colors duration-300',
        !noPadding && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
}
