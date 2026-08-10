'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  UserPlus,
  CheckCircle,
  Clock,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useEmployees } from '@/hooks/useHR';
import { useEntityList } from '@/hooks/useEntityApi';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';

export default function OnboardingPage() {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: onboardingTasks = [], isLoading: tasksLoading } = useEntityList('onboardingTasks');

  const recentHires = [...employees]
    ?.sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
    .slice(0, 6);
  const activeTasks = onboardingTasks.filter((task) => !['completed', 'done'].includes(task.status));
  const completedTasks = onboardingTasks.filter((task) => ['completed', 'done'].includes(task.status));
  const thisMonth = new Date();
  const newThisMonth = employees.filter((employee) => {
    const hireDate = new Date(employee.hire_date);
    return hireDate.getMonth() === thisMonth.getMonth() && hireDate.getFullYear() === thisMonth.getFullYear();
  }).length;

  if (employeesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Onboarding</h1>
        <p className="text-ink-muted mt-2">New hire onboarding and integration process</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <UserPlus className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Active Onboarding</p>
          <p className="text-3xl font-bold text-ink mt-1">{activeTasks.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <CheckCircle className="h-8 w-8 text-success mb-3" />
          <p className="text-sm text-ink-muted">Completed This Quarter</p>
          <p className="text-3xl font-bold text-ink mt-1">{completedTasks.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Clock className="h-8 w-8 text-warning mb-3" />
          <p className="text-sm text-ink-muted">Onboarding Tasks</p>
          <p className="text-3xl font-bold text-ink mt-1">{onboardingTasks.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Users className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">New This Month</p>
          <p className="text-3xl font-bold text-ink mt-1">{newThisMonth}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 bg-surface border border-border">
          <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
            <Users className="h-5 w-5" /> Recent New Hires
          </h2>
          {recentHires.length === 0 ? (
            <div className="text-center py-8 text-ink-muted">
              <UserPlus className="h-12 w-12 mx-auto mb-2" />
              <p>No recent hires</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentHires.map(emp => {
                const employeeTasks = onboardingTasks.filter((task) => task.metadata?.employeeId === emp.id);
                const completedEmployeeTasks = employeeTasks.filter((task) => ['completed', 'done'].includes(task.status)).length;
                const pct = employeeTasks.length ? Math.round((completedEmployeeTasks / employeeTasks.length) * 100) : 0;
                const status = employeeTasks.length === 0 ? 'not_started' : pct === 100 ? 'completed' : 'in_progress';
                return (
                  <div key={emp.id} className="p-4 bg-bg-muted border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-mist flex items-center justify-center text-brand font-semibold text-sm">
                          {emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-ink">
                            {emp.user?.first_name} {emp.user?.last_name}
                          </p>
                          <p className="text-xs text-ink-muted capitalize">
                            {(emp.user?.role || emp.position || '—').replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={status === 'completed' ? 'success' : status === 'in_progress' ? 'info' : 'default'}>
                        {status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'No tasks'}
                      </Badge>
                    </div>
                    <div className="w-full bg-bg-muted rounded-full h-1.5 mb-2">
                      <div className="bg-brand-mist h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-ink-muted">{pct}% · {completedEmployeeTasks}/{employeeTasks.length} tasks · Hired {new Date(emp.hire_date).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Onboarding Checklist
          </h2>
          {onboardingTasks.length === 0 ? (
            <div className="text-center py-8 text-ink-muted">
              <ClipboardList className="h-12 w-12 mx-auto mb-2" />
              <p>No onboarding tasks yet</p>
            </div>
          ) : <div className="space-y-3">
            {onboardingTasks.map((task, i) => {
              const completed = ['completed', 'done'].includes(task.status);
              return <div key={task.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    completed ? 'bg-brand text-ink-inverse' : 'bg-bg-muted text-ink-muted'
                  }`}>
                    {completed ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < onboardingTasks.length - 1 && (
                    <div className={`w-0.5 h-full mt-1 ${completed ? 'bg-brand-mist' : 'bg-bg-muted'}`} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className={`font-medium ${completed ? 'text-ink' : 'text-ink-muted'}`}>{task.title}</p>
                  <p className="text-xs text-ink-muted">{task.description || task.owner || 'No description'}</p>
                </div>
              </div>;
            })}
          </div>}
        </Card>
      </div>
    </div>
  );
}
