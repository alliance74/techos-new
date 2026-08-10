'use client';

import { Bug } from '@/types/bug';

interface BugCardProps {
  bug: Bug;
  onEdit: (bug: Bug) => void;
  onDelete: (id: number) => void;
}

export default function BugCard({ bug, onEdit, onDelete }: BugCardProps) {
  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-bg-muted text-gray-800',
      wont_fix: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };
    return icons[priority as keyof typeof icons] || '⚪';
  };

  return (
    <div className={`bg-white border-2 p-4 hover:shadow-lg transition-shadow ${getSeverityColor(bug.severity)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getPriorityIcon(bug.priority)}</span>
            <h3 className="font-semibold text-lg">{bug.title}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bug.description}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(bug)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(bug.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded uppercase ${getSeverityColor(bug.severity)}`}>
          {bug.severity}
        </span>
        <span className={`px-2 py-1 text-xs font-semibold rounded uppercase ${getStatusColor(bug.status)}`}>
          {bug.status.replace('_', ' ')}
        </span>
        <span className="px-2 py-1 text-xs font-semibold rounded uppercase bg-bg-muted text-gray-800">
          {bug.priority}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <div>
          {bug.assignee ? (
            <span>Assigned to: <span className="font-medium text-ink-secondary">{bug.assignee.firstName} {bug.assignee.lastName}</span></span>
          ) : (
            <span className="text-ink-muted">Unassigned</span>
          )}
        </div>
        {bug.project && (
          <span className="text-xs bg-bg-muted px-2 py-1 rounded">{bug.project.name}</span>
        )}
      </div>

      {bug.environment && (
        <div className="mt-2 text-xs text-ink-muted">
          <span className="font-medium">Environment:</span> {bug.environment}
        </div>
      )}

      {bug.tags && bug.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {bug.tags.map((tag, idx) => (
            <span key={idx} className="text-xs bg-bg-inverse text-ink px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
