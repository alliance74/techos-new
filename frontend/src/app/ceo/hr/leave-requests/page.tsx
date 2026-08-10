'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/UI/Table';
import { Pagination } from '@/components/UI/Pagination';
import { useLeaveRequests, useApproveLeaveRequest, useRejectLeaveRequest } from '@/hooks/useHR';
import { useClientPagination } from '@/hooks/useClientPagination';
import {
  CalendarClock,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaveRequestsPage() {
  const router = useRouter();
  const { data: leaveRequests, isLoading } = useLeaveRequests();
  const approveLeave = useApproveLeaveRequest();
  const rejectLeave = useRejectLeaveRequest();
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredRequests = useMemo(
    () =>
      leaveRequests?.filter((req) => statusFilter === 'all' || req.status === statusFilter) || [],
    [leaveRequests, statusFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredRequests, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal',
      other: 'Other'
    };
    return types[type] || type;
  };

  const handleApprove = async (id: string) => {
    try {
      await approveLeave.mutateAsync(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await rejectLeave.mutateAsync({ id, reason: rejectReason });
      setRejectingId(null);
      setRejectReason('');
    } catch (e) {
      console.error(e);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pendingCount = leaveRequests?.filter(l => l.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Leave Requests</h1>
          <p className="text-ink-muted mt-2">Review and manage employee leave requests</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-warning-soft border border-yellow-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning font-medium">{pendingCount} pending approval</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Pending</span>
          </div>
          <p className="text-2xl font-bold text-ink">{pendingCount}</p>
        </Card>
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Approved</span>
          </div>
          <p className="text-2xl font-bold text-ink">
            {leaveRequests?.filter(l => l.status === 'approved').length || 0}
          </p>
        </Card>
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-danger" />
            <span className="text-sm text-ink-muted">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-ink">
            {leaveRequests?.filter(l => l.status === 'rejected').length || 0}
          </p>
        </Card>
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="h-4 w-4 text-ink" />
            <span className="text-sm text-ink-muted">Total</span>
          </div>
          <p className="text-2xl font-bold text-ink">{leaveRequests?.length || 0}</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
            className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/40/20"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-12 w-12" />}
            title="No leave requests found"
            description="New leave requests will appear here"
          />
        ) : (
          <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer group/row"
                  onClick={() => {
                    if (rejectingId === req.id) return;
                    router.push(`/ceo/hr/leave-requests/${req.id}`);
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label="View leave request"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/ceo/hr/leave-requests/${req.id}`);
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-mist flex items-center justify-center text-brand font-semibold text-xs">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-ink group-hover/row:text-brand">
                          {req.employee?.user?.first_name} {req.employee?.user?.last_name}
                        </p>
                        <p className="text-xs text-ink-muted">{req.employee?.position}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{getTypeLabel(req.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-ink-secondary text-sm">
                      {new Date(req.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-ink-muted">
                      to {new Date(req.end_date).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-ink font-medium">{calculateDays(req.start_date, req.end_date)}</p>
                    <p className="text-xs text-ink-muted">days</p>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(req.status)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <p className="text-sm text-ink-muted truncate">{req.reason || '-'}</p>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {req.status === 'pending' ? (
                      rejectingId === req.id ? (
                        <div className="flex flex-col gap-2 items-end">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason..."
                            className="bg-bg-muted border border-border-strong rounded-lg px-2 py-1 text-xs text-ink-secondary w-48"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-3 py-1 text-xs bg-red-900/50 text-danger border border-danger/20 rounded-lg hover:bg-red-900/70"
                              disabled={rejectLeave.isPending}
                            >
                              {rejectLeave.isPending ? '...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="px-3 py-1 text-xs text-ink-muted border border-border-strong rounded-lg hover:bg-bg-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="p-2 hover:bg-success-soft rounded-lg text-success hover:text-green-300"
                            disabled={approveLeave.isPending}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setRejectingId(req.id)}
                            className="p-2 hover:bg-danger-soft rounded-lg text-danger hover:text-red-300"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/ceo/hr/leave-requests/${req.id}`)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand px-2"
                          >
                            View
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
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
