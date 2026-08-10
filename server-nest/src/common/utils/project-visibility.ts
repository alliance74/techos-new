import { ForbiddenException } from '@nestjs/common';
import { Project } from '../../entities/project.entity';

export type ProjectViewer = { id?: string; role?: string } | null | undefined;

export function parseProjectVisibleRoles(project: Partial<Project> | any): string[] | null {
  const raw = project?.visible_to_roles;
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const roles = raw.filter((r): r is string => typeof r === 'string' && !!r.trim()).map((r) => r.toLowerCase());
    return roles.length ? roles : null;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.filter((r) => typeof r === 'string').map((r: string) => r.toLowerCase());
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Project visibility:
 * - CEO always sees all
 * - creator always sees their project
 * - empty/null visible_to_roles = open to everyone in the org
 * - otherwise role must be listed (invited)
 */
export function canViewProject(project: Partial<Project> | any, user?: ProjectViewer) {
  const role = String(user?.role || '').toLowerCase();
  if (role === 'ceo') return true;
  if (user?.id && project?.created_by && user.id === project.created_by) return true;
  const visible = parseProjectVisibleRoles(project);
  if (!visible || visible.length === 0) return true;
  return Boolean(role && visible.includes(role));
}

export function assertCanViewProject(project: Partial<Project> | any, user?: ProjectViewer) {
  if (!canViewProject(project, user)) {
    throw new ForbiddenException('You have not been invited to this project');
  }
}

export function filterProjectsByInvite<T extends Partial<Project>>(projects: T[], user?: ProjectViewer): T[] {
  return projects.filter((p) => canViewProject(p, user));
}
