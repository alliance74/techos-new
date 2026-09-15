import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IntegrationsService } from './integrations.service';
import { Integration } from '../../entities/integration.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Task } from '../../entities/task.entity';

const ORG_A = 'org-a-00000000-0000-0000-00000000000001';
const ORG_B = 'org-b-00000000-0000-0000-00000000000001';
const ALL_ENTITIES = [Integration, Organization, User, Project, Sprint, Task];

let _typeCounter = 0;
function uniqueType(): string {
  return `test_type_${++_typeCounter}`;
}

describe('IntegrationsService', () => {
  let module: TestingModule;
  let service: IntegrationsService;

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
      providers: [IntegrationsService],
    }).compile();

    service = module.get(IntegrationsService);

    const orgsRepo = module.get(getRepositoryToken(Organization));
    await orgsRepo.save({ id: ORG_A, name: 'Org A' });
    await orgsRepo.save({ id: ORG_B, name: 'Org B' });
  }, 15000);

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('create', () => {
    it('should create an integration', async () => {
      const result = await service.create(ORG_A, {
        type: uniqueType(), name: 'GitHub', config: { repo_url: 'https://github.com/test/repo' },
      });
      expect(result.success).toBe(true);
      expect((result.data as any).org_id).toBe(ORG_A);
      expect((result.data as any).enabled).toBe(true);
    });

    it('should reject duplicate integration type for same org', async () => {
      const type = uniqueType();
      await service.create(ORG_A, { type, name: 'First', config: {} });
      await expect(
        service.create(ORG_A, { type, name: 'Second', config: {} }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow same integration type for different orgs', async () => {
      const type = uniqueType();
      await service.create(ORG_A, { type, name: 'Org A', config: {} });
      const result = await service.create(ORG_B, { type, name: 'Org B', config: {} });
      expect(result.success).toBe(true);
      expect((result.data as any).org_id).toBe(ORG_B);
    });
  });

  describe('findAll', () => {
    it('should list integrations for an org only', async () => {
      const result = await service.findAll(ORG_A);
      expect(result.data.every((i: any) => i.org_id === ORG_A)).toBe(true);
    });

    it('should filter by type', async () => {
      const type = uniqueType();
      await service.create(ORG_A, { type, name: 'Filter Test', config: {} });
      const result = await service.findAll(ORG_A, { type });
      expect(result.data.every((i: any) => i.type === type)).toBe(true);
    });

    it('should filter by enabled status', async () => {
      const result = await service.findAll(ORG_A, { enabled: true });
      expect(result.data.every((i: any) => i.enabled === true)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should find a specific integration', async () => {
      const type = uniqueType();
      const created = await service.create(ORG_A, { type, name: 'Find One', config: {} });
      const found = await service.findOne((created.data as any).id, ORG_A);
      expect((found.data as any).type).toBe(type);
    });

    it('should throw NotFoundException for non-existent integration', async () => {
      await expect(service.findOne('non-existent-id', ORG_A)).rejects.toThrow(NotFoundException);
    });

    it('should not return integration from different org', async () => {
      const type = uniqueType();
      const created = await service.create(ORG_A, { type, name: 'Org A Only', config: {} });
      await expect(service.findOne((created.data as any).id, ORG_B)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update integration fields', async () => {
      const type = uniqueType();
      const created = await service.create(ORG_A, { type, name: 'Before', config: {} });
      const updated = await service.update((created.data as any).id, ORG_A, {
        name: 'After', config: { new_setting: true },
      });
      expect((updated.data as any).name).toBe('After');
    });
  });

  describe('toggleEnabled', () => {
    it('should toggle enabled state', async () => {
      const type = uniqueType();
      const created = await service.create(ORG_A, { type, name: 'Toggle', config: {} });
      const toggled = await service.toggleEnabled((created.data as any).id, ORG_A);
      expect((toggled.data as any).enabled).toBe(false);
      const toggledBack = await service.toggleEnabled((created.data as any).id, ORG_A);
      expect((toggledBack.data as any).enabled).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete an integration', async () => {
      const type = uniqueType();
      const created = await service.create(ORG_A, { type, name: 'Delete', config: {} });
      const result = await service.remove((created.data as any).id, ORG_A);
      expect(result.success).toBe(true);
      await expect(service.findOne((created.data as any).id, ORG_A)).rejects.toThrow(NotFoundException);
    });
  });

  describe('OAuth tokens', () => {
    it('should save and retrieve OAuth tokens', async () => {
      const type = uniqueType();
      await service.create(ORG_A, { type, name: 'OAuth', config: {} });
      await service.saveOAuthTokens(ORG_A, type, {
        access_token: 'test_token', refresh_token: 'refresh_token', expires_at: '2026-12-31',
      });
      const tokens = await service.getOAuthTokens(ORG_A, type);
      expect(tokens.access_token).toBe('test_token');
      expect(tokens.refresh_token).toBe('refresh_token');
    });

    it('should reject disabled integration for token retrieval', async () => {
      const type = uniqueType();
      const created = await service.create(ORG_A, { type, name: 'Disabled OAuth', config: {} });
      await service.toggleEnabled((created.data as any).id, ORG_A);
      await expect(service.getOAuthTokens(ORG_A, type)).rejects.toThrow(BadRequestException);
    });
  });

  describe('webhook handlers', () => {
    it('handleGitHubWebhook returns success', async () => {
      const result = await service.handleGitHubWebhook(ORG_A, {});
      expect(result.success).toBe(true);
    });

    it('handleGitLabWebhook returns success', async () => {
      const result = await service.handleGitLabWebhook(ORG_A, {});
      expect(result.success).toBe(true);
    });

    it('handleStripeWebhook returns success', async () => {
      const result = await service.handleStripeWebhook({});
      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableIntegrations', () => {
    it('should return list of available integration types', async () => {
      const result = await service.getAvailableIntegrations();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some((i: any) => i.type === 'github')).toBe(true);
    });
  });

  describe('organization isolation', () => {
    it('findAll should not return other orgs integrations', async () => {
      const result = await service.findAll(ORG_B);
      expect(result.data.every((i: any) => i.org_id === ORG_B)).toBe(true);
    });
  });
});
