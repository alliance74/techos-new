import Link from 'next/link';
import { Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { Project } from '@/types/project';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { formatDate } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

const statusColors = {
  planning: 'default',
  active: 'info',
  'on-hold': 'warning',
  completed: 'success',
  cancelled: 'error',
} as const;

const priorityColors = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
} as const;

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card hover padding="md" className="h-full">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-ink line-clamp-1">
                {project.name}
              </h3>
              <Badge variant={priorityColors[project.priority]} size="sm">
                {project.priority}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          </div>

          {/* Status */}
          <div>
            <Badge variant={statusColors[project.status]}>
              {project.status.replace('-', ' ')}
            </Badge>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(project.start_date)}</span>
            </div>
            {project.end_date && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(project.end_date)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Team</span>
            </div>
            <div className="text-sm text-gray-600">
              View Details →
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
