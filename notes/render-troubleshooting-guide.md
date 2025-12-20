# Render.com Troubleshooting Guide - Mining ERP

**Last Updated:** December 20, 2024

---

## 🔍 Common Deployment Issues

### 1. Backend Service Won't Start

#### Symptoms
- Service shows "Deploy failed"
- Logs show "Application failed to start"
- Health check failing

#### Possible Causes & Solutions

**A. Database Connection Error**

```
Error: Can't reach database server at `dpg-xxxxx`
```

**Solutions:**
1. Verify you're using the **Internal Database URL** (not External)
2. Check database service is "Available" status
3. Ensure DATABASE_URL has no extra spaces or line breaks
4. Confirm database and backend are in the same region

**Fix:**
```bash
# In backend Shell
echo $DATABASE_URL
# Should show: postgresql://user:pass@dpg-xxxxx/mining_erp (no external domain)
```

**B. Prisma Migration Errors**

```
Error: P3009: migrate found failed migrations
```

**Solutions:**
```bash
# In backend Shell
npx prisma migrate resolve --rolled-back 20241218_add_phase_15_4_signatures_security
npx prisma migrate resolve --rolled-back 20251125030000_add_notifications_it_payment_requests
npx prisma migrate deploy
npx prisma generate
```

**C. Missing Dependencies**

```
Error: Cannot find module '@nestjs/core'
```

**Solutions:**
1. Check package.json includes all dependencies
2. Clear build cache:
   - Go to Settings → Build & Deploy
   - Click "Clear build cache & deploy"
3. Verify build command: `npm install && npm run build`

**D. Port Configuration**

```
Error: Port 3001 is already in use
```

**Solution:**
- Ensure PORT environment variable is set to `10000`
- Render uses port 10000 for web services

---

### 2. Frontend Build Fails

#### Symptoms
- Build fails during `npm run build`
- "Module not found" errors
- TypeScript compilation errors

#### Possible Causes & Solutions

**A. Missing Environment Variables**

```
Error: process.env.NEXT_PUBLIC_API_URL is undefined
```

**Solution:**
Add required environment variables:
```bash
BACKEND_URL=https://mining-erp-backend.onrender.com
NEXT_PUBLIC_API_URL=https://mining-erp-backend.onrender.com/api
NODE_ENV=production
```

**B. Build Timeout**

```
Error: Build exceeded maximum time limit
```

**Solutions:**
1. Upgrade to larger instance type
2. Optimize build:
   - Remove unused dependencies
   - Check for circular dependencies
   - Reduce bundle size

**C. Next.js Configuration Issues**

```
Error: Invalid next.config.js
```

**Solution:**
Check `dev/frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendBaseUrl = process.env.BACKEND_URL || 'https://mining-erp-backend.onrender.com';
    return [
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

---

### 3. CORS Errors

#### Symptoms
- Browser console shows: "Access to fetch blocked by CORS policy"
- API calls fail from frontend
- Network tab shows CORS error

#### Root Cause
Backend FRONTEND_URL doesn't match actual frontend URL

#### Solutions

**Step 1: Verify Frontend URL**
```
Actual frontend: https://mining-erp-frontend.onrender.com
```

**Step 2: Update Backend Environment**
```bash
FRONTEND_URL=https://mining-erp-frontend.onrender.com
FRONTEND_URLS=https://mining-erp-frontend.onrender.com
```

**Step 3: Important Details**
- Include `https://` protocol
- No trailing slash
- Exact match required
- Case sensitive

**Step 4: Redeploy Backend**
- Save environment variables
- Wait for automatic redeploy (2-3 minutes)

**Test CORS:**
```bash
curl -H "Origin: https://mining-erp-frontend.onrender.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://mining-erp-backend.onrender.com/api/auth/login
```

Should return headers including:
```
Access-Control-Allow-Origin: https://mining-erp-frontend.onrender.com
```

---

### 4. Database Connection Issues

#### Symptoms
- "Connection timeout" errors
- "Too many connections" errors
- Slow query performance

#### Solutions

**A. Connection Pool Exhausted**

```
Error: Can't reach database server - connection pool exhausted
```

**Solution:**
Update Prisma connection settings in `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  
  // Add connection pool settings
  relationMode = "prisma"
}
```

Add to backend environment:
```bash
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=5&pool_timeout=10"
```

**B. Using External URL Instead of Internal**

**Wrong:**
```bash
DATABASE_URL=postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/mining_erp
```

**Correct:**
```bash
DATABASE_URL=postgresql://user:pass@dpg-xxxxx/mining_erp
```

**C. Database Not Ready**

If backend starts before database is ready:
1. Wait 2-3 minutes after database creation
2. Manually redeploy backend
3. Check database status is "Available"

---

### 5. Authentication Issues

#### Symptoms
- "JWT malformed" errors
- "Invalid token" errors
- Users can't log in
- Token expires immediately

#### Solutions

**A. JWT Secret Mismatch**

**Problem:** JWT_SECRET changed after tokens were issued

**Solution:**
1. Keep JWT_SECRET consistent
2. If changed, all users must log in again
3. Clear browser localStorage/cookies

**B. JWT Secret Too Short**

```
Error: secretOrPrivateKey must be an asymmetric key
```

**Solution:**
Generate strong secret (min 32 characters):
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**C. Token Expiration Issues**

Check JWT_EXPIRATION setting:
```bash
JWT_EXPIRATION=7d  # 7 days
# or
JWT_EXPIRATION=24h  # 24 hours
```

---

### 6. File Upload Issues

#### Symptoms
- File uploads fail
- "File too large" errors
- Uploads work locally but not on Render

#### Solutions

**A. Disk Space Issues**

Render free tier has limited disk space.

**Solution:**
1. Use S3 for file storage:
```bash
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
```

2. Or upgrade to paid plan with more disk space

**B. File Size Limits**

**Solution:**
Increase limits:
```bash
MAX_FILE_SIZE=20971520  # 20MB
```

Also check nginx/proxy settings if using custom domain.

**C. Upload Directory Permissions**

```
Error: EACCES: permission denied, mkdir './uploads'
```

**Solution:**
```bash
# In backend Shell
mkdir -p uploads/documents
chmod 755 uploads
```

---

### 7. Slow Performance / Service Sleeping

#### Symptoms
- First request takes 30-60 seconds
- Service becomes unresponsive after inactivity
- Intermittent timeouts

#### Root Cause
Free tier services sleep after 15 minutes of inactivity

#### Solutions

**A. Upgrade to Paid Plan**
- Starter plan ($7/month) keeps service always on
- No cold starts
- Better performance

**B. Keep-Alive Ping (Free Tier Workaround)**

Create external monitoring:
```bash
# Use cron-job.org or UptimeRobot to ping every 10 minutes
GET https://mining-erp-backend.onrender.com/api
```

**C. Optimize Cold Start**
- Reduce dependencies
- Use lighter packages
- Optimize Prisma client generation

---

### 8. Environment Variable Issues

#### Symptoms
- Variables not loading
- "undefined" errors
- Configuration not applied

#### Solutions

**A. Variable Not Saved**

**Check:**
1. Go to service → Environment tab
2. Verify variable exists
3. Click "Save Changes" (triggers redeploy)

**B. Variable Name Typo**

Common mistakes:
```bash
# Wrong
DATABSE_URL=...
FRONEND_URL=...

# Correct
DATABASE_URL=...
FRONTEND_URL=...
```

**C. NEXT_PUBLIC_ Prefix Missing**

Frontend variables need `NEXT_PUBLIC_` prefix:
```bash
# Wrong (won't work in browser)
API_URL=...

# Correct
NEXT_PUBLIC_API_URL=...
```

**D. Variables with Special Characters**

Escape special characters:
```bash
# If password has special chars
DATABASE_URL="postgresql://user:pass%40word@host/db"
# @ becomes %40
```

---

### 9. Migration Issues

#### Symptoms
- "Migration failed" errors
- Schema out of sync
- "Table already exists" errors

#### Solutions

**A. Reset and Reapply Migrations**

```bash
# In backend Shell
npx prisma migrate reset --force
npx prisma migrate deploy
npx prisma generate
```

**Warning:** This deletes all data! Only use in development.

**B. Resolve Failed Migrations**

```bash
# Mark specific migration as resolved
npx prisma migrate resolve --rolled-back 20241218_add_phase_15_4_signatures_security

# Then deploy
npx prisma migrate deploy
```

**C. Manual Migration**

If automatic migration fails:
```bash
# Connect to database
psql $DATABASE_URL

# Run SQL manually
CREATE TABLE IF NOT EXISTS "users" (...);
```

---

### 10. Custom Domain Issues

#### Symptoms
- Domain not resolving
- SSL certificate errors
- Mixed content warnings

#### Solutions

**A. DNS Not Propagated**

Wait 24-48 hours for DNS propagation.

**Check DNS:**
```bash
nslookup api.yourdomain.com
dig api.yourdomain.com
```

**B. SSL Certificate Pending**

Render auto-generates SSL certificates.

**Check:**
1. Go to service → Settings → Custom Domains
2. Verify status is "Active"
3. Wait up to 24 hours for certificate

**C. Update Environment Variables**

After adding custom domain:

**Backend:**
```bash
FRONTEND_URL=https://app.yourdomain.com
```

**Frontend:**
```bash
BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## 🛠️ Debugging Tools

### View Logs

**Real-time logs:**
1. Go to service → Logs tab
2. Monitor for errors
3. Filter by log level

**Download logs:**
```bash
# Use Render CLI
render logs -s mining-erp-backend
```

### Access Service Shell

1. Go to service → Shell tab
2. Click "Launch Shell"
3. Run commands:
```bash
# Check environment
env | grep DATABASE

# Test database
npx prisma db pull

# Check files
ls -la
pwd

# Test API locally
curl http://localhost:10000/api
```

### Database Access

**Using Prisma Studio:**
```bash
# In backend Shell
npx prisma studio
```

**Using psql:**
```bash
# Get External Database URL from database service
psql $EXTERNAL_DATABASE_URL
```

### Test API Endpoints

```bash
# Health check
curl https://mining-erp-backend.onrender.com/api

# Login
curl -X POST https://mining-erp-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@miningerp.com","password":"Admin@123456"}'

# With auth token
curl https://mining-erp-backend.onrender.com/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Performance Optimization

### Backend Optimization

1. **Enable Prisma Query Caching:**
```typescript
// In main.ts
app.use(compression());
```

2. **Optimize Database Queries:**
```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: { id: true, email: true, firstName: true }
});

// Use pagination
const users = await prisma.user.findMany({
  take: 20,
  skip: 0
});
```

3. **Add Database Indexes:**
```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  
  @@index([email])
  @@index([createdAt])
}
```

### Frontend Optimization

1. **Enable Next.js Image Optimization:**
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['mining-erp-backend.onrender.com'],
  },
};
```

2. **Use Dynamic Imports:**
```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

3. **Enable Caching:**
```typescript
// Add revalidation
export const revalidate = 60; // Revalidate every 60 seconds
```

---

## 🔄 Rollback Procedures

### Rollback Backend

1. Go to backend service → Deploys tab
2. Find previous successful deploy
3. Click "Redeploy"

### Rollback Frontend

1. Go to frontend service → Deploys tab
2. Find previous successful deploy
3. Click "Redeploy"

### Rollback Database Migration

```bash
# In backend Shell
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## 📞 Getting Help

### Check Service Status

**Render Status Page:** https://status.render.com

### Community Support

**Render Community:** https://community.render.com

### Contact Support

**Render Support:** https://render.com/support
- Available on paid plans
- Response time: 24-48 hours

### Project-Specific Help

**GitHub Issues:** https://github.com/yellowpowerint/erp-software/issues

---

## ✅ Health Check Checklist

Run through this checklist if experiencing issues:

- [ ] All services show "Live" status
- [ ] Database shows "Available" status
- [ ] Backend logs show "Server running on port 10000"
- [ ] Backend logs show "Database URL: Connected"
- [ ] Frontend logs show successful build
- [ ] Health check endpoints responding
- [ ] No CORS errors in browser console
- [ ] Authentication working
- [ ] API calls succeeding
- [ ] Database queries executing

---

**Last Updated:** December 20, 2024  
**Maintained By:** Mining ERP Team
