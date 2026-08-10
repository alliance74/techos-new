'use client';

import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import type { Column } from '@/components/UI/DataTable';
import type { MockRecord } from '@/mocks';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

function titleColumn(header = 'Name'): Column<MockRecord> {
  return {
    key: 'title',
    header,
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-ink group-hover/row:text-brand transition-colors">
          {row.title || row.name}
        </p>
        {row.company ? <p className="text-xs text-ink-muted">{row.company}</p> : null}
      </div>
    ),
  };
}

function statusColumn(header = 'Status'): Column<MockRecord> {
  return {
    key: 'status',
    header,
    sortable: true,
    render: (row) => <Badge variant={row.statusVariant}>{row.status}</Badge>,
  };
}

function personColumn(key: string, header: string): Column<MockRecord> {
  return {
    key,
    header,
    sortable: true,
    render: (row) => {
      const name = String((row as any)[key] || row.owner || '—');
      return (
        <div className="flex items-center gap-2">
          <Avatar size="sm" name={name} />
          <span>{name}</span>
        </div>
      );
    },
  };
}

function textColumn(key: string, header: string): Column<MockRecord> {
  return {
    key,
    header,
    sortable: true,
    render: (row) => <span>{String((row as any)[key] || '—')}</span>,
  };
}

function moneyColumn(key: string, header: string): Column<MockRecord> {
  return {
    key,
    header,
    sortable: true,
    render: (row) => {
      const value = (row as any)[key] ?? row.amount;
      return typeof value === 'number' ? (
        <span className="tabular-nums">{formatCurrency(value)}</span>
      ) : (
        <span className="text-ink-muted">—</span>
      );
    },
  };
}

function dateColumn(key: string, header: string): Column<MockRecord> {
  return {
    key,
    header,
    sortable: true,
    render: (row) => {
      const value = (row as any)[key] || (key === 'dueDate' ? row.dueDate : undefined);
      return (
        <span className="text-ink-muted">{value ? formatDate(String(value)) : '—'}</span>
      );
    },
  };
}

function priorityColumn(header = 'Priority'): Column<MockRecord> {
  return {
    key: 'priority',
    header,
    sortable: true,
    render: (row) =>
      row.priority ? (
        <Badge
          variant={
            row.priority === 'critical' || row.priority === 'high'
              ? 'error'
              : row.priority === 'medium'
                ? 'warning'
                : 'default'
          }
          size="sm"
        >
          {row.priority}
        </Badge>
      ) : (
        <span className="text-ink-muted">—</span>
      ),
  };
}

function progressColumn(): Column<MockRecord> {
  return {
    key: 'progress',
    header: 'Progress',
    sortable: true,
    render: (row) => {
      const value = typeof row.progress === 'number' ? row.progress : 0;
      return (
        <div className="min-w-[88px]">
          <div className="mb-1 flex justify-between text-xs text-ink-muted">
            <span className="tabular-nums text-ink">{value}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
          </div>
        </div>
      );
    },
  };
}

function actionsColumn(): Column<MockRecord> {
  return {
    key: '_actions',
    header: '',
    className: 'w-28 text-right',
    render: () => (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand opacity-80 group-hover/row:opacity-100">
        View
        <ChevronRight className="h-4 w-4" />
      </span>
    ),
  };
}

function meetingWhen(row: MockRecord) {
  const date = (row as any).date || (row.dueDate ? String(row.dueDate).slice(0, 10) : '');
  const start = (row as any).start_time;
  const end = (row as any).end_time;
  if (!date && !start) return '—';
  const day = date ? formatDate(date) : '';
  if (start && end) return `${day} · ${start}–${end}`;
  if (start) return `${day} · ${start}`;
  return day || '—';
}

/** Column sets aligned with each entity's create form / domain model. */
export function getEntityListColumns(entityKey: string): Column<MockRecord>[] {
  switch (entityKey) {
    case 'meetings':
      return [
        titleColumn('Meeting'),
        {
          key: 'when',
          header: 'When',
          sortable: true,
          render: (row) => <span className="text-sm text-ink">{meetingWhen(row)}</span>,
        },
        textColumn('location', 'Location'),
        textColumn('type', 'Type'),
        statusColumn(),
        personColumn('owner', 'Organizer'),
        actionsColumn(),
      ];

    case 'projects':
      return [
        titleColumn('Product'),
        textColumn('client_name', 'Client'),
        statusColumn(),
        {
          key: 'visibility',
          header: 'Visible to',
          sortable: false,
          render: (row) => (
            <span className="text-sm text-ink-muted">
              {row.visibility ||
                (Array.isArray(row.visible_to_roles) && row.visible_to_roles.length
                  ? row.visible_to_roles.join(', ')
                  : 'All roles')}
            </span>
          ),
        },
        {
          key: 'timeline',
          header: 'Timeline',
          sortable: true,
          render: (row) => {
            const end = row.end_date || row.dueDate;
            return (
              <span className="text-sm text-ink-muted">
                {row.start_date ? formatDate(row.start_date) : '—'}
                {' → '}
                {end ? formatDate(end) : '—'}
              </span>
            );
          },
        },
        progressColumn(),
        moneyColumn('amount', 'Budget'),
        actionsColumn(),
      ];

    case 'tasks':
      return [
        titleColumn('Task'),
        statusColumn(),
        priorityColumn(),
        personColumn('owner', 'Assignee'),
        dateColumn('dueDate', 'Due'),
        actionsColumn(),
      ];

    case 'invoices':
      return [
        {
          key: 'title',
          header: 'Invoice',
          sortable: true,
          render: (row) => (
            <div>
              <p className="font-medium text-ink group-hover/row:text-brand transition-colors">
                {row.title || row.name}
              </p>
              <p className="text-xs text-ink-muted">{row.client_name || row.company || '—'}</p>
            </div>
          ),
        },
        moneyColumn('amount', 'Amount'),
        dateColumn('dueDate', 'Due date'),
        statusColumn(),
        actionsColumn(),
      ];

    case 'expenses':
      return [
        titleColumn('Expense'),
        textColumn('category', 'Category'),
        moneyColumn('amount', 'Amount'),
        dateColumn('expense_date', 'Date'),
        statusColumn(),
        actionsColumn(),
      ];

    case 'budgets':
      return [
        titleColumn('Budget'),
        textColumn('category', 'Category'),
        moneyColumn('amount', 'Allocated'),
        {
          key: 'period',
          header: 'Period',
          sortable: true,
          render: (row) => {
            const start = (row as any).period_start;
            const end = (row as any).period_end;
            if (!start && !end) return <span className="text-ink-muted">—</span>;
            return (
              <span className="text-sm text-ink-muted">
                {start ? formatDate(start) : '—'} → {end ? formatDate(end) : '—'}
              </span>
            );
          },
        },
        statusColumn(),
        actionsColumn(),
      ];

    case 'deals':
    case 'opportunities':
      return [
        titleColumn('Deal'),
        moneyColumn('amount', 'Value'),
        statusColumn('Stage'),
        personColumn('owner', 'Owner'),
        dateColumn('dueDate', 'Expected close'),
        actionsColumn(),
      ];

    case 'campaigns':
      return [
        {
          key: 'title',
          header: 'Campaign',
          sortable: true,
          render: (row) => (
            <div>
              <p className="font-medium text-ink group-hover/row:text-brand transition-colors">
                {row.title || row.name}
              </p>
              <p className="text-xs text-ink-muted capitalize">
                {String((row as any).objective || '').replace(/_/g, ' ') || 'Campaign'}
              </p>
            </div>
          ),
        },
        {
          key: 'channel',
          header: 'Channel',
          sortable: true,
          render: (row) => (
            <span className="capitalize text-sm">
              {String((row as any).channel || '—').replace(/_/g, ' ')}
            </span>
          ),
        },
        statusColumn(),
        moneyColumn('budget', 'Budget'),
        {
          key: 'schedule',
          header: 'Schedule',
          sortable: false,
          render: (row) => {
            const start = (row as any).start_date;
            const end = (row as any).end_date || row.dueDate;
            if (!start && !end) return <span className="text-ink-muted">—</span>;
            return (
              <span className="text-sm text-ink-muted">
                {start ? formatDate(start) : '—'} → {end ? formatDate(end) : '—'}
              </span>
            );
          },
        },
        personColumn('owner', 'Owner'),
        actionsColumn(),
      ];

    case 'processes':
      return [
        {
          key: 'title',
          header: 'Process',
          sortable: true,
          render: (row) => (
            <div>
              <p className="font-medium text-ink group-hover/row:text-brand transition-colors">
                {row.title || row.name}
              </p>
              <p className="text-xs text-ink-muted capitalize">
                {String((row as any).category || '').replace(/_/g, ' ') || 'Operations'}
              </p>
            </div>
          ),
        },
        {
          key: 'process_type',
          header: 'Type',
          sortable: true,
          render: (row) => (
            <span className="capitalize text-sm">
              {String((row as any).process_type || 'sop').replace(/_/g, ' ')}
            </span>
          ),
        },
        {
          key: 'priority',
          header: 'Priority',
          sortable: true,
          render: (row) => (
            <Badge
              variant={
                String(row.priority).toLowerCase() === 'critical' ||
                String(row.priority).toLowerCase() === 'high'
                  ? 'error'
                  : String(row.priority).toLowerCase() === 'medium'
                    ? 'warning'
                    : 'default'
              }
            >
              {String(row.priority || 'medium')}
            </Badge>
          ),
        },
        statusColumn(),
        personColumn('owner', 'Owner'),
        dateColumn('dueDate', 'Next review'),
        actionsColumn(),
      ];

    case 'contacts':
    case 'leads':
      return [
        titleColumn(entityKey === 'leads' ? 'Lead' : 'Contact'),
        textColumn('email', 'Email'),
        textColumn('phone', 'Phone'),
        textColumn('company', 'Company'),
        statusColumn(),
        actionsColumn(),
      ];

    case 'goals':
      return [
        titleColumn('Objective'),
        textColumn('type', 'Level'),
        personColumn('owner', 'Owner'),
        progressColumn(),
        dateColumn('dueDate', 'Due'),
        statusColumn(),
        actionsColumn(),
      ];

    case 'documents':
      return [
        titleColumn('Document'),
        textColumn('type', 'Type'),
        statusColumn(),
        personColumn('owner', 'Owner'),
        dateColumn('updatedAt', 'Updated'),
        actionsColumn(),
      ];

    case 'announcements':
      return [
        titleColumn('Headline'),
        {
          key: 'description',
          header: 'Preview',
          render: (row) => (
            <span className="line-clamp-1 max-w-xs text-sm text-ink-muted">
              {row.description || '—'}
            </span>
          ),
        },
        statusColumn('Visibility'),
        personColumn('owner', 'Author'),
        dateColumn('createdAt', 'Posted'),
        actionsColumn(),
      ];

    case 'features':
      return [
        titleColumn('Feature'),
        statusColumn(),
        priorityColumn(),
        personColumn('owner', 'Owner'),
        dateColumn('updatedAt', 'Updated'),
        actionsColumn(),
      ];

    case 'bugs':
      return [
        titleColumn('Bug'),
        textColumn('project', 'Project'),
        statusColumn(),
        priorityColumn('Severity'),
        personColumn('owner', 'Assignee'),
        dateColumn('updatedAt', 'Updated'),
        actionsColumn(),
      ];

    case 'releases':
      return [
        titleColumn('Release'),
        textColumn('version', 'Version'),
        statusColumn(),
        dateColumn('dueDate', 'Target date'),
        actionsColumn(),
      ];

    case 'sprints':
      return [
        titleColumn('Sprint'),
        statusColumn(),
        {
          key: 'dates',
          header: 'Dates',
          render: (row) => {
            const start = (row as any).start_date;
            const end = row.end_date || row.dueDate;
            return (
              <span className="text-sm text-ink-muted">
                {start ? formatDate(start) : '—'} → {end ? formatDate(end) : '—'}
              </span>
            );
          },
        },
        {
          key: 'description',
          header: 'Goal',
          render: (row) => (
            <span className="line-clamp-1 max-w-xs text-sm text-ink-muted">
              {row.description || '—'}
            </span>
          ),
        },
        actionsColumn(),
      ];

    case 'leaveRequests':
      return [
        {
          key: 'title',
          header: 'Leave',
          sortable: true,
          render: (row) => (
            <span className="font-medium text-ink">{(row as any).type || row.title || 'Leave'}</span>
          ),
        },
        {
          key: 'dates',
          header: 'Dates',
          render: (row) => {
            const start = (row as any).start_date;
            const end = (row as any).end_date || row.dueDate;
            return (
              <span className="text-sm text-ink-muted">
                {start ? formatDate(start) : '—'} → {end ? formatDate(end) : '—'}
              </span>
            );
          },
        },
        personColumn('owner', 'Employee'),
        statusColumn(),
        {
          key: 'description',
          header: 'Reason',
          render: (row) => (
            <span className="line-clamp-1 max-w-xs text-sm text-ink-muted">
              {row.description || '—'}
            </span>
          ),
        },
        actionsColumn(),
      ];

    case 'employees':
      return [
        titleColumn('Employee'),
        textColumn('owner', 'Role'),
        statusColumn(),
        dateColumn('dueDate', 'Hire date'),
        actionsColumn(),
      ];

    default:
      return [
        titleColumn(),
        statusColumn(),
        personColumn('owner', 'Owner'),
        dateColumn('updatedAt', 'Updated'),
        actionsColumn(),
      ];
  }
}

export function getEntitySearchKeys(entityKey: string): string[] {
  const common = ['title', 'name', 'status', 'description'];
  switch (entityKey) {
    case 'meetings':
      return [...common, 'location', 'type', 'owner', 'agenda'];
    case 'projects':
      return [...common, 'client_name', 'owner'];
    case 'invoices':
      return [...common, 'client_name', 'company'];
    case 'expenses':
      return [...common, 'category'];
    case 'budgets':
      return [...common, 'category'];
    case 'contacts':
    case 'leads':
      return [...common, 'email', 'phone', 'company'];
    case 'deals':
    case 'opportunities':
      return [...common, 'company', 'owner'];
    case 'campaigns':
      return [...common, 'channel', 'objective', 'audience', 'utm_campaign', 'owner'];
    case 'processes':
      return [...common, 'category', 'process_type', 'department', 'systems', 'owner', 'priority'];
    default:
      return [...common, 'owner', 'client_name', 'company'];
  }
}
