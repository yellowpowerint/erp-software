# Mining ERP Mobile App - Main Documentation

## Executive Summary

This document serves as the **master reference** for developing enterprise-grade iOS and Android mobile applications for the Mining ERP system using **React Native with Expo**. The mobile apps will provide field staff and executives with on-the-go access to critical ERP functions including approvals, notifications, inventory management, safety incident reporting, and more.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Business Context & Requirements](#business-context--requirements)
3. [Technical Architecture](#technical-architecture)
4. [Feature Scope](#feature-scope)
5. [Enterprise Wireframes & Navigation](#enterprise-wireframes--navigation)
6. [Development Workflow](#development-workflow)
7. [Testing Strategy (Expo Go)](#testing-strategy-expo-go)
8. [Build & Release Process](#build--release-process)
9. [App Store Deployment](#app-store-deployment)
10. [Security & Compliance](#security--compliance)
11. [Success Metrics](#success-metrics)
12. [Related Documentation](#related-documentation)

---

## Project Overview

### Purpose

The Mining ERP Mobile App addresses a critical business need: **executives and field staff require mobile access to the ERP system for approvals, reviews, and operational tasks when they are on mining sites or away from their laptops**.

### Key Objectives

- ✅ **Quick Approvals**: Enable executives to approve invoices, purchase orders, and requests from anywhere
- ✅ **Push Notifications**: Real-time alerts for pending approvals, tasks, and critical updates
- ✅ **Field Operations**: Allow site staff to report incidents, check inventory, and submit maintenance requests
- ✅ **Offline Capability**: Support offline data capture for areas with poor connectivity
- ✅ **Enterprise Security**: Maintain the same security standards as the web application

### Target Users

| User Type | Primary Use Cases |
|-----------|------------------|
| **Executives (CEO, CFO)** | Approve high-value transactions, review KPIs, monitor operations |
| **Department Heads** | Approve departmental requests, manage team tasks, review reports |
| **Procurement Officers** | Process requisitions, manage vendors, approve purchases |
| **Warehouse Managers** | Check inventory, confirm stock receipts, manage movements |
| **Safety Officers** | Report incidents, conduct inspections, review safety metrics |
| **Field Staff** | Submit maintenance requests, log production data, report issues |

---

## Business Context & Requirements

### Company Workflow Challenges

1. **Remote Sites**: Mining operations are often in remote locations with limited laptop access
2. **Time-Sensitive Approvals**: Delayed approvals can halt operations and cost money
3. **Field Reporting**: Safety incidents and equipment issues need immediate documentation
4. **Inventory Management**: Real-time stock checks are critical for continuous operations
5. **Executive Mobility**: Leadership needs to stay connected while traveling between sites

### Mobile App Scope

The mobile app will **NOT** replicate every feature of the web dashboard. Instead, it focuses on:

- **High-frequency operational tasks** (approvals, notifications, quick edits)
- **Field-first workflows** (incident reporting, stock checks, photo capture)
- **Read-optimized views** (dashboards, reports, documents)
- **Quick actions** (submit requests, add comments, upload attachments)

**Configuration and administrative functions remain in the web dashboard.**

---

## Technical Architecture

### Technology Stack

#### Frontend (Mobile)
- **Framework**: React Native 0.74+ (via Expo SDK 51+)
- **Build System**: Expo (Managed Workflow)
- **Navigation**: React Navigation 6.x (Bottom Tabs + Stack)
- **State Management**: Zustand + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components + React Native Paper (optional)
- **Offline Storage**: Expo SQLite + AsyncStorage
- **Secure Storage**: Expo SecureStore (for tokens)
- **Push Notifications**: Expo Notifications (FCM for Android, APNs for iOS)
- **Camera/Media**: Expo ImagePicker + Camera
- **Monitoring**: Sentry for crash reporting

#### Backend Integration
- **API**: Existing NestJS backend (`/api` endpoints)
- **Authentication**: JWT tokens (same as web)
- **Authorization**: Role-Based Access Control (RBAC)
- **File Upload**: Multipart form-data to `/api/documents/upload`

#### Development Tools
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Expo Go**: Development testing on physical devices
- **EAS Build**: Production builds (APK, IPA, AAB)
- **EAS Submit**: App store submissions

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Apps (iOS/Android)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ React Native │  │ Expo Modules │  │ Native APIs  │      │
│  │  Components  │  │  (Camera,    │  │ (Keychain,   │      │
│  │              │  │   Notifs)    │  │  Biometric)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                          │                                   │
│                  ┌───────▼────────┐                         │
│                  │  API Client    │                         │
│                  │  (Axios/Fetch) │                         │
│                  └───────┬────────┘                         │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS/JWT
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  NestJS Backend (Existing)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Approvals│  │ Inventory│  │  Safety  │   │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                          │                                   │
│                  ┌───────▼────────┐                         │
│                  │   PostgreSQL   │                         │
│                  │   (Neon/Render)│                         │
│                  └────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication**: User logs in → JWT token stored in SecureStore
2. **API Requests**: All requests include JWT in Authorization header
3. **Offline Queue**: Failed requests stored locally → retry when online
4. **Push Notifications**: Backend sends via FCM/APNs → Deep link to relevant screen
5. **File Uploads**: Photos/documents uploaded to backend → URLs returned

---

## Feature Scope

### Core Modules (MVP)

#### 1. Dashboard & Home
- **Widgets**: Pending approvals, tasks due, inventory alerts, notifications
- **Quick Actions**: New requisition, report incident, upload document, request maintenance
- **KPI Cards**: Role-based metrics (finance, operations, safety)

#### 2. Approvals & Workflows
- **View**: List of pending approvals (invoices, purchase orders, IT requests, payment requests)
- **Actions**: Approve, Reject (with reason), Add comments
- **Filters**: By type, status, date range
- **Notifications**: Push alerts for new approvals

#### 3. Inventory & Warehouse
- **Stock Search**: Search by name, code, barcode (with camera scanner)
- **Item Details**: Current quantity, reorder level, warehouse location
- **Stock Movements**: View recent movements, confirm receipts
- **Low Stock Alerts**: Notifications for items below reorder level

#### 4. Safety & Compliance
- **Incident Reporting**: Offline-capable form with photo capture
- **Incident List**: View and filter incidents by status, severity
- **Inspections**: View scheduled inspections and training records
- **Emergency Actions**: Quick access to emergency contacts and procedures

#### 5. HR & Personnel
- **Employee Directory**: Search and view employee profiles (limited fields)
- **Leave Requests**: Submit and approve leave requests
- **Attendance**: View attendance records (if applicable)

#### 6. Finance & Procurement
- **Expenses**: Submit expense reports with receipt capture
- **Requisitions**: View and create purchase requisitions
- **Invoices**: View invoice details and approve payments

#### 7. Operations & Projects
- **Projects**: View project list, status, and milestones
- **Tasks**: View assigned tasks, mark complete, add progress notes
- **Equipment**: View fleet/equipment status, request maintenance

#### 8. Documents
- **Document Library**: Browse and search documents
- **Viewer**: View PDFs, images, and other file types
- **Upload**: Capture photos or select files from device
- **Attachments**: Link documents to approvals, incidents, expenses

#### 9. Notifications
- **Inbox**: In-app notification center
- **Push Notifications**: Real-time alerts with deep linking
- **Preferences**: Manage notification channels (email, push, SMS)

#### 10. Settings & Profile
- **Profile**: View and edit user profile
- **Security**: Biometric login, change password
- **Preferences**: Theme, language, notification settings
- **About**: App version, support contact, terms of service

### Features NOT in Mobile (Web Only)

- ❌ System configuration and settings management
- ❌ User role and permission management
- ❌ Complex report builders and data exports
- ❌ Bulk data imports (CSV)
- ❌ Advanced AI module configuration
- ❌ Database migrations and system maintenance

---

## Enterprise Wireframes & Navigation

### Navigation Structure (4-Tab Bottom Navigation)

```
┌─────────────────────────────────────────────────────────────┐
│                        Status Bar                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                     Screen Content                           │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [🏠 Home]  [💼 Work]  [📋 Modules]  [⚙️ More]             │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1: Home (Dashboard)

**Purpose**: Quick overview and fast actions

```
┌─────────────────────────────────────────────────────────────┐
│  Mining ERP                          🔔 (3)    👤 Profile   │
├─────────────────────────────────────────────────────────────┤
│  Good morning, John Mensah                                  │
│  CEO • Yellow Power International                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ 🔔 Pending Approvals│  │ ✅ Tasks Due Today  │         │
│  │        12           │  │         5           │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ 📦 Inventory Alerts │  │ ⚠️  Safety Incidents│         │
│  │         3           │  │         2           │         │
│  └─────────────────────┘  └─────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Quick Actions                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 📝 New   │ │ ⚠️  Report│ │ 📸 Upload│ │ 🔧 Maint.│     │
│  │ Request  │ │ Incident │ │   Doc    │ │ Request  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Recent Activity                                            │
│  • Invoice #INV-2301 approved by CFO        2 hours ago    │
│  • Safety incident #SI-045 reported         4 hours ago    │
│  • PO #PO-8821 pending your approval        1 day ago      │
│  • Stock movement: Diesel 1000L received    1 day ago      │
└─────────────────────────────────────────────────────────────┘
│  [🏠 Home]  [💼 Work]  [📋 Modules]  [⚙️ More]             │
└─────────────────────────────────────────────────────────────┘
```

### Tab 2: Work (Approvals & Tasks)

**Purpose**: Action center for approvals and assigned tasks

```
┌─────────────────────────────────────────────────────────────┐
│  ← Work                              🔍 Search    ⋮ Filter  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │   📋 Approvals      │  │   ✅ Tasks          │         │
│  │      (12)           │  │      (5)            │         │
│  └─────────────────────┘  └─────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Pending Approvals                                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 💰 Invoice #INV-2301                    PENDING      │  │
│  │ Amount: ₵ 45,250.00                                  │  │
│  │ Submitted by: Kwame Asante • 2 days ago             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🛒 Purchase Order #PO-8821              PENDING      │  │
│  │ Amount: ₵ 128,900.00                                 │  │
│  │ Submitted by: Ama Owusu • 1 day ago                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 💻 IT Request #IT-092                   PENDING      │  │
│  │ Type: Software License                               │  │
│  │ Submitted by: Kofi Mensah • 3 hours ago             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
│  [🏠 Home]  [💼 Work]  [📋 Modules]  [⚙️ More]             │
└─────────────────────────────────────────────────────────────┘
```

### Approval Detail Screen

```
┌─────────────────────────────────────────────────────────────┐
│  ← Invoice #INV-2301                         ⋮ Options      │
├─────────────────────────────────────────────────────────────┤
│  Status: PENDING APPROVAL                                   │
│  Priority: HIGH                                             │
├─────────────────────────────────────────────────────────────┤
│  Details                                                     │
│  Vendor: ABC Mining Supplies Ltd.                           │
│  Amount: ₵ 45,250.00                                        │
│  Due Date: Dec 30, 2025                                     │
│  Category: Equipment Parts                                  │
│  Submitted by: Kwame Asante (Procurement)                   │
│  Submitted on: Dec 26, 2025 at 10:30 AM                    │
├─────────────────────────────────────────────────────────────┤
│  Line Items                                                  │
│  • Hydraulic Pump (2 units) ............ ₵ 25,000.00       │
│  • Conveyor Belt (50m) ................. ₵ 15,250.00       │
│  • Safety Harnesses (10 units) ......... ₵  5,000.00       │
├─────────────────────────────────────────────────────────────┤
│  Attachments (2)                                            │
│  📄 Invoice_ABC_2301.pdf                                    │
│  📄 Delivery_Note.pdf                                       │
├─────────────────────────────────────────────────────────────┤
│  Approval History                                           │
│  ✅ Department Head approved • Dec 27, 2025                │
│  ⏳ Awaiting CFO approval                                   │
├─────────────────────────────────────────────────────────────┤
│  Comments (1)                                               │
│  Kwame Asante: "Urgent - needed for Site B operations"     │
│  Dec 26, 2025 at 10:35 AM                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Add a comment...                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │   ❌ REJECT          │  │   ✅ APPROVE         │       │
│  └──────────────────────┘  └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Tab 3: Modules (Grid View)

**Purpose**: Access to all ERP modules

```
┌─────────────────────────────────────────────────────────────┐
│  Modules                                 🔍 Search           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   📦 Inventory   │  │  🛒 Procurement  │               │
│  │   & Warehouse    │  │   & Finance      │               │
│  │                  │  │                  │               │
│  │   125 items      │  │   18 pending     │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  ⚠️  Safety &    │  │  👥 HR &         │               │
│  │   Compliance     │  │   Personnel      │               │
│  │                  │  │                  │               │
│  │   2 incidents    │  │   45 employees   │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  🚜 Fleet &      │  │  📊 Projects &   │               │
│  │   Equipment      │  │   Operations     │               │
│  │                  │  │                  │               │
│  │   24 vehicles    │  │   8 active       │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  📄 Documents    │  │  🤖 AI Insights  │               │
│  │   & Files        │  │   & Reports      │               │
│  │                  │  │                  │               │
│  │   234 files      │  │   View insights  │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
│  [🏠 Home]  [💼 Work]  [📋 Modules]  [⚙️ More]             │
└─────────────────────────────────────────────────────────────┘
```

### Tab 4: More (Settings & Additional Features)

**Purpose**: User settings, preferences, and secondary features

```
┌─────────────────────────────────────────────────────────────┐
│  More                                                        │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │  👤 John Mensah                                    │    │
│  │  CEO • john.mensah@yellowpower.com                 │    │
│  │  [Edit Profile →]                                  │    │
│  └────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Notifications & Alerts                                     │
│  🔔 Notification Preferences                          →     │
│  📬 Outbox (2 pending)                                →     │
├─────────────────────────────────────────────────────────────┤
│  Actions                                                     │
│  💰 Submit Expense Report                             →     │
│  📝 Request Leave                                     →     │
│  📄 Upload Document                                   →     │
├─────────────────────────────────────────────────────────────┤
│  Settings                                                    │
│  🔐 Security & Biometric Login                        →     │
│  🌙 Appearance (Light/Dark)                           →     │
│  🌍 Language (English)                                →     │
├─────────────────────────────────────────────────────────────┤
│  Support & Information                                      │
│  ℹ️  About Mining ERP                                 →     │
│  📞 Contact Support                                   →     │
│  📋 Terms of Service                                  →     │
│  🔒 Privacy Policy                                    →     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │              🚪 Sign Out                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  App Version: 1.0.0 (Build 1)                              │
└─────────────────────────────────────────────────────────────┘
│  [🏠 Home]  [💼 Work]  [📋 Modules]  [⚙️ More]             │
└─────────────────────────────────────────────────────────────┘
```

### Offline Incident Capture Screen

**Purpose**: Field-first incident reporting with offline support

```
┌─────────────────────────────────────────────────────────────┐
│  ← New Safety Incident                   📡 OFFLINE         │
├─────────────────────────────────────────────────────────────┤
│  ⚠️  You're offline. This incident will be saved locally   │
│  and submitted automatically when you're back online.       │
├─────────────────────────────────────────────────────────────┤
│  Incident Type *                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Near Miss                                      ▼   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Severity *                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │   Low   │ │ Medium  │ │  High   │ │Critical │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                   ✓                                         │
│                                                              │
│  Location *                                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Site B - Excavation Area                           │    │
│  └────────────────────────────────────────────────────┘    │
│  📍 Use Current Location                                    │
│                                                              │
│  Date & Time *                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │ Dec 28, 2025     📅  │  │ 13:45            🕐  │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                              │
│  Description *                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Worker almost struck by falling rock during       │    │
│  │ excavation. Safety protocols followed, no injury. │    │
│  │                                                    │    │
│  │                                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Photos (Optional)                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐                               │
│  │ 📷   │ │ 📷   │ │  +   │                               │
│  │Photo1│ │Photo2│ │ Add  │                               │
│  └──────┘ └──────┘ └──────┘                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │   💾 Save Draft      │  │   📤 Queue Submit    │       │
│  └──────────────────────┘  └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Development Workflow

### Phase-Based Development Approach

The mobile app development follows a **sequential, session-based approach** with clear deliverables at each phase. See `notes/MOBILE-PHASES-DETAILED.md` for the complete breakdown.

**High-Level Phases:**

1. **Phase M0**: Product & Technical Alignment (1-2 sessions)
2. **Phase M1**: Mobile Foundation (4 sessions) - Auth, Navigation, API Client
3. **Phase M2**: Home + Notifications (4 sessions) - Dashboard, Push, Deep Links
4. **Phase M3**: Work (Approvals & Tasks) (4 sessions)
5. **Phase M4**: Core Modules MVP (8 sessions) - Inventory, Safety, HR, Finance, Projects
6. **Phase M5**: Documents + Capture (3 sessions)
7. **Phase M6**: Hardening (3 sessions) - Offline, Monitoring, Security
8. **Phase M7**: Release & Store Submission (3 sessions)

### Development Environment Setup

**Prerequisites:**
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Physical iOS/Android device for testing
- Expo Go app installed on test devices

**Initial Setup:**
```bash
# Navigate to mobile directory
cd dev/mobile

# Install dependencies
npm install

# Start development server
npm start
```

---

## Testing Strategy (Expo Go)

### Expo Go Overview

**Expo Go** is a free mobile app that allows you to test your React Native app on a physical device without building native binaries. This is perfect for rapid development and testing.

### Testing Workflow

#### 1. Start Development Server

```bash
cd dev/mobile
npm start
```

This will:
- Start the Metro bundler
- Generate a QR code in the terminal
- Open Expo DevTools in your browser

#### 2. Test on Physical Device

**iOS (iPhone/iPad):**
1. Install **Expo Go** from the App Store
2. Open the Camera app
3. Scan the QR code from the terminal
4. Tap the notification to open in Expo Go

**Android:**
1. Install **Expo Go** from Google Play Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Scan the QR code from the terminal

#### 3. Live Reload

- **Fast Refresh**: Automatically reloads when you save code changes
- **Shake Device**: Opens developer menu for debugging options
- **Console Logs**: View in terminal or Expo DevTools

### QR Code Generation Commands

```bash
# Standard development server (generates QR automatically)
npm start

# Start with specific connection type
npm start -- --tunnel    # Use when on different networks
npm start -- --lan       # Use when on same local network
npm start -- --localhost # Use for simulator/emulator only

# Generate QR code for specific environment
EXPO_PUBLIC_API_URL=https://api-staging.example.com npm start

# Clear cache and restart
npm start -- --clear
```

### Testing Checklist for Each Phase

- [ ] **Authentication Flow**: Login, logout, token refresh
- [ ] **Navigation**: All tabs and screens accessible
- [ ] **API Integration**: Data loads correctly from backend
- [ ] **Offline Mode**: Offline banner appears, queued actions work
- [ ] **Push Notifications**: Receive and tap notifications
- [ ] **Camera/Media**: Photo capture and upload
- [ ] **Forms**: Validation, error handling, submission
- [ ] **Performance**: Smooth scrolling, fast screen transitions
- [ ] **Error Handling**: Graceful error messages, retry options

---

## Build & Release Process

### Build Types

| Build Type | Purpose | Command | Output |
|------------|---------|---------|--------|
| **Development** | Local testing with Expo Go | `npm start` | Metro bundle |
| **Preview** | Internal testing (no app store) | `eas build --profile preview` | APK (Android), IPA (iOS) |
| **Production** | App store release | `eas build --profile production` | AAB (Android), IPA (iOS) |

### EAS Build Setup

#### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

#### 2. Configure EAS

```bash
cd dev/mobile
eas login
eas build:configure
```

This creates `eas.json` with build profiles:

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
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Android Build Process

#### APK (Preview/Testing)

```bash
# Build APK for internal testing
eas build --platform android --profile preview

# Download and install on device
# APK will be available in Expo dashboard
```

#### AAB (Production/Play Store)

```bash
# Build AAB for Google Play Store
eas build --platform android --profile production

# This creates an Android App Bundle (.aab)
# Required for Play Store submissions
```

**Android Build Requirements:**
- Google Play Developer account ($25 one-time fee)
- App signing key (EAS handles this automatically)
- Package name (e.g., `com.yellowpower.miningerp`)

### iOS Build Process

#### IPA (TestFlight/App Store)

```bash
# Build IPA for iOS
eas build --platform ios --profile production

# This creates an iOS App Archive (.ipa)
```

**iOS Build Requirements:**
- Apple Developer Program membership ($99/year)
- App Store Connect access
- Bundle identifier (e.g., `com.yellowpower.miningerp`)
- Distribution certificate and provisioning profile (EAS handles this)

### Build Configuration Files

**app.json / app.config.js:**
```json
{
  "expo": {
    "name": "Mining ERP",
    "slug": "mining-erp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FDB913"
    },
    "ios": {
      "bundleIdentifier": "com.yellowpower.miningerp",
      "buildNumber": "1",
      "supportsTablet": true
    },
    "android": {
      "package": "com.yellowpower.miningerp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FDB913"
      }
    }
  }
}
```

---

## App Store Deployment

### Google Play Store (Android)

#### Prerequisites
1. **Google Play Console Account**: Create at https://play.google.com/console
2. **App Information**: Prepare app details, screenshots, descriptions
3. **Privacy Policy**: Host privacy policy URL
4. **Content Rating**: Complete IARC questionnaire

#### Submission Process

**Step 1: Create App in Play Console**
```
1. Log in to Google Play Console
2. Click "Create app"
3. Fill in app details:
   - App name: Mining ERP
   - Default language: English
   - App type: App
   - Category: Business
   - Free/Paid: Free
```

**Step 2: Prepare Store Listing**
- **Short description** (80 chars): "Mobile ERP for mining operations - approvals, inventory, safety, and more"
- **Full description** (4000 chars): Detailed feature list
- **Screenshots**: 
  - Phone: 2-8 screenshots (1080x1920 or 1080x2340)
  - Tablet: 2-8 screenshots (optional)
- **Feature graphic**: 1024x500 PNG
- **App icon**: 512x512 PNG

**Step 3: Upload AAB**
```bash
# Build production AAB
eas build --platform android --profile production

# Or use EAS Submit
eas submit --platform android
```

**Step 4: Complete Content Rating**
- Answer questionnaire about app content
- Receive rating (typically PEGI 3 or Everyone)

**Step 5: Set Pricing & Distribution**
- Select countries/regions
- Set pricing (Free)
- Accept developer agreements

**Step 6: Submit for Review**
- Review all sections (green checkmarks)
- Click "Submit for review"
- Wait 1-3 days for approval

### Apple App Store (iOS)

#### Prerequisites
1. **Apple Developer Account**: Enroll at https://developer.apple.com ($99/year)
2. **App Store Connect Access**: Create app at https://appstoreconnect.apple.com
3. **App Information**: Prepare app details, screenshots, descriptions
4. **Privacy Policy**: Host privacy policy URL

#### Submission Process

**Step 1: Create App in App Store Connect**
```
1. Log in to App Store Connect
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - Platform: iOS
   - Name: Mining ERP
   - Primary Language: English
   - Bundle ID: com.yellowpower.miningerp
   - SKU: mining-erp-ios
```

**Step 2: Prepare App Information**
- **Subtitle** (30 chars): "Mining Operations Management"
- **Description** (4000 chars): Detailed feature list
- **Keywords** (100 chars): "mining,erp,inventory,safety,approvals,procurement"
- **Support URL**: Your support website
- **Marketing URL**: Your company website (optional)
- **Privacy Policy URL**: Required

**Step 3: Prepare Screenshots**
- **6.5" Display** (iPhone 14 Pro Max): 1290x2796 (2-10 screenshots)
- **5.5" Display** (iPhone 8 Plus): 1242x2208 (2-10 screenshots)
- **iPad Pro** (12.9"): 2048x2732 (optional)

**Step 4: Upload Build via EAS**
```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

**Step 5: Complete App Review Information**
- **Contact information**: Email and phone
- **Demo account**: Provide test credentials for reviewers
- **Notes**: Any special instructions for reviewers

**Step 6: Submit for Review**
- Review all sections
- Click "Submit for Review"
- Wait 1-3 days for review
- Respond to any feedback from Apple

### Post-Submission

**Both Platforms:**
- Monitor review status daily
- Respond promptly to reviewer questions
- Fix any issues and resubmit if rejected
- Once approved, app goes live automatically (or on scheduled date)

### App Updates

```bash
# Increment version numbers in app.json
# iOS: buildNumber, Android: versionCode

# Build new version
eas build --platform all --profile production

# Submit update
eas submit --platform all
```

---

## Security & Compliance

### Authentication & Authorization

- **JWT Tokens**: Stored in Expo SecureStore (encrypted)
- **Biometric Authentication**: Optional Face ID / Touch ID / Fingerprint
- **Session Management**: Auto-logout on token expiration
- **Role-Based Access**: Same RBAC as web application

### Data Security

- **Encryption at Rest**: SQLite database encrypted
- **Encryption in Transit**: HTTPS/TLS for all API calls
- **Secure Storage**: Sensitive data in SecureStore, not AsyncStorage
- **No Hardcoded Secrets**: API URLs and keys in environment variables

### Privacy & Compliance

- **Data Minimization**: Only collect necessary data
- **User Consent**: Request permissions (camera, notifications, location)
- **Privacy Policy**: Clear disclosure of data usage
- **GDPR Compliance**: Right to access, delete, export data (if applicable)

### Code Security

- **Code Obfuscation**: Enabled in production builds
- **Certificate Pinning**: Planned for future release
- **Jailbreak/Root Detection**: Planned for future release
- **Audit Logging**: All critical actions logged server-side

---

## Success Metrics

### Adoption Metrics
- **Downloads**: Target 80% of active ERP users within 3 months
- **Daily Active Users (DAU)**: Target 60% of total users
- **Session Frequency**: Average 3+ sessions per day for field staff

### Performance Metrics
- **App Launch Time**: < 3 seconds on modern devices
- **Screen Load Time**: < 1 second for cached data, < 3 seconds for API calls
- **Crash-Free Rate**: > 99.5%
- **API Success Rate**: > 99%

### Business Metrics
- **Approval Time**: Reduce average approval time by 50%
- **Incident Reporting**: Increase incident reports by 30% (better visibility)
- **User Satisfaction**: NPS score > 50
- **Support Tickets**: < 5% of users require support per month

### Technical Metrics
- **Offline Success Rate**: > 95% of offline actions sync successfully
- **Push Notification Delivery**: > 90% delivery rate
- **App Store Rating**: Maintain 4.5+ stars

---

## Related Documentation

### Primary Documents
- **`notes/MOBILE-PHASES-DETAILED.md`**: Complete phase-by-phase development plan
- **`notes/MOBILE-WIREFRAMES.md`**: Detailed wireframes and UI specifications
- **`notes/MOBILE-TESTING-GUIDE.md`**: Comprehensive testing procedures
- **`notes/MOBILE-DEPLOYMENT-GUIDE.md`**: Step-by-step deployment instructions

### Backend Documentation
- **`docs/API_DOCUMENTATION.md`**: Backend API reference
- **`notes/mobile-app.md`**: Original mobile app specification
- **`notes/phases-mobile.md`**: Mobile development phases (existing)

### Web Dashboard Documentation
- **`notes/menu-structure.md`**: Web dashboard navigation (reference for mobile modules)
- **`notes/project-phases-plan.md`**: Overall ERP development roadmap

---

## Contact & Support

- **Brand consistency**: Yellow Power International visual identity (gold #FDB913, navy #003366, Inter font).g Team  
**Support Email**: support@yellowpower.com  
**Documentation**: `notes/` directory in repository

---

**Document Version**: 1.0  
**Last Updated**: December 28, 2025  
**Status**: Active Development
