'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import {
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Zap,
  Eye,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  GitBranch,
} from 'lucide-react';

interface GithubEvent {
  id: string;
  event_type: string;
  action: string;
  repo_full_name: string;
  payload?: any;
  created_at: string;
  status: string;
}

interface GitHubEventFeedProps {
  maxEvents?: number;
  showRefresh?: boolean;
  compact?: boolean;
}

function getEventIcon(eventType: string, action: string) {
  switch (eventType) {
    case 'push':
      return <GitCommit className="h-4 w-4 text-success" />;
    case 'pull_request':
      return <GitPullRequest className="h-4 w-4 text-brand" />;
    case 'issues':
      return <AlertCircle className="h-4 w-4 text-danger" />;
    case 'issue_comment':
      return <MessageSquare className="h-4 w-4 text-info" />;
    case 'workflow_run':
      return <Zap className="h-4 w-4 text-warning" />;
    case 'pull_request_review':
      return <Eye className="h-4 w-4 text-ink-muted" />;
    case 'check_run':
      return <GitBranch className="h-4 w-4 text-success" />;
    case 'installation':
    case 'installation_repositories':
      return <GitBranch className="h-4 w-4 text-info" />;
    default:
      return <Clock className="h-4 w-4 text-ink-muted" />;
  }
}

function getEventColor(eventType: string) {
  switch (eventType) {
    case 'push':
      return 'bg-success/10 border-success/20';
    case 'pull_request':
      return 'bg-brand/10 border-brand/20';
    case 'issues':
      return 'bg-danger/10 border-danger/20';
    case 'issue_comment':
      return 'bg-info/10 border-info/20';
    case 'workflow_run':
      return 'bg-warning/10 border-warning/20';
    case 'pull_request_review':
      return 'bg-ink-muted/10 border-ink-muted/20';
    default:
      return 'bg-bg-muted border-border';
  }
}

function formatEventTitle(event: GithubEvent): string {
  const payload = event.payload || {};
  const action = event.action || '';

  switch (event.event_type) {
    case 'push': {
      const commits = payload.commits || [];
      const ref = (payload.ref || '').replace('refs/heads/', '');
      return `Pushed ${commits.length} commit(s) to ${ref}`;
    }
    case 'pull_request': {
      const pr = payload.pull_request || {};
      return `${action} PR #${pr.number || '?'}: ${pr.title || 'Untitled'}`;
    }
    case 'issues': {
      const issue = payload.issue || {};
      return `${action} issue #${issue.number || '?'}: ${issue.title || 'Untitled'}`;
    }
    case 'issue_comment': {
      const issue = payload.issue || {};
      return `Commented on issue #${issue.number || '?'}`;
    }
    case 'workflow_run': {
      const run = payload.workflow_run || {};
      return `${action} workflow: ${run.name || 'Unknown'} → ${run.conclusion || run.status || ''}`;
    }
    case 'pull_request_review': {
      const review = payload.review || {};
      const pr = payload.pull_request || {};
      return `${action} review on PR #${pr.number || '?'}: ${review.state || ''}`;
    }
    case 'check_run': {
      const check = payload.check_run || {};
      return `${action} check: ${check.name || 'Unknown'} → ${check.conclusion || check.status || ''}`;
    }
    default:
      return `${event.event_type}: ${action}`;
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

export function GitHubEventFeed({ maxEvents = 20, showRefresh = true, compact = false }: GitHubEventFeedProps) {
  const [events, setEvents] = useState<GithubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/github/events', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch events');
      const result = await res.json();
      const eventList = (result.data || result || []).slice(0, maxEvents);
      setEvents(eventList);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [maxEvents]);

  useEffect(() => {
    fetchEvents();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchEvents(), 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8 gap-3">
          <AlertCircle className="h-5 w-5 text-danger" />
          <p className="text-sm text-ink-muted">{error}</p>
          <button onClick={() => fetchEvents(true)} className="text-brand text-sm hover:underline">
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-medium text-ink">GitHub Events</h3>
          {events.length > 0 && (
            <span className="text-[10px] bg-bg-muted text-ink-muted px-1.5 py-0.5 rounded-full">
              {events.length}
            </span>
          )}
        </div>
        {showRefresh && (
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="p-1.5 text-ink-muted hover:text-ink rounded-md hover:bg-bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GitCommit className="h-8 w-8 text-ink-muted/40 mb-2" />
          <p className="text-sm text-ink-muted">No GitHub events yet</p>
          <p className="text-xs text-ink-muted/60 mt-1">Events will appear here when webhooks are received</p>
        </div>
      ) : (
        <div className={`divide-y divide-border/50 ${compact ? 'max-h-[300px]' : 'max-h-[500px]'} overflow-y-auto`}>
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-bg-muted/50 transition-colors ${getEventColor(event.event_type)} border-l-2`}
            >
              <div className="shrink-0 mt-0.5">
                {getEventIcon(event.event_type, event.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink font-medium truncate">
                  {formatEventTitle(event)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {event.repo_full_name && (
                    <span className="text-xs text-ink-muted">{event.repo_full_name}</span>
                  )}
                  <span className="text-xs text-ink-muted">·</span>
                  <span className="text-xs text-ink-muted">{formatTimeAgo(event.created_at)}</span>
                </div>
              </div>
              {event.payload?.pull_request?.html_url && (
                <a
                  href={event.payload.pull_request.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 text-ink-muted hover:text-brand transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
