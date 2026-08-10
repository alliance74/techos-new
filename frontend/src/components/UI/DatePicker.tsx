import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-secondary mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type="date"
            className={cn(
              'w-full px-3 py-2 pr-10 bg-bg-muted border border-border rounded-md text-ink',
              'focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-gray-600',
              'disabled:bg-[#141414] disabled:text-ink-muted disabled:cursor-not-allowed',
              'scheme-dark',
              error && 'border-red-500 focus:ring-red-500/40',
              className
            )}
            ref={ref}
            {...props}
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-ink-muted">{helperText}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
