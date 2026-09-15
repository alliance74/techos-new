import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SprintsService } from './sprints.service';
import { Sprint } from '../../entities/sprint.entity';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { ActivityEvent } from '../../entities/activity-event.entity';
import { AuditLog } from '../../entities/audit-log.entity';

const ORG_A = 'org-a-00000000-0000-0000-00000000000001';
const ORG_B = 'org-b-00000000-0000-0000-00000000000001';
const CEO_USER = { id: 'user-ceo', role: 'ceo', org_id: ORG_A };

const ALL_ENTITIES = [
  Sprint, Project, Task, Organization, User, ActivityEvent, AuditLog,
];

describe('SprintsService', () => {
  let module: TestingModule;
  let service: SprintsService;
  let projectsRepo: Repository<Project>;
  let sprintsRepo: Repository<Sprint>;
  let tasksRepo: Repository<Task>;

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
      providers: [SprintsService, ActivityLogService],
    }).compile();

    service = module.get(SprintsService);
    projectsRepo = module.get(getRepositoryToken(Project));
    sprintsRepo = module.get(getRepositoryToken(Sprint));
    tasksRepo = module.get(getRepositoryToken(Task));

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
    it('should create a sprint with correct fields', async () => {
      const result = await service.create(ORG_A, {
        project_id: projectA.id, name: 'Sprint 1', goal: 'Finish auth',
        start_date: '2026-01-01', end_date: '2026-01-14',
      }, CEO_USER);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Sprint 1');
      expect(result.data.status).toBe('planned');
      expect(result.data.org_id).toBe(ORG_A);
    });

    it('should reject sprint for project in different org', async () => {
      await expect(
        service.create(ORG_A, {
          project_id: projectB.id, name: 'Cross-org Sprint', start_date: '2026-01-01',
        }, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should list only sprints from accessible projects', async () => {
      const result = await service.findAll(ORG_A, undefined, CEO_USER);
      expect(result.data.every((s: any) => s.org_id === ORG_A)).toBe(true);
    });

    it('should filter by project_id', async () => {
      const result = await service.findAll(ORG_A, projectA.id, CEO_USER);
      expect(result.data.every((s: any) => s.project_id === projectA.id)).toBe(true);
    });
  });

  describe('startSprint', () => {
    it('should change sprint status to active', async () => {
      const created = await service.create(ORG_A, {
        project_id: projectA.id, name: 'Startable Sprint',
        start_date: '2026-01-01', end_date: '2026-01-14',
      }, CEO_USER);
      const result = await service.startSprint(created.data.id, ORG_A, CEO_USER);
      expect(result.data.status).toBe('active');
    });
  });

  describe('completeSprint', () => {
    it('should mark sprint as completed and return incomplete tasks to backlog', async () => {
      const sprint = await service.create(ORG_A, {
        project_id: projectA.id, name: 'Completeable Sprint',
        start_date: '2026-01-01', end_date: '2026-01-14',
      }, CEO_USER);
      await service.startSprint(sprint.data.id, ORG_A, CEO_USER);

      const task1 = await tasksRepo.save({
        id: 'task-sprint-1', org_id: ORG_A, project_id: projectA.id,
        sprint_id: sprint.data.id, title: 'Completed Task', status: 'done',
      });
      const task2 = await tasksRepo.save({
        id: 'task-sprint-2', org_id: ORG_A, project_id: projectA.id,
        sprint_id: sprint.data.id, title: 'Incomplete Task', status: 'in_progress',
      });

      const result = await service.completeSprint(sprint.data.id, ORG_A, CEO_USER);
      expect(result.data.status).toBe('completed');
      expect(result.returned_to_backlog).toBe(1);
      expect(result.completed_tasks).toBe(1);

      const updatedTask = await tasksRepo.findOne({ where: { id: task2.id } });
      expect(updatedTask!.sprint_id).toBeNull();
      expect(updatedTask!.status).toBe('backlog');
    });
  });

  describe('addTaskToSprint / removeTaskFromSprint', () => {
    it('should add and remove tasks from sprints', async () => {
      const sprint = await service.create(ORG_A, {
        project_id: projectA.id, name: 'Task Sprint',
        start_date: '2026-01-01', end_date: '2026-01-14',
      }, CEO_USER);

      const task = await tasksRepo.save({
        id: 'task-to-move', org_id: ORG_A, project_id: projectA.id,
        title: 'Movable Task', status: 'todo',
      });

      await service.addTaskToSprint(sprint.data.id, task.id, ORG_A, CEO_USER);
      const afterAdd = await tasksRepo.findOne({ where: { id: task.id } });
      expect(afterAdd!.sprint_id).toBe(sprint.data.id);

      await service.removeTaskFromSprint(sprint.data.id, task.id, ORG_A, CEO_USER);
      const afterRemove = await tasksRepo.findOne({ where: { id: task.id } });
      expect(afterRemove!.sprint_id).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete sprint and return tasks to backlog', async () => {
      const sprint = await service.create(ORG_A, {
        project_id: projectA.id, name: 'Deletable Sprint',
        start_date: '2026-01-01', end_date: '2026-01-14',
      }, CEO_USER);

      const task = await tasksRepo.save({
        id: 'task-in-deleted-sprint', org_id: ORG_A, project_id: projectA.id,
        sprint_id: sprint.data.id, title: 'Sprint Task', status: 'todo',
      });

      await service.remove(sprint.data.id, ORG_A, CEO_USER);
      const updatedTask = await tasksRepo.findOne({ where: { id: task.id } });
      expect(updatedTask!.sprint_id).toBeNull();

      await expect(
        service.findOne(sprint.data.id, ORG_A, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('organization isolation', () => {
    it('should not allow access to sprints from another org', async () => {
      const sprint = await service.create(ORG_A, {
        project_id: projectA.id, name: 'Org A Sprint',
        start_date: '2026-01-01', end_date: '2026-01-14',
      }, CEO_USER);
      await expect(
        service.findOne(sprint.data.id, ORG_B, CEO_USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return sprint statistics', async () => {
      const sprint = await service.create(ORG_A, {
        project_id: projectA.id, name: 'Stats Sprint',
        start_date: '2026-01-01', end_date: '2026-01-14',
      }, CEO_USER);

      await tasksRepo.save({
        id: 'stats-task-1', org_id: ORG_A, project_id: projectA.id,
        sprint_id: sprint.data.id, title: 'Done Task', status: 'done',
      });
      await tasksRepo.save({
        id: 'stats-task-2', org_id: ORG_A, project_id: projectA.id,
        sprint_id: sprint.data.id, title: 'Todo Task', status: 'todo',
      });

      const stats = await service.getStats(sprint.data.id, ORG_A, CEO_USER);
      expect(stats.data.total_tasks).toBe(2);
      expect(stats.data.completed_tasks).toBe(1);
      expect(stats.data.completion_rate).toBe(50);
    });
  });
});
