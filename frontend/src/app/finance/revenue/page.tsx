'use client';

import { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Progress } from '@/components/UI/Progress';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Users,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Mock revenue data
const revenueData = {
  current_month: 145000,
  last_month: 132000,
  ytd: 1250000,
  annual_target: 2000000,
  growth_rate: 9.8,
  mrr: 125000,
  arr: 1500000,
};

const revenueStreams = [
  { name: 'Product Sales', amount: 85000, percentage: 58.6, trend: 'up', change: '+12%' },
  { name: 'Subscriptions', amount: 35000, percentage: 24.1, trend: 'up', change: '+8%' },
  { name: 'Services', amount: 18000, percentage: 12.4, trend: 'down', change: '-3%' },
  { name: 'Licensing', amount: 7000, percentage: 4.8, trend: 'up', change: '+15%' },
];

const topCustomers = [
  { name: 'Acme Corporation', revenue: 25000, growth: 15 },
  { name: 'Tech Solutions Inc', revenue: 18500, growth: 22 },
  { name: 'Global Enterprises', revenue: 16200, growth: 8 },
  { name: 'Innovation Labs', revenue: 12800, growth: -5 },
  { name: 'Digital Ventures', revenue: 10500, growth: 18 },
];

const monthlyRevenue = [
  { month: 'Jan', revenue: 118000 },
  { month: 'Feb', revenue: 122000 },
  { month: 'Mar', revenue: 135000 },
  { month: 'Apr', revenue: 128000 },
  { month: 'May', revenue: 142000 },
  { month: 'Jun', revenue: 138000 },
  { month: 'Jul', revenue: 152000 },
  { month: 'Aug', revenue: 145000 },
];

export default function RevenuePage() {
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const monthGrowth = ((revenueData.current_month - revenueData.last_month) / revenueData.last_month * 100).toFixed(1);
  const targetProgress = (revenueData.ytd / revenueData.annual_target * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Revenue</h1>
          <p className="text-ink-muted mt-2">Revenue streams and performance analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20">
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-5 w-5 text-brand" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">Current Month</p>
          <h3 className="text-3xl font-bold text-ink mt-2">${(revenueData.current_month / 1000).toFixed(0)}K</h3>
          <p className="text-xs text-success mt-2">+{monthGrowth}% from last month</p>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <Target className="h-5 w-5 text-success" />
            <ArrowUpRight className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">YTD Revenue</p>
          <h3 className="text-3xl font-bold text-ink mt-2">${(revenueData.ytd / 1000).toFixed(0)}K</h3>
          <p className="text-xs text-ink-muted mt-2">{targetProgress}% of annual target</p>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-5 w-5 text-info" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">MRR</p>
          <h3 className="text-3xl font-bold text-ink mt-2">${(revenueData.mrr / 1000).toFixed(0)}K</h3>
          <p className="text-xs text-success mt-2">+{revenueData.growth_rate}% growth</p>
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="h-5 w-5 text-warning" />
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-sm text-ink-muted">ARR</p>
          <h3 className="text-3xl font-bold text-ink mt-2">${(revenueData.arr / 1000).toFixed(0)}K</h3>
          <p className="text-xs text-success mt-2">Annual recurring revenue</p>
        </Card>
      </div>

      {/* Annual Target Progress */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-ink">Annual Revenue Target</h3>
            <p className="text-sm text-ink-muted mt-1">Progress towards ${(revenueData.annual_target / 1000).toFixed(0)}K goal</p>
          </div>
          <Badge variant={Number(targetProgress) >= 75 ? 'success' : Number(targetProgress) >= 50 ? 'info' : 'warning'}>
            {targetProgress}%
          </Badge>
        </div>
        <Progress value={Number(targetProgress)} />
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-ink-secondary">
            ${(revenueData.ytd / 1000).toFixed(0)}K achieved
          </span>
          <span className="text-ink-muted">
            ${((revenueData.annual_target - revenueData.ytd) / 1000).toFixed(0)}K remaining
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Streams */}
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Revenue Streams</h2>
          </div>
          <div className="space-y-4">
            {revenueStreams.map((stream) => (
              <div key={stream.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{stream.name}</span>
                  <div className="flex items-center gap-2">
                    {stream.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-danger" />
                    )}
                    <span className={`text-xs ${stream.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                      {stream.change}
                    </span>
                  </div>
                </div>
                <Progress value={stream.percentage} />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-secondary">${(stream.amount / 1000).toFixed(1)}K</span>
                  <span className="text-ink-muted">{stream.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-ink">Top Customers by Revenue</h2>
          </div>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={customer.name} className="flex items-center justify-between p-3 bg-bg-muted border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-soft rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-brand">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-ink text-sm">{customer.name}</p>
                    <p className="text-xs text-ink-muted">${(customer.revenue / 1000).toFixed(1)}K</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {customer.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  )}
                  <span className={`text-xs ${customer.growth >= 0 ? 'text-success' : 'text-danger'}`}>
                    {customer.growth >= 0 ? '+' : ''}{customer.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card className="p-6 bg-surface border border-border">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-ink">Monthly Revenue Trend</h2>
        </div>
        <div className="space-y-2">
          {monthlyRevenue.map((item, index) => {
            const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
            const width = (item.revenue / maxRevenue * 100);
            const prevRevenue = index > 0 ? monthlyRevenue[index - 1].revenue : item.revenue;
            const growth = ((item.revenue - prevRevenue) / prevRevenue * 100).toFixed(1);
            
            return (
              <div key={item.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary w-12">{item.month}</span>
                  <span className="text-ink font-medium">${(item.revenue / 1000).toFixed(0)}K</span>
                  {index > 0 && (
                    <span className={`text-xs ${Number(growth) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {Number(growth) >= 0 ? '+' : ''}{growth}%
                    </span>
                  )}
                </div>
                <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand rounded-full transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
