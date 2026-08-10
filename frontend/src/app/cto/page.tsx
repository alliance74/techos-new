'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { Progress } from '@/components/UI/Progress';
import { useDashboard } from '@/hooks/useDashboard';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useCodeReviews } from '@/hooks/useCodeReviews';
import Link from 'next/link';
import {
  Code2,
  GitBranch,
  Bug,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Server,
  Shield,
  Zap,
  Users,
  Clock,
  Target,
  Activity
} from 'lucide-react';

export default function CTODashboard() {
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: codeReviews } = useCodeReviews();

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const openTasks = tasks?.filter(t => t.status !== 'completed' && t.status !== 'done').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
  const openBugs = (dashboard?.bug_counts?.open || 0);
  const pendingReviews = codeReviews?.filter(cr => cr.status === 'pending' || cr.status === 'open').length || 0;

  const stats = [
    {
      title: 'Active Projects',
      value: activeProjects,
      change: `${projects?.filter(p => p.status === 'planning').length || 0} in planning`,
      icon: Code2,
      color: 'brand',
    },
    {
      title: 'Open Tasks',
      value: openTasks,
      change: `${inProgressTasks} in progress`,
      icon: CheckCircle,
      color: 'info',
    },
    {
      title: 'Open Bugs',
      value: openBugs,
      change: openBugs > 5 ? 'Needs attention' : 'Under control',
      icon: Bug,
      color: openBugs > 5 ? 'warning' : 'success',
    },
    {
      title: 'Code Reviews',
      value: pendingReviews,
      change: 'Awaiting review',
      icon: GitBranch,
      color: 'brand',
    },
  ];

  const recentProjects = projects?.slice(0, 5) || [];
  const criticalBugs = tasks?.filter(t => t.priority === 'critical' || t.priority === 'high').slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">CTO Dashboard</h1>
        <p className="text-ink-muted mt-2">Technology operations and engineering oversight</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6 bg-surface border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-muted">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-ink mt-2">{stat.value}</h3>
                  <p className={`text-sm mt-2 ${
                    stat.color === 'warning' ? 'text-warning' : 
                    stat.color === 'success' ? 'text-success' : 'text-ink-muted'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'warning' ? 'bg-warning-soft' :
                  stat.color === 'success' ? 'bg-success-soft' :
                  stat.color === 'info' ? 'bg-blue-900/30' : 'bg-brand-mist'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    stat.color === 'warning' ? 'text-warning' :
                    stat.color === 'success' ? 'text-success' :
                    stat.color === 'info' ? 'text-blue-400' : 'text-brand'
                  }`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-ink" />
              <h2 className="text-lg font-semibold text-ink">Active Projects</h2>
            </div>
            <Link href="/cto/projects" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={<Code2 className="h-12 w-12" />}
              title="No active projects"
              description="Projects will appear here"
            />
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/cto/projects/${project.id}`}
                  className="block p-4 bg-bg-muted border border-border rounded-lg hover:border-brand/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-ink">{project.name || project.title}</p>
                    <Badge variant={
                      project.status === 'active' ? 'success' :
                      project.status === 'planning' ? 'info' : 'default'
                    }>
                      {project.status}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-ink-muted line-clamp-2 mb-2">{project.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    {project.start_date && (
                      <span>Started {new Date(project.start_date).toLocaleDateString()}</span>
                    )}
                    {project.end_date && (
                      <span>Due {new Date(project.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger" />
              <h2 className="text-lg font-semibold text-ink">Critical Issues</h2>
            </div>
            <Link href="/cto/tasks" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          {criticalBugs.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-12 w-12 text-success" />}
              title="No critical issues"
              description="All systems running smoothly"
            />
          ) : (
            <div className="space-y-3">
              {criticalBugs.map((bug) => (
                <div
                  key={bug.id}
                  className="p-3 bg-bg-muted border border-border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-ink text-sm">{bug.title}</p>
                    <Badge variant={bug.priority === 'critical' ? 'error' : 'warning'}>
                      {bug.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {bug.status} • {bug.assignee_name || 'Unassigned'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/cto/architecture" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Server className="h-8 w-8 text-brand mb-4" />
            <h3 className="font-semibold text-ink mb-2">Architecture</h3>
            <p className="text-sm text-ink-muted">System design and technical architecture</p>
          </Card>
        </Link>
        <Link href="/cto/infrastructure" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Zap className="h-8 w-8 text-warning mb-4" />
            <h3 className="font-semibold text-ink mb-2">Infrastructure</h3>
            <p className="text-sm text-ink-muted">DevOps, deployment, and monitoring</p>
          </Card>
        </Link>
        <Link href="/cto/code-reviews" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <GitBranch className="h-8 w-8 text-success mb-4" />
            <h3 className="font-semibold text-ink mb-2">Code Reviews</h3>
            <p className="text-sm text-ink-muted">PR reviews and code quality</p>
          </Card>
        </Link>
        <Link href="/cto/team" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Users className="h-8 w-8 text-info mb-4" />
            <h3 className="font-semibold text-ink mb-2">Engineering Team</h3>
            <p className="text-sm text-ink-muted">Team performance and capacity</p>
          </Card>
        </Link>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <h3 className="text-sm font-medium text-ink mb-4">Engineering Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Code Quality</span>
              <span className="text-xs text-success">85%</span>
            </div>
            <Progress value={85} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Test Coverage</span>
              <span className="text-xs text-warning">72%</span>
            </div>
            <Progress value={72} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Sprint Velocity</span>
              <span className="text-xs text-success">92%</span>
            </div>
            <Progress value={92} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">System Uptime</span>
              <span className="text-xs text-success">99.8%</span>
            </div>
            <Progress value={99.8} />
          </div>
        </div>
      </Card>
    </div>
  );
}
