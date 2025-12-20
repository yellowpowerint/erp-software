# Complete Render.com Deployment Guide - Mining ERP System

**Last Updated:** December 20, 2024  
**Project:** Mining ERP System  
**Stack:** Next.js Frontend + NestJS Backend + PostgreSQL Database

---

## 📋 Overview

This guide will walk you through deploying the entire Mining ERP system on Render.com, including:
1. **PostgreSQL Database** (Render PostgreSQL)
2. **Backend API** (NestJS on Render Web Service)
3. **Frontend Application** (Next.js on Render Static Site)

**Estimated Time:** 30-45 minutes  
**Cost:** Free tier available (with limitations) or paid plans starting at $7/month per service

---

## 🎯 Prerequisites

Before starting, ensure you have:
- [ ] A Render.com account (sign up at https://render.com)
- [ ] GitHub repository with your code pushed (https://github.com/yellowpowerint/erp-software)
- [ ] Git installed locally
- [ ] Node.js 18+ installed locally (for testing)

---

## 📦 Deployment Order

**IMPORTANT:** Deploy in this exact order to ensure proper configuration:

1. **Database First** - PostgreSQL (provides DATABASE_URL)
2. **Backend Second** - NestJS API (connects to database, provides API_URL)
3. **Frontend Last** - Next.js (connects to backend API)

---

## Part 1: Deploy PostgreSQL Database

### Step 1.1: Create PostgreSQL Database

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button → Select **"PostgreSQL"**
3. Configure the database:
   - **Name:** `mining-erp-database`
   - **Database:** `mining_erp`
   - **User:** `mining_erp_user` (auto-generated)
   - **Region:** Choose closest to your users (e.g., Oregon, Frankfurt, Singapore)
   - **PostgreSQL Version:** 16 (recommended)
   - **Plan:** 
     - Free tier: Good for testing (expires after 90 days)
     - Starter ($7/month): Recommended for production
     - Standard ($20/month): For larger scale

4. Click **"Create Database"**

### Step 1.2: Wait for Database Provisioning

- Database creation takes 2-5 minutes
- Status will change from "Creating" → "Available"
- Once available, you'll see connection details

### Step 1.3: Save Database Connection Details

On the database page, you'll find:
- **Internal Database URL** (use this for backend): `postgresql://mining_erp_user:xxxxx@dpg-xxxxx/mining_erp`
- **External Database URL** (for local testing): `postgresql://mining_erp_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/mining_erp`

**IMPORTANT:** Copy the **Internal Database URL** - you'll need it for the backend deployment.

### Step 1.4: Configure Database Access (Optional)

For additional security:
1. Go to database **"Access Control"** tab
2. Add your IP address if you need direct access for migrations
3. Enable SSL (recommended for production)

---

## Part 2: Deploy Backend API (NestJS)

### Step 2.1: Create Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect account"** if not connected
   - Select **"yellowpowerint/erp-software"**
   - Click **"Connect"**

### Step 2.2: Configure Backend Service

Fill in the following settings:

**Basic Settings:**
- **Name:** `mining-erp-backend`
- **Region:** Same as your database (important for low latency)
- **Branch:** `main`
- **Root Directory:** `dev/backend`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`

**Instance Type:**
- Free tier: Good for testing (sleeps after inactivity)
- Starter ($7/month): Recommended for production (always on)
- Standard ($25/month): For higher traffic

### Step 2.3: Configure Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```bash
# Database Configuration
DATABASE_URL=<PASTE_INTERNAL_DATABASE_URL_FROM_STEP_1.3>
DIRECT_URL=<PASTE_INTERNAL_DATABASE_URL_FROM_STEP_1.3>

# Application Configuration
PORT=10000
NODE_ENV=production

# JWT Configuration (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this
JWT_EXPIRATION=7d

# Frontend URL (we'll update this after frontend deployment)
FRONTEND_URL=https://mining-erp-frontend.onrender.com
FRONTEND_URLS=https://mining-erp-frontend.onrender.com

# Storage Configuration (for document uploads)
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads

# Optional: Email Configuration (for notifications)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASSWORD=your-app-password

# Optional: AI Configuration (for AI features)
# OPENAI_API_KEY=sk-your-openai-key
# CLAUDE_API_KEY=your-claude-key
```

**CRITICAL SECURITY NOTES:**
- Change `JWT_SECRET` to a strong random string (min 32 characters)
- Never commit these values to Git
- Use Render's environment variable encryption

### Step 2.4: Deploy Backend

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Run Prisma migrations
   - Build the application
   - Start the server

3. Monitor deployment in the **"Logs"** tab
4. Deployment takes 5-10 minutes

### Step 2.5: Verify Backend Deployment

Once deployed (status shows "Live"):

1. Copy your backend URL: `https://mining-erp-backend.onrender.com`
2. Test the health endpoint:
   ```bash
   curl https://mining-erp-backend.onrender.com/api
   ```
   Should return: `{"message":"Mining ERP API is running"}`

3. Check logs for any errors:
   - Go to **"Logs"** tab
   - Look for "Backend server running on port 10000"
   - Verify "Database URL: Connected"

### Step 2.6: Run Database Migrations (If Needed)

If migrations didn't run automatically:

1. Go to backend service → **"Shell"** tab
2. Click **"Launch Shell"**
3. Run:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## Part 3: Deploy Frontend (Next.js)

### Step 3.1: Create Static Site

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository: **"yellowpowerint/erp-software"**

### Step 3.2: Configure Frontend Service

**Basic Settings:**
- **Name:** `mining-erp-frontend`
- **Region:** Same as backend
- **Branch:** `main`
- **Root Directory:** `dev/frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `.next`

**Note:** For Next.js, we'll actually use a **Web Service** instead of Static Site for better SSR support.

### Step 3.3: Switch to Web Service (Recommended)

Actually, let's use a **Web Service** for Next.js:

1. Click **"New +"** → **"Web Service"**
2. Connect repository: **"yellowpowerint/erp-software"**
3. Configure:
   - **Name:** `mining-erp-frontend`
   - **Region:** Same as backend
   - **Branch:** `main`
   - **Root Directory:** `dev/frontend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Starter ($7/month recommended)

### Step 3.4: Configure Frontend Environment Variables

Add these environment variables:

```bash
# Backend API URL (use your actual backend URL from Step 2.5)
BACKEND_URL=https://mining-erp-backend.onrender.com
NEXT_PUBLIC_API_URL=https://mining-erp-backend.onrender.com/api

# Node Environment
NODE_ENV=production
```

### Step 3.5: Deploy Frontend

1. Click **"Create Web Service"**
2. Monitor deployment in **"Logs"** tab
3. Deployment takes 5-10 minutes

### Step 3.6: Verify Frontend Deployment

Once deployed:

1. Copy your frontend URL: `https://mining-erp-frontend.onrender.com`
2. Open in browser
3. You should see the login page
4. Test login with default credentials (if seeded)

---

## Part 4: Update Backend CORS Settings

### Step 4.1: Update Backend Environment Variables

Now that frontend is deployed, update backend CORS:

1. Go to backend service → **"Environment"** tab
2. Update these variables:
   ```bash
   FRONTEND_URL=https://mining-erp-frontend.onrender.com
   FRONTEND_URLS=https://mining-erp-frontend.onrender.com
   ```
3. Click **"Save Changes"**
4. Backend will automatically redeploy

---

## Part 5: Create Initial Admin User

### Step 5.1: Access Backend Shell

1. Go to backend service → **"Shell"** tab
2. Click **"Launch Shell"**

### Step 5.2: Create Admin User

Run this command (adjust values as needed):

```bash
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const prisma = new PrismaClient();
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@miningerp.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      department: 'IT',
      position: 'System Administrator'
    }
  });
  
  console.log('Admin user created:', admin.email);
  await prisma.\$disconnect();
}

createAdmin();
"
```

Or use Prisma Studio:
```bash
npx prisma studio
```
Then create user manually through the UI.

---

## Part 6: Post-Deployment Configuration

### Step 6.1: Configure Custom Domains (Optional)

**For Backend:**
1. Go to backend service → **"Settings"** → **"Custom Domains"**
2. Add your domain: `api.yourdomain.com`
3. Update DNS records as instructed
4. Enable automatic HTTPS

**For Frontend:**
1. Go to frontend service → **"Settings"** → **"Custom Domains"**
2. Add your domain: `app.yourdomain.com` or `yourdomain.com`
3. Update DNS records
4. Enable automatic HTTPS

### Step 6.2: Update Environment Variables for Custom Domains

If using custom domains, update:

**Backend:**
```bash
FRONTEND_URL=https://app.yourdomain.com
FRONTEND_URLS=https://app.yourdomain.com
```

**Frontend:**
```bash
BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Step 6.3: Enable Auto-Deploy

For both services:
1. Go to **"Settings"** → **"Build & Deploy"**
2. Enable **"Auto-Deploy"** for `main` branch
3. Now every push to GitHub will trigger automatic deployment

### Step 6.4: Set Up Health Checks

**Backend Health Check:**
1. Go to backend service → **"Settings"** → **"Health Check"**
2. Set **Health Check Path:** `/api`
3. Save

**Frontend Health Check:**
1. Go to frontend service → **"Settings"** → **"Health Check"**
2. Set **Health Check Path:** `/`
3. Save

---

## Part 7: Testing Your Deployment

### Step 7.1: Test Backend API

```bash
# Health check
curl https://mining-erp-backend.onrender.com/api

# Login test
curl -X POST https://mining-erp-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@miningerp.com","password":"Admin@123456"}'
```

### Step 7.2: Test Frontend

1. Open `https://mining-erp-frontend.onrender.com`
2. Try logging in with admin credentials
3. Navigate through different modules
4. Test creating/viewing records

### Step 7.3: Test Database Connection

1. Go to backend service → **"Shell"**
2. Run:
   ```bash
   npx prisma studio
   ```
3. Access Prisma Studio to view database records

---

## 🔒 Security Checklist

After deployment, verify:

- [ ] JWT_SECRET is a strong random string (not the example value)
- [ ] Database is using internal URL (not external)
- [ ] CORS is configured correctly (only your frontend domain)
- [ ] HTTPS is enabled for all services
- [ ] Environment variables are not committed to Git
- [ ] Default admin password has been changed
- [ ] Database backups are enabled (Render auto-backups on paid plans)
- [ ] Health checks are configured
- [ ] Error logging is monitored

---

## 📊 Monitoring & Maintenance

### View Logs

**Backend Logs:**
- Go to backend service → **"Logs"** tab
- Monitor for errors, slow queries, crashes

**Frontend Logs:**
- Go to frontend service → **"Logs"** tab
- Monitor for build errors, runtime issues

### Database Monitoring

1. Go to database → **"Metrics"** tab
2. Monitor:
   - Connection count
   - Query performance
   - Storage usage
   - CPU/Memory usage

### Set Up Alerts

1. Go to service → **"Settings"** → **"Notifications"**
2. Add email/Slack for:
   - Deploy failures
   - Service crashes
   - High resource usage

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check logs for:**
- Database connection errors → Verify DATABASE_URL
- Migration errors → Run migrations manually in Shell
- Port conflicts → Ensure PORT=10000
- Missing dependencies → Check package.json

**Solutions:**
```bash
# In backend Shell
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:prod
```

### Frontend Build Fails

**Common issues:**
- Missing environment variables → Add NEXT_PUBLIC_API_URL
- Build timeout → Increase instance size
- Dependency errors → Clear cache and rebuild

**Solutions:**
1. Go to **"Settings"** → **"Build & Deploy"**
2. Click **"Clear build cache & deploy"**

### Database Connection Issues

**Check:**
- Using Internal Database URL (not External)
- Database is in same region as backend
- Connection string format is correct
- Database is "Available" status

### CORS Errors

**Fix:**
1. Update backend FRONTEND_URL to match exact frontend URL
2. Include protocol (https://)
3. No trailing slash
4. Redeploy backend

### Slow Performance

**Free Tier Issues:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- **Solution:** Upgrade to Starter plan ($7/month)

**Database Performance:**
- Add indexes to frequently queried columns
- Optimize Prisma queries
- Upgrade database plan if needed

---

## 💰 Cost Breakdown

### Free Tier (Testing Only)
- Database: Free for 90 days, then expires
- Backend: Free (sleeps after inactivity)
- Frontend: Free (sleeps after inactivity)
- **Total:** $0/month (temporary)

### Recommended Production Setup
- Database: Starter ($7/month)
- Backend: Starter ($7/month)
- Frontend: Starter ($7/month)
- **Total:** $21/month

### High-Traffic Setup
- Database: Standard ($20/month)
- Backend: Standard ($25/month)
- Frontend: Standard ($25/month)
- **Total:** $70/month

---

## 🔄 Updating Your Deployment

### Automatic Updates (Recommended)

With Auto-Deploy enabled:
1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Render automatically deploys changes

### Manual Deploy

1. Go to service → **"Manual Deploy"**
2. Select branch
3. Click **"Deploy"**

### Database Migrations

When you add new Prisma models:
1. Update `schema.prisma`
2. Create migration locally:
   ```bash
   cd dev/backend
   npx prisma migrate dev --name add_new_feature
   ```
3. Push to GitHub
4. Backend auto-deploys and runs migrations

---

## 📞 Support Resources

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Render Status:** https://status.render.com
- **Project Issues:** https://github.com/yellowpowerint/erp-software/issues

---

## ✅ Deployment Complete!

Your Mining ERP system is now fully deployed on Render.com:

- **Frontend:** https://mining-erp-frontend.onrender.com
- **Backend API:** https://mining-erp-backend.onrender.com/api
- **Database:** Managed PostgreSQL on Render

**Next Steps:**
1. Change default admin password
2. Create additional user accounts
3. Configure email notifications (optional)
4. Set up custom domains (optional)
5. Enable database backups
6. Monitor logs and performance

---

**Deployment Date:** December 20, 2024  
**Deployed By:** Mining ERP Team  
**Version:** 1.0.0
