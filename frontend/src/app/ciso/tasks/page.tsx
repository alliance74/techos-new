'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/UI/PageHeader';
import { Card } from '@/components/UI/Card';
import { DataTable, type Column } from '@/components/UI/DataTable';
import { Badge } from '@/components/UI/Badge';
import { Select } from '@/components/UI/Select';
import { Button } from '@/components/UI/Button';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { AuditTaskFormModal } from '@/components/ciso/AuditTaskFormModal';
import {
  useCisoAuditProjects,
  useCisoTasks,
  useCreateAuditTask,
  useDeleteAuditTask,
  useUpdateAuditTask,
  useUpdateCisoTaskStatus,
  type AuditTaskPriority,
  type AuditTaskStatus,
  type CisoTask,
} from '@/hooks/useCiso';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

function priorityVariant(priority: string) {
  if (priority === 'critical') return 'error' as const;
  if (priority === 'high') return 'warning' as const;
  if (priority === 'medium') return 'info' as const;
  return 'default' as const;
}

export default function CisoTasksPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'finished' | 'not_finished'>('all');
  const queryFilter = statusFilter === 'all' ? undefined : statusFilter;
  const { data: tasks = [], isLoading } = useCisoTasks(queryFilter);
  const { data: audits = [] } = useCisoAuditProjects();
  const createTask = useCreateAuditTask();
  const updateTask = useUpdateAuditTask();
  const updateStatus = useUpdateCisoTaskStatus();
  const deleteTask = useDeleteAuditTask();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CisoTask | null>(null);
  const [deleting, setDeleting] = useState<CisoTask | null>(null);

  const finishedCount = tasks.filter((t) => t.finished).length;
  const notFinishedCount = tasks.filter((t) => !t.finished).length;
  const criticalCount = tasks.filter(
    (t) => (t.priority === 'critical' || t.priority === 'high') && !t.finished,
  ).length;

  const columns: Column<CisoTask>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Task',
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-medium text-ink">{row.title}</p>
            {row.description && (
              <p className="text-sm text-ink-muted line-clamp-1 mt-1">{row.description}</p>
            )}
          </div>
        ),
      },
      {
        key: 'project_audit_name',
        header: 'Project Audit',
        sortable: true,
        render: (row) => (
          <span className="text-sm text-ink-secondary">{row.project_audit_name || '—'}</span>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        sortable: true,
        render: (row) => <Badge variant={priorityVariant(row.priority)}>{row.priority}</Badge>,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => (
          <Badge variant={row.finished ? 'success' : 'warning'}>
            {row.finished ? 'Finished' : 'Not Finished'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={row.finished ? 'outline' : 'primary'}
              onClick={() => updateStatus.mutate({ id: row.id, finished: !row.finished })}
              loading={updateStatus.isPending}
            >
              {row.finished ? 'Reopen' : 'Complete'}
            </Button>
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
    [updateStatus],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Tasks"
        description="Create tasks against a project audit so security work stays organized."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Audit Task
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Tasks</span>
          </div>
          <p className="text-3xl font-bold text-ink">{tasks.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Finished</span>
          </div>
          <p className="text-3xl font-bold text-ink">{finishedCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">In Progress</span>
          </div>
          <p className="text-3xl font-bold text-ink">{notFinishedCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-ink-muted">Critical</span>
          </div>
          <p className="text-3xl font-bold text-ink">{criticalCount}</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">All Audit Tasks</h2>
          <div className="w-52">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'finished' | 'not_finished')}
            >
              <option value="all">All tasks</option>
              <option value="not_finished">Not finished</option>
              <option value="finished">Finished</option>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={tasks}
          isLoading={isLoading}
          searchKeys={['title', 'description', 'status', 'priority', 'project_audit_name']}
          pageSize={10}
          getRowId={(row) => row.id}
          emptyTitle="No audit tasks found"
          emptyDescription="Create a task and select which project audit it belongs to."
          emptyAction={{
            label: 'Create Audit Task',
            onClick: () => {
              setEditing(null);
              setFormOpen(true);
            },
          }}
          onRowClick={(row) => router.push(`/ciso/tasks/${row.id}`)}
        />
      </Card>

      {formOpen && (
        <AuditTaskFormModal
          key={editing?.id || 'create'}
          isOpen={formOpen}
          title={editing ? 'Edit Audit Task' : 'Create Audit Task'}
          audits={audits}
          initial={
            editing
              ? {
                  project_audit_id: editing.project_audit_id,
                  title: editing.title,
                  description: editing.description || '',
                  priority: editing.priority as AuditTaskPriority,
                  status: (editing.status as AuditTaskStatus) || (editing.finished ? 'done' : 'todo'),
                }
              : undefined
          }
          loading={createTask.isPending || updateTask.isPending}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={async (payload) => {
            if (editing) {
              await updateTask.mutateAsync({ id: editing.id, ...payload });
            } else {
              await createTask.mutateAsync(payload);
            }
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Delete audit task"
        description={`Delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteTask.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteTask.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
