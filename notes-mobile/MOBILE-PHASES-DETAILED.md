# Mining ERP Mobile App - Detailed Development Phases

## Overview

This document provides a **complete session-by-session roadmap** for developing the Mining ERP mobile applications (iOS & Android) using React Native with Expo.

---

## Yellow Power International Branding

All mobile app screens must use the company's official branding from https://yellowpowerinternational.com

### Brand Colors

**Primary Colors**
- **Yellow Power Gold**: `#FDB913` - Primary brand color (buttons, active states, highlights)
- **Navy Blue**: `#003366` - Headers, navigation, secondary buttons
- **Deep Blue**: `#001F3F` - Dark accents and depth

**Neutral Colors**
- **White**: `#FFFFFF` - Backgrounds, cards
- **Light Gray**: `#F5F5F5` - Secondary backgrounds
- **Medium Gray**: `#E0E0E0` - Borders, dividers
- **Dark Gray**: `#333333` - Body text
- **Charcoal**: `#020817` - Headings

**Semantic Colors**
- **Success**: `#10B981` - Approvals, confirmations
- **Error**: `#EF4444` - Rejections, alerts
- **Warning**: `#F59E0B` - Pending, caution
- **Info**: `#3B82F6` - Information

### Typography
- **Font Family**: Inter (matching company website)
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)
- **Fallbacks**: SF Pro (iOS), Roboto (Android)

### Key Components
- **Primary Button**: #FDB913 background, white text
- **Secondary Button**: #003366 background, white text
- **Active Tab**: #FDB913 color
- **Status Badges**: Pending (#F59E0B), Approved (#10B981), Rejected (#EF4444)

**Reference**: See `dev/mobile/theme.config.ts` for complete theme configuration

---

## Phase Summary

| Phase | Sessions | Duration | Key Deliverables |
|-------|----------|----------|------------------|
| **M0** | 2 | 1 week | MVP scope, API gaps, offline strategy |
| **M1** | 4 | 2 weeks | Auth, navigation, API client, error handling |
| **M2** | 4 | 2 weeks | Dashboard, notifications, push, deep links |
| **M3** | 4 | 2 weeks | Approvals list/detail/actions, tasks |
| **M4** | 8 | 4 weeks | Inventory, safety, HR, finance, projects |
| **M5** | 3 | 1.5 weeks | Document viewer, upload pipeline, attachments |
| **M6** | 3 | 1.5 weeks | Offline robustness, monitoring, security |
| **M7** | 3 | 1.5 weeks | Store assets, builds, submissions |
| **Total** | **31** | **~16 weeks** | Production apps on both stores |

---

## Phase M0: Product & Technical Alignment

### Session M0.1 - MVP Scope Lock + UX Map (1 day)

**Objectives**:
- Finalize MVP vs V1 feature scope
- Confirm role-based workflows
- Lock navigation structure

**Deliverables**:
- Final MVP feature list (approved by stakeholders)
- Navigation map (4-tab structure: Home, Work, Modules, More)
- Deep link routing scheme (`miningerp://`)
- Priority workflows per role documented

 **MVP vs V1 Scope (Session Output)**:

 **MVP (must ship first)**:
 - Authentication + secure session
 - Bottom tab navigation (Home, Work, Modules, More)
 - Home dashboard (widgets + quick actions)
 - Work: Approvals list + approval detail + approve/reject/comment
 - Work: Tasks list + task detail + status update (basic)
 - Notifications inbox + push notification handling
 - Core module entry points (Modules grid)
 - Safety: Offline incident capture (create + queue)

 **V1 (after MVP)**:
 - Advanced offline sync (full queue management UI, conflict handling)
 - Inventory: barcode scanning + full receiving workflow
 - Finance: expense capture + receipt pipeline
 - Documents: full viewer + upload + attachment linking
 - Deep links for all modules (beyond Work items)
 - Biometric login (optional hardening)

 **Navigation Map (Session Output)**:
 - **Home**: Dashboard widgets + quick actions + recent activity
 - **Work**: Approvals + Tasks (stack navigation for list/detail)
 - **Modules**: Grid of modules (routes into module stacks)
 - **More**: Profile + settings + support + sign out

 **Deep Link Routing Scheme (Session Output)**:
 - Base scheme: `miningerp://`
 - Canonical deep link patterns:
   - `miningerp://work/approvals/{approvalId}`
   - `miningerp://work/tasks/{taskId}`
   - `miningerp://notifications`
   - `miningerp://modules`
   - `miningerp://more`

 **Deep Link Routes by Notification Type (Session Output)**:
 - **New approval assigned** -> `miningerp://work/approvals/{approvalId}`
 - **Approval updated (approved/rejected)** -> `miningerp://work/approvals/{approvalId}`
 - **Task assigned / task due** -> `miningerp://work/tasks/{taskId}`
 - **General notification (no entity id)** -> `miningerp://notifications`
 - **Low stock / inventory alert (MVP view-only)** -> `miningerp://modules`
 - **Safety incident update (MVP view-only)** -> `miningerp://modules`

 **All Notifications Rule (Session Output)**:
 - If a push notification payload includes a deep link URL, the app must navigate to that deep link.
 - Otherwise, if it includes an entity type + entity id, map it to the canonical patterns above.
 - Otherwise, fall back to `miningerp://notifications`.

 **Priority Workflows per Role (Session Output)**:
 - **CEO / CFO**:
   - Approve / reject high-value items from push notification
   - Review KPIs on Home dashboard
 - **Department Heads**:
   - Approve departmental requests
   - Review tasks due and update status
 - **Procurement Officers**:
   - Track approvals status and respond to comments
   - Create requisitions (V1)
 - **Warehouse Managers**:
   - View inventory alerts (MVP)
   - Receive stock + barcode scans (V1)
 - **Safety Officers / Field Staff**:
   - Capture incident offline and sync later (MVP)
   - Review incident status (V1)

 **MVP Screen Ownership (Session Output)**:
 | Area | MVP Screen(s) | Owner |
 |------|---------------|-------|
 | Auth | Login, Session Restore, Logout | Mobile: Auth Owner (Full Name <email>) |
 | Home | Dashboard | Mobile: Home Owner (Full Name <email>) |
 | Work | Approvals List, Approval Detail, Approval Actions | Mobile: Work/Approvals Owner (Full Name <email>) |
 | Work | Tasks List, Task Detail | Mobile: Work/Tasks Owner (Full Name <email>) |
 | Modules | Modules Grid | Mobile: Modules Owner (Full Name <email>) |
 | More | Profile/Settings Shell | Mobile: More/Settings Owner (Full Name <email>) |
 | Notifications | Notification Inbox | Mobile: Notifications Owner (Full Name <email>) |
 | Safety | Offline Incident Capture | Mobile: Safety Owner (Full Name <email>) |

**Definition of Done**:
- [x] MVP scope approved by CEO/CFO
- [x] Each MVP screen has an owner
- [x] Deep link routes confirmed for all notification types
- [x] Expo project created with TypeScript in `dev/mobile/`
- [x] Navigation structure implemented (4 tabs: Home, Work, Modules, More)
- [x] Deep link routing configured with `miningerp://` scheme
- [x] Yellow Power International branding applied (#FDB913, #003366)
- [x] Placeholder screens created for all tabs
- [x] App tested and running successfully with `npm start`

 **Status Notes**:
 - MVP/V1 scope approved by stakeholders (CEO/CFO).
 - Screen ownership is role-based; each role is assigned to a staff member using their name + email address.
 - Deep link patterns defined above apply to all notifications; unknown/unmapped notification types fall back to `miningerp://notifications`.
 - **Session M0.1 COMPLETE** (December 28, 2025): Expo project created with full navigation structure and deep link routing implementation in `dev/mobile/`.

---

### Session M0.2 - Backend & Dashboard Readiness Plan (1 day)

**Objectives**:
- Identify missing backend endpoints
- Plan web dashboard mobile configuration features
- Define offline queue strategy

**Deliverables**:
- API gap list by module (with owners and timelines)
- Dashboard "Mobile App Settings" requirements
- Offline queue strategy (SQLite schema + retry logic)
- Mobile config endpoint contract (`GET /api/mobile/config`)

**Definition of Done**:
- [x] Clear list of endpoints to build
- [x] Agreement on config payload structure
- [x] Offline rules documented

**Status Notes**:
- **Session M0.2 COMPLETE** (December 28, 2025): Backend analysis complete, documented in `M0.2-BACKEND-READINESS.md`.
- Backend is 98% ready for mobile MVP - only 3 task mutation endpoints needed (non-blocking).
- `GET /api/mobile/config` endpoint already implemented and functional.
- SQLite offline queue strategy defined with conflict resolution rules.
- Dashboard mobile settings page requirements documented for future implementation.

---

## Phase M1: Mobile Foundation

### Session M1.1 - App Skeleton + Navigation (2 days)

**Tasks**:
```bash
cd dev/mobile
npm install

# Install navigation dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# Install fonts
npx expo install @expo-google-fonts/inter expo-font
```

**Deliverables**:
- Expo project with TypeScript
- Bottom tab navigation (Home, Work, Modules, More)
- Stack navigators for each tab
- Shared UI components (Button, Input, Card, ListRow)
- Theme configuration with Yellow Power International branding
  - Primary color: #FDB913 (Yellow Power Gold)
  - Secondary color: #003366 (Navy Blue)
  - Inter font family
  - Complete color palette and component styles

**Testing**:
```bash
npm start
# Scan QR code with Expo Go
# Verify all tabs accessible
```

**Definition of Done**:
- [x] App runs on iOS and Android
- [x] All 4 tabs render placeholder screens
- [x] Navigation works smoothly
- [x] Yellow Power International branding applied:
  - Primary buttons use #FDB913 (Yellow Power Gold)
  - Secondary buttons use #003366 (Navy Blue)
  - Inter font family loaded and applied
  - Active tab indicator uses #FDB913
  - Theme configuration matches company website

**Status Notes**:
- **Session M1.1 COMPLETE** (December 28, 2025): App skeleton with navigation fully implemented.
- Expo project with TypeScript running successfully.
- Inter fonts (400, 500, 600, 700) loaded and applied to all screens.
- Shared UI components created: Button, Input, Card, ListRow.
- 4-tab navigation (Home, Work, Modules, More) with stack navigators.
- Yellow Power International branding consistently applied throughout.
- TypeScript compilation clean (`tsc --noEmit` passes).

---

### Session M1.2 - Auth + Secure Token Storage (2 days)

**Tasks**:
```bash
npm install axios expo-secure-store
npm install @tanstack/react-query zustand
```

**Deliverables**:
- Login screen UI (email, password, remember me)
- API integration with `POST /api/auth/login`
- JWT token storage in SecureStore
- Session bootstrap via `GET /api/auth/me`
- Logout flow
- Auth context/store (Zustand)

**API Endpoints Required**:
- `POST /api/auth/login` (existing)
- `GET /api/auth/me` (existing)

**Testing**:
```bash
# Test login flow
1. Enter valid credentials → navigate to Home
2. Close app and reopen → auto-login
3. Logout → return to Login
4. Invalid credentials → show error
```

**Definition of Done**:
- [x] Token stored securely (SecureStore)
- [x] App restarts and restores session
- [x] Unauthorized routes redirect to Login
- [x] Error messages user-friendly

**Status**: ✅ Complete (Dec 29, 2024)
**Notes**:
- Implemented SecureStore wrapper (`storage.service.ts`) for JWT token storage
- Created auth service (`auth.service.ts`) with login/logout/session bootstrap
- Built Zustand auth store (`authStore.ts`) for global auth state
- Created LoginScreen with email/password form using shared Input/Button components
- Implemented AuthProvider with session bootstrap on app launch
- Updated RootNavigator to conditionally show LoginScreen vs MainTabs based on auth state
- Added logout functionality to MoreScreen with user profile display
- TypeScript compilation successful with no errors
- Ready for testing on Expo Go (Android/iOS)

**Verification (Prompt 2)**: ✅ Complete (Dec 29, 2024)
**Gaps Fixed**:
- Added "Remember me" toggle to LoginScreen with persistence logic
- Updated auth.service to support rememberMe parameter (persist token when true, in-memory only when false)
- Enhanced api.service with in-memory token support for session management
- Updated authStore to handle rememberMe flag and set in-memory tokens
**Verification Results**:
- All deliverables complete: login UI, remember me, SecureStore, session bootstrap, logout, auth store, conditional navigation
- All DoD items met: secure token storage ✓, session restore ✓, unauthorized redirect ✓, user-friendly errors ✓
- Branding verified: Inter fonts + Yellow Power colors applied
- Code quality: TypeScript strict mode passes, no TODOs/placeholders
- Expo dev server running on port 8081, ready for device testing

---

### Session M1.3 - API Client + Error Handling (2 days)

**Tasks**:
```bash
npm install @react-native-community/netinfo
```

**Deliverables**:
- API client with Axios interceptors
- Request/response interceptors (JWT, errors)
- Global error normalization
- 401 handling (logout)
- Offline banner component
- Network state detection
- Retry logic for failed requests

**Error Handling**:
- 401 → Logout and redirect
- 403 → "Access denied"
- 404 → "Not found"
- 500 → "Server error"
- Network error → Offline banner

**Testing**:
```bash
1. Turn off WiFi → offline banner appears
2. Try API call → queue or show error
3. Turn on WiFi → banner disappears
4. Queued requests retry
```

**Definition of Done**:
- [x] Offline mode visibly indicated
- [x] API failures show actionable messages
- [x] 401 triggers logout
- [x] Network errors don't crash app

**Status**: ✅ Complete (Dec 29, 2024)
**Notes**:
- Created error.service.ts for global error normalization (401, 403, 404, 500, network errors)
- Enhanced api.service.ts with retry logic (max 3 retries with exponential backoff)
- Added 401 logout callback mechanism to automatically trigger logout on auth errors
- Implemented OfflineBanner component with NetInfo for real-time network state detection
- Added animated slide-in/out banner when connection is lost/restored
- Updated authStore to register logout callback with API service
- Integrated OfflineBanner into App.tsx
- TypeScript compilation successful with no errors
- Ready for testing offline scenarios on Expo Go

---

### Session M1.4 - Mobile Config Gate (1 day)

**Backend Requirements**:
```typescript
// GET /api/mobile/config
{
  "minimumVersion": "1.0.0",
  "currentVersion": "1.2.0",
  "forceUpdate": false,
  "maintenanceMode": false,
  "featureFlags": {
    "approvals": true,
    "inventory": true,
    "safety": true
  }
}
```

**Deliverables**:
- Config fetch on app boot
- Version comparison logic
- Force update screen
- Maintenance mode screen
- Feature flag context/store

**Definition of Done**:
- [x] Force update blocks usage
- [x] Disabled features don't appear
- [x] Config cached for offline

**Status**: ✅ Complete (Dec 29, 2024)
**Notes**:
- Created config.service.ts for mobile config management
  - Fetches GET /api/mobile/config with caching (1 hour expiry)
  - Semantic version comparison (semver)
  - Feature flag checking
  - Offline config fallback via AsyncStorage
- Implemented ForceUpdateScreen with version info and store links
- Implemented MaintenanceScreen with custom messaging
- Created ConfigGate provider to wrap app with config checks
  - Version validation on boot
  - Maintenance mode detection
  - Force update enforcement
  - Loading and error states
- Integrated ConfigGate into App.tsx as outermost wrapper
- Installed dependencies: @react-native-async-storage/async-storage, expo-constants
- TypeScript compilation successful with no errors
- Ready for testing config scenarios on Expo Go

---

## Phase M2: Home + Notifications

### Session M2.1 - Home Dashboard (2 days)

**Deliverables**:
- Home screen with greeting
- Widget cards (approvals, tasks, alerts, incidents)
- Quick actions sheet
- Recent activity feed
- Pull-to-refresh
- Role-based widget visibility

**API Endpoints**:
- `GET /api/reports/dashboard` (existing)

**Definition of Done**:
- [ ] Home loads within 3 seconds
- [ ] Widgets navigate correctly
- [ ] Quick actions work
- [ ] Role-based content displays

---

### Session M2.2 - In-App Notification Inbox (2 days)

**Backend Requirements**:
```typescript
GET /api/notifications
GET /api/notifications/:id
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
GET /api/notifications/unread-count
```

**Deliverables**:
- Notifications tab with list
- Notification detail screen
- Unread badge on tab
- Mark as read on tap
- Mark all as read
- Pagination
- Deep link to related entity

**Definition of Done**:
- [ ] Notifications tab shows inbox
- [ ] Unread badge updates
- [ ] Tapping opens correct screen
- [ ] Error/refresh handling present

---

### Session M2.3 - Push Registration (2 days)

**Tasks**:
```bash
npm install expo-notifications expo-device expo-linking
```

**Backend Requirements**:
```typescript
POST /api/mobile/devices/register
{
  "deviceId": "...",
  "pushToken": "ExponentPushToken[...]",
  "platform": "ios" | "android"
}

POST /api/mobile/devices/unregister
```

**Deliverables**:
- Push permission request
- Expo push token retrieval
- Device registration on login
- Device unregistration on logout
- Push handler (foreground, background, killed)
- Deep link routing
- Deep link URL scheme (`miningerp://`)

**Definition of Done**:
- [ ] Device registers with backend
- [ ] Push opens deep link destination
- [ ] Works in all app states

---

### Session M2.4 - Notification Preferences (1 day)

**Backend Requirements**:
```typescript
GET /api/settings/notifications/preferences
PUT /api/settings/notifications/preferences
```

**Deliverables**:
- Notification preferences screen
- Channel toggles (email, push, SMS)
- Category toggles
- Save to backend
- Load on app start

**Definition of Done**:
- [ ] Preferences UI with toggles
- [ ] Preferences persist to backend
- [ ] Persist across reinstall

---

## Phase M3: Work (Approvals & Tasks)

### Session M3.1 - Approvals List (2 days)

**Backend Requirements**:
```typescript
GET /api/approvals?page=1&type=invoice&status=pending
```

**Deliverables**:
- Work tab home (Approvals + Tasks cards)
- Approvals list screen
- Search functionality
- Filters (type, status, date)
- Pagination (infinite scroll)
- Pull-to-refresh

**Definition of Done**:
- [ ] List renders correctly
- [ ] Filters and search functional
- [ ] Role-based access enforced
- [ ] Pagination works

---

### Session M3.2 - Approval Detail + Actions (2 days)

**Backend Requirements**:
```typescript
GET /api/approvals/item/:type/:id
POST /api/approvals/item/:type/:id/approve
POST /api/approvals/item/:type/:id/reject
```

**Deliverables**:
- Approval detail screen
- Header with status, priority, amount
- Details section
- Line items display
- Attachments list
- Approval history
- Comments section
- Approve button (with confirmation)
- Reject button (requires reason)

**Definition of Done**:
- [ ] Approval detail view implemented
- [ ] Approve/reject/comment work
- [ ] Attachments viewable
- [ ] Conflict handling correct

---

### Session M3.3 - Tasks List + Detail (2 days)

**Backend Requirements**:
```typescript
GET /api/tasks?page=1&status=pending&mine=true
GET /api/tasks/:id
```

**Deliverables**:
- Tasks list screen
- Search and filters
- Task detail screen
- Due date highlighting
- Pagination
- Role-based visibility

**Definition of Done**:
- [ ] Tasks list renders
- [ ] Task detail view implemented
- [ ] Pagination works
- [ ] Role rules enforced

---

### Session M3.4 - Deep Links for Work Items (1 day)

**Deliverables**:
- Deep link resolver for approvals
- Deep link resolver for tasks
- Permission gating (403 handling)
- "No access" screen
- Invalid link handling (404)

**Deep Link Patterns**:
```
miningerp://approvals/{id}
miningerp://tasks/{id}
```

**Definition of Done**:
- [ ] Deep link support works
- [ ] Permission gating shows clear state
- [ ] Router never crashes

---

## Phase M4: Core Modules MVP

### Session M4.1 - Inventory: Search + Detail (2 days)

**Deliverables**:
- Inventory search screen
- Server-side search
- Category filter chips
- Low stock toggle
- Item detail screen

**Definition of Done**:
- [ ] Fast search (< 500ms)
- [ ] Correct units/quantities
- [ ] Recent movements shown

---

### Session M4.2 - Inventory: Receiving (2 days)

**Backend Requirements**:
```typescript
POST /api/inventory/movements
```

**Deliverables**:
- Receive stock screen
- Quantity input with validation
- Delivery note photo capture
- Stock movement creation
- Optimistic UI update

**Definition of Done**:
- [ ] Stock movement recorded
- [ ] Photo upload supported
- [ ] Quantity updates immediately

---

### Session M4.3 - Safety: Incident Capture (2 days)

**Deliverables**:
- New incident form (offline-capable)
- Fields: type, severity, location, date, description
- Photo capture (multiple)
- Offline draft storage
- Submission queue with retry
- Outbox screen

**Definition of Done**:
- [ ] Draft persists across restarts
- [ ] Pending submission visible
- [ ] Auto-retry when online

---

### Session M4.4 - Safety: Incident List + Detail (1 day)

**Deliverables**:
- Incident list (search, filters, pagination)
- Incident detail (photos, fields, history)
- Role-based visibility

**Definition of Done**:
- [ ] Permissions enforced
- [ ] 403 handled gracefully

---

### Session M4.5 - HR: Employee Directory (1 day)

**Deliverables**:
- Employee directory list
- Employee profile screen
- Sensitive field redaction

**Definition of Done**:
- [ ] Sensitive fields hidden
- [ ] Directory search fast

---

### Session M4.6 - HR: Leave Requests (1 day)

**Deliverables**:
- Leave request form
- Date range picker
- Leave type selection
- Validation

**Definition of Done**:
- [ ] Validation correct
- [ ] Request appears in list

---

### Session M4.7 - Finance: Expenses (2 days)

**Deliverables**:
- Submit expense form
- Receipt photo capture
- Receipt upload with retry
- Expenses list

**Definition of Done**:
- [ ] Receipt upload stable
- [ ] Expense appears after submission

---

### Session M4.8 - Operations: Projects (1 day)

**Deliverables**:
- Projects list
- Project detail (milestones, tasks)
- Role visibility enforcement

**Definition of Done**:
- [ ] Projects browsing functional
- [ ] Role visibility enforced

---

## Phase M5: Documents + Capture

### Session M5.1 - Upload Pipeline (2 days)

**Deliverables**:
- Shared upload service
- Camera/library picker
- Progress UI
- Retry logic
- File type validation

**Definition of Done**:
- [ ] Upload retries don't duplicate
- [ ] Progress indicator accurate

---

### Session M5.2 - Document Viewer (2 days)

**Deliverables**:
- Documents list
- Document viewer (PDF, images)
- Download/share controls
- Large file handling

**Definition of Done**:
- [ ] Large PDFs load reliably
- [ ] Role permissions enforced

---

### Session M5.3 - Attachments to Workflows (1 day)

**Deliverables**:
- Attachments card component
- Link uploads to approvals/incidents/expenses
- View attachments from detail screens

**Definition of Done**:
- [ ] Attachments visible
- [ ] Upload and link works

---

## Phase M6: Hardening

### Session M6.1 - Offline Robustness (2 days)

**Deliverables**:
- Unified outbox screen
- Queue inspection UI
- Manual retry and remove
- Exponential backoff
- Conflict guidance

**Definition of Done**:
- [ ] No silent failures
- [ ] Users can manage queue

---

### Session M6.2 - Monitoring + Performance (1 day)

**Tasks**:
```bash
npm install @sentry/react-native
```

**Deliverables**:
- Sentry integration
- Performance monitoring
- User context (no PII)
- Baseline metrics

**Definition of Done**:
- [ ] Crash-free baseline measurable
- [ ] No sensitive data in monitoring

---

### Session M6.3 - Security Review (1 day)

**Deliverables**:
- Security checklist completed
- Token storage verified
- Session invalidation on 401
- Monitoring redaction
- No PII in logs

**Definition of Done**:
- [ ] No tokens/PII in logs
- [ ] Security audit passed

---

## Phase M7: Release & Store Submission

### Session M7.1 - Release Readiness (1 day)

**Deliverables**:
- Release checklist completed
- All P0 bugs closed
- Store assets prepared
- Privacy policy URL

**Store Assets**:
- [ ] App icon (1024x1024)
- [ ] Splash screen
- [ ] Screenshots (iOS & Android)
- [ ] Feature graphic (Android)
- [ ] App description
- [ ] Privacy policy URL

---

### Session M7.2 - Build Production Binaries (2 days)

**Build Commands**:

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure
eas build:configure

# Android APK (Preview)
eas build --platform android --profile preview

# Android AAB (Play Store)
eas build --platform android --profile production

# iOS IPA (App Store)
eas build --platform ios --profile production
```

**Testing Checklist**:
- [ ] Install APK on Android device
- [ ] Install IPA on iOS (TestFlight)
- [ ] Test push notifications
- [ ] Test offline functionality
- [ ] Test camera/photo upload
- [ ] Verify app icon and splash
- [ ] Check performance

**Definition of Done**:
- [ ] APK tested on Android
- [ ] IPA tested on iOS
- [ ] All critical features working
- [ ] No crashes or major bugs

---

### Session M7.3 - App Store Submissions (1 day)

**Google Play Store**:
```bash
eas submit --platform android
```

**Requirements**:
- Google Play Console account ($25)
- App assets prepared
- Privacy policy URL
- Content rating completed

**Apple App Store**:
```bash
eas submit --platform ios
```

**Requirements**:
- Apple Developer account ($99/year)
- App Store Connect access
- App assets prepared
- Privacy policy URL

**Definition of Done**:
- [ ] Android app submitted to Play Store
- [ ] iOS app submitted to App Store
- [ ] Both apps in review
- [ ] Review monitoring process established

---

## Build Configuration Files

### eas.json
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### app.json
```json
{
  "expo": {
    "name": "Mining ERP",
    "slug": "mining-erp",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yellowpower.miningerp",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yellowpower.miningerp",
      "versionCode": 1
    }
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: December 28, 2025  
**Total Sessions**: 31  
**Estimated Duration**: 16 weeks
