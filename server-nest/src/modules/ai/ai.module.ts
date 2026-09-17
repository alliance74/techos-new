import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversationService } from './ai-conversation.service';
import { ContextualRetrievalService } from './contextual-retrieval.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { User } from '../../entities/user.entity';
import { AiConversation } from '../../entities/ai-conversation.entity';
import { AiMessage } from '../../entities/ai-message.entity';
import { AiUsage } from '../../entities/ai-usage.entity';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Bug } from '../../entities/bug.entity';
import { CodeReview } from '../../entities/code-review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core AI entities
      User,
      AiConversation,
      AiMessage,
      AiUsage,
      // Entities needed by ContextualRetrievalService
      Project,
      Task,
      Sprint,
      Bug,
      CodeReview,
    ]),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiConversationService,
    ContextualRetrievalService,
    RecommendationEngineService,
  ],
  exports: [
    AiService,
    AiConversationService,
    ContextualRetrievalService,
    RecommendationEngineService,
  ],
})
export class AiModule {}
