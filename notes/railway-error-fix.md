# Railway Error Fix: "Error creating build plan with Railpack"

## 🚨 Issue
Railway can't find the build configuration because it's looking at the repo root, but your code is in `dev/backend/`.

---

## ✅ Solution 1: Move railway.json to Root (Easiest)

Railway needs to see the configuration at the **repository root** first.

### Create this file at the ROOT:

**File:** `railway.json` (in the root, NOT in dev/backend)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd dev/backend && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd dev/backend && npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## ✅ Solution 2: Set Root Directory in Railway Settings

If you can find the root directory setting:

1. Go to your service → **Settings** tab
2. Find **"Root Directory"** field
3. Enter: `dev/backend`
4. Save and redeploy

**Then trigger a new deployment:**
- Go to **Deployments** tab
- Click **"Deploy"** button

---

## ✅ Solution 3: Configure via Service Settings (Manual)

If Railway isn't showing Root Directory field:

### Step 1: Go to Service Settings
1. Click your service card
2. Click **"Settings"** tab

### Step 2: Set Custom Build Command
Find **"Custom Build Command"** and enter:
```bash
cd dev/backend && npm install && npm run build
```

### Step 3: Set Custom Start Command
Find **"Custom Start Command"** and enter:
```bash
cd dev/backend && npm run start:prod
```

### Step 4: Redeploy
Click **"Deploy"** in the Deployments tab

---

## ✅ Solution 4: Use Railway CLI (Most Reliable)

If the UI is confusing, use Railway CLI:

```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Deploy with root directory specified
railway up --service backend --rootDir dev/backend
```

---

## ✅ Solution 5: Restructure for Railway (Alternative)

If nothing works, we can restructure slightly:

### Option A: Deploy Backend as Separate Repo
1. Create new repo: `webblabsorg/erp-backend`
2. Push only `dev/backend` contents there
3. Deploy that repo to Railway (no root dir needed)

### Option B: Move Backend to Root
Restructure to:
```
erp/
├── backend/           (moved from dev/backend)
├── frontend/          (moved from dev/frontend)  
└── notes/
```

Then set root to `backend` instead of `dev/backend`

---

## 🎯 Recommended Quick Fix

The **fastest solution** right now:

### Step 1: Create railway.json at repository root

I'll create this file for you. Then you need to:

```bash
cd C:\Users\Plange\Downloads\Projects\mining-erp

# Add the new railway.json
git add railway.json

# Commit
git commit -m "Add Railway config at root for deployment"

# Push
git push origin main
```

### Step 2: Trigger Redeploy in Railway
1. Go to Railway dashboard
2. Click **Deployments** tab
3. Railway should auto-deploy after the push
4. Or click **"Redeploy"** button

---

## 🔍 What Railway Needs

Railway's Nixpacks needs to find these at the root OR in the specified root directory:
- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ `nest-cli.json`

Since these are in `dev/backend/`, Railway is confused.

---

## 💡 Quick Check

Before trying solutions, check:

```bash
# What does Railway see at the root?
ls
# Should show: dev/, notes/, README.md, .gitignore

# What's in dev/backend?
ls dev/backend
# Should show: package.json, src/, prisma/, etc.
```

Railway is looking at the ROOT but your files are nested.

---

## 🆘 If Still Stuck

Tell me:
1. ✅ Can you see "Settings" tab in Railway?
2. ✅ What options are visible under Settings?
3. ✅ Do you see "Root Directory" or "Watch Paths"?

Then I'll give you exact instructions for your Railway version!

---

## 🚀 Alternative: Try Render Instead

If Railway is too complicated, **Render** is simpler:

1. Go to: https://render.com
2. Sign up with GitHub
3. New → Web Service
4. Select `webblabsorg/erp`
5. **Root Directory:** `dev/backend` (it has a clear field!)
6. **Build Command:** `npm install && npm run build`
7. **Start Command:** `npm run start:prod`
8. Deploy!

Render has a clearer UI for monorepos!
