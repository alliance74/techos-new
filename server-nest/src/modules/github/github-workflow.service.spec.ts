import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GithubWorkflowService } from './github-workflow.service';
import { GithubApiService } from './github-api.service';
import { GithubInstallationService } from './github-installation.service';
import { Task } from '../../entities/task.entity';

describe('GithubWorkflowService', () => {
  let service: GithubWorkflowService;

  const mockGithubApi = () => ({
    isConfigured: jest.fn().mockReturnValue(true),
    requestAsInstallation: jest.fn(),
  });

  const mockInstallationService = () => ({
    findByOrgId: jest.fn(),
  });

  const mockTaskRepo = () => ({
    findOne: jest.fn(),
  });

  const mockInstallations = {
    data: [{ installation_id: 12345 }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubWorkflowService,
        { provide: GithubApiService, useFactory: mockGithubApi },
        { provide: GithubInstallationService, useFactory: mockInstallationService },
        { provide: getRepositoryToken(Task), useFactory: mockTaskRepo },
      ],
    }).compile();

    service = module.get<GithubWorkflowService>(GithubWorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listWorkflows', () => {
    it('should throw BadRequestException when GitHub App not configured', async () => {
      const githubApi = (service as any).githubApi;
      githubApi.isConfigured.mockReturnValue(false);

      await expect(
        service.listWorkflows('org-1', 'owner/repo'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.listWorkflows('org-1', 'owner/repo'),
      ).rejects.toThrow('GitHub App not configured');
    });

    it('should throw BadRequestException for invalid repository format', async () => {
      await expect(
        service.listWorkflows('org-1', 'invalid-repo-name'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.listWorkflows('org-1', 'invalid-repo-name'),
      ).rejects.toThrow('Invalid repository format');
    });

    it('should throw BadRequestException when no installation found', async () => {
      const installationService = (service as any).installationService;
      installationService.findByOrgId.mockResolvedValue({ data: [] });

      await expect(
        service.listWorkflows('org-1', 'owner/repo'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.listWorkflows('org-1', 'owner/repo'),
      ).rejects.toThrow('No GitHub App installation found');
    });

    it('should return mapped workflows', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue({
        total_count: 2,
        workflows: [
          {
            id: 1,
            name: 'CI',
            path: '.github/workflows/ci.yml',
            state: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
            badge_url: 'https://badge.example.com',
            html_url: 'https://github.example.com',
          },
          {
            id: 2,
            name: 'Deploy',
            path: '.github/workflows/deploy.yml',
            state: 'active',
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
            badge_url: 'https://badge.example.com',
            html_url: 'https://github.example.com',
          },
        ],
      });

      const result = await service.listWorkflows('org-1', 'owner/repo');

      expect(result.success).toBe(true);
      expect(result.total_count).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('CI');
      expect(result.data[0].path).toBe('.github/workflows/ci.yml');
      expect(result.data[1].name).toBe('Deploy');
    });

    it('should handle empty workflows response', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue({
        total_count: 0,
        workflows: [],
      });

      const result = await service.listWorkflows('org-1', 'owner/repo');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should pass pagination parameters', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue({
        total_count: 0,
        workflows: [],
      });

      await service.listWorkflows('org-1', 'owner/repo', 2, 50);

      expect(githubApi.requestAsInstallation).toHaveBeenCalledWith(
        12345,
        'GET',
        '/repos/owner/repo/actions/workflows?per_page=50&page=2',
      );
    });
  });

  describe('triggerWorkflow', () => {
    const triggerDto = {
      repository_full_name: 'owner/repo',
      workflow_id: 'ci.yml',
      ref: 'main',
    };

    it('should throw BadRequestException when GitHub App not configured', async () => {
      const githubApi = (service as any).githubApi;
      githubApi.isConfigured.mockReturnValue(false);

      await expect(
        service.triggerWorkflow('org-1', triggerDto, { id: 'user-1' }),
      ).rejects.toThrow('GitHub App not configured');
    });

    it('should throw BadRequestException for invalid repository format', async () => {
      await expect(
        service.triggerWorkflow('org-1', { ...triggerDto, repository_full_name: 'invalid' }, { id: 'user-1' }),
      ).rejects.toThrow('Invalid repository format');
    });

    it('should throw BadRequestException when no installation found', async () => {
      const installationService = (service as any).installationService;
      installationService.findByOrgId.mockResolvedValue({ data: [] });

      await expect(
        service.triggerWorkflow('org-1', triggerDto, { id: 'user-1' }),
      ).rejects.toThrow('No GitHub App installation found');
    });

    it('should trigger workflow successfully', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue(null);

      const result = await service.triggerWorkflow('org-1', triggerDto, { id: 'user-1' });

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('ci.yml');
      expect(result.data.message).toContain('main');
      expect(result.data.repository).toBe('owner/repo');
      expect(result.data.ref).toBe('main');
      expect(result.data.triggered_by).toBe('user-1');
      expect(result.data.triggered_at).toBeDefined();
    });

    it('should handle 204 No Content response from GitHub', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockRejectedValue({ status: 204, message: 'No content' });

      const result = await service.triggerWorkflow('org-1', triggerDto, { id: 'user-1' });

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('ci.yml');
    });

    it('should re-throw non-204 errors as BadRequestException', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockRejectedValue(new Error('Not Found'));

      await expect(
        service.triggerWorkflow('org-1', triggerDto, { id: 'user-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enrich inputs with task context when task_id provided', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      const taskRepo = (service as any).taskRepository;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue(null);
      taskRepo.findOne.mockResolvedValue({
        title: 'Fix login bug',
        status: 'in_progress',
        priority: 'high',
      });

      const dtoWithTask = {
        ...triggerDto,
        inputs: { task_id: 'task-123' },
      };

      const result = await service.triggerWorkflow('org-1', dtoWithTask, { id: 'user-1' });

      expect(result.success).toBe(true);
      expect(result.data.inputs.task_title).toBe('Fix login bug');
      expect(result.data.inputs.task_status).toBe('in_progress');
      expect(result.data.inputs.task_priority).toBe('high');
    });

    it('should use "system" as triggered_by when actor has no id', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue(null);

      const result = await service.triggerWorkflow('org-1', triggerDto, {});

      expect(result.data.triggered_by).toBe('system');
    });
  });

  describe('listWorkflowRuns', () => {
    it('should throw BadRequestException when GitHub App not configured', async () => {
      const githubApi = (service as any).githubApi;
      githubApi.isConfigured.mockReturnValue(false);

      await expect(
        service.listWorkflowRuns('org-1', 'owner/repo'),
      ).rejects.toThrow('GitHub App not configured');
    });

    it('should return mapped workflow runs', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue({
        total_count: 1,
        workflow_runs: [
          {
            id: 456,
            name: 'CI',
            head_branch: 'main',
            head_sha: 'abc123def456',
            status: 'completed',
            conclusion: 'success',
            event: 'push',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:05:00Z',
            run_started_at: '2024-01-01T00:00:01Z',
            html_url: 'https://github.example.com/run/456',
            run_number: 42,
            actor: { login: 'testuser' },
            triggering_actor: { login: 'triggeruser' },
          },
        ],
      });

      const result = await service.listWorkflowRuns('org-1', 'owner/repo');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(456);
      expect(result.data[0].name).toBe('CI');
      expect(result.data[0].actor).toBe('testuser');
      expect(result.data[0].triggering_actor).toBe('triggeruser');
    });

    it('should use workflow-specific endpoint when workflow_id provided', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue({
        total_count: 0,
        workflow_runs: [],
      });

      await service.listWorkflowRuns('org-1', 'owner/repo', 'ci.yml');

      expect(githubApi.requestAsInstallation).toHaveBeenCalledWith(
        12345,
        'GET',
        '/repos/owner/repo/actions/workflows/ci.yml/runs?per_page=30&page=1',
      );
    });

    it('should use general runs endpoint when no workflow_id provided', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue({
        total_count: 0,
        workflow_runs: [],
      });

      await service.listWorkflowRuns('org-1', 'owner/repo');

      expect(githubApi.requestAsInstallation).toHaveBeenCalledWith(
        12345,
        'GET',
        '/repos/owner/repo/actions/runs?per_page=30&page=1',
      );
    });
  });

  describe('getWorkflowRun', () => {
    it('should throw BadRequestException when GitHub App not configured', async () => {
      const githubApi = (service as any).githubApi;
      githubApi.isConfigured.mockReturnValue(false);

      await expect(
        service.getWorkflowRun('org-1', 'owner/repo', 456),
      ).rejects.toThrow('GitHub App not configured');
    });

    it('should return run details with jobs', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);

      githubApi.requestAsInstallation
        .mockResolvedValueOnce({
          id: 456,
          name: 'CI',
          head_branch: 'main',
          head_sha: 'abc123',
          status: 'completed',
          conclusion: 'success',
          event: 'push',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:05:00Z',
          run_started_at: '2024-01-01T00:00:01Z',
          html_url: 'https://example.com',
          run_number: 42,
          actor: { login: 'testuser' },
          triggering_actor: { login: 'triggeruser' },
        })
        .mockResolvedValueOnce({
          jobs: [
            {
              id: 789,
              name: 'Build',
              status: 'completed',
              conclusion: 'success',
              started_at: '2024-01-01T00:00:01Z',
              completed_at: '2024-01-01T00:03:00Z',
              steps: [
                {
                  name: 'Checkout',
                  status: 'completed',
                  conclusion: 'success',
                  number: 1,
                },
              ],
            },
          ],
        });

      const result = await service.getWorkflowRun('org-1', 'owner/repo', 456);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(456);
      expect(result.data.jobs).toHaveLength(1);
      expect(result.data.jobs[0].name).toBe('Build');
      expect(result.data.jobs[0].steps).toHaveLength(1);
      expect(result.data.jobs[0].steps[0].name).toBe('Checkout');
    });

    it('should handle empty jobs gracefully', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);

      githubApi.requestAsInstallation
        .mockResolvedValueOnce({
          id: 456,
          name: 'CI',
          head_branch: 'main',
          head_sha: 'abc123',
          status: 'completed',
          conclusion: 'success',
          event: 'push',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:05:00Z',
          html_url: 'https://example.com',
          run_number: 42,
        })
        .mockResolvedValueOnce({ jobs: [] });

      const result = await service.getWorkflowRun('org-1', 'owner/repo', 456);

      expect(result.success).toBe(true);
      expect(result.data.jobs).toHaveLength(0);
    });

    it('should handle jobs fetch failure gracefully', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);

      githubApi.requestAsInstallation
        .mockResolvedValueOnce({
          id: 456,
          name: 'CI',
          head_branch: 'main',
          head_sha: 'abc123',
          status: 'completed',
          conclusion: 'success',
          event: 'push',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:05:00Z',
          html_url: 'https://example.com',
          run_number: 42,
        })
        .mockRejectedValueOnce(new Error('Forbidden'));

      const result = await service.getWorkflowRun('org-1', 'owner/repo', 456);

      expect(result.success).toBe(true);
      expect(result.data.jobs).toEqual([]);
    });
  });

  describe('cancelWorkflowRun', () => {
    it('should throw BadRequestException when GitHub App not configured', async () => {
      const githubApi = (service as any).githubApi;
      githubApi.isConfigured.mockReturnValue(false);

      await expect(
        service.cancelWorkflowRun('org-1', 'owner/repo', 456),
      ).rejects.toThrow('GitHub App not configured');
    });

    it('should cancel a workflow run successfully', async () => {
      const installationService = (service as any).installationService;
      const githubApi = (service as any).githubApi;
      installationService.findByOrgId.mockResolvedValue(mockInstallations);
      githubApi.requestAsInstallation.mockResolvedValue(null);

      const result = await service.cancelWorkflowRun('org-1', 'owner/repo', 456);

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('456');
      expect(result.data.repository).toBe('owner/repo');
      expect(result.data.run_id).toBe(456);
      expect(githubApi.requestAsInstallation).toHaveBeenCalledWith(
        12345,
        'POST',
        '/repos/owner/repo/actions/runs/456/cancel',
      );
    });

    it('should throw BadRequestException for invalid repo format', async () => {
      await expect(
        service.cancelWorkflowRun('org-1', 'invalid', 456),
      ).rejects.toThrow('Invalid repository format');
    });

    it('should throw BadRequestException when no installation found', async () => {
      const installationService = (service as any).installationService;
      installationService.findByOrgId.mockResolvedValue({ data: [] });

      await expect(
        service.cancelWorkflowRun('org-1', 'owner/repo', 456),
      ).rejects.toThrow('No GitHub App installation found');
    });
  });
});
