# Mining ERP System

Integrated Mining ERP with AI Automation Platform

## 🏗️ Project Structure

```
mining-erp/
├── frontend/          # Next.js 14 + React + TypeScript
├── backend/           # NestJS + TypeScript + Prisma
└── README.md
```

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **State Management:** React Context API
- **HTTP Client:** Axios

### Backend
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + Passport
- **Password Hashing:** bcrypt

### Infrastructure
- **Currency:** Ghana Cedis (₵)
- **AI Integration:** OpenAI/Claude API (Phase 7-8)
- **Vector DB:** Pinecone/Qdrant (Phase 7-8)

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 2. Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE mining_erp;
```

2. Update `backend/.env` with your database credentials

3. Run Prisma migrations:
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### 3. Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Backend (.env):**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/mining_erp?schema=public"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d
```

### 4. Run Development Servers

**Backend:**
```bash
cd backend
npm run start:dev
```
Server will run on: http://localhost:3001

**Frontend:**
```bash
cd frontend
npm run dev
```
Application will run on: http://localhost:3000

## 🔐 User Roles

The system supports the following user roles:
- **SUPER_ADMIN** - Full system access
- **CEO** - Executive access
- **CFO** - Finance & executive access
- **DEPARTMENT_HEAD** - Department management
- **ACCOUNTANT** - Finance operations
- **PROCUREMENT_OFFICER** - Procurement management
- **OPERATIONS_MANAGER** - Operations oversight
- **IT_MANAGER** - IT & system management
- **HR_MANAGER** - HR operations
- **SAFETY_OFFICER** - Safety & compliance
- **WAREHOUSE_MANAGER** - Inventory management
- **EMPLOYEE** - Basic access

## 📚 Project Phases

See `../notes/project-phases-plan.md` for detailed development phases and sessions.

### Current Status: Phase 1, Session 1.1 ✅
- ✅ Project structure created
- ✅ Frontend (Next.js) initialized
- ✅ Backend (NestJS) initialized
- ✅ Database schema defined
- ✅ Environment configuration completed

### Next: Phase 1, Session 1.2
- Authentication system implementation
- Login page UI
- Role-based access control

## 🎯 Key Features (Planned)

### Phase 1-2: Foundation
- Authentication & Authorization
- Dashboard with role-based navigation
- User management

### Phase 3-6: Core Modules
- Approvals & Workflows
- Inventory & Asset Management
- Operations & Projects
- Finance & Procurement

### Phase 7-8: AI Intelligence
- Project Summary Engine
- Procurement Advisor
- Maintenance Predictor
- Mining Knowledge Q&A
- Safety Assistant
- HR Assistant

### Phase 9-12: Supporting Modules
- HR & Personnel Management
- Safety & Compliance
- Reports & Analytics
- System Settings & Administration

## 📖 Documentation

All project documentation is stored in `../notes/` directory:
- `mining-company-erp-system.md` - Project scope & requirements
- `project-phases-plan.md` - Detailed development phases
- `session-1.1-completion.md` - Session completion reports

## 🔒 Security Notes

- Never commit `.env` files to Git
- Change default JWT_SECRET in production
- Use strong passwords for database
- Enable SSL/HTTPS in production
- Regular security audits recommended

## 🤝 Contributing

This is a private project. Development follows the phased approach outlined in the project plan.

## 📝 License

Private & Proprietary
