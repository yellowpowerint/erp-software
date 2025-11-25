# Mining ERP - Quick Start Guide

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ npm or yarn package manager
- ✅ Git installed

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

**Note:** Due to network timeout during setup, you'll need to run these manually:

```bash
# Frontend dependencies
cd C:\Users\plange\Downloads\projects\mining-erp\dev\frontend
npm install

# Backend dependencies
cd C:\Users\plange\Downloads\projects\mining-erp\dev\backend
npm install
```

### Step 2: Setup PostgreSQL Database

```bash
# Option 1: Using psql
psql -U postgres
CREATE DATABASE mining_erp;
\q

# Option 2: Using pgAdmin
# Create new database named: mining_erp
```

### Step 3: Configure Environment Variables

The `.env` files are already created. Update them with your settings:

**Backend (.env):**
```bash
cd C:\Users\plange\Downloads\projects\mining-erp\dev\backend
notepad .env
```

Update the `DATABASE_URL` with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/mining_erp?schema=public"
```

**Frontend (.env.local):**
Already configured, no changes needed unless you change backend port.

### Step 4: Run Prisma Migrations

```bash
cd C:\Users\plange\Downloads\projects\mining-erp\dev\backend

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
# When prompted, enter migration name: "initial_setup"

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd C:\Users\plange\Downloads\projects\mining-erp\dev\backend
npm run start:dev
```

You should see:
```
✅ Database connected
🚀 Backend server running on http://localhost:3001/api
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\plange\Downloads\projects\mining-erp\dev\frontend
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
```

### Step 6: Verify Setup

1. **Backend Health Check:**
   Open browser: http://localhost:3001/api/health
   
   Should return:
   ```json
   {
     "status": "ok",
     "message": "Mining ERP Backend API is running"
   }
   ```

2. **Frontend:**
   Open browser: http://localhost:3000
   
   Should see: "Mining ERP System - Setup complete. Ready for authentication module."

---

## 🔍 Troubleshooting

### Issue: npm install fails
**Solution:**
- Check your internet connection
- Try: `npm install --legacy-peer-deps`
- Try: `npm cache clean --force` then `npm install`

### Issue: Database connection error
**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in backend/.env
- Ensure database 'mining_erp' exists
- Verify PostgreSQL credentials

### Issue: Prisma migration fails
**Solution:**
- Ensure database is empty or drop existing tables
- Delete `prisma/migrations` folder and retry
- Check DATABASE_URL format

### Issue: Port already in use
**Solution:**
- Backend (3001): Change `PORT` in backend/.env
- Frontend (3000): Use `npm run dev -- -p 3002`

### Issue: Module not found errors
**Solution:**
- Delete `node_modules` folders
- Delete `package-lock.json` files
- Run `npm install` again

---

## 📁 Project Structure Reference

```
mining-erp/
├── notes/                              # 📚 Documentation
│   ├── mining-company-erp-system.md   # Project scope
│   ├── project-phases-plan.md         # 34-session plan
│   ├── menu-structure.md              # Sidebar menu details
│   ├── session-1.1-completion.md      # Session reports
│   └── quick-start-guide.md           # This file
│
└── dev/                                # 💻 Development
    ├── frontend/                       # Next.js app
    │   ├── app/
    │   ├── components/
    │   ├── lib/
    │   ├── types/
    │   ├── hooks/
    │   └── package.json
    │
    ├── backend/                        # NestJS app
    │   ├── src/
    │   ├── prisma/
    │   └── package.json
    │
    └── README.md                       # Main README
```

---

## 🎯 Next Steps After Setup

Once everything is running:

1. **Review Documentation:**
   - Read `notes/project-phases-plan.md`
   - Review `notes/menu-structure.md`

2. **Prepare for Session 1.2:**
   - Authentication system implementation
   - Login page creation
   - JWT setup

3. **Optional: Explore Prisma Studio:**
   ```bash
   cd backend
   npm run prisma:studio
   ```
   Opens at: http://localhost:5555

---

## 🔐 Default Credentials (After Session 1.2)

After authentication is implemented, default admin user will be:
```
Email: admin@miningerp.com
Password: Admin@123
Role: SUPER_ADMIN
```

---

## 📞 Support

If you encounter issues:
1. Check troubleshooting section above
2. Review session completion reports in `notes/`
3. Verify all prerequisites are installed
4. Check console logs for error details

---

## ✅ Verification Checklist

Before proceeding to Session 1.2, ensure:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Frontend dependencies installed
- [ ] Backend dependencies installed
- [ ] Database created
- [ ] Prisma migrations run successfully
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Health check endpoint responds
- [ ] No console errors

---

**Status:** Ready for development
**Current Phase:** Phase 1, Session 1.1 Complete ✅
**Next Session:** Phase 1, Session 1.2 - Authentication System
