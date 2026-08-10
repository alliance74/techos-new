'use client';

import { useMemo, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  resolveEntityKey,
  resolvePageKind,
  type MockRecord,
  type MockUserRole,
} from '@/mocks';
import {
  useDeleteEntity,
  useEntityActivity,
  useEntityList,
} from '@/hooks/useEntityApi';
import { useDashboard } from '@/hooks/useDashboard';
import { useSendChatMessage, useGenerateReport as useGenerateAiReport, useAnalyzeRisk, useSuggestPriorities } from '@/hooks/useAI';
import { useUpdateMyProfile, useUpdateMyPassword } from '@/hooks/useUsers';
import { useOrganization, useUpdateOrganization } from '@/hooks/useOrganizations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { buildBreadcrumbs, humanize, titleFromPath } from '@/lib/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/roles';
import { canCreateEntity } from '@/lib/access';
import { PageHeader } from '@/components/UI/PageHeader';
import { DataTable, type Column } from '@/components/UI/DataTable';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Progress } from '@/components/UI/Progress';
import { StatCard } from '@/components/UI/StatCard';
import { SimpleAreaChart, SimpleBarChart } from '@/components/UI/Charts';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { TextArea } from '@/components/UI/TextArea';
import { EmptyState } from '@/components/UI/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/UI/Skeleton';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import { Avatar } from '@/components/UI/Avatar';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { Modal } from '@/components/UI/Modal';
import { CreateEntityForm, createEntityLabel } from '@/components/forms/CreateEntityForm';
import { getEntityListColumns, getEntitySearchKeys } from '@/lib/entityListColumns';
import { CalendarBoard } from '@/components/boards/CalendarBoard';
import { BoardWorkspace } from '@/components/boards/BoardWorkspace';
import { MessagesWorkspace } from '@/components/messages/MessagesWorkspace';
import { TeamsWorkspace } from '@/components/teams/TeamsWorkspace';
import { AnalyticsHub } from '@/components/analytics/AnalyticsHub';
import { ReportsHub } from '@/components/reports/ReportsHub';
import { EntityDetailView } from '@/components/pages/EntityDetailView';
import {
  Plus,
  Download,
  Trash2,
  Bot,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

/** Build a detail URL for a list row under the current pathname. */
function detailPathForRow(pathname: string, rowId: string): string {
  const base = pathname.replace(/\/$/, '');
  return `${base}/${rowId}`;
}

function roleKeyFromPath(pathname: string): MockUserRole {
  const root = pathname.split('/').filter(Boolean)[0];
  const map: Record<string, MockUserRole> = {
    ceo: 'ceo',
    cto: 'cto',
    ciso: 'ciso',
    finance: 'finance',
    'software-engineer': 'software_engineer',
    'ui-ux-designer': 'ui_ux_designer',
    'customer-support': 'customer_support',
  };
  return map[root] || 'ceo';
}

function basePathFromPathname(pathname: string): string {
  const root = pathname.split('/').filter(Boolean)[0] || 'ceo';
  return `/${root}`;
}

function entityLabel(key: string): string {
  return humanize(key.replace(/([A-Z])/g, '-$1').toLowerCase());
}

export function ModuleWorkspace() {
  const pathname = usePathname() || '/';
  const params = useParams();
  const kind = resolvePageKind(pathname);
  const paramId =
    typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const pathTail = pathname.split('/').filter(Boolean).pop();
  const detailId = paramId || (kind === 'detail' ? pathTail : undefined);
  const entityKey = resolveEntityKey(pathname);
  const basePath = basePathFromPathname(pathname);
  const roleKey = roleKeyFromPath(pathname);
  const title = titleFromPath(pathname);
  const breadcrumbs = buildBreadcrumbs(pathname, basePath, entityLabel(roleKey));

  if (kind === 'dashboard') {
    return <DashboardView basePath={basePath} />;
  }
  if (kind === 'messages') {
    return <MessagesWorkspace breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'calendar') {
    return <CalendarBoard breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'tasks' || kind === 'sprints') {
    return <BoardWorkspace title="Board" breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'teams') {
    return <TeamsWorkspace breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'ai') {
    return <AiView breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'settings') {
    return <SettingsView breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'analytics') {
    return <AnalyticsHub title={title} breadcrumbs={breadcrumbs} pathname={pathname} />;
  }
  if (kind === 'reports') {
    return <ReportsHub title={title} breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'create' || kind === 'form') {
    return <FormView title={title} entityKey={entityKey} breadcrumbs={breadcrumbs} />;
  }
  if (kind === 'detail' || detailId) {
    return (
      <EntityDetailView
        title={title}
        entityKey={entityKey}
        detailId={detailId || ''}
        breadcrumbs={breadcrumbs}
        basePath={pathname.replace(/\/[^/]+$/, '')}
      />
    );
  }
  return (
    <ListView
      title={title}
      entityKey={entityKey}
      breadcrumbs={breadcrumbs}
      pathname={pathname}
    />
  );
}

function ListView({
  title,
  entityKey,
  breadcrumbs,
  pathname,
}: {
  title: string;
  entityKey: string;
  breadcrumbs: { label: string; href?: string }[];
  pathname: string;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canCreate = canCreateEntity(entityKey, user?.role);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<MockRecord[]>([]);
  const { data, isLoading } = useEntityList(entityKey);
  const deleteEntity = useDeleteEntity(entityKey);

  const openDetail = (row: MockRecord) => {
    router.push(detailPathForRow(pathname, row.id));
  };

  const columns: Column<MockRecord>[] = useMemo(
    () => getEntityListColumns(entityKey),
    [entityKey],
  );
  const searchKeys = useMemo(() => getEntitySearchKeys(entityKey), [entityKey]);

  const statuses = Array.from(new Set((data || []).map((r) => r.status).filter(Boolean)));

  const exportCsv = () => {
    const rows = (data || []) as MockRecord[];
    if (!rows.length) {
      toast.error('Nothing to export');
      return;
    }
    const keys = Array.from(
      new Set(
        rows.flatMap((row) =>
          Object.keys(row).filter((k) => !['statusVariant', 'metadata'].includes(k)),
        ),
      ),
    ).slice(0, 20);
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [
      keys.join(','),
      ...rows.map((row) => keys.map((k) => escape((row as any)[k])).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityKey}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} rows`);
  };

  return (
    <div className="space-y-2">
      <PageHeader
        title={title}
        description={`Browse, create, and manage ${
          entityKey === 'campaigns'
            ? 'marketing campaigns — channels, budget, schedule, and performance'
            : entityKey === 'processes'
              ? 'operational processes — SOPs, owners, SLAs, and reviews'
              : title.toLowerCase()
        }.`}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canCreate ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            ) : null}
          </>
        }
      />

      <DataTable
        columns={columns}
        data={(data || []) as MockRecord[]}
        isLoading={isLoading}
        searchKeys={searchKeys}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: statuses.map((s) => ({ value: s, label: s })),
          },
        ]}
        selectable
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        getRowId={(row) => row.id}
        emptyTitle={`No ${title.toLowerCase()} yet`}
        emptyDescription={
          canCreate
            ? 'Create your first record to get started.'
            : 'Nothing assigned to you yet.'
        }
        onRowClick={openDetail}
        bulkActions={[
          {
            label: 'Delete',
            icon: Trash2,
            variant: 'danger',
            onClick: (rows) => {
              setPendingIds(rows);
              setConfirmOpen(true);
            },
          },
        ]}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="Delete selected?"
        description={`This will permanently delete ${pendingIds.length} item(s).`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteEntity.isPending}
        onConfirm={async () => {
          await Promise.all(pendingIds.map((row) => deleteEntity.mutateAsync(row.id)));
          setConfirmOpen(false);
          setPendingIds([]);
        }}
      />

      {canCreate ? (
        <Modal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          title={`New ${createEntityLabel(entityKey)}`}
          size={
            ['bugs', 'tasks', 'meetings', 'documents', 'codeReviews', 'commits', 'sprints'].includes(
              entityKey,
            )
              ? 'xl'
              : 'lg'
          }
        >
          <CreateEntityForm entityKey={entityKey} onDone={() => setCreateOpen(false)} />
        </Modal>
      ) : null}
    </div>
  );
}

function FormView({
  title,
  entityKey,
  breadcrumbs,
}: {
  title: string;
  entityKey: string;
  breadcrumbs: { label: string; href?: string }[];
}) {
  const router = useRouter();
  const label = createEntityLabel(entityKey);

  return (
    <div>
      <PageHeader
        title={`Create ${label}`}
        description={`Add a new ${label.toLowerCase()} with the fields this record needs.`}
        breadcrumbs={breadcrumbs}
      />
      <Card className="max-w-2xl p-6">
        <CreateEntityForm entityKey={entityKey} onDone={() => router.back()} />
      </Card>
    </div>
  );
}

type DashboardStat = {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
};
type MeetingRecord = { id: string; title: string; dueDate?: string; location?: string };
type ActivityRecord = { id: string; actor_name?: string; action?: string; summary?: string; created_at?: string };
type GoalRecord = { id: string; title: string; progress?: number };

export function DashboardView({ basePath }: { basePath: string }) {
  const user = useAuthStore((s) => s.user);
  const role = String(user?.role || '').toLowerCase();

  if (
    role.includes('engineer') ||
    role.includes('developer') ||
    role === 'ui_ux_designer' ||
    role.includes('designer')
  ) {
    return <EngineerDashboardView basePath={basePath} />;
  }

  return <ExecutiveDashboardView basePath={basePath} />;
}

function EngineerDashboardView({ basePath }: { basePath: string }) {
  const user = useAuthStore((s) => s.user);
  const dashboardQuery = useDashboard();
  const apiDash = dashboardQuery.data;
  const payload = apiDash?.data || apiDash;

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || !payload) {
    return <EmptyState title="Unable to load dashboard" description="Refresh the page to try again." />;
  }

  const myTasks = (Array.isArray(payload.my_tasks) ? payload.my_tasks : []) as Array<{
    id: string;
    title?: string;
    status?: string;
    priority?: string;
    due_date?: string;
  }>;
  const myBugs = (Array.isArray(payload.my_bugs) ? payload.my_bugs : []) as Array<{
    id: string;
    title?: string;
    status?: string;
    priority?: string;
  }>;
  const meetings = (Array.isArray(payload.upcoming_meetings) ? payload.upcoming_meetings : []) as Array<{
    id: string;
    title?: string;
    scheduled_at?: string;
    location?: string;
  }>;
  const sprint = payload.active_sprint as { title?: string; name?: string; status?: string; end_date?: string } | null;

  const taskActive = Number(payload.task_counts?.active ?? myTasks.length);
  const taskInProgress = Number(payload.task_counts?.in_progress ?? 0);
  const bugsOpen = Number(payload.bug_counts?.open ?? myBugs.length);
  const projectsActive = Number(payload.projects?.active ?? 0);

  const stats = [
    { id: 'tasks', title: 'My open tasks', value: String(taskActive), change: 0, trend: 'up' as const },
    { id: 'wip', title: 'In progress', value: String(taskInProgress), change: 0, trend: 'up' as const },
    { id: 'bugs', title: 'My open bugs', value: String(bugsOpen), change: 0, trend: 'up' as const },
    { id: 'projects', title: 'Visible projects', value: String(projectsActive), change: 0, trend: 'up' as const },
  ];

  const quickActions = [
    { label: 'My tasks', href: '/tasks' },
    { label: 'My bugs', href: '/bugs' },
    { label: 'Board', href: '/tasks' },
    { label: 'Code reviews', href: '/code-reviews' },
    { label: 'Documentation', href: '/documentation' },
    { label: 'AI assistant', href: '/ai' },
  ];

  const href = (path: string) =>
    `${basePath}${path.startsWith('/') ? path : `/${path}`}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your engineering workspace — tasks, bugs, and the current sprint.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
          />
        ))}
      </div>

      {sprint ? (
        <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Active sprint</p>
            <p className="text-base font-semibold text-ink">{sprint.title || sprint.name || 'Sprint'}</p>
            <p className="text-sm text-ink-muted">
              {sprint.status || 'active'}
              {sprint.end_date ? ` · ends ${formatDate(sprint.end_date)}` : ''}
            </p>
          </div>
          <Link href={href('/tasks')}>
            <Button size="sm" variant="secondary">
              Open board
            </Button>
          </Link>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">My tasks</h3>
            <Link href={href('/tasks')} className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState title="No open tasks" description="Assigned work will show up here." />
          ) : (
            <ul className="divide-y divide-border">
              {myTasks.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.title || 'Task'}</p>
                    <p className="text-xs text-ink-muted">
                      {t.status || 'todo'}
                      {t.priority ? ` · ${t.priority}` : ''}
                      {t.due_date ? ` · due ${formatDate(t.due_date)}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-medium text-ink">Quick actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.label}
                href={href(action.href)}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-ink transition-colors hover:border-brand/40 hover:bg-bg-muted"
              >
                {action.label}
                <Sparkles className="h-4 w-4 text-ink-muted" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">My bugs</h3>
            <Link href={href('/bugs')} className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {myBugs.length === 0 ? (
            <EmptyState title="No open bugs" description="Bugs assigned to you will appear here." />
          ) : (
            <ul className="space-y-2">
              {myBugs.slice(0, 6).map((b) => (
                <li key={b.id} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-sm font-medium text-ink">{b.title || 'Bug'}</p>
                  <p className="text-xs text-ink-muted">
                    {b.status || 'open'}
                    {b.priority ? ` · ${b.priority}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-medium text-ink">Upcoming meetings</h3>
          {meetings.length === 0 ? (
            <EmptyState title="No upcoming meetings" description="Scheduled meetings will appear here." />
          ) : (
            <ul className="space-y-3">
              {meetings.map((m) => (
                <li key={m.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="rounded-lg bg-bg-muted p-2">
                    <CalendarIcon className="h-4 w-4 text-ink-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{m.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : 'Schedule pending'}
                    </p>
                    {m.location ? <p className="mt-0.5 text-xs text-ink-muted">{m.location}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function ExecutiveDashboardView({ basePath }: { basePath: string }) {
  const user = useAuthStore((s) => s.user);
  const dashboardQuery = useDashboard();
  const activityQuery = useEntityActivity();
  const meetingsQuery = useEntityList('meetings');
  const goalsQuery = useEntityList('goals');
  const apiDash = dashboardQuery.data;

  const payload = apiDash?.data || apiDash;

  const asNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.total === 'number') return obj.total;
      if (typeof obj.count === 'number') return obj.count;
      if (typeof obj.active === 'number') return obj.active;
    }
    return fallback;
  };

  const projectsTotal = asNumber(payload?.projects?.total ?? payload?.totalProjects ?? payload?.projects);
  const openTasks = asNumber(
    payload?.team_productivity
      ? Math.max(
          0,
          asNumber(payload.team_productivity.total_tasks) - asNumber(payload.team_productivity.completed),
        )
      : payload?.openTasks ?? payload?.tasks,
  );
  const revenue = asNumber(payload?.financials?.total_revenue ?? payload?.revenue ?? payload?.totalRevenue);
  const teamSize = asNumber(payload?.employees ?? payload?.teamSize ?? payload?.team?.active_members);

  const statsFromApi: DashboardStat[] | null = payload
    ? [
        { id: 'projects', title: 'Projects', value: String(projectsTotal), change: 0, trend: 'up' as const },
        { id: 'tasks', title: 'Open tasks', value: String(openTasks), change: 0, trend: 'up' as const },
        { id: 'revenue', title: 'Revenue', value: formatCurrency(revenue), change: 0, trend: 'up' as const },
        { id: 'team', title: 'Team', value: String(teamSize), change: 0, trend: 'up' as const },
      ]
    : null;

  if (dashboardQuery.isLoading || activityQuery.isLoading || meetingsQuery.isLoading || goalsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || !statsFromApi) {
    return <EmptyState title="Unable to load dashboard" description="Refresh the page to try again." />;
  }

  const activities = (activityQuery.data || []).slice(0, 5);
  const meetings = ((meetingsQuery.data || []) as MeetingRecord[])
    .filter((meeting) => !meeting.dueDate || new Date(meeting.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    .filter((meeting, index, list) => list.findIndex((item) => item.id === meeting.id) === index)
    .slice(0, 5);

  const formatActivityLine = (a: ActivityRecord) => {
    const actor = (a.actor_name || 'Someone').trim();
    const summary = (a.summary || '').trim();
    const action = (a.action || '').trim().toLowerCase();
    if (summary) {
      const alreadyHasVerb = /^(created|updated|deleted|added|removed|changed)\b/i.test(summary);
      if (alreadyHasVerb) return { actor, text: summary };
      if (action) return { actor, text: `${action} ${summary}` };
      return { actor, text: summary };
    }
    return { actor, text: action || 'made an update' };
  };
  const goals = ((goalsQuery.data || []) as GoalRecord[]).slice(0, 6);
  const chartData = [
    {
      name: 'Projects',
      value: asNumber(payload?.projects?.active ?? projectsTotal),
      secondary: projectsTotal,
    },
    {
      name: 'Tasks',
      value: asNumber(payload?.team_productivity?.in_progress ?? openTasks),
      secondary: asNumber(payload?.team_productivity?.completed),
    },
    {
      name: 'Goals',
      value: asNumber(payload?.goals?.average_progress),
      secondary: asNumber(payload?.goals?.total),
    },
    {
      name: 'Net',
      value: asNumber(payload?.financials?.net ?? revenue),
      secondary: asNumber(payload?.financials?.total_revenue ?? revenue),
    },
  ];
  const quickActions = [
    { label: 'View product', href: '/product' },
    { label: 'Review tasks', href: '/tasks' },
    { label: 'Create goal', href: '/goals/create' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsFromApi.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ink">Performance overview</h3>
          </div>
          <SimpleAreaChart data={chartData} dataKey="value" secondaryKey="secondary" height={280} />
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-ink mb-4">Quick actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={`${basePath}${action.href.startsWith('/') ? action.href : `/${action.href}`}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-ink hover:border-brand/40 hover:bg-bg-muted transition-colors"
              >
                {action.label}
                <Sparkles className="h-4 w-4 text-ink-muted" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-ink mb-4">Recent activity</h3>
          <ul className="space-y-3">
            {activities.length === 0 ? (
              <EmptyState title="No recent activity" description="Activity will appear as work is updated." />
            ) : (activities as ActivityRecord[]).map((a) => {
              const line = formatActivityLine(a);
              return (
              <li key={a.id} className="flex gap-3 text-sm">
                <Avatar size="sm" name={line.actor} />
                <div>
                  <p className="text-ink">
                    <span className="text-ink font-medium">{line.actor}</span>{' '}
                    <span className="text-ink-secondary">{line.text}</span>
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-ink mb-4">Upcoming meetings</h3>
          <ul className="space-y-3">
            {meetings.length === 0 ? (
              <EmptyState title="No upcoming meetings" description="Scheduled meetings will appear here." />
            ) : meetings.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <div className="rounded-lg bg-bg-muted p-2">
                  <CalendarIcon className="h-4 w-4 text-ink-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{m.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {m.dueDate ? new Date(m.dueDate).toLocaleString() : 'Schedule pending'}
                  </p>
                  {m.location && <p className="text-xs text-ink-muted mt-0.5">{m.location}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-ink mb-4">Goals & capacity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.length === 0 ? (
            <EmptyState title="No active goals" description="Create a goal to begin tracking progress." />
          ) : goals.map((m) => (
            <Progress
              key={m.id}
              value={Math.min(100, Number(m.progress ?? 0))}
              label={m.title}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function AiView({ breadcrumbs }: { breadcrumbs: { label: string; href?: string }[] }) {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Hi — I’m your TechOS assistant. Ask about projects, budgets, or sprint status.',
    },
  ]);
  const mutation = useSendChatMessage();
  const generateReport = useGenerateAiReport();
  const analyzeRisk = useAnalyzeRisk();
  const suggestPriorities = useSuggestPriorities();

  const appendAssistant = (content: string) => {
    setHistory((h) => [...h, { role: 'assistant', text: content }]);
  };

  const runTool = async (
    label: string,
    runner: () => Promise<any>,
  ) => {
    setHistory((h) => [...h, { role: 'user', text: label }]);
    try {
      const response = await runner();
      const content =
        response?.data?.message || response?.message || response?.data?.data?.message;
      if (!content) throw new Error('Empty assistant response');
      appendAssistant(content);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to get an assistant response');
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="Ask questions or run executive report, risk, and priority tools."
        breadcrumbs={breadcrumbs}
      />
      <Card className="mb-4 flex flex-wrap gap-2 max-w-3xl">
        <Button
          size="sm"
          variant="secondary"
          loading={generateReport.isPending}
          onClick={() =>
            void runTool('Generate an executive report', () =>
              generateReport.mutateAsync({ type: 'executive' }),
            )
          }
        >
          Executive report
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={analyzeRisk.isPending}
          onClick={() =>
            void runTool('Analyze organizational risks', () => analyzeRisk.mutateAsync('openai'))
          }
        >
          Risk analysis
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={suggestPriorities.isPending}
          onClick={() =>
            void runTool('Suggest priorities', () => suggestPriorities.mutateAsync('openai'))
          }
        >
          Suggest priorities
        </Button>
      </Card>
      <Card className="max-w-3xl space-y-4">
        <div className="space-y-3 min-h-[280px]">
          {history.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-brand text-ink-inverse flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-brand text-ink-inverse'
                    : 'bg-bg-muted border border-border text-ink'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!prompt.trim()) return;
            const q = prompt.trim();
            setPrompt('');
            setHistory((h) => [...h, { role: 'user', text: q }]);
            try {
              const response = await mutation.mutateAsync({ message: q });
              const content = response?.data?.message || response?.message;
              if (!content) throw new Error('The assistant returned an empty response.');
              setHistory((h) => [...h, { role: 'assistant', text: content }]);
            } catch (error: unknown) {
              toast.error(error instanceof Error ? error.message : 'Unable to get an assistant response');
            }
          }}
        >
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything about your workspace..."
            className="flex-1"
          />
          <Button type="submit" loading={mutation.isPending}>
            Ask
          </Button>
        </form>
      </Card>
    </div>
  );
}

function SettingsView({ breadcrumbs }: { breadcrumbs: { label: string; href?: string }[] }) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const updateProfile = useUpdateMyProfile();
  const updatePassword = useUpdateMyPassword();
  const { data: orgData } = useOrganization();
  const updateOrg = useUpdateOrganization();
  const org = orgData?.data || orgData;
  const isCeo = user?.role === UserRole.CEO;
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
  }, [user?.firstName, user?.lastName]);

  return (
    <div>
      <PageHeader title="Settings" description="Account and workspace preferences." breadcrumbs={breadcrumbs} />
      <Tabs defaultValue="profile">
        <TabList aria-label="Settings sections">
          <Tab value="profile">Profile</Tab>
          <Tab value="security">Security</Tab>
          {isCeo ? <Tab value="organization">Organization</Tab> : null}
        </TabList>
        <TabPanel value="profile">
          <Card className="max-w-xl space-y-4">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label="Email" type="email" value={user?.email || ''} disabled />
            <Button
              loading={updateProfile.isPending}
              onClick={async () => {
                try {
                  const updated = await updateProfile.mutateAsync({
                    first_name: firstName.trim() || user?.firstName,
                    last_name: lastName.trim(),
                  });
                  updateUser({
                    firstName: updated?.first_name ?? firstName.trim(),
                    lastName: updated?.last_name ?? lastName.trim(),
                    avatar: updated?.avatar,
                  });
                  toast.success('Profile updated');
                } catch {
                  /* toast handled in mutation */
                }
              }}
            >
              Save profile
            </Button>
          </Card>
        </TabPanel>
        <TabPanel value="security">
          <Card className="max-w-xl space-y-4">
            <p className="text-sm text-ink-muted">
              Use your temporary invite password as the current password the first time you change it.
            </p>
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              loading={updatePassword.isPending}
              onClick={async () => {
                if (!currentPassword || newPassword.length < 8) {
                  toast.error('Enter current password and a new password (8+ chars)');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error('New passwords do not match');
                  return;
                }
                try {
                  await updatePassword.mutateAsync({ currentPassword, newPassword });
                  toast.success('Password updated');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                } catch {
                  /* toast handled in mutation */
                }
              }}
            >
              Update password
            </Button>
          </Card>
        </TabPanel>
        {isCeo ? (
          <TabPanel value="organization">
            <Card className="max-w-xl space-y-4">
              <Input
                label="Organization name"
                value={orgName || org?.name || ''}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <Button
                loading={updateOrg.isPending}
                onClick={async () => {
                  await updateOrg.mutateAsync({ name: orgName || org?.name });
                }}
              >
                Save organization
              </Button>
            </Card>
          </TabPanel>
        ) : null}
      </Tabs>
    </div>
  );
}
