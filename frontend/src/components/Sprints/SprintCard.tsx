'use client';

import { Calendar, Target, TrendingUp, Play, CheckCircle } from 'lucide-react';
import { Sprint } from '@/types/sprint';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { useStartSprint, useCompleteSprint } from '@/hooks/useSprints';

interface SprintCardProps {
  sprint: Sprint;
  onClick?: () => void;
}

export function SprintCard({ sprint, onClick }: SprintCardProps) {
  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();

  const getStatusColor = () => {
    switch (sprint.status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-bg-muted text-gray-800 border-border';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Start this sprint?')) {
      await startSprint.mutateAsync(sprint.id);
    }
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Complete this sprint? This will close the sprint.')) {
      await completeSprint.mutateAsync(sprint.id);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    const end = new Date(sprint.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card onClick={onClick} className="cursor-pointer hover:border-black transition-colors">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink mb-1">{sprint.name}</h3>
            {sprint.goal && (
              <p className="text-sm text-gray-600 line-clamp-2">{sprint.goal}</p>
            )}
          </div>
          <Badge className={getStatusColor()}>
            {sprint.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(sprint.start_date)}</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(sprint.end_date)}</span>
          </div>
        </div>

        {/* Days Remaining (for active sprints) */}
        {sprint.status === 'active' && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-ink-muted" />
            <span className={`font-medium ${daysRemaining < 3 ? 'text-red-600' : 'text-ink-secondary'}`}>
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Overdue'}
            </span>
          </div>
        )}

        {/* Velocity */}
        {sprint.velocity !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span>Velocity: {sprint.velocity} points</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 flex gap-2">
          {sprint.status === 'planned' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStart}
              disabled={startSprint.isPending}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Sprint
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleComplete}
              disabled={completeSprint.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Sprint
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
