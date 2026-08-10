'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { type MockRecord } from '@/mocks';
import { BoardColumnId, TRELLO_SCRUM_COLUMNS, applyColumnMove } from '@/mocks/boards';
import { useCreateEntity, useEntityList, useUpdateEntity } from '@/hooks/useEntityApi';
import {
  useAddTaskToSprint,
  useCompleteSprint,
  useRemoveTaskFromSprint,
  useStartSprint,
} from '@/hooks/useSprints';
import { Button } from '@/components/UI/Button';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Modal } from '@/components/UI/Modal';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import { KanbanBoard } from '@/components/boards/KanbanBoard';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { canCreateSprints, canCreateTasks } from '@/lib/access';

interface BoardWorkspaceProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Trello Scrum board flow (one board):
 * Backlog → Sprint Backlog → In Progress → In Review → Done
 *
 * - Product Backlog = cards with no sprint_id
 * - Sprint lists = cards on the selected sprint
 * - Planning = drag Backlog → Sprint Backlog
 * - Complete sprint = unfinished cards return to Backlog; Done stays for history
 */
export function BoardWorkspace({ title = 'Board' }: BoardWorkspaceProps) {
  const user = useAuthStore((s) => s.user);
  const allowCreateSprint = canCreateSprints(user?.role);
  const allowCreateTask = canCreateTasks(user?.role);
  const {
    data: sprints = [],
    isLoading: sprintsLoading,
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
  const updateTask = useUpdateEntity('tasks');
  const createSprint = useCreateEntity('sprints');

  const openSprints = sprints.filter((s) => !/completed|done/i.test(String(s.status)));
  const activeSprint = openSprints.find((s) => /active/i.test(String(s.status)));
  const defaultSprint = activeSprint || openSprints[0] || sprints[0] || null;

  const [boardId, setBoardId] = useState<string>('');
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    title: '',
    description: '',
    project_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  });

  useEffect(() => {
    if (!boardId && defaultSprint?.id) setBoardId(defaultSprint.id);
  }, [boardId, defaultSprint?.id]);

  const sprint = sprints.find((s) => s.id === boardId) || defaultSprint;

  const projectById = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of projects as any[]) {
      if (p?.id) map.set(p.id, p);
    }
    return map;
  }, [projects]);

  const boardProject =
    (sprint?.project_id && projectById.get(String(sprint.project_id))) ||
    null;

  const projectName =
    boardProject?.title ||
    boardProject?.name ||
    (sprint as any)?.project_name ||
    null;

  const defaultProjectId =
    sprint?.project_id ||
    (projects as any[]).find((p) => /active/i.test(String(p.status)))?.id ||
    (projects as any[])[0]?.id ||
    '';

  const displayItems = useMemo(() => {
    const all = tasks as MockRecord[];
    if (!sprint) {
      return all
        .filter((t) => !(t as any).sprint_id)
        .map((t) => ({ ...t, status: 'backlog', statusVariant: 'default' as const }));
    }

    return all
      .filter((task) => {
        const sid = (task as any).sprint_id || null;
        return !sid || sid === sprint.id;
      })
      .map((task) => {
        const sid = (task as any).sprint_id || null;
        if (!sid) {
          return { ...task, status: 'backlog', statusVariant: 'default' as const };
        }
        const status = String(task.status || 'todo').toLowerCase();
        if (status === 'backlog' || status === 'open') {
          return { ...task, status: 'todo', statusVariant: 'default' as const };
        }
        return task;
      });
  }, [tasks, sprint]);

  const sprintCommitted = useMemo(() => {
    if (!sprint) return [] as MockRecord[];
    return (tasks as MockRecord[]).filter((t) => (t as any).sprint_id === sprint.id);
  }, [tasks, sprint]);

  const doneCount = sprintCommitted.filter((t) =>
    /done|completed|closed|resolved/i.test(String(t.status)),
  ).length;

  const refresh = () => {
    void refetchTasks();
    void refetchSprints();
  };

  const handleMove = async (item: MockRecord, columnId: BoardColumnId) => {
    if (!sprint && columnId !== 'backlog') {
      toast.error('Create or select a sprint first, then pull cards into Sprint Backlog');
      throw new Error('No sprint selected');
    }

    const next = applyColumnMove(item, columnId);
    const wasBacklog = !(item as any).sprint_id;
    const movingToBacklog = columnId === 'backlog';

    if (sprint && movingToBacklog && !wasBacklog) {
      await removeFromSprint.mutateAsync({ sprintId: sprint.id, taskId: item.id });
      await updateTask.mutateAsync({
        id: item.id,
        data: {
          title: item.title,
          status: 'backlog',
          description: item.description,
          priority: item.priority,
          assignee_id: item.assignee_id,
          assignee_ids: Array.isArray(item.assignee_ids)
            ? item.assignee_ids
            : item.assignee_id
              ? [item.assignee_id]
              : [],
          project_id: item.project_id || defaultProjectId,
          sprint_id: null,
          dueDate: item.dueDate,
        },
      });
      refresh();
      return;
    }

    if (sprint && !movingToBacklog && wasBacklog) {
      await addToSprint.mutateAsync({ sprintId: sprint.id, taskId: item.id });
      await updateTask.mutateAsync({
        id: item.id,
        data: {
          title: item.title,
          status: next.status === 'backlog' ? 'todo' : next.status,
          description: item.description,
          priority: item.priority,
          assignee_id: item.assignee_id,
          assignee_ids: Array.isArray(item.assignee_ids)
            ? item.assignee_ids
            : item.assignee_id
              ? [item.assignee_id]
              : [],
          project_id: item.project_id || defaultProjectId,
          sprint_id: sprint.id,
          dueDate: item.dueDate,
        },
      });
      refresh();
      return;
    }

    await updateTask.mutateAsync({
      id: item.id,
      data: {
        title: item.title,
        status: movingToBacklog ? 'backlog' : next.status,
        description: item.description,
        priority: item.priority,
        assignee_id: item.assignee_id,
        assignee_ids: Array.isArray(item.assignee_ids)
          ? item.assignee_ids
          : item.assignee_id
            ? [item.assignee_id]
            : [],
        project_id: item.project_id || defaultProjectId,
        sprint_id: movingToBacklog ? null : sprint?.id || (item as any).sprint_id,
        dueDate: item.dueDate,
      },
    });
    refresh();
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
    try {
      const created = await createSprint.mutateAsync({
        title: sprintForm.title.trim(),
        description: sprintForm.description,
        project_id,
        start_date: sprintForm.start_date,
        end_date: sprintForm.end_date || undefined,
        status: 'planned',
      });
      setCreateSprintOpen(false);
      setSprintForm({
        title: '',
        description: '',
        project_id: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
      });
      await refetchSprints();
      const newId = created?.id || created?.data?.id;
      if (newId) setBoardId(newId);
    } catch {
      /* toast from mutation */
    }
  };

  const onCompleteSprint = async () => {
    if (!sprint) return;
    const res = await completeSprint.mutateAsync(sprint.id);
    const returned = res?.returned_to_backlog ?? res?.data?.returned_to_backlog;
    if (returned != null) {
      toast.success(
        returned > 0
          ? `Sprint completed — ${returned} unfinished card(s) returned to Backlog`
          : 'Sprint completed',
      );
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

  if (tasksError) {
    return <EmptyState title="Unable to load board" description="Refresh the page to try again." />;
  }

  const isActive = sprint ? /active/i.test(String(sprint.status)) : false;
  const isDone = sprint ? /completed|done/i.test(String(sprint.status)) : false;

  const subtitleParts = [
    sprint?.status ? String(sprint.status) : null,
    sprint?.startDate || sprint?.dueDate
      ? `${sprint.startDate ? formatDate(sprint.startDate) : '—'} → ${sprint.dueDate ? formatDate(sprint.dueDate) : '—'}`
      : null,
    sprint ? `${doneCount}/${sprintCommitted.length} done` : 'Product backlog',
  ].filter(Boolean);

  const boardActions = (
    <>
      <select
        value={sprint?.id || ''}
        onChange={(e) => setBoardId(e.target.value)}
        className="max-w-[240px] rounded-md bg-white/20 px-2.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 focus:outline-none"
      >
        {sprints.length === 0 ? (
          <option value="">No sprints</option>
        ) : (
          sprints.map((s) => {
            const p = s.project_id ? projectById.get(String(s.project_id)) : null;
            const pName = p?.title || p?.name;
            const statusLabel = /active/i.test(String(s.status))
              ? 'active'
              : /completed|done/i.test(String(s.status))
                ? 'done'
                : 'planned';
            return (
              <option key={s.id} value={s.id} className="text-[#172b4d]">
                {pName ? `${pName} · ` : ''}
                {s.title} · {statusLabel}
              </option>
            );
          })
        )}
      </select>
      {allowCreateSprint ? (
        <button
          type="button"
          onClick={() => setCreateSprintOpen(true)}
          className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30"
        >
          <Plus className="h-3.5 w-3.5" />
          Sprint
        </button>
      ) : null}
      {allowCreateSprint && sprint && !isDone ? (
        <button
          type="button"
          disabled={startSprint.isPending || completeSprint.isPending}
          onClick={() => {
            if (isActive) void onCompleteSprint();
            else void startSprint.mutateAsync(sprint.id).then(refresh);
          }}
          className="rounded-md bg-white/20 px-2.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
        >
          {isActive ? 'Complete sprint' : 'Start sprint'}
        </button>
      ) : null}
    </>
  );

  return (
    <div>
      <KanbanBoard
        key={sprint?.id || 'backlog-only'}
        embedded
        boardTitle={
          projectName && sprint?.title
            ? `${projectName} · ${sprint.title}`
            : sprint?.title || projectName || title
        }
        boardSubtitle={subtitleParts.join(' · ')}
        boardActions={boardActions}
        initialItems={displayItems}
        columns={
          sprint
            ? TRELLO_SCRUM_COLUMNS
            : TRELLO_SCRUM_COLUMNS.filter((c) => c.id === 'backlog')
        }
        entityKey="tasks"
        projectId={defaultProjectId || undefined}
        sprintId={sprint?.id || null}
        onMoveCard={handleMove}
        onItemsChange={refresh}
        allowCreateCards={allowCreateTask}
      />

      {allowCreateSprint ? (
        <Modal
          isOpen={createSprintOpen}
          onClose={() => setCreateSprintOpen(false)}
          title="New sprint"
          size="lg"
        >
          <SprintCreateFields
            form={sprintForm}
            setForm={setSprintForm}
            projects={projects as any[]}
            loading={createSprint.isPending}
            onCancel={() => setCreateSprintOpen(false)}
            onSave={() => void onCreateSprint()}
          />
        </Modal>
      ) : null}
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
  setForm: Dispatch<
    SetStateAction<{
      title: string;
      description: string;
      project_id: string;
      start_date: string;
      end_date: string;
    }>
  >;
  projects: any[];
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Sprint</p>
        <Input
          label="Name"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Sprint 12"
        />
        <TextArea
          label="Sprint goal"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What should this sprint achieve?"
        />
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Scope & schedule</p>
        <Select
          label="Product / project"
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
            label="Start"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
          <Input
            label="End"
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
          Create sprint
        </Button>
      </div>
    </div>
  );
}
