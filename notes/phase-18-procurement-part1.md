# Mining ERP - Phase 18: Automated Procurement/Supply Management

## Overview
**Phase:** 18  
**Duration:** Sessions 18.1 - 18.6 (6 sessions)  
**Objective:** Build end-to-end automated procurement and supply chain management tailored for mining operations.  
**Budget:** GH₵5,300  
**Requested By:** Solo, Procurement Manager

---

## Tech Stack Extensions
- **Backend:** NestJS + existing Prisma + Bull (job queues)
- **Frontend:** React + shadcn/ui + TailwindCSS
- **Notifications:** Email + In-app notifications
- **Integration:** Existing inventory, finance, and approval modules

## Implementation Status

- [x] Session 18.1: Requisition Management ✅ **COMPLETED**
- [ ] Session 18.2: Automated Approval Workflows
- [ ] Session 18.3: Vendor Management
- [ ] Session 18.4: Budget Integration
- [ ] Session 18.5: Procurement Analytics
- [ ] Session 18.6: Deployment & Training

---

# 📋 Session 18.1: Requisition Management System

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model Requisition {
  id              String            @id @default(uuid())
  requisitionNo   String            @unique
  title           String
  description     String?
  type            RequisitionType
  priority        Priority          @default(MEDIUM)
  status          RequisitionStatus @default(DRAFT)
  department      String
  projectId       String?
  project         Project?          @relation(fields: [projectId], references: [id])
  siteLocation    String            // Mining site location
  requiredDate    DateTime
  justification   String?
  totalEstimate   Decimal           @default(0) @db.Decimal(15, 2)
  currency        String            @default("GHS")
  
  // Requestor
  requestedById   String
  requestedBy     User              @relation("RequisitionRequestor", fields: [requestedById], references: [id])
  
  // Approval tracking
  currentStage    Int               @default(1)
  approvedById    String?
  approvedBy      User?             @relation("RequisitionApprover", fields: [approvedById], references: [id])
  approvedAt      DateTime?
  rejectedById    String?
  rejectedBy      User?             @relation("RequisitionRejecter", fields: [rejectedById], references: [id])
  rejectedAt      DateTime?
  rejectionReason String?
  
  // Relations
  items           RequisitionItem[]
  attachments     RequisitionAttachment[]
  approvalHistory RequisitionApproval[]
  rfqs            RFQ[]
  purchaseOrders  PurchaseOrder[]
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([status])
  @@index([requestedById])
  @@index([department])
  @@map("requisitions")
}

model RequisitionItem {
  id              String       @id @default(uuid())
  requisitionId   String
  requisition     Requisition  @relation(fields: [requisitionId], references: [id], onDelete: Cascade)
  itemName        String
  description     String?
  category        String       // Mining equipment, Safety gear, Consumables, etc.
  quantity        Decimal      @db.Decimal(10, 2)
  unit            String       // pieces, kg, liters, meters, etc.
  estimatedPrice  Decimal      @db.Decimal(15, 2)
  totalPrice      Decimal      @db.Decimal(15, 2)
  specifications  String?      // Technical specs for mining equipment
  preferredVendor String?
  stockItemId     String?      // Link to existing inventory item
  urgency         Priority     @default(MEDIUM)
  notes           String?
  
  @@map("requisition_items")
}

model RequisitionAttachment {
  id            String      @id @default(uuid())
  requisitionId String
  requisition   Requisition @relation(fields: [requisitionId], references: [id], onDelete: Cascade)
  fileName      String
  fileUrl       String
  fileType      String
  uploadedById  String
  uploadedAt    DateTime    @default(now())
  
  @@map("requisition_attachments")
}

model RequisitionApproval {
  id            String         @id @default(uuid())
  requisitionId String
  requisition   Requisition    @relation(fields: [requisitionId], references: [id], onDelete: Cascade)
  stage         Int
  approverId    String
  approver      User           @relation("RequisitionStageApprover", fields: [approverId], references: [id])
  status        ApprovalStatus @default(PENDING)
  comments      String?
  actionAt      DateTime?
  
  @@unique([requisitionId, stage])
  @@map("requisition_approvals")
}

enum RequisitionType {
  STOCK_REPLENISHMENT    // Regular inventory restock
  PROJECT_MATERIALS      // Project-specific materials
  EQUIPMENT_PURCHASE     // Heavy machinery, vehicles
  MAINTENANCE_PARTS      // Spare parts for equipment
  SAFETY_SUPPLIES        // PPE, safety equipment
  CONSUMABLES            // Fuel, lubricants, explosives
  EMERGENCY              // Urgent breakdown requirements
  CAPITAL_EXPENDITURE    // Large capital purchases
}

enum RequisitionStatus {
  DRAFT
  SUBMITTED
  PENDING_APPROVAL
  APPROVED
  PARTIALLY_APPROVED
  REJECTED
  CANCELLED
  IN_PROCUREMENT
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL  // For mining emergencies
}
```

### Requisition Service
```typescript
// Core requisition operations
- createRequisition(dto: CreateRequisitionDto, userId: string): Promise<Requisition>
- updateRequisition(id: string, dto: UpdateRequisitionDto): Promise<Requisition>
- submitRequisition(id: string, userId: string): Promise<Requisition>
- cancelRequisition(id: string, userId: string, reason: string): Promise<Requisition>
- getRequisitions(filters: RequisitionFilters): Promise<PaginatedResult<Requisition>>
- getRequisitionById(id: string): Promise<Requisition>
- getMyRequisitions(userId: string): Promise<Requisition[]>
- getPendingApprovals(userId: string): Promise<Requisition[]>
- generateRequisitionNumber(): string  // Format: REQ-2025-0001
- calculateTotalEstimate(items: RequisitionItem[]): Decimal
- checkBudgetAvailability(requisition: Requisition): Promise<BudgetCheck>
- convertToRFQ(requisitionId: string): Promise<RFQ>
- convertToPO(requisitionId: string, vendorId: string): Promise<PurchaseOrder>
```

### API Endpoints
```typescript
POST   /api/procurement/requisitions              // Create requisition
GET    /api/procurement/requisitions              // List with filters
GET    /api/procurement/requisitions/:id          // Get details
PUT    /api/procurement/requisitions/:id          // Update draft
DELETE /api/procurement/requisitions/:id          // Delete draft
POST   /api/procurement/requisitions/:id/submit   // Submit for approval
POST   /api/procurement/requisitions/:id/cancel   // Cancel requisition
GET    /api/procurement/requisitions/my           // My requisitions
GET    /api/procurement/requisitions/pending      // Pending my approval
POST   /api/procurement/requisitions/:id/items    // Add item
PUT    /api/procurement/requisitions/:id/items/:itemId  // Update item
DELETE /api/procurement/requisitions/:id/items/:itemId  // Remove item
POST   /api/procurement/requisitions/:id/attachments    // Upload attachment
GET    /api/procurement/requisitions/stats        // Statistics
```

## Frontend Deliverables

### Requisition Pages
- `/procurement/requisitions` - List all requisitions
- `/procurement/requisitions/new` - Create new requisition
- `/procurement/requisitions/:id` - View/edit requisition
- `/procurement/requisitions/pending` - Pending approvals

### Components
- `RequisitionForm` - Multi-step form for creating requisitions
- `RequisitionItemsTable` - Editable items table
- `RequisitionCard` - Summary card for lists
- `RequisitionTimeline` - Approval history timeline
- `RequisitionFilters` - Filter sidebar
- `QuickRequisition` - Quick add for common items

### Mining-Specific Features
- Site location selector (all mining sites)
- Equipment category dropdown (drilling, excavation, processing, etc.)
- Technical specifications field for machinery
- Emergency requisition fast-track option
- Link to equipment maintenance records

## Testing
- Create requisition with multiple items
- Submit for approval
- Cancel draft requisition
- Filter by department/status/priority
- Calculate totals correctly
- Attach supporting documents

---

# 📋 Session 18.2: Automated Approval Workflows

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model ProcurementWorkflow {
  id              String                @id @default(uuid())
  name            String
  description     String?
  type            RequisitionType?      // Specific type or null for all
  isActive        Boolean               @default(true)
  minAmount       Decimal?              @db.Decimal(15, 2)
  maxAmount       Decimal?              @db.Decimal(15, 2)
  stages          ProcurementWorkflowStage[]
  createdById     String
  createdBy       User                  @relation("WorkflowCreator", fields: [createdById], references: [id])
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  
  @@map("procurement_workflows")
}

model ProcurementWorkflowStage {
  id              String              @id @default(uuid())
  workflowId      String
  workflow        ProcurementWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  stageNumber     Int
  name            String
  approverRole    UserRole?           // Role-based approval
  approverId      String?             // Specific user approval
  approver        User?               @relation("StageApprover", fields: [approverId], references: [id])
  approvalType    ApprovalType        @default(SINGLE)
  escalationHours Int?                // Auto-escalate after X hours
  escalateTo      String?             // User ID to escalate to
  
  @@unique([workflowId, stageNumber])
  @@map("procurement_workflow_stages")
}

model ApprovalDelegation {
  id              String    @id @default(uuid())
  delegatorId     String
  delegator       User      @relation("Delegator", fields: [delegatorId], references: [id])
  delegateId      String
  delegate        User      @relation("Delegate", fields: [delegateId], references: [id])
  startDate       DateTime
  endDate         DateTime
  reason          String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  @@map("approval_delegations")
}

enum ApprovalType {
  SINGLE          // Any one approver
  ALL             // All approvers must approve
  MAJORITY        // Majority must approve
}
```

### Workflow Service
```typescript
// Workflow management
- createWorkflow(dto: CreateWorkflowDto): Promise<ProcurementWorkflow>
- updateWorkflow(id: string, dto: UpdateWorkflowDto): Promise<ProcurementWorkflow>
- deleteWorkflow(id: string): Promise<void>
- getWorkflows(): Promise<ProcurementWorkflow[]>
- getApplicableWorkflow(requisition: Requisition): Promise<ProcurementWorkflow>

// Approval processing
- approveRequisition(id: string, userId: string, comments?: string): Promise<Requisition>
- rejectRequisition(id: string, userId: string, reason: string): Promise<Requisition>
- requestMoreInfo(id: string, userId: string, questions: string): Promise<Requisition>
- escalateApproval(id: string): Promise<void>
- delegateApproval(dto: DelegationDto): Promise<ApprovalDelegation>
- getNextApprover(requisition: Requisition): Promise<User>
- checkAutoApproval(requisition: Requisition): Promise<boolean>

// Notifications
- notifyApprover(requisition: Requisition, approver: User): Promise<void>
- notifyRequestor(requisition: Requisition, action: string): Promise<void>
- sendEscalationNotice(requisition: Requisition): Promise<void>
```

### Default Mining Workflows
```typescript
const DEFAULT_WORKFLOWS = [
  {
    name: 'Standard Requisition (< GH₵5,000)',
    minAmount: 0,
    maxAmount: 5000,
    stages: [
      { stageNumber: 1, name: 'Department Head', approverRole: 'DEPARTMENT_HEAD' },
      { stageNumber: 2, name: 'Procurement Officer', approverRole: 'PROCUREMENT_OFFICER' }
    ]
  },
  {
    name: 'Medium Value (GH₵5,000 - GH₵50,000)',
    minAmount: 5000,
    maxAmount: 50000,
    stages: [
      { stageNumber: 1, name: 'Department Head', approverRole: 'DEPARTMENT_HEAD' },
      { stageNumber: 2, name: 'Operations Manager', approverRole: 'OPERATIONS_MANAGER' },
      { stageNumber: 3, name: 'CFO', approverRole: 'CFO' }
    ]
  },
  {
    name: 'High Value (> GH₵50,000)',
    minAmount: 50000,
    maxAmount: null,
    stages: [
      { stageNumber: 1, name: 'Department Head', approverRole: 'DEPARTMENT_HEAD' },
      { stageNumber: 2, name: 'Operations Manager', approverRole: 'OPERATIONS_MANAGER' },
      { stageNumber: 3, name: 'CFO', approverRole: 'CFO' },
      { stageNumber: 4, name: 'CEO', approverRole: 'CEO' }
    ]
  },
  {
    name: 'Emergency Requisition',
    type: 'EMERGENCY',
    stages: [
      { stageNumber: 1, name: 'Operations Manager', approverRole: 'OPERATIONS_MANAGER' }
    ]
  }
];
```

### API Endpoints
```typescript
// Workflow management
POST   /api/procurement/workflows                 // Create workflow
GET    /api/procurement/workflows                 // List workflows
PUT    /api/procurement/workflows/:id             // Update workflow
DELETE /api/procurement/workflows/:id             // Delete workflow

// Approval actions
POST   /api/procurement/requisitions/:id/approve  // Approve
POST   /api/procurement/requisitions/:id/reject   // Reject
POST   /api/procurement/requisitions/:id/request-info  // Request more info
POST   /api/procurement/requisitions/:id/escalate // Escalate

// Delegation
POST   /api/procurement/delegations               // Create delegation
GET    /api/procurement/delegations               // List delegations
DELETE /api/procurement/delegations/:id           // Cancel delegation
```

## Frontend Deliverables

### Workflow Management Pages
- `/settings/procurement/workflows` - Manage workflows
- `/settings/procurement/workflows/new` - Create workflow
- `/settings/procurement/workflows/:id` - Edit workflow

### Components
- `WorkflowBuilder` - Visual workflow stage builder
- `ApprovalPanel` - Approve/reject/request info panel
- `ApprovalTimeline` - Visual approval progress
- `DelegationModal` - Set up approval delegation
- `EscalationAlert` - Overdue approval warning

## Testing
- Create multi-stage workflow
- Auto-route based on amount
- Approve through all stages
- Reject with reason
- Escalation after timeout
- Delegation during absence

---

# 📋 Session 18.3: Supplier/Vendor Management

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model Vendor {
  id                String          @id @default(uuid())
  vendorCode        String          @unique
  companyName       String
  tradingName       String?
  type              VendorType
  category          String[]        // Equipment, Consumables, Services, etc.
  
  // Contact Information
  primaryContact    String
  email             String
  phone             String
  alternatePhone    String?
  website           String?
  
  // Address
  address           String
  city              String
  region            String
  country           String          @default("Ghana")
  postalCode        String?
  gpsCoordinates    String?         // For site deliveries
  
  // Business Details
  taxId             String?         // TIN
  businessRegNo     String?
  vatRegistered     Boolean         @default(false)
  vatNumber         String?
  
  // Banking
  bankName          String?
  bankBranch        String?
  accountNumber     String?
  accountName       String?
  swiftCode         String?
  
  // Terms
  paymentTerms      Int             @default(30) // Days
  creditLimit       Decimal?        @db.Decimal(15, 2)
  currency          String          @default("GHS")
  
  // Performance
  rating            Decimal         @default(0) @db.Decimal(3, 2) // 0-5
  totalOrders       Int             @default(0)
  totalSpend        Decimal         @default(0) @db.Decimal(15, 2)
  onTimeDelivery    Decimal         @default(0) @db.Decimal(5, 2) // Percentage
  qualityScore      Decimal         @default(0) @db.Decimal(5, 2)
  
  // Status
  status            VendorStatus    @default(PENDING)
  isPreferred       Boolean         @default(false)
  isBlacklisted     Boolean         @default(false)
  blacklistReason   String?
  
  // Compliance (Mining-specific)
  miningLicense     String?
  environmentalCert String?
  safetyCompliance  Boolean         @default(false)
  insuranceCert     String?
  insuranceExpiry   DateTime?
  
  // Relations
  contacts          VendorContact[]
  documents         VendorDocument[]
  products          VendorProduct[]
  rfqResponses      RFQResponse[]
  purchaseOrders    PurchaseOrder[]
  evaluations       VendorEvaluation[]
  
  createdById       String
  createdBy         User            @relation("VendorCreator", fields: [createdById], references: [id])
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([status])
  @@index([category])
  @@map("vendors")
}

model VendorContact {
  id          String  @id @default(uuid())
  vendorId    String
  vendor      Vendor  @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  name        String
  position    String?
  email       String
  phone       String
  isPrimary   Boolean @default(false)
  
  @@map("vendor_contacts")
}

model VendorDocument {
  id          String   @id @default(uuid())
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  type        String   // License, Certificate, Insurance, etc.
  name        String
  fileUrl     String
  expiryDate  DateTime?
  uploadedAt  DateTime @default(now())
  
  @@map("vendor_documents")
}

model VendorProduct {
  id            String  @id @default(uuid())
  vendorId      String
  vendor        Vendor  @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  productName   String
  category      String
  description   String?
  unitPrice     Decimal @db.Decimal(15, 2)
  unit          String
  leadTimeDays  Int?
  minOrderQty   Decimal? @db.Decimal(10, 2)
  
  @@map("vendor_products")
}

model VendorEvaluation {
  id              String   @id @default(uuid())
  vendorId        String
  vendor          Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  evaluatorId     String
  evaluator       User     @relation("VendorEvaluator", fields: [evaluatorId], references: [id])
  period          String   // Q1-2025, 2024, etc.
  qualityScore    Int      // 1-5
  deliveryScore   Int      // 1-5
  priceScore      Int      // 1-5
  serviceScore    Int      // 1-5
  safetyScore     Int      // 1-5 (Mining-specific)
  overallScore    Decimal  @db.Decimal(3, 2)
  comments        String?
  recommendation  String?
  evaluatedAt     DateTime @default(now())
  
  @@map("vendor_evaluations")
}

enum VendorType {
  MANUFACTURER
  DISTRIBUTOR
  WHOLESALER
  RETAILER
  SERVICE_PROVIDER
  CONTRACTOR
}

enum VendorStatus {
  PENDING         // Awaiting approval
  APPROVED        // Active vendor
  SUSPENDED       // Temporarily suspended
  BLACKLISTED     // Permanently blocked
  INACTIVE        // No longer used
}
```

### API Endpoints
```typescript
// Vendor CRUD
POST   /api/procurement/vendors                   // Create vendor
GET    /api/procurement/vendors                   // List vendors
GET    /api/procurement/vendors/:id               // Get vendor details
PUT    /api/procurement/vendors/:id               // Update vendor
DELETE /api/procurement/vendors/:id               // Delete vendor

// Vendor management
POST   /api/procurement/vendors/:id/approve       // Approve vendor
POST   /api/procurement/vendors/:id/suspend       // Suspend vendor
POST   /api/procurement/vendors/:id/blacklist     // Blacklist vendor
POST   /api/procurement/vendors/:id/reactivate    // Reactivate vendor

// Contacts & Documents
POST   /api/procurement/vendors/:id/contacts      // Add contact
POST   /api/procurement/vendors/:id/documents     // Upload document
GET    /api/procurement/vendors/:id/documents     // List documents

// Products
POST   /api/procurement/vendors/:id/products      // Add product
GET    /api/procurement/vendors/:id/products      // List products
PUT    /api/procurement/vendors/:id/products/:pid // Update product

// Evaluation
POST   /api/procurement/vendors/:id/evaluate      // Submit evaluation
GET    /api/procurement/vendors/:id/evaluations   // Get evaluations
GET    /api/procurement/vendors/:id/performance   // Performance metrics

// Search & Reports
GET    /api/procurement/vendors/search            // Search vendors
GET    /api/procurement/vendors/by-category/:cat  // By category
GET    /api/procurement/vendors/preferred         // Preferred vendors
GET    /api/procurement/vendors/expiring-docs     // Expiring documents
GET    /api/procurement/vendors/stats             // Vendor statistics
```

## Frontend Deliverables

### Vendor Pages
- `/procurement/vendors` - Vendor directory
- `/procurement/vendors/new` - Register new vendor
- `/procurement/vendors/:id` - Vendor profile
- `/procurement/vendors/:id/evaluate` - Evaluate vendor

### Components
- `VendorForm` - Multi-step registration form
- `VendorCard` - Summary card with rating
- `VendorProfile` - Full vendor details
- `VendorEvaluationForm` - Scorecard evaluation
- `VendorPerformanceChart` - Performance over time
- `ExpiringDocumentsAlert` - Document expiry warnings

## Testing
- Register new vendor
- Upload compliance documents
- Evaluate vendor performance
- Search by category
- Blacklist vendor
- Track expiring documents

---

*Continued in phase-18-procurement-part2.md*
