import { Injectable, Logger } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { GithubInstallationService } from './github-installation.service';

export interface WebhookEvent {
  type: string;
  action: string;
  installation: {
    id: number;
  };
  repository?: {
    id: number;
    full_name: string;
    name: string;
  };
  sender?: {
    id: number;
    login: string;
  };
  [key: string]: any;
}

@Injectable()
export class GithubWebhookService {
  private readonly logger = new Logger(GithubWebhookService.name);

  constructor(
    private githubApi: GithubApiService,
    private installationService: GithubInstallationService,
  ) {}

  /**
   * Process incoming webhook event
   */
  async processEvent(event: WebhookEvent, deliveryId: string) {
    const { type, action, installation } = event;

    this.logger.log(`Processing webhook: ${type}/${action} for installation ${installation?.id}`);

    // Find the installation record
    const installationRecord = await this.installationService.findByInstallationId(
      installation?.id,
    );

    if (!installationRecord) {
      this.logger.warn(`Installation ${installation?.id} not found, ignoring event`);
      return { success: true, message: 'Installation not found' };
    }

    // Record event for dedup
    await this.installationService.recordEvent({
      installation_id: installationRecord.id,
      event_type: type,
      action,
      delivery_id: deliveryId,
      github_repo_id: event.repository?.id,
      repo_full_name: event.repository?.full_name,
      payload: event,
    });

    // Process based on event type
    switch (type) {
      case 'installation':
        return this.handleInstallationEvent(event, installationRecord);
      case 'installation_repositories':
        return this.handleInstallationRepositoriesEvent(event, installationRecord);
      case 'push':
        return this.handlePushEvent(event, installationRecord);
      case 'pull_request':
        return this.handlePullRequestEvent(event, installationRecord);
      case 'issues':
        return this.handleIssuesEvent(event, installationRecord);
      case 'issue_comment':
        return this.handleIssueCommentEvent(event, installationRecord);
      case 'pull_request_review':
        return this.handlePullRequestReviewEvent(event, installationRecord);
      case 'workflow_run':
        return this.handleWorkflowRunEvent(event, installationRecord);
      case 'check_run':
        return this.handleCheckRunEvent(event, installationRecord);
      default:
        this.logger.log(`Unhandled event type: ${type}`);
        return { success: true, message: `Unhandled event type: ${type}` };
    }
  }

  /**
   * Handle installation events
   */
  private async handleInstallationEvent(event: WebhookEvent, installation: any) {
    const { action } = event;

    switch (action) {
      case 'created':
        return this.installationService.handleInstallation(event.installation);
      case 'suspended':
        return this.installationService.handleInstallationSuspend(event.installation.id);
      case 'deleted':
        return this.installationService.handleInstallationDelete(event.installation.id);
      default:
        this.logger.log(`Unhandled installation action: ${action}`);
        return { success: true };
    }
  }

  /**
   * Handle installation repositories events
   */
  private async handleInstallationRepositoriesEvent(event: WebhookEvent, installation: any) {
    const { action } = event;

    if (action === 'added' || action === 'removed') {
      // Re-sync repositories
      await this.installationService.syncRepositories(installation);
    }

    return { success: true };
  }

  /**
   * Handle push events
   */
  private async handlePushEvent(event: WebhookEvent, installation: any) {
    const { ref, commits, repository } = event;

    this.logger.log(`Push to ${repository?.full_name}: ${ref} (${commits?.length || 0} commits)`);

    // Store push event data for later analysis
    // Could trigger CI/CD, update task status, etc.

    return { success: true };
  }

  /**
   * Handle pull request events
   */
  private async handlePullRequestEvent(event: WebhookEvent, installation: any) {
    const { action, pull_request, repository } = event;

    this.logger.log(`PR ${action} on ${repository?.full_name}: #${pull_request?.number}`);

    // Store PR data, update related tasks, etc.

    return { success: true };
  }

  /**
   * Handle issues events
   */
  private async handleIssuesEvent(event: WebhookEvent, installation: any) {
    const { action, issue, repository } = event;

    this.logger.log(`Issue ${action} on ${repository?.full_name}: #${issue?.number}`);

    // Store issue data, sync with TechOS tasks, etc.

    return { success: true };
  }

  /**
   * Handle issue comment events
   */
  private async handleIssueCommentEvent(event: WebhookEvent, installation: any) {
    const { action, comment, issue, repository } = event;

    this.logger.log(`Comment ${action} on issue #${issue?.number} in ${repository?.full_name}`);

    // Store comment, update task status, etc.

    return { success: true };
  }

  /**
   * Handle pull request review events
   */
  private async handlePullRequestReviewEvent(event: WebhookEvent, installation: any) {
    const { action, review, pull_request, repository } = event;

    this.logger.log(`PR review ${action} on #${pull_request?.number} in ${repository?.full_name}`);

    // Store review, update task status, etc.

    return { success: true };
  }

  /**
   * Handle workflow run events
   */
  private async handleWorkflowRunEvent(event: WebhookEvent, installation: any) {
    const { action, workflow_run, repository } = event;

    this.logger.log(`Workflow ${action}: ${workflow_run?.name} in ${repository?.full_name}`);

    // Store workflow status, update task CI status, etc.

    return { success: true };
  }

  /**
   * Handle check run events
   */
  private async handleCheckRunEvent(event: WebhookEvent, installation: any) {
    const { action, check_run, repository } = event;

    this.logger.log(`Check run ${action}: ${check_run?.name} in ${repository?.full_name}`);

    // Store check run status, etc.

    return { success: true };
  }
}
