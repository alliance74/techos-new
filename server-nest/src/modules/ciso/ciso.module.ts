import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { Project } from '../../entities/project.entity';
import { Report } from '../../entities/report.entity';
import { CisoController } from './ciso.controller';
import { CisoService } from './ciso.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, Report])],
  controllers: [CisoController],
  providers: [CisoService],
  exports: [CisoService],
})
export class CisoModule {}
