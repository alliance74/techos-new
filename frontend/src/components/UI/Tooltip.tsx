'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  title: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const sideStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1a1a1a] border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1a1a1a] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1a1a1a] border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1a1a1a] border-y-transparent border-l-transparent',
};

export function Tooltip({ title, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  if (!title) return <>{children}</>;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-bg-muted px-2.5 py-1.5 text-xs font-medium text-gray-100 shadow-lg transition-opacity duration-150',
          sideStyles[side],
          visible ? 'opacity-100' : 'opacity-0',
          className
        )}
      >
        {title}
        <span className={cn('absolute h-0 w-0 border-4', arrowStyles[side])} />
      </span>
    </span>
  );
}
