'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  ChevronRight,
} from 'lucide-react';

// Mock reports data
const reports = [
  {
    id: '1',
    name: 'Profit & Loss Statement',
    type: 'P&L',
    period: 'Q3 2026',
    generated_date: '2026-08-09',
    generated_by: 'Emma Money',
    file_size: '2.4 MB',
    format: 'PDF',
  },
  {
    id: '2',
    name: 'Balance Sheet',
    type: 'Balance Sheet',
    period: 'July 2026',
    generated_date: '2026-08-05',
    generated_by: 'Finance Team',
    file_size: '1.8 MB',
    format: 'PDF',
  },
  {
    id: '3',
    name: 'Cash Flow Statement',
    type: 'Cash Flow',
    period: 'Q2 2026',
    generated_date: '2026-07-28',
    generated_by: 'Emma Money',
    file_size: '1.5 MB',
    format: 'PDF',
  },
  {
    id: '4',
    name: 'Monthly Financial Summary',
    type: 'Summary',
    period: 'July 2026',
    generated_date: '2026-08-01',
    generated_by: 'Automated',
    file_size: '890 KB',
    format: 'PDF',
  },
  {
    id: '5',
    name: 'Budget vs Actual Report',
    type: 'Budget Analysis',
    period: 'H1 2026',
    generated_date: '2026-07-15',
    generated_by: 'Finance Team',
    file_size: '3.1 MB',
    format: 'Excel',
  },
];

const reportTemplates = [
  {
    icon: BarChart3,
    name: 'Profit & Loss',
    description: 'Revenue, expenses, and net profit',
    color: 'text-brand',
  },
  {
    icon: PieChart,
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity',
    color: 'text-success',
  },
  {
    icon: LineChart,
    name: 'Cash Flow',
    description: 'Cash inflows and outflows',
    color: 'text-info',
  },
  {
    icon: TrendingUp,
    name: 'Budget Analysis',
    description: 'Budget vs actual comparison',
    color: 'text-warning',
  },
];

export default function FinancialReportsPage() {
  const router = useRouter();
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Financial Reports</h1>
          <p className="text-ink-muted mt-2">Generate and manage financial reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
          <Button onClick={() => router.push('/finance/financial-reports/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Reports</span>
          </div>
          <p className="text-3xl font-bold text-ink">{reports.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">This Month</span>
          </div>
          <p className="text-3xl font-bold text-ink">3</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Download className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Downloads</span>
          </div>
          <p className="text-3xl font-bold text-ink">142</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Scheduled</span>
          </div>
          <p className="text-3xl font-bold text-ink">5</p>
        </Card>
      </div>

      {/* Report Templates */}
      <Card className="p-6 bg-surface border border-border">
        <h3 className="text-sm font-medium text-ink mb-4">Quick Generate</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.name}
                className="p-4 bg-bg-muted border border-border cursor-pointer hover:border-brand/40 transition-all"
                onClick={() => router.push(`/finance/financial-reports/generate?type=${template.name.toLowerCase().replace(' ', '-')}`)}
              >
                <Icon className={`h-8 w-8 ${template.color} mb-3`} />
                <h4 className="font-semibold text-ink text-sm mb-1">{template.name}</h4>
                <p className="text-xs text-ink-muted">{template.description}</p>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Recent Reports */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-ink">Recent Reports</h3>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        {reports.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No reports generated"
            description="Create your first financial report"
          />
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 bg-bg-muted border border-border rounded-lg hover:border-brand/40 transition-all cursor-pointer"
                onClick={() => router.push(`/finance/financial-reports/${report.id}`)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-brand-soft rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-brand" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-ink">{report.name}</h4>
                      <Badge variant="default">{report.format}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.period}
                      </span>
                      <span>Generated by {report.generated_by}</span>
                      <span>{report.file_size}</span>
                      <span>{new Date(report.generated_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <ChevronRight className="h-4 w-4 text-ink-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <DollarSign className="h-8 w-8 text-brand mb-4" />
          <h3 className="font-semibold text-ink mb-2">Financial Statements</h3>
          <p className="text-sm text-ink-muted mb-4">P&L, balance sheet, cash flow</p>
          <Button variant="outline" size="sm" className="w-full">
            Generate
          </Button>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <BarChart3 className="h-8 w-8 text-success mb-4" />
          <h3 className="font-semibold text-ink mb-2">Budget Reports</h3>
          <p className="text-sm text-ink-muted mb-4">Budget vs actual analysis</p>
          <Button variant="outline" size="sm" className="w-full">
            Generate
          </Button>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <TrendingUp className="h-8 w-8 text-info mb-4" />
          <h3 className="font-semibold text-ink mb-2">Trend Analysis</h3>
          <p className="text-sm text-ink-muted mb-4">Revenue and expense trends</p>
          <Button variant="outline" size="sm" className="w-full">
            Generate
          </Button>
        </Card>
      </div>
    </div>
  );
}
