# Database Setup for AI Chat System

## Auto-Setup (Recommended)

If you're using TypeORM with `synchronize: true` (development mode), the tables will be created automatically when you start the server.

1. Make sure the entities are imported in `ai.module.ts` ✅ (Already done)
2. Start the server:
   ```bash
   npm run start:dev
   ```
3. Tables will be created automatically

## Manual SQL Setup (Production)

If you need to create tables manually or are in production mode, use these SQL commands:

### SQLite (Development)

```sql
-- AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    user_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    provider TEXT DEFAULT 'gemini',
    summary TEXT,
    message_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens INTEGER DEFAULT 0,
    metadata TEXT,
    edited INTEGER DEFAULT 0,
    edited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

-- AI Usage Table
CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    conversations_created INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_period ON ai_usage(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
```

### PostgreSQL (Production)

```sql
-- AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    org_id UUID NOT NULL,
    provider VARCHAR(20) DEFAULT 'gemini',
    summary TEXT,
    message_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tokens INTEGER DEFAULT 0,
    metadata JSONB,
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

-- AI Usage Table
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    org_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    conversations_created INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_period ON ai_usage(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
```

## Verify Tables

After setup, verify the tables exist:

```bash
# For SQLite
sqlite3 techos.db ".tables"

# Should show:
# ai_conversations
# ai_messages
# ai_usage
```

## Test Data (Optional)

Insert test data to verify setup:

```sql
-- This will fail if tables don't exist
INSERT INTO ai_usage (id, user_id, org_id, period_start, period_end, messages_sent, conversations_created, tokens_used)
VALUES ('test-id', 'user-id', 'org-id', '2026-08-01', '2026-08-31', 0, 0, 0);

-- Clean up test data
DELETE FROM ai_usage WHERE id = 'test-id';
```

## Troubleshooting

### Issue: Tables not created automatically
**Cause**: TypeORM synchronize is disabled
**Solution**: 
1. Check `app.module.ts` TypeORM config
2. Set `synchronize: true` for development
3. Restart server

### Issue: Foreign key constraint error
**Cause**: Users table doesn't exist yet
**Solution**: 
1. Make sure auth module is loaded first
2. Users table should exist before AI tables

### Issue: SQLite locking errors
**Cause**: Multiple connections to database
**Solution**: 
1. Close all database connections
2. Restart the server
3. Only one process should access SQLite at a time

## Next Steps

After database is set up:

1. ✅ Start the backend server
2. ✅ Test the `/api/ai/conversations` endpoint
3. ✅ Create a conversation from the frontend
4. ✅ Send a message
5. ✅ Check usage stats at `/api/ai/usage`

The system is now ready to use! 🚀
