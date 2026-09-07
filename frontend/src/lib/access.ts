import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/roles';

function normalizeRole(role?: string | null): string {
  return String(role || '').toLowerCase();
}

function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  const r = normalizeRole(role) as UserRole;
  return ROLE_PERMISSIONS[r]?.includes(permission) ?? false;
}

/** CEO — meetings and full org admin. */
export function isOrgAdmin(role?: string | null): boolean {
  return normalizeRole(role) === UserRole.CEO;
}

/** CEO or CTO — tasks, sprints, teams. */
export function isDeliveryAdmin(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === UserRole.CEO || r === UserRole.CTO;
}

export function canCreateMeetings(role?: string | null): boolean {
  return isOrgAdmin(role);
}

export function canCreateTasks(role?: string | null): boolean {
  return isDeliveryAdmin(role);
}

export function canCreateSprints(role?: string | null): boolean {
  return isDeliveryAdmin(role);
}

export function canCreateTeams(role?: string | null): boolean {
  return isDeliveryAdmin(role);
}

/**
 * Roles with MANAGE_TASKS permission can move cards / update task status.
 * Includes: CEO, CTO, CISO, Software Engineer, UI/UX Designer.
 * Excludes: Finance, Customer Support (view-only on tasks).
 */
export function canUpdateTaskStatus(role?: string | null): boolean {
  return hasPermission(role, Permission.MANAGE_TASKS);
}

/**
 * Only delivery admins (CEO, CTO) can delete tasks.
 */
export function canDeleteTask(role?: string | null): boolean {
  return isDeliveryAdmin(role);
}

export function canCreateEntity(entityKey: string, role?: string | null): boolean {
  if (entityKey === 'meetings') return canCreateMeetings(role);
  if (entityKey === 'tasks') return canCreateTasks(role);
  if (entityKey === 'sprints') return canCreateSprints(role);
  if (entityKey === 'teams') return canCreateTeams(role);
  return true;
}
