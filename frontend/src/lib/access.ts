import { UserRole } from '@/types/roles';

function normalizeRole(role?: string | null): string {
  return String(role || '').toLowerCase();
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

export function canCreateEntity(entityKey: string, role?: string | null): boolean {
  if (entityKey === 'meetings') return canCreateMeetings(role);
  if (entityKey === 'tasks') return canCreateTasks(role);
  if (entityKey === 'sprints') return canCreateSprints(role);
  if (entityKey === 'teams') return canCreateTeams(role);
  return true;
}
