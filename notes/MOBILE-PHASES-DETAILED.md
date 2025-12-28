# Mining ERP Mobile App - Detailed Development Phases

## Overview

This document provides a **complete session-by-session roadmap** for developing the Mining ERP mobile applications (iOS & Android) using React Native with Expo.

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

**Definition of Done**:
- [ ] MVP scope approved by CEO/CFO
- [ ] Each MVP screen has an owner
- [ ] Deep link routes confirmed for all notification types

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
- [ ] Clear list of endpoints to build
- [ ] Agreement on config payload structure
- [ ] Offline rules documented

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
- Theme configuration with Yellow Power branding

**Testing**:
```bash
npm start
# Scan QR code with Expo Go
# Verify all tabs accessible
```

**Definition of Done**:
- [ ] App runs on iOS and Android
- [ ] All 4 tabs render placeholder screens
- [ ] Navigation works smoothly
- [ ] Yellow Power branding applied (#FDB913, #003366, Inter font)

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
- [ ] Token stored securely (SecureStore)
- [ ] App restarts and restores session
- [ ] Unauthorized routes redirect to Login
- [ ] Error messages user-friendly

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
- [ ] Offline mode visibly indicated
- [ ] API failures show actionable messages
- [ ] 401 triggers logout
- [ ] Network errors don't crash app

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
- [ ] Force update blocks usage
- [ ] Disabled features don't appear
- [ ] Config cached for offline

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
