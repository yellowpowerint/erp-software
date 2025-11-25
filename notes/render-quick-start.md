# Render Deployment - Quick Start Checklist

## ✅ Quick Deployment Steps

### Part 1: Setup Neon Database (5 minutes)

1. **Go to Neon:** https://neon.tech
2. **Sign up** with GitHub
3. **Create project:** "mining-erp-prod"
4. **Copy connection string** (select "Prisma" format)
5. **Save it** - you'll need it next!

---

### Part 2: Deploy Backend on Render (5 minutes)

1. **Go to Render:** https://render.com
2. **Sign up** with GitHub
3. Click **"New +"** → **"Web Service"**
4. **Connect:** `webblabsorg/erp` repo

**Fill in these fields:**

| Field | Value |
|-------|-------|
| Name | `mining-erp-backend` |
| Root Directory | `dev/backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |

**Add Environment Variables:**

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<paste-your-neon-connection-string>
JWT_SECRET=<generate-with-command-below>
JWT_EXPIRATION=7d
FRONTEND_URL=https://your-app.vercel.app
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click **"Create Web Service"**
6. Wait 5-8 minutes for deployment
7. Test: `https://your-backend.onrender.com/api/health`

---

### Part 3: Deploy Frontend on Vercel (5 minutes)

1. **Go to Vercel:** https://vercel.com
2. **Sign up** with GitHub
3. **Import** `webblabsorg/erp` repo
4. **Settings:**
   - Root Directory: `dev/frontend`
   - Framework: Next.js (auto-detected)
   
**Add Environment Variable:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

5. Click **"Deploy"**
6. Wait 2-3 minutes
7. Test: Open your Vercel URL

---

### Part 4: Update Cross-References (2 minutes)

**Update Render Backend:**
1. Go to Render dashboard
2. Click your service → **"Environment"**
3. Edit **FRONTEND_URL** → Add your Vercel URL
4. Save (auto-redeploys)

---

## 🎯 That's It!

**Total Time:** ~20 minutes
**You now have:**
- ✅ PostgreSQL database (Neon)
- ✅ Backend API (Render)
- ✅ Frontend app (Vercel)
- ✅ Auto-deploys on git push

---

## 📝 Save Your URLs

**Backend:** https://your-backend.onrender.com
**Frontend:** https://your-app.vercel.app
**Database:** (saved in Render env vars)

---

## 🚀 Next: Build Authentication (Session 1.2)

Once deployed, proceed to:
- Login page
- JWT authentication
- User registration
- Role-based access control
