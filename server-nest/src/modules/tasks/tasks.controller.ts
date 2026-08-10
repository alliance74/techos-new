import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createTaskDto: any) {
    return this.tasksService.create(user.org_id, user, createTaskDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.tasksService.findAll(user.org_id, filters, user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.findOne(id, user.org_id, user);
  }

  @Get(':id/subtasks')
  getSubtasks(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.getSubtasks(id, user.org_id, user);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateTaskDto: any) {
    return this.tasksService.update(id, user.org_id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.remove(id, user.org_id, user);
  }
}
