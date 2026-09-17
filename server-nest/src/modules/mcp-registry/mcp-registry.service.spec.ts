import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpRegistryService } from './mcp-registry.service';
import { McpTool } from '../../entities/mcp-tool.entity';
import { McpToolUsage } from '../../entities/mcp-tool-usage.entity';

describe('McpRegistryService', () => {
  let service: McpRegistryService;
  let toolRepo: Repository<McpTool>;
  let usageRepo: Repository<McpToolUsage>;

  const mockToolRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 'mock-id' })),
    delete: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  });

  const mockUsageRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpRegistryService,
        { provide: getRepositoryToken(McpTool), useFactory: mockToolRepo },
        { provide: getRepositoryToken(McpToolUsage), useFactory: mockUsageRepo },
      ],
    }).compile();

    service = module.get<McpRegistryService>(McpRegistryService);
    toolRepo = module.get(getRepositoryToken(McpTool));
    usageRepo = module.get(getRepositoryToken(McpToolUsage));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerTool', () => {
    it('should create and save a new tool', async () => {
      const result = await service.registerTool('org-1', {
        name: 'Test Tool',
        description: 'A test tool',
        category: 'development',
        protocol: 'mcp',
      });

      expect(result.success).toBeTruthy();
      expect(toolRepo.create).toHaveBeenCalled();
      expect(toolRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return tools for an organization', async () => {
      const result = await service.findAll('org-1');
      expect(result.success).toBeTruthy();
      expect(Array.isArray(result.data)).toBeTruthy();
    });
  });

  describe('getUsageStats', () => {
    it('should return overall stats when no tool_id', async () => {
      const result = await service.getUsageStats('org-1');
      expect(result.success).toBeTruthy();
      expect(result.data).toHaveProperty('total_tools');
      expect(result.data).toHaveProperty('active_tools');
      expect(result.data).toHaveProperty('total_invocations');
    });
  });

  describe('discoverTools', () => {
    it('should search tools by query', async () => {
      const result = await service.discoverTools('org-1', 'code');
      expect(result.success).toBeTruthy();
      expect(Array.isArray(result.data)).toBeTruthy();
    });
  });
});
