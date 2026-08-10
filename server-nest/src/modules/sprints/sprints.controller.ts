import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SprintsService } from './sprints.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sprints')
@UseGuards(JwtAuthGuard)
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createSprintDto: any) {
    return this.sprintsService.create(user.org_id, createSprintDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('project_id') project_id?: string) {
    return this.sprintsService.findAll(user.org_id, project_id, user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.sprintsService.findOne(id, user.org_id, user);
  }

  @Get(':id/stats')
  getStats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.sprintsService.getStats(id, user.org_id, user);
  }

  @Get('active/:projectId')
  getActive(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.sprintsService.findActiveSprint(projectId, user.org_id, user);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateSprintDto: any) {
    return this.sprintsService.update(id, user.org_id, updateSprintDto, user);
  }

  @Post(':id/start')
  start(@CurrentUser() user: any, @Param('id') id: string) {
    return this.sprintsService.startSprint(id, user.org_id, user);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.sprintsService.completeSprint(id, user.org_id, user);
  }

  @Post(':sprintId/tasks/:taskId')
  addTask(
    @CurrentUser() user: any,
    @Param('sprintId') sprintId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.sprintsService.addTaskToSprint(sprintId, taskId, user.org_id, user);
  }

  @Delete(':sprintId/tasks/:taskId')
  removeTask(
    @CurrentUser() user: any,
    @Param('sprintId') sprintId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.sprintsService.removeTaskFromSprint(sprintId, taskId, user.org_id, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.sprintsService.remove(id, user.org_id, user);
  }
}
