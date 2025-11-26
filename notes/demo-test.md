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

-------

 ✅ Session 3.3c: Multi-Level Approval Workflows - COMPLETE!

   I've successfully implemented the complete multi-level approval workflow system for your Mining ERP!

   **📊 What Was Built:**

   Database (4 new tables + migration):
   •  ✅ ApprovalWorkflow - Workflow definitions with type and active status
   •  ✅ ApprovalStage - Sequential stages with role-based approvers
   •  ✅ WorkflowInstance - Tracks approval progress for each item
   •  ✅ StageAction - Full audit trail of approver actions
   •  ✅ Migration file with proper indexes and foreign keys

   Backend (2 new files, ~490 lines):
   •  ✅ WorkflowsService (~400 lines) - Complete CRUD + approval routing logic
   •  ✅ WorkflowsController (~90 lines) - 9 RESTful endpoints
   •  ✅ Seed 4 default workflows for Invoice, Purchase, IT, and Payment requests
   •  ✅ Auto-routing to next stage on approval
   •  ✅ Role-based permission checks per stage
   •  ✅ Full audit trail with comments

   Frontend (2 new components, ~430 lines):
   •  ✅ WorkflowProgress component (~220 lines) - Visual timeline with icons
   •  ✅ Workflows admin page (~210 lines) - Manage and view workflows
   •  ✅ Stage-by-stage progress display
   •  ✅ Approval history with comments and timestamps
   •  ✅ Color-coded status indicators

   **🔄 How It Works:**

   4 Default Workflows Created:
   1. Standard Invoice Approval - 2 stages (CFO → CEO)
   2. Purchase Request Approval - 3 stages (Dept Head → Procurement → CFO)
   3. IT Request Approval - 2 stages (IT Manager → CFO)
   4. Payment Request Approval - 2 stages (Accountant → CFO)

   Approval Flow:

     1. User creates request → Workflow initializes at Stage 1
     2. Stage 1 approver receives notification
     3. Approver approves → Auto-routes to Stage 2
     4. Stage 2 approver receives notification
     5. Approver approves → Workflow completes as APPROVED
        (OR rejects at any stage → Workflow ends as REJECTED)

   **✨ Key Features:**

   •  Sequential Approval: Must go through stages in order
   •  Auto-Routing: System automatically moves to next stage
   •  Role-Based: Only authorized roles can approve each stage
   •  Visual Timeline: See all stages with current progress
   •  Audit Trail: Every action recorded with comments
   •  Flexible: Admins can configure custom workflows
   •  Backward Compatible: Works alongside existing single-level approvals

   **🎯 Usage:**

   For Administrators:
   1. Go to: /approvals/workflows
   2. Click: "Seed Default Workflows"
   3. View: All configured workflows with stages

   For Users:
   1. Create any request (invoice, purchase, etc.)
   2. Open detail page
   3. See "Approval Workflow" section showing:
     •  Current stage (orange clock)
     •  Completed stages (green checkmark)
     •  Future stages (gray circle)
     •  Full history with comments

   **📈 Code Stats:**
   •  Total: 1,700 lines added across 9 files
   •  Backend: ~490 lines
   •  Frontend: ~430 lines
   •  Migration SQL: ~100 lines
   •  Documentation: ~680 lines

   **🚀 Deployment Status:**
   •  ✅ Committed to Git (f33c730)
   •  ✅ Pushed to GitHub
   •  🔄 Vercel deploying frontend (1-2 minutes)
   •  🔄 Railway/Render deploying backend + running migrations (2-3 minutes)

   **📋 Testing Guide:**

   Quick Test:
   1. Login as CEO: ceo@mining.com / CEO@1234
   2. Go to: Approvals → Workflows
   3. Click: "Seed Default Workflows"
   4. Create an invoice as Accountant
   5. Open invoice detail → See 2-stage workflow
   6. Login as CFO → Approve Stage 1
   7. Login as CEO → Approve Stage 2
   8. See workflow complete as APPROVED ✓

   Complete testing instructions: See notes/session-3.3c-completion.md

   ──────────────────────────────────────────

   🎉 Phase 3 Complete!

   All Approvals & Workflows modules are now finished:
   •  ✅ Session 3.1: Workflow Engine Setup
   •  ✅ Session 3.2: Invoice & Purchase Approvals
   •  ✅ Session 3.3a: Notifications System
   •  ✅ Session 3.3b: IT & Payment Requests
   •  ✅ Session 3.3c: Multi-Level Approval Workflows

---------

🔮 What's Next? (Your Choice)

   Option 1: Start Phase 7 (AI Intelligence Layer)
   •  AI-powered insights and predictions
   •  Smart recommendations
   •  Predictive analytics
   •  Natural language queries
   •  Maintenance predictions
   •  Procurement advisor

   Option 2: Start Phase 9 (HR & Personnel Management)
   •  Employee management
   •  Attendance tracking
   •  Performance reviews
   •  Payroll system
   •  Leave management

   Option 3: Create Comprehensive Documentation
   •  Phase 5 completion report
   •  Phase 6 completion report
   •  API documentation
   •  User guides
   •  System architecture

   Option 4: Start Phase 10 (Mining Intelligence & Analytics)
   •  Advanced reports
   •  KPI dashboards
   •  Production analytics
   •  Financial reports
   •  Custom report builder

   What would you like me to do next?

---------

│ ○ Review all completed phases and features                                                                                                                    │
│ ○ Verify backend and frontend deployments                                                                                                                     │
│ ○ Create project handover document                                                                                                                            │
│ ○ Create final testing checklist                                                                                                                              │
│ ○ Document known issues and limitations                                                                                                                       │
│ ○ Create project completion report                                                                                                                            │
│ ○ Final commit for Phase 14.3       

