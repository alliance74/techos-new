'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  Bug,
  Clock,
  DollarSign,
  FolderKanban,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAnalyticsOverview,
  useBugAnalytics,
  useCreateKPI,
  useKPIs,
  useProjectAnalytics,
  useSprintAnalytics,
  useTeamProductivity,
  useTimeTracking,
} from '@/hooks/useAnalytics';
import { usePipelineStats } from '@/hooks/useCRM';
import { useDashboard } from '@/hooks/useDashboard';
import { useFinancialSummary } from '@/hooks/useFinance';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { SimpleAreaChart, SimpleBarChart } from '@/components/UI/Charts';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { PageHeader } from '@/components/UI/PageHeader';
import { Progress } from '@/components/UI/Progress';
import { Select } from '@/components/UI/Select';
import { SkeletonCard } from '@/components/UI/Skeleton';
import { StatCard } from '@/components/UI/StatCard';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';

type TabId = 'overview' | 'revenue' | 'pipeline' | 'delivery' | 'team';

function labelize(value?: string) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tabFromPath(pathname?: string): TabId {
  const last = (pathname || '').split('/').filter(Boolean).pop()?.toLowerCase() || '';
  if (['revenue', 'growth', 'expenses', 'cash-flow', 'profit-loss', 'forecasting'].includes(last)) {
    return 'revenue';
  }
  if (['sales-analytics', 'sales'].includes(last) || pathname?.includes('/sales/analytics')) {
    return 'pipeline';
  }
  if (['marketing-roi'].includes(last) || pathname?.includes('/marketing/analytics')) {
    return 'pipeline';
  }
  if (['team-metrics', 'workload', 'capacity', 'efficiency'].includes(last)) return 'team';
  if (['code-quality', 'product-metrics', 'roadmap'].includes(last)) return 'delivery';
  return 'overview';
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

/** Dashboard hook returns `{ success, data }` — unwrap to the payload. */
function executivePayload(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { data?: Record<string, unknown> };
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) return obj.data;
  return obj as Record<string, unknown>;
}

type AnalyticsHubProps = {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  pathname?: string;
};

/**
 * Live analytics command center — Nest dashboard, finance, CRM, and analytics APIs.
 */
export function AnalyticsHub({ title, breadcrumbs, pathname }: AnalyticsHubProps) {
  const initialTab = tabFromPath(pathname);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [kpiOpen, setKpiOpen] = useState(false);
  const [kpiForm, setKpiForm] = useState({
    name: '',
    target: '',
    current: '',
    unit: '%',
    category: 'company',
    frequency: 'monthly',
  });

  const dashboardQuery = useDashboard();
  const financeQuery = useFinancialSummary();
  const pipelineQuery = usePipelineStats();
  const overviewQuery = useAnalyticsOverview();
  const projectsQuery = useProjectAnalytics();
  const teamQuery = useTeamProductivity();
  const bugsQuery = useBugAnalytics();
  const sprintsQuery = useSprintAnalytics();
  const timeQuery = useTimeTracking();
  const kpisQuery = useKPIs();
  const createKpi = useCreateKPI();

  const executive = executivePayload(dashboardQuery.data) as any;
  const finance = financeQuery.data || ({} as any);
  const pipeline = pipelineQuery.data || ({} as any);
  const overview = overviewQuery.data || ({} as any);
  const projectsRaw = projectsQuery.data;
  const projects = Array.isArray(projectsRaw) ? projectsRaw : projectsRaw ? [projectsRaw] : [];
  const team = Array.isArray(teamQuery.data) ? teamQuery.data : [];
  const bugs = bugsQuery.data || ({} as any);
  const sprintsRaw = sprintsQuery.data;
  const sprints = Array.isArray(sprintsRaw) ? sprintsRaw : sprintsRaw ? [sprintsRaw] : [];
  const time = timeQuery.data || ({} as any);
  const kpis = Array.isArray(kpisQuery.data) ? kpisQuery.data : [];

  const loading =
    dashboardQuery.isLoading ||
    financeQuery.isLoading ||
    pipelineQuery.isLoading ||
    overviewQuery.isLoading;

  const hasError =
    dashboardQuery.isError ||
    financeQuery.isError ||
    pipelineQuery.isError ||
    overviewQuery.isError;

  const financials = executive?.financials || {};
  const revenue = Number(
    financials.total_revenue ?? finance.total_income ?? finance.total_revenue ?? 0,
  );
  const expenses = Number(financials.total_expenses ?? finance.total_expenses ?? 0);
  const net = Number(financials.net ?? finance.net_profit ?? revenue - expenses);
  const margin =
    revenue > 0 ? Math.round((net / revenue) * 100) : Math.round(Number(finance.profit_margin || 0));
  const outstanding = Number(financials.outstanding || 0);
  const winRate = Number(pipeline.win_rate || 0);
  const pipelineValue = Number(pipeline.total_pipeline_value || 0);
  const closedRevenue = Number(pipeline.total_revenue || 0);
  const totalDeals = Number(pipeline.total_deals || 0);
  const openBugs = Number(overview.bugs?.open ?? bugs.open_bugs ?? 0);

  const pipelineChart = useMemo((): Array<{ name: string; value: number; count: number }> => {
    const stages = Array.isArray(pipeline.pipeline) ? pipeline.pipeline : [];
    return stages.map((s: any) => ({
      name: labelize(s.stage),
      value: Number(s.total_value || 0),
      count: Number(s.count || 0),
    }));
  }, [pipeline]);

  const deliveryChart = useMemo(
    () => [
      { name: 'To do', value: Number(overview.tasks?.todo || 0) },
      { name: 'In progress', value: Number(overview.tasks?.in_progress || 0) },
      { name: 'Done', value: Number(overview.tasks?.done || 0) },
      { name: 'Open bugs', value: openBugs },
    ],
    [overview, openBugs],
  );

  const financeMix = useMemo(
    () => [
      { name: 'Revenue', value: revenue },
      { name: 'Expenses', value: expenses },
      { name: 'Net', value: Math.max(0, net) },
      { name: 'Outstanding', value: outstanding },
    ],
    [revenue, expenses, net, outstanding],
  );

  const teamChart = useMemo(() => {
    return [...team]
      .map((u, index) => {
        const id = String(u.user_id || `member-${index}`);
        const label = (u.user_name || '').trim() || `Member ${index + 1}`;
        return {
          id,
          name: label,
          value: Number(u.completed_tasks || 0),
          total: Number(u.total_tasks || 0),
          hours: Number(u.total_logged_hours || 0),
          rate: Number(u.completion_rate || 0),
        };
      })
      .filter((u) => u.total > 0 || u.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [team]);

  const sprintChart = useMemo(() => {
    return [...sprints]
      .map((s: any) => ({
        name: s.sprint_name || s.name || 'Sprint',
        value: Number(s.velocity ?? s.completed_story_points ?? 0),
        rate: Number(s.completion_rate || 0),
      }))
      .slice(0, 8);
  }, [sprints]);

  const bugSeverityChart = useMemo(() => {
    const by = bugs.by_severity || {};
    return [
      { name: 'Critical', value: Number(by.critical || 0) },
      { name: 'High', value: Number(by.high || 0) },
      { name: 'Medium', value: Number(by.medium || 0) },
      { name: 'Low', value: Number(by.low || 0) },
    ].filter((row) => row.value > 0);
  }, [bugs]);

  const taskCompletion = pct(
    Number(overview.tasks?.done || executive?.team_productivity?.completed || 0),
    Number(overview.tasks?.total || executive?.team_productivity?.total_tasks || 0),
  );

  const refetchAll = () => {
    void dashboardQuery.refetch();
    void financeQuery.refetch();
    void pipelineQuery.refetch();
    void overviewQuery.refetch();
    void projectsQuery.refetch();
    void teamQuery.refetch();
    void bugsQuery.refetch();
    void sprintsQuery.refetch();
    void timeQuery.refetch();
    void kpisQuery.refetch();
  };

  const onCreateKpi = async () => {
    if (!kpiForm.name.trim()) {
      toast.error('KPI name is required');
      return;
    }
    try {
      await createKpi.mutateAsync({
        name: kpiForm.name.trim(),
        target: Number(kpiForm.target) || 0,
        current: Number(kpiForm.current) || 0,
        unit: kpiForm.unit || '',
        category: kpiForm.category,
        frequency: kpiForm.frequency || 'monthly',
      });
      toast.success('KPI created');
      setKpiOpen(false);
      setKpiForm({
        name: '',
        target: '',
        current: '',
        unit: '%',
        category: 'company',
        frequency: 'monthly',
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create KPI');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard className="h-16" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-72" />
        </div>
      </div>
    );
  }

  if (hasError && !overviewQuery.data && !financeQuery.data && !pipelineQuery.data) {
    return (
      <EmptyState
        title="Unable to load analytics"
        description="Check that the API is running, then try again."
        action={{ label: 'Retry', onClick: refetchAll }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title || 'Analytics'}
        description="Live company performance from finance, CRM, delivery, and team APIs."
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={refetchAll}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setKpiOpen(true)}>
              <Target className="mr-2 h-4 w-4" />
              Add KPI
            </Button>
          </div>
        }
      />

      {hasError ? (
        <Card className="border-danger/30 bg-danger/5 text-sm text-ink">
          Some analytics sources failed to load. Showing available live data —{' '}
          <button type="button" className="font-medium text-brand underline" onClick={refetchAll}>
            retry
          </button>
          .
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Revenue" value={formatCurrency(revenue)} icon={DollarSign} />
        <StatCard
          title="Net profit"
          value={formatCurrency(net)}
          change={`${margin}% margin`}
          trend={net >= 0 ? 'up' : 'down'}
          icon={TrendingUp}
        />
        <StatCard
          title="Pipeline value"
          value={formatCurrency(pipelineValue)}
          change={`${winRate.toFixed(0)}% win rate`}
          trend="up"
          icon={Workflow}
        />
        <StatCard
          title="Task completion"
          value={`${taskCompletion}%`}
          change={`${overview.tasks?.done ?? 0}/${overview.tasks?.total ?? 0} done`}
          trend="up"
          icon={Activity}
        />
      </div>

      <Tabs value={tab} onChange={(v) => setTab(v as TabId)} defaultValue={initialTab}>
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="revenue">Revenue</Tab>
          <Tab value="pipeline">Pipeline</Tab>
          <Tab value="delivery">Delivery</Tab>
          <Tab value="team">Team</Tab>
        </TabList>

        <TabPanel value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink">Sales pipeline</h3>
                <Badge size="sm">{totalDeals} deals</Badge>
              </div>
              {pipelineChart.length === 0 ? (
                <EmptyState
                  title="No pipeline data"
                  description="Create deals in Sales to populate this chart."
                />
              ) : (
                <SimpleBarChart data={pipelineChart} dataKey="value" xKey="name" height={280} />
              )}
            </Card>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink">Delivery snapshot</h3>
                <Badge size="sm" variant="success">
                  {overview.projects?.active ?? 0} active projects
                </Badge>
              </div>
              <SimpleAreaChart data={deliveryChart} dataKey="value" xKey="name" height={280} />
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Active projects"
              value={String(overview.projects?.active ?? executive?.projects?.active ?? 0)}
              icon={FolderKanban}
            />
            <StatCard title="Open bugs" value={String(openBugs)} icon={Bug} />
            <StatCard
              title="Team size"
              value={String(overview.team?.active_members ?? executive?.teamSize ?? 0)}
              icon={Users}
            />
            <StatCard
              title="Closed-won revenue"
              value={formatCurrency(closedRevenue)}
              icon={DollarSign}
            />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">KPI progress</h3>
              <Button size="sm" variant="ghost" onClick={() => setKpiOpen(true)}>
                Add
              </Button>
            </div>
            {kpis.length === 0 ? (
              <EmptyState
                title="No KPIs yet"
                description="Track north-star metrics like MRR, win rate, or sprint velocity."
                action={{ label: 'Create KPI', onClick: () => setKpiOpen(true) }}
              />
            ) : (
              <div className="space-y-4">
                {kpis.map((kpi) => {
                  const current = Number(kpi.current ?? 0);
                  const target = Number(kpi.target ?? 0);
                  return (
                    <Progress
                      key={kpi.id}
                      value={pct(current, target)}
                      label={`${kpi.name} — ${current}${kpi.unit || ''} / ${target}${kpi.unit || ''}`}
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </TabPanel>

        <TabPanel value="revenue" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Recognized revenue" value={formatCurrency(revenue)} />
            <StatCard title="Expenses" value={formatCurrency(expenses)} />
            <StatCard title="Net" value={formatCurrency(net)} trend={net >= 0 ? 'up' : 'down'} />
            <StatCard title="Outstanding AR" value={formatCurrency(outstanding)} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-medium text-ink">Financial mix</h3>
              <SimpleBarChart data={financeMix} dataKey="value" xKey="name" height={280} />
            </Card>
            <Card className="space-y-4">
              <h3 className="text-sm font-medium text-ink">Health</h3>
              <Progress
                value={Math.max(0, Math.min(100, margin))}
                label={`Profit margin ${margin}%`}
              />
              <Progress
                value={revenue > 0 ? pct(outstanding, revenue) : 0}
                label={`Outstanding vs revenue ${pct(outstanding, revenue)}%`}
              />
              <p className="text-xs text-ink-muted">
                Revenue from paid invoices (`/dashboard` + `/finance/summary`). Expenses from
                approved spend. Closed-won pipeline is under Pipeline.
              </p>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="pipeline" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Open pipeline" value={formatCurrency(pipelineValue)} />
            <StatCard title="Win rate" value={`${winRate.toFixed(1)}%`} />
            <StatCard title="Closed-won" value={formatCurrency(closedRevenue)} />
          </div>
          <Card>
            <h3 className="mb-4 text-sm font-medium text-ink">Value by stage</h3>
            {pipelineChart.length === 0 ? (
              <EmptyState
                title="No deals yet"
                description="Add opportunities in Sales to build the funnel."
              />
            ) : (
              <SimpleBarChart data={pipelineChart} dataKey="value" xKey="name" height={320} />
            )}
          </Card>
          {pipelineChart.length > 0 ? (
            <Card>
              <h3 className="mb-3 text-sm font-medium text-ink">Stage breakdown</h3>
              <div className="space-y-3">
                {pipelineChart.map((row) => (
                  <div key={row.name} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{row.name}</span>
                    <span className="tabular-nums text-ink-muted">
                      {row.count} deals · {formatCurrency(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </TabPanel>

        <TabPanel value="delivery" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Projects" value={String(overview.projects?.total ?? 0)} />
            <StatCard title="Active sprints" value={String(overview.sprints?.active ?? 0)} />
            <StatCard title="Tasks done" value={String(overview.tasks?.done ?? 0)} />
            <StatCard title="Open bugs" value={String(openBugs)} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-medium text-ink">Work distribution</h3>
              <SimpleAreaChart data={deliveryChart} dataKey="value" xKey="name" height={280} />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-medium text-ink">Project completion</h3>
              {projects.length === 0 ? (
                <EmptyState
                  title="No project analytics"
                  description="Create products/projects to see completion rates."
                />
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 6).map((p: any) => (
                    <Progress
                      key={p.project_id || p.id}
                      value={Math.round(Number(p.completion_rate || 0))}
                      label={`${p.project_name || p.name || 'Project'} — ${p.completed_tasks ?? 0}/${p.total_tasks ?? 0} tasks`}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-medium text-ink">Sprint velocity</h3>
              {sprintChart.length === 0 ? (
                <EmptyState title="No sprints" description="Create sprints to track velocity." />
              ) : (
                <SimpleBarChart data={sprintChart} dataKey="value" xKey="name" height={260} />
              )}
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-medium text-ink">Bugs by severity</h3>
              {bugSeverityChart.length === 0 ? (
                <EmptyState title="No open bug mix" description="Bug severity will appear here." />
              ) : (
                <SimpleBarChart data={bugSeverityChart} dataKey="value" xKey="name" height={260} />
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="team" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active members"
              value={String(overview.team?.active_members ?? executive?.teamSize ?? 0)}
            />
            <StatCard
              title="Tasks in progress"
              value={String(
                overview.tasks?.in_progress ?? executive?.team_productivity?.in_progress ?? 0,
              )}
            />
            <StatCard title="Completed tasks" value={String(overview.tasks?.done ?? 0)} />
            <StatCard
              title="Hours logged"
              value={String(Math.round(Number(time.total_logged_hours || 0)))}
              icon={Clock}
            />
          </div>
          <Card>
            <h3 className="mb-4 text-sm font-medium text-ink">Completed tasks by person</h3>
            {teamChart.length === 0 ? (
              <EmptyState
                title="No productivity data"
                description="Assign tasks to teammates to populate this chart."
              />
            ) : (
              <SimpleBarChart data={teamChart} dataKey="value" xKey="name" height={320} />
            )}
          </Card>
          {teamChart.length > 0 ? (
            <Card>
              <h3 className="mb-3 text-sm font-medium text-ink">Leaderboard</h3>
              <div className="space-y-2">
                {teamChart.map((row, i) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-ink">
                      <span className="mr-2 text-ink-muted">#{i + 1}</span>
                      {row.name}
                    </span>
                    <span className="tabular-nums text-ink-muted">
                      {row.value}
                      {row.total ? ` / ${row.total}` : ''} completed
                      {row.hours ? ` · ${Math.round(row.hours)}h` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
          <Card className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Time tracking</h3>
            <Progress
              value={Math.min(100, Math.round(Number(time.efficiency_rate || 0)))}
              label={`Logged vs estimated — ${Math.round(Number(time.total_logged_hours || 0))}h / ${Math.round(Number(time.total_estimated_hours || 0))}h`}
            />
            <p className="text-xs text-ink-muted">
              {Number(time.tasks_with_time_logged || 0)} tasks have logged time · avg{' '}
              {Number(time.average_logged_per_task || 0).toFixed(1)}h per task
            </p>
          </Card>
        </TabPanel>
      </Tabs>

      <Modal isOpen={kpiOpen} onClose={() => setKpiOpen(false)} title="Add KPI" size="md">
        <div className="space-y-4">
          <Input
            label="Name"
            required
            value={kpiForm.name}
            onChange={(e) => setKpiForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Monthly recurring revenue"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Current"
              type="number"
              value={kpiForm.current}
              onChange={(e) => setKpiForm((f) => ({ ...f, current: e.target.value }))}
            />
            <Input
              label="Target"
              type="number"
              value={kpiForm.target}
              onChange={(e) => setKpiForm((f) => ({ ...f, target: e.target.value }))}
            />
            <Input
              label="Unit"
              value={kpiForm.unit}
              onChange={(e) => setKpiForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="%, $, #"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={kpiForm.category}
              onChange={(e) => setKpiForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="company">Company</option>
              <option value="revenue">Revenue</option>
              <option value="sales">Sales</option>
              <option value="product">Product</option>
              <option value="ops">Operations</option>
            </Select>
            <Select
              label="Frequency"
              value={kpiForm.frequency}
              onChange={(e) => setKpiForm((f) => ({ ...f, frequency: e.target.value }))}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setKpiOpen(false)}>
              Cancel
            </Button>
            <Button loading={createKpi.isPending} onClick={() => void onCreateKpi()}>
              Create KPI
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
