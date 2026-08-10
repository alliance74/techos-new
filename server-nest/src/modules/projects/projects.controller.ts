import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(user.org_id, user, createProjectDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.projectsService.findAll(user.org_id, user, status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.findOne(id, user.org_id, user);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.org_id, updateProjectDto, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.remove(id, user.org_id, user);
  }

  @Get(':id/stats')
  getStats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.getProjectStats(id, user.org_id, user);
  }

  @Get(':id/statistics')
  getStatistics(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.getProjectStats(id, user.org_id, user);
  }
}
