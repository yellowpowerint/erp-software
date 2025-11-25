# Render Auto-Migration Setup

## How Migrations Work on Render (Free Tier)

Since the free tier doesn't have shell access, we've configured **automatic migrations on startup**.

### Configuration

**File:** `dev/backend/package.json`

```json
"start:prod": "prisma migrate deploy && node dist/main"
```

### What Happens on Every Deploy

1. **Build Phase:**
   - `npm install` - Installs dependencies
   - `prisma generate` - Generates Prisma client with latest models
   - `nest build` - Compiles TypeScript

2. **Start Phase:**
   - `prisma migrate deploy` - **Runs pending migrations automatically**
   - `node dist/main` - Starts the server

### Current Database Schema

**Tables Created by Migrations:**
- `users` - User authentication and profiles
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mappings
- `audit_logs` - Audit trail
- `invoices` - Invoice approval system (Session 3.1)
- `purchase_requests` - Purchase request approvals (Session 3.1)
- `approval_history` - Approval tracking (Session 3.1)

### Migration Files

Location: `dev/backend/prisma/migrations/`

1. `20251125000000_initial_setup/` - Initial user/auth tables
2. `20251125020000_add_approval_models/` - Approval system tables

### Checking if Migrations Ran

**Look for this in Render logs:**
```
Running prisma migrate deploy...
✓ Migrations applied successfully
🚀 Backend server running on port 10000
```

### If Migrations Don't Run

**Trigger a manual redeploy:**
1. Go to Render Dashboard
2. Open your backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Watch logs for migration success

### Verifying Tables Exist

**Option 1: Test via API**
- Try creating an invoice at `/api/approvals/invoices`
- If it works, tables exist ✅

**Option 2: Database Client (if you have DB credentials)**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Current Status

✅ **Migrations configured to run automatically**  
✅ **Build script generates Prisma client**  
✅ **Start script runs migrations before starting server**  
🔄 **Deploying now with logging improvements**

Once deployed, the approvals system should work immediately!
