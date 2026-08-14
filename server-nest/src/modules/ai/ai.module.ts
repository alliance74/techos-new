import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversationService } from './ai-conversation.service';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Bug } from '../../entities/bug.entity';
import { User } from '../../entities/user.entity';
import { Invoice } from '../../entities/invoice.entity';
import { Expense } from '../../entities/expense.entity';
import { Goal } from '../../entities/goal.entity';
import { KPI } from '../../entities/kpi.entity';
import { Meeting } from '../../entities/meeting.entity';
import { Sprint } from '../../entities/sprint.entity';
import { AiConversation } from '../../entities/ai-conversation.entity';
import { AiMessage } from '../../entities/ai-message.entity';
import { AiUsage } from '../../entities/ai-usage.entity';
import { CalendarEvent } from '../../entities/calendar-event.entity';
import { Contact } from '../../entities/contact.entity';
import { Deal } from '../../entities/deal.entity';
import { Document } from '../../entities/document.entity';
import { Announcement } from '../../entities/announcement.entity';
import { Feature } from '../../entities/feature.entity';
import { Epic } from '../../entities/epic.entity';
import { Release } from '../../entities/release.entity';
import { CustomerFeedback } from '../../entities/customer-feedback.entity';
import { Employee } from '../../entities/employee.entity';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { CodeReview } from '../../entities/code-review.entity';
import { Channel } from '../../entities/channel.entity';
import { Message } from '../../entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Task,
      Bug,
      User,
      Invoice,
      Expense,
      Goal,
      KPI,
      Meeting,
      Sprint,
      AiConversation,
      AiMessage,
      AiUsage,
      CalendarEvent,
      Contact,
      Deal,
      Document,
      Announcement,
      Feature,
      Epic,
      Release,
      CustomerFeedback,
      Employee,
      LeaveRequest,
      CodeReview,
      Channel,
      Message,
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, AiConversationService],
  exports: [AiService, AiConversationService],
})
export class AiModule {}
