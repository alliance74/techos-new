import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?:
    | ReactNode
    | {
        label: string;
        onClick: () => void;
      };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      {icon && (
        <div className="flex justify-center text-ink-muted mb-4 [&_svg]:h-10 [&_svg]:w-10">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-ink-muted mb-6 max-w-sm mx-auto text-sm">{description}</p>
      )}
      {action && (
        <>
          {typeof action === 'object' && 'label' in action ? (
            <Button onClick={action.onClick}>{action.label}</Button>
          ) : (
            action
          )}
        </>
      )}
    </div>
  );
}
