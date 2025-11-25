# Railway Deployment - Step-by-Step Guide

## 🚂 Where to Set Root Directory in Railway

The root directory setting is in the **Service Settings**, not Project Settings!

---

## 📋 Complete Railway Setup Process

### Step 1: Create Railway Account
1. Go to: https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with **GitHub**
4. Authorize Railway to access your GitHub repos

---

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select: **`webblabsorg/erp`**
4. Railway will start analyzing your repo

---

### Step 3: Configure Service Settings (ROOT DIRECTORY HERE!)

After Railway detects your repo:

1. **Railway will show your service** (might auto-detect as Node.js)
2. Click on the **service card** (the backend deployment)
3. Go to the **"Settings"** tab (of the SERVICE, not project)
4. Scroll down to **"Root Directory"** section
5. Enter: `dev/backend`
6. Click **"Save"** or it auto-saves

**Screenshot Location:**
```
Project → Service Card → Settings → Root Directory
```

---

### Step 4: Configure Build Settings (Still in Service Settings)

In the same **Service Settings** page:

#### Build Command (if needed):
```
npm install && npm run build
```

#### Start Command:
```
npm run start:prod
```

**Note:** Railway usually auto-detects these from `package.json`, but you can override if needed.

---

### Step 5: Add Environment Variables

Still in **Service Settings**:

1. Click **"Variables"** tab (top of service page)
2. Click **"+ New Variable"**
3. Add these variables:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require
FRONTEND_URL=https://your-app.vercel.app
JWT_SECRET=your-generated-secret-here
JWT_EXPIRATION=7d
```

**Generate JWT_SECRET:**
```bash
# Run in terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Click **"Add"** for each variable

---

### Step 6: Deploy

1. Railway will automatically start deploying after you save settings
2. Watch the **"Deployments"** tab for build logs
3. Wait for deployment to complete (usually 2-5 minutes)

---

## 🔍 Troubleshooting: Can't Find Root Directory?

### Option A: Railway Auto-Created Multiple Services
If Railway detected both frontend and backend:

1. You'll see **2 service cards** in your project
2. Click the **backend service card**
3. Go to that service's **Settings** tab
4. Set root directory there

### Option B: Manual Service Creation

If Railway didn't detect your backend:

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose `webblabsorg/erp` again
4. Railway will create a new service
5. Now set the root directory in that service's settings

### Option C: Use railway.json (Already Created!)

Good news! I already created `dev/backend/railway.json` for you. Railway should auto-detect this.

If Railway reads the `railway.json` file, it will automatically use `dev/backend` as the root.

---

## 🎯 Expected Railway Interface Flow

```
1. Dashboard → New Project
2. Deploy from GitHub → Select erp repo
3. Railway creates service(s)
4. Click SERVICE CARD (not project settings)
5. SERVICE Settings tab → Root Directory field
6. Enter: dev/backend
7. Variables tab → Add environment variables
8. Deploy automatically starts
```

---

## 🔄 Alternative: Deploy Backend Only First

If Railway is showing both frontend and backend:

### Method 1: Delete Frontend Service (Temporary)
1. Click the frontend service card
2. Settings → Scroll down → **"Delete Service"**
3. Keep only backend service
4. Deploy frontend to Vercel separately

### Method 2: Keep Both Services
1. Configure backend service with `dev/backend` root
2. Configure frontend service with `dev/frontend` root
3. Deploy both from Railway
4. (But Vercel is better for Next.js)

---

## ✅ Verification

After deployment, Railway provides a URL like:
```
https://your-backend-production.up.railway.app
```

Test it:
```
https://your-backend-production.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Mining ERP Backend API is running"
}
```

---

## 🆘 Still Can't Find It?

### Quick Fix: Use CLI

Railway CLI can set the root directory:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set root directory
railway up --rootDir dev/backend
```

---

## 📸 Visual Guide

**Service Settings Location:**
```
Railway Dashboard
  └── Your Project (webblabsorg/erp)
      └── Service Card (click it)
          └── Tabs: [Deployments] [Variables] [Settings] [Metrics]
              └── Click "Settings"
                  └── Scroll to "Root Directory"
                      └── Enter: dev/backend
```

---

## 💡 Pro Tips

1. **Check Deployments Tab** - Watch logs in real-time
2. **Use Variables Tab** - Much easier than CLI for env vars
3. **Enable Auto-Deploy** - Railway auto-deploys on git push
4. **Domain Setup** - Get free railway.app subdomain automatically

---

## 🚀 After Railway Setup

Once backend is deployed:
1. Copy your Railway URL
2. Use it in Vercel frontend env: `NEXT_PUBLIC_API_URL`
3. Test the health endpoint
4. Proceed to deploy frontend on Vercel

---

**Need Help?** 
- Check Railway logs in Deployments tab
- Railway Docs: https://docs.railway.app
- Or let me know what you're seeing and I'll help troubleshoot!
