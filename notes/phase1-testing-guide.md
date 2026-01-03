# Phase 1 Testing Guide

## Quick Start

### 1. Start Backend (if not already running)
```powershell
cd C:\Users\Plange\Downloads\Projects\mining-erp\dev\backend
npm run start:dev
```

### 2. Start Mobile App
```powershell
cd C:\Users\Plange\Downloads\Projects\mining-erp\dev\mobile
npx expo start
```

### 3. Open in Expo Go
- Scan QR code from terminal
- Or press `a` for Android emulator / `i` for iOS simulator

## Test Scenarios

### Scenario 1: Executive Access (CEO/CFO)
**Login as:** CEO or CFO user

**Expected behavior:**
- ✅ Modules screen shows ALL modules:
  - Inventory, Receiving, Safety, HR, Leave, Expenses, Projects, Documents
  - (Plus any additional modules like Procurement, Fleet, Finance if implemented)
- ✅ Work tab shows approvals
- ✅ Approval detail shows Approve/Reject buttons
- ✅ All navigation works without 403 errors

### Scenario 2: Manager Access (DEPARTMENT_HEAD, OPERATIONS_MANAGER)
**Login as:** Department Head or Operations Manager

**Expected behavior:**
- ✅ Modules screen shows most modules (core + procurement + fleet)
- ✅ Work tab shows approvals
- ✅ Approval detail shows Approve/Reject buttons
- ✅ Can access inventory, safety, employees, projects, documents

### Scenario 3: Warehouse Manager
**Login as:** WAREHOUSE_MANAGER

**Expected behavior:**
- ✅ Modules screen shows:
  - Inventory ✅
  - Receiving ✅
  - Safety ✅
  - Documents ✅
  - Requisitions ✅
- ✅ Does NOT show: Finance, Fleet (unless also a manager)
- ✅ Work tab may show limited approvals
- ✅ Can receive stock (if receiving screen implemented)

### Scenario 4: Regular Employee
**Login as:** EMPLOYEE role

**Expected behavior:**
- ✅ Modules screen shows limited modules:
  - Safety ✅
  - HR (Employee Directory) ✅
  - Leave ✅
  - Expenses ✅
  - Documents ✅
  - Tasks ✅
- ✅ Does NOT show: Inventory, Receiving, Procurement, Fleet, Finance
- ✅ Work tab shows tasks (not approvals)
- ✅ Approval detail does NOT show Approve/Reject buttons

### Scenario 5: Procurement Officer
**Login as:** PROCUREMENT_OFFICER

**Expected behavior:**
- ✅ Modules screen shows:
  - Inventory ✅
  - Documents ✅
  - Procurement ✅
  - Requisitions ✅
  - Receiving ✅
- ✅ Work tab shows approvals (procurement-related)
- ✅ Approval detail shows Approve/Reject buttons

## Verification Checklist

### Backend
- [ ] `/mobile/capabilities` endpoint returns correct data for each role
- [ ] Response includes `userId`, `role`, `departmentId`, `modules`, `capabilities`
- [ ] Modules array matches role expectations
- [ ] Capability flags are correct (canApprove, canReject, etc.)

### Mobile
- [ ] Login fetches capabilities automatically
- [ ] Capabilities stored in auth store
- [ ] ModulesScreen filters tiles correctly
- [ ] Approve/Reject buttons show/hide correctly
- [ ] No console errors related to capabilities
- [ ] App doesn't crash when capabilities are null (during bootstrap)

## Debug Tips

### Check capabilities in console
After login, check the console for:
```
[AUTH] Capabilities fetched: { userId: "...", role: "...", modules: [...], capabilities: {...} }
```

### Test API directly
```bash
# Get your token after login (check AsyncStorage or console)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://erp.yellowpowerinternational.com/api/mobile/capabilities
```

### Common Issues

**Issue:** Modules screen shows all modules for everyone
- **Fix:** Check that capabilities are being fetched and stored
- **Debug:** Add `console.log(allowedModules)` in ModulesScreen

**Issue:** Approve/Reject buttons don't show for managers
- **Fix:** Check backend role mapping in `capabilities.helper.ts`
- **Debug:** Add `console.log(canApprove, canReject)` in ApprovalDetailScreen

**Issue:** 401 error when fetching capabilities
- **Fix:** Ensure token is set before calling capabilities endpoint
- **Debug:** Check auth store bootstrap flow

**Issue:** Capabilities are null
- **Fix:** Check network connectivity and API response
- **Debug:** Check console for errors during login/bootstrap

## Performance Notes

- Capabilities are fetched once per login/bootstrap
- No additional API calls during navigation
- Modules filter is memoized (only recalculates when capabilities change)
- Minimal performance impact

## Next Phase Preview

After Phase 1 testing is successful, Phase 2 will add:
- Offline caching for approvals/tasks
- Outbox support for approve/reject actions
- Conflict handling for concurrent approvals
- Better loading states during sync
