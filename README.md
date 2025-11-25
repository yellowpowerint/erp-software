# Mining ERP System

**Integrated Mining ERP with AI Automation Platform**

A comprehensive Enterprise Resource Planning system designed specifically for mining companies, featuring workflow automation, inventory management, operations tracking, and AI-powered insights.

---

## 🚀 Quick Links

- **GitHub Repository:** https://github.com/webblabsorg/erp
- **Frontend (Vercel):** Coming soon
- **Backend API (Railway):** Coming soon
- **Documentation:** See `notes/` directory

---

## 📋 Project Overview

### **Purpose**
Replace paper-based approvals and manual tracking with a centralized, AI-powered ERP system for mining operations in Ghana.

### **Key Features**
- 🔐 Role-based authentication (12 user roles)
- ✅ Multi-level approval workflows
- 📦 Inventory & asset management
- 🏗️ Operations & project tracking
- 💰 Finance & procurement
- 🤖 AI intelligence layer (6 AI modules)
- 👥 HR & personnel management
- 🦺 Safety & compliance
- 📊 Advanced reporting & analytics

### **Currency**
Ghana Cedis (₵)

---

## 🏗️ Architecture

### **Frontend**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **Hosting:** Vercel

### **Backend**
- **Framework:** NestJS
- **Language:** TypeScript
- **ORM:** Prisma
- **Hosting:** Railway

### **Database**
- **Type:** PostgreSQL
- **Hosting:** Neon (Serverless)

### **AI Integration (Phase 7-8)**
- OpenAI/Claude API
- Vector Database (Pinecone/Qdrant)

---

## 📁 Project Structure

```
mining-erp/
├── notes/                              # 📚 All documentation
│   ├── mining-company-erp-system.md   # Project scope & requirements
│   ├── project-phases-plan.md         # 34-session development plan
│   ├── menu-structure.md              # Dashboard navigation details
│   ├── deployment-guide.md            # Deployment instructions
│   ├── quick-start-guide.md           # Local setup guide
│   └── session-*.md                   # Session completion reports
│
└── dev/                                # 💻 Development code
    ├── frontend/                       # Next.js application
    │   ├── app/                        # App router pages
    │   ├── components/                 # React components
    │   ├── lib/                        # Utilities
    │   ├── types/                      # TypeScript types
    │   └── hooks/                      # Custom hooks
    │
    ├── backend/                        # NestJS application
    │   ├── src/
    │   │   ├── modules/                # Feature modules
    │   │   ├── common/                 # Shared utilities
    │   │   └── main.ts                 # Entry point
    │   └── prisma/
    │       └── schema.prisma           # Database schema
    │
    └── README.md                       # Technical setup guide
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- PostgreSQL 14+ (or Neon account)
- npm or yarn

### **Local Development Setup**

See detailed instructions in:
- **`notes/quick-start-guide.md`** - Step-by-step local setup
- **`dev/README.md`** - Technical documentation

**Quick Start:**
```bash
# 1. Clone repository
git clone https://github.com/webblabsorg/erp.git
cd erp

# 2. Install dependencies
cd dev/frontend && npm install
cd ../backend && npm install

# 3. Setup database (see quick-start-guide.md)

# 4. Run development servers
# Terminal 1: Backend
cd dev/backend
npm run start:dev

# Terminal 2: Frontend
cd dev/frontend
npm run dev
```

### **Deployment**

See **`notes/deployment-guide.md`** for complete deployment instructions:
- Neon PostgreSQL setup
- Railway backend deployment
- Vercel frontend deployment
- Environment configuration

---

## 👥 User Roles

The system supports 12 distinct roles with granular permissions:

1. **SUPER_ADMIN** - Full system access
2. **CEO** - Executive oversight
3. **CFO** - Finance & approvals
4. **DEPARTMENT_HEAD** - Department management
5. **ACCOUNTANT** - Finance operations
6. **PROCUREMENT_OFFICER** - Procurement & vendors
7. **OPERATIONS_MANAGER** - Operations oversight
8. **IT_MANAGER** - System & IT management
9. **HR_MANAGER** - Human resources
10. **SAFETY_OFFICER** - Safety & compliance
11. **WAREHOUSE_MANAGER** - Inventory management
12. **EMPLOYEE** - Basic access

---

## 📊 Development Phases

### **Current Status: Phase 1, Session 1.1** ✅

The project follows a 14-phase, 34-session development plan:

**Phase 1-2:** Foundation (Auth + Dashboard)
**Phase 3-6:** Core Modules (Approvals, Inventory, Operations, Finance)
**Phase 7-8:** AI Intelligence Layer
**Phase 9-12:** Supporting Modules (HR, Safety, Reports, Settings)
**Phase 13-14:** Testing & Deployment

See **`notes/project-phases-plan.md`** for complete roadmap.

---

## 🎯 Module Overview

### **Core Modules**
1. **Approvals & Workflows** - Multi-level approval chains for invoices, purchases, IT requests
2. **Inventory & Assets** - Stock management, equipment tracking, multi-warehouse support
3. **Operations** - Projects, production logs, shift planning, field reports
4. **Finance & Procurement** - Invoices, POs, quotations, vendor management

### **AI Modules** (Phase 7-8)
1. **Project Summary Engine** - Automated weekly/monthly summaries
2. **Procurement Advisor** - Supplier recommendations, price anomaly detection
3. **Maintenance Predictor** - Predictive maintenance for heavy equipment
4. **Knowledge Engine** - Document Q&A with mining manuals/SOPs
5. **Safety Assistant** - Incident analysis and OSHA report generation
6. **HR Assistant** - CV screening, job description generation

### **Supporting Modules**
- HR & Personnel Management
- Safety & Compliance
- Reports & Analytics
- System Settings & Administration

---

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Audit logging for all actions
- HTTPS/SSL in production
- Environment variable protection

---

## 📚 Documentation

All documentation is in the **`notes/`** directory:

- **mining-company-erp-system.md** - Complete project scope
- **project-phases-plan.md** - Development roadmap
- **menu-structure.md** - Dashboard navigation
- **deployment-guide.md** - Production deployment
- **quick-start-guide.md** - Local setup
- **session-*.md** - Session completion reports

---

## 🤝 Contributing

This is a private project. Development follows the phased approach outlined in `project-phases-plan.md`.

---

## 📝 Technology Stack

**Frontend:**
- Next.js 14, React 18, TypeScript
- TailwindCSS, shadcn/ui, lucide-react
- Axios, React Context API

**Backend:**
- NestJS 10, TypeScript
- Prisma ORM, PostgreSQL
- Passport, JWT, bcrypt

**DevOps:**
- GitHub (Version Control)
- Vercel (Frontend Hosting)
- Railway (Backend Hosting)
- Neon (PostgreSQL Database)

**Future AI Stack:**
- OpenAI/Claude API
- Pinecone/Qdrant (Vector DB)
- Custom ML models

---

## 📞 Support

For issues or questions:
1. Check documentation in `notes/` directory
2. Review session completion reports
3. Check deployment guide for hosting issues

---

## 📄 License

Private & Proprietary

---

## 🎉 Milestones

- ✅ **Phase 1, Session 1.1** - Project foundation complete
- ⏳ **Phase 1, Session 1.2** - Authentication system (Next)
- ⏳ **Phase 2** - Dashboard & navigation
- ⏳ **Phase 3-6** - Core business modules
- ⏳ **Phase 7-8** - AI intelligence layer

---

**Built with ❤️ for Mining Operations**

**Organization:** webblabsorg
**Repository:** https://github.com/webblabsorg/erp
