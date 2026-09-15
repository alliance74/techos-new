import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { User, UserRole } from '../src/entities/user.entity';
import { Organization } from '../src/entities/organization.entity';
import { Project } from '../src/entities/project.entity';
import { Sprint } from '../src/entities/sprint.entity';
import { Task } from '../src/entities/task.entity';
import { Notification } from '../src/entities/notification.entity';
import { Integration } from '../src/entities/integration.entity';
import { ActivityEvent } from '../src/entities/activity-event.entity';
import { AuditLog } from '../src/entities/audit-log.entity';
import { Employee } from '../src/entities/employee.entity';
import { ChannelMember } from '../src/entities/channel-member.entity';
import { MeetingParticipant } from '../src/entities/meeting-participant.entity';
import { Channel } from '../src/entities/channel.entity';
import { Message } from '../src/entities/message.entity';
import { WorkspaceRecord } from '../src/entities/workspace-record.entity';
import { RecordComment } from '../src/entities/record-comment.entity';
import { AiConversation } from '../src/entities/ai-conversation.entity';
import { AiMessage } from '../src/entities/ai-message.entity';
import { AiUsage } from '../src/entities/ai-usage.entity';
import { CodeReview } from '../src/entities/code-review.entity';
import { ProjectAudit } from '../src/entities/project-audit.entity';
import { AuditTask } from '../src/entities/audit-task.entity';
import { Report } from '../src/entities/report.entity';

// Modules
import { AuthModule } from '../src/modules/auth/auth.module';
import { ProjectsModule } from '../src/modules/projects/projects.module';
import { TasksModule } from '../src/modules/tasks/tasks.module';
import { SprintsModule } from '../src/modules/sprints/sprints.module';
import { UsersModule } from '../src/modules/users/users.module';
import { OrganizationsModule } from '../src/modules/organizations/organizations.module';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { CommonModule } from '../src/common/common.module';
import { IntegrationsModule } from '../src/modules/integrations/integrations.module';
import { AiModule } from '../src/modules/ai/ai.module';
import { WorkspaceModule } from '../src/modules/workspace/workspace.module';
import { CodeReviewsModule } from '../src/modules/code-reviews/code-reviews.module';
import { CisoModule } from '../src/modules/ciso/ciso.module';

const ALL_ENTITIES = [
  User, Organization, Project, Sprint, Task, Notification,
  Integration, ActivityEvent, AuditLog, Employee, ChannelMember,
  MeetingParticipant, Channel, Message, WorkspaceRecord, RecordComment,
  AiConversation, AiMessage, AiUsage, CodeReview,
  ProjectAudit, AuditTask, Report,
];

describe('TechOS API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let orgId: string;
  let projectId: string;
  let taskId: string;
  let sprintId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true,
          dropSchema: true,
        }),
        CommonModule,
        AuthModule,
        UsersModule,
        OrganizationsModule,
        ProjectsModule,
        TasksModule,
        SprintsModule,
        NotificationsModule,
        IntegrationsModule,
        AiModule,
        WorkspaceModule,
        CodeReviewsModule,
        CisoModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    app.setGlobalPrefix('api');
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  // ═══════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════
  describe('Auth', () => {
    const testEmail = `e2e-${Date.now()}@test.com`;

    it('POST /api/auth/register — creates a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'TestPass123!',
          firstName: 'E2E',
          lastName: 'User',
          role: UserRole.SOFTWARE_ENGINEER,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.role).toBe(UserRole.SOFTWARE_ENGINEER);

      authToken = res.body.data.token;
      userId = res.body.data.user.id;
      orgId = res.body.data.user.org_id;
    });

    it('POST /api/auth/register — rejects duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'TestPass123!',
          firstName: 'Dup',
          lastName: 'User',
          role: UserRole.SOFTWARE_ENGINEER,
        })
        .expect(409);
    });

    it('POST /api/auth/login — authenticates user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'TestPass123!' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /api/auth/login — rejects wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword!' })
        .expect(401);
    });

    it('GET /api/auth/profile — returns profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
    });

    it('GET /api/auth/profile — rejects unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════════
  describe('Projects', () => {
    it('POST /api/projects — creates a project', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Project',
          description: 'Integration test project',
          priority: 'high',
          start_date: '2026-01-01',
          end_date: '2026-06-30',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('E2E Test Project');
      expect(res.body.data.org_id).toBe(orgId);
      projectId = res.body.data.id;
    });

    it('GET /api/projects — lists projects for the org', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((p: any) => p.id === projectId)).toBe(true);
    });

    it('GET /api/projects/:id — returns a specific project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.name).toBe('E2E Test Project');
    });

    it('PUT /api/projects/:id — updates a project', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'E2E Updated Project', priority: 'critical' })
        .expect(200);

      expect(res.body.data.name).toBe('E2E Updated Project');
      expect(res.body.data.priority).toBe('critical');
    });

    it('GET /api/projects/:id/statistics — returns project stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total_tasks).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TASKS
  // ═══════════════════════════════════════════════════════════════
  describe('Tasks', () => {
    it('POST /api/tasks — creates a task', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Test Task',
          description: 'Test task description',
          project_id: projectId,
          priority: 'high',
          status: 'todo',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('E2E Test Task');
      expect(res.body.data.project_id).toBe(projectId);
      taskId = res.body.data.id;
    });

    it('GET /api/tasks — lists tasks for the org', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.some((t: any) => t.id === taskId)).toBe(true);
    });

    it('GET /api/tasks — filters by project_id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/tasks?project_id=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.every((t: any) => t.project_id === projectId)).toBe(true);
    });

    it('GET /api/tasks/:id — returns a specific task', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.title).toBe('E2E Test Task');
    });

    it('PUT /api/tasks/:id — updates a task', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress', priority: 'critical' })
        .expect(200);

      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.priority).toBe('critical');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SPRINTS
  // ═══════════════════════════════════════════════════════════════
  describe('Sprints', () => {
    it('POST /api/sprints — creates a sprint', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sprints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          name: 'E2E Sprint 1',
          goal: 'Complete E2E tests',
          start_date: '2026-01-01',
          end_date: '2026-01-14',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('E2E Sprint 1');
      expect(res.body.data.status).toBe('planned');
      sprintId = res.body.data.id;
    });

    it('GET /api/sprints — lists sprints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sprints')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.some((s: any) => s.id === sprintId)).toBe(true);
    });

    it('POST /api/sprints/:id/start — starts a sprint', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/sprints/${sprintId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(res.body.data.status).toBe('active');
    });

    it('POST /api/sprints/:id/tasks/:taskId — adds task to sprint', async () => {
      await request(app.getHttpServer())
        .post(`/api/sprints/${sprintId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });

    it('POST /api/sprints/:id/complete — completes sprint', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/sprints/${sprintId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(res.body.data.status).toBe('completed');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RBAC ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════
  describe('RBAC Enforcement', () => {
    let engineerToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `eng-e2e-${Date.now()}@test.com`,
          password: 'TestPass123!',
          firstName: 'Eng',
          lastName: 'User',
          role: UserRole.SOFTWARE_ENGINEER,
        });
      engineerToken = res.body.data.token;
    });

    it('Engineer can view projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', `Bearer ${engineerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('Engineer can view tasks', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${engineerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════
  describe('Cleanup', () => {
    it('DELETE /api/projects/:id — deletes the project', async () => {
      await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
