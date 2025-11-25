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


   **Session 3.3a: Notifications System (2-3 hours)** ⭐ **Do This Now**
   •  ✅ Database models (DONE!)
   •  Backend notification service
   •  Frontend notification bell
   •  Sound alerts
   •  Auto-assign invoices/purchases to approvers

   **Session 3.3b: IT & Payment Requests (3-4 hours)**
   •  Backend services
   •  Frontend forms and lists
   •  Similar to invoices/purchases

   **Session 3.3c: Multi-level Approvals (3-4 hours)**
   •  Workflow configuration
   •  Sequential approval chains
   •  Approval routing logic

---------

 🔄 **Remaining Work (Frontend):**

   1. Notification Bell Component (30 min)
     •  Bell icon in TopBar
     •  Badge showing unread count
     •  Click to open dropdown

   2. Notification Dropdown/Center (45 min)
     •  List of notifications
     •  Mark as read on click
     •  Links to relevant items
     •  Mark all as read button
     •  Delete individual notifications

   3. Sound Alerts (15 min)
     •  Notification sound file
     •  Play sound when new notification arrives
     •  Polling mechanism (check every 30 seconds)

