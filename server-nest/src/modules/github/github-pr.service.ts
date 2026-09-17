import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { GithubApiService } from './github-api.service';
import { GithubInstallationService } from './github-installation.service';
import { GithubRepository } from '../../entities/github-repository.entity';
import { Task } from '../../entities/task.entity';

export interface CreatePrDto {
  repository_full_name: string; // "owner/repo"
  title: string;
  head: string; // branch name
  base?: string; // defaults to repo default branch
  body?: string;
  task_id?: string; // link to a task
  draft?: boolean;
}

export interface PrLink {
  id: string;
  org_id: string;
  task_id?: string;
  repository_full_name: string;
  pr_number: number;
  pr_url: string;
  title: string;
  head: string;
  base: string;
  status: string;
  created_at: Date;
}

@Injectable()
export class GithubPrService {
  private readonly logger = new Logger(GithubPrService.name);

  constructor(
    private githubApi: GithubApiService,
    private installationService: GithubInstallationService,
    @InjectRepository(GithubRepository)
    private repositoryEntity: Repository<GithubRepository>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  /**
   * Create a pull request via the GitHub API
   */
  async createPullRequest(org_id: string, dto: CreatePrDto, actor: any) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    // Parse owner/repo
    const [owner, repo] = dto.repository_full_name.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository_full_name format. Use "owner/repo".');
    }

    // Find active installation for this org
    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data || !installations.data.length) {
      throw new BadRequestException('No GitHub App installation found for this organization');
    }

    const installation = installations.data[0];
    const installationId = installation.installation_id;

    // Resolve base branch (repo default)
    let base = dto.base;
    if (!base) {
      const repoData = await this.githubApi.getRepository(installationId, owner, repo);
      base = repoData.default_branch || 'main';
    }

    // Build body with task link
    let body = dto.body || '';
    if (dto.task_id) {
      const task = await this.taskRepository.findOne({ where: { id: dto.task_id } });
      if (task) {
        body = `## Linked Task\n\n- **Task:** ${task.title}\n- **Status:** ${task.status}\n- **Priority:** ${task.priority}\n\n---\n\n${body}`;
      }
    }

    // Create PR via GitHub API
    const prPayload = {
      title: dto.title,
      head: dto.head,
      base,
      body,
      draft: dto.draft || false,
    };

    this.logger.log(`Creating PR: ${dto.title} (${dto.head} → ${base}) in ${dto.repository_full_name}`);

    const result = await this.githubApi.requestAsInstallation(
      installationId,
      'POST',
      `/repos/${owner}/${repo}/pulls`,
      prPayload,
    );

    return {
      success: true,
      data: {
        id: result.id,
        number: result.number,
        html_url: result.html_url,
        title: result.title,
        state: result.state,
        head: result.head?.ref,
        base: result.base?.ref,
        draft: result.draft,
        created_at: result.created_at,
        body: result.body,
      },
    };
  }

  /**
   * List PRs for a repository
   */
  async listPullRequests(
    org_id: string,
    repository_full_name: string,
    state: string = 'open',
    page: number = 1,
    per_page: number = 30,
  ) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = repository_full_name.split('/');
    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data || !installations.data.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;
    const result = await this.githubApi.listPullRequests(installationId, owner, repo, {
      state: state as any,
      per_page,
      page,
    });

    return {
      success: true,
      data: result.map((pr: any) => ({
        id: pr.id,
        number: pr.number,
        html_url: pr.html_url,
        title: pr.title,
        state: pr.state,
        user: pr.user?.login,
        head: pr.head?.ref,
        base: pr.base?.ref,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        draft: pr.draft,
        merged: pr.merged,
        mergeable_state: pr.mergeable_state,
      })),
    };
  }

  /**
   * Get a single PR with details
   */
  async getPullRequest(org_id: string, repository_full_name: string, pullNumber: number) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = repository_full_name.split('/');
    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data || !installations.data.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;
    const pr = await this.githubApi.getPullRequest(installationId, owner, repo, pullNumber);

    // Get commit statuses
    let statuses: any[] = [];
    try {
      const statusResult = await this.githubApi.listCommitStatuses(
        installationId,
        owner,
        repo,
        pr.head?.sha,
      );
      statuses = statusResult.statuses || [];
    } catch {
      // Statuses may not exist
    }

    return {
      success: true,
      data: {
        id: pr.id,
        number: pr.number,
        html_url: pr.html_url,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        user: pr.user?.login,
        head: { ref: pr.head?.ref, sha: pr.head?.sha },
        base: { ref: pr.base?.ref, sha: pr.base?.sha },
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        merged: pr.merged,
        merged_at: pr.merged_at,
        mergeable: pr.mergeable,
        mergeable_state: pr.mergeable_state,
        commits: pr.commits,
        additions: pr.additions,
        deletions: pr.deletions,
        changed_files: pr.changed_files,
        statuses,
      },
    };
  }

  /**
   * Merge a pull request
   */
  async mergePullRequest(
    org_id: string,
    repository_full_name: string,
    pullNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash',
  ) {
    if (!this.githubApi.isConfigured()) {
      throw new BadRequestException('GitHub App not configured');
    }

    const [owner, repo] = repository_full_name.split('/');
    const installations = await this.installationService.findByOrgId(org_id);
    if (!installations.data || !installations.data.length) {
      throw new BadRequestException('No GitHub App installation found');
    }

    const installationId = installations.data[0].installation_id;
    const result = await this.githubApi.requestAsInstallation(
      installationId,
      'PUT',
      `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
      { merge_method: mergeMethod },
    );

    return {
      success: true,
      data: {
        message: result.message,
        sha: result.sha,
      },
    };
  }
}
