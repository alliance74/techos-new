'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Progress } from '@/components/UI/Progress';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Flame,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface SprintSummary {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  total_tasks: number;
  completed_tasks: number;
  total_points: number;
  completed_points: number;
  velocity: number;
  days_total: number;
  days_elapsed: number;
  days_remaining: number;
}

interface SprintDashboardData {
  sprints: SprintSummary[];
  current_sprint: any | null;
  velocity_trend: { sprint_name: string; planned_points: number; completed_points: number; velocity: number }[];
  burndown: { day: number; date: string; remaining_points: number; ideal_remaining: number }[];
  team_performance: { user_id: string; user_name: string; tasks_completed: number; tasks_assigned: number; story_points_completed: number; completion_rate: number }[];
  overview: {
    total_sprints: number;
    active_sprints: number;
    completed_sprints: number;
    average_velocity: number;
    average_completion_rate: number;
    total_points_completed: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    completed: 'bg-brand/10 text-brand border-brand/20',
    planned: 'bg-warning/10 text-warning border-warning/20',
    cancelled: 'bg-danger/10 text-danger border-danger/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[status] || 'bg-ink-muted/10 text-ink-muted border-border'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function MiniBarChart({ data, max }: { data: { label: string; value: number; color?: string }[]; max: number }) {
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t ${d.color || 'bg-brand'} transition-all duration-500`}
            style={{ height: `${max > 0 ? (d.value / max) * 100 : 0}%`, minHeight: d.value > 0 ? '4px' : '0' }}
          />
        </div>
      ))}
    </div>
  );
}

export default function SprintAnalyticsPage() {
  const [data, setData] = useState<SprintDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSprintAnalytics();
  }, []);

  const fetchSprintAnalytics = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/sprints/analytics/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch sprint analytics');
      const result = await res.json();
      setData(result.data || result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-ink-muted">{error}</p>
        <button onClick={fetchSprintAnalytics} className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/80">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overview, sprints, current_sprint, velocity_trend, burndown, team_performance } = data;

  const maxVelocity = Math.max(...velocity_trend.map((v) => Math.max(v.planned_points, v.completed_points)), 1);
  const maxBurndown = burndown.length ? Math.max(...burndown.map((b) => Math.max(b.remaining_points, b.ideal_remaining)), 1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Sprint Analytics</h1>
          <p className="text-ink-muted mt-2">Velocity tracking, burndown charts, and team performance</p>
        </div>
        <button
          onClick={fetchSprintAnalytics}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-ink hover:bg-bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-brand" />
            <span className="text-xs text-ink-muted">Total Sprints</span>
          </div>
          <p className="text-2xl font-bold text-ink">{overview.total_sprints}</p>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-success" />
            <span className="text-xs text-ink-muted">Active</span>
          </div>
          <p className="text-2xl font-bold text-ink">{overview.active_sprints}</p>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-brand" />
            <span className="text-xs text-ink-muted">Completed</span>
          </div>
          <p className="text-2xl font-bold text-ink">{overview.completed_sprints}</p>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-warning" />
            <span className="text-xs text-ink-muted">Avg Velocity</span>
          </div>
          <p className="text-2xl font-bold text-ink">{overview.average_velocity.toFixed(1)}</p>
          <span className="text-xs text-ink-muted">pts/sprint</span>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-info" />
            <span className="text-xs text-ink-muted">Avg Completion</span>
          </div>
          <p className="text-2xl font-bold text-ink">{overview.average_completion_rate.toFixed(0)}%</p>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-danger" />
            <span className="text-xs text-ink-muted">Total Points</span>
          </div>
          <p className="text-2xl font-bold text-ink">{overview.total_points_completed}</p>
          <span className="text-xs text-ink-muted">completed</span>
        </Card>
      </div>

      {/* Current Sprint Detail */}
      {current_sprint && (
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold text-ink">Current Sprint</h2>
            <StatusBadge status={current_sprint.status} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-ink-muted mb-1">Sprint Name</p>
              <p className="text-lg font-semibold text-ink">{current_sprint.name}</p>
              <p className="text-xs text-ink-muted mt-1">
                {new Date(current_sprint.start_date).toLocaleDateString()} → {new Date(current_sprint.end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted mb-1">Progress</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink">{current_sprint.completed_tasks}</span>
                <span className="text-ink-muted">/ {current_sprint.total_tasks} tasks</span>
              </div>
              <Progress value={current_sprint.total_tasks ? (current_sprint.completed_tasks / current_sprint.total_tasks) * 100 : 0} className="mt-2" />
            </div>
            <div>
              <p className="text-sm text-ink-muted mb-1">Story Points</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink">{current_sprint.completed_points}</span>
                <span className="text-ink-muted">/ {current_sprint.total_points} pts</span>
              </div>
              <Progress value={current_sprint.total_points ? (current_sprint.completed_points / current_sprint.total_points) * 100 : 0} className="mt-2" />
            </div>
            <div>
              <p className="text-sm text-ink-muted mb-1">Time Remaining</p>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-2xl font-bold text-ink">{current_sprint.days_remaining}</span>
                <span className="text-ink-muted">days</span>
              </div>
              <Progress value={current_sprint.days_total ? (current_sprint.days_elapsed / current_sprint.days_total) * 100 : 0} className="mt-2" />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Trend */}
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Velocity Trend</h2>
          </div>
          {velocity_trend.length > 0 ? (
            <div className="space-y-3">
              <MiniBarChart
                data={velocity_trend.map((v) => ({ label: v.sprint_name, value: v.completed_points, color: 'bg-success' }))}
                max={maxVelocity}
              />
              <div className="flex justify-between text-xs text-ink-muted px-1">
                {velocity_trend.map((v, i) => (
                  <span key={i} className="truncate max-w-[60px] text-center">{v.sprint_name}</span>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {velocity_trend.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">{v.sprint_name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-ink-muted">Planned: {v.planned_points}</span>
                      <span className="text-success font-medium">Done: {v.completed_points}</span>
                      <span className="text-brand font-semibold">Velocity: {v.velocity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-ink-muted text-center py-8">No completed sprints yet</p>
          )}
        </Card>

        {/* Burndown Chart */}
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-5 w-5 text-danger" />
            <h2 className="text-lg font-semibold text-ink">Burndown Chart</h2>
          </div>
          {burndown.length > 0 ? (
            <div className="space-y-4">
              <div className="relative h-40 border border-border rounded-lg p-3 bg-bg-muted">
                {/* Ideal line */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <line
                    x1="5%"
                    y1="5%"
                    x2="95%"
                    y2="95%"
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Actual burndown */}
                  {burndown.map((b, i) => {
                    if (i === 0) return null;
                    const prev = burndown[i - 1];
                    const x1 = `${5 + ((i - 1) / Math.max(burndown.length - 1, 1)) * 90}%`;
                    const x2 = `${5 + (i / Math.max(burndown.length - 1, 1)) * 90}%`;
                    const y1 = `${5 + (1 - prev.remaining_points / maxBurndown) * 90}%`;
                    const y2 = `${5 + (1 - b.remaining_points / maxBurndown) * 90}%`;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        className="text-brand"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-brand" />
                  <span>Actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-border border-dashed" />
                  <span>Ideal</span>
                </div>
                <span className="ml-auto">Day {burndown[burndown.length - 1]?.day || 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-ink-muted text-center py-8">No active sprint for burndown</p>
          )}
        </Card>
      </div>

      {/* Team Performance */}
      {team_performance.length > 0 && (
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Team Performance (Current Sprint)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-ink-muted font-medium">Member</th>
                  <th className="text-center py-3 px-4 text-ink-muted font-medium">Assigned</th>
                  <th className="text-center py-3 px-4 text-ink-muted font-medium">Completed</th>
                  <th className="text-center py-3 px-4 text-ink-muted font-medium">Story Points</th>
                  <th className="text-center py-3 px-4 text-ink-muted font-medium">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {team_performance.map((member) => (
                  <tr key={member.user_id} className="border-b border-border/50 hover:bg-bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-ink">{member.user_name || member.user_id.slice(0, 8)}</span>
                    </td>
                    <td className="text-center py-3 px-4 text-ink-secondary">{member.tasks_assigned}</td>
                    <td className="text-center py-3 px-4">
                      <span className="font-medium text-success">{member.tasks_completed}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-semibold text-brand">{member.story_points_completed}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center gap-2 justify-center">
                        <Progress value={member.completion_rate} className="w-16 h-1.5" />
                        <span className="text-ink-secondary">{member.completion_rate.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sprint History */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-ink">Sprint History</h2>
        </div>
        <div className="space-y-3">
          {sprints.length > 0 ? (
            sprints.map((sprint) => {
              const completionRate = sprint.total_tasks ? (sprint.completed_tasks / sprint.total_tasks) * 100 : 0;
              return (
                <div key={sprint.id} className="flex items-center gap-4 p-3 bg-bg-muted border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{sprint.name}</span>
                      <StatusBadge status={sprint.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-ink-muted">
                      <span>{new Date(sprint.start_date).toLocaleDateString()} → {new Date(sprint.end_date).toLocaleDateString()}</span>
                      <span>{sprint.completed_tasks}/{sprint.total_tasks} tasks</span>
                      <span>{sprint.completed_points}/{sprint.total_points} pts</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-ink">{sprint.velocity}</p>
                    <p className="text-xs text-ink-muted">velocity</p>
                  </div>
                  <div className="w-24">
                    <Progress value={completionRate} />
                    <p className="text-xs text-ink-muted text-right mt-1">{completionRate.toFixed(0)}%</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-ink-muted text-center py-8">No sprints created yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}
