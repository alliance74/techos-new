# Render Deployment Guide - Backend Deployed ✅

## Current Status
✅ **Backend deployed successfully at**: `https://techos-new.onrender.com`
✅ **Server started successfully**
✅ **Database seeded with CEO account**
⚠️ **Redis errors fixed** - Backend now runs without Redis in production

## Fixed: Redis Connection Errors

The Redis connection errors you saw have been fixed. The backend now:
1. **Detects production environment** and skips Redis if not configured
2. **Stops retrying after 3 attempts** instead of 20+
3. **Runs without cache** if Redis is unavailable
4. **Logs warnings instead of errors** (less noise in logs)

## Required Environment Variables on Render

Go to your Render dashboard → `techos-new` service → Environment tab and add these:

### ✅ Already Working (Based on your logs)
- `DATABASE_PATH` - SQLite database location
- Organization and CEO account seeded successfully

### 🔧 Redis Configuration (Optional)
**Option 1: Disable Redis** (Recommended for free tier)
```bash
REDIS_ENABLED=false
```

**Option 2: Use External Redis** (If you have a Redis instance)
```bash
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

**Recommendation**: Use `REDIS_ENABLED=false` on Render's free tier. Redis is only used for caching and is optional.

### 🚀 Required for AI Features
```bash
# At least one AI provider
GEMINI_API_KEY=AIzaSyA4JNdZCxgE7iSCJ8sA8JMi8U8ObTC5ZzA

# Or use OpenAI
OPENAI_API_KEY=your-openai-key

# Or use Claude
ANTHROPIC_API_KEY=your-anthropic-key
```

### 🔐 Security (CRITICAL for production)
```bash
JWT_SECRET=change-this-to-a-random-64-character-string
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=4000
```

**Generate a secure JWT secret:**
```bash
# In terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 🌐 Frontend Configuration
```bash
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 📧 Email (Optional - for notifications)
```bash
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@techos-new.onrender.com
```

### ☁️ File Upload (Optional - for Cloudinary)
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_FILE_SIZE=10485760
```

## Testing Your Deployed Backend

### 1. Check Health
```bash
curl https://techos-new.onrender.com/api/health
```

### 2. Test Login
```bash
curl -X POST https://techos-new.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@gmail.com",
    "password": "Ceo@2026"
  }'
```

### 3. Test AI Chat (After login - use the JWT token from step 2)
```bash
curl -X POST https://techos-new.onrender.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "org_id": "YOUR_ORG_ID",
    "user_id": "YOUR_USER_ID",
    "message": "What are the active projects?",
    "provider": "gemini"
  }'
```

## Frontend Deployment

### Update Frontend API URL
Before deploying frontend, update the API base URL:

**File**: `frontend/src/lib/api.ts` or `frontend/.env.production`
```bash
NEXT_PUBLIC_API_URL=https://techos-new.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://techos-new.onrender.com
```

### Deploy Frontend to Vercel
```bash
cd frontend
vercel deploy --prod
```

Or push to GitHub and link to Vercel for auto-deployment.

## Deployment Checklist

### Backend (Render) ✅
- [x] Backend deployed at https://techos-new.onrender.com
- [x] Server starting successfully
- [x] Database seeded with CEO account
- [x] Redis errors fixed (optional cache)
- [ ] Add `REDIS_ENABLED=false` to Render environment
- [ ] Add secure `JWT_SECRET` (generate random string)
- [ ] Add `NODE_ENV=production`
- [ ] Add AI provider keys (GEMINI_API_KEY)
- [ ] Test login endpoint
- [ ] Test AI chat endpoint

### Frontend (To Deploy)
- [ ] Update API URL to `https://techos-new.onrender.com/api`
- [ ] Deploy to Vercel/Netlify
- [ ] Add `FRONTEND_URL` to Render backend env
- [ ] Test complete flow: login → dashboard → AI chat

## Common Issues & Solutions

### ❌ Redis Errors (FIXED)
**Solution**: Code updated to handle Redis failures gracefully. Add `REDIS_ENABLED=false` to Render.

### ❌ AI Chat Returns 500 Error
**Solution**: Make sure `GEMINI_API_KEY` is set in Render environment variables.

### ❌ CORS Errors from Frontend
**Solution**: Add your frontend URL to `FRONTEND_URL` environment variable on Render.

### ❌ WebSocket/Socket.io Not Connecting
**Solution**: 
1. Render free tier may not support WebSockets persistently
2. Consider upgrading to a paid plan for real-time features
3. Or use polling instead of WebSockets for notifications

### ❌ Database Resets on Redeploy
**Solution**: 
1. Render's free tier ephemeral storage resets on redeploy
2. Upgrade to paid plan with persistent disk
3. Or use external PostgreSQL database instead of SQLite

## Performance Considerations

### Render Free Tier Limitations
- ⚠️ **Spins down after 15 min of inactivity** (first request will be slow)
- ⚠️ **Ephemeral storage** (database resets on redeploy)
- ⚠️ **Limited memory/CPU**

### Recommended for Production
- Upgrade to **Render Starter Plan** ($7/month) for:
  - Always-on service (no spin down)
  - Persistent disk (database survives redeploys)
  - Better performance

### Alternative: Use PostgreSQL
Replace SQLite with PostgreSQL for production:
1. Add PostgreSQL database on Render (free tier available)
2. Update `DATABASE_PATH` to PostgreSQL connection string
3. Update TypeORM config to use PostgreSQL driver

## Next Steps

1. **Add Redis config to Render**
   ```bash
   REDIS_ENABLED=false
   ```

2. **Add secure JWT secret**
   ```bash
   JWT_SECRET=your-random-64-char-string
   ```

3. **Deploy frontend** to Vercel with updated API URL

4. **Test the full flow**:
   - Login at frontend
   - Navigate to AI chat
   - Ask: "What's on my calendar today?"

5. **(Optional) Upgrade Render plan** for better performance

---

## Support

### API Documentation
Visit: `https://techos-new.onrender.com/api/docs`

### Default Credentials
- **Email**: ceo@gmail.com
- **Password**: Ceo@2026

### Test Organization
- **Slug**: techos-company
- **Name**: TechOS Company

---

**Status**: ✅ Backend deployed and running!
**Next**: Configure environment variables and deploy frontend
