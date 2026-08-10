import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Get('available')
  getAvailableIntegrations() {
    return this.integrationsService.getAvailableIntegrations();
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createDto: any) {
    return this.integrationsService.create(user.org_id, createDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.integrationsService.findAll(user.org_id, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.integrationsService.findOne(id, user.org_id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.integrationsService.update(id, user.org_id, updateDto);
  }

  @Patch(':id/toggle')
  toggleEnabled(@CurrentUser() user: any, @Param('id') id: string) {
    return this.integrationsService.toggleEnabled(id, user.org_id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.integrationsService.remove(id, user.org_id);
  }

  @Post(':id/connect')
  async connect(@CurrentUser() user: any, @Param('id') id: string) {
    await this.integrationsService.update(id, user.org_id, { enabled: true });
    return this.integrationsService.findOne(id, user.org_id);
  }

  @Post(':id/disconnect')
  async disconnect(@CurrentUser() user: any, @Param('id') id: string) {
    await this.integrationsService.update(id, user.org_id, { enabled: false });
    return this.integrationsService.findOne(id, user.org_id);
  }

  // OAuth endpoints
  @Post('oauth/:type/tokens')
  saveOAuthTokens(
    @CurrentUser() user: any,
    @Param('type') type: string,
    @Body() tokens: any,
  ) {
    return this.integrationsService.saveOAuthTokens(user.org_id, type, tokens);
  }

  // Webhook endpoints (public - no auth required)
  @Post('webhooks/github')
  @Public()
  handleGitHubWebhook(@Body() payload: any, @Query('org_id') org_id: string) {
    return this.integrationsService.handleGitHubWebhook(org_id, payload);
  }

  @Post('webhooks/gitlab')
  @Public()
  handleGitLabWebhook(@Body() payload: any, @Query('org_id') org_id: string) {
    return this.integrationsService.handleGitLabWebhook(org_id, payload);
  }

  @Post('webhooks/stripe')
  @Public()
  handleStripeWebhook(@Body() payload: any) {
    return this.integrationsService.handleStripeWebhook(payload);
  }

  @Post('webhooks/slack')
  @Public()
  handleSlackWebhook(@Body() payload: any, @Query('org_id') org_id: string) {
    return this.integrationsService.handleSlackWebhook(org_id, payload);
  }

  // Integration actions
  @Post('github/sync-issues')
  syncGitHubIssues(@CurrentUser() user: any, @Body('repo') repo: string) {
    return this.integrationsService.syncGitHubIssues(user.org_id, repo);
  }

  @Post('google-calendar/sync')
  syncGoogleCalendar(@CurrentUser() user: any) {
    return this.integrationsService.syncGoogleCalendar(user.org_id);
  }

  @Post('slack/notify')
  sendSlackNotification(
    @CurrentUser() user: any,
    @Body('channel') channel: string,
    @Body('message') message: string,
  ) {
    return this.integrationsService.sendSlackNotification(user.org_id, channel, message);
  }
}
