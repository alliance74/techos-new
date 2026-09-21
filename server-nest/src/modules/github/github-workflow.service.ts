import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GithubApiService } from './github-api.service';
import { GithubInstallationService } from './github-installation.service';
import { Task } from '../../entities/task.entity';

export interface TriggerWorkflowDto {
  repository_full_name: string; // "owner/repo"
  workflow_id: string | number; // workflow file name or ID
  ref: string; // branch or tag
  inputs?: Record<string, string>;
}

@Injectable()
export class GithubWorkflowService {
  private readonly logger = new Logger(GithubWorkflowService.name);

  constructor(
    private githubApi: GithubApiService,
    private installationService: GithubInstallationService,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  /**
   * List available workflows for a repository
   */
  async listWorkflows(org_id: string, repository_full_name: string, page = 1, per_page = 30) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = repository_full_name.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Use "owner/repo".');
    }

    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data?.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;
    const result = await this.githubApi.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}/actions/workflows?per_page=${per_page}&page=${page}`,
    );

    return {
      success: true,
      data: (result.workflows || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        path: w.path,
        state: w.state,
        created_at: w.created_at,
        updated_at: w.updated_at,
        badge_url: w.badge_url,
        html_url: w.html_url,
      })),
      total_count: result.total_count || 0,
    };
  }

  /**
   * Trigger a workflow dispatch event
   */
  async triggerWorkflow(org_id: string, dto: TriggerWorkflowDto, actor: any) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = dto.repository_full_name.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Use "owner/repo".');
    }

    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data?.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;

    // If a task_id was provided, enrich the inputs with task context
    const inputs = { ...dto.inputs };
    if (inputs.task_id) {
      const task = await this.taskRepository.findOne({ where: { id: inputs.task_id } });
      if (task) {
        inputs.task_title = task.title;
        inputs.task_status = task.status;
        inputs.task_priority = task.priority;
      }
    }

    this.logger.log(
      `Triggering workflow ${dto.workflow_id} on ${dto.repository_full_name} (ref: ${dto.ref})`,
    );

    try {
      const result = await this.githubApi.requestAsInstallation(
        installationId,
        'POST',
        `/repos/${owner}/${repo}/actions/workflows/${dto.workflow_id}/dispatches`,
        {
          ref: dto.ref,
          inputs: Object.keys(inputs).length ? inputs : undefined,
        },
      );

      return {
        success: true,
        data: {
          message: `Workflow "${dto.workflow_id}" triggered on ${dto.ref}`,
          repository: dto.repository_full_name,
          workflow_id: dto.workflow_id,
          ref: dto.ref,
          inputs,
          triggered_by: actor?.id || 'system',
          triggered_at: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      // GitHub returns 204 on success with no body, which may throw
      if (error?.status === 204 || error?.message?.includes('No content')) {
        return {
          success: true,
          data: {
            message: `Workflow "${dto.workflow_id}" triggered on ${dto.ref}`,
            repository: dto.repository_full_name,
            workflow_id: dto.workflow_id,
            ref: dto.ref,
            inputs,
            triggered_by: actor?.id || 'system',
            triggered_at: new Date().toISOString(),
          },
        };
      }
      throw new BadRequestException(`Failed to trigger workflow: ${error.message}`);
    }
  }

  /**
   * List recent workflow runs for a repository
   */
  async listWorkflowRuns(
    org_id: string,
    repository_full_name: string,
    workflow_id?: string,
    page = 1,
    per_page = 30,
  ) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = repository_full_name.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Use "owner/repo".');
    }

    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data?.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;

    const workflowPath = workflow_id
      ? `/repos/${owner}/${repo}/actions/workflows/${workflow_id}/runs`
      : `/repos/${owner}/${repo}/actions/runs`;

    const result = await this.githubApi.requestAsInstallation(
      installationId,
      'GET',
      `${workflowPath}?per_page=${per_page}&page=${page}`,
    );

    return {
      success: true,
      data: (result.workflow_runs || []).map((run: any) => ({
        id: run.id,
        name: run.name,
        head_branch: run.head_branch,
        head_sha: run.head_sha,
        status: run.status,
        conclusion: run.conclusion,
        event: run.event,
        created_at: run.created_at,
        updated_at: run.updated_at,
        run_started_at: run.run_started_at,
        html_url: run.html_url,
        run_number: run.run_number,
        actor: run.actor?.login,
        triggering_actor: run.triggering_actor?.login,
      })),
      total_count: result.total_count || 0,
    };
  }

  /**
   * Get a specific workflow run with jobs
   */
  async getWorkflowRun(
    org_id: string,
    repository_full_name: string,
    run_id: number,
  ) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = repository_full_name.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Use "owner/repo".');
    }

    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data?.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;

    const run = await this.githubApi.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}/actions/runs/${run_id}`,
    );

    // Get jobs for this run
    let jobs: any[] = [];
    try {
      const jobsResult = await this.githubApi.requestAsInstallation(
        installationId,
        'GET',
        `/repos/${owner}/${repo}/actions/runs/${run_id}/jobs`,
      );
      jobs = (jobsResult.jobs || []).map((j: any) => ({
        id: j.id,
        name: j.name,
        status: j.status,
        conclusion: j.conclusion,
        started_at: j.started_at,
        completed_at: j.completed_at,
        steps: (j.steps || []).map((s: any) => ({
          name: s.name,
          status: s.status,
          conclusion: s.conclusion,
          number: s.number,
        })),
      }));
    } catch {
      // Jobs may not be accessible
    }

    return {
      success: true,
      data: {
        id: run.id,
        name: run.name,
        head_branch: run.head_branch,
        head_sha: run.head_sha,
        status: run.status,
        conclusion: run.conclusion,
        event: run.event,
        created_at: run.created_at,
        updated_at: run.updated_at,
        run_started_at: run.run_started_at,
        html_url: run.html_url,
        run_number: run.run_number,
        actor: run.actor?.login,
        triggering_actor: run.triggering_actor?.login,
        jobs,
      },
    };
  }

  /**
   * Cancel a workflow run
   */
  async cancelWorkflowRun(
    org_id: string,
    repository_full_name: string,
    run_id: number,
  ) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = repository_full_name.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository format. Use "owner/repo".');
    }

    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data?.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;

    await this.githubApi.requestAsInstallation(
      installationId,
      'POST',
      `/repos/${owner}/${repo}/actions/runs/${run_id}/cancel`,
    );

    return {
      success: true,
      data: {
        message: `Workflow run ${run_id} cancelled`,
        repository: repository_full_name,
        run_id,
      },
    };
  }
}
