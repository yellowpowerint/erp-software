# Inventory System Testing Guide
**Phase 4: Session 4.1**
**Date:** November 25, 2025

---

## 🌐 Production URLs

**Frontend:** https://erp-swart-psi.vercel.app/
**Backend API:** Your Railway/Render deployment URL

---

## ✅ Pre-Test Checklist

1. **Wait for Deployments** (~3-5 minutes):
   - Backend: Database migration should complete
   - Frontend: Vercel build should finish

2. **Verify Backend Running:**
   - Check Railway/Render logs for successful start
   - Look for: "Database migrations applied successfully"

3. **Test Users:**
   - **Warehouse Manager:** `warehouse@mining.com` / `Warehouse@1234` (if exists)
   - **CEO:** `ceo@mining.com` / `CEO@1234`
   - **Operations Manager:** `ops-manager@mining.com` / `OpsManager@1234` (if exists)

---

## 📋 Test 1: Seed Default Warehouses

### **Objective:** Create default warehouses to hold inventory

**Steps:**
1. Login as CEO or Super Admin
2. Navigate to: `/inventory` (or Inventory menu)
3. Click: **"Warehouses"** button
4. Click: **"Seed Default Warehouses"** button (if available via API)
   - OR use Postman/curl:
   ```bash
   POST /warehouses/seed
   Authorization: Bearer {your_jwt_token}
   ```

**Expected Result:**
- 3 warehouses created:
  - **WH-MAIN** - Main Warehouse (Accra, Ghana)
  - **WH-SITE-01** - Tarkwa Mine Site Warehouse
  - **WH-TOOLS** - Tools & Equipment Store

**Alternative (Manual Creation):**
If seed endpoint not accessible via UI:
```bash
POST /warehouses
{
  "code": "WH-MAIN",
  "name": "Main Warehouse",
  "location": "Accra, Ghana",
  "description": "Primary storage facility"
}
```

---

## 📋 Test 2: View Inventory Dashboard

### **Objective:** Verify dashboard displays stats correctly

**Steps:**
1. Login as any user
2. Navigate to: `/inventory`
3. Observe dashboard

**Expected Result:**
- **4 Stats Cards:**
  - Total Items: 0 (initially)
  - Low Stock Alerts: 0
  - Out of Stock: 0
  - Stock Value: ₵0

- **3 Quick Action Cards:**
  - Stock Items
  - Stock Movements
  - Warehouses

- **Low Stock Alerts Table:** Empty (no items yet)

---

## 📋 Test 3: Create New Stock Item

### **Objective:** Add a new inventory item

**Steps:**
1. Login as Warehouse Manager or CEO
2. Go to: `/inventory/items`
3. Click: **"Add Stock Item"** button
4. Fill form:
   ```
   Item Code: HYDOIL-001
   Item Name: Hydraulic Oil ISO 68
   Description: High-performance hydraulic oil for mining equipment
   Category: FUEL
   Unit: LITERS
   Warehouse: Main Warehouse
   Unit Price: 25.50
   Reorder Level: 500
   Max Stock Level: 2000
   Barcode: (leave empty)
   Supplier: Shell Ghana
   Notes: Store in cool, dry place
   ```
5. Click: **"Create Stock Item"**

**Expected Result:**
- Success message: "Stock item created successfully!"
- Redirected to: `/inventory/items`
- New item appears in table with:
  - Quantity: **0 LITERS** (red badge - out of stock)
  - Category: FUEL
  - Warehouse: Main Warehouse

---

## 📋 Test 4: Create Multiple Stock Items

**Objective:** Build inventory for testing

**Create these items:**

### **Item 2: Safety Helmets**
```
Item Code: HELMET-001
Name: Safety Helmet - Yellow
Category: SAFETY_GEAR
Unit: PIECES
Unit Price: 45.00
Reorder Level: 50
Max Stock Level: 200
Warehouse: Main Warehouse
Supplier: 3M Safety Products
```

### **Item 3: Excavator Parts**
```
Item Code: EXCV-FILTER-001
Name: Hydraulic Filter for CAT 320D
Category: SPARE_PARTS
Unit: PIECES
Unit Price: 150.00
Reorder Level: 10
Max Stock Level: 50
Warehouse: Tarkwa Mine Site Warehouse
Supplier: Caterpillar Ghana
```

### **Item 4: Drill Bits**
```
Item Code: DRILL-BIT-12MM
Name: Drill Bit 12mm Tungsten Carbide
Category: TOOLS
Unit: PIECES
Unit Price: 85.00
Reorder Level: 20
Max Stock Level: 100
Warehouse: Tools & Equipment Store
Supplier: Mining Tools Ltd
```

**Expected Result:**
- All 4 items created successfully
- Items list shows all items
- All items show **0 quantity** (out of stock)

---

## 📋 Test 5: Filter Stock Items

### **Objective:** Test filtering functionality

**Test Filters:**

1. **Search:**
   - Type "hydraulic" → Shows hydraulic oil and filter
   - Type "helmet" → Shows only safety helmet
   - Type "HYDOIL" → Shows hydraulic oil

2. **Warehouse Filter:**
   - Select "Main Warehouse" → Shows 2 items (oil, helmet)
   - Select "Tarkwa Mine Site" → Shows 1 item (filter)
   - Select "All Warehouses" → Shows all 4 items

3. **Category Filter:**
   - Select "FUEL" → Shows hydraulic oil
   - Select "SAFETY_GEAR" → Shows helmet
   - Select "SPARE_PARTS" → Shows filter
   - Select "TOOLS" → Shows drill bit

4. **Low Stock Checkbox:**
   - Check "Low Stock Only" → Shows all items (all at 0)

---

## 📋 Test 6: Add Stock (via API)

### **Objective:** Record stock movements and update quantities

**Note:** Frontend stock adjustment interface not yet built. Use API:

### **Add Hydraulic Oil Stock:**
```bash
POST /inventory/items/{item_id}/movements
Authorization: Bearer {token}
Content-Type: application/json

{
  "movementType": "STOCK_IN",
  "quantity": 1000,
  "unitPrice": 25.50,
  "reference": "PO-2024-001",
  "notes": "Initial stock delivery from Shell"
}
```

### **Add Safety Helmets Stock:**
```bash
POST /inventory/items/{helmet_id}/movements
{
  "movementType": "STOCK_IN",
  "quantity": 150,
  "unitPrice": 45.00,
  "reference": "PO-2024-002",
  "notes": "Bulk order for site safety"
}
```

### **Add Excavator Filters Stock:**
```bash
POST /inventory/items/{filter_id}/movements
{
  "movementType": "STOCK_IN",
  "quantity": 25,
  "unitPrice": 150.00,
  "reference": "PO-2024-003",
  "notes": "Monthly maintenance stock"
}
```

### **Add Drill Bits Stock:**
```bash
POST /inventory/items/{drillbit_id}/movements
{
  "movementType": "STOCK_IN",
  "quantity": 80,
  "unitPrice": 85.00,
  "reference": "PO-2024-004",
  "notes": "Replenish tools inventory"
}
```

**Expected Result:**
- Each API call returns movement record
- Stock quantities updated:
  - Hydraulic Oil: 1000 LITERS
  - Safety Helmets: 150 PIECES
  - Excavator Filters: 25 PIECES
  - Drill Bits: 80 PIECES

---

## 📋 Test 7: Verify Dashboard Updates

### **Objective:** Confirm stats update after stock movements

**Steps:**
1. Refresh browser (or navigate back to `/inventory`)
2. Check stats cards

**Expected Result:**
- **Total Items:** 4
- **Low Stock Alerts:** 0 (all above reorder levels)
- **Out of Stock:** 0
- **Stock Value:** ₵21,050 calculated as:
  - Oil: 1000 × ₵25.50 = ₵25,500
  - Helmets: 150 × ₵45.00 = ₵6,750
  - Filters: 25 × ₵150.00 = ₵3,750
  - Drill Bits: 80 × ₵85.00 = ₵6,800
  - **Total:** ₵42,800

---

## 📋 Test 8: Test Stock Removal (via API)

### **Objective:** Remove stock and trigger low stock alert

**Remove Excavator Filters:**
```bash
POST /inventory/items/{filter_id}/movements
{
  "movementType": "STOCK_OUT",
  "quantity": 16,
  "reference": "WO-2024-015",
  "notes": "Used for maintenance on CAT 320D excavators"
}
```

**Expected Result:**
- Filter quantity: **25 → 9 PIECES**
- Now below reorder level (10)
- Dashboard "Low Stock Alerts": **1**
- Low Stock Alerts table shows filter item

**Remove More Filters (Out of Stock Test):**
```bash
POST /inventory/items/{filter_id}/movements
{
  "movementType": "STOCK_OUT",
  "quantity": 9,
  "reference": "WO-2024-016",
  "notes": "Emergency maintenance"
}
```

**Expected Result:**
- Filter quantity: **9 → 0 PIECES** (red badge)
- Dashboard "Out of Stock": **1**
- Dashboard "Low Stock Alerts": **1** (still shows as low stock)

---

## 📋 Test 9: Test Stock Adjustment (via API)

### **Objective:** Use ADJUSTMENT to set exact quantity

**Adjust Hydraulic Oil (Physical Count Correction):**
```bash
POST /inventory/items/{oil_id}/movements
{
  "movementType": "ADJUSTMENT",
  "quantity": 950,
  "notes": "Physical count adjustment - found 50L discrepancy"
}
```

**Expected Result:**
- Oil quantity: **1000 → 950 LITERS**
- Movement type shows as "ADJUSTMENT"
- Previous/new quantities recorded

---

## 📋 Test 10: View Stock Movements History (via API)

### **Objective:** Verify movement audit trail

**Get All Movements:**
```bash
GET /inventory/movements
Authorization: Bearer {token}
```

**Expected Result:**
- Returns list of all movements (7 movements from tests above)
- Each shows:
  - Movement type (STOCK_IN, STOCK_OUT, ADJUSTMENT)
  - Quantity
  - Previous quantity → New quantity
  - Total value
  - Reference number
  - Notes
  - Timestamp
  - Performed by user

**Get Movements for Specific Item:**
```bash
GET /inventory/movements?itemId={filter_id}
```

**Expected Result:**
- Shows only filter movements (3 movements)
- Chronological order (newest first)

---

## 📋 Test 11: Test Low Stock Filter

### **Objective:** Verify low stock filtering works

**Steps:**
1. Go to: `/inventory/items`
2. Check: **"Low Stock Only"** checkbox

**Expected Result:**
- Shows only 1 item (Excavator Filter at 0 pieces)
- Other items hidden (above reorder levels)

**Create Low Stock Scenario:**
- Use API to remove 101 helmets:
  ```bash
  POST /inventory/items/{helmet_id}/movements
  {
    "movementType": "STOCK_OUT",
    "quantity": 101,
    "notes": "Issued to new site workers"
  }
  ```
- Helmet quantity: **150 → 49 PIECES**
- Now below reorder level (50)

**Refresh Low Stock Filter:**
- Shows 2 items: Filter (0) and Helmets (49)

---

## 📋 Test 12: Test Role-Based Access

### **Test as Different Roles:**

**1. As CEO/Warehouse Manager:**
- ✅ Can see "Add Stock Item" button
- ✅ Can create new items
- ✅ Can edit items (Edit icon visible)
- ✅ Can delete items (Delete icon visible)
- ✅ Can record stock movements

**2. As Operations Manager:**
- ✅ Can view inventory
- ✅ Can view stock items
- ✅ Can record stock movements
- ❌ Cannot see "Add Stock Item" button
- ❌ Cannot edit/delete items

**3. As Employee:**
- ✅ Can view inventory dashboard
- ✅ Can view stock items list
- ❌ Cannot see "Add Stock Item" button
- ❌ Cannot edit/delete items
- ❌ Cannot record stock movements

---

## 📋 Test 13: Test Delete Item

### **Objective:** Verify deletion prevents items with stock

**Attempt to Delete Item with Stock:**
1. Try to delete Hydraulic Oil (has 950L)
2. Click delete icon

**Expected Result:**
- Error: "Cannot delete item with stock. Remove all stock first."

**Delete Item with Zero Stock:**
1. Delete Excavator Filter (0 pieces)
2. Confirm deletion

**Expected Result:**
- Success message
- Item removed from list
- Total items: **3** (oil, helmet, drill bit)

---

## 📋 Test 14: Test Warehouses Management

### **Objective:** View warehouse details

**Steps:**
1. Go to: `/inventory/warehouses` (if page exists)
2. OR use API:
   ```bash
   GET /warehouses
   ```

**Expected Result:**
- Lists 3 warehouses
- Shows item count per warehouse:
  - Main Warehouse: 2 items
  - Tarkwa Mine Site: 0 items (filter was deleted)
  - Tools & Equipment Store: 1 item

---

## 🐛 Common Issues & Fixes

### **Issue 1: "Failed to create item - Item code already exists"**
**Fix:** Use unique item code (e.g., HYDOIL-002)

### **Issue 2: "Warehouse not found"**
**Fix:** Seed warehouses first or create manually

### **Issue 3: "Insufficient stock" when removing**
**Fix:** Check current quantity before STOCK_OUT

### **Issue 4: Stock value shows ₵0**
**Fix:** Ensure unit prices are set when creating items

### **Issue 5: Can't see Add Stock Item button**
**Fix:** Login as CEO or Warehouse Manager role

---

## ✅ Success Criteria

Mark these as you test:

### **Backend API:**
- [ ] Create warehouse
- [ ] Create stock item
- [ ] Update stock item
- [ ] Delete stock item (with validation)
- [ ] Record stock movement (IN/OUT/ADJUSTMENT)
- [ ] Get inventory stats
- [ ] Get low stock alerts
- [ ] Get movement history
- [ ] Filter by warehouse
- [ ] Filter by category
- [ ] Filter low stock items

### **Frontend:**
- [ ] Inventory dashboard displays stats
- [ ] Low stock alerts table appears
- [ ] Stock items list loads
- [ ] Search works correctly
- [ ] Warehouse filter works
- [ ] Category filter works
- [ ] Low stock filter works
- [ ] Add new item form works
- [ ] Item creation succeeds
- [ ] Role-based buttons visible
- [ ] Delete item works (with validation)
- [ ] Quantity badges color-coded (red/orange/green)

---

## 📊 Expected Final State

After all tests:

**Inventory Items:**
- Hydraulic Oil: 950 LITERS (green - above reorder)
- Safety Helmets: 49 PIECES (orange - at reorder level)
- Drill Bits: 80 PIECES (green - above reorder)

**Dashboard Stats:**
- Total Items: 3
- Low Stock Alerts: 1 (helmets)
- Out of Stock: 0
- Stock Value: ₵11,055
  - Oil: 950 × ₵25.50 = ₵24,225
  - Helmets: 49 × ₵45.00 = ₵2,205
  - Drill Bits: 80 × ₵85.00 = ₵6,800
  - Total: ₵33,230

**Stock Movements:** 9 movements recorded

---

## 🎓 Testing Tips

1. **Use Postman Collection:** Create collection for all inventory API calls
2. **Check Backend Logs:** Monitor for errors during testing
3. **Browser Console:** Press F12 to check for frontend errors
4. **Network Tab:** Verify API calls succeed (Status 200/201)
5. **Refresh Often:** Dashboard stats may need page refresh

---

## 📸 Screenshots to Capture

If testing succeeds, capture:
1. Inventory dashboard with stats
2. Stock items list with filters
3. Add new item form
4. Low stock alerts table
5. Stock movements history (via API response)
6. Warehouse list

---

## 🎉 Test Complete!

Once all checkboxes are marked, **Phase 4: Session 4.1 is VERIFIED** ✅

**What's Next:**
- Complete remaining frontend pages:
  - Stock item detail page
  - Stock adjustment modal
  - Stock movements history page
  - Warehouses management page
- Session 4.2: Asset Management
- Session 4.3: Inventory Reports & Analytics
