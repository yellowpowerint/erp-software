# Connect Production Services - Final Steps

## 📋 Your Production URLs

**Frontend (Vercel):** https://erp-swart-psi.vercel.app/
**Backend (Render):** https://mining-erp-backend.onrender.com
**Database (Neon):** Connected ✅

---

## 🔗 Step 1: Connect Frontend to Backend (3 min)

### Add Backend URL to Vercel:

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. Click your project: **erp-swart-psi**
3. Click **"Settings"** tab
4. Click **"Environment Variables"** (left sidebar)
5. Click **"Add"** or **"Add Another"** button
6. **Add this variable:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://mining-erp-backend.onrender.com/api` |

7. Select environments: **Production, Preview, Development** (all three)
8. Click **"Save"**

---

## 🔄 Step 2: Redeploy Frontend (1 min)

After adding the environment variable:

1. Still in Vercel, click **"Deployments"** tab
2. Find your latest deployment (top of list)
3. Click the **"⋯"** (three dots menu) on the right
4. Click **"Redeploy"**
5. Confirm the redeploy
6. Wait 1-2 minutes for completion

---

## 🔗 Step 3: Update Backend with Frontend URL (2 min)

### Add Frontend URL to Render:

1. **Go to Render Dashboard:** https://dashboard.render.com
2. Click your backend service: **mining-erp-backend**
3. Click **"Environment"** tab (left sidebar)
4. Find **`FRONTEND_URL`** variable
5. **Update it to:** `https://erp-swart-psi.vercel.app`
6. Click **"Save Changes"**
7. Render will auto-redeploy (wait 1-2 minutes)

---

## ✅ Step 4: Test Your System! (5 min)

### Test 1: Backend Health Check
Open browser:
```
https://mining-erp-backend.onrender.com/api/health
```

**Expected result:**
```json
{
  "status": "ok",
  "message": "Mining ERP Backend API is running"
}
```

---

### Test 2: Create Test User

Use this curl command (or Postman):

```bash
curl -X POST https://mining-erp-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mining.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "CEO"
  }'
```

**Expected result:**
```json
{
  "user": {
    "id": "...",
    "email": "admin@mining.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "CEO",
    ...
  },
  "access_token": "eyJhbGc..."
}
```

**Alternative: Use Postman or browser console:**
```javascript
fetch('https://mining-erp-backend.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@mining.com',
    password: 'Admin@123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'CEO'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### Test 3: Test Login Flow

1. **Visit:** https://erp-swart-psi.vercel.app/
2. **Should redirect to:** `/login`
3. **Enter credentials:**
   - Email: `admin@mining.com`
   - Password: `Admin@123`
4. **Click "Sign in"**
5. **Should redirect to:** `/dashboard`
6. **Should see:**
   - Your name: "Admin User"
   - Role: "CEO"
   - Email displayed
   - Logout button
7. **Click "Logout"**
8. **Should redirect to:** `/login`

---

### Test 4: Protected Routes

1. **Without logging in, try to visit:**
   ```
   https://erp-swart-psi.vercel.app/dashboard
   ```
2. **Should automatically redirect to:** `/login`
3. **After logging in, visit:**
   ```
   https://erp-swart-psi.vercel.app/dashboard
   ```
4. **Should show dashboard** ✅

---

### Test 5: Session Persistence

1. **Login to dashboard**
2. **Refresh the page** (F5)
3. **Should stay logged in** ✅
4. **Close and reopen browser**
5. **Visit:** https://erp-swart-psi.vercel.app/
6. **Should go directly to dashboard** (still logged in) ✅

---

## 🚨 Troubleshooting

### Issue: "Network Error" on login
**Solution:**
- Check NEXT_PUBLIC_API_URL in Vercel is correct
- Ensure you redeployed frontend after adding env var
- Check browser console for CORS errors

### Issue: "Invalid credentials" immediately
**Solution:**
- Make sure user was created successfully
- Check email/password are correct
- Check backend logs in Render dashboard

### Issue: Redirects to login after successful login
**Solution:**
- Check backend JWT_SECRET is set in Render
- Check JWT token is being returned from backend
- Open browser console → Application → Local Storage
- Should see `token` and `user` entries

### Issue: CORS error in browser console
**Solution:**
- Check FRONTEND_URL is set correctly in Render
- Should be: `https://erp-swart-psi.vercel.app` (no trailing slash)
- Redeploy backend after updating

---

## 🎉 Success Criteria

After all tests pass, you should have:

- ✅ Backend responding to health checks
- ✅ Users can register via API
- ✅ Users can login via frontend
- ✅ Dashboard shows user info
- ✅ Logout works correctly
- ✅ Protected routes redirect to login
- ✅ Sessions persist on refresh
- ✅ No console errors
- ✅ CORS working correctly

---

## 📊 Your Complete System

```
┌─────────────────────────────────────────┐
│         USER'S BROWSER                  │
│  https://erp-swart-psi.vercel.app      │
└─────────────┬───────────────────────────┘
              │
              │ Frontend (Next.js)
              │ - Login page
              │ - Dashboard
              │ - Auth context
              │
              ↓
┌─────────────────────────────────────────┐
│       VERCEL (Frontend Host)            │
│  https://erp-swart-psi.vercel.app      │
└─────────────┬───────────────────────────┘
              │
              │ API calls with JWT
              │ NEXT_PUBLIC_API_URL
              │
              ↓
┌─────────────────────────────────────────┐
│     RENDER (Backend Host)               │
│  https://mining-erp-backend.onrender.com│
│  - Auth endpoints                       │
│  - JWT validation                       │
│  - User management                      │
└─────────────┬───────────────────────────┘
              │
              │ Database queries
              │ DATABASE_URL
              │
              ↓
┌─────────────────────────────────────────┐
│        NEON (Database)                  │
│  PostgreSQL Database                    │
│  - Users table                          │
│  - Auth data                            │
└─────────────────────────────────────────┘
```

---

## 🚀 After Connection Complete

Once everything works:

1. **Push Session 1.2 code to GitHub:**
   ```bash
   git commit -m "Session 1.2: Complete authentication system"
   git push origin main
   ```

2. **Ready for Session 2.1:**
   - Dashboard layout
   - Sidebar navigation
   - Role-based menus
   - User profile dropdown

---

## 📝 Quick Commands

### Create multiple test users:

```bash
# CEO
curl -X POST https://mining-erp-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ceo@test.com","password":"Test@123","firstName":"John","lastName":"CEO","role":"CEO"}'

# CFO
curl -X POST https://mining-erp-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"cfo@test.com","password":"Test@123","firstName":"Jane","lastName":"CFO","role":"CFO"}'

# Employee
curl -X POST https://mining-erp-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@test.com","password":"Test@123","firstName":"Bob","lastName":"Employee","role":"EMPLOYEE"}'
```

---

**Status:** Ready to connect services
**Time:** ~10 minutes total
**Next:** Test authentication and proceed to Session 2.1
