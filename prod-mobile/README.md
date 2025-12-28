# 📦 Mobile App Production Builds

This folder contains **production builds, deployment scripts, and release artifacts** for the Mining ERP mobile app.

---

## 📂 Folder Structure

```
prod-mobile/
├── builds/              # Production build artifacts
│   ├── android/         # APK and AAB files
│   ├── ios/             # IPA files
│   └── archives/        # Archived builds
├── scripts/             # Deployment and release scripts
├── release-notes/       # Version release notes
└── README.md           # This file
```

---

## 🚀 Build Types

### Android Builds

**APK (Android Package)**
- File extension: `.apk`
- Use for: Direct installation, testing, internal distribution
- Location: `builds/android/`

**AAB (Android App Bundle)**
- File extension: `.aab`
- Use for: Google Play Store submission
- Location: `builds/android/`

### iOS Builds

**IPA (iOS App Store Package)**
- File extension: `.ipa`
- Use for: App Store submission, TestFlight
- Location: `builds/ios/`

---

## 🔨 Building Production Artifacts

### Prerequisites

1. **EAS CLI Installed:**
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account:**
   - Login: `eas login`
   - Project configured in `dev/mobile/`

3. **Build Configuration:**
   - `dev/mobile/eas.json` configured
   - `dev/mobile/app.json` updated with version

### Build Commands

**Android APK (Preview):**
```bash
cd dev/mobile/
eas build --platform android --profile preview
```

**Android AAB (Production):**
```bash
cd dev/mobile/
eas build --platform android --profile production
```

**iOS IPA (Production):**
```bash
cd dev/mobile/
eas build --platform ios --profile production
```

**Both Platforms:**
```bash
cd dev/mobile/
eas build --platform all --profile production
```

### Download Builds

After build completes:
```bash
# Download to prod-mobile/builds/
eas build:download --platform android --output prod-mobile/builds/android/
eas build:download --platform ios --output prod-mobile/builds/ios/
```

---

## 📝 Release Process

### 1. Pre-Release Checklist

- [ ] All session deliverables completed
- [ ] Tested on iOS via Expo Go
- [ ] Tested on Android via Expo Go
- [ ] No critical bugs
- [ ] Branding verified (Yellow Power International)
- [ ] Version number updated in `app.json`
- [ ] Release notes prepared

### 2. Build Production Artifacts

```bash
cd dev/mobile/

# Update version in app.json
# version: "1.0.0" -> "1.1.0"
# ios.buildNumber: "1" -> "2"
# android.versionCode: 1 -> 2

# Build for both platforms
eas build --platform all --profile production

# Wait for builds to complete
# Download builds to prod-mobile/
```

### 3. Test Production Builds

**Android:**
- Install APK on physical device
- Test all critical features
- Verify branding and performance

**iOS:**
- Submit to TestFlight
- Test on physical device
- Verify all features work

### 4. Submit to App Stores

**Google Play Store:**
```bash
cd dev/mobile/
eas submit --platform android
```

**Apple App Store:**
```bash
cd dev/mobile/
eas submit --platform ios
```

### 5. Archive and Document

- Move builds to `builds/archives/v1.0.0/`
- Create release notes in `release-notes/v1.0.0.md`
- Tag release in GitHub: `git tag mobile-v1.0.0`

---

## 📋 Deployment Scripts

### Script Organization

```
scripts/
├── build-android.sh      # Build Android APK/AAB
├── build-ios.sh          # Build iOS IPA
├── deploy-testflight.sh  # Deploy to TestFlight
├── deploy-playstore.sh   # Deploy to Play Store
└── version-bump.sh       # Bump version numbers
```

### Example: Build Android

```bash
#!/bin/bash
# scripts/build-android.sh

cd ../dev/mobile

echo "Building Android production..."
eas build --platform android --profile production

echo "Downloading APK/AAB..."
eas build:download --platform android --output ../../prod-mobile/builds/android/

echo "Android build complete!"
```

---

## 🗂️ File Naming Convention

### Android
```
mining-erp-v1.0.0-build1.apk
mining-erp-v1.0.0-build1.aab
```

### iOS
```
mining-erp-v1.0.0-build1.ipa
```

### Archives
```
builds/archives/
├── v1.0.0/
│   ├── mining-erp-v1.0.0-android.apk
│   ├── mining-erp-v1.0.0-android.aab
│   └── mining-erp-v1.0.0-ios.ipa
└── v1.1.0/
    └── ...
```

---

## 🔐 Security Notes

### Credentials and Keys

**DO NOT commit to Git:**
- ❌ `.jks` files (Android signing keys)
- ❌ `.p8` files (iOS App Store Connect API keys)
- ❌ `.p12` files (iOS certificates)
- ❌ `.mobileprovision` files (iOS provisioning profiles)
- ❌ API keys or secrets

**These are ignored in `.gitignore`**

### Secure Storage

- Store signing keys in secure location (not in repo)
- Use EAS Secrets for sensitive values
- Keep credentials in password manager

---

## 📊 Build Status Tracking

### Current Version
- **Version:** 1.0.0
- **Build Number:** 1
- **Status:** In Development

### Build History

| Version | Platform | Date | Status | Notes |
|---------|----------|------|--------|-------|
| 1.0.0 | Android | TBD | Pending | Initial release |
| 1.0.0 | iOS | TBD | Pending | Initial release |

---

## 🔗 Related Documentation

- **Build Guide:** `../notes-mobile/MOBILE-BUILD-DEPLOY.md`
- **Development Phases:** `../notes-mobile/MOBILE-PHASES-DETAILED.md`
- **App Structure:** `../MOBILE-APP-STRUCTURE.md`

---

## 📱 App Store Links

### Google Play Store
- **Status:** Not yet published
- **Link:** TBD

### Apple App Store
- **Status:** Not yet published
- **Link:** TBD

---

**Last Updated:** December 28, 2025  
**Status:** Ready for Production Builds
