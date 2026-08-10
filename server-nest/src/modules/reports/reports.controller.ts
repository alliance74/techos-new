import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // Saved reports CRUD
  @Post()
  create(@CurrentUser() user: any, @Body() createDto: any) {
    return this.reportsService.createReport(user.org_id, user.id, createDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.reportsService.findAll(user.org_id, filters);
  }

  @Get('saved/:id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.reportsService.findOne(id, user.org_id);
  }

  @Put('saved/:id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.reportsService.updateReport(id, user.org_id, updateDto);
  }

  @Delete('saved/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.reportsService.removeReport(id, user.org_id);
  }

  // Generate reports
  @Get('generate/project')
  generateProjectReport(
    @CurrentUser() user: any,
    @Query('project_id') project_id?: string,
  ) {
    return this.reportsService.generateProjectReport(user.org_id, project_id);
  }

  @Get('generate/financial')
  generateFinancialReport(
    @CurrentUser() user: any,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.reportsService.generateFinancialReport(user.org_id, start_date, end_date);
  }

  @Get('generate/kpi')
  generateKPIReport(@CurrentUser() user: any) {
    return this.reportsService.generateKPIReport(user.org_id);
  }

  @Get('generate/tasks')
  generateTaskReport(
    @CurrentUser() user: any,
    @Query('user_id') user_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.reportsService.generateTaskReport(user.org_id, user_id, start_date, end_date);
  }

  @Get('generate/bugs')
  generateBugReport(
    @CurrentUser() user: any,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.reportsService.generateBugReport(user.org_id, start_date, end_date);
  }

  @Get('generate/:type')
  generateByType(
    @CurrentUser() user: any,
    @Param('type') type: string,
    @Query() params: any,
  ) {
    if (type === 'project') {
      return this.reportsService.generateProjectReport(user.org_id, params.project_id);
    }
    if (type === 'financial') {
      return this.reportsService.generateFinancialReport(user.org_id, params.start_date, params.end_date);
    }
    if (type === 'kpi') {
      return this.reportsService.generateKPIReport(user.org_id);
    }
    if (type === 'tasks') {
      return this.reportsService.generateTaskReport(
        user.org_id,
        params.user_id,
        params.start_date,
        params.end_date,
      );
    }
    return this.reportsService.generateBugReport(user.org_id, params.start_date, params.end_date);
  }
}
