import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from './services/cloudinary.service';
import { RedisService } from './services/redis.service';
import { EmailService } from './services/email.service';
import { ActivityLogService } from './services/activity-log.service';
import { EventsGateway } from './gateways/events.gateway';
import { ActivityEvent } from '../entities/activity-event.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ActivityEvent, AuditLog])],
  providers: [CloudinaryService, RedisService, EmailService, EventsGateway, ActivityLogService],
  exports: [CloudinaryService, RedisService, EmailService, EventsGateway, ActivityLogService],
})
export class CommonModule {}
