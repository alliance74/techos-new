import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from '../../entities/task.entity';
import { Project } from '../../entities/project.entity';
import { Sprint } from '../../entities/sprint.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { Notification } from '../../entities/notification.entity';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { ActivityEvent } from '../../entities/activity-event.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { EmailService } from '../../common/services/email.service';

const ORG_A = 'org-a-00000000-0000-0000-00000000000001';
const ORG_B = 'org-b-00000000-0000-0000-00000000000001';
const CEO_USER = { id: 'user-ceo', role: 'ceo', org_id: ORG_A };
const CTO_USER = { id: 'user-cto', role: 'cto', org_id: ORG_A };

const ALL_ENTITIES = [
  Task, Project, Sprint, User, Organization, Notification,
  ActivityEvent, AuditLog,
];

describe('TasksService', () => {
  let module: TestingModule;
  let service: TasksService;
  let tasksRepo: Repository<Task>;
  let projectsRepo: Repository<Project>;

  let projectA: Project;
  let projectB: Project;

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
        TasksService,
        ActivityLogService,
        NotificationsService,
        {
          provide: EventsGateway,
          useValue: {
            sendNotificationToUser: jest.fn(),
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

    service = module.get(TasksService);
    tasksRepo = module.get(getRepositoryToken(Task));
    projectsRepo = module.get(getRepositoryToken(Project));

    const orgsRepo = module.get(getRepositoryToken(Organization));
    await orgsRepo.save({ id: ORG_A, name: 'Org A' });
    await orgsRepo.save({ id: ORG_B, name: 'Org B' });

    projectA = await projectsRepo.save({
      id: 'project-a-001', org_id: ORG_A, name: 'Project A', status: 'active',
    });
    projectB = await projectsRepo.save({
      id: 'project-b-001', org_id: ORG_B, name: 'Project B', status: 'active',
    });
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('create', () => {
    it('should create a task in a valid project', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        title: 'Implement auth', project_id: projectA.id, priority: 'high',
      });
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Implement auth');
      expect(result.data.org_id).toBe(ORG_A);
    });

    it('should set reporter_id to the actor', async () => {
      const result = await service.create(ORG_A, CTO_USER, {
        title: 'CTO Task', project_id: projectA.id,
      });
      expect(result.data.reporter_id).toBe(CTO_USER.id);
    });

    it('should normalize assignee_ids from single assignee_id', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        title: 'Assigned Task', project_id: projectA.id, assignee_id: 'some-user-id',
      });
      expect(result.data.assignee_ids).toContain('some-user-id');
    });
  });

  describe('findAll', () => {
    it('should return tasks only from accessible projects', async () => {
      const result = await service.findAll(ORG_A, {}, CEO_USER);
      expect(result.data.every((t: any) => t.org_id === ORG_A)).toBe(true);
    });

    it('should filter tasks by project_id', async () => {
      const result = await service.findAll(ORG_A, { project_id: projectA.id }, CEO_USER);
      expect(result.data.every((t: any) => t.project_id === projectA.id)).toBe(true);
    });

    it('should filter tasks by status', async () => {
      const result = await service.findAll(ORG_A, { status: 'todo' }, CEO_USER);
      expect(result.data.every((t: any) => t.status === 'todo')).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a specific task', async () => {
      const created = await service.create(ORG_A, CEO_USER, {
        title: 'Find Me Task', project_id: projectA.id,
      });
      const found = await service.findOne(created.data.id, ORG_A, CEO_USER);
      expect(found.data.title).toBe('Find Me Task');
    });

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(
        service.findOne('nonexistent-id', ORG_A, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('organization isolation', () => {
    it('should not allow viewing tasks from another org', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        title: 'Org A Task', project_id: projectA.id,
      });
      await expect(
        service.findOne(result.data.id, ORG_B, { id: 'other', role: 'ceo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not allow updating tasks from another org', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        title: 'Org A Update Task', project_id: projectA.id,
      });
      await expect(
        service.update(result.data.id, ORG_B, { title: 'Hacked' }, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not allow deleting tasks from another org', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        title: 'Org A Delete Task', project_id: projectA.id,
      });
      await expect(
        service.remove(result.data.id, ORG_B, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update task fields', async () => {
      const created = await service.create(ORG_A, CEO_USER, {
        title: 'Before Update', project_id: projectA.id, priority: 'low',
      });
      const updated = await service.update(created.data.id, ORG_A, {
        title: 'After Update', priority: 'critical',
      }, CEO_USER);
      expect(updated.data.title).toBe('After Update');
      expect(updated.data.priority).toBe('critical');
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const created = await service.create(ORG_A, CEO_USER, {
        title: 'To Delete', project_id: projectA.id,
      });
      const result = await service.remove(created.data.id, ORG_A, CEO_USER);
      expect(result.success).toBe(true);
      await expect(
        service.findOne(created.data.id, ORG_A, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSubtasks', () => {
    it('should return subtasks for a parent task', async () => {
      const parent = await service.create(ORG_A, CEO_USER, {
        title: 'Parent Task', project_id: projectA.id,
      });
      await service.create(ORG_A, CEO_USER, {
        title: 'Subtask 1', project_id: projectA.id, parent_task_id: parent.data.id,
      });
      await service.create(ORG_A, CEO_USER, {
        title: 'Subtask 2', project_id: projectA.id, parent_task_id: parent.data.id,
      });
      const subtasks = await service.getSubtasks(parent.data.id, ORG_A, CEO_USER);
      expect(subtasks.data).toHaveLength(2);
    });
  });

  describe('assignee handling', () => {
    it('should store multiple assignees via assignee_ids', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        title: 'Multi-assignee', project_id: projectA.id,
        assignee_ids: ['user-1', 'user-2', 'user-3'],
      });
      expect(result.data.assignee_ids).toEqual(
        expect.arrayContaining(['user-1', 'user-2', 'user-3']),
      );
      expect(result.data.assignee_id).toBe('user-1');
    });
  });
});
