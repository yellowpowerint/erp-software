# Mining ERP System – Project Handover

**Project:** Mining ERP (Integrated Mining ERP with AI Automation Platform)  
**Version:** 1.0.0  
**Date:** November 26, 2025  
**Primary Stack:** Next.js 15 · NestJS 10 · PostgreSQL 15 · Prisma · TailwindCSS · shadcn/ui

---

## 1. Purpose of This Document

This handover document gives a new developer / DevOps engineer everything needed to operate, maintain, and extend the Mining ERP system after Phase 14.3.

It should be read together with:

- `docs/USER_GUIDE.md` – end‑user functionality
- `docs/DEVELOPER_GUIDE.md` – day‑to‑day development
- `docs/API_DOCUMENTATION.md` – backend API reference
- `docs/DEPLOYMENT_GUIDE.md` and `notes/deployment-guide.md` – deployment details
- `notes/production-urls.md` – live URLs and environment configuration
- `notes/known-issues-and-limitations.md` – current constraints
- `notes/final-testing-checklist.md` – pre‑release testing

---

## 2. System Overview

Mining ERP is a full‑stack web application for mining companies, covering:

- Authentication & RBAC (12 roles)
- Approvals & workflows
- Inventory & warehouses
- Assets & maintenance
- Operations & projects
- Finance & procurement
- HR & personnel
- Safety & compliance
- Reports & analytics
- AI intelligence layer (6 AI modules)

The system is currently **production‑ready (Phase 13 complete)** with **Phase 14 (documentation & handover) now finalized**.

---

## 3. Architecture & Repositories

- **Monorepo Root:** `mining-erp/`
- **Frontend:** `dev/frontend` (Next.js App Router, TypeScript)
- **Backend:** `dev/backend` (NestJS, TypeScript, Prisma)
- **Database:** PostgreSQL (Neon in production)
- **Docs & Notes:**
  - `docs/` – final user/admin/dev docs
  - `notes/` – internal notes, completion reports, deployment history

**GitHub Repository:** `https://github.com/webblabsorg/erp`  
**Default Branch:** `main`

Branching and commit conventions are documented in `docs/DEVELOPER_GUIDE.md`.

---

## 4. Environments & URLs

Production environment has been deployed and verified:

- **Frontend (Vercel):** `https://erp-swart-psi.vercel.app/`
- **Backend (Render):** `https://mining-erp-backend.onrender.com`
- **Backend Health Check:** `https://mining-erp-backend.onrender.com/api/health`
- **Database (Neon):** see `notes/production-urls.md` for the full connection string

When changing any production URL or database:

1. Update environment variables in Render and Vercel (see deployment guides).  
2. Update `notes/production-urls.md` to reflect changes.  
3. Re‑run the health check and core smoke tests from `notes/final-testing-checklist.md`.

---

## 5. Local Development & Tooling

**Backend (NestJS):**

- Location: `dev/backend`
- Key commands:
  - `npm install`
  - `npm run start:dev` – dev API server on `http://localhost:3001`
  - `npm run lint` – ESLint (fixes enabled)
  - `npm test`, `npm run test:e2e`, `npm run test:cov` – Jest test suites

**Frontend (Next.js):**

- Location: `dev/frontend`
- Key commands:
  - `npm install`
  - `npm run dev` – dev app on `http://localhost:3000`
  - `npm run lint` – Next.js lint
  - `npm test` – Jest + React Testing Library

Environment variables for local setup are described in `docs/DEVELOPER_GUIDE.md` and `notes/deployment-guide.md`.

---

## 6. Deployment & CI/CD

Recommended production stack:

- **Frontend:** Vercel (Next.js project, root `dev/frontend`)
- **Backend:** Render (NestJS service, root `dev/backend`)
- **Database:** Neon PostgreSQL

Key references:

- `docs/DEPLOYMENT_GUIDE.md` – generic deployment options (Render, Railway, Docker, self‑hosted)
- `notes/deployment-summary.md` and `notes/deployment-complete-next-steps.md` – historical deployment decisions
- `notes/railway-deployment-steps.md` and `notes/render-deployment-guide.md` – platform‑specific steps

Deployment is currently triggered manually via the hosting dashboards after pushing to `main`. GitHub Actions configuration examples are included in `docs/DEVELOPER_GUIDE.md` under CI/CD.

---

## 7. Operational Responsibilities

For ongoing operations, the receiving team should own:

1. **Environment Management** – keeping `.env` values in Render/Vercel up to date, rotating secrets, and ensuring no secrets are committed to Git.  
2. **Database Maintenance** – applying Prisma migrations, monitoring performance, and ensuring backups are configured in Neon.  
3. **Monitoring & Alerts** – configuring uptime checks (health endpoint), log monitoring, and alerting for failures.  
4. **User Management** – creating admin and role accounts via the UI or seed scripts.  
5. **Release Management** – following the testing checklist prior to each production deployment.

Detailed runbook items (e.g., backup/restore, log inspection) are covered in the deployment and developer guides.

---

## 8. Testing & Quality Gates

Before any production release, the following should be enforced:

- Backend: `npm test`, `npm run test:e2e`, `npm run lint` in `dev/backend`
- Frontend: `npm test`, `npm run lint`, optional build in `dev/frontend`
- Manual regression and smoke tests using `notes/final-testing-checklist.md`

Testing strategy, fixtures, and coverage expectations are described in:

- `docs/DEVELOPER_GUIDE.md` – testing section
- `notes/inventory-testing-guide.md` and `notes/session-3.3b-testing-guide.md` – module‑specific guides

---

## 9. Known Issues & Limitations

High‑level limitations are summarized in:

- `docs/README.md` → **Known Limitations** section
- `notes/known-issues-and-limitations.md` – consolidated list for this handover

Before extending the system (e.g., offline mode, real‑time collaboration, file uploads >5MB), review these documents so product and engineering share the same expectations.

---

## 10. Recommended Next Steps for New Owners

1. Read `docs/USER_GUIDE.md` and log in to the live system using a test account.  
2. Read `docs/DEVELOPER_GUIDE.md` and run the app locally (frontend + backend + database).  
3. Run through `notes/final-testing-checklist.md` against production to confirm baseline behavior.  
4. Review `notes/known-issues-and-limitations.md` and plan any follow‑up work.  
5. Set up monitoring, backups, and alerting for production if not already in place.

Once these steps are complete, the new team should be in a strong position to safely maintain and evolve the Mining ERP system.
