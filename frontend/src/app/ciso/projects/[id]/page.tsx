'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/UI/PageHeader';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { ProjectAuditFormModal } from '@/components/ciso/ProjectAuditFormModal';
import { AuditTaskFormModal } from '@/components/ciso/AuditTaskFormModal';
import {
  useCisoAudit,
  useCreateAuditTask,
  useDeleteAuditTask,
  useDeleteProjectAudit,
  useUpdateCisoTaskStatus,
  useUpdateProjectAudit,
  type CisoTask,
} from '@/hooks/useCiso';
import { Pencil, Plus, Trash2 } from 'lucide-react';

function statusVariant(status?: string) {
  if (status === 'completed' || status === 'done') return 'success' as const;
  if (status === 'in_progress') return 'info' as const;
  return 'warning' as const;
}

export default function CisoProjectAuditDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: audit, isLoading } = useCisoAudit(params.id);
  const updateAudit = useUpdateProjectAudit();
  const deleteAudit = useDeleteProjectAudit();
  const createTask = useCreateAuditTask();
  const updateTaskStatus = useUpdateCisoTaskStatus();
  const deleteTask = useDeleteAuditTask();
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingTask, setDeletingTask] = useState<CisoTask | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!audit) {
    return (
      <EmptyState
        title="Project audit not found"
        description="This audit may have been deleted."
        action={<Button onClick={() => router.push('/ciso/projects')}>Back to audits</Button>}
      />
    );
  }

  const tasks = audit.tasks || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={audit.name}
        description={audit.description || 'Project audit details'}
        breadcrumbs={[
          { label: 'Project Audits', href: '/ciso/projects' },
          { label: audit.name },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 bg-surface border border-border">
          <p className="text-sm text-ink-muted mb-2">Status</p>
          <Badge variant={statusVariant(audit.status)}>{audit.status.replace('_', ' ')}</Badge>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <p className="text-sm text-ink-muted mb-2">Tasks</p>
          <p className="text-2xl font-bold text-ink">{tasks.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <p className="text-sm text-ink-muted mb-2">Finished</p>
          <p className="text-2xl font-bold text-ink">{tasks.filter((task) => task.finished).length}</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Audit Tasks</h2>
          <Button onClick={() => setTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-ink-muted">No tasks yet. Add a task for this project audit.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-bg-muted p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  type="button"
                  className="text-left"
                  onClick={() => router.push(`/ciso/tasks/${task.id}`)}
                >
                  <p className="font-medium text-ink">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-ink-muted line-clamp-1 mt-1">{task.description}</p>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(task.status)}>
                    {task.finished ? 'Finished' : task.status.replace('_', ' ')}
                  </Badge>
                  <Button
                    size="sm"
                    variant={task.finished ? 'outline' : 'primary'}
                    onClick={() => updateTaskStatus.mutate({ id: task.id, finished: !task.finished })}
                  >
                    {task.finished ? 'Reopen' : 'Complete'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeletingTask(task)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editOpen && (
        <ProjectAuditFormModal
          key={audit.id}
          isOpen={editOpen}
          title="Edit Project Audit"
          initial={{ name: audit.name, description: audit.description || '', status: audit.status }}
          loading={updateAudit.isPending}
          onClose={() => setEditOpen(false)}
          onSubmit={async (payload) => {
            await updateAudit.mutateAsync({ id: audit.id, ...payload });
            setEditOpen(false);
          }}
        />
      )}

      {taskOpen && (
        <AuditTaskFormModal
          key={`task-${audit.id}`}
          isOpen={taskOpen}
          title="Create Audit Task"
          audits={[audit]}
          initial={{ project_audit_id: audit.id }}
          loading={createTask.isPending}
          onClose={() => setTaskOpen(false)}
          onSubmit={async (payload) => {
            await createTask.mutateAsync(payload);
            setTaskOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete project audit"
        description={`Delete "${audit.name}" and all of its audit tasks? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteAudit.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteAudit.mutateAsync(audit.id);
          router.push('/ciso/projects');
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTask)}
        title="Delete audit task"
        description={`Delete "${deletingTask?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteTask.isPending}
        onCancel={() => setDeletingTask(null)}
        onConfirm={async () => {
          if (!deletingTask) return;
          await deleteTask.mutateAsync(deletingTask.id);
          setDeletingTask(null);
        }}
      />
    </div>
  );
}
