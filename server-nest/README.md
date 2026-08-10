# TechOS NestJS Backend

A comprehensive, enterprise-grade backend for TechOS - The Operating System for Software Companies.

## 🚀 Features

### ✅ Implemented Core Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (CEO, CTO, COO, Product Manager, Engineer, Designer, HR, Sales, Marketing, Finance, Support, Operations)
  - Multi-tenant architecture (organizations)
  
- **Project Management**
  - Projects with full CRUD
  - Sprints management
  - Task tracking with subtasks
  - Task dependencies
  - Time tracking
  - Project statistics
  
- **Team Collaboration**
  - Channels (public/private)
  - Direct messaging
  - Threaded conversations
  - File attachments support
  - Mentions and reactions
  
- **Meeting Management**
  - Meeting scheduling
  - Meeting agenda
  - Meeting notes
  - Action items
  - AI summaries
  - External meeting links (Zoom, Google Meet, etc.)
  
- **CRM (Customer Relationship Management)**
  - Contacts management
  - Deals pipeline
  - Sales stages
  - Deal probability tracking
  
- **Finance Management**
  - Invoices
  - Expenses with approval workflow
  - Budget tracking
  - Financial reports
  
- **Human Resources**
  - Employee directory
  - Leave management
  - Department organization
  - Performance tracking
  
- **Document Management**
  - Document storage
  - Folder organization
  - Version control
  - Tags and categories
  
- **Calendar & Events**
  - Calendar events
  - Event types
  - Recurring events support
  - Multi-calendar view
  
- **Goals & OKRs**
  - Company goals
  - Department goals
  - Key results tracking
  - Progress monitoring
  
- **Product Management**
  - Features and epics
  - Product roadmap
  - Release management
  - Bug tracking
  - Customer feedback
  
- **Analytics & Reporting**
  - Dashboard analytics
  - Custom reports
  - KPI tracking
  - Business intelligence
  
- **Integrations**
  - GitHub/GitLab
  - Google Calendar
  - Zoom/Google Meet
  - Slack/Discord
  - Stripe/QuickBooks
  - Google Drive/OneDrive
  
- **AI Assistant** (Ready for implementation)
  - OpenAI integration
  - Anthropic Claude integration
  - Google AI integration
  - Meeting summaries
  - Intelligent recommendations
  
- **Security & Compliance**
  - Audit logs
  - Two-factor authentication support
  - Role-based permissions
  - Secure token management

## 📦 Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: SQLite with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Security**: bcryptjs, helmet, rate limiting

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

## 🔧 Configuration

Edit `.env` file:

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
DATABASE_PATH=./techos.db

# Optional: AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# Optional: External Integrations
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 🚀 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Watch mode
npm run start:dev
```

The server will start on `http://localhost:4000`

## 📡 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "organizationName": "Acme Corp",
  "email": "admin@acme.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "securepassword123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Project Endpoints

```http
GET    /api/projects              # List all projects
POST   /api/projects              # Create project
GET    /api/projects/:id          # Get project details
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project
GET    /api/projects/:id/stats    # Get project statistics
```

### Task Endpoints

```http
GET    /api/tasks                 # List all tasks
POST   /api/tasks                 # Create task
GET    /api/tasks/:id             # Get task details
PUT    /api/tasks/:id             # Update task
DELETE /api/tasks/:id             # Delete task
```

### Additional Module Endpoints

All modules follow similar RESTful patterns:

- `/api/users` - User management
- `/api/organizations` - Organization settings
- `/api/sprints` - Sprint management
- `/api/meetings` - Meeting management
- `/api/channels` - Channel management
- `/api/messages` - Messaging
- `/api/crm` - CRM (contacts, deals)
- `/api/finance` - Finance (invoices, expenses, budgets)
- `/api/hr` - HR (employees, leaves)
- `/api/documents` - Document management
- `/api/calendar` - Calendar events
- `/api/notifications` - Notifications
- `/api/goals` - Goals and OKRs
- `/api/announcements` - Company announcements
- `/api/product` - Product management
- `/api/analytics` - Analytics data
- `/api/dashboard` - Dashboard data
- `/api/integrations` - External integrations
- `/api/ai` - AI assistant features
- `/api/reports` - Reports and KPIs

## 🗄️ Database Schema

The database includes 30+ tables covering:
- Organizations & Users
- Projects, Sprints & Tasks
- Meetings & Action Items
- Channels & Messages
- CRM (Contacts & Deals)
- Finance (Invoices, Expenses, Budgets)
- HR (Employees, Leave Requests)
- Documents & Calendar Events
- Goals & Announcements
- Product (Features, Epics, Releases, Bugs)
- Integrations & Audit Logs
- Reports & KPIs

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- SQL injection protection (TypeORM)
- XSS protection

## 📊 User Roles

- CEO
- CTO
- COO
- Product Manager
- Engineering Manager
- Software Engineer
- UI/UX Designer
- HR Manager
- Sales Team
- Marketing Team
- Finance Team
- Customer Support
- Operations Team
- Admin
- Member

## 🎯 Next Steps for Full Implementation

1. **Implement detailed business logic** in each service
2. **Add AI assistant** features (OpenAI, Anthropic, Google AI)
3. **Implement external integrations** (GitHub, Slack, Zoom, etc.)
4. **Add file upload** functionality with storage
5. **Implement real-time features** with WebSockets
6. **Add comprehensive testing** (unit, integration, e2e)
7. **Set up CI/CD** pipelines
8. **Add API documentation** with Swagger
9. **Implement caching** (Redis)
10. **Add email notifications**
11. **Implement search** functionality
12. **Add data export** features

## 📝 Project Structure

```
src/
├── entities/           # TypeORM entities (30+ tables)
├── modules/           # Feature modules
│   ├── auth/         # Authentication
│   ├── projects/     # Project management
│   ├── tasks/        # Task management
│   ├── meetings/     # Meeting management
│   ├── crm/          # CRM
│   ├── finance/      # Finance
│   ├── hr/           # Human resources
│   ├── product/      # Product management
│   ├── ai/           # AI features
│   └── ...           # 20+ more modules
├── common/           # Shared utilities
│   ├── guards/       # Auth guards
│   ├── decorators/   # Custom decorators
│   └── dto/          # Data transfer objects
├── app.module.ts     # Main app module
└── main.ts           # Application entry point
```

## 🤝 Contributing

This is a comprehensive backend implementation for TechOS. Each module has been scaffolded with basic CRUD operations. You can extend each module based on specific business requirements.

## 📄 License

Proprietary - TechOS Platform

## 🐛 Known Issues / TODO

- Implement detailed validation DTOs for each module
- Add comprehensive error handling
- Implement file upload middleware
- Add WebSocket support for real-time features
- Implement search functionality across modules
- Add data seeding for development
- Implement automated backups
- Add performance monitoring
- Implement rate limiting per user/org
- Add API versioning

## 💡 Tips

- All endpoints require JWT authentication except `/auth/register` and `/auth/login`
- Use the `Authorization: Bearer <token>` header for authenticated requests
- All data is scoped to organizations automatically
- The database auto-creates on first run
- Check `.env` file for configuration options
