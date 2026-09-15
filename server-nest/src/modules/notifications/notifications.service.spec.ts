import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../entities/notification.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { EmailService } from '../../common/services/email.service';
import { Project } from '../../entities/project.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Task } from '../../entities/task.entity';

const ORG_A = 'org-a-00000000-0000-0000-00000000000001';
const USER_A = 'user-a-00000000-0000-0000-00000000000001';
const USER_B = 'user-b-00000000-0000-0000-00000000000001';

const ALL_ENTITIES = [
  Notification, User, Organization, Project, Sprint, Task,
];

describe('NotificationsService', () => {
  let module: TestingModule;
  let service: NotificationsService;
  let notifRepo: Repository<Notification>;

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
        NotificationsService,
        {
          provide: EventsGateway,
          useValue: {
            sendNotificationToUser: jest.fn(),
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

    service = module.get(NotificationsService);
    notifRepo = module.get(getRepositoryToken(Notification));

    const orgsRepo = module.get(getRepositoryToken(Organization));
    await orgsRepo.save({ id: ORG_A, name: 'Test Org' });

    const usersRepo = module.get(getRepositoryToken(User));
    await usersRepo.save({
      id: USER_A, org_id: ORG_A, email: 'usera@test.com',
      password_hash: 'hash', role: UserRole.SOFTWARE_ENGINEER, status: 'active',
    });
    await usersRepo.save({
      id: USER_B, org_id: ORG_A, email: 'userb@test.com',
      password_hash: 'hash', role: UserRole.CTO, status: 'active',
    });
  }, 15000);

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const result = await service.create(ORG_A, {
        user_id: USER_A, type: 'task_assigned',
        title: 'Task Assigned', message: 'You have been assigned a new task',
      });
      expect(result.success).toBe(true);
      expect(result.data.user_id).toBe(USER_A);
      expect(result.data.read).toBe(false);
    });

    it('should send real-time notification via gateway', async () => {
      const gateway = module.get(EventsGateway);
      jest.clearAllMocks();
      await service.create(ORG_A, {
        user_id: USER_A, type: 'mention',
        title: 'Mentioned', message: 'Someone mentioned you',
      });
      expect(gateway.sendNotificationToUser).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return notifications for a specific user only', async () => {
      await service.create(ORG_A, {
        user_id: USER_A, type: 'test', title: 'User A Notification', message: 'For A',
      });
      await service.create(ORG_A, {
        user_id: USER_B, type: 'test', title: 'User B Notification', message: 'For B',
      });
      const result = await service.findAll(USER_A);
      expect(result.data.every((n: any) => n.user_id === USER_A)).toBe(true);
    });

    it('should filter by read status', async () => {
      const result = await service.findAll(USER_A, { read: false });
      expect(result.data.every((n: any) => n.read === false)).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await service.findAll(USER_A, { type: 'task_assigned' });
      expect(result.data.every((n: any) => n.type === 'task_assigned')).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const created = await service.create(ORG_A, {
        user_id: USER_A, type: 'test', title: 'To Be Read', message: 'Read me',
      });
      const result = await service.markAsRead(created.data.id, USER_A);
      expect(result.success).toBe(true);
      const updated = await notifRepo.findOne({ where: { id: created.data.id } });
      expect(updated!.read).toBe(true);
    });

    it('should mark all as read', async () => {
      const result = await service.markAllAsRead(USER_A);
      expect(result.success).toBe(true);
      const unread = await notifRepo.count({ where: { user_id: USER_A, read: false } });
      expect(unread).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      await service.create(ORG_A, {
        user_id: USER_A, type: 'test', title: 'Unread 1', message: 'msg',
      });
      await service.create(ORG_A, {
        user_id: USER_A, type: 'test', title: 'Unread 2', message: 'msg',
      });
      const result = await service.getUnreadCount(USER_A);
      expect(result.data.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      const created = await service.create(ORG_A, {
        user_id: USER_A, type: 'test', title: 'To Delete', message: 'Delete me',
      });
      const result = await service.remove(created.data.id, USER_A);
      expect(result.success).toBe(true);
      const deleted = await notifRepo.findOne({ where: { id: created.data.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('helper notification types', () => {
    it('notifyTaskAssigned creates task_assigned notification', async () => {
      const result = await service.notifyTaskAssigned(
        'task-123', 'Fix bug', USER_A, 'Test Project', ORG_A,
      );
      expect(result.data.type).toBe('task_assigned');
      expect(result.data.title).toBe('New Task Assigned');
      expect(result.data.message).toContain('Fix bug');
    });

    it('notifyMeetingInvite creates meeting_invite notification', async () => {
      const result = await service.notifyMeetingInvite(
        'meeting-123', 'Sprint Review', USER_A, '2026-01-15T10:00:00Z', ORG_A,
      );
      expect(result.data.type).toBe('meeting_invite');
      expect(result.data.message).toContain('Sprint Review');
    });
  });
});
