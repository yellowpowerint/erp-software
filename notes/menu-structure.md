# Mining ERP - Dashboard Menu Structure

## Left Sidebar Navigation (Expanded Menu)

### 🏠 Dashboard
- **Path:** `/dashboard`
- **Roles:** All authenticated users
- **Description:** Overview page with key metrics and quick actions

---

### 📋 Approvals & Workflows
- **Path:** `/approvals`
- **Roles:** CEO, CFO, DEPARTMENT_HEAD, ACCOUNTANT, PROCUREMENT_OFFICER

**Sub-items:**
1. **My Pending Approvals** - `/approvals/pending`
2. **Invoice Approvals** - `/approvals/invoices`
3. **Purchase Requests** - `/approvals/purchases`
4. **IT Requests** - `/approvals/it-requests`
5. **Payment Requests** - `/approvals/payments`
6. **Approval History** - `/approvals/history`

---

### 📦 Inventory & Assets
- **Path:** `/inventory`
- **Roles:** WAREHOUSE_MANAGER, OPERATIONS_MANAGER, PROCUREMENT_OFFICER

**Sub-items:**
1. **Stock Overview** - `/inventory/overview`
2. **Add/Remove Stock** - `/inventory/manage`
3. **Stock Alerts** - `/inventory/alerts`
4. **Warehouses** - `/inventory/warehouses`
5. **Heavy Equipment** - `/inventory/equipment`
6. **Consumables** - `/inventory/consumables`
7. **Suppliers** - `/inventory/suppliers`

---

### 🏗️ Operations
- **Path:** `/operations`
- **Roles:** OPERATIONS_MANAGER, CEO, DEPARTMENT_HEAD

**Sub-items:**
1. **Projects** - `/operations/projects`
2. **Production Logs** - `/operations/production`
3. **Equipment Usage** - `/operations/equipment-usage`
4. **Shift Planning** - `/operations/shifts`
5. **Field Reports** - `/operations/field-reports`

---

### 💰 Finance & Procurement
- **Path:** `/finance`
- **Roles:** CFO, ACCOUNTANT, PROCUREMENT_OFFICER

**Sub-items:**
1. **Invoices** - `/finance/invoices`
2. **Purchase Orders** - `/finance/purchase-orders`
3. **Quotations** - `/finance/quotations`
4. **Payments** - `/finance/payments`
5. **Expense Reports** - `/finance/expenses`

---

### 🤖 AI Insights
- **Path:** `/ai`
- **Roles:** CEO, CFO, OPERATIONS_MANAGER, DEPARTMENT_HEAD

**Sub-items:**
1. **Project Summaries** - `/ai/project-summaries`
2. **Procurement Advisor** - `/ai/procurement-advisor`
3. **Maintenance Predictions** - `/ai/maintenance-predictions`
4. **Knowledge Base (Q&A)** - `/ai/knowledge-base`
5. **Safety Assistant** - `/ai/safety-assistant`
6. **HR Assistant** - `/ai/hr-assistant`

---

### 👥 HR & Personnel
- **Path:** `/hr`
- **Roles:** HR_MANAGER, CEO, DEPARTMENT_HEAD

**Sub-items:**
1. **Employees** - `/hr/employees`
2. **Attendance** - `/hr/attendance`
3. **Recruitment** - `/hr/recruitment`
4. **Performance** - `/hr/performance`

---

### 🦺 Safety & Compliance
- **Path:** `/safety`
- **Roles:** SAFETY_OFFICER, OPERATIONS_MANAGER, CEO

**Sub-items:**
1. **Incident Reports** - `/safety/incidents`
2. **Safety Inspections** - `/safety/inspections`
3. **Compliance Docs** - `/safety/compliance`
4. **Training Records** - `/safety/training`

---

### 📊 Reports & Analytics
- **Path:** `/reports`
- **Roles:** CEO, CFO, OPERATIONS_MANAGER, DEPARTMENT_HEAD

**Sub-items:**
1. **Operational Reports** - `/reports/operations`
2. **Financial Reports** - `/reports/financial`
3. **Inventory Reports** - `/reports/inventory`
4. **Custom Reports** - `/reports/custom`

---

### ⚙️ Settings
- **Path:** `/settings`
- **Roles:** SUPER_ADMIN, CEO, IT_MANAGER

**Sub-items:**
1. **Company Profile** - `/settings/company`
2. **Users & Roles** - `/settings/users`
3. **Approval Workflows** - `/settings/workflows`
4. **Notifications** - `/settings/notifications`
5. **System Settings** - `/settings/system`

---

## Menu Behavior

### Collapsible Sections
- Each main menu item can be expanded/collapsed
- Sub-items slide in/out with smooth animation
- Icon rotates to indicate open/closed state

### Active Section
- Currently active section stays expanded automatically
- Active route is highlighted with accent color
- Breadcrumb trail shows current location

### Role-Based Visibility
- Menu items are filtered based on user role
- Hidden items don't appear in the DOM
- Permission checked on both frontend and backend

### Responsive Behavior
- Desktop: Fixed left sidebar (250px wide)
- Tablet: Collapsible sidebar with toggle button
- Mobile: Drawer/overlay sidebar

---

## Icon Mapping (lucide-react)

- 🏠 Dashboard → `Home`
- 📋 Approvals → `ClipboardCheck`
- 📦 Inventory → `Package`
- 🏗️ Operations → `Construction`
- 💰 Finance → `DollarSign` or `Coins`
- 🤖 AI Insights → `Brain` or `Sparkles`
- 👥 HR → `Users`
- 🦺 Safety → `Shield`
- 📊 Reports → `BarChart3`
- ⚙️ Settings → `Settings`

---

## Implementation Notes

### Menu Data Structure
```typescript
interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  roles: UserRole[];
  children?: MenuItem[];
  badge?: number; // For notification counts
}
```

### Example Menu Item
```typescript
{
  id: 'approvals',
  label: 'Approvals & Workflows',
  icon: ClipboardCheck,
  path: '/approvals',
  roles: ['CEO', 'CFO', 'DEPARTMENT_HEAD', 'ACCOUNTANT', 'PROCUREMENT_OFFICER'],
  children: [
    {
      id: 'approvals-pending',
      label: 'My Pending Approvals',
      path: '/approvals/pending',
      roles: ['CEO', 'CFO', 'DEPARTMENT_HEAD', 'ACCOUNTANT', 'PROCUREMENT_OFFICER'],
      badge: 5, // Shows "5" badge for pending items
    },
    // ... more children
  ]
}
```

### Permission Checking
```typescript
const canViewMenuItem = (item: MenuItem, userRole: UserRole) => {
  return item.roles.includes(userRole);
};

const filteredMenu = menuItems.filter(item => 
  canViewMenuItem(item, currentUser.role)
);
```

---

## Future Enhancements
1. **Search functionality** in sidebar
2. **Favorites/Quick Access** section
3. **Recent pages** tracking
4. **Customizable menu order** per user
5. **Notification badges** on menu items
6. **Dark mode** support

---

**Status:** Menu structure defined
**Next Implementation:** Session 2.1 - Dashboard Layout & Sidebar
