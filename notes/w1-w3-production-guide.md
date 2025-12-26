# Web Dashboard Sessions W1-W3: Production Guide

## Summary
Implemented three SUPER_ADMIN dashboard pages for mobile app management.

## W1: Mobile App Settings (`/settings/mobile`)
- Configure min versions (iOS/Android), store URLs
- Maintenance mode with custom message
- Force update custom message
- Feature flags (home, work, modules, notifications, more)
- **Backend:** `GET/PUT /settings/mobile/config`
- **Storage:** `SystemSetting.MOBILE_CONFIG_JSON`

## W2: Push Diagnostics (`/settings/push`)
- View Expo push token count and last seen
- Send test push to user ID or push token
- **Backend:** `GET /settings/push/status`, `POST /settings/push/test`
- **Provider:** Expo Push API

## W3: Mobile Devices (`/settings/devices`)
- List all registered devices with search
- Revoke/unrevoke device access
- **Backend:** `GET /settings/mobile/devices`, `POST /settings/mobile/devices/revoke`, `POST /settings/mobile/devices/unrevoke`
- **Storage:** `MobileDevice` table + `SystemSetting.MOBILE_REVOKED_DEVICE_IDS_JSON`

## Files Changed

### Backend
- `mobile.service.ts`: Added maintenance/forceUpdateMessage to config, device revocation enforcement
- `settings.service.ts`: Added W1-W3 admin methods
- `settings.controller.ts`: Added W1-W3 endpoints (all SUPER_ADMIN)

### Frontend
- `app/settings/mobile/page.tsx`: W1 admin page
- `app/settings/push/page.tsx`: W2 diagnostics page
- `app/settings/devices/page.tsx`: W3 inventory page
- `lib/config/menu.ts`: Added 3 menu items
- `app/settings/page.tsx`: Added 3 dashboard tiles

### Mobile
- `MobileConfigContext.tsx`: Extended type with maintenance/forceUpdateMessage
- `RootNavigator.tsx`: Show MaintenanceScreen, pass forceUpdateMessage
- `MaintenanceScreen.tsx`: New screen for maintenance mode
- `ForceUpdateScreen.tsx`: Support custom message

## Verification Steps
1. Start backend: `cd dev/backend && npm run start:dev`
2. Start frontend: `cd dev/frontend && npm run dev`
3. Login as SUPER_ADMIN
4. Navigate to `/settings` and verify 3 new tiles appear
5. Test W1: Update mobile config, verify save
6. Test W2: Check push status, send test push
7. Test W3: View devices, search, revoke/unrevoke

## Deployment Notes
- No database migrations required (uses existing tables)
- Mobile app must be updated to support maintenance mode
- Revoked devices blocked at registration (enforced in backend)
- All endpoints require SUPER_ADMIN role
