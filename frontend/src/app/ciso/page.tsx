'use client';

import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckSquare, 
  FileText, 
  AlertTriangle,
  Shield,
  Lock,
  Activity,
  Eye,
  Users,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Progress } from '@/components/UI/Progress';
import { PageHeader } from '@/components/UI/PageHeader';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { useCisoAuditProjects, useCisoReports, useCisoTasks } from '@/hooks/useCiso';

export default function CisoDashboardPage() {
  const { data: finishedTasks = [], isLoading: tasksLoading } = useCisoTasks('finished');
  const { data: pendingTasks = [] } = useCisoTasks('not_finished');
  const { data: audits = [], isLoading: auditsLoading } = useCisoAuditProjects();
  const { data: reports = [], isLoading: reportsLoading } = useCisoReports();

  const inProgressAudits = audits.filter((project) => project.audit_status === 'in_progress').length;
  const neededAudits = audits.filter((project) => project.audit_status === 'needed').length;
  const completedAudits = audits.filter((project) => project.audit_status === 'completed').length;
  const criticalTasks = pendingTasks.filter((task) => task.priority === 'critical' || task.priority === 'high').length;

  if (tasksLoading || auditsLoading || reportsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">CISO Dashboard</h1>
          <p className="text-ink-muted mt-2">Security operations and compliance oversight</p>
        </div>
        {criticalTasks > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-danger-soft border border-danger/20 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-danger-text font-medium">{criticalTasks} critical tasks</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-muted">Security Tasks</p>
              <h3 className="text-3xl font-bold text-ink mt-2">{pendingTasks.length}</h3>
              <p className="text-sm mt-2 text-ink-muted">
                {finishedTasks.length} completed
              </p>
            </div>
            <div className="p-3 rounded-lg bg-brand-mist">
              <CheckSquare className="h-5 w-5 text-brand" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-muted">Audits Needed</p>
              <h3 className="text-3xl font-bold text-ink mt-2">{neededAudits}</h3>
              <p className="text-sm mt-2 text-warning">
                {inProgressAudits} in progress
              </p>
            </div>
            <div className={`p-3 rounded-lg ${neededAudits > 0 ? 'bg-warning-soft' : 'bg-success-soft'}`}>
              <ShieldCheck className={`h-5 w-5 ${neededAudits > 0 ? 'text-warning' : 'text-success'}`} />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-muted">Security Reports</p>
              <h3 className="text-3xl font-bold text-ink mt-2">{reports.length}</h3>
              <p className="text-sm mt-2 text-success">
                All documented
              </p>
            </div>
            <div className="p-3 rounded-lg bg-info-soft">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-muted">Compliance Score</p>
              <h3 className="text-3xl font-bold text-ink mt-2">87%</h3>
              <p className="text-sm mt-2 text-success">
                +5% this month
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success-soft">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold text-ink">Critical Security Tasks</h2>
            </div>
            <Link href="/ciso/tasks" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {pendingTasks.filter(t => t.priority === 'critical' || t.priority === 'high').slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-3 bg-bg-muted border border-border rounded-lg"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-ink text-sm">{task.title}</p>
                  <Badge variant={task.priority === 'critical' ? 'error' : 'warning'}>
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted">
                  {task.status} • {task.assignee_id ? 'Assigned' : 'Unassigned'}
                </p>
              </div>
            ))}
            {criticalTasks === 0 && (
              <div className="text-center py-8 text-ink-muted">
                <CheckSquare className="h-12 w-12 mx-auto mb-2 text-success" />
                <p>No critical security tasks</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-ink">Audit Queue</h2>
            </div>
            <Link href="/ciso/projects" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {audits.filter(a => a.audit_status === 'needed' || a.audit_status === 'in_progress').slice(0, 5).map((audit) => (
              <div
                key={audit.id}
                className="p-3 bg-bg-muted border border-border rounded-lg"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-ink text-sm">{audit.name}</p>
                  <Badge variant={audit.audit_status === 'needed' ? 'warning' : 'info'}>
                    {audit.audit_status === 'needed' ? 'Needs Audit' : 'In Progress'}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted">
                  Project requires security audit
                </p>
              </div>
            ))}
            {neededAudits === 0 && inProgressAudits === 0 && (
              <div className="text-center py-8 text-ink-muted">
                <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-success" />
                <p>No audits pending</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <h3 className="text-sm font-medium text-ink mb-4">Security Health Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Vulnerability Patching</span>
              <span className="text-xs text-success">92%</span>
            </div>
            <Progress value={92} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Access Control</span>
              <span className="text-xs text-success">95%</span>
            </div>
            <Progress value={95} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Data Encryption</span>
              <span className="text-xs text-success">100%</span>
            </div>
            <Progress value={100} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Compliance Training</span>
              <span className="text-xs text-warning">78%</span>
            </div>
            <Progress value={78} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/ciso/tasks">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <CheckSquare className="h-8 w-8 text-brand mb-4" />
            <h3 className="font-semibold text-ink mb-2">Task Management</h3>
            <p className="text-sm text-ink-muted">Track security tasks and incidents</p>
          </Card>
        </Link>
        <Link href="/ciso/projects">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <ShieldCheck className="h-8 w-8 text-success mb-4" />
            <h3 className="font-semibold text-ink mb-2">Project Audits</h3>
            <p className="text-sm text-ink-muted">Security audits and compliance checks</p>
          </Card>
        </Link>
        <Link href="/ciso/reports">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <FileText className="h-8 w-8 text-info mb-4" />
            <h3 className="font-semibold text-ink mb-2">Security Reports</h3>
            <p className="text-sm text-ink-muted">Generate and manage security reports</p>
          </Card>
        </Link>
        <Link href="/ciso/settings">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Lock className="h-8 w-8 text-warning mb-4" />
            <h3 className="font-semibold text-ink mb-2">Security Settings</h3>
            <p className="text-sm text-ink-muted">Configure security policies</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
