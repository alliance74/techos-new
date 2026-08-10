import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default: 'bg-bg-muted text-ink-secondary border-border',
    success: 'bg-success-soft text-success-text border-success/20',
    error: 'bg-danger-soft text-danger-text border-danger/20',
    warning: 'bg-warning-soft text-warning-text border-warning/20',
    info: 'bg-info-soft text-info-text border-brand/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-lg',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
