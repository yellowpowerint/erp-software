  **1. Create an Invoice:**
   •  Login as CFO or Accountant
   •  Go to Approvals → Invoices → Create Invoice
   •  Fill form and submit
   •  Note the invoice number

   **2. View and Approve Invoice:**
   •  Go back to Invoices list
   •  Click "View" on the invoice
   •  See full details displayed
   •  Click "Approve Invoice"
   •  Add optional comment
   •  Confirm approval

   **3. Check Approval History:**
   •  Refresh the detail page
   •  See green "APPROVED" badge
   •  View approval history showing your action
   •  See your comment displayed

   **4. Create and Reject Purchase Request:**
   •  Login as CEO or Procurement Officer
   •  Go to Approvals → Purchase Requests → New Request
   •  Fill form and submit
   •  Click "View" on the request
   •  Click "Reject Request"
   •  Must add reason for rejection
   •  Confirm rejection
   •  See red "REJECTED" badge and reason in history
---------

Test Complete Notification Flow:

   1. Create Invoice as CEO
     •  Login: ceo@mining.com / CEO@1234
     •  Create an invoice

   2. Check Notifications as CFO
     •  Login: cfo@mining.com / CFO@1234
     •  Bell should show 1 unread
     •  Click bell - see notification
     •  Click notification - goes to invoice

   3. Approve Invoice
     •  Approve it
     •  CEO should get notification

   4. Listen for Sound
     •  Leave CFO logged in
     •  Have CEO create another invoice
     •  Within 30 seconds, should hear ping sound
     •  Bell updates automatically



---------

 📋 **Session 3.3 Complete Plan:**

   **Part 1: Notifications System** (Starting now)

   **Part 2: IT Request Forms**

   **Part 3: Payment Request Forms**

   **Part 4: Multi-level Approval Chains**

--------
 🚀 Quick Start Testing (5 Minutes)

   **Step 1: Check Deployments (30 seconds)**
   1. Vercel: Go to https://vercel.com/dashboard → Check deployment status
   2. Backend: Check your Railway/Render dashboard for deployment completion

   **Step 2: Test IT Request Flow (2 minutes)**

   Create Request:
   1. Login: https://erp-swart-psi.vercel.app/login
     •  Email: dept-head@mining.com
     •  Password: DeptHead@1234
   2. Click Approvals → Click purple "New IT Request" button
   3. Fill form:
     •  Type: Equipment
     •  Priority: High
     •  Title: "Test Laptop Request"
     •  Description: "Testing IT requests"
     •  Justification: "QA testing"
     •  Estimated Cost: 1000
   4. Click "Create IT Request" → Should succeed

   Approve Request:
   1. Logout → Login as IT Manager:
     •  Email: it-manager@mining.com
     •  Password: ITManager@1234
   2. Click bell icon (top-right) → Should see notification
   3. Click notification → Opens request detail page
   4. Click "Approve Request" → Add comment → Approve
   5. ✅ Status changes to APPROVED (green)

   **Step 3: Test Payment Request Flow (2 minutes)**

   Create Request:
   1. Login as: dept-head@mining.com / DeptHead@1234
   2. Click Approvals → Orange "New Payment Request" button
   3. Fill form:
     •  Type: Reimbursement
     •  Payee: "Test User"
     •  Description: "Test payment"
     •  Amount: 500
   4. Submit → Should succeed

   Reject Request (testing rejection):
   1. Logout → Login as: accountant@mining.com / Accountant@1234
   2. Check bell → Click notification
   3. Click "Reject Payment" → Must add reason
   4. Add: "Testing rejection flow"
   5. Reject → ✅ Status shows REJECTED (red)

   **Step 4: Verify Dashboard (30 seconds)**
   1. Login as CEO: ceo@mining.com / CEO@1234
   2. Go to Approvals
   3. Should see 4 colored quick action buttons:
     •  🔵 Create Invoice
     •  🟢 New Purchase Request
     •  🟣 New IT Request ← NEW
     •  🟠 New Payment Request ← NEW
   4. Scroll down → See 4 cards including IT Requests & Payment Requests

   ──────────────────────────────────────────

   📋 Full Testing Guide

   I've created a complete testing guide here:
   `notes/session-3.3b-testing-guide.md`

   It includes:
   •  ✅ Complete test scenarios for IT & Payment requests
   •  ✅ Role-based access control tests
   •  ✅ Search & filter testing
   •  ✅ Notification flow verification
   •  ✅ Troubleshooting common issues
   •  ✅ Success criteria checklist (30 items)

   ──────────────────────────────────────────

   🔍 Quick Health Checks

   Backend is working if:
   •  Visit your backend URL → Shows welcome message
   •  Check logs → No errors during startup
   •  Prisma migrations ran successfully

   Frontend is working if:
   •  IT Requests page loads: /approvals/it-requests
   •  Payment Requests page loads: /approvals/payment-requests
   •  Create forms open without errors
   •  No console errors (press F12)


