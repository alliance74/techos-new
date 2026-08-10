import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
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
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
