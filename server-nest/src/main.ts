import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // API prefix
  app.setGlobalPrefix('api');
  
  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('TechOS API')
    .setDescription('The Operating System for Software Companies - Complete API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Projects', 'Project management')
    .addTag('Tasks', 'Task management with subtasks')
    .addTag('Sprints', 'Sprint planning and management')
    .addTag('Users', 'User management')
    .addTag('Organizations', 'Organization settings')
    .addTag('Meetings', 'Meeting management with participants')
    .addTag('Channels', 'Communication channels')
    .addTag('Messages', 'Real-time messaging')
    .addTag('Notifications', 'Real-time notifications')
    .addTag('CRM', 'Customer relationship management')
    .addTag('Finance', 'Financial management')
    .addTag('HR', 'Human resources')
    .addTag('Documents', 'Document management')
    .addTag('Calendar', 'Calendar and events')
    .addTag('Goals', 'Goals and OKRs')
    .addTag('Announcements', 'Company announcements')
    .addTag('Product', 'Product management')
    .addTag('Analytics', 'Analytics and insights')
    .addTag('Dashboards', 'Role-based dashboards')
    .addTag('Reports', 'Custom reports')
    .addTag('Integrations', 'External integrations')
    .addTag('AI Assistant', 'AI-powered assistant')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'TechOS API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 TechOS Backend Server Started Successfully!         ║
║                                                           ║
║   📍 Server:        http://localhost:${port}                   ║
║   📚 API Docs:      http://localhost:${port}/api/docs          ║
║   🔧 Environment:   ${process.env.NODE_ENV || 'development'}                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}
bootstrap();
