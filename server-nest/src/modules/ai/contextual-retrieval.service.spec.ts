import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextualRetrievalService } from './contextual-retrieval.service';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Bug } from '../../entities/bug.entity';
import { User } from '../../entities/user.entity';
import { CodeReview } from '../../entities/code-review.entity';

describe('ContextualRetrievalService', () => {
  let service: ContextualRetrievalService;

  const mockRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
   createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextualRetrievalService,
        { provide: getRepositoryToken(Project), useFactory: mockRepo },
        { provide: getRepositoryToken(Task), useFactory: mockRepo },
        { provide: getRepositoryToken(Sprint), useFactory: mockRepo },
        { provide: getRepositoryToken(Bug), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(CodeReview), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<ContextualRetrievalService>(ContextualRetrievalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractIntent', () => {
    it('should detect task-related domains', () => {
      const intent = service.extractIntent('Show me the current sprint tasks');
      expect(intent.domains).toContain('tasks');
    });

    it('should detect project-related domains', () => {
      const intent = service.extractIntent('How are our projects doing?');
      expect(intent.domains).toContain('projects');
    });

    it('should detect bug-related domains', () => {
      const intent = service.extractIntent('What critical bugs are open?');
      expect(intent.domains).toContain('bugs');
    });

    it('should detect team-related domains', () => {
      const intent = service.extractIntent('Show me the team members');
      expect(intent.domains).toContain('team');
    });

    it('should detect code review domains', () => {
      const intent = service.extractIntent('Show pending PR reviews');
      expect(intent.domains).toContain('code_reviews');
    });

    it('should detect sprint-related domains', () => {
      const intent = service.extractIntent('What is our sprint velocity?');
      expect(intent.domains).toContain('sprints');
    });

    it('should detect time scope - today', () => {
      const intent = service.extractIntent('What tasks are due today?');
      expect(intent.timeScope).toBe('today');
    });

    it('should detect time scope - week', () => {
      const intent = service.extractIntent('What happened this week?');
      expect(intent.timeScope).toBe('week');
    });

    it('should detect action type - create', () => {
      const intent = service.extractIntent('Create a new task');
      expect(intent.actionType).toBe('create');
    });

    it('should detect action type - analyze', () => {
      const intent = service.extractIntent('Analyze the sprint progress');
      expect(intent.actionType).toBe('analyze');
    });

    it('should extract quoted entities', () => {
      const intent = service.extractIntent('Find task "fix login bug"');
      expect(intent.entities).toContain('fix login bug');
    });

    it('should default to projects and tasks when no specific domain', () => {
      const intent = service.extractIntent('Hello, how are you?');
      expect(intent.domains).toContain('projects');
      expect(intent.domains).toContain('tasks');
    });
  });

  describe('retrieveContext', () => {
    it('should return a context object', async () => {
      const context = await service.retrieveContext('org-123', 'Show tasks');
      expect(context).toHaveProperty('projects');
      expect(context).toHaveProperty('tasks');
      expect(context).toHaveProperty('statistics');
    });
  });

  describe('buildContextPrompt', () => {
    it('should build a prompt from context', () => {
      const context = {
        projects: [{ id: 'p1', name: 'Project A', status: 'active' }] as any[],
        tasks: [{ id: 't1', title: 'Task A', status: 'todo', priority: 'high', project_id: 'p1' }] as any[],
        sprints: [],
        bugs: [],
        users: [],
        codeReviews: [],
        statistics: { tasks: { total: 1, in_progress: 0, done: 0 } },
        relevant_entities: [],
      };

      const prompt = service.buildContextPrompt(context);
      expect(prompt).toContain('PROJECTS');
      expect(prompt).toContain('Project A');
      expect(prompt).toContain('TASKS');
      expect(prompt).toContain('Task A');
    });
  });
});
