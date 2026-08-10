'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (revealed ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-secondary mb-1">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'block w-full px-3 py-2 bg-bg-muted border rounded-xl text-ink placeholder:text-ink-muted',
              'focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/30 focus:bg-surface',
              'disabled:bg-bg-subtle disabled:text-ink-muted disabled:cursor-not-allowed',
              isPassword && 'pr-10',
              error ? 'border-danger' : 'border-transparent',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
              aria-label={revealed ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-ink-muted">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
