# 📱 Mobile App Documentation

This folder contains **all documentation** for the Mining ERP mobile app (iOS & Android).

---

## 📚 Documentation Index

### Core Documentation

1. **[MOBILE-APP-MAIN.md](MOBILE-APP-MAIN.md)**
   - Complete mobile app specification
   - Architecture and technical stack
   - Feature scope and business context
   - System architecture diagrams

2. **[MOBILE-PHASES-DETAILED.md](MOBILE-PHASES-DETAILED.md)**
   - Session-by-session development roadmap
   - 31 sessions across 7 phases (16 weeks)
   - Deliverables and Definition of Done for each session
   - API requirements and dependencies

3. **[MOBILE-WIREFRAMES.md](MOBILE-WIREFRAMES.md)**
   - UI/UX wireframes for all screens
   - Design system specifications
   - Component styling guidelines
   - Navigation structure

4. **[MOBILE-BRANDING-SUMMARY.md](MOBILE-BRANDING-SUMMARY.md)**
   - Yellow Power International branding
   - Color palette and typography
   - Component styling examples
   - Brand application guidelines

### Operational Guides

5. **[MOBILE-BUILD-DEPLOY.md](MOBILE-BUILD-DEPLOY.md)**
   - Build process (APK, AAB, IPA)
   - EAS Build configuration
   - App store submission procedures
   - Release management

6. **[MOBILE-EXPO-GO-TESTING.md](MOBILE-EXPO-GO-TESTING.md)**
   - Expo Go testing workflow
   - QR code generation commands
   - Testing checklist per phase
   - Troubleshooting guide

7. **[prompt](prompt)** (or MOBILE-DEVELOPMENT-PROMPTS.md)
   - Enhanced development prompts
   - Implementation, verification, and deployment prompts
   - Session-by-session workflow

---

## 🎨 Yellow Power International Branding

All mobile app screens use the company's official branding:

### Colors
- **Primary:** #FDB913 (Yellow Power Gold)
- **Secondary:** #003366 (Navy Blue)
- **Accent:** #001F3F (Deep Blue)

### Typography
- **Font Family:** Inter
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700)

---

## 🚀 Quick Start

### For Developers

1. **Read Core Docs First:**
   - Start with MOBILE-APP-MAIN.md for overview
   - Review MOBILE-PHASES-DETAILED.md for your session
   - Check MOBILE-WIREFRAMES.md for UI specifications

2. **Development Workflow:**
   - Code goes in: `dev/mobile/`
   - Builds go in: `prod-mobile/`
   - Docs stay in: `notes-mobile/`

3. **Follow Branding:**
   - Use colors from MOBILE-BRANDING-SUMMARY.md
   - Apply design system from MOBILE-WIREFRAMES.md
   - Reference `dev/mobile/theme.config.ts`

### For Project Managers

1. **Track Progress:**
   - Use MOBILE-PHASES-DETAILED.md for session tracking
   - Each session has clear deliverables and DoD
   - 31 sessions total across 16 weeks

2. **Review Deliverables:**
   - Check Definition of Done for each session
   - Verify testing on iOS and Android
   - Ensure branding compliance

---

## 📂 Related Folders

### Development Code
```
../dev/mobile/
```
All React Native/Expo source code, components, and configuration.

### Production Builds
```
../prod-mobile/
```
APK, AAB, IPA files, deployment scripts, and release notes.

### Old Mobile App (Deprecated)
```
../dev/old-mob/
```
⚠️ **DO NOT USE** - Archived old mobile app (read-only reference only).

---

## 🔄 Development Phases

| Phase | Sessions | Duration | Focus |
|-------|----------|----------|-------|
| M0 | 2 | 1 week | Planning & Architecture |
| M1 | 4 | 2 weeks | Auth & Navigation |
| M2 | 4 | 2 weeks | Dashboard & Notifications |
| M3 | 4 | 2 weeks | Approvals & Tasks |
| M4 | 8 | 4 weeks | Core Modules |
| M5 | 3 | 1.5 weeks | Documents & Attachments |
| M6 | 3 | 1.5 weeks | Offline & Sync |
| M7 | 3 | 1.5 weeks | Polish & Release |

**Total:** 31 sessions, 16 weeks

---

## 📱 Technology Stack

- **Framework:** React Native with Expo (managed workflow)
- **Language:** TypeScript (strict mode)
- **Navigation:** React Navigation (bottom tabs + stack)
- **State Management:** Zustand + React Query
- **API Client:** Axios
- **Storage:** Expo SecureStore + AsyncStorage
- **Offline:** SQLite (expo-sqlite)
- **Notifications:** Expo Notifications (FCM/APNs)
- **Build:** EAS Build
- **Testing:** Expo Go (development), EAS Build (production)

---

## 🎯 Key Features

### For Field Staff
- Safety incident reporting (offline-capable)
- Equipment usage logging
- Inventory checks
- Task management
- Document viewing

### For Executives
- Real-time dashboard
- Approval workflows (purchase orders, invoices, payments)
- Notifications and alerts
- Financial summaries
- Project status

---

## 📞 Support

For questions or issues:
1. Review relevant documentation in this folder
2. Check `dev/mobile/README.md` for development setup
3. Refer to MOBILE-APP-STRUCTURE.md in root for organization

---

**Last Updated:** December 28, 2025  
**Status:** Active Development Documentation
