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

## Session M3.3 — Tasks List + Task Detail
- **Scope**
  - Tasks list + detail (view-first)
- **Dependencies**
  - Tasks endpoints (existing/required)
- **Deliverables**
  - Tasks list renders due dates and status
- **DoD**
  - Role rules are enforced

## Session M3.4 — Deep Links for Work Items
- **Scope**
  - Deep link support for approvals/tasks
  - Permission gating on deep link open
- **Deliverables**
  - Deep link router stable
- **DoD**
  - Opening a deep link never crashes
  - If user lacks access, show clear “no access” state

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

## Session M4.5 — HR: Employee Directory (Limited Fields)
- **Scope**
  - Directory list + limited profile
- **Dependencies**
  - `GET /api/hr/employees`
- **Deliverables**
  - Directory functional
- **DoD**
  - Sensitive fields hidden for non-authorized roles

## Session M4.6 — HR: Leave Requests (Submit)
- **Scope**
  - Submit leave request
- **Dependencies**
  - `POST /api/hr/leave-requests`
- **Deliverables**
  - Leave request submission
- **DoD**
  - Validation and error handling correct

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

## Session M4.8 — Operations: Projects (View-First)
- **Scope**
  - Projects list + detail (view)
- **Dependencies**
  - Projects endpoints (existing/required)
- **Deliverables**
  - Projects browsing functional
- **DoD**
  - Role visibility enforced

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
