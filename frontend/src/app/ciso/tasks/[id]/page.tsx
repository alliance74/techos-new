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
import { AuditTaskFormModal } from '@/components/ciso/AuditTaskFormModal';
import {
  useCisoAuditProjects,
  useCisoTask,
  useDeleteAuditTask,
  useUpdateAuditTask,
  useUpdateCisoTaskStatus,
} from '@/hooks/useCiso';
import { Pencil, Trash2 } from 'lucide-react';

function priorityVariant(priority?: string) {
  if (priority === 'critical') return 'error' as const;
  if (priority === 'high') return 'warning' as const;
  if (priority === 'medium') return 'info' as const;
  return 'default' as const;
}

export default function CisoAuditTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useCisoTask(params.id);
  const { data: audits = [] } = useCisoAuditProjects();
  const updateTask = useUpdateAuditTask();
  const updateStatus = useUpdateCisoTaskStatus();
  const deleteTask = useDeleteAuditTask();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <EmptyState
        title="Audit task not found"
        description="This task may have been deleted."
        action={<Button onClick={() => router.push('/ciso/tasks')}>Back to tasks</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        description={task.description || 'Audit task details'}
        breadcrumbs={[
          { label: 'Audit Tasks', href: '/ciso/tasks' },
          { label: task.title },
        ]}
        actions={
          <>
            <Button
              variant={task.finished ? 'outline' : 'primary'}
              onClick={() => updateStatus.mutate({ id: task.id, finished: !task.finished })}
              loading={updateStatus.isPending}
            >
              {task.finished ? 'Reopen' : 'Complete'}
            </Button>
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
          <p className="text-sm text-ink-muted mb-2">Project Audit</p>
          <button
            type="button"
            className="font-medium text-ink hover:underline"
            onClick={() => router.push(`/ciso/projects/${task.project_audit_id}`)}
          >
            {task.project_audit_name || 'Open audit'}
          </button>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <p className="text-sm text-ink-muted mb-2">Priority</p>
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <p className="text-sm text-ink-muted mb-2">Status</p>
          <Badge variant={task.finished ? 'success' : 'warning'}>
            {task.finished ? 'Finished' : 'Not finished'}
          </Badge>
        </Card>
      </div>

      {editOpen && (
        <AuditTaskFormModal
          key={task.id}
          isOpen={editOpen}
          title="Edit Audit Task"
          audits={audits}
          initial={{
            project_audit_id: task.project_audit_id,
            title: task.title,
            description: task.description || '',
            priority: task.priority as 'low' | 'medium' | 'high' | 'critical',
            status: (task.status as 'todo' | 'in_progress' | 'done') || (task.finished ? 'done' : 'todo'),
          }}
          loading={updateTask.isPending}
          onClose={() => setEditOpen(false)}
          onSubmit={async (payload) => {
            await updateTask.mutateAsync({ id: task.id, ...payload });
            setEditOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete audit task"
        description={`Delete "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteTask.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteTask.mutateAsync(task.id);
          router.push('/ciso/tasks');
        }}
      />
    </div>
  );
}
