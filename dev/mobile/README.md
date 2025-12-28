# Mining ERP Mobile App

Enterprise-grade iOS and Android mobile application for Yellow Power International's Mining ERP system.

## 🎯 Project Status

**Session M0.1 Complete** ✅
- MVP scope locked
- Navigation structure implemented (4 tabs)
- Deep link routing configured (`miningerp://`)
- Yellow Power International branding applied

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Development

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm start

# Scan QR code with Expo Go app
# iOS: Use Camera app to scan
# Android: Use Expo Go app to scan
```

### Testing Deep Links

The app supports the `miningerp://` deep link scheme:

- `miningerp://` - Home tab
- `miningerp://work/approvals/{approvalId}` - Approval detail
- `miningerp://work/tasks/{taskId}` - Task detail
- `miningerp://modules` - Modules tab
- `miningerp://more` - More tab

Test deep links in the Work tab by tapping the demo cards.

## 📱 Navigation Structure

### 4-Tab Bottom Navigation (M0.1)

1. **🏠 Home** - Dashboard (placeholder)
2. **💼 Work** - Approvals and Tasks with deep link support
3. **📋 Modules** - ERP modules grid (placeholder)
4. **⚙️ More** - Settings and profile (placeholder)

## 🎨 Branding

**Yellow Power International**
- Primary: `#FDB913` (Yellow Power Gold)
- Secondary: `#003366` (Navy Blue)
- Accent: `#001F3F` (Deep Blue)

Theme configuration: `theme.config.ts`

## 📂 Project Structure

```
dev/mobile/
├── src/
│   ├── navigation/
│   │   ├── types.ts              # Navigation type definitions
│   │   ├── linking.ts            # Deep link configuration (M0.1)
│   │   ├── RootNavigator.tsx     # Root navigation container
│   │   ├── MainTabNavigator.tsx  # Bottom tab navigation
│   │   └── WorkNavigator.tsx     # Work stack navigation
│   └── screens/
│       ├── HomeScreen.tsx        # Home dashboard
│       ├── WorkScreen.tsx        # Work list
│       ├── ApprovalDetailScreen.tsx  # Approval detail (deep link target)
│       ├── TaskDetailScreen.tsx      # Task detail (deep link target)
│       ├── ModulesScreen.tsx     # Modules grid
│       └── MoreScreen.tsx        # Settings/profile
├── assets/                       # Images, icons, fonts
├── theme.config.ts              # Yellow Power branding theme
├── App.tsx                      # App entry point
├── app.json                     # Expo configuration
└── package.json                 # Dependencies
```

## 🔗 Deep Link Implementation (M0.1)

### Notification to Deep Link Mapping

The app implements the M0.1 notification fallback rule in `src/navigation/linking.ts`:

1. If notification has `deepLink` URL → use it
2. If notification has `entityType` + `entityId` → map to canonical pattern
3. Otherwise → fallback to `miningerp://` (Home)

### Supported Entity Types

- `approval` → `miningerp://work/approvals/{id}`
- `task` → `miningerp://work/tasks/{id}`
- `inventory` → `miningerp://modules` (MVP view-only)
- `safety` → `miningerp://modules` (MVP view-only)
- `notification` → `miningerp://` (Home)

## 🛠️ Technology Stack

- **Framework**: React Native 0.81 (Expo SDK 54)
- **Language**: TypeScript 5.9
- **Navigation**: React Navigation 6
- **State**: (Zustand + React Query in M1+)
- **Build**: EAS Build (M7)

## 📋 Development Phases

| Phase | Status | Focus |
|-------|--------|-------|
| M0.1 | ✅ Complete | MVP scope + navigation + deep links |
| M0.2 | 📝 Next | Backend readiness plan |
| M1 | Pending | Auth + API client |
| M2 | Pending | Dashboard + notifications |
| M3 | Pending | Approvals + tasks |
| M4 | Pending | Core modules |
| M5 | Pending | Documents |
| M6 | Pending | Offline + hardening |
| M7 | Pending | Release |

## 🧪 Testing

### Expo Go (Development)
```bash
npm start
# Scan QR code with phone
```

### Production Builds (M7)
```bash
# Install EAS CLI
npm install -g eas-cli

# Build APK (Android preview)
eas build --platform android --profile preview

# Build for stores
eas build --platform all --profile production
```

## 📖 Documentation

Full documentation in `notes-mobile/`:
- `MOBILE-APP-MAIN.md` - Complete specification
- `MOBILE-PHASES-DETAILED.md` - Development roadmap
- `MOBILE-WIREFRAMES.md` - UI/UX design
- `MOBILE-BRANDING-SUMMARY.md` - Branding guidelines

## 🔐 Security

- JWT tokens (SecureStore in M1)
- HTTPS/TLS for all API calls
- Role-based access control
- No hardcoded secrets

## 📞 Support

For issues or questions:
1. Check `notes-mobile/` documentation
2. Review session deliverables in `MOBILE-PHASES-DETAILED.md`
3. Contact development team

---

**Organization**: Yellow Power International  
**Platform**: iOS & Android  
**Status**: Session M0.1 Complete  
**Last Updated**: December 28, 2025
