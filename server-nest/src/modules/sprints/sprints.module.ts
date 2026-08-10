import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { Sprint } from '../../entities/sprint.entity';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Project, Task])],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
