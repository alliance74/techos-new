import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ActivityEvent } from '../../entities/activity-event.entity';
import { AuditLog } from '../../entities/audit-log.entity';

export type ActivityLogInput = {
  org_id: string;
  actor?: any;
  action: string;
  resource_type: string;
  resource_id: string;
  summary: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
};

/** Valuable work actions shown on employee recent activity (excludes HR admin noise). */
export const VALUABLE_ACTIVITY_TYPES = new Set([
  'tasks',
  'projects',
  'sprints',
  'deals',
  'contacts',
  'invoices',
  'expenses',
  'goals',
  'meetings',
  'leaves',
  'leave_requests',
  'documents',
  'messages',
  'bugs',
  'features',
  'codeReviews',
  'workspace',
]);

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityEvent)
    private readonly activityRepository: Repository<ActivityEvent>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  private actorName(actor: any): string {
    const first = actor?.first_name || actor?.firstName || '';
    const last = actor?.last_name || actor?.lastName || '';
    return `${first} ${last}`.trim() || actor?.email || actor?.name || 'System';
  }

  async log(input: ActivityLogInput) {
    const actorId = input.actor?.id || input.actor?.sub || null;
    const actor_name = this.actorName(input.actor);

    const event = this.activityRepository.create({
      id: randomUUID(),
      org_id: input.org_id,
      entity_type: input.resource_type,
      entity_id: input.resource_id,
      action: input.action,
      summary: input.summary,
      actor_id: actorId,
      actor_name,
      metadata: input.metadata || input.changes || undefined,
    });
    await this.activityRepository.save(event);

    if (actorId) {
      const audit = this.auditRepository.create({
        id: randomUUID(),
        org_id: input.org_id,
        user_id: String(actorId),
        action: input.action,
        resource_type: input.resource_type,
        resource_id: String(input.resource_id),
        changes: {
          summary: input.summary,
          ...(input.changes || {}),
        },
        ip_address: input.ip_address,
        user_agent: input.user_agent,
      });
      await this.auditRepository.save(audit);
    }

    return event;
  }

  async listForActor(org_id: string, actor_id: string, take = 40) {
    const rows = await this.activityRepository
      .createQueryBuilder('a')
      .where('a.org_id = :org_id', { org_id })
      .andWhere('CAST(a.actor_id AS text) = :actor_id', { actor_id: String(actor_id) })
      .orderBy('a.created_at', 'DESC')
      .take(Math.max(take * 3, 60))
      .getMany();

    const valuable = rows.filter((row) => {
      const type = (row.entity_type || '').toLowerCase();
      if (VALUABLE_ACTIVITY_TYPES.has(type)) return true;
      if (type && !['employees', 'users', 'organizations'].includes(type)) return true;
      return false;
    });

    return valuable.slice(0, take);
  }
}
