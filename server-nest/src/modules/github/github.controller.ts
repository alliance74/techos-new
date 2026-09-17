import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GithubApiService } from './github-api.service';
import { GithubInstallationService } from './github-installation.service';
import { GithubWebhookService } from './github-webhook.service';
import { GithubPrService } from './github-pr.service';

@Controller('github')
@UseGuards(ThrottlerGuard)
export class GithubController {
  constructor(
    private githubApi: GithubApiService,
    private installationService: GithubInstallationService,
    private webhookService: GithubWebhookService,
    private prService: GithubPrService,
  ) {}

  /**
   * GitHub webhook endpoint (no auth - verified by signature)
   */
  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-github-event') eventType: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: any,
  ) {
    // Verify webhook signature
    if (this.githubApi.isConfigured()) {
      const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(body);
      if (!this.githubApi.verifyWebhookSignature(rawBody, signature)) {
        return { error: 'Invalid signature' };
      }
    }

    // Process the event
    return this.webhookService.processEvent(
      { type: eventType, ...body },
      deliveryId,
    );
  }

  /**
   * Get GitHub App installation URL
   */
  @Get('install-url')
  @UseGuards(JwtAuthGuard)
  getInstallUrl(@CurrentUser() user: any) {
    if (!this.githubApi.isConfigured()) {
      return { error: 'GitHub App not configured' };
    }

    const appId = process.env.GITHUB_APP_ID;
    const installUrl = `https://github.com/apps/techos-app/installations/new`;

    return { success: true, data: { url: installUrl, app_id: appId } };
  }

  /**
   * List installations for current organization
   */
  @Get('installations')
  @UseGuards(JwtAuthGuard)
  getInstallations(@CurrentUser() user: any) {
    return this.installationService.findByOrgId(user.org_id);
  }

  /**
   * Get installation details
   */
  @Get('installations/:id')
  @UseGuards(JwtAuthGuard)
  getInstallation(@Param('id') id: string) {
    return this.installationService.findOne(id);
  }

  /**
   * List repositories for current organization
   */
  @Get('repositories')
  @UseGuards(JwtAuthGuard)
  getRepositories(@CurrentUser() user: any) {
    return this.installationService.getRepositories(user.org_id);
  }

  /**
   * Refresh repositories from GitHub
   */
  @Post('repositories/sync')
  @UseGuards(JwtAuthGuard)
  async syncRepositories(@CurrentUser() user: any) {
    const installations = await this.installationService.findByOrgId(user.org_id);

    const results: any[] = [];
    for (const installation of installations.data) {
      const result = await this.installationService.syncRepositories(installation);
      results.push(result);
    }

    return { success: true, data: results };
  }

  /**
   * Get recent webhook events
   */
  @Get('events')
  @UseGuards(JwtAuthGuard)
  getEvents(@CurrentUser() user: any) {
    return this.installationService.getRecentEvents(user.org_id);
  }

  // --- Pull Request Workflow ---

  @Post('pull-requests')
  @UseGuards(JwtAuthGuard)
  createPullRequest(@CurrentUser() user: any, @Body() body: any) {
    return this.prService.createPullRequest(user.org_id, body, user);
  }

  @Get('pull-requests')
  @UseGuards(JwtAuthGuard)
  listPullRequests(
    @CurrentUser() user: any,
    @Query('repo') repositoryFullName: string,
    @Query('state') state?: string,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    return this.prService.listPullRequests(
      user.org_id,
      repositoryFullName,
      state || 'open',
      Number(page) || 1,
      Number(perPage) || 30,
    );
  }

  @Get('pull-requests/:repo/:number')
  @UseGuards(JwtAuthGuard)
  getPullRequest(
    @CurrentUser() user: any,
    @Param('repo') repo: string,
    @Param('number') number: string,
  ) {
    // Decode the repo param (it may contain slashes like "owner/repo")
    const repositoryFullName = decodeURIComponent(repo);
    return this.prService.getPullRequest(user.org_id, repositoryFullName, Number(number));
  }

  @Post('pull-requests/:repo/:number/merge')
  @UseGuards(JwtAuthGuard)
  mergePullRequest(
    @CurrentUser() user: any,
    @Param('repo') repo: string,
    @Param('number') number: string,
    @Body() body: { merge_method?: 'merge' | 'squash' | 'rebase' },
  ) {
    const repositoryFullName = decodeURIComponent(repo);
    return this.prService.mergePullRequest(
      user.org_id,
      repositoryFullName,
      Number(number),
      body.merge_method || 'squash',
    );
  }
}
