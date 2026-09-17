import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { SprintAnalyticsService } from './sprint-analytics.service';
import { Sprint } from '../../entities/sprint.entity';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Project, Task])],
  controllers: [SprintsController],
  providers: [SprintsService, SprintAnalyticsService],
  exports: [SprintsService, SprintAnalyticsService],
})
export class SprintsModule {}
