# Mobile App Development Structure

## Overview

This document clarifies the separation between old and new mobile app development to prevent conflicts and ensure clean organization.

---

## Folder Structure

### ✅ NEW Mobile App (Active Development)

**Development Code:**
- `dev/mobile/` - All React Native/Expo source code for the NEW mobile app
  - App components, screens, navigation
  - Theme configuration (Yellow Power International branding)
  - TypeScript files, assets, configuration

**Production Builds & Scripts:**
- `prod-mobile/` - Production builds, deployment scripts, APK/IPA files
  - Build artifacts (APK, AAB, IPA)
  - Deployment scripts
  - Release notes

**Documentation:**
- `notes-mobile/` - All mobile app documentation
  - MOBILE-PHASES-DETAILED.md
  - MOBILE-APP-MAIN.md
  - MOBILE-BRANDING-SUMMARY.md
  - MOBILE-WIREFRAMES.md
  - MOBILE-BUILD-DEPLOY.md
  - MOBILE-EXPO-GO-TESTING.md
  - Development prompts

### ❌ OLD Mobile App (Archived - Do Not Use)

**Archived Code:**
- `dev/old-mob/` - Previous mobile app attempt (DEPRECATED)
  - **DO NOT USE** these files for new development
  - **DO NOT MODIFY** these files
  - Kept for reference only
  - Will not be actively maintained

---

## Separation Strategy

### 1. Git Ignore Rules

The `.gitignore` file ensures proper separation:
- Old mobile builds and artifacts are ignored
- New mobile development follows standard React Native/Expo ignore patterns
- No cross-contamination between old and new mobile code

### 2. Development Workflow

**For New Mobile App Development:**
```bash
# Always work in dev/mobile/
cd dev/mobile/

# Install dependencies
npm install

# Start development
npm start

# Build for production
eas build --platform android
eas build --platform ios
```

**Old Mobile App:**
- Files in `dev/old-mob/` are READ-ONLY
- Do not import or reference old mobile code in new development
- Old mobile app is completely separate from new development

### 3. Backend & Frontend Separation

**Backend (dev/backend/):**
- Mining ERP backend API
- Serves BOTH web frontend AND new mobile app
- Mobile-specific endpoints are clearly marked
- No old mobile app dependencies

**Frontend (dev/frontend/):**
- Mining ERP web dashboard
- Completely separate from mobile app
- Shares NO code with mobile app (different frameworks)
- Next.js web app vs React Native mobile app

**New Mobile App (dev/mobile/):**
- React Native with Expo
- Consumes backend API
- Independent codebase from web frontend
- No dependencies on old mobile app

---

## Git Commit Strategy

### Committing Mobile App Changes

**ONLY commit new mobile app files:**
```bash
# Stage new mobile app files
git add dev/mobile/
git add notes-mobile/
git add prod-mobile/

# Commit with clear message
git commit -m "Mobile App: [Session/Feature Description]

Changes:
- [List changes in dev/mobile/]
- [List doc updates in notes-mobile/]

Status: [Development status]"
```

### Committing Backend Changes (if mobile app requires API updates)

**Separate commit for backend:**
```bash
# Stage backend changes
git add dev/backend/src/

# Commit separately
git commit -m "Backend: API updates for Mobile App [Feature]

New Endpoints:
- [List new endpoints]

Related to: Mobile App [Session/Feature]"
```

### Committing Frontend Changes (if dashboard updated)

**Separate commit for frontend:**
```bash
# Stage frontend changes
git add dev/frontend/

# Commit separately
git commit -m "Frontend: Dashboard updates [Feature]

Changes:
- [List changes]"
```

---

## File Organization Rules

### DO ✅

1. **New Mobile Development:**
   - Place ALL new mobile code in `dev/mobile/`
   - Place ALL mobile docs in `notes-mobile/`
   - Place ALL mobile builds/scripts in `prod-mobile/`

2. **Backend API:**
   - Add mobile endpoints in `dev/backend/src/mobile/`
   - Document mobile-specific APIs
   - Version mobile endpoints appropriately

3. **Separate Commits:**
   - Commit mobile, backend, and frontend changes separately
   - Use clear commit messages indicating which part changed
   - Reference related commits when changes span multiple areas

### DON'T ❌

1. **Old Mobile App:**
   - Do NOT modify files in `dev/old-mob/`
   - Do NOT import from `dev/old-mob/` in new mobile code
   - Do NOT reference old mobile documentation

2. **Cross-Contamination:**
   - Do NOT mix mobile and frontend code
   - Do NOT commit mobile + backend + frontend in single commit
   - Do NOT use web frontend components in mobile app

3. **Git Operations:**
   - Do NOT stage `dev/old-mob/` for commits
   - Do NOT delete `dev/old-mob/` (keep for reference)
   - Do NOT merge old mobile code into new mobile app

---

## GitHub Repository Structure

```
mining-erp/
├── dev/
│   ├── backend/          # NestJS API (serves web + mobile)
│   ├── frontend/         # Next.js web dashboard
│   ├── mobile/           # ✅ NEW React Native mobile app
│   └── old-mob/          # ❌ DEPRECATED old mobile app
├── notes-mobile/         # ✅ NEW mobile app documentation
├── prod-mobile/          # ✅ NEW mobile app builds/scripts
├── notes/                # Backend/Frontend documentation
└── prod/                 # Backend/Frontend production files
```

---

## Deployment Strategy

### Mobile App Deployment

**Development Testing:**
```bash
cd dev/mobile/
npm start
# Scan QR code with Expo Go
```

**Production Builds:**
```bash
cd dev/mobile/
eas build --platform android  # APK/AAB
eas build --platform ios       # IPA
```

**Artifacts stored in:** `prod-mobile/`

### Backend Deployment (if mobile requires API changes)

**VPS Deployment:**
```bash
# SSH to VPS: 216.158.230.187
cd /var/www/mining-erp/dev/backend
npm ci
npm run build
npx prisma generate
pm2 restart erp-backend
```

### Frontend Deployment (if dashboard updated)

**VPS Deployment:**
```bash
# SSH to VPS: 216.158.230.187
cd /var/www/mining-erp/dev/frontend
npm ci
npm run build
pm2 restart erp-frontend
```

---

## Version Control Best Practices

### Branch Strategy (Optional)

For major mobile features, consider:
```bash
# Create feature branch
git checkout -b mobile/session-m1.1

# Work on mobile app
# ... make changes in dev/mobile/

# Commit mobile changes
git add dev/mobile/ notes-mobile/
git commit -m "Mobile App: Session M1.1 - Auth & Navigation"

# Push to GitHub
git push origin mobile/session-m1.1

# Merge to main when complete
git checkout main
git merge mobile/session-m1.1
```

### Commit Message Format

**Mobile App:**
```
Mobile App: [Session/Feature] - [Brief Description]

Session: M1.1
Deliverables:
- [Item 1]
- [Item 2]

Files Changed:
- dev/mobile/[files]
- notes-mobile/[files]

Testing: Tested on iOS/Android via Expo Go
Status: Production-ready
```

**Backend:**
```
Backend: API for Mobile [Feature]

Endpoints:
- POST /api/mobile/auth/login
- GET /api/mobile/user/profile

Related to: Mobile App Session M1.1
```

**Frontend:**
```
Frontend: Dashboard [Feature]

Changes:
- Updated login page
- Added new dashboard widget

Related to: [Context if any]
```

---

## Summary

### Clear Separation Achieved ✅

1. **Old Mobile:** `dev/old-mob/` (archived, read-only)
2. **New Mobile:** `dev/mobile/` (active development)
3. **Mobile Docs:** `notes-mobile/` (all documentation)
4. **Mobile Builds:** `prod-mobile/` (production artifacts)
5. **Backend:** `dev/backend/` (API for web + mobile)
6. **Frontend:** `dev/frontend/` (web dashboard only)

### No Conflicts Guaranteed ✅

- Old and new mobile apps in separate folders
- Different documentation folders
- Separate commit strategy
- Clear file organization rules
- Independent deployment processes

### Development Workflow ✅

1. Develop in `dev/mobile/`
2. Document in `notes-mobile/`
3. Build to `prod-mobile/`
4. Commit mobile changes separately
5. Deploy backend/frontend only if needed
6. Test on Expo Go with QR code

---

**Last Updated:** December 28, 2025
**Status:** Active Development Structure
