import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down';
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, change, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{title}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-mist text-brand">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-ink tracking-tight">{value}</p>
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              trend === 'down' ? 'text-danger' : 'text-success',
            )}
          >
            {trend === 'down' ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" />
            )}
            {change}
          </span>
        )}
      </div>
    </Card>
  );
}
