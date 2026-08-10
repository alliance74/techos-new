'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Progress } from '@/components/UI/Progress';
import {
  Zap,
  Plus,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Activity,
} from 'lucide-react';

// Mock sprints data
const sprints = [
  {
    id: '1',
    name: 'Sprint 24 - Dashboard Redesign',
    status: 'active',
    start_date: '2026-08-05',
    end_date: '2026-08-18',
    goal: 'Complete dashboard redesign and implement new analytics',
    total_points: 42,
    completed_points: 28,
    total_tasks: 18,
    completed_tasks: 12,
    team_members: 5,
    velocity: 38,
  },
  {
    id: '2',
    name: 'Sprint 23 - API Performance',
    status: 'completed',
    start_date: '2026-07-22',
    end_date: '2026-08-04',
    goal: 'Optimize API endpoints and improve response times',
    total_points: 38,
    completed_points: 38,
    total_tasks: 15,
    completed_tasks: 15,
    team_members: 5,
    velocity: 38,
  },
  {
    id: '3',
    name: 'Sprint 22 - Security Updates',
    status: 'completed',
    start_date: '2026-07-08',
    end_date: '2026-07-21',
    goal: 'Address security vulnerabilities and implement 2FA',
    total_points: 35,
    completed_points: 32,
    total_tasks: 14,
    completed_tasks: 13,
    team_members: 4,
    velocity: 32,
  },
  {
    id: '4',
    name: 'Sprint 25 - Planning',
    status: 'planning',
    start_date: '2026-08-19',
    end_date: '2026-09-01',
    goal: 'Mobile app development kickoff',
    total_points: 45,
    completed_points: 0,
    total_tasks: 20,
    completed_tasks: 0,
    team_members: 6,
    velocity: 0,
  },
];

export default function SprintsPage() {
  const router = useRouter();
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeSprint = sprints.find(s => s.status === 'active');
  const avgVelocity = Math.round(sprints.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.velocity, 0) / sprints.filter(s => s.status === 'completed').length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Sprints</h1>
          <p className="text-ink-muted mt-2">Agile sprint planning and tracking</p>
        </div>
        <Button onClick={() => router.push('/cto/sprints/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Sprint
        </Button>
      </div>

      {/* Sprint Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Active Sprint</span>
          </div>
          <p className="text-3xl font-bold text-ink">{activeSprint ? '1' : '0'}</p>
          {activeSprint && (
            <p className="text-xs text-info mt-2">{activeSprint.name}</p>
          )}
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Avg Velocity</span>
          </div>
          <p className="text-3xl font-bold text-ink">{avgVelocity}</p>
          <p className="text-xs text-ink-muted mt-2">story points/sprint</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Completed</span>
          </div>
          <p className="text-3xl font-bold text-ink">
            {sprints.filter(s => s.status === 'completed').length}
          </p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Team Size</span>
          </div>
          <p className="text-3xl font-bold text-ink">{activeSprint?.team_members || 0}</p>
        </Card>
      </div>

      {/* Active Sprint Card */}
      {activeSprint && (
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-soft rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">{activeSprint.name}</h3>
                <p className="text-sm text-ink-muted">{activeSprint.goal}</p>
              </div>
            </div>
            <Badge variant="info">Active</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-ink-muted" />
                <span className="text-sm text-ink-secondary">Sprint Duration</span>
              </div>
              <p className="text-sm text-ink">
                {new Date(activeSprint.start_date).toLocaleDateString()} - {new Date(activeSprint.end_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                {Math.ceil((new Date(activeSprint.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-ink-muted" />
                <span className="text-sm text-ink-secondary">Story Points</span>
              </div>
              <p className="text-2xl font-bold text-ink">
                {activeSprint.completed_points}/{activeSprint.total_points}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                {Math.round((activeSprint.completed_points / activeSprint.total_points) * 100)}% complete
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-ink-muted" />
                <span className="text-sm text-ink-secondary">Tasks</span>
              </div>
              <p className="text-2xl font-bold text-ink">
                {activeSprint.completed_tasks}/{activeSprint.total_tasks}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                {Math.round((activeSprint.completed_tasks / activeSprint.total_tasks) * 100)}% complete
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ink-secondary">Sprint Progress</span>
                <span className="text-sm font-medium text-ink">
                  {Math.round((activeSprint.completed_points / activeSprint.total_points) * 100)}%
                </span>
              </div>
              <Progress value={(activeSprint.completed_points / activeSprint.total_points) * 100} />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <Button onClick={() => router.push(`/cto/sprints/${activeSprint.id}`)}>
                View Sprint Board
              </Button>
              <Button variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                Sprint Report
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* All Sprints List */}
      <Card className="p-6 bg-surface border border-border">
        <h3 className="text-sm font-medium text-ink mb-4">All Sprints</h3>
        <div className="space-y-3">
          {sprints.map((sprint) => {
            const completion = sprint.total_points > 0 
              ? Math.round((sprint.completed_points / sprint.total_points) * 100)
              : 0;

            return (
              <Card
                key={sprint.id}
                className="p-4 bg-bg-muted border border-border cursor-pointer hover:border-brand/40 transition-all"
                onClick={() => router.push(`/cto/sprints/${sprint.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-ink">{sprint.name}</h4>
                      <Badge variant={
                        sprint.status === 'active' ? 'info' :
                        sprint.status === 'completed' ? 'success' :
                        sprint.status === 'planning' ? 'warning' : 'default'
                      }>
                        {sprint.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-muted">{sprint.goal}</p>
                  </div>
                  {sprint.status === 'completed' && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">Velocity: {sprint.velocity}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 text-xs text-ink-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {sprint.completed_points}/{sprint.total_points} points
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {sprint.completed_tasks}/{sprint.total_tasks} tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {sprint.team_members} members
                  </span>
                </div>

                {sprint.status !== 'planning' && (
                  <div>
                    <Progress value={completion} />
                    <p className="text-xs text-ink-muted mt-1">{completion}% complete</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Sprint Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <TrendingUp className="h-8 w-8 text-brand mb-4" />
          <h3 className="font-semibold text-ink mb-2">Sprint Velocity</h3>
          <p className="text-sm text-ink-muted mb-4">Track team velocity over time</p>
          <Button variant="outline" size="sm" className="w-full">
            View Chart
          </Button>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Activity className="h-8 w-8 text-success mb-4" />
          <h3 className="font-semibold text-ink mb-2">Burndown Chart</h3>
          <p className="text-sm text-ink-muted mb-4">Sprint progress visualization</p>
          <Button variant="outline" size="sm" className="w-full">
            View Chart
          </Button>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Clock className="h-8 w-8 text-info mb-4" />
          <h3 className="font-semibold text-ink mb-2">Sprint Retrospective</h3>
          <p className="text-sm text-ink-muted mb-4">Review and improve process</p>
          <Button variant="outline" size="sm" className="w-full">
            View History
          </Button>
        </Card>
      </div>
    </div>
  );
}
