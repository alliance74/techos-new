'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { Progress } from '@/components/UI/Progress';
import { useBudgets } from '@/hooks/useFinance';
import {
  Wallet,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  DollarSign
} from 'lucide-react';

export default function BudgetsPage() {
  const router = useRouter();
  const { data: budgets, isLoading } = useBudgets();

  const budgetsWithUtilization = budgets?.map(b => ({
    ...b,
    pct: b.amount > 0 ? Math.min(Math.round((Number(b.spent || 0) / Number(b.amount)) * 100), 100) : 0,
    remaining: Number(b.amount) - Number(b.spent || 0),
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + Number(b.spent || 0), 0) || 0;
  const overBudgetCount = budgetsWithUtilization.filter(b => b.pct >= 90).length;
  const onTrackCount = budgetsWithUtilization.filter(b => b.pct < 75).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Budgets</h1>
          <p className="text-ink-muted mt-2">Budget planning and utilization tracking</p>
        </div>
        <Button onClick={() => router.push('/finance/budgets/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Total Budget</span>
          </div>
          <p className="text-3xl font-bold text-ink">${(totalBudget / 1000).toFixed(1)}K</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-4 w-4 text-warning" />
            <span className="text-sm text-ink-muted">Total Spent</span>
          </div>
          <p className="text-3xl font-bold text-ink">${(totalSpent / 1000).toFixed(1)}K</p>
          <p className="text-xs text-ink-muted mt-1">
            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% utilized
          </p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm text-ink-muted">Over Budget</span>
          </div>
          <p className="text-3xl font-bold text-ink">{overBudgetCount}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">On Track</span>
          </div>
          <p className="text-3xl font-bold text-ink">{onTrackCount}</p>
        </Card>
      </div>

      {budgetsWithUtilization.length === 0 ? (
        <Card className="p-12 bg-surface border border-border">
          <EmptyState
            icon={<Wallet className="h-16 w-16" />}
            title="No budgets configured"
            description="Create your first budget to start tracking spending"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgetsWithUtilization.map((budget) => (
            <Card
              key={budget.id}
              className="p-6 bg-surface border border-border cursor-pointer hover:border-brand/40 transition-all"
              onClick={() => router.push(`/finance/budgets/${budget.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-ink text-lg">{budget.name}</h3>
                  {budget.description && (
                    <p className="text-sm text-ink-muted mt-1">{budget.description}</p>
                  )}
                </div>
                <Badge variant={
                  budget.pct >= 90 ? 'error' :
                  budget.pct >= 75 ? 'warning' : 'success'
                }>
                  {budget.pct}%
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <Progress value={budget.pct} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">
                    ${((budget.spent || 0) / 1000).toFixed(1)}K spent
                  </span>
                  <span className="text-ink-muted">
                    ${(budget.amount / 1000).toFixed(1)}K total
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-ink-muted">Remaining</p>
                  <p className="font-semibold text-ink">
                    ${(budget.remaining / 1000).toFixed(1)}K
                  </p>
                </div>
                {budget.period && (
                  <div className="text-right">
                    <p className="text-xs text-ink-muted">Period</p>
                    <p className="font-semibold text-ink">{budget.period}</p>
                  </div>
                )}
              </div>

              {budget.pct >= 90 && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-danger-soft border border-danger/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-danger-text">Budget exceeded</p>
                    <p className="text-xs text-ink-muted mt-1">This budget needs immediate attention</p>
                  </div>
                </div>
              )}

              {budget.pct >= 75 && budget.pct < 90 && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-warning-soft border border-warning/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warning-text">Approaching limit</p>
                    <p className="text-xs text-ink-muted mt-1">Monitor spending closely</p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6 bg-surface border border-border">
        <h3 className="text-sm font-medium text-ink mb-4">Budget Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Overall Utilization</span>
              <span className="text-xs text-ink-muted">
                {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
              </span>
            </div>
            <Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Budget Categories</span>
              <span className="text-xs text-ink-muted">{budgets?.length || 0} active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-ink">{onTrackCount} on track</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-secondary">Attention Required</span>
              <span className="text-xs text-danger">{overBudgetCount} budgets</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" />
              <span className="text-sm text-ink">Over 90% utilized</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
