# Render Deployment Guide - Backend

## 🎯 Why Render for Backend?

✅ **Clear monorepo support** - Has explicit "Root Directory" field
✅ **Free tier available** - 750 hours/month free
✅ **Simple UI** - Much clearer than Railway
✅ **Auto-deploys** - Push to GitHub → auto-deploy
✅ **Great for NestJS** - Works perfectly with Node.js apps

---

## 📋 Step-by-Step Render Deployment

### Step 1: Create Render Account (2 minutes)

1. Go to: **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Select **"Sign up with GitHub"**
4. Authorize Render to access your GitHub account
5. ✅ You're logged in!

---

### Step 2: Create New Web Service (1 minute)

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. You'll see your GitHub repositories listed
4. Find and click **"Connect"** next to `webblabsorg/erp`
   - If you don't see it, click **"Configure account"** to grant access

---

### Step 3: Configure Service Settings (3 minutes)

You'll see a form with clear fields. Fill them out:

#### **Basic Settings:**

| Field | Value |
|-------|-------|
| **Name** | `mining-erp-backend` (or any name you want) |
| **Region** | Choose closest to your users (e.g., Oregon, Frankfurt, Singapore) |
| **Branch** | `main` |
| **Root Directory** | `dev/backend` ← **IMPORTANT!** |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |

#### **Instance Type:**
- Select **"Free"** for now (can upgrade later)
- Free tier: 750 hours/month, 512MB RAM

---

### Step 4: Add Environment Variables (3 minutes)

Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** and add these one by one:

```bash
NODE_ENV=production

PORT=3001

DATABASE_URL=postgresql://user:password@host/database
# ↑ You'll get this from Neon in the next step

FRONTEND_URL=https://your-app.vercel.app
# ↑ Add Vercel URL after frontend is deployed (can update later)

JWT_SECRET=your-generated-random-secret
# ↑ Generate below

JWT_EXPIRATION=7d
```

#### **Generate JWT_SECRET:**

Open your terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your JWT_SECRET.

Example output: `4f9b8c7e3d2a1b5c6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d`

---

### Step 5: Deploy! (Don't Click Yet)

**WAIT!** Before clicking "Create Web Service":
- ✅ We need to setup Neon database first
- ✅ Then come back and add the DATABASE_URL
- ✅ Then click "Create Web Service"

---

## 🗄️ Setup Neon Database First

### Step 1: Create Neon Account (2 minutes)

1. Go to: **https://neon.tech**
2. Click **"Sign up"**
3. Select **"Continue with GitHub"**
4. Authorize Neon
5. ✅ You're in!

---

### Step 2: Create Database Project (2 minutes)

1. Click **"Create a project"** or **"New Project"**
2. Fill in details:
   - **Project name:** `mining-erp-prod`
   - **Database name:** `mining_erp` (or leave default)
   - **Region:** Choose same as Render (e.g., US East, EU West)
   - **PostgreSQL version:** 16 (latest)
3. Click **"Create Project"**
4. Wait ~10 seconds for database to spin up

---

### Step 3: Get Connection String (1 minute)

After project is created:

1. You'll see a **"Connection Details"** panel
2. Look for **"Connection string"**
3. Select **"Prisma"** from the dropdown (important!)
4. Copy the connection string

It looks like:
```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

5. ✅ Save this - you'll need it for Render!

---

### Step 4: Enable Connection Pooling (Optional but Recommended)

1. In Neon dashboard, click **"Connection Pooling"**
2. Toggle **"Enable"**
3. Copy the **pooled connection string** instead
4. Use this in Render's DATABASE_URL

---

## 🔄 Back to Render - Complete Setup

Now that you have the Neon DATABASE_URL:

1. Go back to Render tab
2. Find **DATABASE_URL** environment variable
3. Paste your Neon connection string
4. Leave **FRONTEND_URL** empty for now (add after Vercel deploy)
5. Review all settings:
   - ✅ Root Directory: `dev/backend`
   - ✅ Build Command: `npm install && npm run build`
   - ✅ Start Command: `npm run start:prod`
   - ✅ All environment variables added
6. Click **"Create Web Service"**

---

## ⏱️ Deployment Process (5-8 minutes)

Render will now:
1. ✅ Clone your repo
2. ✅ Navigate to `dev/backend`
3. ✅ Install dependencies
4. ✅ Generate Prisma client
5. ✅ Build TypeScript code
6. ✅ Run database migrations (from start:prod script)
7. ✅ Start your server

**Watch the logs in real-time:**
- Click on your service
- You'll see the **"Logs"** tab with build progress
- Look for: `✅ Database connected` and `🚀 Backend server running`

---

## ✅ Verify Deployment

Once deployed, Render gives you a URL like:
```
https://mining-erp-backend.onrender.com
```

### Test the API:

Open browser and go to:
```
https://mining-erp-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Mining ERP Backend API is running"
}
```

✅ **Success!** Your backend is live!

---

## 📝 Important: Save Your URLs

Copy these for later use:

1. **Render Backend URL:**
   ```
   https://your-backend-name.onrender.com
   ```
   
2. **Neon Database URL:**
   ```
   postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
   ```

You'll need the Render URL for Vercel frontend deployment!

---

## 🚨 Troubleshooting

### Build Fails: "Cannot find package.json"
- ✅ Check Root Directory is set to `dev/backend`
- ✅ Not `backend` or `/dev/backend` (no leading slash)

### Build Fails: "Prisma migration failed"
- ✅ Check DATABASE_URL is correct
- ✅ Ensure Neon database is running
- ✅ Check for typos in connection string

### App Crashes: "Connection timeout"
- ✅ Add `?connection_limit=5` to end of DATABASE_URL
- ✅ Check Neon connection pooling is enabled

### Logs Show "Port 3001 already in use"
- ✅ Change PORT to `10000` in environment variables
- ✅ Render uses PORT=10000 by default

---

## 🎯 Next Steps After Backend Deploys

1. ✅ Copy your Render backend URL
2. ✅ Deploy frontend to Vercel (next guide)
3. ✅ Add Vercel URL to Render's FRONTEND_URL
4. ✅ Add Render URL to Vercel's NEXT_PUBLIC_API_URL
5. ✅ Test the complete app!

---

## 💰 Render Free Tier Limits

**What you get:**
- ✅ 750 hours/month (enough for 1 app running 24/7)
- ✅ 512MB RAM
- ✅ Shared CPU
- ✅ Auto-deploys on git push
- ✅ Free SSL certificate
- ✅ Custom domains

**Limitations:**
- ⚠️ Spins down after 15 min of inactivity
- ⚠️ Cold starts take 30-60 seconds
- ⚠️ Limited to 100GB bandwidth/month

**Upgrade to Starter ($7/mo) for:**
- ✅ No spin-down
- ✅ Faster performance
- ✅ More RAM (512MB → 2GB)

---

## 🔄 Auto-Deploy Setup

Render automatically deploys when you push to GitHub!

**Workflow:**
```
1. Make changes locally
2. git commit -m "your changes"
3. git push origin main
4. Render auto-detects → builds → deploys
5. Your app is updated!
```

---

## ⚙️ Render Dashboard Features

- **Logs** - Real-time application logs
- **Metrics** - CPU, memory, bandwidth usage
- **Environment** - Edit env variables
- **Settings** - Change build commands, auto-deploy settings
- **Shell** - Access to container shell (paid plans)

---

## 🎉 Summary Checklist

After successful deployment, you should have:

- [x] Render account created
- [x] Neon PostgreSQL database created
- [x] Backend deployed to Render
- [x] Health endpoint responding
- [x] Render URL saved
- [x] Ready to deploy frontend to Vercel!

---

## 📞 Support Resources

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Neon Docs:** https://neon.tech/docs
- **Your saved URLs:** Keep them in `notes/deployment-urls.md`

---

**Status:** Ready to deploy backend to Render!
**Next:** Deploy frontend to Vercel after backend is live.
