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
  CreditCard,
  Search,
  Filter,
  ChevronRight,
  Plus,
  Download,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from 'lucide-react';

// Mock payments data
const payments = [
  {
    id: '1',
    payment_number: 'PAY-001234',
    invoice_id: 'INV-5678',
    amount: 12500,
    currency: 'USD',
    method: 'Bank Transfer',
    status: 'completed',
    recipient: 'Acme Corp',
    payment_date: '2026-08-08',
    reference: 'Project Alpha - Phase 1',
    processed_by: 'Finance Team',
  },
  {
    id: '2',
    payment_number: 'PAY-001235',
    invoice_id: 'INV-5679',
    amount: 8750,
    currency: 'USD',
    method: 'Credit Card',
    status: 'pending',
    recipient: 'Tech Solutions Inc',
    payment_date: '2026-08-09',
    reference: 'Monthly Subscription - Aug',
    processed_by: 'Automated',
  },
  {
    id: '3',
    payment_number: 'PAY-001236',
    invoice_id: 'INV-5680',
    amount: 15200,
    currency: 'USD',
    method: 'Wire Transfer',
    status: 'processing',
    recipient: 'Global Services Ltd',
    payment_date: '2026-08-09',
    reference: 'Consulting Services Q3',
    processed_by: 'Emma Money',
  },
  {
    id: '4',
    payment_number: 'PAY-001237',
    invoice_id: 'INV-5681',
    amount: 5400,
    currency: 'USD',
    method: 'PayPal',
    status: 'completed',
    recipient: 'Marketing Agency',
    payment_date: '2026-08-07',
    reference: 'Ad Campaign - July',
    processed_by: 'Finance Team',
  },
  {
    id: '5',
    payment_number: 'PAY-001238',
    invoice_id: 'INV-5682',
    amount: 3200,
    currency: 'USD',
    method: 'Check',
    status: 'failed',
    recipient: 'Office Supplies Co',
    payment_date: '2026-08-06',
    reference: 'Office Equipment',
    processed_by: 'Finance Team',
  },
];

export default function PaymentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isLoading] = useState(false);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesSearch =
          payment.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
      }),
    [searchTerm, statusFilter, methodFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredPayments, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge variant="info"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="error"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
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

  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'processing').length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Payments</h1>
          <p className="text-ink-muted mt-2">Track and manage all payments</p>
        </div>
        <Button onClick={() => router.push('/finance/payments/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Payments</span>
          </div>
          <p className="text-3xl font-bold text-ink">{payments.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Completed</span>
          </div>
          <p className="text-3xl font-bold text-ink">{completedPayments}</p>
          <p className="text-xs text-success mt-1">${(completedAmount / 1000).toFixed(1)}K processed</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Pending</span>
          </div>
          <p className="text-3xl font-bold text-ink">{pendingPayments}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Volume</span>
          </div>
          <p className="text-3xl font-bold text-ink">${(totalAmount / 1000).toFixed(1)}K</p>
          <p className="text-xs text-success mt-1">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            +15% vs last month
          </p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search by payment number, recipient, or reference..."
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                resetPage();
              }}
              className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">All Methods</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Wire Transfer">Wire Transfer</option>
              <option value="PayPal">PayPal</option>
              <option value="Check">Check</option>
            </select>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-12 w-12" />}
            title="No payments found"
            description="Payments will appear here"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/finance/payments/${payment.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/finance/payments/${payment.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <TableCell>
                      <p className="font-medium text-ink group-hover/row:text-brand">
                        {payment.payment_number}
                      </p>
                      <p className="text-xs text-ink-muted mt-1">{payment.reference}</p>
                    </TableCell>
                    <TableCell className="text-ink-secondary">
                      {payment.recipient}
                    </TableCell>
                    <TableCell className="text-ink font-medium">
                      ${payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-ink-secondary text-sm">
                      {payment.method}
                    </TableCell>
                    <TableCell className="text-ink-muted text-sm">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
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

      {/* Payment Methods Overview */}
      <Card className="p-6 bg-surface border border-border">
        <h3 className="text-sm font-medium text-ink mb-4">Payment Methods Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['Bank Transfer', 'Credit Card', 'Wire Transfer', 'PayPal', 'Check'].map((method) => {
            const count = payments.filter(p => p.method === method).length;
            const amount = payments.filter(p => p.method === method).reduce((sum, p) => sum + p.amount, 0);
            return (
              <div key={method} className="p-4 bg-bg-muted border border-border rounded-lg">
                <p className="text-xs text-ink-muted mb-1">{method}</p>
                <p className="text-lg font-bold text-ink">{count}</p>
                <p className="text-xs text-ink-secondary mt-1">${(amount / 1000).toFixed(1)}K</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
