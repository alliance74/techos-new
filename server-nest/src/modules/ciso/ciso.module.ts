import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '../../entities/report.entity';
import { ProjectAudit } from '../../entities/project-audit.entity';
import { AuditTask } from '../../entities/audit-task.entity';
import { CisoController } from './ciso.controller';
import { CisoService } from './ciso.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectAudit, AuditTask, Report])],
  controllers: [CisoController],
  providers: [CisoService],
  exports: [CisoService],
})
export class CisoModule {}
