import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Integration } from '../../entities/integration.entity';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Integration)
    private integrationRepository: Repository<Integration>,
  ) {}

  async create(org_id: string, createDto: any) {
    // Check if integration already exists
    const existing = await this.integrationRepository.findOne({
      where: { org_id, type: createDto.type },
    });

    if (existing) {
      throw new BadRequestException('Integration already exists for this type');
    }

    const integration = this.integrationRepository.create({
      id: randomUUID(),
      org_id,
      ...createDto,
      enabled: true,
    });

    await this.integrationRepository.save(integration);
    return { success: true, data: integration };
  }

  async findAll(org_id: string, filters?: any) {
    const query = this.integrationRepository.createQueryBuilder('integration')
      .where('integration.org_id = :org_id', { org_id });

    if (filters?.type) {
      query.andWhere('integration.type = :type', { type: filters.type });
    }

    if (filters?.enabled !== undefined) {
      query.andWhere('integration.enabled = :enabled', { enabled: filters.enabled });
    }

    query.orderBy('integration.created_at', 'DESC');

    const integrations = await query.getMany();
    return { success: true, data: integrations };
  }

  async findOne(id: string, org_id: string) {
    const integration = await this.integrationRepository.findOne({
      where: { id, org_id },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    return { success: true, data: integration };
  }

  async findByType(org_id: string, type: string) {
    const integration = await this.integrationRepository.findOne({
      where: { org_id, type },
    });

    return integration;
  }

  async update(id: string, org_id: string, updateDto: any) {
    const integration = await this.integrationRepository.findOne({
      where: { id, org_id },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    Object.assign(integration, updateDto);
    await this.integrationRepository.save(integration);

    return { success: true, data: integration };
  }

  async remove(id: string, org_id: string) {
    const integration = await this.integrationRepository.findOne({
      where: { id, org_id },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    await this.integrationRepository.remove(integration);
    return { success: true, message: 'Integration deleted successfully' };
  }

  async toggleEnabled(id: string, org_id: string) {
    const integration = await this.integrationRepository.findOne({
      where: { id, org_id },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    integration.enabled = !integration.enabled;
    await this.integrationRepository.save(integration);

    return { success: true, data: integration };
  }

  // OAuth flow helpers
  async saveOAuthTokens(org_id: string, type: string, tokens: any) {
    let integration = await this.findByType(org_id, type);

    if (!integration) {
      integration = this.integrationRepository.create({
        id: randomUUID(),
        org_id,
        type,
        name: type,
        enabled: true,
        config: {},
      });
    }

    integration.access_token = tokens.access_token;
    integration.refresh_token = tokens.refresh_token;
    integration.expires_at = tokens.expires_at;

    await this.integrationRepository.save(integration);
    return { success: true, data: integration };
  }

  async getOAuthTokens(org_id: string, type: string) {
    const integration = await this.findByType(org_id, type);

    if (!integration) {
      throw new NotFoundException(`${type} integration not found`);
    }

    if (!integration.enabled) {
      throw new BadRequestException(`${type} integration is disabled`);
    }

    return {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expires_at: integration.expires_at,
    };
  }

  // Webhook handlers (placeholder implementations)
  async handleGitHubWebhook(org_id: string, payload: any) {
    // GitHub webhook handling logic
    // Example: Create tasks from issues, sync commits, etc.
    return { success: true, message: 'GitHub webhook processed' };
  }

  async handleGitLabWebhook(org_id: string, payload: any) {
    // GitLab webhook handling logic
    return { success: true, message: 'GitLab webhook processed' };
  }

  async handleStripeWebhook(payload: any) {
    // Stripe webhook handling logic
    // Example: Update invoice status on payment success
    return { success: true, message: 'Stripe webhook processed' };
  }

  async handleSlackWebhook(org_id: string, payload: any) {
    // Slack webhook handling logic
    // Example: Send notifications to Slack
    return { success: true, message: 'Slack webhook processed' };
  }

  // Integration-specific methods
  async syncGitHubIssues(org_id: string, repo: string) {
    const integration = await this.findByType(org_id, 'github');
    
    if (!integration || !integration.enabled) {
      throw new BadRequestException('GitHub integration not configured');
    }

    // TODO: Implement actual GitHub API calls
    return { 
      success: true, 
      message: 'GitHub issues sync initiated',
      note: 'Implementation requires GitHub API client'
    };
  }

  async syncGoogleCalendar(org_id: string) {
    const integration = await this.findByType(org_id, 'google_calendar');
    
    if (!integration || !integration.enabled) {
      throw new BadRequestException('Google Calendar integration not configured');
    }

    // TODO: Implement actual Google Calendar API calls
    return { 
      success: true, 
      message: 'Google Calendar sync initiated',
      note: 'Implementation requires Google Calendar API client'
    };
  }

  async sendSlackNotification(org_id: string, channel: string, message: string) {
    const integration = await this.findByType(org_id, 'slack');
    
    if (!integration || !integration.enabled) {
      throw new BadRequestException('Slack integration not configured');
    }

    // TODO: Implement actual Slack API calls
    return { 
      success: true, 
      message: 'Slack notification sent',
      note: 'Implementation requires Slack API client'
    };
  }

  async getAvailableIntegrations() {
    return {
      success: true,
      data: [
        { type: 'github', name: 'GitHub', description: 'Sync repositories, issues, and commits' },
        { type: 'gitlab', name: 'GitLab', description: 'Sync projects, issues, and merge requests' },
        { type: 'google_calendar', name: 'Google Calendar', description: 'Sync meetings and events' },
        { type: 'microsoft_outlook', name: 'Microsoft Outlook', description: 'Sync calendar and emails' },
        { type: 'zoom', name: 'Zoom', description: 'Create and manage meetings' },
        { type: 'google_meet', name: 'Google Meet', description: 'Create and manage meetings' },
        { type: 'slack', name: 'Slack', description: 'Send notifications and messages' },
        { type: 'discord', name: 'Discord', description: 'Send notifications and messages' },
        { type: 'stripe', name: 'Stripe', description: 'Process payments and subscriptions' },
        { type: 'quickbooks', name: 'QuickBooks', description: 'Sync financial data' },
        { type: 'google_drive', name: 'Google Drive', description: 'Store and sync files' },
        { type: 'dropbox', name: 'Dropbox', description: 'Store and sync files' },
      ],
    };
  }
}
