'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/UI/Table';
import { useFinancialSummary, useInvoices, useExpenses, useBudgets } from '@/hooks/useFinance';
import Link from 'next/link';
import {
  DollarSign,
  TrendingDown,
  Receipt,
  CreditCard,
  FileText,
  Wallet,
  PiggyBank,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function FinancialOverviewPage() {
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();

  const isLoading = summaryLoading || invoicesLoading || expensesLoading || budgetsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalRevenue =
    Number(summary?.total_revenue ?? summary?.totalRevenue) ||
    invoices?.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount || 0), 0) ||
    0;
  const totalExpenses =
    Number(summary?.total_expenses ?? summary?.totalExpenses) ||
    expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) ||
    0;
  const pendingExpenses = expenses?.filter((e) => e.status === 'pending').length || 0;
  const pendingInvoices = invoices?.filter((i) => i.status === 'sent' || i.status === 'overdue').length || 0;
  const overdueInvoices = invoices?.filter((i) => i.status === 'overdue').length || 0;
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  const recentInvoices = invoices?.slice(0, 5) || [];
  const pendingExpenseList = expenses?.filter((e) => e.status === 'pending').slice(0, 5) || [];
  const budgetUtilization =
    budgets?.map((b) => ({
      ...b,
      pct: b.amount > 0 ? Math.min(Math.round((Number(b.spent || 0) / Number(b.amount)) * 100), 100) : 0,
    })) || [];

  const formatMoney = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getInvoiceBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'sent': return <Badge variant="info">Sent</Badge>;
      case 'overdue': return <Badge variant="error">Overdue</Badge>;
      case 'draft': return <Badge variant="default">Draft</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getExpenseBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'rejected': return <Badge variant="error">Rejected</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Financial Overview</h1>
          <p className="text-ink-muted mt-2">Company financial performance and metrics</p>
        </div>
        {overdueInvoices > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-danger-soft border border-danger/20 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-danger-text font-medium">{overdueInvoices} overdue invoices</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-success-soft text-success flex items-center justify-center mb-3">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-sm text-ink-muted">Total Revenue</p>
              <p className="text-3xl font-bold text-ink mt-1">{formatMoney(totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-3">
                <TrendingDown className="h-5 w-5" />
              </div>
              <p className="text-sm text-ink-muted">Total Expenses</p>
              <p className="text-3xl font-bold text-ink mt-1">{formatMoney(totalExpenses)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-brand-mist text-brand flex items-center justify-center mb-3">
                <PiggyBank className="h-5 w-5" />
              </div>
              <p className="text-sm text-ink-muted">Net Profit</p>
              <p className="text-3xl font-bold text-ink mt-1">{formatMoney(profit)}</p>
            </div>
            <Badge variant="success">{profitMargin}% margin</Badge>
          </div>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-brand-mist text-brand flex items-center justify-center mb-3">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm text-ink-muted">Pending Items</p>
              <p className="text-3xl font-bold text-ink mt-1">{pendingInvoices + pendingExpenses}</p>
            </div>
            <div className="text-right text-xs text-ink-muted">
              <p>{pendingInvoices} invoices</p>
              <p>{pendingExpenses} expenses</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Recent Invoices
            </h2>
            <Link href="/ceo/finance/invoices" className="text-sm text-ink-muted hover:text-ink">View All</Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-ink-muted">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map(inv => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/ceo/finance/invoices/${inv.id}`)}
                  >
                    <TableCell>
                      <Link href={`/ceo/finance/invoices/${inv.id}`} className="text-ink font-medium hover:opacity-80">
                        {inv.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-ink-secondary">
                      {inv.client_name || (inv as any).company || '—'}
                    </TableCell>
                    <TableCell className="text-ink font-medium">
                      ${Number(inv.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-ink-muted">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>{getInvoiceBadge(inv.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Clock className="h-5 w-5" /> Pending Expenses
            </h2>
            <Link href="/ceo/finance/expenses/approve" className="text-sm text-ink-muted hover:text-ink">Review</Link>
          </div>
          {pendingExpenseList.length === 0 ? (
            <div className="text-center py-8 text-ink-muted">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
              <p>No pending expenses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingExpenseList.map(exp => (
                <Link
                  key={exp.id}
                  href={`/ceo/finance/expenses/${exp.id}`}
                  className="block p-3 bg-bg-muted border border-border rounded-lg hover:border-border-strong transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-ink text-sm">{exp.title}</p>
                    {getExpenseBadge(exp.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-muted">{exp.category} · {new Date(exp.date).toLocaleDateString()}</p>
                    <p className="text-sm text-ink font-semibold">${exp.amount?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Budget Utilization
          </h2>
          <Link href="/ceo/finance/budgets" className="text-sm text-ink-muted hover:text-ink">Manage Budgets</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetUtilization.length === 0 ? (
            <div className="col-span-full text-center py-8 text-ink-muted">
              <Wallet className="h-12 w-12 mx-auto mb-2" />
              <p>No budgets yet</p>
              <Link href="/ceo/finance/budgets" className="text-sm text-brand hover:underline mt-2 inline-block">
                Create a budget
              </Link>
            </div>
          ) : (
            budgetUtilization.map((budget) => (
            <div key={budget.name || (budget as any).id} className="p-4 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-ink text-sm">{budget.name}</p>
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  (budget.pct || 0) >= 90 ? 'bg-danger-soft text-danger-text' :
                  (budget.pct || 0) >= 75 ? 'bg-warning-soft text-warning-text' :
                  'bg-bg-subtle text-ink-muted'
                }`}>
                  {budget.pct || 0}% used
                </span>
              </div>
              <div className="w-full bg-bg-subtle rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    (budget.pct || 0) >= 90 ? 'bg-danger' :
                    (budget.pct || 0) >= 75 ? 'bg-warning' : 'bg-brand'
                  }`}
                  style={{ width: `${budget.pct || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>${((budget.spent || 0) / 1000).toFixed(0)}K spent</span>
                <span>${(budget.amount / 1000).toFixed(0)}K total</span>
              </div>
            </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
