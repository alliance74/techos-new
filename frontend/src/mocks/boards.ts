import { MockRecord, StatusVariant } from './types';

export type BoardColumnId = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';

export interface BoardColumn {
  id: BoardColumnId;
  title: string;
  accent: string;
  statuses: string[];
}

/** Trello Scrum board: Backlog → Sprint Backlog → workflow → Done */
export const TRELLO_SCRUM_COLUMNS: BoardColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    accent: 'border-t-ink-muted',
    statuses: ['backlog', 'Backlog', 'open', 'Open'],
  },
  {
    id: 'todo',
    title: 'Sprint Backlog',
    accent: 'border-t-brand',
    statuses: ['todo', 'To Do'],
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    accent: 'border-t-brand',
    statuses: ['in_progress', 'In Progress', 'active', 'Active'],
  },
  {
    id: 'in_review',
    title: 'In Review',
    accent: 'border-t-warning',
    statuses: ['in_review', 'In Review', 'review', 'Review'],
  },
  {
    id: 'done',
    title: 'Done',
    accent: 'border-t-success',
    statuses: ['done', 'Done', 'completed', 'Completed', 'closed', 'Closed', 'resolved', 'Resolved'],
  },
];

/** @deprecated use TRELLO_SCRUM_COLUMNS — kept for older call sites */
export const TASK_COLUMNS = TRELLO_SCRUM_COLUMNS;

/** Sprint-committed columns only (no product backlog) */
export const SPRINT_COLUMNS: BoardColumn[] = TRELLO_SCRUM_COLUMNS.filter((c) => c.id !== 'backlog');

/** API snake_case status values written on column moves. */
const COLUMN_API_STATUS: Record<BoardColumnId, { status: string; statusVariant: StatusVariant }> = {
  backlog: { status: 'backlog', statusVariant: 'default' },
  todo: { status: 'todo', statusVariant: 'default' },
  in_progress: { status: 'in_progress', statusVariant: 'info' },
  in_review: { status: 'in_review', statusVariant: 'warning' },
  blocked: { status: 'blocked', statusVariant: 'error' },
  done: { status: 'done', statusVariant: 'success' },
};

export function normalizeTaskStatus(status?: string): string {
  if (!status) return 'todo';
  const key = status.trim().toLowerCase().replace(/\s+/g, '_');
  const aliases: Record<string, string> = {
    backlog: 'backlog',
    open: 'backlog',
    to_do: 'todo',
    todo: 'todo',
    in_progress: 'in_progress',
    active: 'in_progress',
    in_review: 'in_review',
    review: 'in_review',
    blocked: 'blocked',
    done: 'done',
    completed: 'done',
    closed: 'done',
    resolved: 'done',
  };
  return aliases[key] || key;
}

export function resolveColumnId(status: string, columns: BoardColumn[]): BoardColumnId {
  const normalized = normalizeTaskStatus(status);
  const match = columns.find((col) =>
    col.statuses.some((s) => normalizeTaskStatus(s) === normalized || s.toLowerCase() === status.toLowerCase()),
  );
  return match?.id || (normalized === 'backlog' ? 'backlog' : 'todo');
}

export function applyColumnMove(item: MockRecord, columnId: BoardColumnId): MockRecord {
  const mapped = COLUMN_API_STATUS[columnId];
  return {
    ...item,
    status: mapped.status,
    statusVariant: mapped.statusVariant,
    progress:
      columnId === 'done'
        ? 100
        : columnId === 'todo' || columnId === 'backlog'
          ? 0
          : typeof item.progress === 'number'
            ? item.progress
            : 40,
    updatedAt: new Date().toISOString(),
  };
}

export function getBoardTasks(_sprintTag?: string): MockRecord[] {
  return [];
}

export function getActiveSprint(): MockRecord | undefined {
  return undefined;
}
