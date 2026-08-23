'use client';

import { useMemo, useRef, useState } from 'react';
import { FileBarChart, RefreshCw, Save, Plus, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCreateReport,
  useDeleteReport,
  useGenerateReport,
  useReports,
} from '@/hooks/useReports';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { PageHeader } from '@/components/UI/PageHeader';
import { Select } from '@/components/UI/Select';
import { SkeletonCard } from '@/components/UI/Skeleton';
import { StatCard } from '@/components/UI/StatCard';

type ReportsHubProps = {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
};

function unwrap(payload: any) {
  if (!payload) return null;
  if (payload.data?.data) return payload.data.data;
  if (payload.data !== undefined) return payload.data;
  return payload;
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ─── Formatted document renderer ─── */
function ReportDocument({ data, type }: { data: any; type: string }) {
  if (!data) return null;

  // ── Financial report ──────────────────────────────────────────────────────
  if (type === 'financial') {
    const revenue = Number(data.revenue?.total ?? data.revenue ?? 0);
    const expenses = Number(data.expenses?.total ?? data.expenses ?? 0);
    const net = Number(data.net_profit ?? revenue - expenses);
    const period = data.period ?? {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Revenue" value={formatCurrency(revenue)} trend="up" change={0} />
          <StatCard title="Expenses" value={formatCurrency(expenses)} trend="down" change={0} />
          <StatCard title="Net Profit" value={formatCurrency(net)} trend={net >= 0 ? 'up' : 'down'} change={0} />
        </div>
        {(period.start || period.end) && (
          <MetaTable
            rows={[
              period.start && ['Period start', period.start],
              period.end && ['Period end', period.end],
            ].filter(Boolean) as [string, string][]}
          />
        )}
        {Array.isArray(data.transactions) && data.transactions.length > 0 && (
          <Section title="Transactions">
            <SimpleTable
              headers={['Date', 'Description', 'Amount', 'Type']}
              rows={data.transactions.slice(0, 20).map((t: any) => [
                t.date ?? t.created_at ?? '—',
                t.description ?? t.name ?? '—',
                formatCurrency(t.amount ?? 0),
                t.type ?? '—',
              ])}
            />
          </Section>
        )}
      </div>
    );
  }

  // ── Project report ────────────────────────────────────────────────────────
  if (type === 'project') {
    const projects = Array.isArray(data.projects) ? data.projects : Array.isArray(data) ? data : [];
    const total = data.total ?? projects.length;
    const active = data.active ?? projects.filter((p: any) => p.status === 'active').length;
    const completed = data.completed ?? projects.filter((p: any) => p.status === 'completed').length;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Projects" value={String(total)} trend="up" change={0} />
          <StatCard title="Active" value={String(active)} trend="up" change={0} />
          <StatCard title="Completed" value={String(completed)} trend="up" change={0} />
        </div>
        {projects.length > 0 && (
          <Section title="Project List">
            <SimpleTable
              headers={['Name', 'Status', 'Start', 'End']}
              rows={projects.slice(0, 20).map((p: any) => [
                p.name ?? p.title ?? '—',
                p.status ?? '—',
                p.start_date ? new Date(p.start_date).toLocaleDateString() : '—',
                p.end_date ? new Date(p.end_date).toLocaleDateString() : '—',
              ])}
            />
          </Section>
        )}
      </div>
    );
  }

  // ── KPI report ────────────────────────────────────────────────────────────
  if (type === 'kpi') {
    const kpis: [string, string][] = Object.entries(data)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
      .map(([k, v]) => [
        k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        String(v),
      ]);
    return (
      <div className="space-y-4">
        <MetaTable rows={kpis} />
      </div>
    );
  }

  // ── Tasks / Bugs report ───────────────────────────────────────────────────
  if (type === 'tasks' || type === 'bugs') {
    const items: any[] = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : Array.isArray(data.tasks) ? data.tasks : Array.isArray(data.bugs) ? data.bugs : [];
    const summary = data.summary ?? data.stats ?? null;
    const summaryRows: [string, string][] = summary
      ? Object.entries(summary)
          .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
          .map(([k, v]) => [k.replace(/_/g, ' '), String(v)])
      : [];
    return (
      <div className="space-y-6">
        {summaryRows.length > 0 && <MetaTable rows={summaryRows} />}
        {items.length > 0 && (
          <Section title={type === 'bugs' ? 'Bug List' : 'Task List'}>
            <SimpleTable
              headers={['Title', 'Status', 'Priority', 'Assignee']}
              rows={items.slice(0, 20).map((t: any) => [
                t.title ?? '—',
                t.status ?? '—',
                t.priority ?? '—',
                t.assignee ?? t.assignee_id ?? '—',
              ])}
            />
          </Section>
        )}
        {items.length === 0 && <EmptyState title="No items in report" description="The generated report returned no rows." />}
      </div>
    );
  }

  // ── Fallback: generic key-value table ─────────────────────────────────────
  const flat: [string, string][] = Object.entries(data)
    .filter(([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')
    .map(([k, v]) => [k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), String(v)]);

  return (
    <div className="space-y-4">
      {flat.length > 0 && <MetaTable rows={flat} />}
      {flat.length === 0 && (
        <p className="text-sm text-ink-muted">Report generated — no scalar fields to display.</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">{title}</h4>
      {children}
    </div>
  );
}

function MetaTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {rows.map(([key, val], i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 py-2.5 text-sm ${
            i % 2 === 0 ? 'bg-bg-muted' : 'bg-surface'
          }`}
        >
          <span className="text-ink-muted font-medium capitalize">{key}</span>
          <span className="text-ink font-semibold">{val}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-muted border-b border-border">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0 hover:bg-bg-muted transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main component ─── */
export function ReportsHub({ title, breadcrumbs }: ReportsHubProps) {
  const [reportType, setReportType] = useState('financial');
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [generated, setGenerated] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const generateCardRef = useRef<HTMLDivElement>(null);

  const listQuery = useReports();
  const generate = useGenerateReport();
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();

  const saved = useMemo(() => {
    const raw = unwrap(listQuery.data);
    return Array.isArray(raw) ? raw : [];
  }, [listQuery.data]);

  const onNewDocument = () => {
    setPanelOpen(true);
    setTimeout(() => generateCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const onGenerate = async () => {
    try {
      const res = await generate.mutateAsync({
        type: reportType,
        params:
          reportType === 'financial'
            ? { start_date: startDate, end_date: endDate }
            : undefined,
      });
      setGenerated(unwrap(res) || res);
    } catch {
      /* toast from hook */
    }
  };

  const onSave = async () => {
    if (!generated) {
      toast.error('Generate a report first');
      return;
    }
    await createReport.mutateAsync({
      title: `${reportType} report · ${startDate} → ${endDate}`,
      type: reportType,
      data: generated,
      period_start: startDate,
      period_end: endDate,
    });
    listQuery.refetch();
  };

  if (listQuery.isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard className="h-16" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title || 'Reports'}
        description="Generate live financial and delivery reports."
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => listQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={onNewDocument}>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </>
        }
      />

      {/* ── Generate panel ── */}
      <div ref={generateCardRef}>
        <Card>
          <button
            type="button"
            className="w-full flex items-center justify-between text-sm font-semibold text-ink"
            onClick={() => setPanelOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-brand" />
              Generate New Report
            </span>
            <ChevronDown
              className={`h-4 w-4 text-ink-muted transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {panelOpen && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  label="Report Type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="financial">Financial</option>
                  <option value="project">Projects</option>
                  <option value="kpi">KPIs</option>
                  <option value="tasks">Tasks</option>
                  <option value="bugs">Bugs</option>
                </Select>
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={reportType !== 'financial'}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={reportType !== 'financial'}
                />
                <div className="flex items-end gap-2">
                  <Button className="flex-1" loading={generate.isPending} onClick={() => void onGenerate()}>
                    <FileBarChart className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                  <Button
                    variant="secondary"
                    loading={createReport.isPending}
                    disabled={!generated}
                    onClick={() => void onSave()}
                    title="Save report"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Generated report output (formatted document) ── */}
      {generated ? (
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink capitalize">{reportType} Report</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Generated {new Date().toLocaleString()}
                {reportType === 'financial' && ` · ${startDate} → ${endDate}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge size="sm">{reportType}</Badge>
              <button
                type="button"
                onClick={() => setGenerated(null)}
                className="p-1.5 rounded-lg text-ink-muted hover:bg-bg-muted hover:text-ink transition-colors"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <ReportDocument data={generated} type={reportType} />
        </Card>
      ) : (
        !panelOpen && (
          <EmptyState
            title="No report generated yet"
            description="Click &quot;New Report&quot; to pick a type and generate a live report."
          />
        )
      )}

      {/* ── Saved reports ── */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">Saved Reports</h3>
        {saved.length === 0 ? (
          <EmptyState
            title="No saved reports"
            description="Generate a report and save it to keep a snapshot."
          />
        ) : (
          <div className="space-y-2">
            {saved.map((row: any) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm hover:bg-bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-ink">{row.title || row.name || row.type}</p>
                  <p className="text-xs text-ink-muted">
                    <span className="capitalize">{row.type || 'report'}</span>
                    {row.created_at ? ` · ${new Date(row.created_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={deleteReport.isPending}
                  onClick={() => void deleteReport.mutateAsync(row.id).then(() => listQuery.refetch())}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
