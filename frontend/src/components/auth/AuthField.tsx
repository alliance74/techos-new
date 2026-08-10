'use client';

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  error?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ className, icon, error, type = 'text', ...props }, ref) => {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (revealed ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
            {icon}
          </span>
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full rounded-xl bg-bg-muted py-3.5 pl-11 text-sm text-ink',
              isPassword ? 'pr-12' : 'pr-4',
              'placeholder:text-ink-muted border border-transparent',
              'focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/30 focus:bg-surface',
              'transition-shadow',
              error && 'ring-2 ring-danger/40',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
              aria-label={revealed ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger px-1">{error}</p>}
      </div>
    );
  },
);

AuthField.displayName = 'AuthField';
