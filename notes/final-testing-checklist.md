# Mining ERP – Final Testing Checklist

**Purpose:** This checklist is used before major releases (e.g., Phase completion, go‑live) to verify that the Mining ERP system is functioning correctly across all modules and environments.

Use this together with:

- `docs/USER_GUIDE.md` – feature‑level behavior
- `docs/API_DOCUMENTATION.md` – endpoint reference
- `docs/DEVELOPER_GUIDE.md` – test commands and tooling
- Module‑specific guides in `notes/` (e.g., `inventory-testing-guide.md`)

---

## 1. Environment & Infrastructure

- [ ] **Environment variables** are correctly set in production for backend (Render) and frontend (Vercel).  
- [ ] **Database connection** (Neon) is healthy, and Prisma migrations are applied (`prisma migrate deploy`).  
- [ ] **Backend health endpoint** returns OK: `GET /api/health` on production backend.  
- [ ] **Frontend root page** loads without console errors.  
- [ ] Time, locale, and currency are correct for Ghana Cedis (₵).

---

## 2. Automated Tests (Local CI Gate)

Run locally or in CI before approving a release:

### Backend (NestJS – `dev/backend`)

- [ ] `npm test` – unit tests pass.  
- [ ] `npm run test:e2e` – E2E tests against test database pass.  
- [ ] `npm run test:cov` – coverage meets agreed thresholds.  
- [ ] `npm run lint` – no ESLint errors (auto‑fix applied where safe).

### Frontend (Next.js – `dev/frontend`)

- [ ] `npm test` – component tests pass.  
- [ ] `npm run lint` – lint passes with no errors.  
- [ ] `npm run build` – production build succeeds (optional but recommended before major releases).

Record any failures and resolutions in the release notes or completion report.

---

## 3. Authentication & Roles

For each key role (SUPER_ADMIN, CEO, CFO, DEPARTMENT_HEAD, OPERATIONS_MANAGER, PROCUREMENT_OFFICER, HR_MANAGER, SAFETY_OFFICER, WAREHOUSE_MANAGER, EMPLOYEE):

- [ ] Login works and redirects to the correct dashboard.  
- [ ] Navigation shows only the modules permitted for that role.  
- [ ] Restricted pages return a proper “Not authorized” state when accessed directly.  
- [ ] Password change / reset flow functions as documented.  
- [ ] Session handling (logout, token expiry) works as expected.

---

## 4. Core Business Modules

### Approvals & Workflows

- [ ] Submit an **invoice** and exercise the full approval chain (approve/reject, comments, audit log).  
- [ ] Submit a **purchase request**, confirm multi‑level approval and status updates.  
- [ ] Submit an **IT request**, verify routing to IT Manager and status transitions.  
- [ ] Submit a **payment request**, ensure approval history and financial linkage are correct.  
- [ ] Email/in‑app notifications fire where configured.

### Inventory & Assets

- [ ] Create, edit, and delete **stock items**; verify quantities and categories.  
- [ ] Perform **stock in**, **stock out**, and **transfer**; confirm movement logs and warehouse balances.  
- [ ] Low‑stock alerts trigger when quantity falls below threshold.  
- [ ] Create **equipment / asset** records, assign to projects, and schedule maintenance.  
- [ ] Depreciation and status changes reflect correctly in asset views.

### Operations & Projects

- [ ] Create and update **projects**, milestones, and tasks.  
- [ ] Log **daily production** and verify aggregation in operations dashboards.  
- [ ] Configure **shifts** and assign staff; confirm views reflect assignments.  
- [ ] Generate operations reports and export where supported.

### Finance & Procurement

- [ ] Create **suppliers**, quotations, and purchase orders.  
- [ ] Record **invoices**, **expenses**, and **payments**; verify ledger summaries.  
- [ ] Validate budget vs actual reports for at least one project/period.  
- [ ] Confirm currency formatting for ₵ across finance UI and reports.

### HR & Personnel

- [ ] Create and manage **employee profiles**.  
- [ ] Record **attendance** and **leave requests**; verify approvals and balances.  
- [ ] Record at least one **performance review** and ensure visibility to the right roles.  
- [ ] Validate HR reports for headcount, leave, and performance.

### Safety & Compliance

- [ ] Log a **safety incident** with attachments (if enabled) and confirm workflow.  
- [ ] Schedule and complete a **safety inspection**; verify checklists and results.  
- [ ] Record **training** and **certifications**; ensure expiries and reminders behave as expected.  
- [ ] Review safety dashboards and export reports where applicable.

---

## 5. AI Intelligence Layer

For each AI feature, verify that the API responds and UI displays meaningful output using realistic sample data (or seeded data):

- [ ] **Project Summary Engine** – `/ai/project-summary/:id` endpoint and UI page show health scores, risks, and recommendations.  
- [ ] **Procurement Advisor** – urgent purchases, supplier recommendations, and cost‑saving insights are displayed.  
- [ ] **Dashboard Insights** – AI dashboard aggregates system‑wide metrics without errors.  
- [ ] **Knowledge Engine** (if enabled) – document upload, search, and Q&A behave as described.  
- [ ] **Safety Assistant** – incident analysis and generated reports behave as expected.  
- [ ] **HR Assistant** – CV parsing, screening, and JD generation respond correctly.

If any AI feature is not enabled in the current deployment, record that explicitly in the release notes.

---

## 6. Reports & Analytics

- [ ] Dashboard cards load with correct aggregates for at least one realistic dataset.  
- [ ] Operational, financial, HR, and safety reports render for multiple date ranges.  
- [ ] Export (PDF/Excel where implemented) succeeds and files open without corruption.  
- [ ] Filters (date, project, department, warehouse, supplier, etc.) behave correctly.  
- [ ] No obvious performance issues when running heavy reports on typical data sizes.

---

## 7. Settings & Administration

- [ ] **Company profile** can be updated and reflected in UI.  
- [ ] **User management** (create, edit, deactivate) functions end‑to‑end.  
- [ ] **Role and permission** changes take effect after re‑login.  
- [ ] **Workflow configuration** changes are respected by new approval items.  
- [ ] **Notification settings** behave as described in documentation.  
- [ ] **Audit logs** capture key security and business events.

---

## 8. Non‑Functional Checks

- [ ] **Performance:** Core pages and APIs respond within documented targets under normal load.  
- [ ] **Security:** Only HTTPS is used in production; JWT secrets and DB credentials are in environment variables (not in logs or code).  
- [ ] **Access control:** Spot‑check that different roles cannot see or perform unauthorized actions.  
- [ ] **Error handling:** User‑facing errors are friendly; no raw stack traces are shown.  
- [ ] **Browser compatibility:** At least Chrome, Firefox, Edge (latest) are tested; optionally Safari.  
- [ ] **Responsiveness:** Key pages render correctly on desktop and common mobile/tablet breakpoints.

---

## 9. Sign‑Off

Before declaring a phase or release complete, ensure:

- [ ] All blocking issues from this checklist are resolved or accepted and recorded in `notes/known-issues-and-limitations.md`.  
- [ ] All automated tests listed above are green on the commit being deployed.  
- [ ] The project completion or release report has been updated with test results and any deviations.

Final sign‑off should be captured in `notes/project-completion-report.md` or the relevant phase completion report.
