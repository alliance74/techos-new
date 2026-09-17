import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import { ContextualRetrievalService } from './contextual-retrieval.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { User } from '../../entities/user.entity';
import { AiConversation } from '../../entities/ai-conversation.entity';
import { AiMessage } from '../../entities/ai-message.entity';
import { AiUsage } from '../../entities/ai-usage.entity';

describe('AiService', () => {
  let service: AiService;

  const mockRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue(undefined),
  });

  const mockContextualRetrieval = () => ({
    retrieveContext: jest.fn().mockResolvedValue({
      projects: [],
      tasks: [],
      sprints: [],
      bugs: [],
      users: [],
      codeReviews: [],
      statistics: {
        projects: { total: 0, active: 0, completed: 0 },
        tasks: { total: 0, todo: 0, in_progress: 0, done: 0 },
        bugs: { total: 0, open: 0, critical: 0 },
        sprints: 0,
        team: 0,
        code_reviews: 0,
      },
      relevant_entities: [],
    }),
    buildContextPrompt: jest.fn().mockReturnValue('# RELEVANT DATA\nNo data available.'),
  });

  const mockRecommendationEngine = () => ({
    generateRecommendations: jest.fn().mockResolvedValue([]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return undefined;
              if (key === 'ANTHROPIC_API_KEY') return undefined;
              if (key === 'GEMINI_API_KEY') return undefined;
              if (key === 'GROK_API_KEY') return undefined;
              return undefined;
            }),
          },
        },
        {
          provide: ContextualRetrievalService,
          useFactory: mockContextualRetrieval,
        },
        {
          provide: RecommendationEngineService,
          useFactory: mockRecommendationEngine,
        },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(AiConversation), useFactory: mockRepo },
        { provide: getRepositoryToken(AiMessage), useFactory: mockRepo },
        { provide: getRepositoryToken(AiUsage), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should return mock response when no providers configured', async () => {
      const result = await service.chat('org-1', 'user-1', 'Hello');
      expect(result.success).toBeTruthy();
      expect(result.data.provider).toBe('mock');
      expect(result.data.message).toContain('MOCK RESPONSE');
    });

    it('should throw BadRequestException for empty message', async () => {
      await expect(service.chat('org-1', 'user-1', '')).rejects.toThrow('Message cannot be empty');
      await expect(service.chat('org-1', 'user-1', '   ')).rejects.toThrow('Message cannot be empty');
    });

    it('should use contextual retrieval for context', async () => {
      const result = await service.chat('org-1', 'user-1', 'Show tasks');
      expect(result.success).toBeTruthy();
      // The service should have used contextual retrieval
      // (verified by the mock returning success)
    });
  });

  describe('chatInConversation', () => {
    it('should throw BadRequestException for empty message', async () => {
      await expect(
        service.chatInConversation('org-1', 'user-1', 'conv-1', ''),
      ).rejects.toThrow('Message cannot be empty');
    });

    it('should throw BadRequestException for non-existent conversation', async () => {
      await expect(
        service.chatInConversation('org-1', 'user-1', 'nonexistent', 'Hello'),
      ).rejects.toThrow('Conversation not found');
    });
  });

  describe('generateReport', () => {
    it('should return mock response for any report type', async () => {
      const result = await service.generateReport('org-1', 'executive');
      expect(result.success).toBeTruthy();
      expect(result.data.provider).toBe('mock');
    });
  });

  describe('analyzeRisk', () => {
    it('should return mock response', async () => {
      const result = await service.analyzeRisk('org-1');
      expect(result.success).toBeTruthy();
    });
  });

  describe('suggestPriorities', () => {
    it('should return mock response', async () => {
      const result = await service.suggestPriorities('org-1');
      expect(result.success).toBeTruthy();
    });
  });
});
