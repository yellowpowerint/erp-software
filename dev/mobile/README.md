# Mining ERP Mobile App

Enterprise-grade iOS and Android mobile applications for the Mining ERP system, built with React Native and Expo.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your mobile device

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Testing on Device

1. **Install Expo Go**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR Code**
   - iOS: Use Camera app to scan QR code
   - Android: Use Expo Go app to scan QR code

3. **Start Testing**
   - App will load on your device
   - Changes auto-reload (Fast Refresh)
   - Shake device to open developer menu

## 📱 Features

### Core Modules
- ✅ **Dashboard**: Real-time widgets, quick actions, activity feed
- ✅ **Approvals**: View and action invoices, POs, requests
- ✅ **Inventory**: Stock search, item details, receiving
- ✅ **Safety**: Offline incident reporting with photos
- ✅ **HR**: Employee directory, leave requests
- ✅ **Finance**: Expense submission with receipt capture
- ✅ **Projects**: View projects, tasks, milestones
- ✅ **Documents**: Browse, view, upload documents
- ✅ **Notifications**: Push notifications with deep linking

### Key Features
- 🔐 Secure authentication (JWT + biometric)
- 📡 Offline-first incident and expense capture
- 🔔 Push notifications with deep linking
- 📸 Camera integration for photos and receipts
- 🔄 Auto-retry for failed uploads
- 🎨 Role-based UI (matches web dashboard permissions)

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm start

# Start with specific connection type
npm start -- --tunnel    # Different networks
npm start -- --lan       # Same local network
npm start -- --clear     # Clear cache

# Run on specific platform
npm run android          # Android emulator
npm run ios              # iOS simulator (macOS only)
npm run web              # Web browser

# Code quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
```

### Project Structure

```
dev/mobile/
├── app/                    # Main app code
│   ├── screens/           # Screen components
│   ├── components/        # Reusable components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API services
│   ├── stores/            # State management (Zustand)
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, icons
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
└── package.json           # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Backend API

The mobile app connects to the existing NestJS backend:
- **Local**: `http://localhost:3001/api`
- **Staging**: `https://api-staging.example.com/api`
- **Production**: `https://api.example.com/api`

## 📦 Building

### Preview Build (APK for testing)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Production Build

```bash
# Android (AAB for Play Store)
eas build --platform android --profile production

# iOS (IPA for App Store)
eas build --platform ios --profile production

# Both platforms
eas build --platform all --profile production
```

## 🚢 Deployment

### Google Play Store

```bash
# Submit to Play Store
eas submit --platform android
```

**Requirements:**
- Google Play Console account ($25 one-time)
- App assets (icon, screenshots, descriptions)
- Privacy policy URL

### Apple App Store

```bash
# Submit to App Store
eas submit --platform ios
```

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect access
- App assets and privacy policy

## 📚 Documentation

Comprehensive documentation is available in the `notes/` directory:

- **`MOBILE-APP-MAIN.md`**: Complete mobile app specification
- **`MOBILE-PHASES-DETAILED.md`**: Development phases and sessions
- **`MOBILE-EXPO-GO-TESTING.md`**: Testing guide with QR codes
- **`MOBILE-BUILD-DEPLOY.md`**: Build and deployment processes
- **`MOBILE-WIREFRAMES.md`**: UI wireframes and design system

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login/logout flow
- [ ] All tabs accessible
- [ ] API calls load data correctly
- [ ] Offline mode (banner + queue)
- [ ] Push notifications
- [ ] Camera/photo capture
- [ ] Form validation
- [ ] Error handling
- [ ] Performance (smooth scrolling)

### Testing Commands

```bash
# Test with different API endpoints
EXPO_PUBLIC_API_URL=https://api-staging.example.com npm start

# Clear cache and test fresh
npm start -- --clear
```

## 🔒 Security

- **Token Storage**: Expo SecureStore (encrypted)
- **Biometric Auth**: Face ID / Touch ID / Fingerprint
- **HTTPS Only**: All API calls over TLS
- **No Hardcoded Secrets**: Environment variables only
- **Role-Based Access**: Server-side RBAC enforcement

## 🐛 Troubleshooting

### Can't connect to development server
- Ensure phone and computer on same WiFi
- Try tunnel mode: `npm start -- --tunnel`
- Check firewall settings

### App crashes on startup
- Check terminal for errors
- Clear cache: `npm start -- --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Push notifications not working
- Verify device registered with backend
- Check push token in device settings
- Test with Expo push notification tool

## 📞 Support

- **Documentation**: See `notes/` directory
- **Backend API**: See `docs/API_DOCUMENTATION.md`
- **Issues**: Contact development team

## 📄 License

Private & Proprietary - Yellow Power International

---

**Built with ❤️ for Mining Operations**

**Version**: 1.0.0  
**Last Updated**: December 28, 2025
