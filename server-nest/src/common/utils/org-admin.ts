import { ForbiddenException } from '@nestjs/common';

function normalizeRole(role?: string | null): string {
  return String(role || '').toLowerCase();
}

/** CEO — full org admin (e.g. meetings create + see all). */
export function isOrgAdmin(role?: string | null): boolean {
  return normalizeRole(role) === 'ceo';
}

/** CEO or CTO — can create tasks, sprints, and teams. */
export function isDeliveryAdmin(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'ceo' || r === 'cto';
}

export function assertOrgAdmin(
  user?: { role?: string } | null,
  action = 'perform this action',
): void {
  if (!isOrgAdmin(user?.role)) {
    throw new ForbiddenException(`Only the CEO can ${action}`);
  }
}

export function assertDeliveryAdmin(
  user?: { role?: string } | null,
  action = 'perform this action',
): void {
  if (!isDeliveryAdmin(user?.role)) {
    throw new ForbiddenException(`Only the CEO or CTO can ${action}`);
  }
}
