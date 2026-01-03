# Phase 1 Implementation Summary: Capabilities-Driven Mobile Access

## Overview
Implemented role-based access control (RBAC) for the mobile app to show/hide modules and actions based on user permissions. This prevents users from seeing features they can't access and reduces 403 errors.

## Backend Changes

### 1. Created Capabilities Helper (`backend/src/modules/mobile/capabilities.helper.ts`)
- `getModulesForRole(role)`: Returns list of allowed modules for each role
- `getCapabilitiesForRole(role)`: Returns action-level permissions (canApprove, canReceiveStock, etc.)
- Curated mobile subset (not all web features)
- Role mappings:
  - **Executives (CEO/CFO/SUPER_ADMIN)**: Full access to all modules
  - **Management (DEPARTMENT_HEAD, OPERATIONS_MANAGER, etc.)**: Core + procurement + fleet
  - **Specialists**: Role-specific modules (e.g., WAREHOUSE_MANAGER gets inventory + receiving)
  - **EMPLOYEE**: Base modules (safety, leave, expenses, documents, tasks)

### 2. Added Capabilities Endpoint (`backend/src/modules/mobile/mobile.controller.ts`)
- **GET /mobile/capabilities** (authenticated)
- Returns:
  ```typescript
  {
    userId: string,
    role: string,
    departmentId: string | null,
    modules: string[],  // e.g., ['inventory', 'safety', 'approvals']
    capabilities: {
      canApprove: boolean,
      canReject: boolean,
      canReceiveStock: boolean,
      // ... 15+ capability flags
    }
  }
  ```

## Mobile Changes

### 1. Created Capabilities Service (`mobile/src/services/capabilities.service.ts`)
- Fetches user capabilities from backend
- Type-safe interface for all capability flags

### 2. Updated Auth Store (`mobile/src/store/authStore.ts`)
- Added `capabilities` to auth state
- Fetches capabilities after login and bootstrap
- Clears capabilities on logout

### 3. Created useCapabilities Hook (`mobile/src/hooks/useCapabilities.ts`)
- Easy access to capabilities in any component
- Helper methods:
  - `hasModule(moduleId)`: Check if user has access to a module
  - `can(capability)`: Check if user has a specific capability
  - Direct access: `canApprove`, `canReject`, `canReceiveStock`, etc.

### 4. Updated ModulesScreen (`mobile/src/screens/ModulesScreen.tsx`)
- Filters module tiles based on `capabilities.modules`
- Users only see modules they have access to
- No more "try → 403 → error" loops

### 5. Updated ApprovalDetailScreen (`mobile/src/screens/ApprovalDetailScreen.tsx`)
- Approve/Reject buttons only show if `canApprove && canReject`
- Prevents users from attempting actions they can't perform

## Module Mapping (Mobile Subset)

| Module ID | Description | Example Roles |
|-----------|-------------|---------------|
| `notifications` | All users | All |
| `approvals` | Approval requests | Managers, Execs, Officers |
| `tasks` | Task management | All |
| `inventory` | Stock management | Warehouse, Procurement, Managers |
| `receiving` | Goods receipt (GRN) | Warehouse, Procurement, Managers |
| `safety` | Incidents & inspections | All |
| `employees` | Employee directory | All |
| `leave` | Leave requests | All |
| `expenses` | Expense claims | All |
| `projects` | Project tracking | Managers, Execs |
| `documents` | Document library | All |
| `procurement` | Requisitions, POs | Procurement, Managers, Execs |
| `requisitions` | Create requisitions | Most roles (not VENDOR) |
| `fleet` | Fleet management | Operations, Execs |
| `finance` | Finance modules | Accountant, CFO, Execs |

## Key Capabilities

| Capability | Description | Example Roles |
|------------|-------------|---------------|
| `canApprove` | Approve requests | Managers, Execs, Officers |
| `canReject` | Reject requests | Managers, Execs, Officers |
| `canReceiveStock` | Receive goods (GRN) | Warehouse, Procurement, Managers |
| `canAdjustStock` | Adjust inventory | Warehouse, Execs |
| `canCreateIncident` | Report safety incidents | All |
| `canViewAllIncidents` | View all incidents | Safety Officer, Managers |
| `canCreateInspection` | Create safety inspections | Safety Officer, Managers |
| `canCreateFleetInspection` | Fleet pre-start checks | Operations, Execs |
| `canLogFuel` | Log fuel usage | Operations, Employee, Execs |
| `canReportBreakdown` | Report breakdowns | All |
| `canCreateRequisition` | Create purchase requisitions | All except VENDOR |
| `canViewAllRequisitions` | View all requisitions | Procurement, Warehouse, Managers |
| `canUploadDocuments` | Upload documents | All |
| `canShareDocuments` | Share documents | Managers, Execs |
| `canViewAllEmployees` | View all employees | HR, Managers, Execs |
| `canApproveLeave` | Approve leave requests | Managers, HR, Execs |
| `canApproveExpenses` | Approve expenses | Managers, Accountant, Execs |

## Testing Instructions

### Backend Testing
```bash
# Start backend
cd dev/backend
npm run start:dev

# Test capabilities endpoint (requires valid JWT)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://erp.yellowpowerinternational.com/api/mobile/capabilities
```

### Mobile Testing
```powershell
# Start Expo dev server
cd dev/mobile
npx expo start

# Scan QR code with Expo Go
# Login with different roles to test:
# - CEO/CFO: Should see all modules
# - WAREHOUSE_MANAGER: Should see inventory, receiving, safety
# - EMPLOYEE: Should see limited modules
# - Check approve/reject buttons only show for managers/execs
```

## Benefits

1. **Better UX**: Users only see what they can access
2. **Fewer errors**: No more 403 loops from trying restricted actions
3. **Enterprise-ready**: Proper RBAC enforcement
4. **Scalable**: Easy to add new modules/capabilities
5. **Type-safe**: Full TypeScript support for capabilities

## Next Steps (Phase 2+)

- **Offline caching** for approvals/tasks lists
- **Outbox expansion** for offline approve/reject actions
- **Warehouse receiving** (GRN against PO lines)
- **Fleet workflows** (inspections, fuel, breakdowns)
- **Safety enhancements** (checklists, corrective actions)

## Files Changed

### Backend
- `backend/src/modules/mobile/capabilities.helper.ts` (new)
- `backend/src/modules/mobile/mobile.controller.ts` (modified)
- `backend/src/modules/mobile/mobile.service.ts` (modified)

### Mobile
- `mobile/src/services/capabilities.service.ts` (new)
- `mobile/src/hooks/useCapabilities.ts` (new)
- `mobile/src/store/authStore.ts` (modified)
- `mobile/src/screens/ModulesScreen.tsx` (modified)
- `mobile/src/screens/ApprovalDetailScreen.tsx` (modified)
