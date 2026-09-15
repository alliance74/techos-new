import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from '../../entities/project.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Task } from '../../entities/task.entity';
import { Organization } from '../../entities/organization.entity';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { ActivityEvent } from '../../entities/activity-event.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { User } from '../../entities/user.entity';

const ORG_A = 'org-a-00000000-0000-0000-00000000000001';
const ORG_B = 'org-b-00000000-0000-0000-00000000000001';
const CEO_USER = { id: 'user-ceo', role: 'ceo', org_id: ORG_A };
const CTO_USER = { id: 'user-cto', role: 'cto', org_id: ORG_A };
const ENGINEER_USER = { id: 'user-eng', role: 'software_engineer', org_id: ORG_A };

describe('ProjectsService', () => {
  let module: TestingModule;
  let service: ProjectsService;
  let projectsRepo: Repository<Project>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Project,
            Sprint,
            Task,
            Organization,
            ActivityEvent,
            AuditLog,
            User,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([
          Project,
          Sprint,
          Task,
          ActivityEvent,
          AuditLog,
          User,
          Organization,
        ]),
      ],
      providers: [ProjectsService, ActivityLogService],
    }).compile();

    service = module.get(ProjectsService);
    projectsRepo = module.get(getRepositoryToken(Project));

    // Seed two orgs
    const orgsRepo = module.get(getRepositoryToken(Organization));
    await orgsRepo.save({ id: ORG_A, name: 'Org A' });
    await orgsRepo.save({ id: ORG_B, name: 'Org B' });
  });

  afterAll(async () => {
    await module.close();
  });

  describe('create', () => {
    it('should create a project with correct org_id', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Project Alpha',
        description: 'First project',
        priority: 'high',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Project Alpha');
      expect(result.data.org_id).toBe(ORG_A);
      expect(result.data.priority).toBe('high');
    });

    it('should track created_by as actor id', async () => {
      const result = await service.create(ORG_A, CTO_USER, {
        name: 'Project Beta',
      });

      expect(result.data.created_by).toBe(CTO_USER.id);
    });

    it('should normalize status to lowercase', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Project Gamma',
        status: 'On Hold',
      });

      expect(result.data.status).toBe('on_hold');
    });

    it('should store visible_to_roles', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Private Project',
        visible_to_roles: ['cto', 'software_engineer'],
      });

      expect(result.data.visible_to_roles).toEqual(
        expect.arrayContaining(['ceo', 'cto', 'software_engineer']),
      );
    });
  });

  describe('findAll', () => {
    it('should list only projects belonging to the organization', async () => {
      // Create project in ORG_B
      await projectsRepo.save({
        id: 'proj-org-b',
        org_id: ORG_B,
        name: 'Org B Project',
        status: 'active',
      });

      const result = await service.findAll(ORG_A, CEO_USER);
      expect(result.data.every((p: any) => p.org_id === ORG_A)).toBe(true);
    });

    it('CEO should see all projects in org regardless of visibility', async () => {
      await service.create(ORG_A, CEO_USER, {
        name: 'Restricted Project',
        visible_to_roles: ['finance'],
      });

      const result = await service.findAll(ORG_A, CEO_USER);
      expect(result.data.some((p: any) => p.name === 'Restricted Project')).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await service.findAll(ORG_A, CEO_USER, 'active');
      expect(result.data.every((p: any) => p.status === 'active')).toBe(true);
    });
  });

  describe('project visibility', () => {
    let restrictedProject: any;

    beforeAll(async () => {
      const created = await service.create(ORG_A, CEO_USER, {
        name: 'Visible to CTO Only',
        visible_to_roles: ['cto'],
      });
      restrictedProject = created.data;
    });

    it('CEO should always see restricted projects', async () => {
      const result = await service.findOne(restrictedProject.id, ORG_A, CEO_USER);
      expect(result.data.name).toBe('Visible to CTO Only');
    });

    it('CTO should see projects they are invited to', async () => {
      const result = await service.findOne(restrictedProject.id, ORG_A, CTO_USER);
      expect(result.data.name).toBe('Visible to CTO Only');
    });

    it('Engineer should NOT see projects they are not invited to', async () => {
      await expect(
        service.findOne(restrictedProject.id, ORG_A, ENGINEER_USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('organization isolation', () => {
    it('should throw NotFoundException when accessing project from different org', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Org A Project',
      });

      await expect(
        service.findOne(result.data.id, ORG_B, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not update project from different org', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Protected Project',
      });

      await expect(
        service.update(result.data.id, ORG_B, { name: 'Hacked' }, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not delete project from different org', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Safe Project',
      });

      await expect(
        service.remove(result.data.id, ORG_B, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project fields', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Before Update',
      });

      const updated = await service.update(result.data.id, ORG_A, {
        name: 'After Update',
        priority: 'critical',
      }, CEO_USER);

      expect(updated.data.name).toBe('After Update');
      expect(updated.data.priority).toBe('critical');
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'To Be Deleted',
      });

      const deleteResult = await service.remove(result.data.id, ORG_A, CEO_USER);
      expect(deleteResult.success).toBe(true);

      await expect(
        service.findOne(result.data.id, ORG_A, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const result = await service.create(ORG_A, CEO_USER, {
        name: 'Stats Project',
      });

      const stats = await service.getProjectStats(result.data.id, ORG_A, CEO_USER);
      expect(stats.success).toBe(true);
      expect(stats.data.total_tasks).toBe(0);
    });
  });
});
