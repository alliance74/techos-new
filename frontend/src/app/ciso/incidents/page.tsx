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
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  Plus,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
} from 'lucide-react';

// Mock incident data
const incidents = [
  {
    id: '1',
    title: 'Unauthorized access attempt detected',
    severity: 'critical',
    status: 'investigating',
    category: 'Intrusion Attempt',
    reported_by: 'Security System',
    reported_at: '2026-08-09T14:30:00',
    assigned_to: 'Security Response Team',
    last_updated: '2026-08-09T16:45:00',
  },
  {
    id: '2',
    title: 'Data breach notification from third-party vendor',
    severity: 'high',
    status: 'investigating',
    category: 'Data Breach',
    reported_by: 'Vendor Relations',
    reported_at: '2026-08-09T10:15:00',
    assigned_to: 'CISO Office',
    last_updated: '2026-08-09T15:20:00',
  },
  {
    id: '3',
    title: 'Phishing email campaign targeting employees',
    severity: 'high',
    status: 'contained',
    category: 'Phishing',
    reported_by: 'IT Security',
    reported_at: '2026-08-08T09:00:00',
    assigned_to: 'Security Awareness Team',
    last_updated: '2026-08-09T08:30:00',
  },
  {
    id: '4',
    title: 'Suspicious login activity from unknown location',
    severity: 'medium',
    status: 'resolved',
    category: 'Unauthorized Access',
    reported_by: 'Monitoring System',
    reported_at: '2026-08-07T22:45:00',
    assigned_to: 'Security Operations',
    last_updated: '2026-08-08T12:00:00',
  },
  {
    id: '5',
    title: 'Malware detected on employee workstation',
    severity: 'medium',
    status: 'contained',
    category: 'Malware',
    reported_by: 'Endpoint Protection',
    reported_at: '2026-08-07T16:20:00',
    assigned_to: 'IT Support',
    last_updated: '2026-08-08T09:15:00',
  },
  {
    id: '6',
    title: 'DDoS attack on company website',
    severity: 'critical',
    status: 'contained',
    category: 'DDoS',
    reported_by: 'Network Operations',
    reported_at: '2026-08-06T18:30:00',
    assigned_to: 'Infrastructure Team',
    last_updated: '2026-08-07T02:45:00',
  },
  {
    id: '7',
    title: 'Policy violation - unauthorized software installation',
    severity: 'low',
    status: 'resolved',
    category: 'Policy Violation',
    reported_by: 'Compliance Team',
    reported_at: '2026-08-05T11:00:00',
    assigned_to: 'HR & IT',
    last_updated: '2026-08-06T14:30:00',
  },
];

export default function IncidentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading] = useState(false);

  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        const matchesSearch =
          incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.reported_by?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
        const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
        return matchesSearch && matchesSeverity && matchesStatus;
      }),
    [searchTerm, severityFilter, statusFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredIncidents, 10);

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
      case 'investigating':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Investigating</Badge>;
      case 'contained':
        return <Badge variant="info"><Shield className="h-3 w-3 mr-1" />Contained</Badge>;
      case 'resolved':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge variant="default"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>;
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

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const activeCount = incidents.filter(i => i.status === 'investigating' || i.status === 'contained').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const avgResponseTime = 2.5; // Mock data in hours

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Security Incidents</h1>
          <p className="text-ink-muted mt-2">Track and manage security incidents</p>
        </div>
        <Button onClick={() => router.push('/ciso/incidents/report')}>
          <Plus className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-ink-muted">Critical Incidents</span>
          </div>
          <p className="text-3xl font-bold text-ink">{criticalCount}</p>
          {criticalCount > 0 && (
            <p className="text-xs text-danger mt-2">Requires immediate attention</p>
          )}
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Active Incidents</span>
          </div>
          <p className="text-3xl font-bold text-ink">{activeCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Resolved</span>
          </div>
          <p className="text-3xl font-bold text-ink">{resolvedCount}</p>
          <p className="text-xs text-success mt-2">This month</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Avg Response Time</span>
          </div>
          <p className="text-3xl font-bold text-ink">{avgResponseTime}<span className="text-sm font-normal text-ink-muted ml-1">hrs</span></p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search by title, category, or reporter..."
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
              <option value="investigating">Investigating</option>
              <option value="contained">Contained</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {filteredIncidents.length === 0 ? (
          <EmptyState
            icon={<Shield className="h-12 w-12" />}
            title="No incidents found"
            description="Security incidents will appear here"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((incident) => (
                  <TableRow
                    key={incident.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/ciso/incidents/${incident.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/ciso/incidents/${incident.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell>
                      <p className="font-medium text-ink group-hover/row:text-brand">
                        {incident.title}
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        Reported by: {incident.reported_by}
                      </p>
                    </TableCell>
                    <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell className="text-ink-secondary text-sm">
                      {incident.category}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      {new Date(incident.reported_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-ink-secondary text-sm">
                      {incident.assigned_to}
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
