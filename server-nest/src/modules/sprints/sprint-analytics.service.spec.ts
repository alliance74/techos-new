import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SprintAnalyticsService } from './sprint-analytics.service';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { NotFoundException } from '@nestjs/common';

describe('SprintAnalyticsService', () => {
  let service: SprintAnalyticsService;

  const mockRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintAnalyticsService,
        { provide: getRepositoryToken(Project), useFactory: mockRepo },
        { provide: getRepositoryToken(Task), useFactory: mockRepo },
        { provide: getRepositoryToken(Sprint), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SprintAnalyticsService>(SprintAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard data with all sections', async () => {
      const result = await service.getDashboard('org-1');
      expect(result).toHaveProperty('sprints');
      expect(result).toHaveProperty('current_sprint');
      expect(result).toHaveProperty('velocity_trend');
      expect(result).toHaveProperty('burndown');
      expect(result).toHaveProperty('team_performance');
      expect(result).toHaveProperty('overview');
    });

    it('should return correct overview structure', async () => {
      const result = await service.getDashboard('org-1');
      expect(result.overview).toHaveProperty('total_sprints');
      expect(result.overview).toHaveProperty('active_sprints');
      expect(result.overview).toHaveProperty('completed_sprints');
      expect(result.overview).toHaveProperty('average_velocity');
      expect(result.overview).toHaveProperty('average_completion_rate');
      expect(result.overview).toHaveProperty('total_points_completed');
    });
  });

  describe('getSprintDetail', () => {
    it('should throw NotFoundException for non-existent sprint', async () => {
      await expect(
        service.getSprintDetail('org-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return sprint detail when sprint exists', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SprintAnalyticsService,
          { provide: getRepositoryToken(Project), useFactory: mockRepo },
          { provide: getRepositoryToken(Task), useFactory: () => ({
            find: jest.fn().mockResolvedValue([
              { id: 't1', status: 'done', priority: 'high', story_points: 5, sprint_id: 's1', assignee_ids: ['u1'], assignee_id: 'u1', estimated_hours: 8, created_at: new Date() },
              { id: 't2', status: 'todo', priority: 'low', story_points: 2, sprint_id: 's1', assignee_ids: null, assignee_id: null, estimated_hours: 4, created_at: new Date() },
            ]),
          }) },
          { provide: getRepositoryToken(Sprint), useFactory: () => ({
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({
              id: 's1', name: 'Sprint 1', status: 'active', start_date: '2026-09-01', end_date: '2026-09-15', org_id: 'org-1',
            }),
          }) },
        ],
      }).compile();

      const svc = module.get<SprintAnalyticsService>(SprintAnalyticsService);
      const result = await svc.getSprintDetail('org-1', 's1');
      expect(result.name).toBe('Sprint 1');
      expect(result.total_tasks).toBe(2);
      expect(result.completed_tasks).toBe(1);
      expect(result.tasks_by_status).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'done', count: 1 }),
          expect.objectContaining({ status: 'todo', count: 1 }),
        ]),
      );
    });
  });

  describe('getSprintBurndown', () => {
    it('should throw NotFoundException for non-existent sprint', async () => {
      await expect(
        service.getSprintBurndown('org-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return burndown data for existing sprint', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SprintAnalyticsService,
          { provide: getRepositoryToken(Project), useFactory: mockRepo },
          { provide: getRepositoryToken(Task), useFactory: () => ({
            find: jest.fn().mockResolvedValue([
              { id: 't1', story_points: 5, sprint_id: 's1', status: 'done' },
              { id: 't2', story_points: 3, sprint_id: 's1', status: 'todo' },
            ]),
          }) },
          { provide: getRepositoryToken(Sprint), useFactory: () => ({
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({
              id: 's1', name: 'Sprint 1', status: 'active', start_date: '2026-09-01', end_date: '2026-09-15', org_id: 'org-1',
            }),
          }) },
        ],
      }).compile();

      const svc = module.get<SprintAnalyticsService>(SprintAnalyticsService);
      const result = await svc.getSprintBurndown('org-1', 's1');
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('day');
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('remaining_points');
      expect(result[0]).toHaveProperty('ideal_remaining');
    });
  });

  describe('getVelocityComparison', () => {
    it('should return velocity trend data', async () => {
      const result = await service.getVelocityComparison('org-1');
      expect(Array.isArray(result)).toBeTruthy();
    });
  });
});
