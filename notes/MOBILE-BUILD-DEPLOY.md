# Mining ERP Mobile - Build & Deployment Guide

## Build Process Overview

### Build Types

| Type | Purpose | Command | Output |
|------|---------|---------|--------|
| Development | Expo Go testing | `npm start` | Metro bundle |
| Preview | Internal testing | `eas build --profile preview` | APK |
| Production | Store release | `eas build --profile production` | AAB/IPA |

## Setup EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
cd dev/mobile
eas build:configure
```

## Android Builds

### APK (Testing)
```bash
# Build APK for internal testing
eas build --platform android --profile preview

# Download from Expo dashboard and install
```

### AAB (Play Store)
```bash
# Build AAB for Google Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## iOS Builds

### IPA (App Store)
```bash
# Build IPA (requires Apple Developer account)
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## Google Play Store Submission

### Prerequisites
- Google Play Console account ($25 one-time)
- App assets (icon, screenshots, descriptions)
- Privacy policy URL

### Steps
1. Create app in Play Console
2. Complete store listing
3. Upload AAB
4. Complete content rating
5. Set pricing & distribution
6. Submit for review (1-3 days)

### Required Assets
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: 1080x1920 (2-8 images)
- Short description: 80 chars
- Full description: 4000 chars

## Apple App Store Submission

### Prerequisites
- Apple Developer account ($99/year)
- App Store Connect access
- App assets
- Privacy policy URL

### Steps
1. Create app in App Store Connect
2. Complete app information
3. Upload screenshots
4. Submit build via EAS
5. Complete review information
6. Submit for review (1-3 days)

### Required Assets
- App icon: 1024x1024 PNG
- Screenshots: 1290x2796 (6.5" display, 2-10 images)
- Screenshots: 1242x2208 (5.5" display, 2-10 images)
- Description: 4000 chars
- Keywords: 100 chars

## App Updates

```bash
# Update version in app.json
# iOS: increment buildNumber
# Android: increment versionCode

# Build new version
eas build --platform all --profile production

# Submit
eas submit --platform all
```

## Configuration Files

### eas.json
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "aab" }
    }
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
