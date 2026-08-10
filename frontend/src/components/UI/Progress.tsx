import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'success' | 'danger' | 'warning';
  className?: string;
}

const heights = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const colors = {
  brand: 'bg-brand',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'brand',
  className,
}: ProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-ink-secondary">{label}</span>}
          {showValue && <span className="text-sm text-ink-muted">{Math.round(percent)}%</span>}
        </div>
      )}
      <div
        className={cn('w-full rounded-full bg-bg-muted overflow-hidden', heights[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', colors[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
