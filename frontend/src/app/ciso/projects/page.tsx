'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/UI/DataTable';
import { Card } from '@/components/UI/Card';
import { PageHeader } from '@/components/UI/PageHeader';
import { Badge } from '@/components/UI/Badge';
import { Select } from '@/components/UI/Select';
import { useCisoAuditProjects, useUpdateAuditProjectStatus, type CisoAuditProject } from '@/hooks/useCiso';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Target
} from 'lucide-react';

const AUDIT_STATUS_OPTIONS = [
  { value: 'needed', label: 'Audit Needed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
] as const;

export default function CisoProjectsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'needed' | 'in_progress' | 'completed'>('all');
  const queryFilter = statusFilter === 'all' ? undefined : statusFilter;
  const { data: projects = [], isLoading } = useCisoAuditProjects(queryFilter);
  const updateStatus = useUpdateAuditProjectStatus();

  const neededCount = projects.filter(p => p.audit_status === 'needed').length;
  const inProgressCount = projects.filter(p => p.audit_status === 'in_progress').length;
  const completedCount = projects.filter(p => p.audit_status === 'completed').length;
  const criticalCount = projects.filter(p => (p.priority === 'critical' || p.priority === 'high') && p.audit_status === 'needed').length;

  const columns: Column<CisoAuditProject>[] = useMemo(
    () => [
      { 
        key: 'name', 
        header: 'Project', 
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-medium text-ink">{row.name}</p>
            <p className="text-sm text-ink-muted mt-1">
              Priority: {row.priority} • Status: {row.status}
            </p>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Project Status',
        render: (row) => (
          <Badge variant={
            row.status === 'active' ? 'success' :
            row.status === 'planning' ? 'info' : 'default'
          }>
            {row.status}
          </Badge>
        ),
      },
      {
        key: 'audit_status',
        header: 'Audit Status',
        sortable: true,
        render: (row) => {
          const variant = 
            row.audit_status === 'completed' ? 'success' : 
            row.audit_status === 'in_progress' ? 'info' : 'warning';
          return <Badge variant={variant}>{row.audit_status.replace('_', ' ')}</Badge>;
        },
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (row) => (
          <Badge variant={
            row.priority === 'critical' ? 'error' : 
            row.priority === 'high' ? 'warning' : 'default'
          }>
            {row.priority}
          </Badge>
        ),
      },
      {
        key: 'action',
        header: 'Update Status',
        render: (row) => (
          <Select
            value={row.audit_status}
            onChange={(e) => {
              e.stopPropagation();
              updateStatus.mutate({
                id: row.id,
                audit_status: e.target.value as 'needed' | 'in_progress' | 'completed',
              });
            }}
            className="min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            {AUDIT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ),
      },
    ],
    [updateStatus],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Security Audits"
        description="Track and manage security audits for all projects"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Projects</span>
          </div>
          <p className="text-3xl font-bold text-ink">{projects.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Audit Needed</span>
          </div>
          <p className="text-3xl font-bold text-ink">{neededCount}</p>
          {criticalCount > 0 && (
            <p className="text-xs text-danger mt-1">{criticalCount} critical</p>
          )}
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">In Progress</span>
          </div>
          <p className="text-3xl font-bold text-ink">{inProgressCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Completed</span>
          </div>
          <p className="text-3xl font-bold text-ink">{completedCount}</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">All Project Audits</h2>
          <div className="w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'needed' | 'in_progress' | 'completed')}
            >
              <option value="all">All audit statuses</option>
              {AUDIT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={projects}
          isLoading={isLoading}
          searchKeys={['name', 'title', 'description', 'status', 'priority', 'audit_status']}
          pageSize={10}
          getRowId={(row) => row.id}
          emptyTitle="No audit projects found"
          emptyDescription="Projects with required audits will appear here."
          onRowClick={(row) => router.push(`/ciso/projects/${row.id}`)}
        />
      </Card>
    </div>
  );
}
