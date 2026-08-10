import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        <div className="flex items-center">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id={checkboxId}
              className={cn(
                'peer h-4 w-4 border-2 border-border-strong rounded bg-surface',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'checked:bg-brand checked:border-brand',
                'appearance-none cursor-pointer',
                error && 'border-danger',
                className
              )}
              ref={ref}
              {...props}
            />
            <Check
              className={cn(
                'absolute left-0 top-0 h-4 w-4 text-ink-inverse pointer-events-none',
                'opacity-0 peer-checked:opacity-100',
              )}
            />
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="ml-2 text-sm text-ink-secondary cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
