import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-2.5 text-[--color-text-tertiary] flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'h-8 w-full bg-[--color-bg-elevated] border border-[--color-border-strong] rounded-[5px] text-[13px] text-[--color-text-primary] placeholder:text-[--color-text-tertiary] transition-colors focus:outline-none focus:border-[--color-accent] focus:bg-[--color-bg-hover] disabled:opacity-50 disabled:cursor-not-allowed',
              icon ? 'pl-8' : 'pl-3',
              'pr-3',
              error && 'border-[--color-negative] focus:border-[--color-negative]',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[11px] text-[--color-negative]">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
