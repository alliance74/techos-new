'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Briefcase,
  User,
  Hash,
  Edit,
  Trash2,
  FileText,
  Shield,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { Modal } from '@/components/UI/Modal';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { useDeleteEmployee, useEmployee, useEmployeeActivity, useUpdateEmployee } from '@/hooks/useHR';

function formatRoleLabel(role?: string | null) {
  if (!role) return '';
  return role.replace(/_/g, ' ');
}

function formatRelativeDate(value?: string | Date) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  return date.toLocaleDateString();
}

type ActivityItem = {
  id: string;
  title: string;
  time: string;
  meta?: string;
  tone: 'success' | 'warning' | 'info' | 'danger';
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: employee, isLoading, isError, error } = useEmployee(id);
  const activityQuery = useEmployeeActivity(id);
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [editOpen, setEditOpen] = useState(false);
  const [position, setPosition] = useState('');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (!employee) return;
    setPosition(employee.position || '');
    setEmploymentType(employee.employment_type || 'full-time');
    setSalary(employee.salary != null ? String(employee.salary) : '');
    setStatus(employee.status || 'active');
    setStartDate(employee.hire_date || employee.start_date || '');
  }, [employee]);

  const displayName = useMemo(() => {
    const first = employee?.user?.first_name?.trim() || '';
    const last = employee?.user?.last_name?.trim() || '';
    const full = `${first} ${last}`.trim();
    return full || employee?.user?.email || 'Employee';
  }, [employee]);

  const initials = useMemo(() => {
    const first = employee?.user?.first_name?.[0] || '';
    const last = employee?.user?.last_name?.[0] || '';
    const chars = `${first}${last}`.toUpperCase();
    if (chars) return chars;
    return (employee?.user?.email?.[0] || '?').toUpperCase();
  }, [employee]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    return ((activityQuery.data || []) as Array<{
      id?: string;
      action?: string;
      summary?: string;
      entity_type?: string;
      created_at?: string;
    }>).map((a, i) => {
      const summary = (a.summary || '').trim();
      const action = (a.action || '').trim();
      const type = (a.entity_type || '').replace(/_/g, ' ');
      const alreadyHasVerb = /^(created|updated|deleted|invited|added|removed|changed|submitted|requested)\b/i.test(
        summary,
      );
      const title = summary
        ? alreadyHasVerb
          ? summary
          : action
            ? `${action} ${summary}`
            : summary
        : action
          ? `${action} ${type}`.trim()
          : 'Activity';
      const tone =
        action === 'deleted'
          ? 'danger'
          : action === 'created' || action === 'submitted' || action === 'requested'
            ? 'success'
            : 'info';
      return {
        id: a.id || `act-${i}`,
        title,
        time: formatRelativeDate(a.created_at),
        meta: type ? type : undefined,
        tone: tone as ActivityItem['tone'],
      };
    });
  }, [activityQuery.data]);

  const getStatusBadge = (value?: string) => {
    switch (value) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'on_leave':
        return <Badge variant="warning">On Leave</Badge>;
      case 'terminated':
        return <Badge variant="error">Terminated</Badge>;
      default:
        return <Badge variant="default">{value || '—'}</Badge>;
    }
  };

  const getActivityDot = (tone: ActivityItem['tone']) => {
    if (tone === 'success') return 'bg-green-400';
    if (tone === 'warning') return 'bg-yellow-400';
    if (tone === 'danger') return 'bg-red-400';
    return 'bg-blue-400';
  };

  const handleSave = async () => {
    if (!employee) return;
    await updateEmployee.mutateAsync({
      id: employee.id,
      data: {
        position: position.trim() || employee.position,
        employment_type: employmentType,
        status: status as 'active' | 'on_leave' | 'terminated',
        start_date: startDate || employee.hire_date,
        ...(salary.trim() ? { salary: Number(salary) } : {}),
      },
    });
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!employee) return;
    const confirmed = window.confirm(
      `Remove ${displayName} from the employee directory? Their user login is not deleted.`,
    );
    if (!confirmed) return;
    await deleteEmployee.mutateAsync(employee.id);
    router.push('/ceo/hr/employees');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/ceo/hr/employees')}
          className="p-2 hover:bg-bg-muted rounded-lg text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <EmptyState
          icon={<User className="h-12 w-12" />}
          title="Employee not found"
          description={
            (error as any)?.response?.data?.message ||
            'This employee record may have been removed. Invite someone from HR Employees to create a new profile.'
          }
          action={{
            label: 'Back to employees',
            onClick: () => router.push('/ceo/hr/employees'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/ceo/hr/employees')}
          className="p-2 hover:bg-bg-muted rounded-lg text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-ink">{displayName}</h1>
          <p className="text-ink-muted mt-1 capitalize">
            {formatRoleLabel(employee.user?.role) || employee.position || 'Team member'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-24 w-24 rounded-full bg-brand-mist flex items-center justify-center text-brand font-bold text-2xl mb-4">
              {initials}
            </div>
            <h2 className="text-xl font-semibold text-ink">{displayName}</h2>
            <p className="text-ink-muted mt-1 capitalize">
              {formatRoleLabel(employee.user?.role) || employee.position}
            </p>
            <div className="mt-3">{getStatusBadge(employee.status)}</div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted flex items-center gap-2 shrink-0">
                <Mail className="h-4 w-4" /> Email
              </span>
              <span className="text-sm text-ink text-right break-all">
                {employee.user?.email || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted flex items-center gap-2">
                <Hash className="h-4 w-4" /> Employee #
              </span>
              <span className="text-sm text-ink">{employee.employee_number || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted flex items-center gap-2">
                <Shield className="h-4 w-4" /> Role
              </span>
              <span className="text-sm text-ink capitalize">
                {formatRoleLabel(employee.user?.role) || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Hire Date
              </span>
              <span className="text-sm text-ink">
                {employee.hire_date
                  ? new Date(employee.hire_date).toLocaleDateString()
                  : '—'}
              </span>
            </div>
            {employee.salary != null && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-muted flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Salary
                </span>
                <span className="text-sm text-ink">
                  ${Number(employee.salary).toLocaleString()}/yr
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setEditOpen(true)}
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteEmployee.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-surface border border-border">
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-bg-muted border border-border rounded-lg">
                <p className="text-xs text-ink-muted mb-1">Role</p>
                <p className="text-ink font-medium capitalize">
                  {formatRoleLabel(employee.user?.role) || '—'}
                </p>
              </div>
              <div className="p-4 bg-bg-muted border border-border rounded-lg">
                <p className="text-xs text-ink-muted mb-1">Position</p>
                <p className="text-ink font-medium">{employee.position || '—'}</p>
              </div>
              <div className="p-4 bg-bg-muted border border-border rounded-lg">
                <p className="text-xs text-ink-muted mb-1">Employment type</p>
                <p className="text-ink font-medium capitalize">
                  {(employee.employment_type || 'full-time').replace(/-/g, ' ')}
                </p>
              </div>
              <div className="p-4 bg-bg-muted border border-border rounded-lg">
                <p className="text-xs text-ink-muted mb-1">Employee Number</p>
                <p className="text-ink font-medium">{employee.employee_number || '—'}</p>
              </div>
              <div className="p-4 bg-bg-muted border border-border rounded-lg">
                <p className="text-xs text-ink-muted mb-1">Manager</p>
                <p className="text-ink font-medium">
                  {employee.manager
                    ? `${employee.manager.first_name || ''} ${employee.manager.last_name || ''}`.trim() ||
                      employee.manager.email
                    : '—'}
                </p>
              </div>
              <div className="p-4 bg-bg-muted border border-border rounded-lg">
                <p className="text-xs text-ink-muted mb-1">Status</p>
                {getStatusBadge(employee.status)}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-surface border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Clock className="h-5 w-5" /> Recent activity
              </h3>
            </div>
            {activityQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentActivity.length === 0 ? (
              <EmptyState
                className="py-8"
                title="No recent activity"
                description="System logs of this person's work (tasks, deals, invoices, goals, leave) will appear here."
              />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-bg-muted border border-border rounded-lg"
                  >
                    <div className={`h-2 w-2 rounded-full ${getActivityDot(activity.tone)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink capitalize">{activity.title}</p>
                      <p className="text-xs text-ink-muted">
                        {activity.meta ? `${activity.meta} · ` : ''}
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit employee" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-ink-secondary mb-1">Position</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-ink-secondary mb-1">Employment type</label>
            <Select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              <option value="full-time">Full time</option>
              <option value="part-time">Part time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-ink-secondary mb-1">Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="terminated">Terminated</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-ink-secondary mb-1">Hire date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-secondary mb-1">Salary (annual)</label>
            <Input
              type="number"
              min="0"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateEmployee.isPending}>
              {updateEmployee.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
