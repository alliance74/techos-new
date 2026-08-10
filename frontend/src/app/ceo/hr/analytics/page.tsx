'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { useHrStats, useEmployees, useLeaveRequests } from '@/hooks/useHR';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import {
  Users,
  UserPlus,
  TrendingUp,
  CalendarClock,
  Shield,
} from 'lucide-react';

export default function HRAnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useHrStats();
  const { data: employees, isLoading: empLoading } = useEmployees();
  const { data: leaves, isLoading: leaveLoading } = useLeaveRequests();

  const isLoading = statsLoading || empLoading || leaveLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const headcountByRole: Record<string, number> = {};
  employees?.forEach((emp) => {
    const role = (emp.user?.role || 'unassigned').replace(/_/g, ' ');
    headcountByRole[role] = (headcountByRole[role] || 0) + 1;
  });

  const roleData = Object.entries(headcountByRole).map(([name, count]) => ({
    name,
    count,
    pct: Math.round((count / (employees?.length || 1)) * 100),
  }));

  const totalEmployees = employees?.length || 0;
  const leaveTaken = leaves?.filter((l) => l.status === 'approved').length || 0;
  const pendingLeaves = leaves?.filter((l) => l.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">HR Analytics</h1>
        <p className="text-ink-muted mt-2">Workforce metrics by role and HR performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <Users className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Total Headcount</p>
          <p className="text-3xl font-bold text-ink mt-1">{totalEmployees}</p>
          <p className="text-sm text-ink mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Live roster
          </p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Shield className="h-8 w-8 text-brand mb-3" />
          <p className="text-sm text-ink-muted">Roles in use</p>
          <p className="text-3xl font-bold text-ink mt-1">{roleData.length}</p>
          <p className="text-sm text-ink-muted mt-2">Across organization</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <UserPlus className="h-8 w-8 text-success mb-3" />
          <p className="text-sm text-ink-muted">Active staff</p>
          <p className="text-3xl font-bold text-ink mt-1">
            {employees?.filter((e) => e.status === 'active').length || 0}
          </p>
          <p className="text-sm text-success mt-2">Current active</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <CalendarClock className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Leaves Approved</p>
          <p className="text-3xl font-bold text-ink mt-1">{leaveTaken}</p>
          <p className="text-sm text-ink-muted mt-2">{pendingLeaves} pending review</p>
        </Card>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5" /> Headcount by Role
        </h2>
        <div className="space-y-4">
          {roleData.length === 0 ? (
            <p className="text-sm text-ink-muted">Invite users to see role distribution.</p>
          ) : (
            roleData.map((role) => (
              <div key={role.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink font-medium capitalize">{role.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-muted">{role.count} people</span>
                    <Badge variant="default">{role.pct}%</Badge>
                  </div>
                </div>
                <div className="w-full bg-bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-brand-mist" style={{ width: `${role.pct}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {stats && (
        <Card className="p-6 bg-surface border border-border">
          <h2 className="text-lg font-semibold text-ink mb-2">Summary</h2>
          <p className="text-sm text-ink-muted">Workforce is organized by roles only.</p>
        </Card>
      )}
    </div>
  );
}
