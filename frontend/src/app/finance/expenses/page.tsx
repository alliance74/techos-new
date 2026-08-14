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
import { useExpenses, useApproveExpense, useRejectExpense } from '@/hooks/useFinance';
import { useClientPagination } from '@/hooks/useClientPagination';
import {
  CreditCard,
  Search,
  Filter,
  ChevronRight,
  Plus,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';

export default function ExpensesPage() {
  const router = useRouter();
  const { data: expenses, isLoading } = useExpenses();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredExpenses = useMemo(
    () =>
      expenses?.filter((expense) => {
        const matchesSearch =
          expense.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
        return matchesSearch && matchesStatus;
      }) || [],
    [expenses, searchTerm, statusFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredExpenses, 10);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pendingExpenses = expenses?.filter(e => e.status === 'pending').length || 0;
  const approvedExpenses = expenses?.filter(e => e.status === 'approved').length || 0;
  const totalAmount = expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0;
  const pendingAmount = expenses?.filter(e => e.status === 'pending').reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Expenses</h1>
          <p className="text-ink-muted mt-2">Track and approve company expenses</p>
        </div>
        <Button onClick={() => router.push('/finance/expenses/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Expenses</span>
          </div>
          <p className="text-3xl font-bold text-ink">{expenses?.length || 0}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Pending</span>
          </div>
          <p className="text-3xl font-bold text-ink">{pendingExpenses}</p>
          <p className="text-xs text-warning mt-1">${(pendingAmount / 1000).toFixed(1)}K awaiting approval</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Approved</span>
          </div>
          <p className="text-3xl font-bold text-ink">{approvedExpenses}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Amount</span>
          </div>
          <p className="text-3xl font-bold text-ink">${(totalAmount / 1000).toFixed(1)}K</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search by title or category..."
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
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-12 w-12" />}
            title="No expenses found"
            description="Expenses will appear here"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/finance/expenses/${expense.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/finance/expenses/${expense.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell>
                      <p className="font-medium text-ink group-hover/row:text-brand">
                        {expense.title}
                      </p>
                    </TableCell>
                    <TableCell className="text-ink-secondary">
                      {expense.category}
                    </TableCell>
                    <TableCell className="text-ink font-medium">
                      ${Number(expense.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      {expense.date ? new Date(expense.date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-ink-secondary text-sm">
                      {expense.submitted_by || 'Unknown'}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {expense.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveExpense.mutate(expense.id)}
                            loading={approveExpense.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectExpense.mutate({ id: expense.id, reason: 'Rejected' })}
                            loading={rejectExpense.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
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
