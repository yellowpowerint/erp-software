# Production URLs & Configuration

## 🌐 Live URLs

**Frontend (Vercel):**
https://erp-swart-psi.vercel.app/

**Backend (Render):**
<your-render-url-here>

**Database (Neon):**
postgresql://neondb_owner:***@ep-orange-morning-ad4s2uw2-pooler.c-2.us-east-1.aws.neon.tech/neondb

**GitHub Repository:**
https://github.com/webblabsorg/erp

---

## 🔐 Environment Variables Configuration

### **Backend (Render) - Environment Tab**

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://neondb_owner:npg_AC4Tr3DuRskH@ep-orange-morning-ad4s2uw2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
FRONTEND_URL=https://erp-swart-psi.vercel.app
JWT_SECRET=<your-generated-secret>
JWT_EXPIRATION=7d
```

### **Frontend (Vercel) - Environment Variables**

```bash
NEXT_PUBLIC_API_URL=<your-render-backend-url>/api
```

Example:
```bash
NEXT_PUBLIC_API_URL=https://mining-erp-backend.onrender.com/api
```

---

## ✅ Setup Checklist

- [x] Neon database created
- [x] Frontend deployed to Vercel
- [x] Backend deployed to Render
- [ ] DATABASE_URL added to Render
- [ ] FRONTEND_URL added to Render
- [ ] NEXT_PUBLIC_API_URL added to Vercel
- [ ] Health endpoint tested
- [ ] Frontend connects to backend

---

## 🧪 Testing Endpoints

### Health Check
```
GET https://<backend-url>/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Mining ERP Backend API is running"
}
```

### Frontend
```
https://erp-swart-psi.vercel.app/
```

Expected: "Mining ERP System - Setup complete"

---

## 📊 Connection Flow

```
User Browser
    ↓
https://erp-swart-psi.vercel.app (Frontend - Vercel)
    ↓
https://<backend-url>/api (Backend - Render)
    ↓
postgresql://ep-xxx.neon.tech (Database - Neon)
```

---

## 🔄 Auto-Deploy Workflow

```
1. Make code changes locally
2. git commit -m "your changes"
3. git push origin main
4. GitHub receives push
5. Render auto-deploys backend (if backend changes)
6. Vercel auto-deploys frontend (if frontend changes)
7. Changes live in ~2-5 minutes
```

---

**Last Updated:** Session 1.1 - Initial Deployment
**Status:** In Progress - Connecting services
