# Session 1.2: Authentication System Implementation

## 🎯 Session Goals

Build a complete authentication system with:
- ✅ User registration
- ✅ User login with JWT
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control (12 roles)
- ✅ Protected routes
- ✅ Auth context/provider
- ✅ Login page (auth homepage - no landing page)
- ✅ Session management

---

## 📋 Implementation Plan

### **Part 1: Backend Authentication (40 min)**

#### 1. Auth Module Structure
- Create auth module
- Auth service
- Auth controller
- DTOs (Data Transfer Objects)

#### 2. JWT Implementation
- JWT strategy
- JWT guard
- Token generation
- Token validation

#### 3. Password Security
- Bcrypt hashing
- Password validation
- Salt generation

#### 4. Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me (get current user)
- POST /api/auth/logout

#### 5. RBAC Middleware
- Roles decorator
- Roles guard
- Permission checking

---

### **Part 2: Frontend Authentication (40 min)**

#### 6. Auth Context & Provider
- AuthContext creation
- AuthProvider component
- useAuth hook
- Token storage (localStorage)
- Auto-refresh logic

#### 7. Login Page
- Login form UI
- Form validation
- Error handling
- Loading states
- Redirect after login

#### 8. Protected Routes
- ProtectedRoute component
- Role-based route protection
- Redirect to login if not authenticated

#### 9. API Service
- Axios interceptors
- Token attachment
- Error handling
- Refresh token logic

---

### **Part 3: Testing & Integration (20 min)**

#### 10. Test Authentication Flow
- Register new user
- Login with credentials
- Access protected routes
- Token refresh
- Logout

---

## 🔐 User Roles (Already Defined in Schema)

1. SUPER_ADMIN
2. CEO
3. CFO
4. DEPARTMENT_HEAD
5. ACCOUNTANT
6. PROCUREMENT_OFFICER
7. OPERATIONS_MANAGER
8. IT_MANAGER
9. HR_MANAGER
10. SAFETY_OFFICER
11. WAREHOUSE_MANAGER
12. EMPLOYEE (default)

---

## 📁 Files to Create/Modify

### Backend (`dev/backend/src/`)
```
modules/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   └── users.service.ts
└── decorators/
    └── roles.decorator.ts
```

### Frontend (`dev/frontend/`)
```
app/
├── login/
│   └── page.tsx
├── dashboard/
│   └── page.tsx
components/
├── auth/
│   ├── LoginForm.tsx
│   └── ProtectedRoute.tsx
lib/
├── auth-context.tsx
├── api.ts
└── auth.ts
types/
└── auth.ts
```

---

## 🎨 Login Page Design

**Route:** `/login` (this will be your auth homepage)

**Features:**
- Company logo/branding
- Email input
- Password input
- "Remember me" checkbox
- Login button
- Error messages
- Loading state
- "Forgot password?" link (future)

**No registration page yet** - admins will create users

---

## 🔄 Authentication Flow

```
1. User visits app → Redirected to /login
2. User enters credentials
3. Frontend sends POST /api/auth/login
4. Backend validates credentials
5. Backend returns JWT token + user data
6. Frontend stores token in localStorage
7. Frontend redirects to /dashboard
8. Protected routes check token
9. Axios includes token in all requests
```

---

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with expiration (7 days)
- ✅ HTTP-only cookies option (optional)
- ✅ CORS protection
- ✅ Rate limiting (future)
- ✅ Token refresh (future enhancement)
- ✅ Logout invalidation

---

## 📊 Database Already Ready

From Session 1.1, we already have:
- ✅ User model with roles
- ✅ Permission model
- ✅ RolePermission model
- ✅ AuditLog model

No additional migrations needed!

---

## 🧪 Testing Checklist

After implementation:
- [ ] Register new user via API
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Access protected route without token (should redirect)
- [ ] Access protected route with token (should work)
- [ ] Token persists on page refresh
- [ ] Logout clears token
- [ ] Role-based access works

---

## 🎯 Session 1.2 Success Criteria

**Backend:**
- ✅ Auth endpoints working
- ✅ JWT generation/validation working
- ✅ Password hashing working
- ✅ Protected routes working

**Frontend:**
- ✅ Login page functional and styled
- ✅ Auth context managing state
- ✅ Protected routes redirecting
- ✅ Token stored and used
- ✅ User can login and access dashboard

**Integration:**
- ✅ Frontend can call backend auth endpoints
- ✅ Tokens work end-to-end
- ✅ Role-based access enforced

---

## 📝 Next Steps After Session 1.2

**Session 2.1:** Dashboard Layout & Sidebar
- Build dashboard page
- Implement left sidebar navigation
- Role-based menu visibility
- User profile dropdown

---

**Estimated Time:** 2-3 hours
**Status:** Ready to begin implementation
**Current:** Part 1 - Backend Authentication
