/**
 * Organization Isolation Tests
 *
 * These tests verify that services enforce strict tenant boundaries:
 * - User A (org_1) CANNOT access User B's (org_2) data
 * - Cross-org queries return NotFound, not the data
 * - Filtering always scopes to the requesting user's org_id
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';

// Entities
import { User, UserRole } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { Sprint } from '../entities/sprint.entity';
import { Task } from '../entities/task.entity';
import { Notification } from '../entities/notification.entity';
import { Integration } from '../entities/integration.entity';
import { ActivityEvent } from '../entities/activity-event.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Employee } from '../entities/employee.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { MeetingParticipant } from '../entities/meeting-participant.entity';
import { WorkspaceRecord } from '../entities/workspace-record.entity';
import { RecordComment } from '../entities/record-comment.entity';

// Services
import { ProjectsService } from './projects/projects.service';
import { TasksService } from './tasks/tasks.service';
import { SprintsService } from './sprints/sprints.service';
import { NotificationsService } from './notifications/notifications.service';
import { IntegrationsService } from './integrations/integrations.service';
import { WorkspaceService } from './workspace/workspace.service';
import { ActivityLogService } from '../common/services/activity-log.service';

// Shared services / gateways
import { EventsGateway } from '../common/gateways/events.gateway';
import { EmailService } from '../common/services/email.service';

// ─── Test Data ────────────────────────────────────────────────────
const ORG_ALPHA = '00000000-0000-0000-0000-000000000001';
const ORG_BETA  = '00000000-0000-0000-0000-000000000002';

const CEO_ALPHA = { id: 'ceo-alpha', role: 'ceo', org_id: ORG_ALPHA };
const CEO_BETA  = { id: 'ceo-beta',  role: 'ceo', org_id: ORG_BETA };
const CTO_ALPHA = { id: 'cto-alpha', role: 'cto', org_id: ORG_ALPHA };
const ENG_ALPHA = { id: 'eng-alpha', role: 'software_engineer', org_id: ORG_ALPHA };

const ALL_ENTITIES = [
  User, Organization, Project, Sprint, Task, Notification,
  Integration, ActivityEvent, AuditLog, Employee,
  ChannelMember, MeetingParticipant, WorkspaceRecord, RecordComment,
];

describe('Organization Isolation', () => {
  let module: TestingModule;

  // Repos
  let notifRepo: Repository<Notification>;
  let integrationRepo: Repository<Integration>;
  let workspaceRepo: Repository<WorkspaceRecord>;

  // Services
  let projectsService: ProjectsService;
  let tasksService: TasksService;
  let sprintsService: SprintsService;
  let notificationsService: NotificationsService;
  let integrationsService: IntegrationsService;
  let workspaceService: WorkspaceService;

  // Seeded data
  let projectAlpha: any;
  let projectBeta: any;
  let taskAlpha: any;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature(ALL_ENTITIES),
      ],
      providers: [
        ProjectsService,
        TasksService,
        SprintsService,
        NotificationsService,
        IntegrationsService,
        WorkspaceService,
        ActivityLogService,
        {
          provide: EventsGateway,
          useValue: {
            sendNotificationToUser: jest.fn(),
            sendNotificationToUsers: jest.fn(),
            sendTaskUpdate: jest.fn(),
            sendToOrganization: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendNotificationEmail: jest.fn(),
            sendTaskAssignedEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    // Get repos
    notifRepo       = module.get(getRepositoryToken(Notification));
    integrationRepo = module.get(getRepositoryToken(Integration));
    workspaceRepo   = module.get(getRepositoryToken(WorkspaceRecord));

    // Get services
    projectsService      = module.get(ProjectsService);
    tasksService         = module.get(TasksService);
    sprintsService       = module.get(SprintsService);
    notificationsService = module.get(NotificationsService);
    integrationsService  = module.get(IntegrationsService);
    workspaceService     = module.get(WorkspaceService);

    // Seed organizations
    const orgsRepo = module.get(getRepositoryToken(Organization));
    await orgsRepo.save({ id: ORG_ALPHA, name: 'Alpha Corp', slug: 'alpha-corp' });
    await orgsRepo.save({ id: ORG_BETA,  name: 'Beta Inc',  slug: 'beta-inc' });

    // Seed projects using the service layer (ensures proper persistence)
    const alphaProj = await projectsService.create(ORG_ALPHA, CEO_ALPHA, {
      name: 'Alpha Project',
    });
    projectAlpha = alphaProj.data;

    const betaProj = await projectsService.create(ORG_BETA, CEO_BETA, {
      name: 'Beta Project',
    });
    projectBeta = betaProj.data;

    // Seed alpha task via service
    const alphaTask = await tasksService.create(ORG_ALPHA, CEO_ALPHA, {
      title: 'Alpha Task',
      project_id: projectAlpha.id,
    });
    taskAlpha = alphaTask.data;
  }, 30000);

  afterAll(async () => {
    if (module) await module.close();
  });

  // ═══════════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════════
  describe('Projects', () => {
    it('Alpha org should NOT see Beta org projects', async () => {
      const result = await projectsService.findAll(ORG_ALPHA, CEO_ALPHA);
      const ids = result.data.map((p: any) => p.id);
      expect(ids).toContain(projectAlpha.id);
      expect(ids).not.toContain(projectBeta.id);
    });

    it('Beta org should NOT see Alpha org projects', async () => {
      const result = await projectsService.findAll(ORG_BETA, CEO_BETA);
      const ids = result.data.map((p: any) => p.id);
      expect(ids).toContain(projectBeta.id);
      expect(ids).not.toContain(projectAlpha.id);
    });

    it('Alpha should get NotFoundException when accessing Beta project by ID', async () => {
      await expect(
        projectsService.findOne(projectBeta.id, ORG_ALPHA, CEO_ALPHA),
      ).rejects.toThrow(NotFoundException);
    });

    it('Beta should get NotFoundException when accessing Alpha project by ID', async () => {
      await expect(
        projectsService.findOne(projectAlpha.id, ORG_BETA, CEO_BETA),
      ).rejects.toThrow(NotFoundException);
    });

    it('Alpha should get NotFoundException when updating Beta project', async () => {
      await expect(
        projectsService.update(projectBeta.id, ORG_ALPHA, { name: 'Hacked' }, CEO_ALPHA),
      ).rejects.toThrow(NotFoundException);
    });

    it('Alpha should get NotFoundException when deleting Beta project', async () => {
      await expect(
        projectsService.remove(projectBeta.id, ORG_ALPHA, CEO_ALPHA),
      ).rejects.toThrow(NotFoundException);
    });

    it('Engineer cannot see restricted projects they are not invited to', async () => {
      const restricted = await projectsService.create(ORG_ALPHA, CEO_ALPHA, {
        name: 'CTO Only',
        visible_to_roles: ['cto'],
      });

      // CEO bypasses visibility
      const ceoResult = await projectsService.findOne(restricted.data.id, ORG_ALPHA, CEO_ALPHA);
      expect(ceoResult.data.name).toBe('CTO Only');

      // CTO can see
      const ctoResult = await projectsService.findOne(restricted.data.id, ORG_ALPHA, CTO_ALPHA);
      expect(ctoResult.data.name).toBe('CTO Only');

      // Engineer CANNOT see
      await expect(
        projectsService.findOne(restricted.data.id, ORG_ALPHA, ENG_ALPHA),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TASKS
  // ═══════════════════════════════════════════════════════════════
  describe('Tasks', () => {
    let betaTaskId: string;

    beforeAll(async () => {
      // Seed a task in Beta org for cross-org tests
      const betaTask = await tasksService.create(ORG_BETA, CEO_BETA, {
        title: 'Beta Task',
        project_id: projectBeta.id,
      });
      betaTaskId = betaTask.data.id;
    });

    it('Alpha should NOT see Beta org tasks', async () => {
      const result = await tasksService.findAll(ORG_ALPHA, {}, CEO_ALPHA);
      const ids = result.data.map((t: any) => t.id);
      expect(ids).toContain(taskAlpha.id);
      expect(ids).not.toContain(betaTaskId);
    });

    it('Alpha should get NotFoundException for Beta task', async () => {
      await expect(
        tasksService.findOne(betaTaskId, ORG_ALPHA, CEO_ALPHA),
      ).rejects.toThrow(NotFoundException);
    });

    it('Alpha should NOT update Beta task', async () => {
      await expect(
        tasksService.update(betaTaskId, ORG_ALPHA, { title: 'Hacked' }, CEO_ALPHA),
      ).rejects.toThrow(NotFoundException);
    });

    it('Alpha should NOT delete Beta task', async () => {
      await expect(
        tasksService.remove(betaTaskId, ORG_ALPHA, CEO_ALPHA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SPRINTS
  // ═══════════════════════════════════════════════════════════════
  describe('Sprints', () => {
    let betaSprintId: string;

    beforeAll(async () => {
      // Seed a sprint in Beta org for cross-org tests
      const betaSprint = await sprintsService.create(ORG_BETA, {
        project_id: projectBeta.id,
        name: 'Beta Sprint',
        start_date: '2026-01-01',
        end_date: '2026-01-14',
      }, CEO_BETA);
      betaSprintId = betaSprint.data.id;
    });

    it('Alpha should NOT see Beta sprints', async () => {
      const alphaResult = await sprintsService.findAll(ORG_ALPHA, undefined, CEO_ALPHA);
      const betaResult = await sprintsService.findAll(ORG_BETA, undefined, CEO_BETA);

      // Each org only sees its own
      expect(alphaResult.data.every((s: any) => s.org_id === ORG_ALPHA)).toBe(true);
      expect(betaResult.data.every((s: any) => s.org_id === ORG_BETA)).toBe(true);
    });

    it('Alpha should get NotFoundException for Beta sprint by ID', async () => {
      await expect(
        sprintsService.findOne(betaSprintId, ORG_ALPHA, CEO_ALPHA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════
  describe('Notifications', () => {
    it('User A should NOT see User B notifications', async () => {
      await notificationsService.create(ORG_ALPHA, {
        user_id: 'ceo-alpha', type: 'test', title: 'Alpha Only', message: 'Secret',
      });
      await notificationsService.create(ORG_BETA, {
        user_id: 'ceo-beta', type: 'test', title: 'Beta Only', message: 'Secret',
      });

      const alphaNotifs = await notificationsService.findAll('ceo-alpha');
      const betaNotifs = await notificationsService.findAll('ceo-beta');

      expect(alphaNotifs.data.every((n: any) => n.title === 'Alpha Only')).toBe(true);
      expect(betaNotifs.data.every((n: any) => n.title === 'Beta Only')).toBe(true);
    });

    it('User A should NOT mark User B notification as read', async () => {
      const betaNotif = await notificationsService.create(ORG_BETA, {
        user_id: 'ceo-beta', type: 'test', title: 'Beta Read Test', message: 'msg',
      });

      // Alpha user tries to mark beta's notification
      await notificationsService.markAsRead(betaNotif.data.id, 'ceo-alpha');

      // Beta's notification should still be unread
      const check = await notifRepo.findOne({ where: { id: betaNotif.data.id } });
      expect(check!.read).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════
  describe('Integrations', () => {
    let typeCounter = 0;
    const ut = () => `iso_integ_${++typeCounter}`;

    it('Alpha should NOT see Beta integrations', async () => {
      const t1 = ut();
      const t2 = ut();
      await integrationsService.create(ORG_ALPHA, { type: t1, name: 'Alpha GitHub', config: {} });
      await integrationsService.create(ORG_BETA, { type: t2, name: 'Beta GitHub', config: {} });

      const alphaList = await integrationsService.findAll(ORG_ALPHA);
      const betaList = await integrationsService.findAll(ORG_BETA);

      expect(alphaList.data.every((i: any) => i.org_id === ORG_ALPHA)).toBe(true);
      expect(betaList.data.every((i: any) => i.org_id === ORG_BETA)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // WORKSPACE
  // ═══════════════════════════════════════════════════════════════
  describe('Workspace', () => {
    it('Alpha should NOT see Beta workspace records', async () => {
      await workspaceService.create(ORG_ALPHA, 'notes', CEO_ALPHA, {
        title: 'Alpha Record',
        description: 'Alpha content',
      });

      await workspaceService.create(ORG_BETA, 'notes', CEO_BETA, {
        title: 'Beta Record',
        description: 'Beta content',
      });

      const alphaRecords = await workspaceService.list(ORG_ALPHA, 'notes', CEO_ALPHA);
      const betaRecords = await workspaceService.list(ORG_BETA, 'notes', CEO_BETA);

      expect(alphaRecords.data.every((r: any) => r.org_id === ORG_ALPHA)).toBe(true);
      expect(betaRecords.data.every((r: any) => r.org_id === ORG_BETA)).toBe(true);
    });
  });
});
