# Mining ERP Mobile - Expo Go Testing Guide

## Quick Start Testing with Expo Go

### Setup

1. **Install Expo Go on your device**
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Start development server**
```bash
cd dev/mobile
npm start
```

### QR Code Testing Commands

```bash
# Standard development (auto-generates QR)
npm start

# Use tunnel (different networks)
npm start -- --tunnel

# Use LAN (same network)
npm start -- --lan

# Clear cache and restart
npm start -- --clear

# Specific environment
EXPO_PUBLIC_API_URL=https://api-staging.example.com npm start
```

### Testing on Device

**iOS:**
1. Open Camera app
2. Scan QR code from terminal
3. Tap notification to open in Expo Go

**Android:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Scan QR code from terminal

### Live Development

- **Fast Refresh**: Auto-reloads on save
- **Shake Device**: Opens dev menu
- **r**: Reload app (in terminal)
- **m**: Toggle menu (in terminal)

### Testing Checklist per Phase

- [ ] Authentication (login/logout)
- [ ] Navigation (all tabs/screens)
- [ ] API calls (data loads correctly)
- [ ] Offline mode (banner appears)
- [ ] Push notifications
- [ ] Camera/photo capture
- [ ] Forms (validation, submission)
- [ ] Performance (smooth scrolling)
- [ ] Error handling

### Troubleshooting

**Can't connect:**
- Ensure phone and computer on same WiFi
- Try `npm start -- --tunnel`
- Check firewall settings

**App crashes:**
- Check terminal for errors
- Shake device → Reload
- Clear cache: `npm start -- --clear`
