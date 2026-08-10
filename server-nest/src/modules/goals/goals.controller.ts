import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createDto: CreateGoalDto) {
    return this.goalsService.create(user.org_id, createDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.goalsService.findAll(user.org_id, filters);
  }

  @Get('alignment')
  getAlignment(@CurrentUser() user: any) {
    return this.goalsService.getAlignment(user.org_id);
  }

  @Get('progress-report')
  getProgressReport(@CurrentUser() user: any, @Query('quarter') quarter?: string) {
    return this.goalsService.getProgressReport(user.org_id, quarter);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.findOne(id, user.org_id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: UpdateGoalDto) {
    return this.goalsService.update(id, user.org_id, updateDto, user);
  }

  @Patch(':id/key-results/:index')
  updateKeyResult(
    @CurrentUser() user: any, 
    @Param('id') id: string, 
    @Param('index') index: string,
    @Body('current') current: number
  ) {
    return this.goalsService.updateKeyResult(id, user.org_id, parseInt(index), current);
  }

  @Get(':id/key-results')
  getKeyResults(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.getKeyResults(id, user.org_id);
  }

  @Post('key-results')
  createKeyResult(@CurrentUser() user: any, @Body() body: any) {
    return this.goalsService.createKeyResult(user.org_id, body);
  }

  @Put('key-results/:id')
  updateKeyResultById(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.goalsService.updateKeyResultById(user.org_id, id, body);
  }

  @Delete('key-results/:id')
  deleteKeyResultById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.deleteKeyResultById(user.org_id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.remove(id, user.org_id, user);
  }
}
