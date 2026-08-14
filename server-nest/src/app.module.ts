import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { entities } from './entities';
import { CommonModule } from './common/common.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { CrmModule } from './modules/crm/crm.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GoalsModule } from './modules/goals/goals.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ProductModule } from './modules/product/product.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AiModule } from './modules/ai/ai.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CisoModule } from './modules/ciso/ciso.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { CodeReviewsModule } from './modules/code-reviews/code-reviews.module';

function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const dbType = (config.get<string>('DATABASE_TYPE') || 'sqlite').toLowerCase();
  const isDev = config.get<string>('NODE_ENV') !== 'production';
  const synchronize =
    (config.get<string>('DATABASE_SYNC') || (isDev ? 'true' : 'false')) === 'true';

  // Check for DATABASE_URL (connection string format - e.g., from Neon, Railway, etc.)
  const databaseUrl = config.get<string>('DATABASE_URL');
  
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities,
      synchronize,
      logging: isDev,
      retryAttempts: 10,
      retryDelay: 3000,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    };
  }

  if (dbType === 'postgres' || dbType === 'postgresql') {
    return {
      type: 'postgres',
      host: config.get<string>('DATABASE_HOST', 'localhost'),
      port: Number(config.get<string>('DATABASE_PORT') || 5432),
      username: config.get<string>('DATABASE_USER', 'techos'),
      password: config.get<string>('DATABASE_PASSWORD', 'techos'),
      database: config.get<string>('DATABASE_NAME', 'techos'),
      entities,
      synchronize,
      logging: isDev,
      retryAttempts: 10,
      retryDelay: 3000,
    };
  }

  return {
    type: 'sqlite',
    database: config.get<string>('DATABASE_PATH', './techos.db'),
    entities,
    synchronize,
    logging: isDev,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmOptions(config),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    CommonModule,

    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    SprintsModule,
    MeetingsModule,
    ChannelsModule,
    MessagesModule,
    CrmModule,
    FinanceModule,
    HrModule,
    DocumentsModule,
    CalendarModule,
    NotificationsModule,
    GoalsModule,
    AnnouncementsModule,
    ProductModule,
    AnalyticsModule,
    DashboardModule,
    IntegrationsModule,
    AiModule,
    ReportsModule,
    CisoModule,
    WorkspaceModule,
    CodeReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
