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
import { useInvoices } from '@/hooks/useFinance';
import { useClientPagination } from '@/hooks/useClientPagination';
import {
  Receipt,
  Search,
  Filter,
  ChevronRight,
  Plus,
  Download,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const { data: invoices, isLoading } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInvoices = useMemo(
    () =>
      invoices?.filter((invoice) => {
        const matchesSearch =
          invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
      }) || [],
    [invoices, searchTerm, statusFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredInvoices, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'sent':
        return <Badge variant="info">Sent</Badge>;
      case 'overdue':
        return <Badge variant="error">Overdue</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
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

  const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0;
  const totalAmount = invoices?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0;
  const paidAmount = invoices?.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Invoices</h1>
          <p className="text-ink-muted mt-2">Manage and track all invoices</p>
        </div>
        <Button onClick={() => router.push('/finance/invoices/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Invoices</span>
          </div>
          <p className="text-3xl font-bold text-ink">{invoices?.length || 0}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Paid</span>
          </div>
          <p className="text-3xl font-bold text-ink">{paidInvoices}</p>
          <p className="text-xs text-success mt-1">${(paidAmount / 1000).toFixed(1)}K received</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-4 w-4 text-danger" />
            <span className="text-sm text-ink-muted">Overdue</span>
          </div>
          <p className="text-3xl font-bold text-ink">{overdueInvoices}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Value</span>
          </div>
          <p className="text-3xl font-bold text-ink">${(totalAmount / 1000).toFixed(1)}K</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search by invoice number or client..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-12 w-12" />}
            title="No invoices found"
            description="Create your first invoice to get started"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/finance/invoices/${invoice.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/finance/invoices/${invoice.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell>
                      <p className="font-medium text-ink group-hover/row:text-brand">
                        {invoice.invoice_number}
                      </p>
                    </TableCell>
                    <TableCell className="text-ink-secondary">
                      {invoice.client_name || '—'}
                    </TableCell>
                    <TableCell className="text-ink font-medium">
                      ${Number(invoice.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
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
