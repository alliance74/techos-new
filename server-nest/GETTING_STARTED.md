# Getting Started with TechOS NestJS Backend

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd server-nest
npm install
```

### 2. Configure Environment
The `.env` file is already created with default values. You can modify it if needed:
```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Start the Server
```bash
npm run start:dev
```

The server will start on `http://localhost:4000`

### 4. Test the API

#### Register a new organization and user:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Tech Startup Inc",
    "email": "ceo@techstartup.com",
    "password": "SecurePass123!",
    "firstName": "Jane",
    "lastName": "Doe"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@techstartup.com",
    "password": "SecurePass123!"
  }'
```

Save the `token` from the response.

#### Create a Project:
```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Mobile App Development",
    "description": "Building our flagship mobile app",
    "priority": "high",
    "budget": 50000
  }'
```

#### Get All Projects:
```bash
curl -X GET http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Available Modules

### ✅ Fully Implemented
- **Auth**: Registration, Login, JWT Authentication
- **Projects**: Full CRUD + Statistics
- **Tasks**: Full CRUD with filtering
- **Sprints**: Full CRUD

### 🏗️ Scaffolded (Ready for Implementation)
All other modules have basic CRUD structure and need detailed implementation:
- Users
- Organizations
- Meetings
- Channels & Messages
- CRM (Contacts, Deals)
- Finance (Invoices, Expenses, Budgets)
- HR (Employees, Leaves)
- Documents
- Calendar
- Notifications
- Goals
- Announcements
- Product (Features, Epics, Releases, Bugs, Feedback)
- Analytics
- Dashboard
- Integrations
- AI
- Reports

## Common Commands

```bash
# Development with hot reload
npm run start:dev

# Production build
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint
```

## Connecting Frontend

Update your frontend (client) to point to the new backend:

```javascript
// In client/src/hooks/useApi.js or axios config
const API_BASE_URL = 'http://localhost:4000/api';
```

The endpoints remain mostly the same, just change port from `4000` (old Express) to `4000` (new NestJS).

## Database

- **Type**: SQLite
- **Location**: `./techos.db`
- **Auto-created**: Yes, on first run
- **Migrations**: Auto-sync enabled (TypeORM synchronize: true)

⚠️ **Important**: Set `synchronize: false` in production and use migrations!

## Next Development Steps

### 1. Expand Module Logic
Each module has basic CRUD. Add business logic:

```typescript
// Example: src/modules/meetings/meetings.service.ts
async createWithParticipants(org_id: string, createDto: any) {
  // Create meeting
  const meeting = await this.create(org_id, createDto);
  
  // Add participants
  // Send notifications
  // Create calendar events
  
  return meeting;
}
```

### 2. Add Validation DTOs
Create detailed DTOs for each module:

```typescript
// Example: src/modules/projects/dto/create-project.dto.ts
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['low', 'medium', 'high'])
  priority: string;
}
```

### 3. Implement AI Features
Add AI assistant capabilities:

```typescript
// src/modules/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarizeMeeting(notes: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a meeting summarizer.' },
        { role: 'user', content: `Summarize these meeting notes: ${notes}` },
      ],
    });
    
    return response.choices[0].message.content;
  }
}
```

### 4. Add Integrations
Implement external service integrations:

```typescript
// src/modules/integrations/github.service.ts
import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GitHubService {
  async getRepositories(accessToken: string) {
    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.repos.listForAuthenticatedUser();
    return data;
  }
}
```

### 5. Add WebSocket Support
For real-time features:

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
```

```typescript
// src/modules/messages/messages.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  sendMessage(channelId: string, message: any) {
    this.server.to(channelId).emit('newMessage', message);
  }
}
```

## Troubleshooting

### Port Already in Use
```bash
# Stop the old Express server or change port in .env
PORT=4001
```

### Database Locked
```bash
# Close any SQLite connections and restart
rm techos.db
npm run start:dev
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### 1. Update Configuration
```typescript
// src/app.module.ts
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: process.env.DATABASE_PATH,
  entities: Object.values(entities),
  synchronize: false, // ← IMPORTANT: Disable in production
  migrations: ['dist/migrations/**/*.js'],
  logging: false,
})
```

### 2. Build for Production
```bash
npm run build
```

### 3. Deploy
```bash
# Copy dist/ and node_modules to server
# Or use Docker:

# Dockerfile is ready, just run:
docker build -t techos-backend .
docker run -p 4000:4000 techos-backend
```

## Support

For issues or questions:
1. Check the README.md
2. Review the module code
3. Check NestJS documentation: https://docs.nestjs.com

Happy coding! 🚀
