'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/UI/DataTable';
import { PageHeader } from '@/components/UI/PageHeader';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Card } from '@/components/UI/Card';
import { useCisoReports, useCreateCisoReport, type CisoReport } from '@/hooks/useCiso';
import { 
  FileText, 
  Plus, 
  Download, 
  Calendar,
  Shield,
  Clock
} from 'lucide-react';

export default function CisoReportsPage() {
  const router = useRouter();
  const { data: reports = [], isLoading } = useCisoReports();
  const createReport = useCreateCisoReport();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const thisMonthCount = reports.filter(r => {
    const created = new Date(r.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const columns: Column<CisoReport>[] = useMemo(
    () => [
      { 
        key: 'title', 
        header: 'Report Title', 
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-medium text-ink">{row.title}</p>
            {row.data?.summary && (
              <p className="text-sm text-ink-muted line-clamp-1 mt-1">{row.data.summary}</p>
            )}
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        render: (row) => <Badge variant="info">{row.type || 'Security Report'}</Badge>,
      },
      {
        key: 'created_at',
        header: 'Created',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2 text-sm text-ink-secondary">
            <Calendar className="h-3 w-3" />
            <span>{new Date(row.created_at).toLocaleDateString()}</span>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                // Download logic here
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Reports"
        description="Generate and manage security and compliance reports"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Reports</span>
          </div>
          <p className="text-3xl font-bold text-ink">{reports.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">This Month</span>
          </div>
          <p className="text-3xl font-bold text-ink">{thisMonthCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Last Report</span>
          </div>
          <p className="text-lg font-bold text-ink">
            {reports.length > 0 
              ? new Date(reports[0].created_at).toLocaleDateString()
              : 'N/A'
            }
          </p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-5 w-5 text-brand" />
          <h3 className="text-lg font-semibold text-ink">Create New Security Report</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-[2fr_3fr_auto]">
          <Input
            label="Report Title"
            placeholder="e.g., Q1 Security Audit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Summary"
            placeholder="Brief description (optional)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              disabled={!title.trim() || createReport.isPending}
              loading={createReport.isPending}
              onClick={async () => {
                await createReport.mutateAsync({ 
                  title: title.trim(), 
                  summary: summary.trim() || undefined 
                });
                setTitle('');
                setSummary('');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">All Security Reports</h2>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={reports}
          isLoading={isLoading}
          searchKeys={['title', 'type', 'data.summary']}
          pageSize={10}
          getRowId={(row) => row.id}
          emptyTitle="No security reports yet"
          emptyDescription="Create your first report to establish a security reporting cadence."
          onRowClick={(row) => router.push(`/ciso/reports/${row.id}`)}
        />
      </Card>
    </div>
  );
}
