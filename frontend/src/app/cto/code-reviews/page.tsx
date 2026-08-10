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
import { useCodeReviews } from '@/hooks/useCodeReviews';
import { useClientPagination } from '@/hooks/useClientPagination';
import {
  GitPullRequest,
  Search,
  Filter,
  ChevronRight,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Code2,
  FileCode,
} from 'lucide-react';

export default function CodeReviewsPage() {
  const router = useRouter();
  const { data: codeReviews, isLoading } = useCodeReviews();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredReviews = useMemo(
    () =>
      codeReviews?.filter((review) => {
        const matchesSearch =
          review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.repository?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || review.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      }) || [],
    [codeReviews, searchTerm, statusFilter, priorityFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredReviews, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="error"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'changes_requested':
        return <Badge variant="info"><AlertCircle className="h-3 w-3 mr-1" />Changes Requested</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="error">Critical</Badge>;
      case 'high':
        return <Badge variant="warning">High</Badge>;
      case 'medium':
        return <Badge variant="info">Medium</Badge>;
      case 'low':
        return <Badge variant="default">Low</Badge>;
      default:
        return <Badge variant="default">{priority}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pendingReviews = codeReviews?.filter(r => r.status === 'pending').length || 0;
  const approvedReviews = codeReviews?.filter(r => r.status === 'approved').length || 0;
  const changesRequested = codeReviews?.filter(r => r.status === 'changes_requested').length || 0;
  const avgReviewTime = 4.5; // Mock data

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Code Reviews</h1>
          <p className="text-ink-muted mt-2">Pull request reviews and approvals</p>
        </div>
        <Button onClick={() => router.push('/cto/code-reviews/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Request Review
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Pending Reviews</span>
          </div>
          <p className="text-3xl font-bold text-ink">{pendingReviews}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Approved</span>
          </div>
          <p className="text-3xl font-bold text-ink">{approvedReviews}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Changes Requested</span>
          </div>
          <p className="text-3xl font-bold text-ink">{changesRequested}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Avg Review Time</span>
          </div>
          <p className="text-3xl font-bold text-ink">{avgReviewTime}<span className="text-sm font-normal text-ink-muted ml-1">hrs</span></p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search by title, repository, or author..."
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
              className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                resetPage();
              }}
              className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <EmptyState
            icon={<GitPullRequest className="h-12 w-12" />}
            title="No code reviews found"
            description="Code reviews will appear here"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR Title</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((review) => (
                  <TableRow
                    key={review.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/cto/code-reviews/${review.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/cto/code-reviews/${review.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4 text-brand" />
                        <p className="font-medium text-ink group-hover/row:text-brand">
                          {review.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-secondary text-sm">
                      {review.repository || '—'}
                    </TableCell>
                    <TableCell className="text-ink-secondary text-sm">
                      {review.author_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-success">+{review.lines_added || 0}</span>
                        <span className="text-danger">-{review.lines_removed || 0}</span>
                        <FileCode className="h-3 w-3 text-ink-muted" />
                        <span>{review.files_changed || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(review.priority)}</TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                        Review
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
