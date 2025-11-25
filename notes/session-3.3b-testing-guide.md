# Session 3.3b: IT & Payment Requests Testing Guide

## 🌐 Production URLs

**Frontend:** https://erp-swart-psi.vercel.app/
**Backend API:** Check your Railway/Render deployment URL

---

## ✅ Pre-Test Checklist

1. **Wait for Deployments to Complete:**
   - Vercel: ~2-3 minutes (check https://vercel.com/dashboard)
   - Railway/Render: ~3-5 minutes (check your hosting dashboard)

2. **Verify Backend is Running:**
   - Open: `https://your-backend-url.railway.app/` (or Render URL)
   - Should see: "Welcome to Mining ERP API" or similar message
   - Check: Backend logs for any startup errors

3. **Check Migration Status:**
   - Backend should auto-run Prisma migrations
   - Look for "Database is up to date" in logs

---

## 🔐 Test Users

Use these existing test users:

| Role | Email | Password | Can Test |
|------|-------|----------|----------|
| CEO | ceo@mining.com | CEO@1234 | ✅ All requests (create & approve all) |
| CFO | cfo@mining.com | CFO@1234 | ✅ All requests (create & approve all) |
| IT Manager | it-manager@mining.com | ITManager@1234 | ✅ IT Requests (create & approve) |
| Accountant | accountant@mining.com | Accountant@1234 | ✅ Payment Requests (create & approve) |
| Dept Head | dept-head@mining.com | DeptHead@1234 | ✅ Create all types, no approval rights |

---

## 📋 Test 1: IT Requests End-to-End Flow

### **Step 1: Create IT Request (as Department Head)**

1. **Login:**
   - Go to: https://erp-swart-psi.vercel.app/login
   - Email: `dept-head@mining.com`
   - Password: `DeptHead@1234`

2. **Navigate to IT Requests:**
   - Click: **Approvals** in sidebar
   - Click: **"New IT Request"** quick action button (purple)
   - OR: Scroll down → Click **"IT Requests"** → **"View All"** → **"New IT Request"**

3. **Fill Form:**
   ```
   Request Type: Equipment
   Priority: High
   Title: New Laptop for Engineering Team
   Description: Need Dell Latitude 5520 with 16GB RAM for CAD software
   Business Justification: Current laptop is 5 years old and cannot run AutoCAD 2024
   Estimated Cost: 3500
   Notes: Urgent - project deadline in 2 weeks
   ```

4. **Submit:**
   - Click **"Create IT Request"**
   - Should see: "IT request created successfully!" alert
   - Should redirect to: IT Requests list page

5. **Verify Request Created:**
   - Check table for: New request with number **IT-000001**
   - Status should be: **Pending** (yellow badge)
   - Priority should be: **High** (orange badge)

### **Step 2: Check Notifications (as IT Manager)**

1. **Logout** (top-right menu)

2. **Login as IT Manager:**
   - Email: `it-manager@mining.com`
   - Password: `ITManager@1234`

3. **Check Notification Bell:**
   - Top-right corner → Bell icon
   - Should show: **Red badge with "1"** (unread notification)
   - Click bell → Should see: "New IT Request" notification
   - Click notification → Should navigate to IT request detail page

### **Step 3: Approve IT Request**

1. **Review Request Details:**
   - Should see: Request number IT-000001
   - All details filled in Step 1 should be visible
   - Status: **PENDING** (orange badge)
   - Submitted by: Department Head

2. **Approve Request:**
   - Click: **"Approve Request"** (green button)
   - Modal appears
   - Add comment: "Approved. Budget allocated. Please proceed with Dell purchase."
   - Click: **"Approve"**

3. **Verify Approval:**
   - Should see: "IT request approved successfully!" alert
   - Page refreshes automatically
   - Status badge changes to: **APPROVED** (green badge)
   - **Approval History** section shows:
     - Action: APPROVED (green badge)
     - By: IT Manager (IT_MANAGER)
     - Comment: Your approval comment
     - Timestamp: Current date/time

### **Step 4: Verify Creator Received Notification**

1. **Logout**

2. **Login as Department Head:**
   - Email: `dept-head@mining.com`
   - Password: `DeptHead@1234`

3. **Check Notifications:**
   - Bell icon should show: **"1"** unread
   - Click bell → See: "IT Request Approved" notification
   - Message: "Your IT Request IT-000001 was approved by IT Manager"

4. **View Request:**
   - Go to: Approvals → IT Requests → Click "View" on IT-000001
   - Status should be: **APPROVED**
   - Approval history visible

---

## 💰 Test 2: Payment Requests End-to-End Flow

### **Step 1: Create Payment Request (as Department Head)**

1. **Stay logged in as Department Head** (or login again)

2. **Navigate to Payment Requests:**
   - Click: **Approvals** in sidebar
   - Click: **"New Payment Request"** quick action button (orange)

3. **Fill Form:**
   ```
   Payment Type: Reimbursement
   Payee Name: John Mensah
   Account Number: 1234567890
   Description: Fuel reimbursement for site visit to Tarkwa mine on Dec 10-12, 2024. Total distance: 850km
   Amount: 1200
   Due Date: (7 days from today)
   Notes: Receipts attached to email sent to finance@mining.com
   ```

4. **Submit:**
   - Click **"Create Payment Request"**
   - Should see: "Payment request created successfully!"
   - Redirect to: Payment Requests list

5. **Verify:**
   - New request: **PAY-000001**
   - Status: **Pending** (yellow badge)
   - Amount: **₵1,200**

### **Step 2: Check Notifications (as Accountant)**

1. **Logout**

2. **Login as Accountant:**
   - Email: `accountant@mining.com`
   - Password: `Accountant@1234`

3. **Check Bell:**
   - Should have: **"1"** notification
   - Click → "New Payment Request"
   - Amount: ₵1,200

### **Step 3: Reject Payment Request (Test Rejection Flow)**

1. **Click Notification** → Goes to detail page

2. **Review Request:**
   - All details visible
   - Payee: John Mensah
   - Amount: ₵1,200

3. **Reject Request:**
   - Click: **"Reject Payment"** (red button)
   - Modal appears
   - Add reason: "Please submit original fuel receipts. Email attachments are not sufficient for reimbursement processing."
   - Click: **"Reject"**

4. **Verify Rejection:**
   - Alert: "Payment request rejected"
   - Status: **REJECTED** (red badge)
   - Approval History shows:
     - Action: REJECTED (red badge)
     - By: Accountant
     - Comments: Your rejection reason
     - Timestamp

### **Step 4: Verify Creator Received Rejection**

1. **Logout**

2. **Login as Department Head**

3. **Check Notifications:**
   - Bell shows: **"1"** new notification
   - Click → "Payment Request Rejected"
   - Message shows rejection by Accountant

4. **View Request:**
   - Go to Payment Requests → PAY-000001
   - Status: **REJECTED**
   - Rejection reason visible in history

---

## 🔍 Test 3: Search & Filter Features

### **IT Requests Filters:**

1. **Login as IT Manager**

2. **Go to IT Requests page**

3. **Test Search:**
   - Search box → Type: "Laptop"
   - Should filter to show only requests with "Laptop" in title/number

4. **Test Status Filter:**
   - Dropdown → Select: "Approved"
   - Should show only approved requests
   - Select: "Pending" → Shows only pending
   - Select: "All Statuses" → Shows everything

### **Payment Requests Filters:**

1. **Same tests on Payment Requests page**

2. **Search by:**
   - Request number: "PAY-000001"
   - Payee name: "John Mensah"

3. **Filter by status:** Pending, Approved, Rejected

---

## 🎯 Test 4: Role-Based Access Control

### **Test 1: Employee Cannot Create IT Requests**

1. **Create employee user** (if you have one)
   - OR: Login with a role NOT in the allowed list

2. **Go to Approvals page:**
   - Should NOT see: "New IT Request" or "New Payment Request" buttons
   - Only sees: "Create Invoice" and "New Purchase Request" (if allowed)

### **Test 2: Department Head Cannot Approve**

1. **Login as Department Head**

2. **Go to any PENDING IT Request detail page:**
   - Should NOT see: "Approve Request" or "Reject Request" buttons
   - Only sees details and approval history

### **Test 3: IT Manager Can Only Approve IT Requests**

1. **Login as IT Manager**

2. **Go to Payment Requests:**
   - Can view payment requests
   - Open a PENDING payment request
   - Should NOT see: Approve/Reject buttons (only CFO/Accountant can)

---

## 📊 Test 5: Dashboard Integration

1. **Login as CEO** (has access to all)

2. **Go to Main Approvals Dashboard:**
   - Should see 4 quick action buttons:
     - ✅ Create Invoice (blue)
     - ✅ New Purchase Request (green)
     - ✅ New IT Request (purple)
     - ✅ New Payment Request (orange)

3. **Scroll down:**
   - Should see 4 cards:
     - Invoices
     - Purchase Requests
     - IT Requests (new)
     - Payment Requests (new)

4. **Click "View All →"** on IT Requests card:
   - Should navigate to IT Requests list page

5. **Click "View All →"** on Payment Requests card:
   - Should navigate to Payment Requests list page

---

## 🐛 Common Issues & Fixes

### **Issue 1: "Network Error" or "Failed to fetch"**
**Cause:** Backend not deployed or wrong API URL

**Fix:**
1. Check backend logs in Railway/Render
2. Verify backend is running: Visit backend URL in browser
3. Check `dev/frontend/.env.local` has correct `NEXT_PUBLIC_API_URL`

### **Issue 2: "404 Not Found" on API calls**
**Cause:** Backend routes not registered

**Fix:**
1. Backend needs restart after code changes
2. Check Railway/Render logs for startup errors
3. Verify `approvals.module.ts` has new controllers registered

### **Issue 3: No notifications appearing**
**Cause:** Notification service not triggered

**Fix:**
1. Check backend logs for notification creation errors
2. Verify user roles match the notifyITRequestApprovers/notifyPaymentRequestApprovers logic
3. Refresh page and click bell icon

### **Issue 4: "Unauthorized" or "Forbidden" errors**
**Cause:** JWT token expired or user lacks permissions

**Fix:**
1. Logout and login again (refreshes token)
2. Check user role in database matches required roles
3. Verify guards are working: Check backend logs for auth errors

### **Issue 5: Form submission fails with validation error**
**Cause:** Missing required fields or wrong data types

**Fix:**
1. Check browser console (F12) for detailed error
2. Ensure all required fields are filled
3. Amount must be a number, not empty string

---

## ✅ Success Criteria Checklist

Mark each as you test:

### **IT Requests:**
- [ ] Create IT request as Department Head
- [ ] IT Manager receives notification
- [ ] View request details page
- [ ] Approve request with comment
- [ ] Approval history appears
- [ ] Creator receives approval notification
- [ ] Search works correctly
- [ ] Status filter works correctly
- [ ] Non-IT-Manager cannot approve
- [ ] Priority badges display correctly

### **Payment Requests:**
- [ ] Create payment request as Department Head
- [ ] Accountant receives notification
- [ ] View request details page
- [ ] Reject request with reason (required)
- [ ] Rejection appears in history
- [ ] Creator receives rejection notification
- [ ] Search by payee name works
- [ ] Status filter works
- [ ] Non-finance roles cannot approve
- [ ] Amount displays with ₵ symbol

### **Integration:**
- [ ] All 4 quick action buttons appear on Approvals page
- [ ] IT Requests card appears on dashboard
- [ ] Payment Requests card appears on dashboard
- [ ] "View All" links work
- [ ] Backend compiles without errors
- [ ] Frontend builds without errors
- [ ] No console errors in browser (F12)
- [ ] Mobile responsive (test on phone or resize browser)

---

## 🎓 Testing Tips

1. **Use Multiple Browser Tabs:**
   - Tab 1: CEO/Approver account
   - Tab 2: Department Head/Creator account
   - Simulate real-world workflows

2. **Test Edge Cases:**
   - Try approving already-approved request (should fail)
   - Try rejecting without comment (should fail)
   - Try accessing detail page of non-existent ID

3. **Check Backend Logs:**
   - Railway/Render dashboard → View Logs
   - Look for SQL queries, notification creation
   - Check for any errors or warnings

4. **Monitor Database:**
   - Use Prisma Studio: `npx prisma studio`
   - Or connect to production DB with pgAdmin/TablePlus
   - Verify records created in `it_requests` and `payment_requests` tables

5. **Test Notifications Flow:**
   - Create request → Check approver gets notified (within 30 seconds)
   - Approve/Reject → Check creator gets notified
   - Click notification → Verify navigation works

---

## 📸 Screenshots to Capture (For Documentation)

If testing is successful, capture these:

1. IT Requests list page with data
2. IT Request creation form
3. IT Request detail page (pending)
4. IT Request detail page (approved with history)
5. Payment Requests list page
6. Payment Request detail page (rejected with history)
7. Main Approvals dashboard with 4 quick actions
8. Notification bell with unread count
9. Notification dropdown showing IT/Payment notifications

---

## 🎉 Test Complete!

Once all checkboxes are marked, Session 3.3b is **VERIFIED IN PRODUCTION** ✅

**Next Steps:**
- Proceed to Session 3.3c (Multi-level Approvals)
- OR move to Phase 4 (Inventory Module)
- OR create completion report documenting test results
