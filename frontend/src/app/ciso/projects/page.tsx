'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/UI/DataTable';
import { Card } from '@/components/UI/Card';
import { PageHeader } from '@/components/UI/PageHeader';
import { Badge } from '@/components/UI/Badge';
import { Select } from '@/components/UI/Select';
import { Button } from '@/components/UI/Button';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { ProjectAuditFormModal } from '@/components/ciso/ProjectAuditFormModal';
import {
  useCisoAuditProjects,
  useCreateProjectAudit,
  useDeleteProjectAudit,
  useUpdateProjectAudit,
  type CisoAuditProject,
  type ProjectAuditStatus,
} from '@/hooks/useCiso';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

const AUDIT_STATUS_OPTIONS = [
  { value: 'needed', label: 'Audit Needed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
] as const;

function statusVariant(status: string) {
  if (status === 'completed') return 'success' as const;
  if (status === 'in_progress') return 'info' as const;
  return 'warning' as const;
}

export default function CisoProjectsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectAuditStatus>('all');
  const queryFilter = statusFilter === 'all' ? undefined : statusFilter;
  const { data: audits = [], isLoading } = useCisoAuditProjects(queryFilter);
  const createAudit = useCreateProjectAudit();
  const updateAudit = useUpdateProjectAudit();
  const deleteAudit = useDeleteProjectAudit();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CisoAuditProject | null>(null);
  const [deleting, setDeleting] = useState<CisoAuditProject | null>(null);

  const neededCount = audits.filter((p) => p.status === 'needed').length;
  const inProgressCount = audits.filter((p) => p.status === 'in_progress').length;
  const completedCount = audits.filter((p) => p.status === 'completed').length;

  const columns: Column<CisoAuditProject>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Project Audit',
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-medium text-ink">{row.name}</p>
            {row.description && (
              <p className="text-sm text-ink-muted line-clamp-1 mt-1">{row.description}</p>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Audit Status',
        sortable: true,
        render: (row) => (
          <Badge variant={statusVariant(row.status)}>{row.status.replace('_', ' ')}</Badge>
        ),
      },
      {
        key: 'task_count',
        header: 'Tasks',
        render: (row) => (
          <span className="text-sm text-ink-secondary">{row.task_count ?? 0}</span>
        ),
      },
      {
        key: 'action',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(row);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Audits"
        description="Create and manage security audits. Each audit can have its own tasks."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project Audit
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Audits</span>
          </div>
          <p className="text-3xl font-bold text-ink">{audits.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Audit Needed</span>
          </div>
          <p className="text-3xl font-bold text-ink">{neededCount}</p>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">All Project Audits</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-56">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectAuditStatus)}
              >
                <option value="all">All audit statuses</option>
                {AUDIT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project Audit
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={audits}
          isLoading={isLoading}
          searchKeys={['name', 'description', 'status']}
          pageSize={10}
          getRowId={(row) => row.id}
          emptyTitle="No project audits yet"
          emptyDescription="Create a project audit with a name and description, then attach audit tasks to it."
          emptyAction={{
            label: 'Create Project Audit',
            onClick: () => {
              setEditing(null);
              setFormOpen(true);
            },
          }}
          onRowClick={(row) => router.push(`/ciso/projects/${row.id}`)}
        />
      </Card>

      {formOpen && (
        <ProjectAuditFormModal
          key={editing?.id || 'create'}
          isOpen={formOpen}
          title={editing ? 'Edit Project Audit' : 'Create Project Audit'}
          initial={
            editing
              ? { name: editing.name, description: editing.description || '', status: editing.status }
              : undefined
          }
          loading={createAudit.isPending || updateAudit.isPending}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={async (payload) => {
            if (editing) {
              await updateAudit.mutateAsync({ id: editing.id, ...payload });
            } else {
              await createAudit.mutateAsync(payload);
            }
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Delete project audit"
        description={`Delete "${deleting?.name}" and all of its audit tasks? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteAudit.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteAudit.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
