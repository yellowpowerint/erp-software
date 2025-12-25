# Mining ERP Mobile App — Development Phases & Sessions (React Native)

## Purpose
This document defines the **session-by-session procedure** to develop the Mining ERP **iOS + Android** mobile app using **React Native (Expo)**.

- This plan is derived from `notes/mobile-app.md` and is intended to be used as the **execution roadmap**.
- The web dashboard remains the **governance/configuration** surface; mobile remains **operational**.

## How to Use This Plan
- Each session ends with a **demoable increment**.
- Each session includes:
  - **Scope** (what you implement)
  - **Dependencies** (backend/dashboard prerequisites)
  - **Deliverables** (what must exist by end of session)
  - **Definition of Done (DoD)** (acceptance checklist)

## Global Preconditions (Before Session M0.1)
- **Decisions**
  - Expo managed workflow (default)
  - Push provider strategy: **FCM (Android) + APNs via FCM (iOS)**
  - Minimum OS targets (iOS + Android API levels)
- **Accounts**
  - Apple Developer Program access
  - Google Play Console access
  - Firebase project for push
- **Environments**
  - Dev/Staging/Prod API base URLs
  - JWT auth available (already in API docs)

## Cross-Cutting Standards (Apply to all sessions)
- **RBAC**: Mobile must enforce role/module access consistent with the ERP.
- **Deep linking**: Use the scheme defined in `mobile-app.md` (e.g., `miningerp://approvals/{id}`).
- **Error handling**: Standardize around the API error format (statusCode/message/details).
- **Offline rules**:
  - Offline allowed only where explicitly stated (incidents, drafts, cached browsing).
  - Offline writes must be queued and retryable.
- **No hidden scope**: If a backend endpoint is missing, log it as a deliverable for that session.

---

# Phase M0 — Product & Technical Alignment (1–2 sessions)

## Session M0.1 — MVP Scope Lock + UX Map
- **Scope**
  - Confirm MVP vs V1 using the Feature Coverage Matrix.
  - Confirm role priority flows (executives, procurement, warehouse, safety, employee).
  - Freeze navigation map (tabs + stacks).
- **Deliverables**
  - Final MVP scope list
  - Final mobile navigation map + deep link map
  - List of top workflows per role
- **DoD**
  - MVP scope approved by stakeholders
  - Each MVP screen has an owner (mobile/backend/dashboard)
  - Deep link routes confirmed for all notification types

## Session M0.2 — Backend & Dashboard Readiness Plan
- **Scope**
  - Confirm required mobile endpoints:
    - `GET /api/mobile/config`
    - `POST /api/mobile/devices/register`
    - `POST /api/mobile/devices/unregister`
    - Upload endpoint (if missing)
  - Confirm web dashboard “Mobile App” settings requirements.
- **Deliverables**
  - API gap list (by module)
  - Dashboard config gap list (Mobile App admin page requirements)
  - Offline queue strategy decision (SQLite schema + queue states)
- **DoD**
  - Clear list of endpoints to build (with owners)
  - Agreement on config payload contract for `/api/mobile/config`

---

# Phase M1 — Mobile Foundation (4 sessions)

## Session M1.1 — App Skeleton + Navigation
- **Scope**
  - Create Expo RN project
  - Setup navigation: Auth stack + Main tabs
  - Setup app structure (screens, components, services)
- **Dependencies**
  - None
- **Deliverables**
  - Running app on iOS simulator and Android emulator
  - Tab navigation scaffold (Home/Work/Modules/Notifications/More)
  - Shared UI primitives: buttons, inputs, list rows, cards
- **DoD**
  - CI-friendly build (dev) passes
  - Basic lint/type-check (if configured) passes

## Session M1.2 — Auth + Secure Token Storage
- **Scope**
  - Implement Login screen
  - Store token securely
  - Bootstrap session via `GET /api/auth/me`
- **Dependencies**
  - `POST /api/auth/login`, `GET /api/auth/me`
- **Deliverables**
  - Login flow working end-to-end
  - Logout flow
- **DoD**
  - Token stored in secure storage
  - App restarts and restores session correctly
  - Unauthorized routes redirect to Login

## Session M1.3 — API Client + Error Handling + Offline Banner
- **Scope**
  - Create API client with interceptors
  - Standardize error parsing
  - Add offline banner + retry UX
- **Deliverables**
  - Global error toast/banner patterns
  - Standard `401` handling strategy implemented
- **DoD**
  - Offline mode visibly indicated
  - API failures show actionable messaging

## Session M1.4 — Mobile Config Gate (Force Update + Feature Flags)
- **Scope**
  - Fetch `GET /api/mobile/config` on boot
  - Enforce min versions / force update
  - Feature flag gating in UI
- **Dependencies**
  - `GET /api/mobile/config` available (or mocked for MVP)
- **Deliverables**
  - Config-driven gating for modules/actions
- **DoD**
  - Force-update blocks usage with clear CTA
  - Disabled features do not appear in UI

---

# Phase M2 — Home + Notifications (4 sessions)

## Session M2.1 — Home Dashboard
- **Scope**
  - Implement Home widgets + quick actions sheet
- **Dependencies**
  - `GET /api/reports/dashboard`
- **Deliverables**
  - Home dashboard renders role-appropriate cards
  - Quick actions sheet UI
- **DoD**
  - Home loads within acceptable time on good network
  - Widgets navigate to correct lists

**Status**: COMPLETE

**Implementation Notes (M2.1)**
- Mobile Home uses `GET /api/reports/dashboard` and renders role-appropriate widget cards.
- Each widget navigates to a working list screen (Inventory/Assets/Projects/Expenses/Employees/Safety).
- Quick actions sheet is implemented and includes “Open {widget}” actions + Logout.

**Acceptance Checklist (M2.1)**
- [x] Home dashboard renders role-appropriate cards
- [x] Quick actions sheet UI present and functional
- [x] Home loads within acceptable time on good network
- [x] Widgets navigate to correct lists

## Session M2.2 — In-App Notification Inbox
- **Scope**
  - Implement notifications list + detail
  - Unread state + badge count (if available)
- **Dependencies**
  - Notifications endpoints (existing/required)
- **Deliverables**
  - Notification inbox tab functional
- **DoD**
  - Notifications open correct detail screens

**Status:** COMPLETE

**Implementation Notes (M2.2)**
- Backend exposes `GET /api/notifications/:id` to support inbox detail view scoped to the current user.
- Mobile Notifications tab uses a stack navigator with inbox list + detail.
- Unread badge is driven by `GET /api/notifications/unread-count` and updated when marking read/mark-all-read.

**Acceptance Checklist (M2.2)**
- [x] Notifications tab shows inbox list
- [x] Unread state is visible and unread count badge updates
- [x] Tapping a notification opens the correct detail screen
- [x] Mark-as-read and mark-all-read update unread count
- [x] Error/refresh handling present on list and detail

## Session M2.3 — Push Registration + Device Management
- **Scope**
  - Setup push token retrieval
  - Register device on backend
  - Deep link routing from push
- **Dependencies**
  - `POST /api/mobile/devices/register`
- **Deliverables**
  - Device successfully registered
  - Push opens deep link destination
- **DoD**
  - Push works in dev/staging (as applicable)
  - App handles missing/invalid deep links gracefully

**Status:** COMPLETE

**Implementation Notes (M2.3)**
- Backend implements `POST /api/mobile/devices/register` and `POST /api/mobile/devices/unregister`, storing device + push token in `mobile_devices`.
- Mobile uses `expo-notifications` to request permission, retrieve an Expo push token, and register it to the backend after login.
- Push tap handling reads `data.deepLink` (or `data.url`) from the notification payload and routes via deep links (scheme: `miningerp://`).

**Acceptance Checklist (M2.3)**
- [x] Device successfully registers with backend (`/api/mobile/devices/register`)
- [x] Push permission + token retrieval is handled on mobile
- [x] Tapping push opens deep link destination (when provided)
- [x] Missing/invalid deep links are handled gracefully with a safe fallback

## Session M2.4 — Notification Preferences
- **Scope**
  - Preferences UI (channel toggles)
  - Persist to backend
- **Dependencies**
  - Preferences endpoint (existing/required)
- **Deliverables**
  - Preferences saved + reflected in backend
- **DoD**
  - Preferences persist across reinstall/login

**Status:** COMPLETE

**Implementation Notes (M2.4)**
- Backend already supports notification preferences via `GET/PUT /api/settings/notifications/preferences` and persists them per-user.
- Mobile now includes a real **More** tab with a **Notification Preferences** screen that loads/saves channel toggles (Email/Push/SMS).
- Push registration now respects the saved preference: disabling `push.enabled` triggers a best-effort device unregister and prevents re-registration.

**Acceptance Checklist (M2.4)**
- [x] Preferences UI present with channel toggles
- [x] Preferences persist to backend and reflect on subsequent loads
- [x] Preferences persist across reinstall/login (stored server-side)

---

# Phase M3 — Work: Approvals + Tasks (4 sessions)

## Session M3.1 — Approvals List
- **Scope**
  - Approvals list with filters/search
- **Dependencies**
  - Approvals list endpoint (existing/required)
- **Deliverables**
  - List renders type/status, requester, amount (where applicable)
- **DoD**
  - Role-based access enforced
  - Pagination works

**Status:** COMPLETE

**Implementation Notes (M3.1)**
- Backend adds a unified approvals list endpoint: `GET /api/approvals` with query params `page`, `pageSize`, `type`, `status`, `search`.
- The endpoint enforces role-based visibility per approval type (invoice/purchase request/IT request/payment request), matching existing module rules.
- Mobile implements a real **Work** tab with an **Approvals** list screen that supports search, filters, pull-to-refresh, and infinite pagination.

**Acceptance Checklist (M3.1)**
- [x] Approvals list renders type/status, requester, amount (where applicable)
- [x] Filters + search are functional
- [x] Role-based access enforced (server-side)
- [x] Pagination works

## Session M3.2 — Approval Detail + Actions
- **Scope**
  - Approval detail view
  - Approve/reject/comment
  - Attachments view
- **Dependencies**
  - Approval detail + action endpoints (existing/required)
  - Upload/attachments endpoints (as needed)
- **Deliverables**
  - Actions update status and audit trail
- **DoD**
  - Conflict handling (already actioned) behaves correctly
  - Reject requires reason

**Status:** COMPLETE

**Implementation Notes (M3.2)**
- Backend adds unified approval detail + action endpoints under `GET/POST /api/approvals/item/:type/:id`.
- The unified endpoints enforce role-based access per approval type and return `409 Conflict` if an approval is already actioned.
- Rejection enforces a non-empty reason (minimum 2 characters).
- Mobile adds an **Approval Detail** screen that shows header details, an attachment link (when present), and approval history, and supports approve/reject with optional comments.

**Acceptance Checklist (M3.2)**
- [x] Approval detail view implemented
- [x] Approve/reject/comment actions implemented
- [x] Attachments view/link implemented
- [x] Conflict handling behaves correctly (`409 Conflict` when already actioned)
- [x] Reject requires reason

## Session M3.3 — Tasks List + Task Detail
- **Scope**
  - Tasks list + detail (view-first)
- **Dependencies**
  - Tasks endpoints (existing/required)
- **Deliverables**
  - Tasks list renders due dates and status
- **DoD**
  - Role rules are enforced

**Status:** COMPLETE

**Implementation Notes (M3.3)**
- Backend adds dedicated tasks endpoints under `GET /api/tasks` (paged list with `page`, `pageSize`, `search`, `status`, `mine`) and `GET /api/tasks/:id` (detail).
- Role rules are enforced server-side: privileged roles can see all tasks; other users only see tasks assigned to their email.
- Mobile adds a Work home screen that routes to **Approvals** and **Tasks**.
- Mobile implements **Tasks List** with search, status filters, mine/all toggle, pull-to-refresh, and infinite pagination.
- Mobile implements **Task Detail** (view-first) showing project, status, assignee, due date, completion state, description, and timestamps.

**Acceptance Checklist (M3.3)**
- [x] Tasks list renders due dates and status
- [x] Task detail view implemented
- [x] Pagination works
- [x] Role rules are enforced (server-side)

## Session M3.4 — Deep Links for Work Items
- **Scope**
  - Deep link support for approvals/tasks
  - Permission gating on deep link open
- **Deliverables**
  - Deep link router stable
- **DoD**
  - Opening a deep link never crashes
  - If user lacks access, show clear “no access” state

**Status:** COMPLETE

**Implementation Notes (M3.4)**
- Mobile deep links now support:
  - `miningerp://approvals/{id}` (routes to a resolver screen and then to Approval Detail)
  - `miningerp://work/approvals/{type}/{id}` (direct detail)
  - `miningerp://tasks/{id}` (routes to Task Detail)
  - `miningerp://work/tasks/{id}` (direct detail)
- Permission gating is enforced server-side; mobile renders a dedicated **No access** state on `403`.
- Legacy deep link paths are normalized into the Work stack so inbound links don’t break when route shapes evolve.

**Acceptance Checklist (M3.4)**
- [x] Deep link support for approvals/tasks implemented
- [x] Permission gating on deep link open (shows clear “no access” state)
- [x] Deep link router stable (legacy normalization)
- [x] Opening a deep link never crashes (invalid/missing params handled safely)

---

# Phase M4 — Core Modules MVP (recommended 8 sessions)

## Session M4.1 — Inventory: Stock Search + Item Detail
- **Scope**
  - Stock search, filters, item detail
- **Dependencies**
  - `GET /api/inventory/items`
- **Deliverables**
  - Inventory search and detail screens
- **DoD**
  - Fast search UX
  - Correct units and quantities displayed

**Status:** COMPLETE

**Implementation Notes (M4.1)**
- Backend `GET /api/inventory/items` now supports `search`, `category`, and `lowStock` query params for fast server-side filtering.
- Mobile **Inventory Items** screen includes:
  - Fast search input (code/name/barcode/supplier)
  - Low-stock toggle
  - Category filter chips (auto-derived)
  - Tap-to-open **Inventory Item Detail**
- Mobile **Inventory Item Detail** screen shows:
  - Current quantity + unit and reorder level
  - Warehouse context
  - Optional commercial fields (unit price/supplier/barcode)
  - Recent movements (read-only)

**Acceptance Checklist (M4.1)**
- [x] Inventory search screen implemented
- [x] Filters implemented (category + low stock)
- [x] Item detail screen implemented
- [x] Fast search UX (server-side search + responsive UI)
- [x] Correct units and quantities displayed

## Session M4.2 — Inventory: Receiving (Confirm)
- **Scope**
  - Receiving confirm flow
  - Optional delivery note photo
- **Dependencies**
  - `POST /api/inventory/movements`
  - Upload endpoint (if photo required)
- **Deliverables**
  - Receiving workflow functional
- **DoD**
  - Stock movement recorded correctly

**Status:** COMPLETE

**Implementation Notes (M4.2)**
- Backend now supports plan-aligned receiving via `POST /api/inventory/movements` (records a `STOCK_IN` movement and updates stock atomically).
- Mobile includes a new **Receive Stock** screen reachable from **Inventory Item Detail**.
- Receiving supports optional delivery note photo capture and upload via `POST /api/documents/upload`, linked to the created movement using `module=inventory_movements` and `referenceId={movementId}`.

**Acceptance Checklist (M4.2)**
- [x] Receiving confirm flow implemented and reachable from Inventory Item Detail
- [x] Stock movement recorded correctly (server-side transaction updates quantity + movement history)
- [x] Optional delivery note photo capture and upload supported

## Session M4.3 — Safety: Incident Capture (Offline)
- **Scope**
  - New incident form
  - Offline drafts + queued submission
  - Photo capture
- **Dependencies**
  - Safety incident create endpoint (existing/required)
  - Upload endpoint
- **Deliverables**
  - Offline-first incident capture working
- **DoD**
  - Draft persists across app restarts
  - Pending submission state visible

**Implementation Notes (M4.3)**
- Backend now supports incident capture via `POST /api/safety/incidents` (JWT + RBAC) with validation (`CreateSafetyIncidentDto`).
- Mobile includes an offline-first **Incident Capture** screen and **Incident Outbox** screen.
- Draft persistence uses `AsyncStorage` and survives app restarts.
- Queued submissions auto-retry when connectivity is restored (NetInfo listener), and can be manually retried from the Outbox.
- Optional photo capture supported via `expo-image-picker`, uploaded via `POST /api/documents/upload` with `category=INCIDENT_REPORT`, `module=safety_incidents`, `referenceId={incidentId}`.
- After upload, incident photo URLs are appended via `PUT /api/safety/incidents/:id/photos`.

**Acceptance Checklist (M4.3)**
- [x] New incident form implemented (type, severity, location, date, description, optional fields)
- [x] Offline draft persists across app restarts
- [x] Incidents can be queued offline and submitted later
- [x] Pending/failed submission state visible (Outbox + header badge)
- [x] Optional photo capture + upload supported

**Verification (M4.3)**
- [x] Mobile: `npm run typecheck`
- [x] Backend: `npm run test:e2e`

## Session M4.4 — Safety: Incident List + Detail
- **Scope**
  - List + detail
  - Role-limited visibility (own incidents vs broader)
- **Dependencies**
  - Safety incident list/detail endpoints (existing/required)
- **Deliverables**
  - Incident browsing stable
- **DoD**
  - Permissions enforced

**Implementation Notes (M4.4)**
- Backend now supports incident browsing via:
  - `GET /api/safety/incidents` (paged list + search/filters; server-enforced “mine vs all” visibility)
  - `GET /api/safety/incidents/:id` (detail; server-enforced access)
- Mobile includes:
  - **Incident Reports** list screen (pagination, search, status filter, mine/all toggle where permitted)
  - **Incident Detail** screen (photos + details; 403 renders “No access”)
- Navigation:
  - `HomeStack` includes `SafetyIncidents` and `SafetyIncidentDetail`
  - Entry points added from Home Quick Actions + Safety Inspections/Trainings screens

**Acceptance Checklist (M4.4)**
- [x] Incident list screen implemented (search + filtering + pagination)
- [x] Incident detail screen implemented (photos + fields)
- [x] Permissions enforced server-side (own incidents vs broader roles)
- [x] 403 “no access” UI handled gracefully
- [x] Navigation integrated (Home + Safety screens)

**Verification (M4.4)**
- [x] Mobile: `npm run typecheck` (in `dev/mobile`)
- [x] Backend: `npm run build` (in `dev/backend`)
- [x] Backend: `npm run test` (in `dev/backend`)
- [x] Backend: `npx eslint "{src,apps,libs,test}/**/*.ts"` (passes; formatting issues may appear as warnings)

## Session M4.5 — HR: Employee Directory (Limited Fields)
- **Scope**
  - Directory list + limited profile
- **Dependencies**
  - `GET /api/hr/employees`
- **Deliverables**
  - Directory functional
- **DoD**
  - Sensitive fields hidden for non-authorized roles

**Status:** COMPLETE

**Implementation Notes (M4.5)**
- Backend HR employee endpoints now support directory-safe responses:
  - `GET /api/hr/employees` supports `search` and returns **limited fields only** (id, employeeId, name, email/phone, department, position, status, hireDate, timestamps).
  - `GET /api/hr/employees/:id` returns:
    - Full employee record (including sensitive fields) for `SUPER_ADMIN` and `HR_MANAGER`.
    - Redacted directory profile for all other roles.
- Mobile includes:
  - **Employees** list screen with server-side search + pull-to-refresh.
  - **Employee Detail** screen for the limited profile.
  - Row tap navigates from directory list → profile.

**Acceptance Checklist (M4.5)**
- [x] Directory list screen implemented
- [x] Limited profile screen implemented
- [x] Directory search is supported (server-side `search`)
- [x] Sensitive fields are hidden for non-authorized roles (server-side redaction)

**Verification (M4.5)**
- [x] `prod/verify-m4-5.ps1`
- [x] `prod/verify-m4-5.sh`

## Session M4.6 — HR: Leave Requests (Submit)
- **Scope**
  - Submit leave request
- **Dependencies**
  - `POST /api/hr/leave-requests`
- **Deliverables**
  - Leave request submission
- **DoD**
  - Validation and error handling correct

**Status:** COMPLETE

**Implementation Notes (M4.6)**
- Backend `POST /api/hr/leave-requests` is now JWT-protected and validated via `CreateLeaveRequestDto`.
- Backend binds leave requests to the authenticated employee (by matching `user.email` to `Employee.email`) so clients cannot spoof `employeeId`.
- HR roles (`SUPER_ADMIN`, `HR_MANAGER`) can optionally submit on behalf of another employee via `employeeId`.
- Server-side validation includes date ordering, computed inclusive `totalDays`, and prevention of overlapping pending/approved leave.
- Mobile adds a **Leave Request** submission screen accessible from the **More** tab; it uses consistent API error parsing and client-side validation UX.

**Acceptance Checklist (M4.6)**
- [x] Leave request submission implemented (mobile UI + backend endpoint)
- [x] Validation and error handling correct (dates, reason, overlap prevention, server messages surfaced)

**Verification (M4.6)**
- [x] `prod/verify-m4-6.ps1`
- [x] `prod/verify-m4-6.sh`

## Session M4.7 — Finance: Expenses (Receipt Capture, View-First)
- **Scope**
  - Submit expense with receipt (optional MVP)
  - View basic expenses list (optional)
- **Dependencies**
  - `POST /api/finance/expenses`
  - Upload endpoint
- **Deliverables**
  - Expense submission flow
- **DoD**
  - Receipt upload stable on poor network

**Status:** COMPLETE

**Implementation Notes (M4.7)**
- Backend hardening:
  - `POST /api/finance/expenses` now binds `submittedById` to the authenticated user (prevents spoofing).
  - `GET /api/finance/expenses` is scoped to the authenticated user unless the requester is a finance role.
  - `GET /api/finance/expenses/:id` enforces owner access for non-finance roles.
  - Added `PUT /api/finance/expenses/:id/receipt` to attach a receipt URL after document upload.
- Mobile includes:
  - **Submit Expense** screen (category, date, description, amount, currency, optional projectId + notes).
  - Optional **receipt capture** via camera.
  - **Receipt Outbox** (persistent queue) that retries uploads automatically when connectivity is restored.
  - More tab entry points for Submit Expense + Receipt Outbox with pending/failed count.
- Optional list:
  - Basic **Expenses** list screen already exists under the Home stack and loads via `GET /api/finance/expenses`.

**Acceptance Checklist (M4.7)**
- [x] Expense submission flow implemented (mobile UI + backend endpoint)
- [x] Receipt capture supported (camera)
- [x] Receipt upload stable on poor network (persistent outbox + auto-retry on reconnect)
- [x] Basic expenses list available (view-first)
- [x] Permissions/ownership enforced for non-finance roles (server-side)

**Verification (M4.7)**
- [x] `prod/verify-m4-7.ps1`
- [x] `prod/verify-m4-7.sh`

## Session M4.8 — Operations: Projects (View-First)
- **Scope**
  - Projects list + detail (view)
- **Dependencies**
  - Projects endpoints (existing/required)
- **Deliverables**
  - Projects browsing functional
- **DoD**
  - Role visibility enforced

**Status:** COMPLETE

**Implementation Notes (M4.8)**
- Mobile:
  - Added **Project Detail** screen that loads `GET /api/projects/:id` and renders overview + milestones + tasks.
  - Updated **Projects List** to allow tap-to-open into detail.
  - Enforced role visibility in the UI (vendors cannot view Projects).
- Backend:
  - Enforced role visibility for project view endpoints via `@Roles(...)` on:
    - `GET /api/projects`
    - `GET /api/projects/:id`
    - `GET /api/projects/stats`
    - `GET /api/projects/:id/timeline`

**Acceptance Checklist (M4.8)**
- [x] Projects list is functional (loads from backend)
- [x] Project detail is functional (view-only, includes milestones + tasks)
- [x] Role visibility enforced (mobile UI + server-side)

**Verification (M4.8)**
- [x] `prod/verify-m4-8.ps1`
- [x] `prod/verify-m4-8.sh`

---

# Phase M5 — Documents + Capture (2–4 sessions)

## Session M5.1 — Upload Pipeline (Reusable)
- **Scope**
  - Camera/library upload
  - Retry and progress UI
- **Dependencies**
  - Upload endpoint (existing/required)
- **Deliverables**
  - Shared upload service
- **DoD**
  - Upload retries do not duplicate attachments

**Verification (M5.1)**
- [x] `prod/verify-m5-1.ps1`
- [x] `prod/verify-m5-1.sh`

## Session M5.2 — Document Viewer
- **Scope**
  - Document list + viewer
  - Download/share controls (role-based)
- **Dependencies**
  - Documents endpoints (existing/required)
- **Deliverables**
  - Document module usable
- **DoD**
  - Large PDFs load reliably

## Session M5.3 — Attachments to Workflows
- **Scope**
  - Attach uploads to approvals/incidents/expenses
- **Dependencies**
  - Entity attachment endpoints (existing/required)
- **Deliverables**
  - End-to-end attachment linking
- **DoD**
  - Attachments visible from detail screens

---

# Phase M6 — Hardening (2–4 sessions)

## Session M6.1 — Offline Robustness
- **Scope**
  - Queue inspection screen
  - Retry policies and conflict guidance
- **Deliverables**
  - Reliable offline queue UX
- **DoD**
  - No silent failures for queued items

## Session M6.2 — Monitoring + Performance
- **Scope**
  - Crash reporting integration
  - Performance baselines
- **Deliverables**
  - Monitoring enabled
- **DoD**
  - Crash-free baseline established for pilot group

## Session M6.3 — Security Review
- **Scope**
  - Confirm secure storage
  - Confirm no sensitive logs
  - Session invalidation strategy
- **Deliverables**
  - Security checklist completed
- **DoD**
  - No tokens/PII in logs

---

# Phase M7 — Release & Store Submission (3 sessions)

## Session M7.1 — Release Readiness
- **Scope**
  - Release checklist
  - Finalize store metadata requirements list
- **Deliverables**
  - Release checklist completed
  - Store assets checklist
- **DoD**
  - All P0 bugs closed

## Session M7.2 — iOS TestFlight + Submission
- **Scope**
  - Build, distribute, and submit
- **Deliverables**
  - TestFlight build
  - Submission package
- **DoD**
  - App Store review feedback addressed

## Session M7.3 — Play Store Tracks
- **Scope**
  - Internal testing -> closed testing -> production
- **Deliverables**
  - AAB builds uploaded
  - Data safety + content rating completed
- **DoD**
  - Production-ready release published

---

# Web Dashboard Workstream (Runs alongside Mobile)
These sessions are often executed in parallel with mobile work, but are required for full functionality.

## Session W1 — Mobile App Settings Page (Admin)
- **Deliverables**
  - Minimum versions + force update message
  - Maintenance mode
  - Feature flags

## Session W2 — Push Provider Status + Test Push
- **Deliverables**
  - FCM credential status
  - Test push to user/device

## Session W3 — Device Inventory + Revoke
- **Deliverables**
  - Device list per user
  - Revoke device access

---

# Completion Criteria (MVP)
- Approvals: list/detail/actions stable
- Inventory: search + receiving confirm
- Safety: incident capture offline + upload
- Notifications: in-app inbox + push deep links
- Mobile config: force update + feature flags
- Basic settings: profile + notifications preferences + logout
- Testing: device matrix smoke + pilot UAT completed

# Open Questions (must be answered during Phase M0)
- Biometric login required vs optional
- Top 5 supervisor workflows to optimize
- Which modules are editable vs view-only in MVP
- Final push provider implementation details
- Multi-site/multi-tenant requirements
