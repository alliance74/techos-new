'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/UI/PageHeader';
import { Card } from '@/components/UI/Card';
import { DataTable, type Column } from '@/components/UI/DataTable';
import { Badge } from '@/components/UI/Badge';
import { Select } from '@/components/UI/Select';
import { Button } from '@/components/UI/Button';
import { useCisoTasks, useUpdateCisoTaskStatus, type CisoTask } from '@/hooks/useCiso';
import { 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Shield,
  Target
} from 'lucide-react';

export default function CisoTasksPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'finished' | 'not_finished'>('all');
  const queryFilter = statusFilter === 'all' ? undefined : statusFilter;
  const { data: tasks = [], isLoading } = useCisoTasks(queryFilter);
  const updateStatus = useUpdateCisoTaskStatus();

  const finishedCount = tasks.filter(t => t.finished).length;
  const notFinishedCount = tasks.filter(t => !t.finished).length;
  const criticalCount = tasks.filter(t => (t.priority === 'critical' || t.priority === 'high') && !t.finished).length;

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
        key: 'priority',
        header: 'Priority',
        sortable: true,
        render: (row) => (
          <Badge variant={
            row.priority === 'critical' ? 'error' : 
            row.priority === 'high' ? 'warning' : 
            row.priority === 'medium' ? 'info' : 'default'
          }>
            {row.priority}
          </Badge>
        ),
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
        key: 'assignee',
        header: 'Assignee',
        render: (row) => (
          <span className="text-sm text-ink-secondary">{row.assignee_name || 'Unassigned'}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        render: (row) => (
          <Button
            size="sm"
            variant={row.finished ? 'outline' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              updateStatus.mutate({ id: row.id, finished: !row.finished });
            }}
            loading={updateStatus.isPending}
          >
            {row.finished ? 'Reopen' : 'Complete'}
          </Button>
        ),
      },
    ],
    [updateStatus],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Tasks"
        description="Track and manage security task completion status"
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
          <h2 className="text-lg font-semibold text-ink">All Security Tasks</h2>
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
          searchKeys={['title', 'description', 'status', 'priority', 'assignee_name']}
          pageSize={10}
          getRowId={(row) => row.id}
          emptyTitle="No security tasks found"
          emptyDescription="Tasks will appear here when created."
          onRowClick={(row) => router.push(`/ciso/tasks/${row.id}`)}
        />
      </Card>
    </div>
  );
}
