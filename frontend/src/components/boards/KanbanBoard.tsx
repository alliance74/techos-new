'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { MockRecord } from '@/mocks';
import {
  BoardColumn,
  BoardColumnId,
  TASK_COLUMNS,
  applyColumnMove,
  resolveColumnId,
} from '@/mocks/boards';
import { useCreateEntity, useEntityList, useUpdateEntity } from '@/hooks/useEntityApi';
import { useUsers } from '@/hooks/useUsers';
import { Avatar } from '@/components/UI/Avatar';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import { cn, formatDate } from '@/lib/utils';

const PRIORITY_LABEL: Record<string, string> = {
  low: 'bg-[#61bd4f]',
  medium: 'bg-[#f2d600]',
  high: 'bg-[#ff9f1a]',
  critical: 'bg-[#eb5a46]',
};

function userLabel(user: any) {
  const name =
    user.name ||
    `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim();
  return name || user.email || 'User';
}

function memberIdsOf(item: MockRecord | null | undefined): string[] {
  if (!item) return [];
  if (Array.isArray(item.assignee_ids) && item.assignee_ids.length) {
    return [...new Set((item.assignee_ids as string[]).filter(Boolean))];
  }
  if (item.assignee_id) return [String(item.assignee_id)];
  return [];
}

function membersOf(
  item: MockRecord | null | undefined,
  users: any[],
): { id: string; name: string }[] {
  const ids = memberIdsOf(item);
  if (Array.isArray(item?.assignees) && (item!.assignees as any[]).length) {
    return (item!.assignees as { id: string; name: string }[]).filter((a) => ids.includes(a.id));
  }
  return ids
    .map((id) => {
      const u = users.find((user) => user.id === id);
      return u ? { id, name: userLabel(u) } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];
}

interface KanbanBoardProps {
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  initialItems: MockRecord[];
  columns?: BoardColumn[];
  embedded?: boolean;
  entityKey?: string;
  projectId?: string;
  sprintId?: string | null;
  onItemsChange?: () => void;
  onMoveCard?: (item: MockRecord, columnId: BoardColumnId) => Promise<void>;
  /** Optional slot rendered in the Trello board top bar (right side) */
  boardActions?: ReactNode;
  boardTitle?: string;
  boardSubtitle?: string;
  /** When false, hide inline “Add a card” (non-admin viewers). */
  allowCreateCards?: boolean;
}

/**
 * Trello-like board UI: colored canvas, list columns, white cards, inline add-card.
 */
export function KanbanBoard({
  initialItems,
  columns = TASK_COLUMNS,
  entityKey = 'tasks',
  projectId: projectIdProp,
  sprintId = null,
  onItemsChange,
  onMoveCard,
  boardActions,
  boardTitle,
  boardSubtitle,
  allowCreateCards = true,
}: KanbanBoardProps) {
  const [items, setItems] = useState<MockRecord[]>(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<BoardColumnId | null>(null);
  const [active, setActive] = useState<MockRecord | null>(null);
  const [composingCol, setComposingCol] = useState<BoardColumnId | null>(null);
  const [composeTitle, setComposeTitle] = useState('');
  const composeRef = useRef<HTMLTextAreaElement>(null);

  const createEntity = useCreateEntity(entityKey);
  const updateEntity = useUpdateEntity(entityKey);
  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useEntityList('projects');

  const defaultProjectId =
    projectIdProp ||
    (projects as any[]).find((p) => /active/i.test(String(p.status)))?.id ||
    (projects as any[])[0]?.id ||
    '';

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (composingCol) composeRef.current?.focus();
  }, [composingCol]);

  const byColumn = (columnId: BoardColumnId) =>
    items.filter((item) => resolveColumnId(item.status, columns) === columnId);

  const moveItem = async (itemId: string, columnId: BoardColumnId) => {
    const current = items.find((item) => item.id === itemId);
    if (!current) return;
    if (resolveColumnId(current.status, columns) === columnId) return;
    const next = applyColumnMove(current, columnId);
    setItems((prev) => prev.map((item) => (item.id === itemId ? next : item)));
    setActive((prev) => (prev?.id === itemId ? next : prev));
    try {
      if (onMoveCard) {
        await onMoveCard(current, columnId);
      } else {
        await updateEntity.mutateAsync({
          id: itemId,
          data: {
            title: next.title,
            status: next.status,
            description: next.description,
            priority: next.priority,
            assignee_ids: memberIdsOf(next),
            assignee_id: memberIdsOf(next)[0] || null,
            project_id: next.project_id,
            sprint_id: next.sprint_id,
            dueDate: next.dueDate,
          },
        });
      }
      onItemsChange?.();
    } catch {
      setItems((prev) => prev.map((item) => (item.id === itemId ? current : item)));
    }
  };

  const saveActive = async () => {
    if (!active) return;
    const ids = memberIdsOf(active);
    const members = membersOf(active, users as any[]);
    const label = members.map((m) => m.name).join(', ') || 'Unassigned';
    const next = {
      ...active,
      assignee_ids: ids,
      assignee_id: ids[0] || '',
      assignees: members,
      owner: label,
      assignee: label,
    };
    setItems((prev) => prev.map((item) => (item.id === active.id ? next : item)));
    await updateEntity.mutateAsync({
      id: active.id,
      data: {
        title: next.title,
        description: next.description,
        status: next.status,
        priority: next.priority,
        assignee_ids: ids,
        assignee_id: ids[0] || null,
        project_id: next.project_id,
        sprint_id: next.sprint_id,
        dueDate: next.dueDate,
      },
    });
    setActive(next);
    onItemsChange?.();
  };

  const toggleMember = (userId: string) => {
    if (!active) return;
    const current = memberIdsOf(active);
    const nextIds = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    const members = nextIds
      .map((id) => {
        const u = (users as any[]).find((user) => user.id === id);
        return u ? { id, name: userLabel(u) } : null;
      })
      .filter(Boolean) as { id: string; name: string }[];
    setActive({
      ...active,
      assignee_ids: nextIds,
      assignee_id: nextIds[0] || '',
      assignees: members,
      owner: members.map((m) => m.name).join(', ') || 'Unassigned',
      assignee: members.map((m) => m.name).join(', ') || 'Unassigned',
    });
  };

  const quickCreate = async (columnId: BoardColumnId) => {
    const title = composeTitle.trim();
    if (!title) return;
    const project_id = defaultProjectId;
    if (!project_id) {
      toast.error('Create a product/project first, then add cards');
      return;
    }
    const status = applyColumnMove(
      {
        id: 'tmp',
        title,
        status: 'todo',
        statusVariant: 'default',
        owner: 'Unassigned',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      columnId,
    ).status;

    try {
      await createEntity.mutateAsync({
        title,
        status,
        description: '',
        priority: 'medium',
        project_id,
        sprint_id: columnId === 'backlog' ? undefined : sprintId || undefined,
      });
      setComposeTitle('');
      setComposingCol(null);
      onItemsChange?.();
    } catch {
      /* toast from mutation */
    }
  };

  return (
    <div className="trello-board -mx-4 -mb-6 flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-t-2xl bg-[#0079bf] sm:-mx-6">
      {/* Board top bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight drop-shadow-sm">
            {boardTitle || 'Board'}
          </h1>
          {boardSubtitle ? (
            <p className="truncate text-xs text-white/80">{boardSubtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">{boardActions}</div>
      </div>

      {/* Lists rail */}
      <div className="flex flex-1 gap-3 overflow-x-auto px-4 pb-4 pt-1">
        {columns.map((column) => {
          const cards = byColumn(column.id);
          const isDropTarget = dropCol === column.id;
          const isComposing = composingCol === column.id;

          return (
            <section
              key={column.id}
              className={cn(
                'flex max-h-full w-[272px] shrink-0 flex-col rounded-xl bg-[#f1f2f4] shadow-sm',
                isDropTarget && 'ring-2 ring-white/70',
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDropCol(column.id);
              }}
              onDragLeave={() => setDropCol((c) => (c === column.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/card-id') || draggingId;
                if (id) void moveItem(id, column.id);
                setDraggingId(null);
                setDropCol(null);
              }}
            >
              <header className="flex items-center gap-2 px-2.5 pb-1 pt-2.5">
                <h3 className="min-w-0 flex-1 truncate px-1 text-sm font-semibold text-[#172b4d]">
                  {column.title}
                </h3>
                <span className="rounded-full bg-black/5 px-1.5 text-[11px] font-medium text-[#44546f]">
                  {cards.length}
                </span>
                <button
                  type="button"
                  className="rounded-lg p-1 text-[#44546f] hover:bg-black/5"
                  aria-label="List actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto px-2 py-1">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingId(card.id);
                      e.dataTransfer.setData('text/card-id', card.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropCol(null);
                    }}
                    onClick={() => setActive(card)}
                    className={cn(
                      'cursor-pointer rounded-[8px] bg-white px-3 py-2 shadow-[0_1px_1px_rgba(9,30,66,0.25)] hover:outline hover:outline-2 hover:outline-[#388bff]',
                      draggingId === card.id && 'rotate-1 opacity-60',
                    )}
                  >
                    {card.priority ? (
                      <div className="mb-1.5 flex gap-1">
                        <span
                          className={cn(
                            'h-2 w-10 rounded-full',
                            PRIORITY_LABEL[card.priority] || 'bg-[#c1c7d0]',
                          )}
                          title={card.priority}
                        />
                      </div>
                    ) : null}
                    <p className="text-sm leading-snug text-[#172b4d]">{card.title}</p>
                    {card.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#44546f]">
                        {card.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {card.dueDate ? (
                          <span className="rounded bg-[#f1f2f4] px-1.5 py-0.5 text-[10px] font-medium text-[#44546f]">
                            {formatDate(card.dueDate)}
                          </span>
                        ) : null}
                      </div>
                      {(() => {
                        const members = membersOf(card, users as any[]);
                        if (!members.length) return null;
                        const shown = members.slice(0, 3);
                        const extra = members.length - shown.length;
                        return (
                          <div className="flex items-center -space-x-1.5">
                            {shown.map((m) => (
                              <Avatar key={m.id} size="sm" name={m.name} />
                            ))}
                            {extra > 0 ? (
                              <span className="relative z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-[#dfe1e6] text-[10px] font-semibold text-[#44546f]">
                                +{extra}
                              </span>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  </article>
                ))}
              </div>

              <div className="px-2 pb-2 pt-1">
                {isComposing ? (
                  <div className="space-y-2">
                    <textarea
                      ref={composeRef}
                      value={composeTitle}
                      onChange={(e) => setComposeTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void quickCreate(column.id);
                        }
                        if (e.key === 'Escape') {
                          setComposingCol(null);
                          setComposeTitle('');
                        }
                      }}
                      placeholder="Enter a title for this card…"
                      rows={3}
                      className="w-full resize-none rounded-[8px] border-0 bg-white px-3 py-2 text-sm text-[#172b4d] shadow-[0_1px_1px_rgba(9,30,66,0.25)] outline-none ring-2 ring-[#388bff]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!composeTitle.trim() || createEntity.isPending}
                        onClick={() => void quickCreate(column.id)}
                        className="rounded-md bg-[#0c66e4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0055cc] disabled:opacity-50"
                      >
                        Add card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setComposingCol(null);
                          setComposeTitle('');
                        }}
                        className="rounded-md p-1.5 text-[#44546f] hover:bg-black/5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : allowCreateCards ? (
                  <button
                    type="button"
                    onClick={() => {
                      setComposingCol(column.id);
                      setComposeTitle('');
                    }}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[#44546f] hover:bg-black/5 hover:text-[#172b4d]"
                  >
                    <Plus className="h-4 w-4" />
                    Add a card
                  </button>
                ) : (
                  <div className="h-2" />
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Card back (Trello-style detail) */}
      <Modal isOpen={!!active} onClose={() => setActive(null)} title={active?.title || 'Card'} size="lg">
        {active && (
          <div className="space-y-4 text-sm">
            <Input
              label="Title"
              value={active.title || ''}
              onChange={(e) => setActive({ ...active, title: e.target.value })}
            />
            <TextArea
              label="Description"
              rows={4}
              value={active.description || ''}
              onChange={(e) => setActive({ ...active, description: e.target.value })}
              placeholder="Add a more detailed description…"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Priority (label)"
                value={active.priority || 'medium'}
                onChange={(e) =>
                  setActive({ ...active, priority: e.target.value as MockRecord['priority'] })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
              <Input
                label="Due date"
                type="date"
                value={(active.dueDate || '').toString().slice(0, 10)}
                onChange={(e) => setActive({ ...active, dueDate: e.target.value })}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Members
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {(users as any[]).length === 0 ? (
                  <p className="px-2 py-3 text-xs text-ink-muted">No users available</p>
                ) : (
                  (users as any[]).map((u) => {
                    const selected = memberIdsOf(active).includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-black/5',
                          selected && 'bg-[#e9f2ff]',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMember(u.id)}
                          className="h-4 w-4 rounded border-border text-[#0c66e4] focus:ring-[#0c66e4]"
                        />
                        <Avatar size="sm" name={userLabel(u)} />
                        <span className="min-w-0 flex-1 truncate text-sm text-[#172b4d]">
                          {userLabel(u)}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {memberIdsOf(active).length > 0 ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-[#44546f] hover:text-[#172b4d]"
                  onClick={() =>
                    setActive({
                      ...active,
                      assignee_ids: [],
                      assignee_id: '',
                      assignees: [],
                      owner: 'Unassigned',
                      assignee: 'Unassigned',
                    })
                  }
                >
                  Clear members
                </button>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Move to list
              </p>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <Button
                    key={col.id}
                    size="sm"
                    variant={resolveColumnId(active.status, columns) === col.id ? 'primary' : 'outline'}
                    onClick={() => void moveItem(active.id, col.id)}
                  >
                    {col.title}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="ghost" onClick={() => setActive(null)}>
                Close
              </Button>
              <Button loading={updateEntity.isPending} onClick={() => void saveActive()}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
