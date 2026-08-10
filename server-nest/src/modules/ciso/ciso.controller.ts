import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CisoService } from './ciso.service';
import { GetCisoTasksQueryDto } from './dto/get-ciso-tasks-query.dto';
import { UpdateCisoTaskStatusDto } from './dto/update-ciso-task-status.dto';
import { GetCisoAuditProjectsQueryDto } from './dto/get-ciso-audit-projects-query.dto';
import { UpdateCisoAuditStatusDto } from './dto/update-ciso-audit-status.dto';
import { CreateCisoReportDto } from './dto/create-ciso-report.dto';

@Controller('ciso')
@UseGuards(JwtAuthGuard)
export class CisoController {
  constructor(private cisoService: CisoService) {}

  private ensureCisoAccess(user: any) {
    if (!['ciso', 'ceo'].includes(user.role)) {
      throw new ForbiddenException('CISO access required');
    }
  }

  @Get('tasks')
  getTasks(@CurrentUser() user: any, @Query() query: GetCisoTasksQueryDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.getTasks(user.org_id, query.status);
  }

  @Patch('tasks/:id/status')
  updateTaskStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateCisoTaskStatusDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.updateTaskStatus(user.org_id, id, Boolean(body.finished));
  }

  @Get('projects/audits')
  getAuditProjects(
    @CurrentUser() user: any,
    @Query() query: GetCisoAuditProjectsQueryDto,
  ) {
    this.ensureCisoAccess(user);
    return this.cisoService.getAuditProjects(user.org_id, query.status);
  }

  @Patch('projects/:id/audit-status')
  updateAuditStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: UpdateCisoAuditStatusDto,
  ) {
    this.ensureCisoAccess(user);
    return this.cisoService.updateAuditStatus(user.org_id, id, body.audit_status);
  }

  @Get('reports')
  getReports(@CurrentUser() user: any) {
    this.ensureCisoAccess(user);
    return this.cisoService.getReports(user.org_id);
  }

  @Post('reports')
  createReport(
    @CurrentUser() user: any,
    @Body() body: CreateCisoReportDto,
  ) {
    this.ensureCisoAccess(user);
    return this.cisoService.createReport(user.org_id, user.id, body);
  }
}
