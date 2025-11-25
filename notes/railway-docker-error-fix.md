# Railway Docker Error Fix: npm command not found

## 🚨 Issue
Railway is trying to use Docker instead of Nixpacks, and the Docker image doesn't have Node.js/npm installed.

---

## ✅ Solution: Use Nixpacks Configuration

I've created two files to fix this:

### 1. `nixpacks.toml` (at root)
This tells Railway/Nixpacks exactly how to build your app:
- Install Node.js 18
- Navigate to `dev/backend`
- Install dependencies
- Build the app
- Start the server

### 2. Updated `railway.json`
Simplified to just specify Nixpacks builder.

---

## 📋 Push the Fix

Run these commands:

```bash
cd C:\Users\Plange\Downloads\Projects\mining-erp

# Add new files
git add nixpacks.toml railway.json

# Commit
git commit -m "Fix Railway build: add Nixpacks config"

# Push
git push origin main
```

---

## 🔄 Alternative Solution 1: Delete Dockerfile

Railway might be detecting the Dockerfile we created and trying to use it instead of Nixpacks.

### Remove the Dockerfile:
```bash
cd C:\Users\Plange\Downloads\Projects\mining-erp

# Delete the Dockerfile
git rm dev/backend/Dockerfile

# Commit
git commit -m "Remove Dockerfile - use Nixpacks instead"

# Push
git push origin main
```

---

## 🔄 Alternative Solution 2: Use the Dockerfile Properly

If you want to use Docker, update the Dockerfile to work with monorepo:

**File:** `Dockerfile` (at repository root, not in dev/backend)

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY dev/backend/package*.json ./
COPY dev/backend/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend source
COPY dev/backend ./

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY dev/backend/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy Prisma schema
COPY dev/backend/prisma ./prisma/

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "run", "start:prod"]
```

---

## 🎯 Recommended Approach (Easiest)

**Option A: Use Nixpacks (Easiest)**
1. Push the `nixpacks.toml` I created
2. Remove/rename the Dockerfile so Railway doesn't detect it
3. Let Railway use Nixpacks

**Option B: Use Render Instead**
Render handles monorepos better with clearer settings:
1. Go to https://render.com
2. Clear "Root Directory" field: `dev/backend`
3. No Docker/Nixpacks confusion

**Option C: Restructure Repository**
Move backend to root level:
```
erp/
├── backend/        (moved from dev/backend)
├── frontend/       (keep in subfolder)
└── notes/
```

---

## 🚀 Quick Fix Commands

Try this in order:

### Step 1: Push Nixpacks config
```bash
git add nixpacks.toml railway.json
git commit -m "Fix Railway: add Nixpacks config"
git push origin main
```

### Step 2: Remove Dockerfile if needed
```bash
git rm dev/backend/Dockerfile
git commit -m "Remove Dockerfile for Railway Nixpacks"
git push origin main
```

### Step 3: Force Railway to use Nixpacks
In Railway dashboard:
1. Click your service
2. Settings tab
3. Find "Builder" or similar setting
4. Select "Nixpacks" (not Docker)

---

## 🔍 What's Happening

Railway build process:
1. ✅ Detects your repo
2. ❌ Sees Dockerfile → tries Docker build
3. ❌ Docker image has no Node.js → fails
4. ✅ With nixpacks.toml → uses Nixpacks → includes Node.js → works!

---

## 💡 Why This Happened

The Dockerfile I created earlier was meant for manual Docker builds, not for Railway's automatic detection. Railway saw it and tried to use it, but it wasn't configured for the monorepo structure from the root.

---

## ✅ After the Fix

Railway will:
1. Read `nixpacks.toml`
2. Install Node.js 18
3. Navigate to `dev/backend`
4. Install dependencies
5. Build your app
6. Start the server
7. ✅ Success!

---

## 🆘 If Still Failing

Try **Render.com** instead - it's clearer for monorepos:
- Explicit "Root Directory" field
- No builder confusion
- Easier environment variable management
- Free tier available

Link: https://render.com
