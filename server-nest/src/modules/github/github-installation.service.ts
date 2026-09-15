import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { GithubInstallation } from '../../entities/github-installation.entity';
import { GithubRepository } from '../../entities/github-repository.entity';
import { GithubEvent } from '../../entities/github-event.entity';
import { GithubApiService } from './github-api.service';

@Injectable()
export class GithubInstallationService {
  private readonly logger = new Logger(GithubInstallationService.name);

  constructor(
    @InjectRepository(GithubInstallation)
    private installationsRepository: Repository<GithubInstallation>,
    @InjectRepository(GithubRepository)
    private repositoriesRepository: Repository<GithubRepository>,
    @InjectRepository(GithubEvent)
    private eventsRepository: Repository<GithubEvent>,
    private githubApi: GithubApiService,
  ) {}

  /**
   * Handle new GitHub App installation
   */
  async handleInstallation(installationData: any) {
    const {
      id: installation_id,
      account,
      access_tokens_url,
      repositories_url,
      permissions,
      events,
    } = installationData;

    this.logger.log(`Processing installation ${installation_id} for ${account.login}`);

    // Check if installation already exists
    let installation = await this.installationsRepository.findOne({
      where: { installation_id },
    });

    if (installation) {
      // Update existing installation
      installation.account_login = account.login;
      installation.account_type = account.type;
      installation.access_tokens_url = access_tokens_url;
      installation.repositories_url = repositories_url;
      installation.permissions = permissions;
      installation.events = events;
      installation.status = 'active';
      installation.updated_at = new Date();
    } else {
      // Create new installation
      installation = this.installationsRepository.create({
        id: randomUUID(),
        installation_id,
        github_account_id: account.id,
        account_login: account.login,
        account_type: account.type,
        access_tokens_url,
        repositories_url,
        permissions,
        events,
        status: 'active',
      });
    }

    await this.installationsRepository.save(installation);

    // Sync repositories
    await this.syncRepositories(installation);

    return { success: true, data: installation };
  }

  /**
   * Handle installation suspension
   */
  async handleInstallationSuspend(installationId: number) {
    const installation = await this.installationsRepository.findOne({
      where: { installation_id: installationId },
    });

    if (installation) {
      installation.status = 'suspended';
      installation.suspended_at = new Date();
      installation.updated_at = new Date();
      await this.installationsRepository.save(installation);
      this.logger.log(`Installation ${installationId} suspended`);
    }

    return { success: true };
  }

  /**
   * Handle installation deletion
   */
  async handleInstallationDelete(installationId: number) {
    const installation = await this.installationsRepository.findOne({
      where: { installation_id: installationId },
    });

    if (installation) {
      installation.status = 'deleted';
      installation.updated_at = new Date();
      await this.installationsRepository.save(installation);

      // Mark all repos as removed
      await this.repositoriesRepository.update(
        { installation_id: installation.id },
        { status: 'removed' },
      );

      this.logger.log(`Installation ${installationId} deleted`);
    }

    return { success: true };
  }

  /**
   * Sync repositories from GitHub
   */
  async syncRepositories(installation: GithubInstallation) {
    try {
      const response = await this.githubApi.listInstallationRepositories(
        installation.installation_id,
      );

      const repos = response.repositories || [];

      for (const repo of repos) {
        let existing = await this.repositoriesRepository.findOne({
          where: { github_repo_id: repo.id },
        });

        if (existing) {
          // Update existing
          existing.name = repo.name;
          existing.full_name = repo.full_name;
          existing.description = repo.description;
          existing.private = repo.private;
          existing.default_branch = repo.default_branch;
          existing.updated_at = new Date();
          await this.repositoriesRepository.save(existing);
        } else {
          // Create new
          const newRepo = this.repositoriesRepository.create({
            id: randomUUID(),
            installation_id: installation.id,
            github_repo_id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            default_branch: repo.default_branch,
          });
          await this.repositoriesRepository.save(newRepo);
        }
      }

      this.logger.log(`Synced ${repos.length} repositories for installation ${installation.installation_id}`);
      return { success: true, count: repos.length };
    } catch (error) {
      this.logger.error(`Failed to sync repositories: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get installation by ID
   */
  async findOne(id: string) {
    const installation = await this.installationsRepository.findOne({
      where: { id },
      relations: ['repositories'],
    });

    if (!installation) {
      throw new NotFoundException('Installation not found');
    }

    return { success: true, data: installation };
  }

  /**
   * Get installation by GitHub installation ID
   */
  async findByInstallationId(installationId: number) {
    return this.installationsRepository.findOne({
      where: { installation_id: installationId },
    });
  }

  /**
   * Get all installations for an organization
   */
  async findByOrgId(orgId: string) {
    const installations = await this.installationsRepository.find({
      where: { org_id: orgId, status: 'active' },
      relations: ['repositories'],
    });

    return { success: true, data: installations };
  }

  /**
   * Get repositories for an organization
   */
  async getRepositories(orgId: string) {
    const installations = await this.installationsRepository.find({
      where: { org_id: orgId, status: 'active' },
    });

    const installationIds = installations.map((i) => i.id);

    if (!installationIds.length) {
      return { success: true, data: [] };
    }

    const repos = await this.repositoriesRepository.find({
      where: { installation_id: { In: installationIds } as any },
      order: { full_name: 'ASC' },
    });

    return { success: true, data: repos };
  }

  /**
   * Record webhook event for deduplication
   */
  async recordEvent(eventData: {
    installation_id: string;
    event_type: string;
    action: string;
    delivery_id: string;
    github_repo_id?: number;
    repo_full_name?: string;
    payload?: any;
  }) {
    // Check for duplicate delivery
    if (eventData.delivery_id) {
      const existing = await this.eventsRepository.findOne({
        where: { delivery_id: eventData.delivery_id },
      });

      if (existing) {
        this.logger.log(`Duplicate event delivery: ${eventData.delivery_id}`);
        return existing;
      }
    }

    const event = this.eventsRepository.create({
      id: randomUUID(),
      ...eventData,
      status: 'processed',
    });

    return this.eventsRepository.save(event);
  }

  /**
   * Get recent events for an organization
   */
  async getRecentEvents(orgId: string, limit = 50) {
    const installations = await this.installationsRepository.find({
      where: { org_id: orgId, status: 'active' },
    });

    const installationIds = installations.map((i) => i.id);

    if (!installationIds.length) {
      return { success: true, data: [] };
    }

    const events = await this.eventsRepository.find({
      where: { installation_id: { In: installationIds } as any },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return { success: true, data: events };
  }
}

// Import In for queries
import { In } from 'typeorm';
