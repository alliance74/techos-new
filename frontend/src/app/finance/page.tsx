'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Progress } from '@/components/UI/Progress';
import { useFinancialSummary, useInvoices, useExpenses, useBudgets } from '@/hooks/useFinance';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Wallet,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Target,
  Activity
} from 'lucide-react';

export default function FinanceDashboard() {
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();

  if (summaryLoading || invoicesLoading || expensesLoading || budgetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalRevenue = Number(summary?.total_revenue || 0);
  const totalExpenses = Number(summary?.total_expenses || 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const pendingInvoices = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue').length || 0;
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0;
  const pendingExpenses = expenses?.filter(e => e.status === 'pending').length || 0;

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 1000).toFixed(1)}K`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'success',
    },
    {
      title: 'Total Expenses',
      value: `$${(totalExpenses / 1000).toFixed(1)}K`,
      change: '+8.3%',
      trend: 'down',
      icon: TrendingDown,
      color: 'danger',
    },
    {
      title: 'Net Profit',
      value: `$${(netProfit / 1000).toFixed(1)}K`,
      change: `${profitMargin}% margin`,
      trend: netProfit > 0 ? 'up' : 'down',
      icon: PiggyBank,
      color: netProfit > 0 ? 'success' : 'danger',
    },
    {
      title: 'Pending Items',
      value: pendingInvoices + pendingExpenses,
      change: `${pendingInvoices} invoices, ${pendingExpenses} expenses`,
      trend: 'neutral',
      icon: Clock,
      color: pendingInvoices + pendingExpenses > 0 ? 'warning' : 'success',
    },
  ];

  const recentInvoices = invoices?.slice(0, 5) || [];
  const recentExpenses = expenses?.filter(e => e.status === 'pending').slice(0, 5) || [];
  const budgetUtilization = budgets?.map(b => ({
    ...b,
    pct: b.amount > 0 ? Math.min(Math.round((Number(b.spent || 0) / Number(b.amount)) * 100), 100) : 0,
  })).slice(0, 4) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Finance Dashboard</h1>
          <p className="text-ink-muted mt-2">Financial overview and key metrics</p>
        </div>
        {overdueInvoices > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-danger-soft border border-danger/20 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-danger-text font-medium">{overdueInvoices} overdue invoices</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6 bg-surface border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-muted">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-ink mt-2">{stat.value}</h3>
                  <p className={`text-sm mt-2 ${
                    stat.color === 'success' ? 'text-success' :
                    stat.color === 'danger' ? 'text-danger' :
                    stat.color === 'warning' ? 'text-warning' : 'text-ink-muted'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'success' ? 'bg-success-soft' :
                  stat.color === 'danger' ? 'bg-danger-soft' :
                  stat.color === 'warning' ? 'bg-warning-soft' : 'bg-brand-mist'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    stat.color === 'success' ? 'text-success' :
                    stat.color === 'danger' ? 'text-danger' :
                    stat.color === 'warning' ? 'text-warning' : 'text-brand'
                  }`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-ink">Recent Invoices</h2>
            </div>
            <Link href="/finance/invoices" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/finance/invoices/${invoice.id}`}
                className="block p-3 bg-bg-muted border border-border rounded-lg hover:border-brand/40 transition-all"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-ink text-sm">{invoice.invoice_number}</p>
                  <Badge variant={
                    invoice.status === 'paid' ? 'success' :
                    invoice.status === 'overdue' ? 'error' :
                    invoice.status === 'sent' ? 'info' : 'default'
                  }>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{invoice.client_name || 'Client'}</span>
                  <span className="font-semibold text-ink">${Number(invoice.amount || 0).toLocaleString()}</span>
                </div>
              </Link>
            ))}
            {recentInvoices.length === 0 && (
              <div className="text-center py-8 text-ink-muted">
                <Receipt className="h-12 w-12 mx-auto mb-2" />
                <p>No invoices yet</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold text-ink">Pending Expenses</h2>
            </div>
            <Link href="/finance/expenses" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <Link
                key={expense.id}
                href={`/finance/expenses/${expense.id}`}
                className="block p-3 bg-bg-muted border border-border rounded-lg hover:border-brand/40 transition-all"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-ink text-sm">{expense.title}</p>
                  <Badge variant="warning">Pending</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{expense.category} • {new Date(expense.date).toLocaleDateString()}</span>
                  <span className="font-semibold text-ink">${expense.amount?.toLocaleString()}</span>
                </div>
              </Link>
            ))}
            {recentExpenses.length === 0 && (
              <div className="text-center py-8 text-ink-muted">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
                <p>No pending expenses</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Budget Utilization</h2>
          </div>
          <Link href="/finance/budgets" className="text-sm text-ink-muted hover:text-ink">
            Manage Budgets
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetUtilization.map((budget) => (
            <div key={budget.id} className="p-4 bg-bg-muted border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-ink text-sm">{budget.name}</p>
                <Badge variant={
                  (budget.pct || 0) >= 90 ? 'error' :
                  (budget.pct || 0) >= 75 ? 'warning' : 'success'
                }>
                  {budget.pct}%
                </Badge>
              </div>
              <Progress value={budget.pct} />
              <div className="flex items-center justify-between mt-2 text-xs text-ink-muted">
                <span>${((budget.spent || 0) / 1000).toFixed(1)}K spent</span>
                <span>${(budget.amount / 1000).toFixed(1)}K total</span>
              </div>
            </div>
          ))}
          {budgetUtilization.length === 0 && (
            <div className="col-span-2 text-center py-8 text-ink-muted">
              <Wallet className="h-12 w-12 mx-auto mb-2" />
              <p>No budgets configured</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/finance/invoices" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Receipt className="h-8 w-8 text-brand mb-4" />
            <h3 className="font-semibold text-ink mb-2">Invoices</h3>
            <p className="text-sm text-ink-muted">Manage and track invoices</p>
          </Card>
        </Link>
        <Link href="/finance/expenses" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <CreditCard className="h-8 w-8 text-warning mb-4" />
            <h3 className="font-semibold text-ink mb-2">Expenses</h3>
            <p className="text-sm text-ink-muted">Track and approve expenses</p>
          </Card>
        </Link>
        <Link href="/finance/budgets" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <Wallet className="h-8 w-8 text-info mb-4" />
            <h3 className="font-semibold text-ink mb-2">Budgets</h3>
            <p className="text-sm text-ink-muted">Budget planning and tracking</p>
          </Card>
        </Link>
        <Link href="/finance/financial-reports" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-brand/40 transition-all h-full">
            <FileText className="h-8 w-8 text-success mb-4" />
            <h3 className="font-semibold text-ink mb-2">Reports</h3>
            <p className="text-sm text-ink-muted">Financial reports and analytics</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
