import React from 'react';
import { cn } from '@/lib/utils';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-secondary mb-1">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            'w-full px-3 py-2 bg-bg-muted border rounded-xl text-ink placeholder:text-ink-muted',
            'focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/30 focus:bg-surface',
            'disabled:bg-bg-subtle disabled:text-ink-muted disabled:cursor-not-allowed',
            'resize-y min-h-[100px]',
            error ? 'border-danger' : 'border-transparent',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-ink-muted">{helperText}</p>}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';
