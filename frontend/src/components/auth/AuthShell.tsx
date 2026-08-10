'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  /** Which side the blue welcome panel sits on */
  panelSide: 'left' | 'right';
  panel: ReactNode;
  form: ReactNode;
  className?: string;
}

/**
 * Split auth card matching the reference UI:
 * soft mist background, white + brand-blue panels,
 * convex wave where blue arcs into the form side.
 */
export function AuthShell({ panelSide, panel, form, className }: AuthShellProps) {
  const blueLeft = panelSide === 'left';

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden page-shell">
      <div
        className={cn(
          'relative w-full max-w-[900px] overflow-hidden rounded-2xl bg-surface shadow-auth',
          'flex flex-col md:flex-row min-h-[540px]',
          !blueLeft && 'md:flex-row-reverse',
          className,
        )}
      >
        {/* Blue welcome panel with convex curve into the form */}
        <aside
          className={cn(
            'relative flex items-center justify-center overflow-hidden bg-brand text-ink-inverse',
            'px-8 py-14 md:w-[42%] md:min-h-full md:py-12',
          )}
        >
          <svg
            className={cn(
              'pointer-events-none absolute inset-y-0 h-full w-[28%] text-surface hidden md:block',
              blueLeft ? 'right-0 translate-x-[1px]' : 'left-0 -translate-x-[1px] scale-x-[-1]',
            )}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M100,0 C35,25 35,75 100,100 L100,0 Z" fill="currentColor" />
          </svg>

          <div className="relative z-10 max-w-[220px] text-center px-2">{panel}</div>
        </aside>

        <div className="relative flex flex-1 flex-col justify-center px-8 py-10 sm:px-14 md:px-16">
          {form}
        </div>
      </div>
    </div>
  );
}
