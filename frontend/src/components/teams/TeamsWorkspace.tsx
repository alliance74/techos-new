'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  FolderKanban,
  Plus,
  Search,
  Users,
  UserPlus,
  X,
} from 'lucide-react';
import { useCreateEntity, useDeleteEntity, useEntityList, useUpdateEntity } from '@/hooks/useEntityApi';
import { useUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { canCreateTeams } from '@/lib/access';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { PageHeader } from '@/components/UI/PageHeader';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import { EmptyState } from '@/components/UI/EmptyState';
import { cn } from '@/lib/utils';

type TeamStatus = 'active' | 'forming' | 'archived';

type Team = {
  id: string;
  name: string;
  description: string;
  leadId: string;
  memberIds: string[];
  projectIds: string[];
  status: TeamStatus;
};

type Person = { id: string; name: string; title: string };
type Project = { id: string; title: string; status: string; owner: string };
type ApiUser = { id: string; first_name?: string; last_name?: string; email?: string; job_title?: string; role?: string };
type ApiProject = { id: string; title?: string; name?: string; status?: string; owner?: string };
type ApiTeam = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  metadata?: { leadId?: string; memberIds?: string[]; projectIds?: string[] };
};

const STATUS_VARIANT: Record<TeamStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  forming: 'warning',
  archived: 'default',
};

interface TeamsWorkspaceProps {
  breadcrumbs?: { label: string; href?: string }[];
}

type FormState = {
  name: string;
  description: string;
  leadId: string;
  memberIds: string[];
  projectIds: string[];
  status: TeamStatus;
};

const emptyForm = (leadId = ''): FormState => ({
  name: '',
  description: '',
  leadId,
  memberIds: [],
  projectIds: [],
  status: 'forming',
});

export function TeamsWorkspace({ breadcrumbs }: TeamsWorkspaceProps) {
  const user = useAuthStore((s) => s.user);
  const allowCreate = canCreateTeams(user?.role);
  const teamsQuery = useEntityList('teams');
  const usersQuery = useUsers();
  const projectsQuery = useEntityList('projects');
  const createTeam = useCreateEntity('teams');
  const updateTeam = useUpdateEntity('teams');
  const removeTeam = useDeleteEntity('teams');

  const people = useMemo<Person[]>(
    () => ((usersQuery.data || []) as ApiUser[]).map((user) => ({
      id: user.id,
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Unnamed user',
      title: user.job_title || user.role || 'Team member',
    })),
    [usersQuery.data],
  );
  const projects = useMemo<Project[]>(
    () => ((projectsQuery.data || []) as ApiProject[]).map((project) => ({
      id: project.id,
      title: project.title || project.name || 'Untitled project',
      status: project.status || 'active',
      owner: project.owner || '—',
    })),
    [projectsQuery.data],
  );
  const teams = useMemo<Team[]>(
    () => ((teamsQuery.data || []) as ApiTeam[]).map((team) => {
      const metadata = team.metadata || {};
      const leadId = metadata.leadId || '';
      return {
        id: team.id,
        name: team.title || team.name || 'Untitled team',
        description: team.description || '',
        leadId,
        memberIds: Array.from(new Set([leadId, ...(metadata.memberIds || [])].filter(Boolean))),
        projectIds: metadata.projectIds || [],
        status: ['active', 'forming', 'archived'].includes(team.status || '') ? team.status as TeamStatus : 'forming',
      };
    }),
    [teamsQuery.data],
  );

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(teams[0]?.id || null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assignProjectIds, setAssignProjectIds] = useState<string[]>([]);

  const selected = teams.find((t) => t.id === selectedId) || teams[0] || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.memberIds.some((id) => people.find((person) => person.id === id)?.name.toLowerCase().includes(q)),
    );
  }, [teams, query, people]);

  const openCreate = () => {
    setForm(emptyForm(people[0]?.id || ''));
    setErrors({});
    setCreateOpen(true);
  };

  const openEdit = (team: Team) => {
    setSelectedId(team.id);
    setForm({
      name: team.name,
      description: team.description,
      leadId: team.leadId,
      memberIds: team.memberIds.filter((id) => id !== team.leadId),
      projectIds: team.projectIds,
      status: team.status,
    });
    setErrors({});
    setEditOpen(true);
  };

  const openAssign = (team: Team) => {
    setSelectedId(team.id);
    setAssignProjectIds([...team.projectIds]);
    setAssignOpen(true);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Team name is required';
    if (!form.leadId) next.leadId = 'Select a team lead';
    if (form.memberIds.length === 0 && !form.leadId) next.memberIds = 'Select at least one member';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleMember = (userId: string) => {
    if (userId === form.leadId) return;
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(userId)
        ? f.memberIds.filter((id) => id !== userId)
        : [...f.memberIds, userId],
    }));
  };

  const toggleProject = (projectId: string, list: string[], setList: (ids: string[]) => void) => {
    setList(
      list.includes(projectId) ? list.filter((id) => id !== projectId) : [...list, projectId],
    );
  };

  const toApiData = (state: FormState) => ({
    title: state.name,
    description: state.description,
    status: state.status,
    leadId: state.leadId,
    memberIds: state.memberIds,
    projectIds: state.projectIds,
  });

  const handleCreate = async () => {
    if (!validate()) return;
    const team = await createTeam.mutateAsync(toApiData(form));
    setSelectedId(team?.id || null);
    setCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!selected || !validate()) return;
    await updateTeam.mutateAsync({ id: selected.id, data: toApiData(form) });
    setEditOpen(false);
  };

  const handleAssign = async () => {
    if (!selected) return;
    await updateTeam.mutateAsync({
      id: selected.id,
      data: toApiData({ ...selected, projectIds: assignProjectIds }),
    });
    setAssignOpen(false);
  };

  if (teamsQuery.isLoading || usersQuery.isLoading || projectsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Teams" description="Loading workspace teams..." breadcrumbs={breadcrumbs} />
        <Card className="h-96 animate-pulse bg-bg-muted"><div /></Card>
      </div>
    );
  }

  if (teamsQuery.isError || usersQuery.isError || projectsQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Teams" description="Manage team memberships and project assignments." breadcrumbs={breadcrumbs} />
        <EmptyState title="Unable to load teams" description="Refresh the page to try again." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teams"
        description={
          allowCreate
            ? 'Create teams, pick people, and assign them to projects.'
            : 'Teams you belong to and their project assignments.'
        }
        breadcrumbs={breadcrumbs}
        actions={
          allowCreate ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create team
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
        {/* Team list */}
        <Card padding="none" className="overflow-hidden flex flex-col max-h-[720px]">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams or people..."
                className="w-full rounded-xl bg-bg-muted border border-transparent pl-10 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:bg-surface"
              />
            </div>
          </div>
          <ul className="overflow-y-auto divide-y divide-border flex-1">
            {filtered.map((team) => {
              const active = selected?.id === team.id;
              return (
                <li key={team.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(team.id)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 transition-colors',
                      active ? 'bg-brand-mist' : 'hover:bg-surface-hover',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{team.name}</p>
                        <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{team.description}</p>
                      </div>
                      <Badge variant={STATUS_VARIANT[team.status]} size="sm">
                        {team.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {team.memberIds.length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {team.projectIds.length}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="p-6">
                <EmptyState title="No teams found" description="Try another search or create a team." />
              </li>
            )}
          </ul>
        </Card>

        {/* Detail */}
        {selected ? (
          <div className="space-y-4">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold text-ink">{selected.name}</h2>
                    <Badge variant={STATUS_VARIANT[selected.status]}>{selected.status}</Badge>
                  </div>
                  <p className="text-sm text-ink-secondary mt-3 max-w-2xl">{selected.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allowCreate ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(selected)}>
                        Edit team
                      </Button>
                      <Button size="sm" onClick={() => openAssign(selected)}>
                        <FolderKanban className="h-4 w-4 mr-2" />
                        Assign projects
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-brand" />
                    Members ({selected.memberIds.length})
                  </h3>
                  {allowCreate ? (
                    <Button size="sm" variant="ghost" onClick={() => openEdit(selected)}>
                      Manage
                    </Button>
                  ) : null}
                </div>
                <ul className="space-y-2">
                  {selected.memberIds.map((id) => {
                    const user = people.find((person) => person.id === id);
                    if (!user) return null;
                    const isLead = id === selected.leadId;
                    return (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-muted/40 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar size="sm" name={user.name} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                            <p className="text-xs text-ink-muted truncate">{user.title}</p>
                          </div>
                        </div>
                        {isLead && <Badge variant="info" size="sm">Lead</Badge>}
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-brand" />
                    Assigned projects ({selected.projectIds.length})
                  </h3>
                  {allowCreate ? (
                    <Button size="sm" variant="ghost" onClick={() => openAssign(selected)}>
                      Assign
                    </Button>
                  ) : null}
                </div>
                {selected.projectIds.length === 0 ? (
                  <EmptyState
                    title="No projects yet"
                    description={
                      allowCreate
                        ? 'Assign this team to one or more projects.'
                        : 'No projects assigned to this team.'
                    }
                    action={
                      allowCreate
                        ? { label: 'Assign projects', onClick: () => openAssign(selected) }
                        : undefined
                    }
                  />
                ) : (
                  <ul className="space-y-2">
                    {selected.projectIds.map((pid) => {
                      const project = projects.find((p) => p.id === pid);
                      if (!project) return null;
                      return (
                        <li
                          key={pid}
                          className="rounded-xl border border-border bg-bg-muted/40 px-3 py-2.5"
                        >
                          <p className="text-sm font-medium text-ink">{project.title}</p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {project.status} · {project.owner}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {allowCreate ? (
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  loading={removeTeam.isPending}
                  onClick={async () => {
                    await removeTeam.mutateAsync(selected.id);
                    setSelectedId(teams.find((t) => t.id !== selected.id)?.id || null);
                  }}
                >
                  Delete team
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="No team selected"
              description={
                allowCreate
                  ? 'Create a team to get started.'
                  : 'You are not assigned to any teams yet.'
              }
              action={
                allowCreate ? { label: 'Create team', onClick: openCreate } : undefined
              }
            />
          </Card>
        )}
      </div>

      {/* Create / Edit modal */}
      {allowCreate && (createOpen || editOpen) ? (
      <Modal
        isOpen={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
        }}
        title={createOpen ? 'Create team' : 'Edit team'}
        size="xl"
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Team</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Team name"
                required
                value={form.name}
                error={errors.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mobile Platform"
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TeamStatus }))}
              >
                <option value="forming">Forming</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <TextArea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="What does this team own?"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">People</p>
            <Select
              label="Team lead"
              required
              value={form.leadId}
              error={errors.leadId}
              onChange={(e) => {
                const leadId = e.target.value;
                setForm((f) => ({
                  ...f,
                  leadId,
                  memberIds: f.memberIds.filter((id) => id !== leadId),
                }));
              }}
            >
              {people.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.title}
                </option>
              ))}
            </Select>
            <PeoplePicker
              label="Select members"
              people={people}
              selectedIds={form.memberIds}
              lockedId={form.leadId}
              onToggle={toggleMember}
              error={errors.memberIds}
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Projects</p>
            <ProjectPicker
              label="Assign to projects (optional)"
              projects={projects}
              selectedIds={form.projectIds}
              onToggle={(id) =>
                toggleProject(id, form.projectIds, (projectIds) => setForm((f) => ({ ...f, projectIds })))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                setEditOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button loading={createTeam.isPending || updateTeam.isPending} onClick={createOpen ? handleCreate : handleUpdate}>
              {createOpen ? 'Create team' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
      ) : null}

      {/* Assign projects modal */}
      <Modal
        isOpen={allowCreate && assignOpen}
        onClose={() => setAssignOpen(false)}
        title={`Assign projects · ${selected?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Choose which projects this team owns or contributes to.
          </p>
          <ProjectPicker
            projects={projects}
            selectedIds={assignProjectIds}
            onToggle={(id) => toggleProject(id, assignProjectIds, setAssignProjectIds)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button loading={updateTeam.isPending} onClick={handleAssign}>Save assignments</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PeoplePicker({
  label = 'People',
  people,
  selectedIds,
  lockedId,
  onToggle,
  error,
}: {
  label?: string;
  people: Person[];
  selectedIds: string[];
  lockedId?: string;
  onToggle: (id: string) => void;
  error?: string;
}) {
  const [q, setQ] = useState('');
  const filtered = people.filter((p) => {
    const name = p.name.toLowerCase();
    const needle = q.trim().toLowerCase();
    return !needle || name.includes(needle) || p.title.toLowerCase().includes(needle);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        <p className="text-xs text-ink-muted">
          {selectedIds.length + (lockedId ? 1 : 0)} selected
        </p>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter people..."
          className="w-full rounded-xl bg-bg-muted border border-transparent pl-10 pr-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 focus:bg-surface"
        />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
        {filtered.map((user) => {
          const locked = user.id === lockedId;
          const selected = locked || selectedIds.includes(user.id);
          return (
            <button
              key={user.id}
              type="button"
              disabled={locked}
              onClick={() => onToggle(user.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                selected ? 'bg-brand-mist/60' : 'hover:bg-surface-hover',
                locked && 'opacity-90 cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-md border',
                  selected ? 'bg-brand border-brand text-ink-inverse' : 'border-border-strong bg-surface',
                )}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
              </span>
              <Avatar size="sm" name={user.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                <p className="text-xs text-ink-muted truncate">{user.title}</p>
              </div>
              {locked && <Badge size="sm" variant="info">Lead</Badge>}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

function ProjectPicker({
  label,
  projects,
  selectedIds,
  onToggle,
}: {
  label?: string;
  projects: Project[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-ink-secondary mb-2">
          {label}{' '}
          <span className="text-ink-muted font-normal">· {selectedIds.length} selected</span>
        </p>
      )}
      <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
        {projects.map((project) => {
          const selected = selectedIds.includes(project.id);
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onToggle(project.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                selected ? 'bg-brand-mist/60' : 'hover:bg-surface-hover',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-md border',
                  selected ? 'bg-brand border-brand text-ink-inverse' : 'border-border-strong bg-surface',
                )}
              >
                {selected ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3 opacity-0" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{project.title}</p>
                <p className="text-xs text-ink-muted truncate">
                  {project.status} · {project.owner}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
