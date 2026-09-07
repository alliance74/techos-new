'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Edit2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { useUsers, useUpdateUser, useResetUserPassword, useCreateUser } from '@/hooks/useUsers';
import { useDeleteEntity } from '@/hooks/useEntityApi';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { Button } from '@/components/UI/Button';
import { Avatar } from '@/components/UI/Avatar';

const ROLES = [
  { value: 'ceo', label: 'CEO' },
  { value: 'cto', label: 'CTO' },
  { value: 'ciso', label: 'CISO' },
  { value: 'finance', label: 'Finance' },
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'ui_ux_designer', label: 'UI/UX Designer' },
  { value: 'customer_support', label: 'Customer Support' },
];

const DEPARTMENTS = [
  'Engineering', 'Design', 'Finance', 'Sales', 'Marketing',
  'Operations', 'HR', 'Legal', 'Customer Support', 'Product', 'Security',
];

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
};

// ─── Password strength helper ───────────────────────────────────────────────
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-danger' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-warning' };
  return { score, label: 'Strong', color: 'bg-success' };
}

// ─── Edit User Modal ─────────────────────────────────────────────────────────
function EditUserModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    role: user.role || 'software_engineer',
    department: user.department || '',
    status: user.status ?? (user.is_active !== false ? 'active' : 'inactive'),
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    await updateUser.mutateAsync({
      id: user.id,
      data: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        department: form.department,
        status: form.status,
      },
    });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit User" size="lg">
      <div className="space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 rounded-xl bg-surface-hover/60 p-4">
          <Avatar
            name={`${form.first_name} ${form.last_name}`.trim() || user.email}
            size="lg"
          />
          <div>
            <p className="font-semibold text-ink">
              {form.first_name} {form.last_name}
            </p>
            <p className="text-sm text-ink-secondary">{form.email}</p>
          </div>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
          />
        </div>

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />

        {/* Role + Department */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>

          <Select
            label="Department"
            value={form.department}
            onChange={(e) => set('department', e.target.value)}
          >
            <option value="">— No department —</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        {/* Status */}
        <Select
          label="Account status"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </Select>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={updateUser.isPending} onClick={() => void handleSave()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Reset Password Modal ────────────────────────────────────────────────────
function ResetPasswordModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const resetPassword = useResetUserPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = passwordStrength(password);
  const matches = password.length > 0 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && matches;

  const handleReset = async () => {
    if (!canSubmit) return;
    await resetPassword.mutateAsync({ id: user.id, password });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Reset Password" size="md">
      <div className="space-y-5">
        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning-text" />
          <div>
            <p className="text-sm font-medium text-warning-text">
              Admin password reset for{' '}
              <strong>
                {user.first_name} {user.last_name}
              </strong>
            </p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              This overrides the user's current password immediately. They will need to use this new
              password to log in next time.
            </p>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-ink-secondary">New password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 pr-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= strength.score ? strength.color : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                strength.label === 'Strong' ? 'text-success-text' :
                strength.label === 'Fair' ? 'text-warning-text' : 'text-danger-text'
              }`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-ink-secondary">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className={`w-full rounded-lg border bg-surface px-3 py-2 pr-10 text-sm text-ink focus:outline-none focus:ring-2 ${
                mismatch
                  ? 'border-danger focus:ring-danger'
                  : matches
                  ? 'border-success focus:ring-success'
                  : 'border-border focus:ring-brand'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && (
            <p className="flex items-center gap-1 text-xs text-danger-text">
              <XCircle className="h-3.5 w-3.5" /> Passwords do not match
            </p>
          )}
          {matches && (
            <p className="flex items-center gap-1 text-xs text-success-text">
              <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={resetPassword.isPending}
            disabled={!canSubmit}
            onClick={() => void handleReset()}
            className="bg-warning hover:bg-warning/90 text-white"
          >
            <KeyRound className="mr-1.5 h-4 w-4" />
            Reset password
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Invite User Modal ───────────────────────────────────────────────────────
function InviteUserModal({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'software_engineer' as string,
    department: '',
  });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.email.trim() || !form.firstName.trim()) return;
    const result = await createUser.mutateAsync(form);
    if (result?.temporary_password) {
      setTempPassword(result.temporary_password);
    } else {
      onClose();
    }
  };

  if (tempPassword) {
    return (
      <Modal isOpen onClose={onClose} title="User Created" size="md">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-success/5 border border-success/30 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-success-text" />
            <p className="font-semibold text-ink">
              {form.firstName} {form.lastName} has been added
            </p>
            <p className="text-sm text-ink-secondary">
              Share the temporary password below. The user should change it on first login.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-hover/60 p-4">
            <p className="mb-1 text-xs font-medium text-ink-secondary">Temporary password</p>
            <p className="break-all font-mono text-lg font-bold tracking-widest text-ink">
              {tempPassword}
            </p>
          </div>
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Add New User" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            required
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
          />
        </div>
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <Select
            label="Department"
            value={form.department}
            onChange={(e) => set('department', e.target.value)}
          >
            <option value="">— No department —</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={createUser.isPending} onClick={() => void handleCreate()}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Create user
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function UsersSettingsPage() {
  const { data: users = [], isLoading, refetch } = useUsers();
  const deleteUser = useDeleteEntity('users');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const filtered = (users as User[]).filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteUser.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  };

  const isActive = (u: User) =>
    u.status ? u.status === 'active' : u.is_active !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {(users as User[]).length} team member{(users as User[]).length !== 1 ? 's' : ''} ·
            Edit records, reset passwords, manage access
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by name, email, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total users', value: (users as User[]).length, color: 'text-brand' },
          { label: 'Active', value: (users as User[]).filter(isActive).length, color: 'text-success-text' },
          { label: 'Inactive', value: (users as User[]).filter((u) => !isActive(u)).length, color: 'text-ink-muted' },
          { label: 'Roles', value: new Set((users as User[]).map((u) => u.role)).size, color: 'text-ink' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-ink-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-ink-muted">Loading users…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <Users className="h-8 w-8 text-ink-muted" />
            <p className="text-sm text-ink-muted">No users match your filters</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
            >
              {/* Avatar */}
              <Avatar
                name={`${user.first_name} ${user.last_name}`.trim() || user.email}
                size="md"
              />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {user.first_name} {user.last_name}
                  {!isActive(user) && (
                    <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger-text">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-ink-secondary">{user.email}</p>
                {user.department && (
                  <p className="text-xs text-ink-muted">{user.department}</p>
                )}
              </div>

              {/* Role badge */}
              <span className="hidden shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand capitalize sm:inline-block">
                {user.role?.replace(/_/g, ' ')}
              </span>

              {/* Joined */}
              {user.created_at && (
                <span className="hidden text-xs text-ink-muted lg:block">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              )}

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditingUser(user)}
                  title="Edit user"
                  className="rounded-lg p-2 text-ink-muted hover:bg-surface-hover hover:text-ink"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setResetUser(user)}
                  title="Reset password"
                  className="rounded-lg p-2 text-ink-muted hover:bg-warning/10 hover:text-warning-text"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(user)}
                  title="Delete user"
                  className="rounded-lg p-2 text-ink-muted hover:bg-danger/10 hover:text-danger-text"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setEditingUser(null);
            refetch();
          }}
        />
      )}

      {/* Reset password modal */}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <InviteUserModal
          onClose={() => {
            setInviteOpen(false);
            refetch();
          }}
        />
      )}

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            This will permanently delete{' '}
            <strong>
              {deleteTarget?.first_name} {deleteTarget?.last_name}
            </strong>{' '}
            ({deleteTarget?.email}) and all their data. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={deleteUser.isPending}
              onClick={() => void handleDelete()}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              Delete user
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
