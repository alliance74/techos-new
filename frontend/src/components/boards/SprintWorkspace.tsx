'use client';

import { useMemo, useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Flag, Plus, Target, Timer, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { type MockRecord } from '@/mocks';
import { SPRINT_COLUMNS } from '@/mocks/boards';
import { useCreateEntity, useEntityList } from '@/hooks/useEntityApi';
import {
  useAddTaskToSprint,
  useCompleteSprint,
  useRemoveTaskFromSprint,
  useStartSprint,
  useUpdateSprint,
  useDeleteSprint,
} from '@/hooks/useSprints';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Modal } from '@/components/UI/Modal';
import { PageHeader } from '@/components/UI/PageHeader';
import { Progress } from '@/components/UI/Progress';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import { KanbanBoard } from '@/components/boards/KanbanBoard';
import { formatDate } from '@/lib/utils';

interface SprintWorkspaceProps {
  breadcrumbs?: { label: string; href?: string }[];
}

export function SprintWorkspace({ breadcrumbs }: SprintWorkspaceProps) {
  const {
    data: sprints = [],
    isLoading: sprintsLoading,
    isError: sprintsError,
    refetch: refetchSprints,
  } = useEntityList('sprints');
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useEntityList('tasks');
  const { data: projects = [] } = useEntityList('projects');

  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();
  const addToSprint = useAddTaskToSprint();
  const removeFromSprint = useRemoveTaskFromSprint();
  const createSprint = useCreateEntity('sprints');
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();

  const activeSprint = sprints.find((s) => /active/i.test(String(s.status))) || sprints[0];
  const [selectedId, setSelectedId] = useState<string>('');
  const selected = sprints.find((s) => s.id === (selectedId || activeSprint?.id)) || activeSprint;

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [sprintForm, setSprintForm] = useState({
    title: '',
    description: '',
    project_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    goal: '',
    project_id: '',
    start_date: '',
    end_date: '',
    status: 'planned',
  });

  useEffect(() => {
    if (selected) {
      setEditForm({
        name: selected.name || selected.title || '',
        goal: selected.goal || selected.description || '',
        project_id: selected.project_id || '',
        start_date: selected.start_date || selected.startDate || '',
        end_date: selected.end_date || selected.dueDate || '',
        status: selected.status || 'planned',
      });
    }
  }, [selected]);

  const defaultProjectId =
    selected?.project_id ||
    (projects as any[]).find((p) => /active/i.test(String(p.status)))?.id ||
    (projects as any[])[0]?.id ||
    '';

  // Strictly filter tasks that belong ONLY to this selected sprint
  const sprintTasks = useMemo(() => {
    if (!selected) return [] as MockRecord[];
    return (tasks as MockRecord[]).filter((task) => {
      const raw = task as MockRecord & { sprint_id?: string | null };
      return raw.sprint_id === selected.id;
    });
  }, [selected, tasks]);

  // Backlog: tasks NOT assigned to ANY sprint
  const backlog = useMemo(() => {
    return (tasks as MockRecord[]).filter((task) => {
      const raw = task as MockRecord & { sprint_id?: string | null };
      return !raw.sprint_id;
    });
  }, [tasks]);

  const doneCount = sprintTasks.filter((t) => /done|completed/i.test(String(t.status))).length;
  const progress = sprintTasks.length
    ? Math.round((doneCount / sprintTasks.length) * 100)
    : Number(selected?.progress) || 0;

  const refresh = () => {
    void refetchTasks();
    void refetchSprints();
  };

  const onCreateSprint = async () => {
    if (!sprintForm.title.trim()) {
      toast.error('Sprint name is required');
      return;
    }
    const project_id = sprintForm.project_id || defaultProjectId;
    if (!project_id) {
      toast.error('Create a product/project first');
      return;
    }
    await createSprint.mutateAsync({
      title: sprintForm.title.trim(),
      description: sprintForm.description,
      project_id,
      start_date: sprintForm.start_date,
      end_date: sprintForm.end_date || undefined,
      status: 'planned',
    });
    setCreateOpen(false);
    setSprintForm({
      title: '',
      description: '',
      project_id: '',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
    });
    refresh();
  };

  const onUpdateSprint = async () => {
    if (!selected) return;
    if (!editForm.name.trim()) {
      toast.error('Sprint name is required');
      return;
    }
    await updateSprint.mutateAsync({
      id: selected.id,
      data: {
        name: editForm.name.trim(),
        goal: editForm.goal,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        status: editForm.status as 'planned' | 'active' | 'completed',
        ...(editForm.project_id ? { project_id: editForm.project_id } : {}),
      },
    });
    setEditOpen(false);
    refresh();
  };

  const onDeleteSprint = async () => {
    if (!selected) return;
    const confirmed = window.confirm(
      `Delete sprint "${selected.title || selected.name}"? All tasks inside this sprint will be safely returned to the backlog.`,
    );
    if (!confirmed) return;

    await deleteSprint.mutateAsync(selected.id);
    const remaining = sprints.filter((s) => s.id !== selected.id);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    } else {
      setSelectedId('');
    }
    refresh();
  };

  if (sprintsLoading || tasksLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (sprintsError || tasksError) {
    return <EmptyState title="Unable to load sprints" description="Refresh the page to try again." />;
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Sprints"
          description="Plan work in timeboxed sprints — backlog in, board out."
          breadcrumbs={breadcrumbs}
          actions={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New sprint
            </Button>
          }
        />
        <EmptyState
          title="No sprints yet"
          description="Create a sprint, pull cards from the backlog, then start it."
          action={{ label: 'Create sprint', onClick: () => setCreateOpen(true) }}
        />
        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New sprint" size="md">
          <SprintCreateFields
            form={sprintForm}
            setForm={setSprintForm}
            projects={projects as any[]}
            loading={createSprint.isPending}
            onCancel={() => setCreateOpen(false)}
            onSave={() => void onCreateSprint()}
          />
        </Modal>
      </div>
    );
  }

  const isActive = /active/i.test(String(selected.status));
  const isDone = /completed|done/i.test(String(selected.status));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sprints"
        description="Independent sprint boards — backlog, assignees, drag-and-drop workflow."
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selected.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.title || sprint.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New sprint
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit Sprint
            </Button>
            <Button size="sm" variant="danger" onClick={onDeleteSprint} disabled={deleteSprint.isPending}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {!isDone && (
              <Button
                size="sm"
                variant={isActive ? 'outline' : 'primary'}
                loading={startSprint.isPending || completeSprint.isPending}
                onClick={() => {
                  if (isActive) {
                    void completeSprint.mutateAsync(selected.id).then(refresh);
                  } else {
                    void startSprint.mutateAsync(selected.id).then(refresh);
                  }
                }}
              >
                {isActive ? 'Complete sprint' : 'Start sprint'}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{selected.title || selected.name}</h2>
                <Badge variant={selected.statusVariant}>{selected.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{selected.goal || selected.description || 'No goal set'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-secondary">
              <Timer className="h-4 w-4 text-brand" />
              {selected.startDate || selected.start_date ? formatDate(selected.startDate || selected.start_date) : '—'} →{' '}
              {selected.dueDate || selected.end_date ? formatDate(selected.dueDate || selected.end_date) : '—'}
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={progress}
              label={`Sprint progress · ${doneCount}/${sprintTasks.length} done`}
              showValue
            />
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Target className="h-4 w-4 text-brand" />
              Sprint Goal
            </div>
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)} className="p-1 h-auto text-xs">
              <Edit2 className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {selected.goal || selected.description || 'Ship committed work and keep the board healthy.'}
          </p>
          <div className="flex items-center gap-2 border-t border-border pt-2 text-xs text-ink-muted">
            <Flag className="h-3.5 w-3.5" />
            {sprintTasks.length} committed · {backlog.length} in backlog
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">{selected.title || selected.name} Board</h3>
          <p className="text-xs text-ink-muted">Drag cards between columns · tasks stay strictly in this sprint</p>
        </div>
        <KanbanBoard
          key={selected.id}
          embedded
          initialItems={sprintTasks}
          columns={SPRINT_COLUMNS}
          entityKey="tasks"
          projectId={selected.project_id || defaultProjectId}
          sprintId={selected.id}
          onItemsChange={refresh}
        />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">Unassigned Backlog</h3>
            <p className="text-xs text-ink-muted">Tasks not assigned to any sprint — move into "{selected.title || selected.name}"</p>
          </div>
          <Badge size="sm">{backlog.length}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {backlog.map((item: MockRecord) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-bg-muted/50 px-3 py-3 transition-colors hover:border-brand/30"
            >
              <p className="text-sm font-medium text-ink">{item.title}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={item.statusVariant} size="sm">
                    {item.status}
                  </Badge>
                  <span className="text-xs text-ink-muted">{item.assignee || item.owner}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={addToSprint.isPending}
                  onClick={() =>
                    void addToSprint
                      .mutateAsync({ sprintId: selected.id, taskId: item.id })
                      .then(refresh)
                  }
                >
                  Add to sprint
                </Button>
              </div>
            </div>
          ))}
          {backlog.length === 0 && (
            <p className="col-span-full text-sm text-ink-muted">
              Backlog is empty — create new tasks or pull from other boards.
            </p>
          )}
        </div>

        {sprintTasks.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Move tasks out of sprint (Return to Backlog)
            </h4>
            <div className="flex flex-wrap gap-2">
              {sprintTasks.slice(0, 12).map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant="ghost"
                  loading={removeFromSprint.isPending}
                  onClick={() =>
                    void removeFromSprint
                      .mutateAsync({ sprintId: selected.id, taskId: item.id })
                      .then(refresh)
                  }
                >
                  ← {item.title}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* CREATE SPRINT MODAL */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Sprint" size="lg">
        <SprintCreateFields
          form={sprintForm}
          setForm={setSprintForm}
          projects={projects as any[]}
          loading={createSprint.isPending}
          onCancel={() => setCreateOpen(false)}
          onSave={() => void onCreateSprint()}
        />
      </Modal>

      {/* EDIT SPRINT MODAL */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`Edit Sprint: ${selected.title || selected.name}`} size="lg">
        <div className="space-y-5">
          <div className="space-y-3">
            <Input
              label="Sprint Name"
              required
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextArea
              label="Sprint Goal"
              rows={3}
              value={editForm.goal}
              onChange={(e) => setEditForm((f) => ({ ...f, goal: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </Select>
            <Select
              label="Associated Project"
              value={editForm.project_id}
              onChange={(e) => setEditForm((f) => ({ ...f, project_id: e.target.value }))}
            >
              <option value="">Select Project</option>
              {(projects as any[]).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name}
                </option>
              ))}
            </Select>
            <Input
              label="Start Date"
              type="date"
              value={editForm.start_date}
              onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={editForm.end_date}
              onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="danger" onClick={onDeleteSprint} disabled={deleteSprint.isPending}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete Sprint
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button loading={updateSprint.isPending} onClick={() => void onUpdateSprint()}>
                Save Sprint
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SprintCreateFields({
  form,
  setForm,
  projects,
  loading,
  onCancel,
  onSave,
}: {
  form: {
    title: string;
    description: string;
    project_id: string;
    start_date: string;
    end_date: string;
  };
  setForm: Dispatch<SetStateAction<{
    title: string;
    description: string;
    project_id: string;
    start_date: string;
    end_date: string;
  }>>;
  projects: any[];
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Sprint Info</p>
        <Input
          label="Sprint Name"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Sprint 24 - Dashboard Overhaul"
        />
        <TextArea
          label="Sprint Goal"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What should this sprint achieve?"
        />
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Scope & Schedule</p>
        <Select
          label="Product / Project"
          required
          value={form.project_id}
          onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title || p.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button loading={loading} onClick={onSave}>
          Create Sprint
        </Button>
      </div>
    </div>
  );
}
