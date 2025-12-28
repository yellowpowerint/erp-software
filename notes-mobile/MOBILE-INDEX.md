# Mining ERP Mobile App - Documentation Index

## 📚 Complete Documentation Guide

This index provides quick access to all mobile app documentation.

---

## 🎯 Start Here

**New to the project?** Read these in order:

1. **`MOBILE-SUMMARY.md`** - Quick overview and project status
2. **`MOBILE-APP-MAIN.md`** - Complete specification (primary reference)
3. **`MOBILE-EXPO-GO-TESTING.md`** - Start testing with Expo Go
4. **`dev/mobile/README.md`** - Setup and run the app

---

## 📖 Documentation Files

### Core Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **MOBILE-APP-MAIN.md** | Complete mobile app specification with business context, architecture, features, wireframes, security, and success metrics | `notes/` |
| **MOBILE-PHASES-DETAILED.md** | Session-by-session development roadmap with 7 phases, 31 sessions, deliverables, and DoD | `notes/` |
| **MOBILE-SUMMARY.md** | Quick reference with project overview, structure, commands, and current status | `notes/` |
| **MOBILE-INDEX.md** | This file - documentation navigation | `notes/` |

### Operational Guides

| Document | Purpose | Location |
|----------|---------|----------|
| **MOBILE-EXPO-GO-TESTING.md** | Testing guide with QR code commands, device setup, and troubleshooting | `notes/` |
| **MOBILE-BUILD-DEPLOY.md** | Build processes (APK, IPA, AAB) and app store deployment procedures | `notes/` |
| **MOBILE-WIREFRAMES.md** | UI wireframes, navigation structure, and design system | `notes/` |
| **dev/mobile/README.md** | Mobile app setup, development commands, and project structure | `dev/mobile/` |

### Reference Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **mobile-app.md** | Original mobile app specification (detailed) | `notes/` |
| **phases-mobile.md** | Original phased development plan | `notes/` |
| **mobile-testing.md** | Additional testing notes | `notes/` |
| **API_DOCUMENTATION.md** | Backend API reference | `docs/` |
| **menu-structure.md** | Web dashboard navigation (reference for mobile modules) | `notes/` |

---

## 🚀 Quick Access by Task

### I want to...

**Start development**
→ Read `dev/mobile/README.md`
→ Run `cd dev/mobile && npm install && npm start`

**Test on my phone**
→ Read `MOBILE-EXPO-GO-TESTING.md`
→ Install Expo Go app
→ Scan QR code from terminal

**Understand the architecture**
→ Read `MOBILE-APP-MAIN.md` → Technical Architecture section

**See the UI design**
→ Read `MOBILE-WIREFRAMES.md`
→ Read `MOBILE-APP-MAIN.md` → Enterprise Wireframes section

**Know what to build next**
→ Read `MOBILE-PHASES-DETAILED.md`
→ Check current phase and session

**Build for production**
→ Read `MOBILE-BUILD-DEPLOY.md`
→ Run `eas build --platform all --profile production`

**Submit to app stores**
→ Read `MOBILE-BUILD-DEPLOY.md` → App Store Deployment section
→ Run `eas submit --platform all`

**Understand business requirements**
→ Read `MOBILE-APP-MAIN.md` → Business Context section

**Check security requirements**
→ Read `MOBILE-APP-MAIN.md` → Security & Compliance section

**See success metrics**
→ Read `MOBILE-APP-MAIN.md` → Success Metrics section

---

## 📋 Development Phases Overview

| Phase | Sessions | Duration | Status |
|-------|----------|----------|--------|
| **M0: Alignment** | 2 | 1 week | Complete ✅ (M0.1 + M0.2 done) |
| **M1: Foundation** | 4 | 2 weeks | Pending |
| **M2: Home + Notifications** | 4 | 2 weeks | Pending |
| **M3: Work** | 4 | 2 weeks | Pending |
| **M4: Core Modules** | 8 | 4 weeks | Pending |
| **M5: Documents** | 3 | 1.5 weeks | Pending |
| **M6: Hardening** | 3 | 1.5 weeks | Pending |
| **M7: Release** | 3 | 1.5 weeks | Pending |

**Total**: 31 sessions, ~16 weeks

---

## 🎨 Key Features

### Mobile App Capabilities

- ✅ **Dashboard**: Widgets, quick actions, activity feed
- ✅ **Approvals**: View, approve, reject with comments
- ✅ **Inventory**: Search, details, receiving
- ✅ **Safety**: Offline incident reporting with photos
- ✅ **HR**: Directory, leave requests
- ✅ **Finance**: Expense submission with receipts
- ✅ **Projects**: View projects and tasks
- ✅ **Documents**: Browse, view, upload
- ✅ **Notifications**: Push with deep linking

### Technical Features

- 🔐 JWT authentication + biometric
- 📡 Offline-first for critical workflows
- 🔔 Push notifications (FCM/APNs)
- 📸 Camera integration
- 🔄 Auto-retry for failed uploads
- 🎨 Role-based UI

---

## 🛠️ Technology Stack

**Mobile**: React Native (Expo SDK 51+), TypeScript, React Navigation, Zustand, React Query, Expo SQLite, Sentry

**Backend**: NestJS (existing), PostgreSQL, JWT auth, RBAC

**Build**: EAS Build (APK, AAB, IPA)

**Deploy**: Google Play Store, Apple App Store

---

## 📱 App Structure

### Navigation (4 Tabs)

1. **🏠 Home** - Dashboard, quick actions
2. **💼 Work** - Approvals, tasks
3. **📋 Modules** - All ERP modules grid
4. **⚙️ More** - Settings, profile, support

### Key Screens

- Login (email/password + biometric)
- Home Dashboard (widgets + quick actions)
- Approval Detail (approve/reject)
- Incident Capture (offline-capable)
- Inventory Search (with barcode scanner)
- Document Viewer (PDF, images)
- Notification Inbox (with deep links)

---

## 🔧 Essential Commands

### Development
```bash
cd dev/mobile
npm install              # Install dependencies
npm start                # Start dev server
npm start -- --tunnel    # Use tunnel (different networks)
npm start -- --clear     # Clear cache
```

### Building
```bash
eas login                                    # Login to Expo
eas build --platform android --profile preview    # APK
eas build --platform android --profile production # AAB
eas build --platform ios --profile production     # IPA
```

### Deployment
```bash
eas submit --platform android    # Submit to Play Store
eas submit --platform ios        # Submit to App Store
```

---

## 📞 Support & Resources

### Documentation Locations

- **Mobile Docs**: `notes/MOBILE-*.md`
- **Mobile Code**: `dev/mobile/`
- **Backend API**: `docs/API_DOCUMENTATION.md`
- **Web Reference**: `notes/menu-structure.md`

### Getting Help

1. Check relevant documentation file
2. Review troubleshooting sections
3. Check backend API documentation
4. Contact development team

### Common Issues

- **Can't connect**: Try `npm start -- --tunnel`
- **App crashes**: Run `npm start -- --clear`
- **Build fails**: Check `eas.json` configuration
- **Push not working**: Verify device registration

---

## ✅ Current Status

**Project Phase**: Initial Setup Complete

**Completed**:
- ✅ Expo React Native project initialized
- ✅ Comprehensive documentation created
- ✅ Development workflow established
- ✅ Build and deployment processes defined

**Next Steps**:
1. Review `MOBILE-APP-MAIN.md` for complete specification
2. Start Phase M1, Session M1.1 (App Skeleton + Navigation)
3. Test development server with Expo Go
4. Begin implementing navigation structure

---

## 📊 Documentation Maintenance

**Last Updated**: December 28, 2025  
**Version**: 1.0  
**Status**: Active Development  
**Owner**: Yellow Power International

---

**Quick Links**:
- [Main Spec](MOBILE-APP-MAIN.md)
- [Phases](MOBILE-PHASES-DETAILED.md)
- [Testing](MOBILE-EXPO-GO-TESTING.md)
- [Build & Deploy](MOBILE-BUILD-DEPLOY.md)
- [Wireframes](MOBILE-WIREFRAMES.md)
- [Setup](../dev/mobile/README.md)
