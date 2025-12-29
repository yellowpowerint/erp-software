# Mobile App Specification (React Native)

## Document Status
- **Owner**: Product + Engineering
- **Audience**: Product, Design, Mobile Engineering, Backend Engineering, QA, DevOps
- **Purpose of this doc**: Single source of truth for implementing the Mining ERP Mobile App in sequential phases.

## How to Use This Document
- **Build plan**: Use the “Development Phases (Sequential Sessions + Deliverables)” section as the backbone for implementation sessions.
- **Scope control**: Use “Non-Goals” and “Feature Coverage Matrix” to prevent scope creep.
- **Engineering alignment**: Use “Backend Integration” + “Web Dashboard (Configuration & Admin)” to track required backend/dashboard work.

## Table of Contents
- [Purpose](#purpose)
- [Goals](#goals)
- [Non-Goals (initial release)](#non-goals-initial-release)
- [Product Scope](#product-scope)
- [Feature Coverage Matrix (Web Dashboard -> Mobile App)](#feature-coverage-matrix-web-dashboard---mobile-app)
- [Mobile Information Architecture](#mobile-information-architecture)
- [Screen List (MVP → V1)](#screen-list-mvp--v1)
- [Detailed Screen Specifications (MVP)](#detailed-screen-specifications-mvp)
- [Wireframes (Text-Based)](#wireframes-text-based)
- [Backend Integration](#backend-integration)
- [Notifications (Push + In-App)](#notifications-push--in-app)
- [Web Dashboard (Configuration & Admin)](#web-dashboard-configuration--admin)
- [Technical Architecture (React Native)](#technical-architecture-react-native)
- [Development Phases (Sequential Sessions + Deliverables)](#development-phases-sequential-sessions--deliverables)
- [Testing Strategy](#testing-strategy)
- [App Store / Play Store Submission](#app-store--play-store-submission)
- [Open Questions (to finalize before implementation)](#open-questions-to-finalize-before-implementation)
- [Success Metrics](#success-metrics)

## Purpose
Build a first-party **mobile version of the Mining ERP** for **iOS and Android** using **React Native**, providing staff with on-the-go access to core workflows (approvals, requests, stock checks, incidents, tasks, documents, notifications) while keeping configuration and advanced admin functions in the existing **web dashboard**.

## Goals
- Provide a **fast, role-aware mobile experience** for daily operational work.
- **Reuse the existing backend APIs** and authentication model.
- Support **offline-first** patterns for field use (limited connectivity).
- Provide **push notifications** and deep links into relevant records.
- Keep **configuration and governance** in the web dashboard (Settings), with only essential preference controls on mobile.

## Non-Goals (initial release)
- Rebuilding every web page 1:1 in mobile.
- Complex admin screens for role management, migrations, or heavy reporting.
- Full document editing (mobile will focus on viewing, capture, upload, and workflow actions).

## Assumptions
- Mobile app users are **authenticated employees** (no anonymous usage).
- Mobile app will use the **same NestJS backend API** and the same RBAC rules as the web app.
- The web dashboard remains the **governance and configuration** surface; mobile remains operational.
- “Cover all ERP areas” means **at minimum**: read + action where applicable (approve, submit, confirm), not full admin CRUD for every table.

## Target Platforms & Devices
- **iOS**: current and previous major iOS versions (minimum defined during implementation).
- **Android**: API 26+ (minimum defined during implementation).
- Device classes:
  - Phone (primary)
  - Tablet (nice-to-have; responsive layouts)

## UX Principles
- **Fast path first**: approvals, tasks, incidents, stock checks.
- **Role-aware**: show only what you can act on.
- **Offline-capable where it matters**: incident capture, field reports, draft requests.
- **Consistent patterns**: list -> detail -> action; bottom sheets for quick actions.
- **Safe actions**: confirmations + audit trail expectations for approvals.

---

# Product Scope

## User Personas
- **Super Admin**: oversight; limited use on mobile; mainly approvals/monitoring.
- **Executive / Senior Management**: approve, review KPIs, view high-level dashboards.
- **Middle Management**: approve, monitor site operations, manage teams/tasks.
- **Junior Management / Officers**: create and process procurement/inventory workflows, update records.
- **Supervisors**: coordinate work, submit requests, record incidents, confirm receipts.
- **Field & Support Staff**: view assigned tasks, submit incident/maintenance requests, check notices.

## Supported Features by Area (Mobile)
The mobile app should cover **all ERP areas** at least at the “action + view” level, with admin/configuration staying in the web dashboard.

### Dashboard / Home
- Today summary: approvals pending, tasks due, inventory alerts, unread notifications.
- Quick actions: create requisition, record incident, scan/attach document, request maintenance.

### Notifications
- In-app notification inbox (from backend notifications module).
- Push notifications (via FCM/APNs).
- User channel preferences (lightweight) synced with backend preferences.

### Procurement
- View requisitions, RFQs, purchase orders, invoices (role-based).
- Approve/Reject flows.
- Submit requisition from mobile (simplified).

### Inventory / Warehouse
- Stock lookup (search + barcode/QR optional).
- Goods receiving confirmation (simplified).
- Low-stock alerts.

### Fleet / Maintenance
- View equipment list and status.
- Log maintenance request or fault report.
- View assigned maintenance tasks.

### HR
- Employee directory (limited fields by role).
- Leave requests (submit + approve).

### Safety
- Record incident (offline-capable), attach photos.
- View inspections/trainings schedule (view-focused).
- Emergency quick action.

### Projects / Work Orders
- View project list and status.
- Update progress notes (role-based).

### Documents / OCR
- View/download documents.
- Capture/upload photos or PDFs.
- OCR capture flow for receipts/invoices (where supported by backend).

### Reports
- Mobile-friendly KPI snapshots.
- Export-heavy and complex reports remain web-first.

### Settings (Mobile)
- Profile, password (if supported), notification preferences.
- App preferences: theme, language, biometric login.
- System configuration remains in **web dashboard**.

---

# Feature Coverage Matrix (Web Dashboard -> Mobile App)

The web dashboard’s sidebar (see `notes/menu-structure.md`) is the conceptual source-of-truth for modules. Mobile mirrors the same modules, but with a **mobile-appropriate surface area**.

| Web Module | Mobile (MVP) | Mobile (V1) | Notes |
|---|---:|---:|---|
| Dashboard | ✅ Widgets + quick actions | ✅ More KPI cards, drilldowns | Uses `GET /api/reports/dashboard` |
| Approvals & Workflows | ✅ My pending approvals + approve/reject/comment | ✅ History + filters by type | Must preserve audit trail expectations |
| Inventory & Assets | ✅ Search items + item detail | ✅ Scan barcode/QR + stock actions (role-based) | Warehouse focus |
| Operations | ✅ Projects list/detail (view) | ✅ Field reports + production capture | Offline drafts recommended |
| Finance & Procurement | ✅ Invoices/POs view + approve (role-based) | ✅ Create requisition + upload receipts | Heavy entry remains web-first |
| AI Insights | ✅ View summaries/recommendations | ✅ Q&A chat (if stable) | Watch cost + latency |
| HR & Personnel | ✅ Directory + leave requests | ✅ Attendance (if required) | Strict role-based field visibility |
| Safety & Compliance | ✅ Incident capture + photo upload | ✅ Inspections + training records | Offline-first |
| Reports & Analytics | ✅ KPI snapshots | ✅ More report filters | Export remains web-first |
| Settings | ✅ Profile + notifications + biometric + logout | ✅ Mobile feature flags awareness | Full settings remain web |

---

# Mobile Information Architecture

## Navigation Model
- **Bottom Tab Navigation** (primary) + **Stack** per tab.
- Tabs (suggested):
  - **Home**
  - **Work** (Tasks/Approvals)
  - **Modules** (Procurement/Inventory/Fleet/HR/Safety/Projects)
  - **Notifications**
  - **More** (Documents, Reports, Settings)

## Navigation Map (High-Level)
```
Auth Stack
  - Splash -> Login -> (MFA) -> (Biometric Setup)

Main Tabs
  - Home
  - Work
      - Approvals (List -> Detail -> Action)
      - Tasks (List -> Detail)
  - Modules
      - Inventory & Assets
      - Operations
      - Finance & Procurement
      - HR
      - Safety
      - AI Insights
  - Notifications
  - More
      - Documents
      - Reports
      - Settings
```

## Deep Linking (Required)
- Push notifications must open the correct record detail screen.
- Standard deep link scheme:
  - `miningerp://approvals/{id}`
  - `miningerp://inventory/items/{id}`
  - `miningerp://safety/incidents/{id}`
  - `miningerp://documents/{id}`
  - `miningerp://projects/{id}`

### Role-Based Tab/Module Visibility
- The mobile app must respect the same role/module access rules as web.
- The **web sidebar menu** remains the source-of-truth for modules; mobile will mirror it conceptually.

---

# Screen List (MVP → V1)

## A. Authentication & Onboarding
1. **Splash / Boot**
2. **Login**
3. **MFA (optional)**
4. **Biometric Enable Prompt** (optional)
5. **Organization/Environment Selection** (optional if multi-tenant later)

## B. Home
6. **Home Dashboard**
7. **Quick Actions Sheet**
8. **My KPIs** (lightweight)

## C. Work
9. **My Approvals (List)**
10. **Approval Detail** (approve/reject/comment)
11. **My Tasks (List)**
12. **Task Detail**

## D. Modules
13. **Modules Grid** (role-filtered)

### Procurement
14. **Requisitions List**
15. **Requisition Detail**
16. **New Requisition (Simplified)**
17. **Purchase Orders List**
18. **PO Detail**
19. **Invoices List**
20. **Invoice Detail**

### Inventory
21. **Stock Search**
22. **Item Detail**
23. **Receiving (Confirm)**

### Fleet
24. **Equipment List**
25. **Equipment Detail**
26. **Report Fault / Request Maintenance**

### HR
27. **Employee Directory**
28. **Employee Profile (Limited)**
29. **Leave Requests (My Requests)**
30. **Leave Approvals (Managers)**

### Safety
31. **Incident List**
32. **Incident Detail**
33. **New Incident (Offline Capable)**
34. **Safety Alerts**

### Projects
35. **Projects List**
36. **Project Detail**
37. **Project Update / Note**

## E. Notifications
38. **Notification Inbox**
39. **Notification Detail**

## F. Documents
40. **Documents List**
41. **Document Detail / Viewer**
42. **Upload / Capture Document**

## G. Reports
43. **KPI Snapshot**
44. **Report Viewer (Limited)**

## H. More / Settings
45. **Profile**
46. **Notification Preferences**
47. **Security (Biometric / Logout)**
48. **About / App Version / Support**

---

# Detailed Screen Specifications (MVP)

This section defines MVP screens as implementation-ready requirements. Each screen lists:
- **Primary roles**
- **Main actions**
- **Core data**
- **API dependencies** (existing or required)
- **Edge cases** (permissions, offline, conflicts)

## A1. Splash / Boot
- **Roles**: All
- **Actions**:
  - Load cached session
  - Fetch remote mobile config
  - Route to Login or Main Tabs
- **API**:
  - `GET /api/mobile/config` (recommended)
  - `GET /api/auth/me` (when token exists)
- **Edge cases**:
  - Force update required -> block app usage and show update prompt
  - Backend unavailable -> allow limited offline mode (only cached data) if user already signed in

## A2. Login
- **Roles**: All
- **Actions**:
  - Sign in
  - Enable biometric (optional)
- **API**:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/mobile/devices/register` (recommended; after push token is obtained)
- **Edge cases**:
  - Offline -> show offline banner; block sign-in
  - Invalid credentials -> standard error message

## B1. Home Dashboard
- **Roles**: All (content is role-filtered)
- **Actions**:
  - Open approvals/tasks from widgets
  - Open quick actions sheet
- **Core data**:
  - Pending approvals count
  - Tasks due today count
  - Inventory alerts count
  - Unread notifications count
  - Recent activity list (if available)
- **API**:
  - `GET /api/reports/dashboard`
  - Notification inbox endpoint (existing/required)

## B2. Quick Actions Sheet
- **Roles**: All (role-filtered actions)
- **Actions**:
  - New requisition (simplified)
  - New incident (offline capable)
  - Upload/capture document
  - Request maintenance/fault report
- **Edge cases**:
  - Disable actions via feature flags from `/api/mobile/config`

## C1. My Approvals (List)
- **Roles**: CEO, CFO, DEPARTMENT_HEAD, ACCOUNTANT, PROCUREMENT_OFFICER
- **Actions**:
  - Filter by type/status
  - Search by reference
  - Open detail
- **Core data**:
  - Reference, type, requester, amount (if relevant), submitted date, status
- **API**:
  - Approvals list endpoint (required if not implemented)
- **Edge cases**:
  - Permission changes mid-session -> show access revoked and refresh user session

## C2. Approval Detail
- **Roles**: Approver roles
- **Actions**:
  - Approve
  - Reject (requires reason)
  - Add comment
  - View attachments
- **Core data**:
  - Summary header + status
  - Line items (if relevant)
  - Audit trail summary (read-only)
- **API**:
  - Approval detail endpoint (required if not implemented)
  - Approve/reject endpoints (required if not implemented)
- **Edge cases**:
  - Conflict: already actioned -> show updated status + latest audit trail

## C3. My Tasks (List) + Task Detail
- **Roles**: All (role-filtered)
- **Actions**:
  - Filter by due date/status
  - Mark complete (if supported)
  - Add progress note (if supported)
- **API**:
  - Tasks endpoints (required if not implemented)

## D1. Modules Grid
- **Roles**: All (role-filtered)
- **Actions**:
  - Open a module
- **Rules**:
  - Must mirror allowed modules from the user’s role
  - Must hide modules disabled in system settings

## D2. Inventory: Stock Search
- **Roles**: WAREHOUSE_MANAGER, OPERATIONS_MANAGER, PROCUREMENT_OFFICER
- **Actions**:
  - Search by name/code
  - (V1) Scan barcode/QR
  - Open item detail
- **API**:
  - `GET /api/inventory/items`
- **Offline**:
  - Cache last searches + recently viewed items

## D3. Inventory: Receiving (Confirm)
- **Roles**: WAREHOUSE_MANAGER
- **Actions**:
  - Confirm received quantity
  - Attach delivery note photo
- **API**:
  - `POST /api/inventory/movements`
  - Upload endpoint (required if not implemented)

## E1. Safety: Incident List + Detail
- **Roles**: SAFETY_OFFICER, OPERATIONS_MANAGER (read), EMPLOYEE (own submissions)
- **Actions**:
  - View incident details
  - Add attachments (if permitted)
- **API**:
  - Safety incident endpoints (required if not implemented)

## E2. Safety: New Incident (Offline Capable)
- **Roles**: SAFETY_OFFICER, OPERATIONS_MANAGER, EMPLOYEE
- **Actions**:
  - Capture photos
  - Save offline draft
  - Submit when online
- **Core data**:
  - Type, severity, location, description, attachments
- **Offline**:
  - Queue submission; retry; show “pending upload” state

## F1. Documents: Upload / Capture
- **Roles**: All (permission gated)
- **Actions**:
  - Camera capture
  - Upload from device
  - Attach to a record (approval/expense/incident)
- **API**:
  - Upload endpoint (required if not implemented)

## H1. Settings
- **Roles**: All
- **Actions**:
  - Notification preferences
  - Biometrics on/off
  - Logout
- **API**:
  - `POST /api/mobile/devices/unregister` (recommended on logout)

---

# Wireframes (Text-Based)

## 1) Login
```
+--------------------------------+
|  Mining ERP                    |
|                                |
|  Email                         |
|  [________________________]    |
|                                |
|  Password                      |
|  [________________________]    |
|                                |
|  ( ) Remember me               |
|                                |
|  [  Sign In  ]                 |
|                                |
|  Forgot password?              |
+--------------------------------+
```

## 2) Home Dashboard
```
+--------------------------------+
|  Hello, <Name>      (Bell: 3)  |
|--------------------------------|
|  Approvals pending:  4         |
|  Tasks due today:    2         |
|  Inventory alerts:   1         |
|--------------------------------|
|  Quick Actions                 |
|  [Requisition] [Incident]      |
|  [Upload Doc ] [Maintenance]   |
|--------------------------------|
|  Recent Activity               |
|  - PO #123 approved            |
|  - Incident logged             |
+--------------------------------+
| Home | Work | Modules | Notif | More |
+--------------------------------+
```

## 3) Modules Grid
```
+--------------------------------+
| Modules                        |
|--------------------------------|
| [Procurement]  [Inventory]     |
| [Fleet]        [Safety]        |
| [HR]           [Projects]      |
| [Documents]    [Reports]       |
+--------------------------------+
```

## 4) List → Detail (Pattern)
**List**
```
+--------------------------------+
| Requisitions                   |
| [Search____________________]   |
|--------------------------------|
| #REQ-102   Pending Approval    |
| #REQ-103   Draft               |
| #REQ-104   Approved            |
+--------------------------------+
```

**Detail**
```
+--------------------------------+
| #REQ-102                       |
| Status: Pending Approval       |
| Requested by: <Name>           |
| Items:                         |
|  - Diesel x 1000L              |
|  - Gloves x 50                 |
|--------------------------------|
| [Approve]   [Reject]           |
| [Comment]   [View Attachments] |
+--------------------------------+
```

## 5) New Incident (Offline)
```
+--------------------------------+
| New Incident                   |
|--------------------------------|
| Type: [Dropdown v]             |
| Severity: [Low/Med/High v]     |
| Location: [GPS/Manual]         |
| Description                    |
| [__________________________]   |
| [__________________________]   |
| Photos: [+ Add]                |
|--------------------------------|
| [Save Offline]  [Submit Now]   |
+--------------------------------+
```

## 6) My Approvals (List)
```
+--------------------------------+
| My Approvals                   |
| [Filter v]  [Search________]   |
|--------------------------------|
| Invoice #INV-221   Pending     |
| Amount: ₵ 12,500               |
|--------------------------------|
| Purchase Req #PR-104 Pending   |
| Requested by: <Name>           |
|--------------------------------|
| IT Request #IT-09  Approved    |
+--------------------------------+
```

## 7) Approval Detail
```
+--------------------------------+
| Invoice #INV-221               |
| Status: Pending                |
| Requested by: <Name>           |
| Amount: ₵ 12,500               |
|--------------------------------|
| Attachments: [View]            |
| Comments:                      |
| [Add comment______________]    |
|--------------------------------|
| [Reject]              [Approve]|
+--------------------------------+
```

## 8) Inventory Search
```
+--------------------------------+
| Stock Search                   |
| [Search by name/code______]    |
| [Scan Barcode] (V1)            |
|--------------------------------|
| ITEM-001 Steel Rods   Qty: 100 |
| ITEM-014 Gloves       Qty: 25  |
| ITEM-020 Diesel (L)   Qty: 830 |
+--------------------------------+
```

---

# Backend Integration

## Authentication
- Use existing JWT auth flows.
- Store tokens securely:
  - iOS: Keychain
  - Android: Keystore
- Support refresh tokens if backend provides them; otherwise implement re-login flows.

## Known API Endpoints (from `docs/API_DOCUMENTATION.md`)
- Auth:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Reports:
  - `GET /api/reports/dashboard`
- Inventory:
  - `GET /api/inventory/items`
  - `POST /api/inventory/movements`
- Assets:
  - `GET /api/assets`
- Finance:
  - `GET /api/finance/budgets`
  - `POST /api/finance/expenses`
- HR:
  - `GET /api/hr/employees`
  - `POST /api/hr/leave-requests`
- Safety:
  - `GET /api/safety/inspections`
  - `POST /api/safety/inspections`
  - `POST /api/safety/trainings`
- Settings:
  - `GET /api/settings/config`
  - `PUT /api/settings/config`
  - `GET /api/settings/users`
  - `POST /api/settings/users`
  - `GET /api/settings/audit-logs`

## API Contract
- Mobile app consumes the same endpoints used by web.
- Required additions (if missing):
  - A stable `/me` endpoint returning user profile + role + permissions summary.
  - Pagination conventions for lists.
  - A push notification registration endpoint.

## Required Mobile-Specific Endpoints (Recommended)
- `GET /api/mobile/config`
  - Returns: minimum supported version, force update flag, feature flags, deep link settings.
- `POST /api/mobile/devices/register`
  - Registers device push token + platform + app version.
- `POST /api/mobile/devices/unregister`
  - Unregister device on logout.

## File Upload / Attachments
- The mobile app needs a stable upload flow that supports:
  - Large images (camera)
  - Poor connectivity (retry)
  - Returning a durable `fileUrl` or `fileId` for attachment references

## Data & Sync
- Local persistence with **SQLite** (or MMKV for key-value + SQLite for relational).
- Offline-first for:
  - Draft forms (incident, maintenance request)
  - Cached reference data (modules list, minimal user info)
  - Recently visited records

## Error Handling & Resilience
- Standardize server errors to the documented format (statusCode/message/details).
- Implement:
  - Global `401` handler (token expired -> logout or refresh)
  - Retry strategy for transient failures
  - User-friendly offline banner

---

# Notifications (Push + In-App)

## In-App
- Use existing Notifications module for inbox.

## Push
- Use **FCM** for Android and **APNs via FCM** for iOS (common single integration path).
- Device registration flow:
  - On login, register device token with backend.
  - Backend stores token by user/device.

## Notification Types (Initial)
- Approval assigned
- Approval status changed
- Task assigned
- Inventory low-stock alert
- Incident assigned/escalated
- System announcement

## Deep Link Payload
- Push payload should include:
  - `type`
  - `entityId`
  - `deepLink`

## Web Dashboard Integration
- Add/keep “Notification Providers Status” and test actions in web Settings.
- Web admins can enable/disable channels globally; users manage preferences on mobile.

---

# Web Dashboard (Configuration & Admin)

## System Configuration (Web)
The web dashboard remains the governance point for:
- Feature toggles / modules enablement
- Notifications provider status
- AI & Integrations settings
- Roles & access policies

## Mobile Configuration Hooks (Web)
Add a “Mobile App” section under Settings/System (or a dedicated Settings/Mobile page) for:
- Minimum supported app version (force update)
- Feature flags for mobile-only rollouts
- Push notification enablement
- Deep link routing rules

## Mobile App Admin Requirements (Web)
- **Mobile configuration**
  - Minimum iOS version, minimum Android version
  - Force update toggle (with message)
  - Feature flags (per module and per capability)
  - Maintenance mode toggle (blocks logins and key actions)
- **Push provider status**
  - FCM credentials present/valid
  - Test push to a selected user/device
- **Device inventory**
  - List devices per user (platform, last seen, app version)
  - Revoke device access (server-side invalidate token/device)
- **Release channels (optional)**
  - Internal testing vs production flags

---

# Technical Architecture (React Native)

## Recommended Stack
- **React Native** via **Expo (managed workflow)** unless native modules force bare workflow.
- Navigation: `@react-navigation/native`
- Networking: `axios` or `fetch` + interceptors
- State: `zustand` or `redux-toolkit` (keep simple)
- Server cache: `@tanstack/react-query`
- Forms: `react-hook-form`
- Validation: `zod`
- Local storage:
  - Secure: `expo-secure-store`
  - Cache: SQLite (expo-sqlite) + react-query persistence
- Push:
  - `expo-notifications` (Expo) or Firebase libs (bare)

## Observability (Recommended)
- Crash reporting: Sentry
- Analytics: basic event tracking (logins, approval actions, incident submissions)
- Logging:
  - redact tokens/PII
  - ship only error logs in production

## Build & Release (Recommended)
- Use Expo EAS:
  - EAS Build for iOS/Android
  - EAS Submit for store submissions
- Versioning:
  - Semantic versioning for app
  - Backend-enforced minimum versions via `GET /api/mobile/config`

## Environments
- Dev/Staging/Prod base URLs.
- Versioned config fetched from backend at boot.

---

# Security Requirements
- Token storage in secure enclave.
- Optional biometric gate for app unlock.
- Jailbreak/root detection (later).
- Certificate pinning (later, recommended).
- Audit logging for key actions (server-side).

---

# UX / Design System
- Match web branding (Yellow Power / Mining ERP).
- Mobile-first components: cards, list rows, bottom sheets.
- Accessibility: minimum 44px touch targets, dynamic font support.

---

# Development Phases (Sequential Sessions + Deliverables)

This roadmap is written as sequential sessions so every session ends with a testable increment.

## Mobile Phase M0 — Product & Technical Alignment (1–2 sessions)
- **Deliverables**
  - Confirm MVP scope using the Feature Coverage Matrix
  - Finalize navigation model + deep links
  - Identify backend gaps (approvals endpoints, uploads, device registration, mobile config)
  - Define offline rules (what is cached, what is queued)

## Phase 0 — Discovery & Alignment (1–2 sessions)
- **Deliverables**
  - Final scope for MVP
  - Confirm role-to-module access expectations
  - API gap list (backend changes needed)

## Phase 1 — Mobile Foundation (2–4 sessions)
- **Deliverables**
  - React Native app scaffold
  - Auth (login/logout), token storage
  - Navigation (tabs + stacks)
  - Base API client + error handling

### Session  — App Skeleton + Navigation
- **Deliverables**
  - Expo project scaffold + env configuration
  - Auth stack + main tabs scaffold
  - Shared UI primitives (buttons, inputs, list rows, cards)

### Session M1.2 — Auth + Secure Token Storage
- **Deliverables**
  - Login UI wired to `POST /api/auth/login`
  - Secure storage for access token
  - `GET /api/auth/me` session bootstrap

### Session M1.3 — Error Handling + Offline Banner
- **Deliverables**
  - Global API error normalization
  - `401` handling (logout/refresh strategy)
  - Offline banner + retry UX

### Session M1.4 — Mobile Config Gate
- **Deliverables**
  - Fetch `GET /api/mobile/config`
  - Force-update UX and feature flag gating

## Phase 2 — Home + Notifications (2–4 sessions)
- **Deliverables**
  - Home dashboard widgets
  - In-app notifications inbox
  - Push registration + deep links (if backend ready)

### Session M2.1 — Home Dashboard
- **Deliverables**
  - Home widgets powered by `GET /api/reports/dashboard`
  - Quick actions sheet skeleton

### Session M2.2 — In-App Notifications Inbox
- **Deliverables**
  - Inbox list + detail
  - Unread badge counts

### Session M2.3 — Push Registration + Device Management
- **Deliverables**
  - Obtain push token
  - Register device via `POST /api/mobile/devices/register`
  - Deep link open routing

### Session M2.4 — Notification Preferences
- **Deliverables**
  - Basic preferences UI
  - Persist preferences to backend (existing/required)

## Phase 3 — Approvals + Tasks (3–6 sessions)
- **Deliverables**
  - Approvals list/detail/actions
  - Task list/detail
  - Role-based visibility

### Session M3.1 — Approvals List
- **Deliverables**
  - Approvals list + filters + search
  - Role-based access enforcement

### Session M3.2 — Approval Detail + Actions
- **Deliverables**
  - Detail view + attachments
  - Approve/reject/comment actions
  - Conflict handling if already actioned

### Session M3.3 — Tasks List + Detail
- **Deliverables**
  - Tasks list + due filters
  - Task detail view

### Session M3.4 — Deep Links for Work Items
- **Deliverables**
  - Open from push to detail
  - Handle missing permissions gracefully

## Phase 4 — Core Modules MVP (6–12 sessions)
- **Deliverables**
  - Procurement (requisitions view + approve; create simplified)
  - Inventory (search + item detail)
  - Fleet (equipment list + maintenance request)
  - Safety (incident offline capture)

### Session M4.1 — Inventory Search + Item Detail
- **Deliverables**
  - Stock search UI powered by `GET /api/inventory/items`
  - Item detail UI

### Session M4.2 — Receiving (Confirm)
- **Deliverables**
  - Receiving confirm UI
  - Stock movement via `POST /api/inventory/movements`

### Session M4.3 — Safety: Incident Capture (Offline)
- **Deliverables**
  - Draft storage + submit queue
  - Photo capture + attachment upload

### Session M4.4 — HR: Directory + Leave Requests
- **Deliverables**
  - Directory powered by `GET /api/hr/employees` (role-limited fields)
  - Leave request submission via `POST /api/hr/leave-requests`

## Phase 5 — Documents + Capture (3–6 sessions)
- **Deliverables**
  - Document viewer
  - Upload/camera capture
  - Attachments to workflows

### Session M5.1 — Upload Pipeline
- **Deliverables**
  - Upload from camera/library
  - Retry for poor networks
  - Return `fileId`/`fileUrl` and attach to entities

### Session M5.2 — Document Viewer
- **Deliverables**
  - Document list + viewer
  - Download + share controls (role-based)

## Phase 6 — Hardening (3–8 sessions)
- **Deliverables**
  - Offline sync improvements
  - Performance + crash monitoring
  - Security enhancements

### Session M6.1 — Offline Robustness
- **Deliverables**
  - Queue inspection + retry UX
  - Conflict handling guidance for offline edits

### Session M6.2 — Monitoring + Performance
- **Deliverables**
  - Crash reporting integration
  - Performance baselines (startup time, home load)

## Phase 7 — Release & Store Submission (2–5 sessions)
- **Deliverables**
  - Store assets, privacy policies, support links
  - App Store submission
  - Play Store submission
  - Post-release monitoring and hotfix process

### Session M7.1 — Release Readiness
- **Deliverables**
  - Privacy policy + support URLs ready
  - Release checklist (permissions, notifications, login)

### Session M7.2 — iOS TestFlight + Submission
- **Deliverables**
  - TestFlight build
  - App Store metadata + screenshots
  - Submission and review fixes

### Session M7.3 — Play Store Tracks
- **Deliverables**
  - Internal testing -> closed -> production
  - Data safety + content rating forms

---

# Testing Strategy

## Automated
- Unit tests: business logic, utilities.
- Component tests: key UI flows.
- API contract tests (optional): mocked backend.

## Manual QA
- Device matrix:
  - iOS: last 2 major versions
  - Android: API 26+
- Connectivity matrix:
  - offline, 2G/3G, poor Wi-Fi

## UAT
- Pilot group by role:
  - supervisors + officers first
  - then management

---

# App Store / Play Store Submission

## Apple App Store
- Enroll Apple Developer Program.
- Create App ID, provisioning profiles.
- Prepare:
  - screenshots for required devices
  - privacy manifest / data collection disclosure
  - sign-in requirement compliance (SSO if needed)
- TestFlight beta.

## Google Play
- Create Play Console app.
- Upload AAB builds.
- Configure:
  - data safety form
  - content rating
  - internal testing track → closed testing → production

## Compliance & Policies
- Define data retention for:
  - cached data
  - logs
  - user-generated content
- Publish Privacy Policy and Terms.

---

# Open Questions (to finalize before implementation)
- Do you want **biometric login** required or optional?
- What are the **top 5 workflows** supervisors must complete on mobile?
- Which modules must be fully editable vs view-only in MVP?
- What push notification provider do you want to standardize on (FCM only, or separate APNs + FCM)?
- Do you need multi-site or multi-tenant support?

---

# Success Metrics
- % of approvals completed on mobile
- Crash-free sessions (99%+)
- Time-to-open app and load home (<2s on good network)
- Weekly active users by role
