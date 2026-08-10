'use client';

import { useMemo, useState } from 'react';
import { FileBarChart, RefreshCw, Save } from 'lucide-react';
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

/**
 * Live Nest reports — generate financial/project/KPI and manage saved reports.
 */
export function ReportsHub({ title, breadcrumbs }: ReportsHubProps) {
  const [reportType, setReportType] = useState('financial');
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [generated, setGenerated] = useState<any>(null);

  const listQuery = useReports();
  const generate = useGenerateReport();
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();

  const saved = useMemo(() => {
    const raw = unwrap(listQuery.data);
    return Array.isArray(raw) ? raw : [];
  }, [listQuery.data]);

  const financial = generated?.period ? generated : generated?.revenue ? generated : null;
  const revenue = Number(financial?.revenue?.total ?? financial?.revenue ?? 0);
  const expenses = Number(financial?.expenses?.total ?? financial?.expenses ?? 0);
  const net = Number(financial?.net_profit ?? revenue - expenses);

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
        description="Generate live financial and delivery reports from Nest."
        breadcrumbs={breadcrumbs}
        actions={
          <Button size="sm" variant="ghost" onClick={() => listQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card className="space-y-4">
        <h3 className="text-sm font-medium text-ink">Generate</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Type"
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
            label="Start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={reportType !== 'financial'}
          />
          <Input
            label="End"
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
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {financial?.revenue || financial?.expenses || financial?.net_profit != null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Revenue" value={formatCurrency(revenue)} />
          <StatCard title="Expenses" value={formatCurrency(expenses)} />
          <StatCard title="Net profit" value={formatCurrency(net)} trend={net >= 0 ? 'up' : 'down'} />
        </div>
      ) : null}

      {generated ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">Latest output</h3>
            <Badge size="sm">{reportType}</Badge>
          </div>
          <pre className="max-h-80 overflow-auto rounded-lg bg-bg-muted p-4 text-xs text-ink">
            {JSON.stringify(generated, null, 2)}
          </pre>
        </Card>
      ) : (
        <EmptyState
          title="No report generated yet"
          description="Pick a type and date range, then generate a live report from the API."
        />
      )}

      <Card>
        <h3 className="mb-4 text-sm font-medium text-ink">Saved reports</h3>
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
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{row.title || row.name || row.type}</p>
                  <p className="text-xs text-ink-muted">
                    {row.type || 'report'}
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
