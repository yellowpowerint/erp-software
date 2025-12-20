# Render.com Quick Start Checklist

**Project:** Mining ERP System  
**Estimated Time:** 30-45 minutes

---

## ✅ Pre-Deployment Checklist

- [ ] Render.com account created
- [ ] GitHub repository pushed (https://github.com/yellowpowerint/erp-software)
- [ ] Code reviewed and tested locally
- [ ] Strong JWT secret generated (min 32 characters)

---

## 📦 Deployment Steps

### Step 1: Deploy Database (5 minutes)

- [ ] Log in to Render Dashboard
- [ ] Click "New +" → "PostgreSQL"
- [ ] Configure:
  - Name: `mining-erp-database`
  - Database: `mining_erp`
  - Region: Choose closest to users
  - Plan: Starter ($7/month) or Free (testing)
- [ ] Click "Create Database"
- [ ] Wait for status: "Available"
- [ ] **Copy Internal Database URL** (save for next step)

**Database URL Format:**
```
postgresql://mining_erp_user:xxxxx@dpg-xxxxx/mining_erp
```

---

### Step 2: Deploy Backend (10 minutes)

- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub: `yellowpowerint/erp-software`
- [ ] Configure:
  - Name: `mining-erp-backend`
  - Region: Same as database
  - Branch: `main`
  - Root Directory: `dev/backend`
  - Environment: `Node`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start:prod`
  - Plan: Starter ($7/month) or Free (testing)

- [ ] Add Environment Variables:
  ```bash
  DATABASE_URL=<PASTE_DATABASE_URL_FROM_STEP_1>
  DIRECT_URL=<PASTE_DATABASE_URL_FROM_STEP_1>
  PORT=10000
  NODE_ENV=production
  JWT_SECRET=<YOUR_STRONG_SECRET_32_CHARS>
  JWT_EXPIRATION=7d
  FRONTEND_URL=https://mining-erp-frontend.onrender.com
  FRONTEND_URLS=https://mining-erp-frontend.onrender.com
  STORAGE_PROVIDER=local
  LOCAL_STORAGE_PATH=./uploads
  ```

- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Verify status: "Live"
- [ ] **Copy Backend URL** (save for next step)
- [ ] Test: `curl https://your-backend-url.onrender.com/api`

---

### Step 3: Deploy Frontend (10 minutes)

- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub: `yellowpowerint/erp-software`
- [ ] Configure:
  - Name: `mining-erp-frontend`
  - Region: Same as backend
  - Branch: `main`
  - Root Directory: `dev/frontend`
  - Environment: `Node`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
  - Plan: Starter ($7/month) or Free (testing)

- [ ] Add Environment Variables:
  ```bash
  BACKEND_URL=<PASTE_BACKEND_URL_FROM_STEP_2>
  NEXT_PUBLIC_API_URL=<PASTE_BACKEND_URL_FROM_STEP_2>/api
  NODE_ENV=production
  ```

- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Verify status: "Live"
- [ ] **Copy Frontend URL**

---

### Step 4: Update Backend CORS (2 minutes)

- [ ] Go to backend service → "Environment" tab
- [ ] Update these variables with actual frontend URL:
  ```bash
  FRONTEND_URL=<YOUR_ACTUAL_FRONTEND_URL>
  FRONTEND_URLS=<YOUR_ACTUAL_FRONTEND_URL>
  ```
- [ ] Click "Save Changes"
- [ ] Wait for automatic redeploy (2-3 minutes)

---

### Step 5: Create Admin User (5 minutes)

- [ ] Go to backend service → "Shell" tab
- [ ] Click "Launch Shell"
- [ ] Run Prisma Studio:
  ```bash
  npx prisma studio
  ```
- [ ] Or create user via command:
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
    
    console.log('Admin created:', admin.email);
    await prisma.\$disconnect();
  }
  
  createAdmin();
  "
  ```

---

### Step 6: Test Deployment (5 minutes)

- [ ] Open frontend URL in browser
- [ ] Verify login page loads
- [ ] Login with admin credentials:
  - Email: `admin@miningerp.com`
  - Password: `Admin@123456`
- [ ] Verify dashboard loads
- [ ] Test navigation through modules
- [ ] Check browser console for errors
- [ ] Test API call (create/view a record)

---

### Step 7: Configure Auto-Deploy (2 minutes)

**For Backend:**
- [ ] Go to backend → "Settings" → "Build & Deploy"
- [ ] Enable "Auto-Deploy" for `main` branch

**For Frontend:**
- [ ] Go to frontend → "Settings" → "Build & Deploy"
- [ ] Enable "Auto-Deploy" for `main` branch

---

### Step 8: Set Up Health Checks (2 minutes)

**Backend:**
- [ ] Go to backend → "Settings" → "Health Check"
- [ ] Set path: `/api`
- [ ] Save

**Frontend:**
- [ ] Go to frontend → "Settings" → "Health Check"
- [ ] Set path: `/`
- [ ] Save

---

## 🔒 Post-Deployment Security

- [ ] Change default admin password immediately
- [ ] Verify JWT_SECRET is strong and unique
- [ ] Confirm DATABASE_URL uses internal connection
- [ ] Check CORS settings are correct
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review environment variables for sensitive data
- [ ] Set up database backups (automatic on paid plans)

---

## 📊 Monitoring Setup

- [ ] Check backend logs for errors
- [ ] Check frontend logs for errors
- [ ] Monitor database metrics
- [ ] Set up email notifications for deploy failures
- [ ] Bookmark service URLs for quick access

---

## 🎯 Your Deployed URLs

Fill these in as you deploy:

```
Database: mining-erp-database (Internal URL only)
Backend:  https://_____________________.onrender.com
Frontend: https://_____________________.onrender.com
```

---

## 🐛 Common Issues & Quick Fixes

### Backend won't start
```bash
# In backend Shell
npm install
npx prisma generate
npx prisma migrate deploy
```

### Frontend build fails
- Go to Settings → "Clear build cache & deploy"

### CORS errors
- Verify FRONTEND_URL in backend matches exact frontend URL
- Ensure backend redeployed after updating FRONTEND_URL

### Database connection fails
- Confirm using INTERNAL Database URL
- Check database is in "Available" status
- Verify no extra spaces in DATABASE_URL

---

## 💰 Cost Summary

### Free Tier (Testing)
- Database: Free for 90 days
- Backend: Free (sleeps after inactivity)
- Frontend: Free (sleeps after inactivity)
- **Total: $0/month** (temporary)

### Production Setup (Recommended)
- Database: Starter $7/month
- Backend: Starter $7/month
- Frontend: Starter $7/month
- **Total: $21/month**

---

## 📞 Need Help?

- **Full Guide:** See `render-complete-deployment-guide.md`
- **Environment Variables:** See `render-environment-variables.md`
- **Render Docs:** https://render.com/docs
- **Render Support:** https://render.com/support

---

## ✅ Deployment Complete!

Once all checkboxes are complete, your Mining ERP system is live on Render.com!

**Next Steps:**
1. Share URLs with your team
2. Create additional user accounts
3. Import initial data
4. Configure custom domains (optional)
5. Set up email notifications (optional)

---

**Checklist Version:** 1.0  
**Last Updated:** December 20, 2024
