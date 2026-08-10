'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Progress } from '@/components/UI/Progress';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { useDashboard } from '@/hooks/useDashboard';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Code2,
  GitBranch,
  Bug,
  CheckCircle,
  Clock,
  Users,
  Target,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  AlertCircle,
} from 'lucide-react';

export default function CTOAnalyticsPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  if (dashboardLoading || projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Mock data for analytics (replace with real API data)
  const codeQualityMetrics = [
    { label: 'Code Coverage', value: 87, trend: 'up', change: '+5%' },
    { label: 'Test Pass Rate', value: 94, trend: 'up', change: '+2%' },
    { label: 'Code Duplication', value: 8, trend: 'down', change: '-3%', inverted: true },
    { label: 'Technical Debt', value: 15, trend: 'down', change: '-7%', inverted: true },
  ];

  const teamMetrics = [
    { label: 'Sprint Velocity', value: 42, unit: 'points', trend: 'up', change: '+8%' },
    { label: 'Avg PR Review Time', value: 4.5, unit: 'hours', trend: 'down', change: '-15%' },
    { label: 'Deployment Frequency', value: 18, unit: '/week', trend: 'up', change: '+12%' },
    { label: 'Bug Fix Time', value: 2.3, unit: 'days', trend: 'down', change: '-18%' },
  ];

  const systemMetrics = [
    { label: 'API Response Time', value: 125, unit: 'ms', status: 'success' },
    { label: 'Error Rate', value: 0.3, unit: '%', status: 'success' },
    { label: 'Uptime', value: 99.9, unit: '%', status: 'success' },
    { label: 'Database Queries', value: 45, unit: 'ms', status: 'success' },
  ];

  const projectHealth = [
    { name: 'Mobile App Redesign', health: 92, status: 'on_track', tasks: 24, completed: 18 },
    { name: 'API v3 Migration', health: 78, status: 'at_risk', tasks: 32, completed: 20 },
    { name: 'Payment Integration', health: 95, status: 'on_track', tasks: 15, completed: 14 },
    { name: 'Security Audit', health: 65, status: 'at_risk', tasks: 18, completed: 8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Engineering Analytics</h1>
          <p className="text-ink-muted mt-2">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-5 w-5 text-brand" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">Active Projects</p>
          <h3 className="text-3xl font-bold text-ink mt-2">{activeProjects}</h3>
          <p className="text-xs text-success mt-2">+3 from last month</p>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <Target className="h-5 w-5 text-success" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">Task Completion</p>
          <h3 className="text-3xl font-bold text-ink mt-2">{completionRate}%</h3>
          <p className="text-xs text-success mt-2">+5% from last week</p>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <Code2 className="h-5 w-5 text-info" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">Code Quality</p>
          <h3 className="text-3xl font-bold text-ink mt-2">87%</h3>
          <p className="text-xs text-success mt-2">+5% improvement</p>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <Zap className="h-5 w-5 text-warning" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">Sprint Velocity</p>
          <h3 className="text-3xl font-bold text-ink mt-2">42</h3>
          <p className="text-xs text-success mt-2">+8% increase</p>
        </Card>
      </div>

      {/* Code Quality Metrics */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-6">
          <Code2 className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-ink">Code Quality Metrics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {codeQualityMetrics.map((metric) => (
            <div key={metric.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-secondary">{metric.label}</span>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' && !metric.inverted && (
                    <TrendingUp className="h-3 w-3 text-success" />
                  )}
                  {metric.trend === 'down' && !metric.inverted && (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  )}
                  {metric.trend === 'up' && metric.inverted && (
                    <TrendingUp className="h-3 w-3 text-danger" />
                  )}
                  {metric.trend === 'down' && metric.inverted && (
                    <TrendingDown className="h-3 w-3 text-success" />
                  )}
                  <span className={`text-xs ${
                    (metric.trend === 'up' && !metric.inverted) || (metric.trend === 'down' && metric.inverted)
                      ? 'text-success'
                      : 'text-danger'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <Progress value={metric.value} />
              <p className="text-2xl font-bold text-ink">{metric.value}%</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Team Performance */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-ink">Team Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMetrics.map((metric) => (
            <div key={metric.label} className="p-4 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ink-muted">{metric.label}</span>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-success" />
                  )}
                  <span className="text-xs text-success">{metric.change}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-ink">
                {metric.value}
                <span className="text-sm font-normal text-ink-muted ml-1">{metric.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold text-ink">System Health</h2>
          </div>
          <div className="space-y-4">
            {systemMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between p-3 bg-bg-muted border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-ink-secondary">{metric.label}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">
                    {metric.value}
                    <span className="text-sm font-normal text-ink-muted ml-1">{metric.unit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Project Health */}
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <LineChart className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Project Health</h2>
          </div>
          <div className="space-y-4">
            {projectHealth.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{project.name}</span>
                  <Badge variant={project.status === 'on_track' ? 'success' : 'warning'}>
                    {project.health}%
                  </Badge>
                </div>
                <Progress value={project.health} />
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{project.completed}/{project.tasks} tasks completed</span>
                  <span className={project.status === 'on_track' ? 'text-success' : 'text-warning'}>
                    {project.status === 'on_track' ? 'On Track' : 'At Risk'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-ink">Activity Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <GitBranch className="h-5 w-5 text-brand" />
              <span className="text-sm text-ink-muted">Commits This Week</span>
            </div>
            <p className="text-3xl font-bold text-ink">247</p>
            <p className="text-xs text-success mt-2">+12% from last week</p>
          </div>
          <div className="p-4 bg-bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm text-ink-muted">PRs Merged</span>
            </div>
            <p className="text-3xl font-bold text-ink">32</p>
            <p className="text-xs text-success mt-2">+8% from last week</p>
          </div>
          <div className="p-4 bg-bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Bug className="h-5 w-5 text-danger" />
              <span className="text-sm text-ink-muted">Bugs Fixed</span>
            </div>
            <p className="text-3xl font-bold text-ink">18</p>
            <p className="text-xs text-danger mt-2">-5% from last week</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
