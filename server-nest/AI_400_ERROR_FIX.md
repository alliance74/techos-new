# AI Chat 400 Error - Fixed! ✅

## Problem
Getting 400 Bad Request when sending messages to the AI endpoint.

## Root Causes

### 1. Missing Message Validation
The controller wasn't validating that the `message` field exists and is not empty.

### 2. Missing API Keys
AI providers require API keys that might not be configured in your `.env` file.

### 3. No DTO Validation
The endpoint was accepting raw body parameters without proper validation.

## Solutions Applied

### 1. Created Chat DTO with Validation
**File**: `server-nest/src/modules/ai/dto/chat.dto.ts`

```typescript
export class ChatDto {
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message: string;

  @IsOptional()
  @IsIn(['openai', 'claude', 'gemini', 'grok'])
  provider?: 'openai' | 'claude' | 'gemini' | 'grok';
}
```

### 2. Updated Controller to Use DTO
Now the controller properly validates the request body before processing.

### 3. Added Provider Configuration Check
The service now validates that the selected AI provider is properly configured before attempting to use it.

### 4. Better Error Messages
- "Message cannot be empty"
- "OpenAI is not configured. Please add OPENAI_API_KEY..."
- "AI provider error: [specific error]"

## How to Fix Your Environment

### Step 1: Configure AI Providers
Add at least one AI provider API key to your `.env` file:

```env
# Choose one or more providers:

# OpenAI (Recommended)
OPENAI_API_KEY=sk-your-openai-key-here

# Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Google Gemini
GEMINI_API_KEY=your-gemini-key-here

# Grok (X.AI)
GROK_API_KEY=your-grok-key-here
```

### Step 2: Get API Keys

#### OpenAI (Recommended)
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

#### Claude (Anthropic)
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Generate a new key

#### Google Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API key"

#### Grok (X.AI)
1. Go to https://x.ai/
2. Request API access
3. Get your API key once approved

### Step 3: Restart Backend
```bash
cd server-nest
npm run start:dev
```

## Testing the AI Chat

### Valid Request
```bash
POST http://localhost:4000/ai/chat
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "What are my top priority tasks?",
  "provider": "openai"
}
```

### Frontend Usage
```typescript
const { mutate } = useSendChatMessage();

mutate({
  message: "What are my top priority tasks?",
  provider: "openai"
});
```

## Common Errors and Solutions

### Error: "Message is required"
**Cause**: Empty or missing message field  
**Solution**: Ensure you're sending a non-empty message

### Error: "OpenAI is not configured"
**Cause**: Missing API key in .env  
**Solution**: Add OPENAI_API_KEY to your .env file

### Error: "AI provider error: ..."
**Cause**: Invalid API key or network issue  
**Solution**: 
1. Verify your API key is correct
2. Check your internet connection
3. Ensure you have API credits/quota

### Error: "Invalid AI provider"
**Cause**: Using unsupported provider name  
**Solution**: Use one of: openai, claude, gemini, grok

## Request/Response Examples

### Example 1: Simple Question
```json
// Request
{
  "message": "How many projects do we have?",
  "provider": "openai"
}

// Response
{
  "success": true,
  "data": {
    "message": "You currently have 5 active projects and 2 completed projects...",
    "provider": "openai",
    "timestamp": "2026-08-10T10:30:00.000Z"
  }
}
```

### Example 2: Complex Analysis
```json
// Request
{
  "message": "Analyze our sprint velocity and suggest improvements",
  "provider": "claude"
}

// Response
{
  "success": true,
  "data": {
    "message": "Based on your sprint data:\n\n1. Current velocity: 45 points/sprint...",
    "provider": "claude",
    "timestamp": "2026-08-10T10:31:00.000Z"
  }
}
```

## Features Available

The AI has access to:
- ✅ All projects and their status
- ✅ Tasks and completion rates
- ✅ Bugs and severity levels
- ✅ Financial data (invoices, expenses)
- ✅ Team information
- ✅ Goals and OKRs progress
- ✅ Sprint data and velocity
- ✅ Meetings and schedules
- ✅ KPIs and metrics

## Useful AI Prompts

Try asking:
- "What's our project completion rate?"
- "Show me critical bugs that need attention"
- "How is our financial performance this month?"
- "Which goals are at risk?"
- "Generate an executive summary report"
- "What are the top priorities for this week?"
- "Analyze our sprint velocity trends"
- "Which team members need support?"

## Next Steps

1. ✅ Add validation to AI controller (DONE)
2. ✅ Create proper DTO (DONE)
3. ✅ Add provider configuration check (DONE)
4. ✅ Improve error messages (DONE)
5. 🔄 Configure your API key
6. 🔄 Test the endpoint
7. 🔄 Start using AI features!

---

**Status**: ✅ Fixed and Enhanced
**Date**: August 10, 2026
