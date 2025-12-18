# Mining ERP - Phase 18: Automated Procurement/Supply Management (Part 2)

*Continued from phase-18-procurement-part1.md*

---

# 📋 Session 18.4: RFQ, Bidding & Purchase Order Management

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model RFQ {
  id              String        @id @default(uuid())
  rfqNumber       String        @unique
  title           String
  description     String?
  requisitionId   String?
  requisition     Requisition?  @relation(fields: [requisitionId], references: [id])
  status          RFQStatus     @default(DRAFT)
  
  // Timeline
  issueDate       DateTime?
  responseDeadline DateTime
  validityPeriod  Int           @default(30) // Days quote is valid
  
  // Terms
  deliveryLocation String
  deliveryTerms   String?
  paymentTerms    String?
  specialConditions String?
  
  // Mining-specific
  siteAccess      String?       // Site access requirements
  safetyRequirements String?
  technicalSpecs  String?
  
  // Relations
  items           RFQItem[]
  invitedVendors  RFQVendorInvite[]
  responses       RFQResponse[]
  selectedResponse String?      // Winning vendor response ID
  
  createdById     String
  createdBy       User          @relation("RFQCreator", fields: [createdById], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([status])
  @@map("rfqs")
}

model RFQItem {
  id              String    @id @default(uuid())
  rfqId           String
  rfq             RFQ       @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  itemName        String
  description     String?
  specifications  String?
  quantity        Decimal   @db.Decimal(10, 2)
  unit            String
  estimatedPrice  Decimal?  @db.Decimal(15, 2)
  
  @@map("rfq_items")
}

model RFQVendorInvite {
  id          String    @id @default(uuid())
  rfqId       String
  rfq         RFQ       @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  vendorId    String
  vendor      Vendor    @relation(fields: [vendorId], references: [id])
  invitedAt   DateTime  @default(now())
  viewedAt    DateTime?
  status      String    @default("INVITED") // INVITED, VIEWED, RESPONDED, DECLINED
  
  @@unique([rfqId, vendorId])
  @@map("rfq_vendor_invites")
}

model RFQResponse {
  id              String          @id @default(uuid())
  rfqId           String
  rfq             RFQ             @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  vendorId        String
  vendor          Vendor          @relation(fields: [vendorId], references: [id])
  status          ResponseStatus  @default(SUBMITTED)
  
  // Pricing
  totalAmount     Decimal         @db.Decimal(15, 2)
  currency        String          @default("GHS")
  validUntil      DateTime
  
  // Terms offered
  deliveryDays    Int
  paymentTerms    String?
  warranty        String?
  
  // Documents
  quotationDoc    String?         // Uploaded quote document
  technicalDoc    String?         // Technical proposal
  
  // Evaluation
  technicalScore  Decimal?        @db.Decimal(5, 2)
  commercialScore Decimal?        @db.Decimal(5, 2)
  overallScore    Decimal?        @db.Decimal(5, 2)
  evaluationNotes String?
  
  items           RFQResponseItem[]
  
  submittedAt     DateTime        @default(now())
  evaluatedAt     DateTime?
  
  @@unique([rfqId, vendorId])
  @@map("rfq_responses")
}

model RFQResponseItem {
  id            String      @id @default(uuid())
  responseId    String
  response      RFQResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  rfqItemId     String
  unitPrice     Decimal     @db.Decimal(15, 2)
  totalPrice    Decimal     @db.Decimal(15, 2)
  leadTimeDays  Int?
  notes         String?
  
  @@map("rfq_response_items")
}

model PurchaseOrder {
  id              String        @id @default(uuid())
  poNumber        String        @unique
  requisitionId   String?
  requisition     Requisition?  @relation(fields: [requisitionId], references: [id])
  rfqResponseId   String?
  vendorId        String
  vendor          Vendor        @relation(fields: [vendorId], references: [id])
  status          POStatus      @default(DRAFT)
  
  // Amounts
  subtotal        Decimal       @db.Decimal(15, 2)
  taxAmount       Decimal       @default(0) @db.Decimal(15, 2)
  discountAmount  Decimal       @default(0) @db.Decimal(15, 2)
  shippingCost    Decimal       @default(0) @db.Decimal(15, 2)
  totalAmount     Decimal       @db.Decimal(15, 2)
  currency        String        @default("GHS")
  
  // Delivery
  deliveryAddress String
  deliverySite    String?       // Mining site
  expectedDelivery DateTime
  actualDelivery  DateTime?
  deliveryTerms   String?
  
  // Payment
  paymentTerms    Int           @default(30)
  paymentStatus   PaymentStatus @default(UNPAID)
  
  // Approval
  approvedById    String?
  approvedBy      User?         @relation("POApprover", fields: [approvedById], references: [id])
  approvedAt      DateTime?
  
  // Relations
  items           PurchaseOrderItem[]
  receipts        GoodsReceipt[]
  invoices        VendorInvoice[]
  
  createdById     String
  createdBy       User          @relation("POCreator", fields: [createdById], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([status])
  @@index([vendorId])
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id              String        @id @default(uuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  itemName        String
  description     String?
  quantity        Decimal       @db.Decimal(10, 2)
  unit            String
  unitPrice       Decimal       @db.Decimal(15, 2)
  totalPrice      Decimal       @db.Decimal(15, 2)
  receivedQty     Decimal       @default(0) @db.Decimal(10, 2)
  stockItemId     String?       // Link to inventory
  
  @@map("purchase_order_items")
}

enum RFQStatus {
  DRAFT
  PUBLISHED
  CLOSED
  EVALUATING
  AWARDED
  CANCELLED
}

enum ResponseStatus {
  SUBMITTED
  UNDER_REVIEW
  SHORTLISTED
  SELECTED
  REJECTED
}

enum POStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SENT
  ACKNOWLEDGED
  PARTIALLY_RECEIVED
  RECEIVED
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
  OVERDUE
}
```

### API Endpoints
```typescript
// RFQ Management
POST   /api/procurement/rfqs                      // Create RFQ
GET    /api/procurement/rfqs                      // List RFQs
GET    /api/procurement/rfqs/:id                  // Get RFQ details
PUT    /api/procurement/rfqs/:id                  // Update RFQ
POST   /api/procurement/rfqs/:id/publish          // Publish RFQ
POST   /api/procurement/rfqs/:id/close            // Close RFQ
POST   /api/procurement/rfqs/:id/invite           // Invite vendors
POST   /api/procurement/rfqs/:id/evaluate         // Evaluate responses
POST   /api/procurement/rfqs/:id/award            // Award to vendor

// RFQ Responses (Vendor Portal)
GET    /api/procurement/rfqs/invited              // RFQs I'm invited to
POST   /api/procurement/rfqs/:id/respond          // Submit response
PUT    /api/procurement/rfqs/:id/response         // Update response

// Purchase Orders
POST   /api/procurement/purchase-orders           // Create PO
GET    /api/procurement/purchase-orders           // List POs
GET    /api/procurement/purchase-orders/:id       // Get PO details
PUT    /api/procurement/purchase-orders/:id       // Update PO
POST   /api/procurement/purchase-orders/:id/approve   // Approve PO
POST   /api/procurement/purchase-orders/:id/send      // Send to vendor
POST   /api/procurement/purchase-orders/:id/cancel    // Cancel PO
GET    /api/procurement/purchase-orders/:id/pdf       // Generate PDF
POST   /api/procurement/purchase-orders/from-rfq/:responseId  // Create from RFQ
```

## Frontend Deliverables

### RFQ Pages
- `/procurement/rfqs` - RFQ list
- `/procurement/rfqs/new` - Create RFQ
- `/procurement/rfqs/:id` - RFQ details & responses
- `/procurement/rfqs/:id/evaluate` - Evaluate responses

### Purchase Order Pages
- `/procurement/purchase-orders` - PO list
- `/procurement/purchase-orders/new` - Create PO
- `/procurement/purchase-orders/:id` - PO details

### Components
- `RFQForm` - Create/edit RFQ
- `VendorSelector` - Select vendors to invite
- `ResponseComparison` - Side-by-side comparison
- `BidEvaluationMatrix` - Scoring matrix
- `POForm` - Create/edit purchase order
- `POPreview` - PDF preview
- `POTimeline` - Order status timeline

---

# 📋 Session 18.5: Receiving, Inspection & Invoice Matching

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model GoodsReceipt {
  id              String              @id @default(uuid())
  grnNumber       String              @unique  // Goods Receipt Note
  purchaseOrderId String
  purchaseOrder   PurchaseOrder       @relation(fields: [purchaseOrderId], references: [id])
  receivedDate    DateTime            @default(now())
  receivedById    String
  receivedBy      User                @relation("GoodsReceiver", fields: [receivedById], references: [id])
  
  // Location
  warehouseId     String?
  siteLocation    String
  
  // Delivery details
  deliveryNote    String?
  carrierName     String?
  vehicleNumber   String?
  driverName      String?
  
  // Status
  status          ReceiptStatus       @default(PENDING_INSPECTION)
  
  // Relations
  items           GoodsReceiptItem[]
  inspections     QualityInspection[]
  
  notes           String?
  createdAt       DateTime            @default(now())
  
  @@index([purchaseOrderId])
  @@map("goods_receipts")
}

model GoodsReceiptItem {
  id              String        @id @default(uuid())
  goodsReceiptId  String
  goodsReceipt    GoodsReceipt  @relation(fields: [goodsReceiptId], references: [id], onDelete: Cascade)
  poItemId        String
  itemName        String
  orderedQty      Decimal       @db.Decimal(10, 2)
  receivedQty     Decimal       @db.Decimal(10, 2)
  acceptedQty     Decimal       @default(0) @db.Decimal(10, 2)
  rejectedQty     Decimal       @default(0) @db.Decimal(10, 2)
  unit            String
  condition       ItemCondition @default(GOOD)
  notes           String?
  
  @@map("goods_receipt_items")
}

model QualityInspection {
  id              String            @id @default(uuid())
  goodsReceiptId  String
  goodsReceipt    GoodsReceipt      @relation(fields: [goodsReceiptId], references: [id], onDelete: Cascade)
  inspectorId     String
  inspector       User              @relation("QualityInspector", fields: [inspectorId], references: [id])
  inspectionDate  DateTime          @default(now())
  
  // Results
  overallResult   InspectionResult
  qualityScore    Int?              // 1-100
  
  // Checklist
  visualCheck     Boolean           @default(false)
  quantityCheck   Boolean           @default(false)
  specCheck       Boolean           @default(false)
  documentCheck   Boolean           @default(false)
  safetyCheck     Boolean           @default(false)  // Mining equipment safety
  
  findings        String?
  recommendations String?
  photos          String[]          // Inspection photos
  
  @@map("quality_inspections")
}

model VendorInvoice {
  id              String          @id @default(uuid())
  invoiceNumber   String
  vendorId        String
  vendor          Vendor          @relation(fields: [vendorId], references: [id])
  purchaseOrderId String?
  purchaseOrder   PurchaseOrder?  @relation(fields: [purchaseOrderId], references: [id])
  
  // Amounts
  subtotal        Decimal         @db.Decimal(15, 2)
  taxAmount       Decimal         @default(0) @db.Decimal(15, 2)
  totalAmount     Decimal         @db.Decimal(15, 2)
  currency        String          @default("GHS")
  
  // Dates
  invoiceDate     DateTime
  dueDate         DateTime
  receivedDate    DateTime        @default(now())
  
  // Matching
  matchStatus     MatchStatus     @default(PENDING)
  matchedAt       DateTime?
  matchedById     String?
  matchedBy       User?           @relation("InvoiceMatcher", fields: [matchedById], references: [id])
  
  // Discrepancies
  priceVariance   Decimal         @default(0) @db.Decimal(15, 2)
  quantityVariance Decimal        @default(0) @db.Decimal(10, 2)
  discrepancyNotes String?
  
  // Payment
  paymentStatus   PaymentStatus   @default(UNPAID)
  paidAmount      Decimal         @default(0) @db.Decimal(15, 2)
  paidAt          DateTime?
  
  // Documents
  invoiceDocument String?
  
  items           VendorInvoiceItem[]
  payments        VendorPayment[]
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@unique([vendorId, invoiceNumber])
  @@index([matchStatus])
  @@map("vendor_invoices")
}

model VendorInvoiceItem {
  id            String        @id @default(uuid())
  invoiceId     String
  invoice       VendorInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description   String
  quantity      Decimal       @db.Decimal(10, 2)
  unitPrice     Decimal       @db.Decimal(15, 2)
  totalPrice    Decimal       @db.Decimal(15, 2)
  poItemId      String?       // Link to PO item for matching
  
  @@map("vendor_invoice_items")
}

model VendorPayment {
  id            String        @id @default(uuid())
  invoiceId     String
  invoice       VendorInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount        Decimal       @db.Decimal(15, 2)
  paymentDate   DateTime
  paymentMethod String        // Bank Transfer, Cheque, etc.
  reference     String?
  processedById String
  processedBy   User          @relation("PaymentProcessor", fields: [processedById], references: [id])
  notes         String?
  
  @@map("vendor_payments")
}

enum ReceiptStatus {
  PENDING_INSPECTION
  INSPECTING
  ACCEPTED
  PARTIALLY_ACCEPTED
  REJECTED
}

enum ItemCondition {
  GOOD
  DAMAGED
  DEFECTIVE
  WRONG_ITEM
}

enum InspectionResult {
  PASSED
  PASSED_WITH_NOTES
  FAILED
  PENDING_REVIEW
}

enum MatchStatus {
  PENDING
  MATCHED
  PARTIAL_MATCH
  MISMATCH
  DISPUTED
  RESOLVED
}
```

### Three-Way Matching Service
```typescript
// Automated invoice matching
- matchInvoiceToPO(invoiceId: string): Promise<MatchResult>
- matchInvoiceToGRN(invoiceId: string): Promise<MatchResult>
- performThreeWayMatch(invoiceId: string): Promise<ThreeWayMatchResult>
- calculateVariances(invoice: VendorInvoice, po: PurchaseOrder, grn: GoodsReceipt): Variances
- flagDiscrepancies(matchResult: MatchResult): Promise<void>
- autoApproveIfMatched(invoiceId: string, tolerancePercent: number): Promise<boolean>
```

### API Endpoints
```typescript
// Goods Receipt
POST   /api/procurement/goods-receipts            // Create GRN
GET    /api/procurement/goods-receipts            // List GRNs
GET    /api/procurement/goods-receipts/:id        // Get GRN details
PUT    /api/procurement/goods-receipts/:id        // Update GRN
POST   /api/procurement/goods-receipts/:id/inspect    // Submit inspection
POST   /api/procurement/goods-receipts/:id/accept     // Accept goods
POST   /api/procurement/goods-receipts/:id/reject     // Reject goods

// Vendor Invoices
POST   /api/procurement/invoices                  // Record invoice
GET    /api/procurement/invoices                  // List invoices
GET    /api/procurement/invoices/:id              // Get invoice details
POST   /api/procurement/invoices/:id/match        // Run matching
POST   /api/procurement/invoices/:id/approve      // Approve for payment
POST   /api/procurement/invoices/:id/dispute      // Raise dispute
GET    /api/procurement/invoices/pending-match    // Pending matching
GET    /api/procurement/invoices/discrepancies    // With discrepancies

// Payments
POST   /api/procurement/invoices/:id/pay          // Record payment
GET    /api/procurement/payments                  // Payment history
GET    /api/procurement/payments/due              // Upcoming payments
```

## Frontend Deliverables

### Receiving Pages
- `/procurement/receiving` - Pending deliveries
- `/procurement/receiving/:poId` - Receive goods
- `/procurement/goods-receipts` - GRN list
- `/procurement/goods-receipts/:id` - GRN details

### Invoice Pages
- `/procurement/invoices` - Invoice list
- `/procurement/invoices/new` - Record invoice
- `/procurement/invoices/:id` - Invoice details & matching
- `/procurement/invoices/pending` - Pending approval

### Components
- `ReceivingForm` - Record goods receipt
- `InspectionChecklist` - Quality inspection form
- `ThreeWayMatchView` - PO vs GRN vs Invoice comparison
- `DiscrepancyAlert` - Variance warnings
- `PaymentSchedule` - Upcoming payments
- `InvoiceApprovalPanel` - Approve/dispute invoice

---

# 📋 Session 18.6: Inventory Integration, Reporting & Analytics

**Duration:** 1 session

## Backend Deliverables

### Inventory Integration Service
```typescript
// Auto-update inventory on goods receipt
- updateInventoryOnReceipt(grnId: string): Promise<void>
- reserveStockForRequisition(requisitionId: string): Promise<void>
- releaseReservedStock(requisitionId: string): Promise<void>
- checkStockAvailability(items: RequisitionItem[]): Promise<AvailabilityResult>
- generateReorderRequisition(stockItemId: string): Promise<Requisition>
- syncProcurementWithInventory(): Promise<SyncResult>
```

### Reporting Service
```typescript
// Procurement reports
- getSpendAnalysis(filters: SpendFilters): Promise<SpendReport>
- getVendorPerformanceReport(vendorId?: string): Promise<VendorReport>
- getProcurementCycleTime(): Promise<CycleTimeReport>
- getSavingsReport(period: DateRange): Promise<SavingsReport>
- getComplianceReport(): Promise<ComplianceReport>
- getPendingActionsReport(userId: string): Promise<ActionsReport>

// Mining-specific reports
- getEquipmentProcurementReport(): Promise<EquipmentReport>
- getConsumablesUsageReport(): Promise<ConsumablesReport>
- getSiteWiseSpendReport(): Promise<SiteSpendReport>
- getSafetyEquipmentReport(): Promise<SafetyReport>
```

### Dashboard Metrics
```typescript
interface ProcurementDashboard {
  // Summary
  totalSpendMTD: Decimal;
  totalSpendYTD: Decimal;
  openRequisitions: number;
  pendingApprovals: number;
  openPOs: number;
  pendingDeliveries: number;
  unpaidInvoices: number;
  overduePayments: number;
  
  // Trends
  spendByMonth: MonthlySpend[];
  spendByCategory: CategorySpend[];
  spendBySite: SiteSpend[];
  
  // Vendor metrics
  topVendors: VendorSpend[];
  vendorPerformance: VendorScore[];
  
  // Efficiency
  avgCycleTime: number;  // Days from requisition to delivery
  onTimeDeliveryRate: number;
  invoiceMatchRate: number;
  
  // Alerts
  expiringContracts: Contract[];
  lowStockItems: StockItem[];
  overdueDeliveries: PurchaseOrder[];
}
```

### API Endpoints
```typescript
// Dashboard
GET    /api/procurement/dashboard                 // Dashboard metrics
GET    /api/procurement/dashboard/spend           // Spend analysis
GET    /api/procurement/dashboard/vendors         // Vendor performance

// Reports
GET    /api/procurement/reports/spend             // Spend report
GET    /api/procurement/reports/vendors           // Vendor report
GET    /api/procurement/reports/cycle-time        // Cycle time report
GET    /api/procurement/reports/savings           // Savings report
GET    /api/procurement/reports/compliance        // Compliance report
GET    /api/procurement/reports/equipment         // Equipment procurement
GET    /api/procurement/reports/consumables       // Consumables usage
GET    /api/procurement/reports/by-site           // Site-wise spend

// Integration
POST   /api/procurement/inventory/sync            // Sync with inventory
GET    /api/procurement/inventory/reorder-alerts  // Items needing reorder
POST   /api/procurement/inventory/auto-requisition // Auto-generate requisition
```

## Frontend Deliverables

### Dashboard & Reports Pages
- `/procurement` - Procurement dashboard
- `/procurement/reports` - Reports hub
- `/procurement/reports/spend` - Spend analysis
- `/procurement/reports/vendors` - Vendor performance
- `/procurement/analytics` - Advanced analytics

### Components
- `ProcurementDashboard` - Main dashboard
- `SpendChart` - Spend visualization
- `VendorLeaderboard` - Top vendors
- `CycleTimeChart` - Process efficiency
- `ReorderAlerts` - Low stock warnings
- `ProcurementKPIs` - Key metrics cards

---

# 📊 Phase 18 Summary

## Database Tables Added
1. requisitions
2. requisition_items
3. requisition_attachments
4. requisition_approvals
5. procurement_workflows
6. procurement_workflow_stages
7. approval_delegations
8. vendors
9. vendor_contacts
10. vendor_documents
11. vendor_products
12. vendor_evaluations
13. rfqs
14. rfq_items
15. rfq_vendor_invites
16. rfq_responses
17. rfq_response_items
18. purchase_orders
19. purchase_order_items
20. goods_receipts
21. goods_receipt_items
22. quality_inspections
23. vendor_invoices
24. vendor_invoice_items
25. vendor_payments

**Total: 25 new tables**

## API Endpoints: ~120 new endpoints

## Frontend Pages: ~20 new pages

## Estimated Development Time
- Session 18.1: 5-6 hours
- Session 18.2: 4-5 hours
- Session 18.3: 5-6 hours
- Session 18.4: 6-7 hours
- Session 18.5: 5-6 hours
- Session 18.6: 4-5 hours

**Total: 29-35 hours**

---

**Author:** Mining ERP Development Team  
**Budget:** GH₵5,300  
**Status:** Ready for Implementation
