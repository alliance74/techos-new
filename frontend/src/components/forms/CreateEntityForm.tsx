'use client';

import { useEffect, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useCreateEntity, useEntityList, useUpdateEntity } from '@/hooks/useEntityApi';
import { useUploadDocument } from '@/hooks/useDocuments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';

/** Singular labels for create modal titles (HubSpot/Linear-style). */
export function createEntityLabel(entityKey: string): string {
  const labels: Record<string, string> = {
    meetings: 'Meeting',
    projects: 'Product',
    tasks: 'Task',
    invoices: 'Invoice',
    expenses: 'Expense',
    budgets: 'Budget',
    deals: 'Deal',
    opportunities: 'Deal',
    contacts: 'Contact',
    leads: 'Lead',
    goals: 'Goal',
    documents: 'Document',
    announcements: 'Announcement',
    features: 'Feature',
    bugs: 'Bug',
    releases: 'Release',
    sprints: 'Sprint',
    leaveRequests: 'Leave request',
    employees: 'Team member',
    campaigns: 'Campaign',
    processes: 'Process',
    codeReviews: 'Code review',
    commits: 'Commit',
  };
  return labels[entityKey] || 'Record';
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function FormSection({
  title,
  description,
  children,
  bordered,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={
        bordered
          ? 'space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4'
          : 'space-y-3'
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function formatUserLabel(user: {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}) {
  const first = user.first_name || user.firstName || '';
  const last = user.last_name || user.lastName || '';
  const name = `${first} ${last}`.trim();
  const role = user.role ? ` · ${user.role.replace(/_/g, ' ')}` : '';
  return `${name || user.email || 'User'}${role}`;
}

function OwnerUserSelect({
  label = 'Owner',
  value,
  onChange,
  error,
  required,
}: {
  label?: string;
  value: string;
  onChange: (userId: string) => void;
  error?: string;
  required?: boolean;
}) {
  const { data: users = [], isLoading } = useUsers();
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!value && currentUser?.id && (users as any[]).some((u) => u.id === currentUser.id)) {
      onChange(currentUser.id);
    }
  }, [value, currentUser?.id, users, onChange]);

  return (
    <Select
      label={label}
      required={required}
      value={value}
      error={error}
      disabled={isLoading}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{isLoading ? 'Loading users...' : 'Select a user'}</option>
      {(users as any[]).map((user) => (
        <option key={user.id} value={user.id}>
          {formatUserLabel(user)}
        </option>
      ))}
    </Select>
  );
}

function FormActions({
  onCancel,
  loading,
  submitLabel = 'Create',
}: {
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </div>
  );
}

type Props = {
  entityKey: string;
  onDone: () => void;
  /** When set, form updates this record instead of creating. */
  record?: Record<string, any> | null;
};

/**
 * Entity-specific create/edit forms modeled on professional tools:
 * Meetings → Google Calendar / HubSpot · Deals → HubSpot/Salesforce ·
 * Invoices → QuickBooks · Tasks → Asana/Linear · Goals → OKR apps · etc.
 */
export function CreateEntityForm({ entityKey, onDone, record }: Props) {
  switch (entityKey) {
    case 'meetings':
      return <MeetingCreateForm onDone={onDone} />;
    case 'projects':
      return <ProjectCreateForm onDone={onDone} />;
    case 'tasks':
      return <TaskCreateForm onDone={onDone} />;
    case 'invoices':
      return <InvoiceCreateForm onDone={onDone} />;
    case 'expenses':
      return <ExpenseCreateForm onDone={onDone} />;
    case 'budgets':
      return <BudgetCreateForm onDone={onDone} />;
    case 'deals':
    case 'opportunities':
      return <DealCreateForm onDone={onDone} record={record} />;
    case 'contacts':
      return <ContactCreateForm entityKey="contacts" onDone={onDone} record={record} />;
    case 'leads':
      return <ContactCreateForm entityKey="leads" onDone={onDone} record={record} />;
    case 'goals':
      return <GoalCreateForm onDone={onDone} />;
    case 'campaigns':
      return <CampaignCreateForm onDone={onDone} record={record} />;
    case 'processes':
      return <ProcessCreateForm onDone={onDone} record={record} />;
    case 'documents':
      return <DocumentCreateForm onDone={onDone} />;
    case 'announcements':
      return <AnnouncementCreateForm onDone={onDone} />;
    case 'features':
      return <FeatureCreateForm onDone={onDone} />;
    case 'bugs':
      return <BugCreateForm onDone={onDone} />;
    case 'releases':
      return <ReleaseCreateForm onDone={onDone} />;
    case 'sprints':
      return <SprintCreateForm onDone={onDone} />;
    case 'codeReviews':
      return <CodeReviewCreateForm onDone={onDone} />;
    case 'commits':
      return <CommitCreateForm onDone={onDone} />;
    case 'leaveRequests':
      return <LeaveCreateForm onDone={onDone} />;
    default:
      return <GenericCreateForm entityKey={entityKey} onDone={onDone} />;
  }
}

function MeetingCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('meetings');
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    date: todayIso(),
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    meeting_link: '',
    type: 'sync',
    agenda: '',
    participant_ids: [] as string[],
  });

  const viewerOptions = (users as any[]).filter((u) => u.id && u.id !== currentUser?.id);

  const toggleViewer = (userId: string) => {
    setForm((f) => {
      const has = f.participant_ids.includes(userId);
      return {
        ...f,
        participant_ids: has
          ? f.participant_ids.filter((id) => id !== userId)
          : [...f.participant_ids, userId],
      };
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Meeting title is required';
    if (!form.date) next.date = 'Date is required';
    if (!form.start_time) next.start_time = 'Start time is required';
    if (!form.end_time) next.end_time = 'End time is required';
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      next.end_time = 'End must be after start';
    }
    if (!form.participant_ids.length) {
      next.participant_ids = 'Select at least one viewer';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!validate()) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <FormSection title="Basics">
        <Input
          label="Meeting title"
          required
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Sprint planning"
        />
        <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="standup">Standup</option>
          <option value="sync">Sync</option>
          <option value="review">Review</option>
          <option value="1:1">1:1</option>
          <option value="external">External</option>
        </Select>
      </FormSection>

      <FormSection title="Schedule" bordered>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Date"
            type="date"
            required
            value={form.date}
            error={errors.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <Input
            label="Starts"
            type="time"
            required
            value={form.start_time}
            error={errors.start_time}
            onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
          />
          <Input
            label="Ends"
            type="time"
            required
            value={form.end_time}
            error={errors.end_time}
            onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Conference room or city"
          />
          <Input
            label="Meeting link"
            value={form.meeting_link}
            onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))}
            placeholder="https://meet.google.com/..."
          />
        </div>
      </FormSection>

      <FormSection
        title="Viewers"
        description="Only selected people (plus you as organizer) will see this meeting."
        bordered
      >
        {usersLoading ? (
          <p className="text-sm text-ink-muted">Loading people…</p>
        ) : viewerOptions.length === 0 ? (
          <p className="text-sm text-ink-muted">Invite teammates first, then assign them as viewers.</p>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-surface p-3">
            {viewerOptions.map((user) => {
              const checked = form.participant_ids.includes(user.id);
              return (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-hover"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-brand"
                    checked={checked}
                    onChange={() => toggleViewer(user.id)}
                  />
                  <span className="text-sm text-ink">{formatUserLabel(user)}</span>
                </label>
              );
            })}
          </div>
        )}
        {errors.participant_ids ? (
          <p className="text-xs text-[var(--danger)]">{errors.participant_ids}</p>
        ) : null}
      </FormSection>

      <FormSection title="Agenda">
        <TextArea
          label="Topics"
          value={form.agenda}
          onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
          rows={3}
          placeholder="What will you cover?"
        />
      </FormSection>

      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Schedule meeting" />
    </form>
  );
}

function ProjectCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('projects');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visibilityMode, setVisibilityMode] = useState<'all' | 'roles'>('all');
  const [form, setForm] = useState({
    title: '',
    client_name: '',
    status: 'planning',
    priority: 'medium',
    description: '',
    amount: '',
    start_date: todayIso(),
    end_date: '',
    visible_to_roles: ['ceo'] as string[],
  });

  const roleOptions = [
    { id: 'ceo', label: 'CEO', locked: true },
    { id: 'cto', label: 'CTO' },
    { id: 'ciso', label: 'CISO' },
    { id: 'finance', label: 'Finance' },
    { id: 'software_engineer', label: 'Software Engineer' },
    { id: 'ui_ux_designer', label: 'UI/UX Designer' },
    { id: 'customer_support', label: 'Customer Support' },
  ];

  const toggleRole = (roleId: string, locked?: boolean) => {
    if (locked) return;
    setForm((f) => {
      const has = f.visible_to_roles.includes(roleId);
      const next = has
        ? f.visible_to_roles.filter((r) => r !== roleId)
        : [...f.visible_to_roles, roleId];
      if (!next.includes('ceo')) next.unshift('ceo');
      return { ...f, visible_to_roles: next };
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Product name is required';
    if (!form.client_name.trim()) next.client_name = 'Client is required';
    if (!form.start_date) next.start_date = 'Start date is required';
    if (!form.end_date) next.end_date = 'End date is required';
    if (
      form.start_date &&
      form.end_date &&
      new Date(form.end_date).getTime() <= new Date(form.start_date).getTime()
    ) {
      next.end_date = 'End date must be after start date';
    }
    if (visibilityMode === 'roles' && form.visible_to_roles.length === 0) {
      next.visible_to_roles = 'Select at least one role';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!validate()) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync({
          ...form,
          visible_to_roles: visibilityMode === 'all' ? [] : form.visible_to_roles,
        });
        onDone();
      }}
    >
      <Input
        label="Product / project name"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="e.g. Website redesign"
      />
      <Input
        label="Client"
        required
        value={form.client_name}
        error={errors.client_name}
        onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
        placeholder="Client or company name"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Timeline start"
          type="date"
          required
          value={form.start_date}
          error={errors.start_date}
          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
        />
        <Input
          label="Timeline end"
          type="date"
          required
          value={form.end_date}
          error={errors.end_date}
          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
        </Select>
        <Select
          label="Priority"
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </div>
      <TextArea
        label="Scope / description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
      <Input
        label="Budget (optional)"
        type="number"
        min="0"
        value={form.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        placeholder="Allocated budget"
      />

      <div className="space-y-2 rounded-xl border border-border p-3">
        <p className="text-sm font-medium text-ink">Visible to</p>
        <p className="text-xs text-ink-muted">
          Choose which roles can see this project. CEO always has access.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setVisibilityMode('all')}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              visibilityMode === 'all'
                ? 'border-brand bg-brand/5 font-medium text-ink'
                : 'border-border text-ink-muted hover:bg-bg-muted'
            }`}
          >
            Everyone
          </button>
          <button
            type="button"
            onClick={() => setVisibilityMode('roles')}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              visibilityMode === 'roles'
                ? 'border-brand bg-brand/5 font-medium text-ink'
                : 'border-border text-ink-muted hover:bg-bg-muted'
            }`}
          >
            Selected roles
          </button>
        </div>
        {visibilityMode === 'roles' ? (
          <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {roleOptions.map((role) => {
              const checked = form.visible_to_roles.includes(role.id);
              return (
                <label
                  key={role.id}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                    role.locked ? 'opacity-80' : 'cursor-pointer hover:bg-bg-muted'
                  } ${checked ? 'bg-brand/5' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={role.locked}
                    onChange={() => toggleRole(role.id, role.locked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-ink">{role.label}</span>
                  {role.locked ? (
                    <span className="text-[10px] uppercase text-ink-muted">always</span>
                  ) : null}
                </label>
              );
            })}
            {errors.visible_to_roles ? (
              <p className="px-2 pt-1 text-xs text-[var(--danger)]">{errors.visible_to_roles}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <FormActions onCancel={onDone} loading={createEntity.isPending} />
    </form>
  );
}

function TaskCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('tasks');
  const { data: projects = [], isLoading: projectsLoading } = useEntityList('projects');
  const { data: sprints = [] } = useEntityList('sprints');
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    sprint_id: '',
    owner: currentUser?.id || '',
    status: 'todo',
    priority: 'medium',
    description: '',
    dueDate: '',
    story_points: '',
  });

  useEffect(() => {
    if (form.project_id || !(projects as any[]).length) return;
    const preferred =
      (projects as any[]).find((p) => /active/i.test(String(p.status))) || (projects as any[])[0];
    if (preferred?.id) setForm((f) => ({ ...f, project_id: preferred.id }));
  }, [projects, form.project_id]);

  const projectSprints = (sprints as any[]).filter(
    (s) => !form.project_id || s.project_id === form.project_id,
  );

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Task title is required';
        if (!form.project_id) next.project_id = 'Select a project';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync({
          ...form,
          assigned_to: form.owner,
          owner_id: form.owner,
          assignee_id: form.owner || undefined,
          sprint_id: form.sprint_id || null,
          story_points: form.story_points ? Number(form.story_points) : undefined,
        });
        onDone();
      }}
    >
      <FormSection title="Overview">
        <Input
          label="Task title"
          required
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Short, actionable title"
        />
        <TextArea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="Acceptance criteria, context, links…"
        />
      </FormSection>

      <FormSection title="Placement" bordered>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            required
            value={form.project_id}
            error={errors.project_id}
            disabled={projectsLoading}
            onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value, sprint_id: '' }))}
          >
            <option value="">{projectsLoading ? 'Loading…' : 'Select project'}</option>
            {(projects as any[]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.name}
              </option>
            ))}
          </Select>
          <Select
            label="Sprint"
            value={form.sprint_id}
            onChange={(e) => setForm((f) => ({ ...f, sprint_id: e.target.value }))}
          >
            <option value="">Backlog (no sprint)</option>
            {projectSprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || s.name}
                {/active/i.test(String(s.status)) ? ' · active' : ''}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OwnerUserSelect
            label="Assignee"
            value={form.owner}
            onChange={(owner) => setForm((f) => ({ ...f, owner }))}
          />
          <Input
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="in_review">In review</option>
            <option value="done">Done</option>
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Input
            label="Story points"
            type="number"
            min={0}
            value={form.story_points}
            onChange={(e) => setForm((f) => ({ ...f, story_points: e.target.value }))}
            placeholder="e.g. 3"
          />
        </div>
      </FormSection>

      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Create task" />
    </form>
  );
}

function InvoiceCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('invoices');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    client_name: '',
    description: '',
    amount: '',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: 'draft',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.client_name.trim()) next.client_name = 'Customer is required';
        if (!form.amount || Number(form.amount) <= 0) next.amount = 'Amount is required';
        if (!form.dueDate) next.dueDate = 'Due date is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync({
          ...form,
          title: form.client_name,
        });
        onDone();
      }}
    >
      <Input
        label="Customer / client"
        required
        value={form.client_name}
        error={errors.client_name}
        onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
        placeholder="Bill-to name"
      />
      <Input
        label="Line item / service"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="What are you billing for?"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          required
          value={form.amount}
          error={errors.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        />
        <Input
          label="Due date"
          type="date"
          required
          value={form.dueDate}
          error={errors.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />
      </div>
      <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
      </Select>
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Create invoice" />
    </form>
  );
}

function ExpenseCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('expenses');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    description: '',
    category: 'General',
    amount: '',
    date: todayIso(),
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.description.trim()) next.description = 'Description is required';
        if (!form.amount || Number(form.amount) <= 0) next.amount = 'Amount is required';
        if (!form.date) next.date = 'Date is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <Input
        label="Merchant / description"
        required
        value={form.description}
        error={errors.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="e.g. AWS, team lunch, travel"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          <option value="General">General</option>
          <option value="Travel">Travel</option>
          <option value="Software">Software</option>
          <option value="Office">Office</option>
          <option value="Marketing">Marketing</option>
          <option value="Meals">Meals</option>
        </Select>
        <Input
          label="Date"
          type="date"
          required
          value={form.date}
          error={errors.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
      </div>
      <Input
        label="Amount"
        type="number"
        min="0"
        step="0.01"
        required
        value={form.amount}
        error={errors.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
      />
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Submit expense" />
    </form>
  );
}

function BudgetCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('budgets');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const year = new Date().getFullYear();
  const [form, setForm] = useState({
    title: '',
    category: 'Operations',
    amount: '',
    period_start: `${year}-01-01`,
    period_end: `${year}-12-31`,
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Budget name is required';
        if (!form.amount || Number(form.amount) <= 0) next.amount = 'Allocated amount is required';
        if (!form.period_start) next.period_start = 'Period start is required';
        if (!form.period_end) next.period_end = 'Period end is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <Input
        label="Budget name"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="e.g. Q3 Marketing"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          <option value="Operations">Operations</option>
          <option value="Engineering">Engineering</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="HR">HR</option>
          <option value="Other">Other</option>
        </Select>
        <Input
          label="Allocated amount"
          type="number"
          min="0"
          required
          value={form.amount}
          error={errors.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Period start"
          type="date"
          required
          value={form.period_start}
          error={errors.period_start}
          onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))}
        />
        <Input
          label="Period end"
          type="date"
          required
          value={form.period_end}
          error={errors.period_end}
          onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))}
        />
      </div>
      <FormActions onCancel={onDone} loading={createEntity.isPending} />
    </form>
  );
}

function DealCreateForm({
  onDone,
  record,
}: {
  onDone: () => void;
  record?: Record<string, any> | null;
}) {
  const createEntity = useCreateEntity('deals');
  const updateEntity = useUpdateEntity('deals');
  const isEdit = Boolean(record?.id);
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: record?.title || '',
    amount: record?.amount != null ? String(record.amount) : '',
    status: String(record?.status || record?.stage || 'qualification').toLowerCase(),
    owner: record?.owner_id || record?.assigned_to || currentUser?.id || '',
    dueDate: record?.dueDate || record?.expected_close_date || '',
    company: record?.company || record?.company_name || '',
    email: record?.email || '',
    phone: record?.phone || '',
    description: record?.description || record?.notes || '',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Deal name is required';
        if (!form.amount || Number(form.amount) <= 0) next.amount = 'Deal value is required';
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          next.email = 'Enter a valid email';
        }
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        const payload = {
          ...form,
          owner_id: form.owner,
          assigned_to: form.owner,
        };
        if (isEdit) {
          await updateEntity.mutateAsync({ id: record!.id, data: payload });
        } else {
          await createEntity.mutateAsync(payload);
        }
        onDone();
      }}
    >
      <Input
        label="Deal name"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="e.g. Acme expansion"
      />
      <Input
        label="Company"
        value={form.company}
        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
        placeholder="Account / company"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="contact@company.com"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Deal value"
          type="number"
          min="0"
          required
          value={form.amount}
          error={errors.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        />
        <Input
          label="Expected close"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Stage" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          <option value="qualification">Qualification</option>
          <option value="proposal">Proposal</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed won</option>
          <option value="closed_lost">Closed lost</option>
        </Select>
        <OwnerUserSelect
          label="Owner"
          value={form.owner}
          onChange={(owner) => setForm((f) => ({ ...f, owner }))}
        />
      </div>
      <TextArea
        label="Notes"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
      <FormActions
        onCancel={onDone}
        loading={createEntity.isPending || updateEntity.isPending}
        submitLabel={isEdit ? 'Save deal' : 'Create deal'}
      />
    </form>
  );
}

function ContactCreateForm({
  entityKey,
  onDone,
  record,
}: {
  entityKey: 'contacts' | 'leads';
  onDone: () => void;
  record?: Record<string, any> | null;
}) {
  const createEntity = useCreateEntity(entityKey);
  const updateEntity = useUpdateEntity(entityKey);
  const isEdit = Boolean(record?.id);
  const isLead = entityKey === 'leads';
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    first_name: record?.first_name || String(record?.title || '').trim().split(/\s+/)[0] || '',
    last_name:
      record?.last_name ||
      String(record?.title || '')
        .trim()
        .split(/\s+/)
        .slice(1)
        .join(' ') ||
      '',
    email: record?.email || '',
    phone: record?.phone || '',
    company: record?.company || record?.company_name || '',
    description: record?.description || record?.notes || '',
    status: record?.status || (isLead ? 'qualified' : 'active'),
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.first_name.trim()) next.first_name = 'First name is required';
        if (!form.last_name.trim()) next.last_name = 'Last name is required';
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          next.email = 'Enter a valid email';
        }
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        const payload = {
          ...form,
          title: `${form.first_name} ${form.last_name}`.trim(),
        };
        if (isEdit) {
          await updateEntity.mutateAsync({ id: record!.id, data: payload });
        } else {
          await createEntity.mutateAsync(payload);
        }
        onDone();
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          required
          value={form.first_name}
          error={errors.first_name}
          onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
        />
        <Input
          label="Last name"
          required
          value={form.last_name}
          error={errors.last_name}
          onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <Input
        label="Company"
        value={form.company}
        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
        placeholder={isLead ? 'Prospect company' : 'Company'}
      />
      <TextArea
        label="Notes"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
      <FormActions
        onCancel={onDone}
        loading={createEntity.isPending || updateEntity.isPending}
        submitLabel={isEdit ? (isLead ? 'Save lead' : 'Save contact') : isLead ? 'Create lead' : 'Create contact'}
      />
    </form>
  );
}

function CampaignCreateForm({
  onDone,
  record,
}: {
  onDone: () => void;
  record?: Record<string, any> | null;
}) {
  const createEntity = useCreateEntity('campaigns');
  const updateEntity = useUpdateEntity('campaigns');
  const { data: users = [] } = useUsers();
  const isEdit = Boolean(record?.id);
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: record?.title || '',
    channel: record?.channel || 'email',
    objective: record?.objective || 'lead_generation',
    status: record?.status || 'draft',
    owner: record?.owner_id || record?.assigned_to || currentUser?.id || '',
    budget: record?.budget != null ? String(record.budget) : record?.amount != null ? String(record.amount) : '',
    spent: record?.spent != null ? String(record.spent) : '0',
    start_date: record?.start_date || '',
    end_date: record?.end_date || record?.dueDate || '',
    audience: record?.audience || '',
    utm_campaign: record?.utm_campaign || '',
    goal_metric: record?.goal_metric || 'leads',
    goal_target: record?.goal_target != null ? String(record.goal_target) : '',
    impressions: record?.impressions != null ? String(record.impressions) : '0',
    clicks: record?.clicks != null ? String(record.clicks) : '0',
    leads: record?.leads != null ? String(record.leads) : '0',
    conversions: record?.conversions != null ? String(record.conversions) : '0',
    description: record?.description || '',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Campaign name is required';
        if (!form.channel) next.channel = 'Channel is required';
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
          next.end_date = 'End date must be on or after start date';
        }
        if (form.budget && Number(form.budget) < 0) next.budget = 'Budget cannot be negative';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        const ownerUser = (users as any[]).find((u) => u.id === form.owner);
        const owner_name = ownerUser
          ? formatUserLabel(ownerUser).split(' · ')[0]
          : undefined;
        const payload = {
          ...form,
          owner_id: form.owner,
          owner: form.owner,
          owner_name,
        };
        if (isEdit) {
          await updateEntity.mutateAsync({ id: record!.id, data: payload });
        } else {
          await createEntity.mutateAsync(payload);
        }
        onDone();
      }}
    >
      <Input
        label="Campaign name"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="e.g. Q3 Product Launch — Email Nurture"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Channel"
          required
          value={form.channel}
          error={errors.channel}
          onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
        >
          <option value="email">Email</option>
          <option value="social">Social</option>
          <option value="search">Paid search</option>
          <option value="display">Display / programmatic</option>
          <option value="content">Content / SEO</option>
          <option value="events">Events / webinars</option>
          <option value="partner">Partner / affiliate</option>
          <option value="multi">Multi-channel</option>
        </Select>
        <Select
          label="Objective"
          value={form.objective}
          onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
        >
          <option value="brand_awareness">Brand awareness</option>
          <option value="traffic">Website traffic</option>
          <option value="lead_generation">Lead generation</option>
          <option value="conversions">Conversions / sales</option>
          <option value="engagement">Engagement</option>
          <option value="product_launch">Product launch</option>
          <option value="retention">Retention / nurture</option>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </Select>
        <OwnerUserSelect
          label="Owner"
          value={form.owner}
          onChange={(owner) => setForm((f) => ({ ...f, owner }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Budget"
          type="number"
          min="0"
          value={form.budget}
          error={errors.budget}
          onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
          placeholder="0"
        />
        <Input
          label="Spend to date"
          type="number"
          min="0"
          value={form.spent}
          onChange={(e) => setForm((f) => ({ ...f, spent: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start date"
          type="date"
          value={form.start_date}
          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
        />
        <Input
          label="End date"
          type="date"
          value={form.end_date}
          error={errors.end_date}
          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
        />
      </div>
      <Input
        label="Target audience"
        value={form.audience}
        onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
        placeholder="e.g. Mid-market SaaS CEOs in US/EU"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="UTM campaign"
          value={form.utm_campaign}
          onChange={(e) => setForm((f) => ({ ...f, utm_campaign: e.target.value }))}
          placeholder="q3_launch_email"
        />
        <Select
          label="Goal metric"
          value={form.goal_metric}
          onChange={(e) => setForm((f) => ({ ...f, goal_metric: e.target.value }))}
        >
          <option value="leads">Leads</option>
          <option value="conversions">Conversions</option>
          <option value="clicks">Clicks</option>
          <option value="impressions">Impressions</option>
        </Select>
        <Input
          label="Goal target"
          type="number"
          min="0"
          value={form.goal_target}
          onChange={(e) => setForm((f) => ({ ...f, goal_target: e.target.value }))}
          placeholder="100"
        />
      </div>
      {isEdit ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input
            label="Impressions"
            type="number"
            min="0"
            value={form.impressions}
            onChange={(e) => setForm((f) => ({ ...f, impressions: e.target.value }))}
          />
          <Input
            label="Clicks"
            type="number"
            min="0"
            value={form.clicks}
            onChange={(e) => setForm((f) => ({ ...f, clicks: e.target.value }))}
          />
          <Input
            label="Leads"
            type="number"
            min="0"
            value={form.leads}
            onChange={(e) => setForm((f) => ({ ...f, leads: e.target.value }))}
          />
          <Input
            label="Conversions"
            type="number"
            min="0"
            value={form.conversions}
            onChange={(e) => setForm((f) => ({ ...f, conversions: e.target.value }))}
          />
        </div>
      ) : null}
      <TextArea
        label="Brief / description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
        placeholder="Creative angle, offer, CTA, success criteria…"
      />
      <FormActions
        onCancel={onDone}
        loading={createEntity.isPending || updateEntity.isPending}
        submitLabel={isEdit ? 'Save campaign' : 'Create campaign'}
      />
    </form>
  );
}

function ProcessCreateForm({
  onDone,
  record,
}: {
  onDone: () => void;
  record?: Record<string, any> | null;
}) {
  const createEntity = useCreateEntity('processes');
  const updateEntity = useUpdateEntity('processes');
  const { data: users = [] } = useUsers();
  const isEdit = Boolean(record?.id);
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: record?.title || '',
    category: record?.category || 'general',
    process_type: record?.process_type || 'sop',
    status: record?.status || 'draft',
    priority: record?.priority || 'medium',
    frequency: record?.frequency || 'as_needed',
    owner: record?.owner_id || record?.assigned_to || currentUser?.id || '',
    department: record?.department || '',
    systems: record?.systems || '',
    sla_hours: record?.sla_hours != null ? String(record.sla_hours) : '',
    steps_total: record?.steps_total != null ? String(record.steps_total) : '',
    steps_done: record?.steps_done != null ? String(record.steps_done) : '0',
    next_review_date: record?.next_review_date || record?.dueDate || '',
    last_run_date: record?.last_run_date || '',
    risk_level: record?.risk_level || 'low',
    compliance_required: Boolean(record?.compliance_required),
    description: record?.description || '',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Process name is required';
        if (
          form.steps_total &&
          form.steps_done &&
          Number(form.steps_done) > Number(form.steps_total)
        ) {
          next.steps_done = 'Completed steps cannot exceed total steps';
        }
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        const ownerUser = (users as any[]).find((u) => u.id === form.owner);
        const owner_name = ownerUser
          ? formatUserLabel(ownerUser).split(' · ')[0]
          : undefined;
        const payload = {
          ...form,
          owner_id: form.owner,
          owner: form.owner,
          owner_name,
        };
        if (isEdit) {
          await updateEntity.mutateAsync({ id: record!.id, data: payload });
        } else {
          await createEntity.mutateAsync(payload);
        }
        onDone();
      }}
    >
      <Input
        label="Process name"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="e.g. New hire IT provisioning"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          <option value="general">General ops</option>
          <option value="hiring">Hiring</option>
          <option value="onboarding">Onboarding</option>
          <option value="procurement">Procurement</option>
          <option value="finance_ops">Finance ops</option>
          <option value="customer_ops">Customer ops</option>
          <option value="it_ops">IT / infrastructure</option>
          <option value="compliance">Compliance / legal</option>
          <option value="facilities">Facilities</option>
          <option value="product_ops">Product ops</option>
          <option value="incident">Incident response</option>
        </Select>
        <Select
          label="Process type"
          value={form.process_type}
          onChange={(e) => setForm((f) => ({ ...f, process_type: e.target.value }))}
        >
          <option value="sop">SOP / playbook</option>
          <option value="checklist">Checklist</option>
          <option value="workflow">Workflow</option>
          <option value="runbook">Runbook</option>
          <option value="approval">Approval chain</option>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="under_review">Under review</option>
          <option value="paused">Paused</option>
          <option value="retired">Retired</option>
        </Select>
        <Select
          label="Priority"
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
        <Select
          label="Frequency"
          value={form.frequency}
          onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
        >
          <option value="as_needed">As needed</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annually">Annually</option>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OwnerUserSelect
          label="Process owner"
          value={form.owner}
          onChange={(owner) => setForm((f) => ({ ...f, owner }))}
        />
        <Input
          label="Department"
          value={form.department}
          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          placeholder="e.g. People Ops"
        />
      </div>
      <Input
        label="Systems involved"
        value={form.systems}
        onChange={(e) => setForm((f) => ({ ...f, systems: e.target.value }))}
        placeholder="e.g. Slack, Google Workspace, Notion"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="SLA (hours)"
          type="number"
          min="0"
          value={form.sla_hours}
          onChange={(e) => setForm((f) => ({ ...f, sla_hours: e.target.value }))}
          placeholder="24"
        />
        <Input
          label="Total steps"
          type="number"
          min="0"
          value={form.steps_total}
          onChange={(e) => setForm((f) => ({ ...f, steps_total: e.target.value }))}
        />
        <Input
          label="Steps done"
          type="number"
          min="0"
          value={form.steps_done}
          error={errors.steps_done}
          onChange={(e) => setForm((f) => ({ ...f, steps_done: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Next review"
          type="date"
          value={form.next_review_date}
          onChange={(e) => setForm((f) => ({ ...f, next_review_date: e.target.value }))}
        />
        <Input
          label="Last run"
          type="date"
          value={form.last_run_date}
          onChange={(e) => setForm((f) => ({ ...f, last_run_date: e.target.value }))}
        />
        <Select
          label="Risk level"
          value={form.risk_level}
          onChange={(e) => setForm((f) => ({ ...f, risk_level: e.target.value }))}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          className="rounded border-border"
          checked={form.compliance_required}
          onChange={(e) => setForm((f) => ({ ...f, compliance_required: e.target.checked }))}
        />
        Compliance / audit required
      </label>
      <TextArea
        label="SOP summary"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
        placeholder="Purpose, trigger, key steps, handoffs, and success criteria…"
      />
      <FormActions
        onCancel={onDone}
        loading={createEntity.isPending || updateEntity.isPending}
        submitLabel={isEdit ? 'Save process' : 'Create process'}
      />
    </form>
  );
}

function GoalCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('goals');
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'company',
    owner: currentUser?.id || '',
    dueDate: '',
    quarter: '',
    key_result_title: '',
    key_result_target: '',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Goal title is required';
        if (!form.description.trim()) next.description = 'Description is required';
        if (!form.owner) next.owner = 'Owner is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync({
          ...form,
          owner_id: form.owner,
          key_results: form.key_result_title
            ? [
                {
                  title: form.key_result_title,
                  target: Number(form.key_result_target) || 100,
                  current: 0,
                  unit: '%',
                },
              ]
            : undefined,
        });
        onDone();
      }}
    >
      <Input
        label="Objective"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="What outcome are you driving?"
      />
      <TextArea
        label="Description"
        required
        value={form.description}
        error={errors.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Level" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="company">Company</option>
          <option value="team">Team</option>
          <option value="individual">Individual</option>
        </Select>
        <OwnerUserSelect
          required
          value={form.owner}
          error={errors.owner}
          onChange={(owner) => setForm((f) => ({ ...f, owner }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />
        <Input
          label="Quarter (optional)"
          value={form.quarter}
          onChange={(e) => setForm((f) => ({ ...f, quarter: e.target.value }))}
          placeholder="e.g. Q3 2026"
        />
      </div>
      <div className="rounded-lg border border-border bg-bg-muted/40 p-3 space-y-3">
        <p className="text-sm font-medium text-ink">Key result (optional)</p>
        <Input
          label="Key result"
          value={form.key_result_title}
          onChange={(e) => setForm((f) => ({ ...f, key_result_title: e.target.value }))}
          placeholder="Measurable outcome"
        />
        <Input
          label="Target"
          type="number"
          value={form.key_result_target}
          onChange={(e) => setForm((f) => ({ ...f, key_result_target: e.target.value }))}
          placeholder="100"
        />
      </div>
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Create goal" />
    </form>
  );
}

function DocumentCreateForm({ onDone }: { onDone: () => void }) {
  const uploadDocument = useUploadDocument();
  const { data: projects = [] } = useEntityList('projects');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'document',
    status: 'draft',
    description: '',
    project_id: '',
  });

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!file) next.file = 'Choose a file to upload';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please choose a file');
          return;
        }
        if (file) {
          if (file.size > 25 * 1024 * 1024) {
            toast.error('File must be 25MB or smaller');
            return;
          }
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', form.title.trim() || file.name);
          formData.append('type', form.type === 'document' ? 'file' : form.type);
          if (form.description) formData.append('description', form.description);
          if (form.project_id) formData.append('project_id', form.project_id);
          if (form.status) formData.append('status', form.status);
          await uploadDocument.mutateAsync(formData);
        }
        onDone();
      }}
    >
      <FormSection title="File" description="Upload the source file so teammates can open it later.">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Attachment <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="file"
            className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-brand-mist file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] || null;
              setFile(nextFile);
              if (nextFile && !form.title.trim()) {
                setForm((f) => ({ ...f, title: nextFile.name.replace(/\.[^.]+$/, '') }));
              }
            }}
          />
          {errors.file ? <p className="mt-1 text-xs text-[var(--danger)]">{errors.file}</p> : null}
          <p className="mt-1 text-xs text-ink-muted">Max 25MB · PDF, docs, images, and common formats</p>
        </div>
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Defaults to file name"
        />
      </FormSection>

      <FormSection title="Details" bordered>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="document">Document</option>
            <option value="policy">Policy</option>
            <option value="contract">Contract</option>
            <option value="report">Report</option>
            <option value="template">Template</option>
            <option value="spec">Spec / design</option>
          </Select>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <Select
          label="Related project"
          value={form.project_id}
          onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
        >
          <option value="">None</option>
          {(projects as any[]).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title || p.name}
            </option>
          ))}
        </Select>
        <TextArea
          label="Summary"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="What is this document for?"
        />
      </FormSection>

      <FormActions onCancel={onDone} loading={uploadDocument.isPending} submitLabel="Upload document" />
    </form>
  );
}

function AnnouncementCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('announcements');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'published',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Headline is required';
        if (!form.description.trim()) next.description = 'Message is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <Input
        label="Headline"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Company-wide announcement"
      />
      <TextArea
        label="Message"
        required
        value={form.description}
        error={errors.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={5}
      />
      <Select label="Visibility" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
        <option value="published">Publish now</option>
        <option value="draft">Save as draft</option>
      </Select>
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Post announcement" />
    </form>
  );
}

function FeatureCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('features');
  const { data: projects = [] } = useEntityList('projects');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    status: 'idea',
    priority: 'medium',
    description: '',
  });

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Feature name is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <FormSection title="Overview">
        <Input
          label="Feature name"
          required
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="What are we shipping?"
        />
        <TextArea
          label="Problem / description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="Who needs this and why?"
        />
      </FormSection>
      <FormSection title="Planning" bordered>
        <Select
          label="Project"
          value={form.project_id}
          onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
        >
          <option value="">Optional</option>
          {(projects as any[]).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title || p.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="idea">Idea</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="shipped">Shipped</option>
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
      </FormSection>
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Add feature" />
    </form>
  );
}

function BugCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('bugs');
  const { data: projects = [], isLoading: projectsLoading } = useEntityList('projects');
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    assignee_id: currentUser?.id || '',
    severity: 'medium',
    priority: 'medium',
    status: 'open',
    environment: '',
    description: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
  });

  useEffect(() => {
    if (form.project_id || !(projects as any[]).length) return;
    const preferred =
      (projects as any[]).find((p) => /active/i.test(String(p.status))) || (projects as any[])[0];
    if (preferred?.id) setForm((f) => ({ ...f, project_id: preferred.id }));
  }, [projects, form.project_id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.project_id) next.project_id = 'Select a project';
    if (!form.steps_to_reproduce.trim() && !form.description.trim()) {
      next.steps_to_reproduce = 'Add steps to reproduce or a short description';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!validate()) {
          toast.error('Please fix validation errors');
          return;
        }
        const description =
          form.description.trim() ||
          form.steps_to_reproduce.trim() ||
          form.title.trim();
        await createEntity.mutateAsync({
          ...form,
          description,
          assignee_id: form.assignee_id || undefined,
        });
        onDone();
      }}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Overview</p>
        <Input
          label="Title"
          required
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Login button does nothing on mobile Safari"
        />
        <TextArea
          label="Summary"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          placeholder="Brief context — what broke and who is affected"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Classification</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            required
            value={form.project_id}
            error={errors.project_id}
            disabled={projectsLoading}
            onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
          >
            <option value="">{projectsLoading ? 'Loading projects…' : 'Select project'}</option>
            {(projects as any[]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.name}
              </option>
            ))}
          </Select>
          <OwnerUserSelect
            label="Assignee"
            value={form.assignee_id}
            onChange={(assignee_id) => setForm((f) => ({ ...f, assignee_id }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Severity"
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
          >
            <option value="low">Low — cosmetic</option>
            <option value="medium">Medium — impaired</option>
            <option value="high">High — major path</option>
            <option value="critical">Critical — blocker</option>
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
        <Input
          label="Environment"
          value={form.environment}
          onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
          placeholder="e.g. Chrome 128 · Windows 11 · staging"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Reproduction</p>
        <TextArea
          label="Steps to reproduce"
          required
          value={form.steps_to_reproduce}
          error={errors.steps_to_reproduce}
          onChange={(e) => setForm((f) => ({ ...f, steps_to_reproduce: e.target.value }))}
          rows={4}
          placeholder={'1. Go to …\n2. Click …\n3. Observe …'}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextArea
            label="Expected result"
            value={form.expected_behavior}
            onChange={(e) => setForm((f) => ({ ...f, expected_behavior: e.target.value }))}
            rows={3}
            placeholder="What should happen"
          />
          <TextArea
            label="Actual result"
            value={form.actual_behavior}
            onChange={(e) => setForm((f) => ({ ...f, actual_behavior: e.target.value }))}
            rows={3}
            placeholder="What happens instead"
          />
        </div>
      </div>

      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Report bug" />
    </form>
  );
}

function ReleaseCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('releases');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    version: '',
    status: 'planned',
    dueDate: '',
    description: '',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Release name is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <Input
        label="Release name"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="e.g. Spring platform release"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Version"
          value={form.version}
          onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
          placeholder="e.g. 2.4.0"
        />
        <Input
          label="Target date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />
      </div>
      <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
        <option value="planned">Planned</option>
        <option value="in_progress">In progress</option>
        <option value="released">Released</option>
      </Select>
      <TextArea
        label="Release notes"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
      <FormActions onCancel={onDone} loading={createEntity.isPending} />
    </form>
  );
}

function SprintCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('sprints');
  const { data: projects = [], isLoading: projectsLoading } = useEntityList('projects');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    start_date: todayIso(),
    end_date: '',
    status: 'planned',
    description: '',
  });

  useEffect(() => {
    if (form.project_id || !(projects as any[]).length) return;
    const preferred =
      (projects as any[]).find((p) => /active/i.test(String(p.status))) || (projects as any[])[0];
    if (preferred?.id) setForm((f) => ({ ...f, project_id: preferred.id }));
  }, [projects, form.project_id]);

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Sprint name is required';
        if (!form.project_id) next.project_id = 'Select a project';
        if (!form.start_date) next.start_date = 'Start date is required';
        if (!form.end_date) next.end_date = 'End date is required';
        if (
          form.start_date &&
          form.end_date &&
          new Date(form.end_date).getTime() < new Date(form.start_date).getTime()
        ) {
          next.end_date = 'End date must be on or after start';
        }
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <FormSection title="Sprint">
        <Input
          label="Sprint name"
          required
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Sprint 24"
        />
        <TextArea
          label="Goal"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="What should this sprint achieve?"
        />
      </FormSection>
      <FormSection title="Scope & schedule" bordered>
        <Select
          label="Project"
          required
          value={form.project_id}
          error={errors.project_id}
          disabled={projectsLoading}
          onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
        >
          <option value="">{projectsLoading ? 'Loading…' : 'Select project'}</option>
          {(projects as any[]).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title || p.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Start"
            type="date"
            required
            value={form.start_date}
            error={errors.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
          <Input
            label="End"
            type="date"
            required
            value={form.end_date}
            error={errors.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </FormSection>
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Create sprint" />
    </form>
  );
}

function CodeReviewCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('codeReviews');
  const { data: projects = [], isLoading: projectsLoading } = useEntityList('projects');
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    reviewer_id: '',
    status: 'open',
    priority: 'medium',
    repository: '',
    branch: '',
    base_branch: 'main',
    pr_url: '',
    description: '',
    files: [] as Array<{
      path: string;
      patch?: string;
      additions?: number;
      deletions?: number;
      status?: string;
    }>,
  });

  useEffect(() => {
    if (form.project_id || !(projects as any[]).length) return;
    const preferred =
      (projects as any[]).find((p) => /active/i.test(String(p.status))) || (projects as any[])[0];
    if (preferred?.id) setForm((f) => ({ ...f, project_id: preferred.id }));
  }, [projects, form.project_id]);

  const countPatch = (patch?: string) => {
    if (!patch) return { additions: 0, deletions: 0 };
    return {
      additions: (patch.match(/^\+[^+]/gm) || []).length,
      deletions: (patch.match(/^-[^-]/gm) || []).length,
    };
  };

  const importFromPr = async () => {
    if (!form.pr_url.trim()) {
      toast.error('Enter a GitHub PR or GitLab MR URL first');
      return;
    }
    setImporting(true);
    try {
      const res = await api.post('/code-reviews/preview-pr', { pr_url: form.pr_url.trim() });
      const payload = res.data?.data || res.data;
      const files = Array.isArray(payload?.files) ? payload.files : [];
      if (!files.length) {
        toast.error(payload?.message || 'No files found for that PR');
        return;
      }
      setForm((f) => ({ ...f, files }));
      toast.success(`Imported ${files.length} file${files.length === 1 ? '' : 's'}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not import PR files');
    } finally {
      setImporting(false);
    }
  };

  const reviewerOptions = (users as any[]).filter((u) => u.id !== currentUser?.id);

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Review title is required';
        if (!form.project_id) next.project_id = 'Select a project';
        if (!form.reviewer_id) next.reviewer_id = 'Select a reviewer';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        const result = await createEntity.mutateAsync({
          ...form,
          owner_id: form.reviewer_id,
          files: form.files,
        });
        if ((result as any)?.import_note) {
          toast((result as any).import_note, { icon: 'ℹ️' });
        }
        onDone();
      }}
    >
      <FormSection title="Pull request">
        <Input
          label="Title"
          required
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Fix auth redirect on expired session"
        />
        <TextArea
          label="Summary"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          placeholder="What changed and what should reviewers focus on?"
        />
      </FormSection>
      <FormSection title="Context" bordered>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            required
            value={form.project_id}
            error={errors.project_id}
            disabled={projectsLoading}
            onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
          >
            <option value="">{projectsLoading ? 'Loading…' : 'Select project'}</option>
            {(projects as any[]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.name}
              </option>
            ))}
          </Select>
          <Select
            label="Reviewer"
            required
            value={form.reviewer_id}
            error={errors.reviewer_id}
            disabled={usersLoading}
            onChange={(e) => setForm((f) => ({ ...f, reviewer_id: e.target.value }))}
          >
            <option value="">{usersLoading ? 'Loading…' : 'Select reviewer'}</option>
            {reviewerOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {formatUserLabel(user)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Repository"
            value={form.repository}
            onChange={(e) => setForm((f) => ({ ...f, repository: e.target.value }))}
            placeholder="org/repo"
          />
          <Input
            label="Branch"
            value={form.branch}
            onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
            placeholder="feature/…"
          />
        </div>
        <Input
          label="Base branch"
          value={form.base_branch}
          onChange={(e) => setForm((f) => ({ ...f, base_branch: e.target.value }))}
          placeholder="main"
        />
        <div className="space-y-2">
          <Input
            label="PR / MR link"
            value={form.pr_url}
            onChange={(e) => setForm((f) => ({ ...f, pr_url: e.target.value }))}
            placeholder="https://github.com/…/pull/123 or GitLab merge request"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={importing}
            onClick={importFromPr}
          >
            Import files from PR
          </Button>
          <p className="text-xs text-ink-muted">
            Uses GitHub/GitLab API when a token is configured (Integrations or GITHUB_TOKEN /
            GITLAB_TOKEN). You can also paste diffs manually below.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="approved">Approved</option>
            <option value="merged">Merged</option>
          </Select>
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
      </FormSection>
      <FormSection title="Files changed" bordered>
        <div className="space-y-3">
          {form.files.map((file, idx) => (
            <div key={idx} className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-start gap-2">
                <Input
                  label="Path"
                  value={file.path}
                  onChange={(e) =>
                    setForm((f) => {
                      const files = [...f.files];
                      files[idx] = { ...files[idx], path: e.target.value };
                      return { ...f, files };
                    })
                  }
                  placeholder="src/app.ts"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-6"
                  onClick={() =>
                    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== idx) }))
                  }
                >
                  Remove
                </Button>
              </div>
              <TextArea
                label="Unified diff (optional)"
                value={file.patch || ''}
                rows={5}
                onChange={(e) => {
                  const patch = e.target.value;
                  const counts = countPatch(patch);
                  setForm((f) => {
                    const files = [...f.files];
                    files[idx] = { ...files[idx], patch, ...counts };
                    return { ...f, files };
                  });
                }}
                placeholder={'@@ -1,3 +1,4 @@\n-old\n+new'}
              />
              <p className="text-xs text-ink-muted tabular-nums">
                <span className="text-success">+{file.additions ?? 0}</span>{' '}
                <span className="text-danger">-{file.deletions ?? 0}</span>
              </p>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                files: [...f.files, { path: '', patch: '', additions: 0, deletions: 0 }],
              }))
            }
          >
            Add file
          </Button>
        </div>
      </FormSection>
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Request review" />
    </form>
  );
}

function CommitCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('commits');
  const { data: projects = [], isLoading: projectsLoading } = useEntityList('projects');
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    owner: currentUser?.id || '',
    status: 'pushed',
    sha: '',
    branch: '',
    repository: '',
    description: '',
  });

  useEffect(() => {
    if (form.project_id || !(projects as any[]).length) return;
    const preferred =
      (projects as any[]).find((p) => /active/i.test(String(p.status))) || (projects as any[])[0];
    if (preferred?.id) setForm((f) => ({ ...f, project_id: preferred.id }));
  }, [projects, form.project_id]);

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Commit message is required';
        if (!form.project_id) next.project_id = 'Select a project';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync({
          ...form,
          owner_id: form.owner,
          metadata: {
            sha: form.sha,
            branch: form.branch,
            repository: form.repository,
            project_id: form.project_id,
          },
        });
        onDone();
      }}
    >
      <FormSection title="Commit">
        <Input
          label="Message"
          required
          value={form.title}
          error={errors.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. fix: prevent double submit on login"
        />
        <TextArea
          label="Notes"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          placeholder="Optional longer description"
        />
      </FormSection>
      <FormSection title="Source" bordered>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            required
            value={form.project_id}
            error={errors.project_id}
            disabled={projectsLoading}
            onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
          >
            <option value="">{projectsLoading ? 'Loading…' : 'Select project'}</option>
            {(projects as any[]).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.name}
              </option>
            ))}
          </Select>
          <OwnerUserSelect
            label="Author"
            value={form.owner}
            onChange={(owner) => setForm((f) => ({ ...f, owner }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="SHA"
            value={form.sha}
            onChange={(e) => setForm((f) => ({ ...f, sha: e.target.value }))}
            placeholder="abc1234"
          />
          <Input
            label="Branch"
            value={form.branch}
            onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
            placeholder="main"
          />
          <Input
            label="Repository"
            value={form.repository}
            onChange={(e) => setForm((f) => ({ ...f, repository: e.target.value }))}
            placeholder="org/repo"
          />
        </div>
      </FormSection>
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Log commit" />
    </form>
  );
}

function LeaveCreateForm({ onDone }: { onDone: () => void }) {
  const createEntity = useCreateEntity('leaveRequests');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    leave_type: 'vacation',
    start_date: todayIso(),
    end_date: '',
    reason: '',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.start_date) next.start_date = 'Start date is required';
        if (!form.end_date) next.end_date = 'End date is required';
        if (!form.reason.trim()) next.reason = 'Reason is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync(form);
        onDone();
      }}
    >
      <Select
        label="Leave type"
        value={form.leave_type}
        onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))}
      >
        <option value="vacation">Vacation</option>
        <option value="sick">Sick</option>
        <option value="personal">Personal</option>
        <option value="unpaid">Unpaid</option>
      </Select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="From"
          type="date"
          required
          value={form.start_date}
          error={errors.start_date}
          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
        />
        <Input
          label="To"
          type="date"
          required
          value={form.end_date}
          error={errors.end_date}
          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
        />
      </div>
      <TextArea
        label="Reason"
        required
        value={form.reason}
        error={errors.reason}
        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        rows={3}
      />
      <FormActions onCancel={onDone} loading={createEntity.isPending} submitLabel="Request leave" />
    </form>
  );
}

function GenericCreateForm({ entityKey, onDone }: { entityKey: string; onDone: () => void }) {
  const createEntity = useCreateEntity(entityKey);
  const currentUser = useAuthStore((s) => s.user);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    owner: currentUser?.id || '',
    description: '',
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = 'Title is required';
        setErrors(next);
        if (Object.keys(next).length) {
          toast.error('Please fix validation errors');
          return;
        }
        await createEntity.mutateAsync({
          ...form,
          owner_id: form.owner,
        });
        onDone();
      }}
    >
      <Input
        label="Title"
        required
        value={form.title}
        error={errors.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <OwnerUserSelect value={form.owner} onChange={(owner) => setForm((f) => ({ ...f, owner }))} />
      <TextArea
        label="Description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
      <FormActions onCancel={onDone} loading={createEntity.isPending} />
    </form>
  );
}
