'use client';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:   'bg-[#5b6cf9] text-white hover:bg-[#4a5be8] border border-transparent',
  secondary: 'bg-[#111114] text-[#ededf0] hover:bg-[#16161a] border border-[#222228]',
  ghost:     'bg-transparent text-[#888892] hover:bg-[#16161a] hover:text-[#ededf0] border border-transparent',
  danger:    'bg-transparent text-[#f85149] hover:bg-[rgba(248,81,73,0.08)] border border-[rgba(248,81,73,0.3)]',
};

const sizes: Record<Size, string> = {
  xs: 'h-6 px-2 text-[11px] rounded-[3px] gap-1',
  sm: 'h-7 px-3 text-[12px] rounded-[4px] gap-1.5',
  md: 'h-8 px-4 text-[13px] rounded-[5px] gap-2',
  lg: 'h-9 px-5 text-[14px] rounded-[5px] gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'sm',
  loading,
  icon,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-100 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      style={{
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 80ms ease, background-color 100ms ease',
        ...style,
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0 opacity-70">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
