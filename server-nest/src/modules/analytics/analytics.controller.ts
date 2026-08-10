import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: any) {
    return this.analyticsService.getOverview(user.org_id);
  }

  @Get('projects')
  getProjectAnalytics(
    @CurrentUser() user: any, 
    @Query('project_id') project_id?: string
  ) {
    return this.analyticsService.getProjectAnalytics(user.org_id, project_id);
  }

  @Get('team-productivity')
  getTeamProductivity(
    @CurrentUser() user: any,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.analyticsService.getTeamProductivity(user.org_id, start_date, end_date);
  }

  @Get('sprints')
  getSprintAnalytics(
    @CurrentUser() user: any,
    @Query('sprint_id') sprint_id?: string,
  ) {
    return this.analyticsService.getSprintAnalytics(user.org_id, sprint_id);
  }

  @Get('bugs')
  getBugAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getBugAnalytics(user.org_id);
  }

  @Get('time-tracking')
  getTimeTracking(
    @CurrentUser() user: any,
    @Query('user_id') user_id?: string,
    @Query('project_id') project_id?: string,
  ) {
    return this.analyticsService.getTimeTracking(user.org_id, user_id, project_id);
  }

  // KPI endpoints
  @Post('kpis')
  createKPI(@CurrentUser() user: any, @Body() createDto: any) {
    return this.analyticsService.createKPI(user.org_id, user.id, createDto);
  }

  @Get('kpis')
  getAllKPIs(@CurrentUser() user: any, @Query() filters: any) {
    return this.analyticsService.getAllKPIs(user.org_id, filters);
  }

  @Put('kpis/:id')
  updateKPI(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    return this.analyticsService.updateKPI(id, user.org_id, updateDto);
  }
}
