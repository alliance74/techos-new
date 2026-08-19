import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CisoService } from './ciso.service';
import { GetCisoAuditProjectsQueryDto } from './dto/get-ciso-audit-projects-query.dto';
import { CreateProjectAuditDto } from './dto/create-project-audit.dto';
import { UpdateProjectAuditDto } from './dto/update-project-audit.dto';
import { GetAuditTasksQueryDto } from './dto/get-audit-tasks-query.dto';
import { CreateAuditTaskDto } from './dto/create-audit-task.dto';
import { UpdateAuditTaskDto } from './dto/update-audit-task.dto';
import { UpdateCisoTaskStatusDto } from './dto/update-ciso-task-status.dto';
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

  @Post('audits')
  createAudit(@CurrentUser() user: any, @Body() body: CreateProjectAuditDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.createAudit(user.org_id, user.id, body);
  }

  @Get('audits')
  getAudits(@CurrentUser() user: any, @Query() query: GetCisoAuditProjectsQueryDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.getAudits(user.org_id, query.status);
  }

  @Get('audits/:id')
  getAudit(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureCisoAccess(user);
    return this.cisoService.getAudit(user.org_id, id);
  }

  @Put('audits/:id')
  updateAudit(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateProjectAuditDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.updateAudit(user.org_id, id, body);
  }

  @Delete('audits/:id')
  deleteAudit(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureCisoAccess(user);
    return this.cisoService.deleteAudit(user.org_id, id);
  }

  @Post('audit-tasks')
  createAuditTask(@CurrentUser() user: any, @Body() body: CreateAuditTaskDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.createAuditTask(user.org_id, user.id, body);
  }

  @Get('audit-tasks')
  getAuditTasks(@CurrentUser() user: any, @Query() query: GetAuditTasksQueryDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.getAuditTasks(user.org_id, query);
  }

  @Get('audit-tasks/:id')
  getAuditTask(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureCisoAccess(user);
    return this.cisoService.getAuditTask(user.org_id, id);
  }

  @Put('audit-tasks/:id')
  updateAuditTask(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateAuditTaskDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.updateAuditTask(user.org_id, id, body);
  }

  @Patch('audit-tasks/:id/status')
  updateAuditTaskStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: UpdateCisoTaskStatusDto,
  ) {
    this.ensureCisoAccess(user);
    return this.cisoService.updateAuditTaskStatus(user.org_id, id, Boolean(body.finished));
  }

  @Delete('audit-tasks/:id')
  deleteAuditTask(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureCisoAccess(user);
    return this.cisoService.deleteAuditTask(user.org_id, id);
  }

  @Get('reports')
  getReports(@CurrentUser() user: any) {
    this.ensureCisoAccess(user);
    return this.cisoService.getReports(user.org_id);
  }

  @Post('reports')
  createReport(@CurrentUser() user: any, @Body() body: CreateCisoReportDto) {
    this.ensureCisoAccess(user);
    return this.cisoService.createReport(user.org_id, user.id, body);
  }
}
