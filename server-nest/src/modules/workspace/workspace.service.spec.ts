import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WorkspaceService } from './workspace.service';
import { WorkspaceRecord } from '../../entities/workspace-record.entity';
import { ActivityEvent } from '../../entities/activity-event.entity';
import { RecordComment } from '../../entities/record-comment.entity';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { AuditLog } from '../../entities/audit-log.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Task } from '../../entities/task.entity';

const ORG_A = 'org-a-00000000-0000-0000-00000000000001';
const ORG_B = 'org-b-00000000-0000-0000-00000000000001';
const CEO_USER = { id: 'user-ceo', role: 'ceo', org_id: ORG_A };

const ALL_ENTITIES = [
  WorkspaceRecord, ActivityEvent, RecordComment, AuditLog,
  Organization, User, Project, Sprint, Task,
];

describe('WorkspaceService', () => {
  let module: TestingModule;
  let service: WorkspaceService;

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
      providers: [WorkspaceService, ActivityLogService],
    }).compile();

    service = module.get(WorkspaceService);
  }, 15000);

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('create', () => {
    it('should create a workspace record', async () => {
      const result = await service.create(ORG_A, 'employees', CEO_USER, {
        title: 'John Doe', description: 'Software Engineer', status: 'active',
      });
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('John Doe');
      expect(result.data.type).toBe('employees');
    });

    it('should enforce team creation only by delivery admins', async () => {
      const nonAdmin = { id: 'user-eng', role: 'software_engineer', org_id: ORG_A };
      await expect(
        service.create(ORG_A, 'teams', nonAdmin, { title: 'Team Alpha' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CEO should be able to create teams', async () => {
      const result = await service.create(ORG_A, 'teams', CEO_USER, {
        title: 'Engineering Team', description: 'Backend and frontend',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('list', () => {
    it('should list records by type', async () => {
      const result = await service.list(ORG_A, 'employees', CEO_USER);
      expect(result.data.every((r: any) => r.type === 'employees')).toBe(true);
    });
  });

  describe('get', () => {
    it('should get a specific record', async () => {
      const created = await service.create(ORG_A, 'employees', CEO_USER, {
        title: 'Specific Employee',
      });
      const result = await service.get(ORG_A, 'employees', created.data.id, CEO_USER);
      expect(result.data.title).toBe('Specific Employee');
    });

    it('should throw NotFoundException for non-existent record', async () => {
      await expect(
        service.get(ORG_A, 'employees', 'non-existent', CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update record fields', async () => {
      const created = await service.create(ORG_A, 'employees', CEO_USER, {
        title: 'Before Update',
      });
      const updated = await service.update(ORG_A, 'employees', created.data.id, CEO_USER, {
        title: 'After Update',
      });
      expect(updated.data.title).toBe('After Update');
    });
  });

  describe('remove', () => {
    it('should delete a record', async () => {
      const created = await service.create(ORG_A, 'employees', CEO_USER, {
        title: 'To Delete',
      });
      const result = await service.remove(ORG_A, 'employees', created.data.id, CEO_USER);
      expect(result.success).toBe(true);
    });
  });

  describe('comments', () => {
    it('should create and list comments', async () => {
      const record = await service.create(ORG_A, 'employees', CEO_USER, {
        title: 'Commentable',
      });
      await service.createComment(ORG_A, CEO_USER, {
        entity_type: 'employees', entity_id: record.data.id, body: 'Great work!',
      });
      const comments = await service.listComments(ORG_A, 'employees', record.data.id);
      expect(comments.data.length).toBeGreaterThanOrEqual(1);
      expect(comments.data.some((c: any) => c.body === 'Great work!')).toBe(true);
    });

    it('should only allow CEO or comment owner to delete', async () => {
      const record = await service.create(ORG_A, 'employees', CEO_USER, {
        title: 'Delete Comment',
      });
      const comment = await service.createComment(ORG_A, CEO_USER, {
        entity_type: 'employees', entity_id: record.data.id, body: 'Owner comment',
      });
      const nonOwner = { id: 'user-cto', role: 'cto', org_id: ORG_A };
      await expect(
        service.removeComment(ORG_A, comment.data.id, nonOwner),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('organization isolation', () => {
    it('list should only return records for the given org', async () => {
      await service.create(ORG_A, 'employees', CEO_USER, { title: 'Org A Employee' });
      await service.create(ORG_B, 'employees', { ...CEO_USER, org_id: ORG_B }, {
        title: 'Org B Employee',
      });
      const result = await service.list(ORG_A, 'employees', CEO_USER);
      expect(result.data.every((r: any) => r.title !== 'Org B Employee')).toBe(true);
    });
  });
});
