import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceRecord } from '../../entities/workspace-record.entity';
import { ActivityEvent } from '../../entities/activity-event.entity';
import { RecordComment } from '../../entities/record-comment.entity';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceRecord, ActivityEvent, RecordComment])],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
