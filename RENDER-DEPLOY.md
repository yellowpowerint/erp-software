# Deploy Mining ERP to Render.com

**Domain:** https://erp.yellowpowerinternational.com  
**Time:** 30 minutes

---

## Step 1: Create PostgreSQL Database (5 min)

1. Login to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name:** `mining-erp-db`
   - **Database:** `mining_erp`
   - **Region:** Oregon (US West)
   - **Plan:** Starter ($7/month)
4. Click **Create Database**
5. Wait for status: **Available**
6. **Copy Internal Database URL** (starts with `postgresql://...@dpg-`)

---

## Step 2: Deploy Backend (10 min)

1. Click **New +** → **Web Service**
2. Connect GitHub: `yellowpowerint/erp-software`
3. Configure:
   - **Name:** `mining-erp-backend`
   - **Region:** Oregon (same as database)
   - **Branch:** `main`
   - **Root Directory:** `dev/backend`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** Starter ($7/month)

4. **Add Environment Variables:**
   ```
   DATABASE_URL=<PASTE_INTERNAL_DB_URL_FROM_STEP_1>
   DIRECT_URL=<PASTE_INTERNAL_DB_URL_FROM_STEP_1>
   PORT=10000
   NODE_ENV=production
   JWT_SECRET=<GENERATE_32_CHAR_SECRET>
   JWT_EXPIRATION=7d
   FRONTEND_URL=https://erp.yellowpowerinternational.com
   FRONTEND_URLS=https://erp.yellowpowerinternational.com
   STORAGE_PROVIDER=local
   LOCAL_STORAGE_PATH=./uploads
   ```

5. Click **Create Web Service**
6. Wait 5-10 minutes for deployment

---

## Step 3: Deploy Frontend (10 min)

1. Click **New +** → **Web Service**
2. Connect GitHub: `yellowpowerint/erp-software`
3. Configure:
   - **Name:** `mining-erp-frontend`
   - **Region:** Oregon (same as backend)
   - **Branch:** `main`
   - **Root Directory:** `dev/frontend`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter ($7/month)

4. **Add Environment Variables:**
   ```
   BACKEND_URL=https://erp.yellowpowerinternational.com
   NEXT_PUBLIC_API_URL=https://erp.yellowpowerinternational.com/api
   NODE_ENV=production
   ```

5. Click **Create Web Service**
6. Wait 5-10 minutes for deployment

---

## Step 4: Configure Custom Domain (5 min)

### For Frontend Service:
1. Go to frontend service → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter: `erp.yellowpowerinternational.com`
4. Render will show DNS instructions:
   ```
   Type: CNAME
   Name: erp
   Value: <your-service>.onrender.com
   ```
5. Add this CNAME record in your domain DNS settings (where yellowpowerinternational.com is hosted)
6. Wait 5-10 minutes for DNS propagation
7. SSL certificate will be auto-generated

---

## Step 5: Create Admin User (3 min)

1. Go to backend service → **Shell** → **Launch Shell**
2. Run:
   ```bash
   npx prisma studio
   ```
3. Create user:
   - **email:** admin@yellowpowerinternational.com
   - **password:** (hash with bcrypt, rounds=10)
   - **role:** SUPER_ADMIN
   - **status:** ACTIVE

Or use this script:
```bash
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const prisma = new PrismaClient();
  const password = await bcrypt.hash('Admin@123456', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@yellowpowerinternational.com',
      password,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      department: 'IT',
      position: 'Administrator'
    }
  });
  
  console.log('Admin created');
  await prisma.\$disconnect();
}

createAdmin();
"
```

---

## Step 6: Test Deployment (2 min)

1. Open: https://erp.yellowpowerinternational.com
2. Login with admin credentials
3. Verify dashboard loads
4. Test creating a record

---

## Generate JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Troubleshooting

### Backend won't start
```bash
# In backend Shell
npx prisma generate
npx prisma migrate deploy
```

### CORS errors
- Verify `FRONTEND_URL` in backend matches: `https://erp.yellowpowerinternational.com`
- Redeploy backend after updating

### Database connection fails
- Use Internal Database URL (not External)
- Check database status is "Available"

---

## Cost: $21/month
- Database: $7
- Backend: $7
- Frontend: $7

---

**Done!** Your ERP is live at https://erp.yellowpowerinternational.com
