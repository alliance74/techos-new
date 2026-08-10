'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { useEmployees, useLeaveRequests, useHrStats } from '@/hooks/useHR';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  CalendarClock,
  TrendingUp,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  DollarSign
} from 'lucide-react';

export default function HROverviewPage() {
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: leaveRequests, isLoading: leavesLoading } = useLeaveRequests();
  const { data: hrStats, isLoading: statsLoading } = useHrStats();

  const isLoading = employeesLoading || leavesLoading || statsLoading;

  const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;
  const onLeaveEmployees = employees?.filter(e => e.status === 'on_leave').length || 0;
  const pendingLeaves = leaveRequests?.filter(l => l.status === 'pending').length || 0;
  const approvedLeaves = leaveRequests?.filter(l => l.status === 'approved').length || 0;

  const stats = [
    {
      title: 'Total Employees',
      value: hrStats?.total_employees ?? hrStats?.totalEmployees ?? employees?.length ?? 0,
      change: 'Live roster',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Active Staff',
      value: hrStats?.activeEmployees ?? activeEmployees,
      change: `${onLeaveEmployees} on leave`,
      trend: 'neutral',
      icon: UserCheck,
    },
    {
      title: 'Pending Requests',
      value: hrStats?.pending_leave_requests ?? hrStats?.pendingLeaves ?? pendingLeaves,
      change: 'Requires attention',
      trend: pendingLeaves > 0 ? 'warning' : 'up',
      icon: Clock,
    },
    {
      title: 'Roles in use',
      value: hrStats?.role_count ?? new Set((employees || []).map((e) => e.user?.role).filter(Boolean)).size,
      change: 'Role-based access',
      trend: 'neutral',
      icon: Briefcase,
    },
  ];

  const recentHires = employees
    ?.sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
    .slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">HR Overview</h1>
          <p className="text-ink-muted mt-2">Human resources dashboard and workforce management</p>
        </div>
        <Link
          href="/ceo/hr/employees"
          className="px-4 py-2 bg-brand text-ink-inverse text-sm font-medium rounded-xl hover:bg-brand-deep transition-colors"
        >
          Manage Employees
        </Link>
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
                    stat.trend === 'up' ? 'text-ink' : 
                    stat.trend === 'warning' ? 'text-warning' : 'text-ink-muted'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.trend === 'warning' ? 'bg-warning-soft' : 'bg-brand-mist'
                }`}>
                  <Icon className={`h-5 w-5 ${stat.trend === 'warning' ? 'text-warning' : 'text-brand'}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-ink" />
              <h2 className="text-lg font-semibold text-ink">Recent Hires</h2>
            </div>
            <Link href="/ceo/hr/onboarding" className="text-sm text-ink-muted hover:text-ink">
              View All
            </Link>
          </div>
          {recentHires.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-12 w-12" />}
              title="No recent hires"
              description="New employees will appear here"
            />
          ) : (
            <div className="space-y-4">
              {recentHires.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-bg-muted border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-brand-mist flex items-center justify-center text-brand font-semibold text-sm">
                      {emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {emp.user?.first_name} {emp.user?.last_name}
                      </p>
                      <p className="text-sm text-ink-muted capitalize">
                        {(emp.user?.role || emp.position || '—').replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">
                      {emp.status === 'active' ? 'Active' : emp.status}
                    </Badge>
                    <p className="text-xs text-ink-muted mt-1">
                      Hired {new Date(emp.hire_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <CalendarClock className="h-5 w-5 text-ink" />
            <h2 className="text-lg font-semibold text-ink">Leave Requests</h2>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg-muted">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-ink-secondary">Pending</span>
              </div>
              <Badge variant="warning">{pendingLeaves}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg-muted">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-ink-secondary">Approved</span>
              </div>
              <Badge variant="success">{approvedLeaves}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg-muted">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-ink-muted" />
                <span className="text-sm text-ink-secondary">Total Requests</span>
              </div>
              <Badge variant="default">{leaveRequests?.length || 0}</Badge>
            </div>
          </div>
          <Link
            href="/ceo/hr/leave-requests"
            className="block w-full py-2 text-center text-sm text-ink-secondary border border-border-strong rounded-lg hover:bg-bg-muted"
          >
            Review Requests
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/ceo/hr/recruitment" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-border-strong transition-all h-full">
            <UserPlus className="h-8 w-8 text-ink mb-4" />
            <h3 className="font-semibold text-ink mb-2">Recruitment</h3>
            <p className="text-sm text-ink-muted">Manage job postings and candidates</p>
          </Card>
        </Link>
        <Link href="/ceo/hr/performance" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-border-strong transition-all h-full">
            <TrendingUp className="h-8 w-8 text-ink mb-4" />
            <h3 className="font-semibold text-ink mb-2">Performance</h3>
            <p className="text-sm text-ink-muted">Reviews and performance tracking</p>
          </Card>
        </Link>
        <Link href="/ceo/hr/payroll" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-border-strong transition-all h-full">
            <DollarSign className="h-8 w-8 text-ink mb-4" />
            <h3 className="font-semibold text-ink mb-2">Payroll</h3>
            <p className="text-sm text-ink-muted">Salary and compensation management</p>
          </Card>
        </Link>
        <Link href="/ceo/hr/benefits" className="block">
          <Card className="p-6 bg-surface border border-border hover:border-border-strong transition-all h-full">
            <CheckCircle className="h-8 w-8 text-ink mb-4" />
            <h3 className="font-semibold text-ink mb-2">Benefits</h3>
            <p className="text-sm text-ink-muted">Employee benefits and perks</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
