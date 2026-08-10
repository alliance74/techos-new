import { Clock, User, AlertCircle } from 'lucide-react';
import { Task } from '@/types/task';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

interface TaskCardProps {
  task: Task;
}

const priorityColors = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
} as const;

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card hover padding="sm" className="cursor-pointer">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium text-ink line-clamp-2">
            {task.title}
          </h4>
          <Badge variant={priorityColors[task.priority]} size="sm">
            {task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            {task.story_points && (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {task.story_points} pts
              </span>
            )}
            {task.estimated_hours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimated_hours}h
              </span>
            )}
          </div>
          {task.assignee_id && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 text-xs bg-bg-muted text-ink-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
