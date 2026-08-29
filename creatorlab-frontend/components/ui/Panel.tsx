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
        'bg-[#111114] border border-[#222228] rounded-[6px]',
        !noPadding && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
}
