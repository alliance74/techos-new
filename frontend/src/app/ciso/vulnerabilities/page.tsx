'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/UI/Table';
import { Pagination } from '@/components/UI/Pagination';
import { Input } from '@/components/UI/Input';
import { useClientPagination } from '@/hooks/useClientPagination';
import {
  Shield,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  TrendingDown,
} from 'lucide-react';

// Mock vulnerability data
const vulnerabilities = [
  {
    id: '1',
    title: 'SQL Injection vulnerability in user API',
    severity: 'critical',
    status: 'open',
    cve_id: 'CVE-2026-1234',
    affected_component: 'User Authentication API',
    discovered_date: '2026-08-05',
    last_updated: '2026-08-09',
    assigned_to: 'Security Team',
  },
  {
    id: '2',
    title: 'Cross-Site Scripting (XSS) in comment section',
    severity: 'high',
    status: 'in_progress',
    cve_id: 'CVE-2026-5678',
    affected_component: 'Comments Module',
    discovered_date: '2026-08-03',
    last_updated: '2026-08-08',
    assigned_to: 'Frontend Team',
  },
  {
    id: '3',
    title: 'Outdated OpenSSL library version',
    severity: 'high',
    status: 'open',
    cve_id: 'CVE-2026-9012',
    affected_component: 'Backend Infrastructure',
    discovered_date: '2026-08-01',
    last_updated: '2026-08-07',
    assigned_to: 'DevOps Team',
  },
  {
    id: '4',
    title: 'Weak password policy enforcement',
    severity: 'medium',
    status: 'resolved',
    cve_id: null,
    affected_component: 'User Management',
    discovered_date: '2026-07-28',
    last_updated: '2026-08-06',
    assigned_to: 'Security Team',
  },
  {
    id: '5',
    title: 'Missing rate limiting on login endpoint',
    severity: 'medium',
    status: 'in_progress',
    cve_id: null,
    affected_component: 'Authentication API',
    discovered_date: '2026-07-25',
    last_updated: '2026-08-05',
    assigned_to: 'Backend Team',
  },
  {
    id: '6',
    title: 'Insecure direct object reference in file download',
    severity: 'high',
    status: 'open',
    cve_id: 'CVE-2026-3456',
    affected_component: 'File Management',
    discovered_date: '2026-07-20',
    last_updated: '2026-08-04',
    assigned_to: 'Security Team',
  },
  {
    id: '7',
    title: 'Missing CORS headers',
    severity: 'low',
    status: 'resolved',
    cve_id: null,
    affected_component: 'API Gateway',
    discovered_date: '2026-07-15',
    last_updated: '2026-07-30',
    assigned_to: 'Backend Team',
  },
];

export default function VulnerabilitiesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading] = useState(false);

  const filteredVulnerabilities = useMemo(
    () =>
      vulnerabilities.filter((vuln) => {
        const matchesSearch =
          vuln.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vuln.affected_component?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vuln.cve_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || vuln.severity === severityFilter;
        const matchesStatus = statusFilter === 'all' || vuln.status === statusFilter;
        return matchesSearch && matchesSeverity && matchesStatus;
      }),
    [searchTerm, severityFilter, statusFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredVulnerabilities, 10);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="error"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
      case 'high':
        return <Badge variant="warning"><AlertCircle className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="info"><Info className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'low':
        return <Badge variant="default">Low</Badge>;
      default:
        return <Badge variant="default">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="error">Open</Badge>;
      case 'in_progress':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const openCount = vulnerabilities.filter(v => v.status === 'open').length;
  const resolvedCount = vulnerabilities.filter(v => v.status === 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Vulnerabilities</h1>
          <p className="text-ink-muted mt-2">Security vulnerabilities and CVE tracking</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-danger-soft border border-danger/20 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-danger-text font-medium">{criticalCount} critical vulnerabilities</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-ink-muted">Critical</span>
          </div>
          <p className="text-3xl font-bold text-ink">{criticalCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">High Severity</span>
          </div>
          <p className="text-3xl font-bold text-ink">{highCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Open</span>
          </div>
          <p className="text-3xl font-bold text-ink">{openCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Resolved</span>
          </div>
          <p className="text-3xl font-bold text-ink">{resolvedCount}</p>
          <p className="text-xs text-success mt-2">
            <TrendingDown className="h-3 w-3 inline mr-1" />
            -12% this month
          </p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search by title, component, or CVE ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
              className="pl-10 bg-bg-muted border-border text-ink"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-muted" />
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                resetPage();
              }}
              className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
              className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {filteredVulnerabilities.length === 0 ? (
          <EmptyState
            icon={<Shield className="h-12 w-12" />}
            title="No vulnerabilities found"
            description="All secure!"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vulnerability</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Affected Component</TableHead>
                  <TableHead>CVE ID</TableHead>
                  <TableHead>Discovered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((vuln) => (
                  <TableRow
                    key={vuln.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/ciso/vulnerabilities/${vuln.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/ciso/vulnerabilities/${vuln.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell>
                      <p className="font-medium text-ink group-hover/row:text-brand">
                        {vuln.title}
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        Assigned to: {vuln.assigned_to}
                      </p>
                    </TableCell>
                    <TableCell>{getSeverityBadge(vuln.severity)}</TableCell>
                    <TableCell>{getStatusBadge(vuln.status)}</TableCell>
                    <TableCell className="text-ink-secondary text-sm">
                      {vuln.affected_component}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      {vuln.cve_id || '—'}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      {new Date(vuln.discovered_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
