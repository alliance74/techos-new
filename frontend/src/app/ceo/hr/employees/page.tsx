'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { EmptyState } from '@/components/UI/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/UI/Table';
import { Pagination } from '@/components/UI/Pagination';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { Modal } from '@/components/UI/Modal';
import { useEmployees } from '@/hooks/useHR';
import { useCreateUser } from '@/hooks/useUsers';
import { useClientPagination } from '@/hooks/useClientPagination';
import { UserRole } from '@/types/roles';
import {
  Users,
  UserPlus,
  Search,
  ChevronRight,
  Mail,
  Phone,
  Filter,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  Shield,
} from 'lucide-react';

function formatRole(role?: string) {
  if (!role) return '—';
  return role.replace(/_/g, ' ');
}

const ROLE_OPTIONS = [
  { value: UserRole.CTO, label: 'CTO' },
  { value: UserRole.CISO, label: 'CISO' },
  { value: UserRole.FINANCE, label: 'Finance' },
  { value: UserRole.SOFTWARE_ENGINEER, label: 'Software Engineer' },
  { value: UserRole.UI_UX_DESIGNER, label: 'UI/UX Designer' },
  { value: UserRole.CUSTOMER_SUPPORT, label: 'Customer Support' },
];

export default function EmployeesPage() {
  const router = useRouter();
  const { data: employees, isLoading } = useEmployees();
  const inviteUser = useCreateUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [issuedPassword, setIssuedPassword] = useState('');
  const [issuedEmail, setIssuedEmail] = useState('');
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SOFTWARE_ENGINEER);
  const [employmentType, setEmploymentType] = useState('full-time');
  const [status, setStatus] = useState('active');
  const [salary, setSalary] = useState('');

  const filteredEmployees = useMemo(
    () =>
      employees?.filter((emp) => {
        const fullName = `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          emp.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.user?.role?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
        return matchesSearch && matchesStatus;
      }) || [],
    [employees, searchTerm, statusFilter],
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(filteredEmployees, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'on_leave':
        return <Badge variant="warning">On Leave</Badge>;
      case 'terminated':
        return <Badge variant="error">Terminated</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const resetInviteForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setEmailError('');
    setRole(UserRole.SOFTWARE_ENGINEER);
    setEmploymentType('full-time');
    setStatus('active');
    setSalary('');
  };

  const closeCredentials = () => {
    setCredentialsOpen(false);
    setIssuedPassword('');
    setIssuedEmail('');
    setPasswordRevealed(false);
    setPasswordCopied(false);
  };

  const isDuplicateEmail = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return (
      employees?.some((emp) => emp.user?.email?.trim().toLowerCase() === normalized) ?? false
    );
  };

  const handleInvite = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !firstName.trim() || !lastName.trim()) {
      toast.error('First name, last name, and email are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (isDuplicateEmail(trimmedEmail)) {
      setEmailError('A user with this email has already been invited');
      toast.error('A user with this email has already been invited');
      return;
    }

    try {
      const result = await inviteUser.mutateAsync({
        email: trimmedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        employment_type: employmentType,
        status,
        ...(salary.trim() ? { salary: Number(salary) } : {}),
      });

      setIssuedEmail(trimmedEmail);
      setIssuedPassword(result.temporary_password);
      setPasswordRevealed(false);
      setPasswordCopied(false);
      setInviteOpen(false);
      setCredentialsOpen(true);
      resetInviteForm();
    } catch (error: any) {
      const raw = error?.response?.data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw;
      if (error?.response?.status === 409 || String(message || '').toLowerCase().includes('already')) {
        setEmailError(message || 'A user with this email has already been invited');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Employees</h1>
          <p className="text-ink-muted mt-2">
            Invite people with a role and credentials ({filteredEmployees.length} total)
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
              className="pl-10 bg-bg-muted border-border text-ink placeholder-gray-500"
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
              className="bg-bg-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/40/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No employees yet"
            description="Invite your first teammate and share their login credentials."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer group/row"
                    onClick={() => router.push(`/ceo/hr/employees/${emp.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/ceo/hr/employees/${emp.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`View ${emp.user?.first_name} ${emp.user?.last_name}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-mist flex items-center justify-center text-brand font-semibold text-sm">
                          {emp.user?.first_name?.[0]}
                          {emp.user?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-ink group-hover/row:text-brand">
                            {emp.user?.first_name} {emp.user?.last_name}
                          </p>
                          <span className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {emp.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{formatRole(emp.user?.role)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(emp.status)}</TableCell>
                    <TableCell>
                      <p className="text-ink-secondary">
                        {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : '—'}
                      </p>
                    </TableCell>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <Shield className="h-8 w-8 text-ink mb-4" />
          <h3 className="font-semibold text-ink mb-1">Roles</h3>
          <p className="text-2xl font-bold text-ink">
            {new Set((employees || []).map((e) => e.user?.role).filter(Boolean)).size}
          </p>
          <p className="text-sm text-ink-muted mt-1">Assigned across team</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <UserPlus className="h-8 w-8 text-ink mb-4" />
          <h3 className="font-semibold text-ink mb-1">New This Month</h3>
          <p className="text-2xl font-bold text-ink">
            {employees?.filter((e) => {
              const hireDate = new Date(e.hire_date);
              const now = new Date();
              return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
            }).length || 0}
          </p>
          <p className="text-sm text-ink-muted mt-1">Recent invites</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Phone className="h-8 w-8 text-ink mb-4" />
          <h3 className="font-semibold text-ink mb-1">Active</h3>
          <p className="text-2xl font-bold text-ink">
            {employees?.filter((e) => e.status === 'active').length || 0}
          </p>
          <p className="text-sm text-ink-muted mt-1">Currently active</p>
        </Card>
      </div>

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite User" size="md">
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Assign a role and we&apos;ll generate a one-time password for this teammate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <div className="md:col-span-2">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                onBlur={() => {
                  if (email.trim() && isDuplicateEmail(email)) {
                    setEmailError('A user with this email has already been invited');
                  }
                }}
                error={emailError}
                required
                autoComplete="email"
              />
            </div>
            <div className="md:col-span-2">
              <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} required>
                {ROLE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              label="Employment type"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              <option value="full-time">Full time</option>
              <option value="part-time">Part time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </Select>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="terminated">Terminated</option>
            </Select>
            <div className="md:col-span-2">
              <Input
                label="Salary (annual)"
                type="number"
                min="0"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button loading={inviteUser.isPending} onClick={handleInvite}>
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={credentialsOpen} onClose={closeCredentials} title="One-time password" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-ink-secondary">
              This password is shown once. Copy it now — you won&apos;t be able to view it again.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-muted p-4 space-y-4">
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide">Email</p>
              <p className="font-medium text-ink mt-1">{issuedEmail}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-3.5 w-3.5 text-ink-muted" />
                <p className="text-xs text-ink-muted uppercase tracking-wide">Temporary password</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-sm text-ink tracking-wide break-all">
                  {passwordRevealed ? issuedPassword : '•'.repeat(Math.max(12, issuedPassword.length || 12))}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPasswordRevealed((v) => !v)}
                  aria-label={passwordRevealed ? 'Hide password' : 'Reveal password'}
                >
                  {passwordRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(issuedPassword);
                    setPasswordCopied(true);
                    toast.success('Password copied');
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {passwordCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={closeCredentials}>Done — I saved it</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
