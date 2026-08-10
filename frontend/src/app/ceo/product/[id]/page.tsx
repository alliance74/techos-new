'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  FolderKanban,
  Pencil,
  Building2,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useEntityActivity, useEntityItem, useUpdateEntity } from '@/hooks/useEntityApi';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Modal } from '@/components/UI/Modal';
import { Progress } from '@/components/UI/Progress';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';

function timelineProgress(start?: string, end?: string, fallback?: number) {
  if (typeof fallback === 'number') return fallback;
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!(e > s)) return 0;
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

export default function CeoProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const projectQuery = useEntityItem('projects', id);
  const activityQuery = useEntityActivity('projects', id);
  const updateProject = useUpdateEntity('projects');

  const project = projectQuery.data as any;
  const [editOpen, setEditOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');

  const progress = useMemo(
    () =>
      timelineProgress(
        project?.start_date,
        project?.end_date || project?.dueDate,
        typeof project?.progress === 'number' ? project.progress : undefined,
      ),
    [project],
  );

  const activities = useMemo(() => {
    return ((activityQuery.data || []) as Array<{
      id?: string;
      summary?: string;
      action?: string;
      actor_name?: string;
      created_at?: string;
    }>).map((a, i) => ({
      id: a.id || `act-${i}`,
      title: a.summary || a.action || 'Activity',
      meta: a.actor_name ? `by ${a.actor_name}` : undefined,
      time: a.created_at ? new Date(a.created_at).toLocaleString() : '—',
    }));
  }, [activityQuery.data]);

  const openEdit = () => {
    if (!project) return;
    setClientName(project.client_name || project.owner || '');
    setStartDate(project.start_date || '');
    setEndDate(project.end_date || project.dueDate || '');
    setStatus(project.status || 'active');
    setPriority(project.priority || 'medium');
    setDescription(project.description || '');
    setBudget(project.amount != null ? String(project.amount) : project.budget != null ? String(project.budget) : '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!project) return;
    if (!clientName.trim()) {
      toast.error('Client is required');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Timeline start and end are required');
      return;
    }
    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      toast.error('End date must be after start date');
      return;
    }
    await updateProject.mutateAsync({
      id: project.id,
      data: {
        title: project.title || project.name,
        name: project.name || project.title,
        description,
        status,
        priority,
        start_date: startDate,
        end_date: endDate,
        client_name: clientName.trim(),
        amount: budget.trim() ? Number(budget) : undefined,
      },
    });
    setEditOpen(false);
  };

  if (projectQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (projectQuery.isError || !project) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push('/ceo/product')}
          className="rounded-lg p-2 text-ink-muted hover:bg-bg-muted hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title="Project not found"
          description="This project may have been removed."
          action={{ label: 'Back to product', onClick: () => router.push('/ceo/product') }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/ceo/product')}
            className="mt-1 rounded-lg p-2 text-ink-muted hover:bg-bg-muted hover:text-ink"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-ink">{project.title || project.name}</h1>
            <p className="mt-1 text-ink-muted">
              {project.client_name || project.owner || 'No client'} · Timeline progress {progress}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.statusVariant || 'default'}>{project.status}</Badge>
          {project.priority && <Badge variant="warning">{project.priority}</Badge>}
          <Button variant="secondary" onClick={openEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="space-y-4 border border-border bg-surface p-6">
            <p className="text-sm leading-relaxed text-ink-secondary">
              {project.description || 'No description yet.'}
            </p>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-ink-muted">Timeline progress</span>
                <span className="tabular-nums text-ink">{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="mt-2 text-xs text-ink-muted">
                {project.start_date ? formatDate(project.start_date) : '—'}
                {' → '}
                {project.end_date || project.dueDate ? formatDate(project.end_date || project.dueDate) : '—'}
              </p>
            </div>
          </Card>

          <Card className="border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Recent activity</h2>
            {activityQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : activities.length === 0 ? (
              <EmptyState
                className="py-8"
                title="No recent activity"
                description="Project updates will appear here as work happens."
              />
            ) : (
              <div className="space-y-3">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-bg-muted p-3"
                  >
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{item.title}</p>
                      <p className="text-xs text-ink-muted">
                        {item.meta ? `${item.meta} · ` : ''}
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-3 border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-ink">Project details</h3>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink-muted">
                <Building2 className="h-4 w-4" /> Client
              </span>
              <span className="text-right text-ink">{project.client_name || project.owner || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink-muted">
                <Calendar className="h-4 w-4" /> Start
              </span>
              <span className="text-ink">{project.start_date ? formatDate(project.start_date) : '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink-muted">
                <Calendar className="h-4 w-4" /> End
              </span>
              <span className="text-ink">
                {project.end_date || project.dueDate
                  ? formatDate(project.end_date || project.dueDate)
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink-muted">
                <Wallet className="h-4 w-4" /> Budget
              </span>
              <span className="text-ink">
                {typeof project.amount === 'number'
                  ? formatCurrency(project.amount)
                  : typeof project.budget === 'number'
                    ? formatCurrency(project.budget)
                    : '—'}
              </span>
            </div>
          </Card>
        </aside>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit project" size="md">
        <div className="space-y-4">
          <Input
            label="Client"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client or company name"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Timeline start"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Timeline end"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </Select>
            <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Input
            label="Budget (optional)"
            type="number"
            min="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
