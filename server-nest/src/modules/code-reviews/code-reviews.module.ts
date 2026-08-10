import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeReview } from '../../entities/code-review.entity';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';
import { Integration } from '../../entities/integration.entity';
import { CodeReviewsController } from './code-reviews.controller';
import { CodeReviewsService } from './code-reviews.service';
import { PrImportService } from './pr-import.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CodeReview, User, Project, Integration]),
    NotificationsModule,
    CommonModule,
  ],
  controllers: [CodeReviewsController],
  providers: [CodeReviewsService, PrImportService],
  exports: [CodeReviewsService],
})
export class CodeReviewsModule {}
