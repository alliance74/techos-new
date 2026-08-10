/**
 * Maps ModuleWorkspace entity keys to real backend endpoints.
 * Native modules use dedicated APIs; everything else uses /workspace/:type.
 */

export type EntityFieldMap = {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  owner?: string;
  amount?: string;
  dueDate?: string;
};

export type EntityApiConfig = {
  /** Query key + path segment */
  key: string;
  listPath: string;
  itemPath: (id: string) => string;
  createPath: string;
  /** Optional query params for list requests (e.g. CRM type=lead) */
  listParams?: Record<string, string>;
  /** Optional client-side filter after fetch */
  listFilter?: (row: any) => boolean;
  /** Map UI form fields → API body */
  toCreateBody: (form: Record<string, any>) => Record<string, any>;
  /** Normalize API row → UI MockRecord-like shape */
  toUi: (row: any) => Record<string, any>;
};

function workspaceConfig(type: string): EntityApiConfig {
  return {
    key: type,
    listPath: `/workspace/${type}`,
    itemPath: (id) => `/workspace/${type}/${id}`,
    createPath: `/workspace/${type}`,
    toCreateBody: (form) => ({
      title: form.title || form.name,
      description: form.description,
      status: form.status || 'active',
      priority: form.priority,
      owner: form.owner,
      amount: form.amount ? Number(form.amount) : undefined,
      due_date: form.dueDate || form.due_date,
      metadata: form,
    }),
    toUi: (row) => ({
      ...row,
      title: row.title || row.name,
      name: row.name || row.title,
      statusVariant: row.statusVariant || 'default',
      dueDate: row.dueDate || row.due_date,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
    }),
  };
}

function statusVariant(status?: string) {
  const s = (status || '').toLowerCase();
  if (['active', 'completed', 'done', 'paid', 'approved', 'won', 'published'].includes(s)) return 'success';
  if (
    ['pending', 'in_progress', 'open', 'draft', 'scheduled', 'qualified', 'paused', 'under_review'].includes(
      s,
    )
  )
    return 'warning';
  if (['rejected', 'cancelled', 'terminated', 'lost', 'critical', 'closed', 'retired', 'blocked'].includes(s))
    return 'error';
  return 'default';
}

function humanizeRole(role: string) {
  return String(role || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const native: Record<string, EntityApiConfig> = {
  projects: {
    key: 'projects',
    listPath: '/projects',
    itemPath: (id) => `/projects/${id}`,
    createPath: '/projects',
    toCreateBody: (form) => ({
      name: form.title || form.name,
      description: form.description,
      status: form.status || 'active',
      priority: form.priority || 'medium',
      start_date: form.start_date,
      end_date: form.end_date,
      budget: form.amount ? Number(form.amount) : undefined,
      client_name: form.client_name?.trim() || undefined,
      visible_to_roles: Array.isArray(form.visible_to_roles)
        ? form.visible_to_roles
        : undefined,
    }),
    toUi: (row) => {
      const start = row.start_date;
      const end = row.end_date;
      let progress =
        typeof row.progress === 'number'
          ? row.progress
          : (() => {
              if (!start || !end) return 0;
              const s = new Date(start).getTime();
              const e = new Date(end).getTime();
              if (!(e > s)) return 0;
              const now = Date.now();
              if (now <= s) return 0;
              if (now >= e) return 100;
              return Math.round(((now - s) / (e - s)) * 100);
            })();
      const client = row.client_name || row.metadata?.client_name || row.owner_name || '—';
      const visibleRoles: string[] = Array.isArray(row.visible_to_roles)
        ? row.visible_to_roles
        : [];
      return {
        ...row,
        id: row.id,
        title: row.name || row.title,
        name: row.name,
        description: row.description,
        status: row.status || 'active',
        statusVariant: statusVariant(row.status),
        priority: row.priority,
        owner: client,
        client_name: client,
        amount: row.budget,
        dueDate: row.end_date,
        start_date: start,
        end_date: end,
        progress,
        visible_to_roles: visibleRoles,
        visibility:
          row.visibility ||
          (!visibleRoles.length ? 'All roles' : visibleRoles.map(humanizeRole).join(', ')),
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      };
    },
  },
  tasks: {
    key: 'tasks',
    listPath: '/tasks',
    itemPath: (id) => `/tasks/${id}`,
    createPath: '/tasks',
    toCreateBody: (form) => {
      const statusRaw = form.status || 'todo';
      const status = String(statusRaw)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/^to_do$/, 'todo')
        .replace(/^open$/, 'backlog')
        .replace(/^active$/, 'in_progress')
        .replace(/^review$/, 'in_review')
        .replace(/^(completed|closed|resolved)$/, 'done');

      const assignee =
        form.assignee_id ||
        form.assigned_to ||
        (typeof form.owner === 'string' && /^[0-9a-f-]{36}$/i.test(form.owner) ? form.owner : undefined) ||
        form.owner_id;

      const assigneeIds = Array.isArray(form.assignee_ids)
        ? [...new Set(form.assignee_ids.filter(Boolean))]
        : assignee
          ? [assignee]
          : undefined;

      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description ?? '',
        status,
        priority: form.priority || 'medium',
      };
      if (form.project_id) body.project_id = form.project_id;
      if (form.assignee_ids !== undefined || form.assignee_id === null || form.assignee_id === '') {
        if (Array.isArray(form.assignee_ids)) {
          body.assignee_ids = form.assignee_ids.filter(Boolean);
          body.assignee_id = (body.assignee_ids as string[])[0] || null;
        } else if (form.assignee_id === null || form.assignee_id === '') {
          body.assignee_id = null;
          body.assignee_ids = [];
        }
      } else if (assigneeIds) {
        body.assignee_ids = assigneeIds;
        body.assignee_id = assigneeIds[0];
      }
      if (form.sprint_id !== undefined) body.sprint_id = form.sprint_id || null;
      if (form.dueDate || form.due_date) body.due_date = form.dueDate || form.due_date;
      if (form.story_points != null && form.story_points !== '') {
        body.story_points = Number(form.story_points);
      }
      if (Array.isArray(form.tags)) body.tags = form.tags;
      return body;
    },
    toUi: (row) => {
      const assigneeIds: string[] = Array.isArray(row.assignee_ids)
        ? row.assignee_ids.filter(Boolean)
        : row.assignee_id
          ? [row.assignee_id]
          : [];
      const assignees: { id: string; name: string }[] = Array.isArray(row.assignees)
        ? row.assignees
        : [];
      const assigneeName =
        assignees.map((a) => a.name).filter(Boolean).join(', ') ||
        row.assignee_name ||
        [row.assignee_first_name, row.assignee_last_name].filter(Boolean).join(' ').trim() ||
        row.owner ||
        (assigneeIds.length ? 'Assigned' : 'Unassigned');
      return {
        ...row,
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status || 'todo',
        statusVariant: statusVariant(row.status),
        priority: row.priority || 'medium',
        owner: assigneeName,
        assignee: assigneeName,
        assignee_id: assigneeIds[0] || '',
        assignee_ids: assigneeIds,
        assignees,
        project_id: row.project_id || row.projectId || '',
        sprint_id: row.sprint_id || row.sprintId || null,
        dueDate: row.due_date || row.dueDate,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      };
    },
  },
  contacts: {
    key: 'contacts',
    listPath: '/crm/contacts',
    itemPath: (id) => `/crm/contacts/${id}`,
    createPath: '/crm/contacts',
    toCreateBody: (form) => {
      const first = form.first_name || String(form.title || 'New').trim().split(/\s+/)[0];
      const last =
        form.last_name ||
        String(form.title || 'Contact')
          .trim()
          .split(/\s+/)
          .slice(1)
          .join(' ') ||
        'Contact';
      return {
        first_name: first,
        last_name: last,
        email: form.email,
        phone: form.phone,
        company_name: form.company || form.company_name,
        status: form.status || 'active',
        type: form.type || (String(form.status || '').toLowerCase() === 'qualified' ? 'lead' : 'customer'),
        notes: form.description,
      };
    },
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email,
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      description: row.notes,
      status: row.status || row.type || 'active',
      statusVariant: statusVariant(row.status),
      owner: row.owner_name || '—',
      company: row.company_name,
      email: row.email || '',
      phone: row.phone || '',
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  deals: {
    key: 'deals',
    listPath: '/crm/deals',
    itemPath: (id) => `/crm/deals/${id}`,
    createPath: '/crm/deals',
    toCreateBody: (form) => {
      const stageRaw = String(form.status || form.stage || 'qualification').toLowerCase().replace(/\s+/g, '_');
      const allowed = new Set(['qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']);
      return {
        title: form.title,
        value: form.amount ? Number(form.amount) : 0,
        stage: allowed.has(stageRaw) ? stageRaw : 'qualification',
        assigned_to: form.owner_id || form.owner || form.assigned_to,
        notes: form.description,
        description: form.description,
        expected_close_date: form.dueDate,
        company: form.company,
        company_name: form.company || form.company_name,
        email: form.email,
        phone: form.phone,
      };
    },
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.title || row.name,
      description: row.notes || row.description,
      status: row.stage || row.status,
      statusVariant: statusVariant(row.stage || row.status),
      owner: row.owner_name || row.owner || '—',
      owner_id: row.assigned_to,
      amount: row.value ?? row.amount,
      company: row.company_name || row.company,
      email: row.email || '',
      phone: row.phone || '',
      dueDate: row.close_date || row.expected_close_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  leads: {
    key: 'leads',
    listPath: '/crm/contacts',
    listParams: { type: 'lead' },
    itemPath: (id) => `/crm/contacts/${id}`,
    createPath: '/crm/contacts',
    listFilter: (row) => String(row.type || '').toLowerCase() === 'lead',
    toCreateBody: (form) => {
      const first = form.first_name || String(form.title || 'New').trim().split(/\s+/)[0];
      const last =
        form.last_name ||
        String(form.title || 'Lead')
          .trim()
          .split(/\s+/)
          .slice(1)
          .join(' ') ||
        'Lead';
      return {
        first_name: first,
        last_name: last,
        email: form.email,
        phone: form.phone,
        company_name: form.company || form.company_name,
        type: 'lead',
        status: 'qualified',
        notes: form.description,
      };
    },
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Lead',
      description: row.notes,
      status: row.status || 'lead',
      statusVariant: statusVariant(row.status),
      owner: row.owner_name || '—',
      company: row.company_name,
      email: row.email || '',
      phone: row.phone || '',
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  invoices: {
    key: 'invoices',
    listPath: '/finance/invoices',
    itemPath: (id) => `/finance/invoices/${id}`,
    createPath: '/finance/invoices',
    toCreateBody: (form) => {
      const amount = form.amount ? Number(form.amount) : 0;
      const clientName = form.client_name || form.company || form.title || 'Client';
      return {
        client_name: clientName,
        amount,
        total: amount,
        status: (form.status || 'draft').toString().toLowerCase().replace(/\s+/g, '_'),
        due_date: form.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        issued_date: new Date().toISOString().slice(0, 10),
        description: form.description,
        notes: form.description,
        items: [
          {
            description: form.description || clientName || 'Service',
            quantity: 1,
            unit_price: amount,
            total: amount,
          },
        ],
      };
    },
    toUi: (row) => ({
      id: row.id,
      title: row.invoice_number || row.client_name || `Invoice ${row.id?.slice(0, 8)}`,
      description: row.description || row.notes,
      status: row.status,
      statusVariant: statusVariant(row.status),
      owner: row.client_name || '—',
      company: row.client_name,
      client_name: row.client_name,
      amount: row.amount ?? row.total ?? 0,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      ...row,
    }),
  },
  expenses: {
    key: 'expenses',
    listPath: '/finance/expenses',
    itemPath: (id) => `/finance/expenses/${id}`,
    createPath: '/finance/expenses',
    toCreateBody: (form) => ({
      description: form.description || form.title,
      amount: form.amount ? Number(form.amount) : 0,
      category: form.category || 'General',
      date: form.date || form.expense_date || new Date().toISOString().slice(0, 10),
      status: form.status || 'pending',
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.description || row.category || 'Expense',
      description: row.description,
      status: row.status,
      statusVariant: statusVariant(row.status),
      owner: row.submitted_by_name || '—',
      category: row.category || 'General',
      amount: row.amount,
      expense_date: row.date || row.expense_date,
      dueDate: row.date || row.expense_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  budgets: {
    key: 'budgets',
    listPath: '/finance/budgets',
    itemPath: (id) => `/finance/budgets/${id}`,
    createPath: '/finance/budgets',
    toCreateBody: (form) => ({
      name: form.title || form.name,
      category: form.category || 'Operations',
      allocated: form.amount ? Number(form.amount) : 0,
      period_start: form.period_start || `${new Date().getFullYear()}-01-01`,
      period_end: form.period_end || `${new Date().getFullYear()}-12-31`,
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.name || row.title,
      description: row.description,
      status: row.status || 'active',
      statusVariant: statusVariant(row.status || 'active'),
      owner: row.owner || '—',
      category: row.category || '—',
      amount: row.allocated ?? row.amount,
      period_start: row.period_start,
      period_end: row.period_end,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  meetings: {
    key: 'meetings',
    listPath: '/meetings',
    itemPath: (id) => `/meetings/${id}`,
    createPath: '/meetings',
    toCreateBody: (form) => {
      const day = form.date || (form.dueDate || '').toString().slice(0, 10) || new Date().toISOString().slice(0, 10);
      return {
        title: form.title,
        description: form.agenda || form.description,
        date: day,
        start_time: form.start_time || '09:00',
        end_time: form.end_time || '10:00',
        location: form.location,
        meeting_link: form.meeting_link,
        type: form.type || 'sync',
        agenda: form.agenda || form.description,
        participant_ids: form.participant_ids,
      };
    },
    toUi: (row) => {
      const date =
        row.date ||
        (row.scheduled_at ? String(row.scheduled_at).slice(0, 10) : undefined);
      return {
        ...row,
        id: row.id,
        title: row.title,
        description: row.description || row.agenda,
        status: row.status || 'scheduled',
        statusVariant: statusVariant(row.status || 'scheduled'),
        owner: row.organizer_name || row.owner || '—',
        date,
        start_time: row.start_time,
        end_time: row.end_time,
        location: row.location || row.meeting_link || '—',
        type: row.type || 'sync',
        meeting_link: row.meeting_link,
        dueDate: row.scheduled_at || date,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      };
    },
  },
  goals: {
    key: 'goals',
    listPath: '/goals',
    itemPath: (id) => `/goals/${id}`,
    createPath: '/goals',
    toCreateBody: (form) => ({
      title: form.title,
      description: form.description || '',
      type: form.type || 'company',
      owner_id: form.owner_id || form.owner,
      due_date: form.dueDate || form.target_date || undefined,
      quarter: form.quarter,
      key_results: form.key_results,
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.title || row.name,
      description: row.description,
      status: row.status,
      statusVariant: statusVariant(row.status),
      owner: row.owner_name || row.owner || '—',
      owner_id: row.owner_id,
      type: row.type || 'company',
      quarter: row.quarter,
      progress: row.progress,
      dueDate: row.due_date || row.target_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  documents: {
    key: 'documents',
    listPath: '/documents',
    itemPath: (id) => `/documents/${id}`,
    createPath: '/documents',
    toCreateBody: (form) => ({
      title: form.title,
      content: form.description || form.content || form.title || '',
      type: form.type || 'document',
      folder: form.folder,
      tags: form.tags,
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.title || row.name,
      description: row.description || '',
      status: row.status || (row.is_archived ? 'archived' : 'active'),
      statusVariant: statusVariant(row.status || (row.is_archived ? 'archived' : 'active')),
      owner:
        row.owner ||
        row.created_by_name ||
        row.owner_name ||
        [row.created_by_first_name, row.created_by_last_name].filter(Boolean).join(' ').trim() ||
        '—',
      type: row.type || 'document',
      file_url: row.file_url,
      file_mime: row.file_mime || row.file_type,
      file_type: row.file_type || row.file_mime,
      file_size: row.file_size,
      storage_path: row.storage_path,
      can_view: row.can_view,
      content: row.content,
      folder: row.folder,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  announcements: {
    key: 'announcements',
    listPath: '/announcements',
    itemPath: (id) => `/announcements/${id}`,
    createPath: '/announcements',
    toCreateBody: (form) => ({
      title: form.title,
      content: form.description || form.title,
      status: form.status || 'published',
    }),
    toUi: (row) => ({
      id: row.id,
      title: row.title,
      description: row.content || row.description,
      status: row.status || (row.is_pinned ? 'pinned' : 'published'),
      statusVariant: statusVariant(row.status || 'published'),
      owner: row.author_name || '—',
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      ...row,
    }),
  },
  features: {
    key: 'features',
    listPath: '/product/features',
    itemPath: (id) => `/product/features/${id}`,
    createPath: '/product/features',
    toCreateBody: (form) => ({
      title: form.title,
      description: form.description,
      status: form.status || 'backlog',
      priority: form.priority || 'medium',
    }),
    toUi: (row) => ({
      id: row.id,
      title: row.title || row.name,
      description: row.description,
      status: row.status,
      statusVariant: statusVariant(row.status),
      priority: row.priority,
      owner: row.owner_name || '—',
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      ...row,
    }),
  },
  bugs: {
    key: 'bugs',
    listPath: '/product/bugs',
    itemPath: (id) => `/product/bugs/${id}`,
    createPath: '/product/bugs',
    toCreateBody: (form) => ({
      title: form.title,
      description: form.description || form.steps_to_reproduce || form.title,
      status: form.status || 'open',
      severity: form.severity || form.priority || 'medium',
      priority: form.priority || form.severity || 'medium',
      project_id: form.project_id || undefined,
      assignee_id: form.assignee_id || form.owner || undefined,
      steps_to_reproduce: form.steps_to_reproduce || undefined,
      expected_behavior: form.expected_behavior || undefined,
      actual_behavior: form.actual_behavior || undefined,
      environment: form.environment || undefined,
    }),
    toUi: (row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      statusVariant: statusVariant(row.status),
      priority: row.severity || row.priority,
      severity: row.severity || row.priority,
      owner: row.assignee_name || '—',
      project: row.project_name || '—',
      project_id: row.project_id,
      assignee_id: row.assignee_id,
      steps_to_reproduce: row.steps_to_reproduce,
      expected_behavior: row.expected_behavior,
      actual_behavior: row.actual_behavior,
      environment: row.environment,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      ...row,
    }),
  },
  releases: {
    key: 'releases',
    listPath: '/product/releases',
    itemPath: (id) => `/product/releases/${id}`,
    createPath: '/product/releases',
    toCreateBody: (form) => ({
      name: form.title || form.name,
      description: form.description,
      status: form.status || 'planned',
      release_date: form.dueDate,
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.name || row.title || row.version,
      description: row.description,
      status: row.status,
      statusVariant: statusVariant(row.status),
      owner: row.owner_name || '—',
      version: row.version || '—',
      dueDate: row.release_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  reports: {
    key: 'reports',
    listPath: '/reports',
    itemPath: (id) => `/reports/saved/${id}`,
    createPath: '/reports',
    toCreateBody: (form) => ({
      title: form.title,
      description: form.description,
      type: 'custom',
      status: form.status || 'draft',
    }),
    toUi: (row) => ({
      id: row.id,
      title: row.title || row.name,
      description: row.description,
      status: row.status || 'ready',
      statusVariant: statusVariant(row.status || 'ready'),
      owner: row.owner_name || '—',
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      ...row,
    }),
  },
  sprints: {
    key: 'sprints',
    listPath: '/sprints',
    itemPath: (id) => `/sprints/${id}`,
    createPath: '/sprints',
    toCreateBody: (form) => ({
      name: form.title || form.name,
      goal: form.description || form.goal,
      status: (() => {
        const s = String(form.status || 'planned').toLowerCase();
        if (s === 'active') return 'active';
        if (s === 'completed' || s === 'done') return 'completed';
        return 'planned';
      })(),
      project_id: form.project_id,
      start_date: form.start_date || form.startDate || new Date().toISOString().slice(0, 10),
      end_date: form.end_date || form.dueDate || form.endDate,
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.name || row.title,
      description: row.goal || row.description,
      status: row.status,
      statusVariant: statusVariant(row.status),
      owner: row.owner || '—',
      project_id: row.project_id,
      startDate: row.start_date || row.startDate,
      dueDate: row.end_date || row.dueDate,
      start_date: row.start_date,
      end_date: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  employees: {
    key: 'employees',
    listPath: '/hr/employees',
    itemPath: (id) => `/hr/employees/${id}`,
    createPath: '/users',
    toCreateBody: (form) => {
      const parts = String(form.title || form.owner || 'New User').trim().split(/\s+/);
      return {
        firstName: parts[0] || 'New',
        lastName: parts.slice(1).join(' ') || 'User',
        email: form.email || `${(parts[0] || 'user').toLowerCase()}@techos.io`,
        role: 'software_engineer',
      };
    },
    toUi: (row) => ({
      id: row.id,
      title: `${row.user?.first_name || row.first_name || ''} ${row.user?.last_name || row.last_name || ''}`.trim() || row.position,
      name: `${row.user?.first_name || ''} ${row.user?.last_name || ''}`.trim(),
      description: row.position,
      status: row.status,
      statusVariant: statusVariant(row.status),
      owner: (row.user?.role || row.role || '—').toString().replace(/_/g, ' '),
      role: row.user?.role || row.role,
      dueDate: row.hire_date || row.start_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      ...row,
    }),
  },
  leaveRequests: {
    key: 'leaveRequests',
    listPath: '/hr/leaves',
    itemPath: (id) => `/hr/leaves/${id}`,
    createPath: '/hr/leaves',
    toCreateBody: (form) => ({
      type: form.leave_type || form.type || 'vacation',
      start_date: form.start_date || new Date().toISOString().slice(0, 10),
      end_date: form.end_date || form.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      reason: form.reason || form.description || form.title || 'Leave request',
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: `${row.type || 'Leave'} — ${row.status}`,
      description: row.reason,
      status: row.status,
      statusVariant: statusVariant(row.status),
      owner: row.employee_name || '—',
      type: row.type,
      start_date: row.start_date,
      end_date: row.end_date,
      dueDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }),
  },
  codeReviews: {
    key: 'codeReviews',
    listPath: '/code-reviews',
    itemPath: (id) => `/code-reviews/${id}`,
    createPath: '/code-reviews',
    toCreateBody: (form) => ({
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      project_id: form.project_id || undefined,
      reviewer_id: form.reviewer_id || form.owner_id || undefined,
      repository: form.repository,
      branch: form.branch,
      base_branch: form.base_branch || 'main',
      pr_url: form.pr_url,
      files: Array.isArray(form.files) ? form.files : undefined,
    }),
    toUi: (row) => {
      const files = Array.isArray(row.files) ? row.files : [];
      return {
        ...row,
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status || 'open',
        statusVariant: statusVariant(row.status || 'open'),
        priority: row.priority || 'medium',
        owner: row.author_name || row.owner || '—',
        author_id: row.author_id,
        author_name: row.author_name,
        reviewer_id: row.reviewer_id,
        reviewer_name: row.reviewer_name,
        project_id: row.project_id,
        project_name: row.project_name,
        repository: row.repository,
        branch: row.branch,
        base_branch: row.base_branch || 'main',
        pr_url: row.pr_url,
        files,
        additions: row.additions ?? files.reduce((s: number, f: any) => s + (f.additions || 0), 0),
        deletions: row.deletions ?? files.reduce((s: number, f: any) => s + (f.deletions || 0), 0),
        file_count: row.file_count ?? files.length,
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
      };
    },
  },
};

/** Entity keys that map to dedicated APIs */
export const ENTITY_API: Record<string, EntityApiConfig> = {
  ...native,
  // CRM aliases
  customers: native.contacts,
  opportunities: native.deals,
  // Finance: payments = paid invoices (not a separate workspace bag)
  payments: {
    ...native.invoices,
    key: 'payments',
    listParams: { status: 'paid' },
    listFilter: (row) => String(row.status || '').toLowerCase() === 'paid',
    toCreateBody: (form) => ({
      ...native.invoices.toCreateBody(form),
      status: 'paid',
    }),
    toUi: (row) => ({
      ...native.invoices.toUi(row),
      title: row.invoice_number
        ? `Payment · ${row.invoice_number}`
        : row.client_name || `Payment ${String(row.id || '').slice(0, 8)}`,
    }),
  },
  subscriptions: workspaceConfig('subscriptions'),
  quotations: workspaceConfig('quotations'),
  teams: workspaceConfig('teams'),
  integrations: {
    key: 'integrations',
    listPath: '/integrations',
    itemPath: (id) => `/integrations/${id}`,
    createPath: '/integrations',
    toCreateBody: (form) => ({
      name: form.title || form.name || form.type || 'Integration',
      type: form.type || 'slack',
      enabled: form.status !== 'disconnected' && form.enabled !== false,
      config: form.config || {
        notes: form.description || '',
      },
    }),
    toUi: (row) => ({
      ...row,
      id: row.id,
      title: row.name || row.type || 'Integration',
      description: row.config?.notes || row.type,
      status: row.enabled ? 'connected' : 'disconnected',
      statusVariant: row.enabled ? 'success' : 'default',
      owner: row.type || '—',
      type: row.type,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt || row.created_at,
    }),
  },
  campaigns: {
    key: 'campaigns',
    listPath: '/workspace/campaigns',
    itemPath: (id) => `/workspace/campaigns/${id}`,
    createPath: '/workspace/campaigns',
    toCreateBody: (form) => {
      const budget = form.budget != null && form.budget !== '' ? Number(form.budget) : form.amount ? Number(form.amount) : undefined;
      const spent = form.spent != null && form.spent !== '' ? Number(form.spent) : undefined;
      const impressions = form.impressions != null && form.impressions !== '' ? Number(form.impressions) : undefined;
      const clicks = form.clicks != null && form.clicks !== '' ? Number(form.clicks) : undefined;
      const leads = form.leads != null && form.leads !== '' ? Number(form.leads) : undefined;
      const conversions = form.conversions != null && form.conversions !== '' ? Number(form.conversions) : undefined;
      const goal_target =
        form.goal_target != null && form.goal_target !== '' ? Number(form.goal_target) : undefined;
      return {
        title: form.title || form.name,
        description: form.description || form.brief,
        status: form.status || 'draft',
        owner: form.owner_id || form.owner,
        amount: budget,
        due_date: form.end_date || form.dueDate || form.due_date,
        metadata: {
          channel: form.channel || 'multi',
          objective: form.objective || 'lead_generation',
          audience: form.audience || '',
          utm_campaign: form.utm_campaign || '',
          start_date: form.start_date || '',
          end_date: form.end_date || form.dueDate || '',
          budget,
          spent: spent ?? 0,
          goal_metric: form.goal_metric || 'leads',
          goal_target: goal_target ?? 0,
          impressions: impressions ?? 0,
          clicks: clicks ?? 0,
          leads: leads ?? 0,
          conversions: conversions ?? 0,
          owner_name: form.owner_name || undefined,
        },
      };
    },
    toUi: (row) => {
      const meta = row.metadata || {};
      const impressions = Number(meta.impressions || 0);
      const clicks = Number(meta.clicks || 0);
      const budget = Number(row.amount ?? meta.budget ?? 0);
      const spent = Number(meta.spent || 0);
      const goal_target = Number(meta.goal_target || 0);
      const leads = Number(meta.leads || 0);
      const conversions = Number(meta.conversions || 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const progress =
        goal_target > 0
          ? Math.min(100, Math.round(((meta.goal_metric === 'conversions' ? conversions : leads) / goal_target) * 100))
          : undefined;
      return {
        ...row,
        ...meta,
        id: row.id,
        title: row.title || row.name,
        name: row.title || row.name,
        description: row.description,
        status: row.status || meta.status || 'draft',
        statusVariant: statusVariant(row.status || meta.status),
        owner: meta.owner_name || row.owner_name || row.owner || '—',
        owner_id: row.owner,
        amount: budget,
        budget,
        spent,
        channel: meta.channel || 'multi',
        objective: meta.objective || 'lead_generation',
        audience: meta.audience || '',
        utm_campaign: meta.utm_campaign || '',
        start_date: meta.start_date || '',
        end_date: meta.end_date || row.due_date || row.dueDate || '',
        dueDate: meta.end_date || row.due_date || row.dueDate,
        goal_metric: meta.goal_metric || 'leads',
        goal_target,
        impressions,
        clicks,
        leads,
        conversions,
        ctr,
        progress,
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
      };
    },
  },
  processes: {
    key: 'processes',
    listPath: '/workspace/processes',
    itemPath: (id) => `/workspace/processes/${id}`,
    createPath: '/workspace/processes',
    toCreateBody: (form) => {
      const steps_total =
        form.steps_total != null && form.steps_total !== '' ? Number(form.steps_total) : undefined;
      const steps_done =
        form.steps_done != null && form.steps_done !== '' ? Number(form.steps_done) : undefined;
      return {
        title: form.title || form.name,
        description: form.description || form.sop_summary,
        status: form.status || 'draft',
        priority: form.priority || 'medium',
        owner: form.owner_id || form.owner,
        due_date: form.next_review_date || form.dueDate || form.due_date,
        metadata: {
          category: form.category || 'general',
          process_type: form.process_type || 'sop',
          frequency: form.frequency || 'as_needed',
          department: form.department || '',
          systems: form.systems || '',
          sla_hours:
            form.sla_hours != null && form.sla_hours !== '' ? Number(form.sla_hours) : undefined,
          steps_total: steps_total ?? 0,
          steps_done: steps_done ?? 0,
          next_review_date: form.next_review_date || form.dueDate || '',
          last_run_date: form.last_run_date || '',
          risk_level: form.risk_level || 'low',
          compliance_required: Boolean(form.compliance_required),
          owner_name: form.owner_name || undefined,
        },
      };
    },
    toUi: (row) => {
      const meta = row.metadata || {};
      const steps_total = Number(meta.steps_total || 0);
      const steps_done = Number(meta.steps_done || 0);
      const progress =
        steps_total > 0 ? Math.min(100, Math.round((steps_done / steps_total) * 100)) : undefined;
      return {
        ...row,
        ...meta,
        id: row.id,
        title: row.title || row.name,
        name: row.title || row.name,
        description: row.description,
        status: row.status || 'draft',
        statusVariant: statusVariant(row.status),
        priority: row.priority || meta.priority || 'medium',
        owner: meta.owner_name || row.owner_name || row.owner || '—',
        owner_id: row.owner,
        category: meta.category || 'general',
        process_type: meta.process_type || 'sop',
        frequency: meta.frequency || 'as_needed',
        department: meta.department || '',
        systems: meta.systems || '',
        sla_hours: meta.sla_hours,
        steps_total,
        steps_done,
        progress,
        next_review_date: meta.next_review_date || row.due_date || row.dueDate || '',
        last_run_date: meta.last_run_date || '',
        dueDate: meta.next_review_date || row.due_date || row.dueDate,
        risk_level: meta.risk_level || 'low',
        compliance_required: Boolean(meta.compliance_required),
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
      };
    },
  },
  candidates: workspaceConfig('candidates'),
  jobs: workspaceConfig('jobs'),
  payroll: workspaceConfig('payroll'),
  benefits: workspaceConfig('benefits'),
  performanceReviews: workspaceConfig('performanceReviews'),
  onboardingTasks: workspaceConfig('onboardingTasks'),
  tickets: workspaceConfig('tickets'),
  // Design / research
  prototypes: workspaceConfig('prototypes'),
  research: workspaceConfig('research'),
  architecture: workspaceConfig('architecture'),
  deployments: workspaceConfig('deployments'),
  commits: workspaceConfig('commits'),
  notifications: workspaceConfig('notifications'),
};

export function getEntityApi(entityKey: string): EntityApiConfig {
  return ENTITY_API[entityKey] || workspaceConfig(entityKey);
}
