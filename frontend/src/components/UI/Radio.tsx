import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        <div className="flex items-center">
          <input
            type="radio"
            id={radioId}
            className={cn(
              'h-4 w-4 border-2 border-border-strong rounded-full bg-bg-muted appearance-none',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'checked:border-white checked:bg-white',
              'cursor-pointer',
              error && 'border-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {label && (
            <label
              htmlFor={radioId}
              className="ml-2 text-sm text-ink-secondary cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
