import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { User } from '../../entities/user.entity';
import { Bug } from '../../entities/bug.entity';
import { KPI } from '../../entities/kpi.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, Sprint, User, Bug, KPI])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
