# TechOS AI Module - Setup Guide

## Overview
The AI module provides an intelligent assistant that understands your entire TechOS system with access to:
- All projects, tasks, and sprints
- Financial data (invoices, expenses, budgets)
- HR data (employees, leave requests)
- Goals, KPIs, and meetings
- Bugs, features, and releases
- Real-time analytics

## Supported AI Providers

### 1. OpenAI (GPT-4)
- **Best for**: General-purpose, balanced performance
- **Get API Key**: https://platform.openai.com/api-keys
- **Add to `.env`**: `OPENAI_API_KEY=sk-...`

### 2. Anthropic Claude
- **Best for**: Detailed analysis, long context
- **Get API Key**: https://console.anthropic.com/
- **Add to `.env`**: `ANTHROPIC_API_KEY=sk-ant-...`

### 3. Google Gemini
- **Best for**: Multimodal tasks, free tier available
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Add to `.env`**: `GEMINI_API_KEY=...`

### 4. xAI Grok
- **Best for**: Real-time data, creative responses
- **Get API Key**: https://console.x.ai/
- **Add to `.env`**: `GROK_API_KEY=...`

## API Endpoints

### Chat with AI
```
POST /api/ai/chat
Body: {
  "message": "What's our project completion rate?",
  "provider": "openai"  // optional: openai, claude, gemini, grok
}
```

### Generate Report
```
GET /api/ai/generate-report?type=executive&provider=claude
```

Report types:
- `executive` - Complete overview
- `financial` - Financial analysis
- `project` - Project status
- `sprint` - Sprint analytics
- `goals` - OKRs progress

### Risk Analysis
```
GET /api/ai/analyze-risk?provider=claude
```

### Priority Suggestions
```
GET /api/ai/suggest-priorities?provider=openai
```

## Example Questions

**Project Management:**
- "What projects are at risk of delay?"
- "Show me tasks assigned to John"
- "What's our sprint velocity?"

**Financial:**
- "What's our current cash flow?"
- "Which expenses need approval?"
- "Generate a financial summary"

**Team:**
- "Who has the most pending tasks?"
- "Show team productivity metrics"
- "Any pending leave requests?"

**Goals & KPIs:**
- "How are we tracking against our goals?"
- "Which KPIs are behind target?"
- "What's our goal completion rate?"

**General:**
- "Give me an executive summary"
- "What should I prioritize today?"
- "Any critical bugs open?"

## Features

✅ **System-Wide Context**: AI has access to ALL your data
✅ **Real-Time Analysis**: Analyzes current state of your organization
✅ **Multi-Provider Support**: Choose the best AI for your needs
✅ **Smart Recommendations**: Actionable insights based on data
✅ **Natural Language**: Ask questions in plain English
✅ **Comprehensive Reports**: Generate detailed analysis reports

## Cost Considerations

- **OpenAI GPT-4**: ~$0.03 per 1K tokens
- **Claude 3.5 Sonnet**: ~$0.015 per 1K tokens
- **Gemini Pro**: Free tier available, then $0.00125 per 1K tokens
- **Grok**: Pricing varies

Typical chat query: 2K-4K tokens (~$0.06-0.12 with GPT-4)

## Security

- API keys stored securely in environment variables
- AI never stores conversations (stateless)
- All data stays within your system
- HTTPS recommended for production

## Getting Started

1. Choose an AI provider
2. Get your API key
3. Add key to `.env` file
4. Restart the server
5. Start chatting at `/api/ai/chat`

Visit `/api/docs` for the interactive API documentation!
