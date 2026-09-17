import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationEngineService } from './recommendation-engine.service';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Bug } from '../../entities/bug.entity';
import { User } from '../../entities/user.entity';

describe('RecommendationEngineService', () => {
  let service: RecommendationEngineService;

  const mockRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationEngineService,
        { provide: getRepositoryToken(Project), useFactory: mockRepo },
        { provide: getRepositoryToken(Task), useFactory: mockRepo },
        { provide: getRepositoryToken(Sprint), useFactory: mockRepo },
        { provide: getRepositoryToken(Bug), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<RecommendationEngineService>(RecommendationEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRecommendations', () => {
    it('should return an array of recommendations', async () => {
      const recommendations = await service.generateRecommendations('org-123');
      expect(Array.isArray(recommendations)).toBeTruthy();
    });

    it('should include velocity forecast recommendation for completed sprints', async () => {
      const module = await Test.createTestingModule({
        providers: [
          RecommendationEngineService,
          {
            provide: getRepositoryToken(Project),
            useFactory: () => ({ find: jest.fn().mockResolvedValue([]) }),
          },
          {
            provide: getRepositoryToken(Task),
            useFactory: () => ({
              find: jest.fn().mockImplementation((opts) => {
                if (opts.where?.sprint_id) {
                  return Promise.resolve([
                    { id: 't1', status: 'done', story_points: 5, sprint_id: 's1' },
                    { id: 't2', status: 'todo', story_points: 3, sprint_id: 's1' },
                  ]);
                }
                return Promise.resolve([]);
              }),
            }),
          },
          {
            provide: getRepositoryToken(Sprint),
            useFactory: () => ({
              find: jest.fn().mockResolvedValue([
                { id: 's1', status: 'completed', name: 'Sprint 1' },
                { id: 's2', status: 'completed', name: 'Sprint 2' },
              ]),
            }),
          },
          {
            provide: getRepositoryToken(Bug),
            useFactory: () => ({ find: jest.fn().mockResolvedValue([]) }),
          },
          {
            provide: getRepositoryToken(User),
            useFactory: () => ({ find: jest.fn().mockResolvedValue([]) }),
          },
        ],
      }).compile();

      const svc = module.get<RecommendationEngineService>(RecommendationEngineService);
      const recs = await svc.generateRecommendations('org-123');
      const velocityRec = recs.find((r) => r.type === 'velocity_forecast');
      expect(velocityRec).toBeDefined();
    });

    it('should recommend assignment for unassigned tasks', async () => {
      const module = await Test.createTestingModule({
        providers: [
          RecommendationEngineService,
          {
            provide: getRepositoryToken(Project),
            useFactory: () => ({ find: jest.fn().mockResolvedValue([]) }),
          },
          {
            provide: getRepositoryToken(Task),
            useFactory: () => ({
              find: jest.fn().mockResolvedValue([
                { id: 't1', status: 'todo', assignee_id: null, story_points: 5 },
                { id: 't2', status: 'todo', assignee_id: null, story_points: 3 },
                { id: 't3', status: 'todo', assignee_id: null, story_points: 2 },
                { id: 't4', status: 'todo', assignee_id: null, story_points: 1 },
              ]),
            }),
          },
          {
            provide: getRepositoryToken(Sprint),
            useFactory: () => ({ find: jest.fn().mockResolvedValue([]) }),
          },
          {
            provide: getRepositoryToken(Bug),
            useFactory: () => ({ find: jest.fn().mockResolvedValue([]) }),
          },
          {
            provide: getRepositoryToken(User),
            useFactory: () => ({ find: jest.fn().mockResolvedValue([]) }),
          },
        ],
      }).compile();

      const svc = module.get<RecommendationEngineService>(RecommendationEngineService);
      const recs = await svc.generateRecommendations('org-123');
      const assignmentRec = recs.find((r) => r.type === 'team_assignment');
      expect(assignmentRec).toBeDefined();
      expect(assignmentRec?.priority).toBe('medium');
    });
  });
});
