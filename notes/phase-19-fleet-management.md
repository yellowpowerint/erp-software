# Mining ERP - Phase 19: Fleet Management Module

## Overview
**Phase:** 19  
**Duration:** Sessions 19.1 - 19.5 (5 sessions)  
**Objective:** Comprehensive fleet management system for mining operations including vehicles, heavy machinery, equipment tracking, maintenance, fuel consumption, and cost analysis.  
**Budget:** GH₵2,300  
**Priority:** High (Critical for mining operations)

---

## Tech Stack Extensions
- **Backend:** NestJS + Prisma + Bull (scheduled jobs)
- **Frontend:** React + shadcn/ui + Recharts (analytics)
- **Tracking:** GPS integration ready (future enhancement)
- **Notifications:** Email + In-app + SMS (critical alerts)

---

# 📋 Session 19.1: Fleet Asset Registry & Equipment Management

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model FleetAsset {
  id                String          @id @default(uuid())
  assetCode         String          @unique
  name              String
  type              FleetAssetType
  category          String          // Excavator, Dump Truck, Drill Rig, etc.
  
  // Identification
  registrationNo    String?         // For road vehicles
  serialNumber      String?
  engineNumber      String?
  chassisNumber     String?
  
  // Specifications
  make              String
  model             String
  year              Int
  capacity          String?         // Load capacity, engine power, etc.
  fuelType          FuelType
  tankCapacity      Decimal?        @db.Decimal(10, 2) // Liters
  
  // Acquisition
  purchaseDate      DateTime?
  purchasePrice     Decimal?        @db.Decimal(15, 2)
  vendor            String?
  warrantyExpiry    DateTime?
  
  // Current Status
  status            AssetStatus     @default(ACTIVE)
  condition         AssetCondition  @default(GOOD)
  currentLocation   String          // Site/Warehouse
  currentOperator   String?
  operatorId        String?
  operator          User?           @relation("AssetOperator", fields: [operatorId], references: [id])
  
  // Odometer/Hours
  currentOdometer   Decimal         @default(0) @db.Decimal(12, 2) // km
  currentHours      Decimal         @default(0) @db.Decimal(12, 2) // Operating hours
  lastOdometerUpdate DateTime?
  
  // Depreciation
  depreciationMethod String         @default("STRAIGHT_LINE")
  usefulLifeYears   Int             @default(10)
  salvageValue      Decimal         @default(0) @db.Decimal(15, 2)
  currentValue      Decimal?        @db.Decimal(15, 2)
  
  // Insurance
  insuranceProvider String?
  insurancePolicyNo String?
  insuranceExpiry   DateTime?
  insurancePremium  Decimal?        @db.Decimal(15, 2)
  
  // Compliance (Mining-specific)
  miningPermit      String?
  permitExpiry      DateTime?
  safetyInspection  DateTime?
  nextInspectionDue DateTime?
  emissionsCert     String?
  emissionsExpiry   DateTime?
  
  // Relations
  documents         FleetDocument[]
  maintenanceRecords MaintenanceRecord[]
  fuelRecords       FuelRecord[]
  usageLogs         UsageLog[]
  breakdowns        BreakdownLog[]
  assignments       FleetAssignment[]
  inspections       FleetInspection[]
  costs             FleetCost[]
  
  createdById       String
  createdBy         User            @relation("FleetCreator", fields: [createdById], references: [id])
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@index([type])
  @@index([status])
  @@index([currentLocation])
  @@map("fleet_assets")
}

model FleetDocument {
  id          String      @id @default(uuid())
  assetId     String
  asset       FleetAsset  @relation(fields: [assetId], references: [id], onDelete: Cascade)
  type        String      // Registration, Insurance, Permit, Manual, etc.
  name        String
  fileUrl     String
  expiryDate  DateTime?
  uploadedById String
  uploadedAt  DateTime    @default(now())
  
  @@map("fleet_documents")
}

model FleetAssignment {
  id          String      @id @default(uuid())
  assetId     String
  asset       FleetAsset  @relation(fields: [assetId], references: [id], onDelete: Cascade)
  operatorId  String
  operator    User        @relation("FleetOperator", fields: [operatorId], references: [id])
  projectId   String?
  project     Project?    @relation(fields: [projectId], references: [id])
  siteLocation String
  startDate   DateTime
  endDate     DateTime?
  status      String      @default("ACTIVE")
  notes       String?
  
  assignedById String
  assignedBy  User        @relation("FleetAssigner", fields: [assignedById], references: [id])
  
  @@map("fleet_assignments")
}

enum FleetAssetType {
  VEHICLE           // Road vehicles
  HEAVY_MACHINERY   // Excavators, loaders, etc.
  DRILLING_EQUIPMENT
  PROCESSING_EQUIPMENT
  SUPPORT_EQUIPMENT // Generators, pumps, etc.
  TRANSPORT         // Haul trucks, conveyors
}

enum FuelType {
  DIESEL
  PETROL
  ELECTRIC
  HYBRID
  LPG
  NONE
}

enum AssetStatus {
  ACTIVE
  IN_MAINTENANCE
  BREAKDOWN
  STANDBY
  DECOMMISSIONED
  SOLD
}

enum AssetCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
  CRITICAL
}
```

### Fleet Service
```typescript
// Asset management
- createAsset(dto: CreateFleetAssetDto): Promise<FleetAsset>
- updateAsset(id: string, dto: UpdateFleetAssetDto): Promise<FleetAsset>
- getAssets(filters: FleetFilters): Promise<PaginatedResult<FleetAsset>>
- getAssetById(id: string): Promise<FleetAsset>
- updateAssetStatus(id: string, status: AssetStatus): Promise<FleetAsset>
- assignOperator(assetId: string, operatorId: string, siteLocation: string): Promise<FleetAssignment>
- transferAsset(assetId: string, newLocation: string): Promise<FleetAsset>
- decommissionAsset(id: string, reason: string): Promise<FleetAsset>
- calculateDepreciation(assetId: string): Promise<DepreciationResult>
- generateAssetCode(type: FleetAssetType): string

// Document management
- uploadDocument(assetId: string, file: File, type: string): Promise<FleetDocument>
- getExpiringDocuments(daysAhead: number): Promise<FleetDocument[]>

// Alerts
- checkExpiringItems(): Promise<ExpiryAlerts>  // Insurance, permits, inspections
```

### API Endpoints
```typescript
// Fleet Assets
POST   /api/fleet/assets                          // Create asset
GET    /api/fleet/assets                          // List assets
GET    /api/fleet/assets/:id                      // Get asset details
PUT    /api/fleet/assets/:id                      // Update asset
DELETE /api/fleet/assets/:id                      // Delete asset
POST   /api/fleet/assets/:id/status               // Update status
POST   /api/fleet/assets/:id/transfer             // Transfer location
POST   /api/fleet/assets/:id/assign               // Assign operator
POST   /api/fleet/assets/:id/decommission         // Decommission

// Documents
POST   /api/fleet/assets/:id/documents            // Upload document
GET    /api/fleet/assets/:id/documents            // List documents
DELETE /api/fleet/documents/:id                   // Delete document

// Assignments
GET    /api/fleet/assignments                     // List assignments
GET    /api/fleet/assignments/active              // Active assignments
POST   /api/fleet/assignments/:id/end             // End assignment

// Dashboard
GET    /api/fleet/dashboard                       // Fleet overview
GET    /api/fleet/alerts                          // Expiring items
GET    /api/fleet/by-location/:location           // Assets by site
GET    /api/fleet/by-type/:type                   // Assets by type
```

## Frontend Deliverables

### Fleet Pages
- `/fleet` - Fleet dashboard
- `/fleet/assets` - Asset registry
- `/fleet/assets/new` - Add new asset
- `/fleet/assets/:id` - Asset details
- `/fleet/assignments` - Current assignments

### Components
- `FleetAssetForm` - Multi-step asset registration
- `FleetAssetCard` - Asset summary card
- `FleetAssetProfile` - Full asset details
- `AssetStatusBadge` - Status indicator
- `AssignmentModal` - Assign operator/site
- `ExpiryAlerts` - Expiring documents/permits
- `FleetMap` - Site-based asset view

### Mining-Specific Features
- Equipment categories for mining (excavators, haul trucks, drills, etc.)
- Operating hours tracking (not just odometer)
- Mining permit and safety inspection tracking
- Site-based asset allocation
- Shift-based operator assignments

---

# 📋 Session 19.2: Maintenance Management & Scheduling

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model MaintenanceSchedule {
  id              String            @id @default(uuid())
  assetId         String
  asset           FleetAsset        @relation(fields: [assetId], references: [id], onDelete: Cascade)
  type            MaintenanceType
  name            String            // Oil Change, Filter Replacement, etc.
  description     String?
  
  // Schedule
  frequency       ScheduleFrequency
  intervalValue   Int               // Every X days/km/hours
  intervalUnit    String            // DAYS, KM, HOURS
  
  // Tracking
  lastPerformed   DateTime?
  lastOdometer    Decimal?          @db.Decimal(12, 2)
  lastHours       Decimal?          @db.Decimal(12, 2)
  nextDue         DateTime?
  nextDueOdometer Decimal?          @db.Decimal(12, 2)
  nextDueHours    Decimal?          @db.Decimal(12, 2)
  
  // Alerts
  alertDaysBefore Int               @default(7)
  alertKmBefore   Decimal?          @db.Decimal(10, 2)
  alertHoursBefore Decimal?         @db.Decimal(10, 2)
  
  isActive        Boolean           @default(true)
  priority        Priority          @default(MEDIUM)
  
  // Estimated costs
  estimatedCost   Decimal?          @db.Decimal(15, 2)
  estimatedDuration Int?            // Hours
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@map("maintenance_schedules")
}

model MaintenanceRecord {
  id              String            @id @default(uuid())
  assetId         String
  asset           FleetAsset        @relation(fields: [assetId], references: [id], onDelete: Cascade)
  scheduleId      String?           // Link to schedule if scheduled maintenance
  
  // Details
  type            MaintenanceType
  title           String
  description     String?
  
  // Timing
  scheduledDate   DateTime?
  startDate       DateTime
  completionDate  DateTime?
  downtime        Decimal?          @db.Decimal(10, 2) // Hours
  
  // Readings at maintenance
  odometerReading Decimal?          @db.Decimal(12, 2)
  hoursReading    Decimal?          @db.Decimal(12, 2)
  
  // Work done
  workPerformed   String?
  partsReplaced   String?
  technicianNotes String?
  
  // Costs
  laborCost       Decimal           @default(0) @db.Decimal(15, 2)
  partsCost       Decimal           @default(0) @db.Decimal(15, 2)
  externalCost    Decimal           @default(0) @db.Decimal(15, 2)
  totalCost       Decimal           @default(0) @db.Decimal(15, 2)
  
  // Service provider
  serviceProvider String?           // Internal or external
  vendorId        String?
  invoiceNumber   String?
  
  // Status
  status          MaintenanceStatus @default(SCHEDULED)
  priority        Priority          @default(MEDIUM)
  
  // Personnel
  performedById   String?
  performedBy     User?             @relation("MaintenancePerformer", fields: [performedById], references: [id])
  approvedById    String?
  approvedBy      User?             @relation("MaintenanceApprover", fields: [approvedById], references: [id])
  
  // Documents
  documents       String[]          // Receipts, reports
  photos          String[]          // Before/after photos
  
  createdById     String
  createdBy       User              @relation("MaintenanceCreator", fields: [createdById], references: [id])
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([assetId])
  @@index([status])
  @@map("maintenance_records")
}

model MaintenanceChecklist {
  id          String   @id @default(uuid())
  assetType   FleetAssetType
  name        String
  items       Json     // Array of checklist items
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@map("maintenance_checklists")
}

enum MaintenanceType {
  PREVENTIVE        // Scheduled maintenance
  CORRECTIVE        // Repair after issue
  PREDICTIVE        // Based on condition monitoring
  EMERGENCY         // Urgent repairs
  INSPECTION        // Regular inspections
  OVERHAUL          // Major overhaul
}

enum ScheduleFrequency {
  TIME_BASED        // Every X days
  DISTANCE_BASED    // Every X km
  HOURS_BASED       // Every X operating hours
  COMBINED          // Whichever comes first
}

enum MaintenanceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  OVERDUE
}
```

### Maintenance Service
```typescript
// Schedule management
- createSchedule(dto: CreateScheduleDto): Promise<MaintenanceSchedule>
- updateSchedule(id: string, dto: UpdateScheduleDto): Promise<MaintenanceSchedule>
- getSchedules(assetId?: string): Promise<MaintenanceSchedule[]>
- calculateNextDue(schedule: MaintenanceSchedule, asset: FleetAsset): NextDueResult
- checkOverdueSchedules(): Promise<MaintenanceSchedule[]>

// Maintenance records
- createMaintenanceRecord(dto: CreateMaintenanceDto): Promise<MaintenanceRecord>
- updateMaintenanceRecord(id: string, dto: UpdateMaintenanceDto): Promise<MaintenanceRecord>
- completeMaintenanceRecord(id: string, completionData: CompletionDto): Promise<MaintenanceRecord>
- getMaintenanceHistory(assetId: string): Promise<MaintenanceRecord[]>
- getUpcomingMaintenance(daysAhead: number): Promise<MaintenanceRecord[]>

// Alerts & notifications
- sendMaintenanceReminders(): Promise<void>  // Scheduled job
- notifyOverdueMaintenance(): Promise<void>
- generateMaintenanceReport(assetId: string, period: DateRange): Promise<Report>
```

### API Endpoints
```typescript
// Schedules
POST   /api/fleet/maintenance/schedules           // Create schedule
GET    /api/fleet/maintenance/schedules           // List schedules
GET    /api/fleet/maintenance/schedules/:id       // Get schedule
PUT    /api/fleet/maintenance/schedules/:id       // Update schedule
DELETE /api/fleet/maintenance/schedules/:id       // Delete schedule
GET    /api/fleet/assets/:id/schedules            // Asset schedules

// Maintenance Records
POST   /api/fleet/maintenance                     // Create record
GET    /api/fleet/maintenance                     // List records
GET    /api/fleet/maintenance/:id                 // Get record
PUT    /api/fleet/maintenance/:id                 // Update record
POST   /api/fleet/maintenance/:id/complete        // Complete maintenance
POST   /api/fleet/maintenance/:id/cancel          // Cancel
GET    /api/fleet/assets/:id/maintenance          // Asset history

// Dashboard
GET    /api/fleet/maintenance/upcoming            // Upcoming maintenance
GET    /api/fleet/maintenance/overdue             // Overdue maintenance
GET    /api/fleet/maintenance/calendar            // Calendar view
GET    /api/fleet/maintenance/costs               // Cost summary

// Checklists
GET    /api/fleet/maintenance/checklists          // Get checklists
POST   /api/fleet/maintenance/checklists          // Create checklist
```

## Frontend Deliverables

### Maintenance Pages
- `/fleet/maintenance` - Maintenance dashboard
- `/fleet/maintenance/schedules` - Manage schedules
- `/fleet/maintenance/calendar` - Calendar view
- `/fleet/maintenance/new` - Log maintenance
- `/fleet/maintenance/:id` - Maintenance details

### Components
- `MaintenanceScheduleForm` - Create/edit schedule
- `MaintenanceRecordForm` - Log maintenance work
- `MaintenanceCalendar` - Visual calendar
- `MaintenanceTimeline` - Asset maintenance history
- `OverdueAlerts` - Overdue maintenance warnings
- `MaintenanceChecklist` - Interactive checklist
- `CostBreakdown` - Maintenance cost analysis

---

# 📋 Session 19.3: Breakdown Logging & Operational Usage

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model BreakdownLog {
  id              String          @id @default(uuid())
  assetId         String
  asset           FleetAsset      @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  // Incident details
  breakdownDate   DateTime
  reportedDate    DateTime        @default(now())
  location        String          // Where breakdown occurred
  siteLocation    String          // Mining site
  
  // Description
  title           String
  description     String
  category        BreakdownCategory
  severity        Severity
  
  // Impact
  operationalImpact String?       // Production impact
  estimatedDowntime Decimal?      @db.Decimal(10, 2) // Hours
  actualDowntime  Decimal?        @db.Decimal(10, 2)
  productionLoss  Decimal?        @db.Decimal(15, 2) // Estimated cost
  
  // Resolution
  status          BreakdownStatus @default(REPORTED)
  rootCause       String?
  resolution      String?
  resolvedDate    DateTime?
  
  // Repair details
  repairType      String?         // On-site, Workshop, External
  repairCost      Decimal         @default(0) @db.Decimal(15, 2)
  partsUsed       String?
  
  // Personnel
  reportedById    String
  reportedBy      User            @relation("BreakdownReporter", fields: [reportedById], references: [id])
  assignedToId    String?
  assignedTo      User?           @relation("BreakdownAssignee", fields: [assignedToId], references: [id])
  resolvedById    String?
  resolvedBy      User?           @relation("BreakdownResolver", fields: [resolvedById], references: [id])
  
  // Documentation
  photos          String[]
  documents       String[]
  
  // Link to maintenance
  maintenanceRecordId String?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([assetId])
  @@index([status])
  @@index([severity])
  @@map("breakdown_logs")
}

model UsageLog {
  id              String      @id @default(uuid())
  assetId         String
  asset           FleetAsset  @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  // Period
  date            DateTime
  shiftId         String?
  shift           String?     // Day, Night, etc.
  
  // Operator
  operatorId      String
  operator        User        @relation("UsageOperator", fields: [operatorId], references: [id])
  
  // Location
  siteLocation    String
  projectId       String?
  project         Project?    @relation(fields: [projectId], references: [id])
  
  // Usage metrics
  startOdometer   Decimal?    @db.Decimal(12, 2)
  endOdometer     Decimal?    @db.Decimal(12, 2)
  distanceCovered Decimal?    @db.Decimal(10, 2) // km
  
  startHours      Decimal?    @db.Decimal(12, 2)
  endHours        Decimal?    @db.Decimal(12, 2)
  operatingHours  Decimal?    @db.Decimal(10, 2)
  
  idleHours       Decimal?    @db.Decimal(10, 2)
  
  // Work done
  workDescription String?
  loadsCarried    Int?        // For haul trucks
  materialMoved   Decimal?    @db.Decimal(15, 2) // Tonnes
  tripsCompleted  Int?
  
  // Condition
  preOpCheck      Boolean     @default(false)
  postOpCheck     Boolean     @default(false)
  issuesReported  String?
  
  // Fuel (if not separate record)
  fuelAdded       Decimal?    @db.Decimal(10, 2)
  
  notes           String?
  createdAt       DateTime    @default(now())
  
  @@index([assetId])
  @@index([date])
  @@index([operatorId])
  @@map("usage_logs")
}

model FleetInspection {
  id              String            @id @default(uuid())
  assetId         String
  asset           FleetAsset        @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  type            InspectionType
  inspectionDate  DateTime
  
  // Inspector
  inspectorId     String
  inspector       User              @relation("FleetInspector", fields: [inspectorId], references: [id])
  
  // Results
  overallResult   InspectionResult
  score           Int?              // 0-100
  
  // Checklist results
  checklistItems  Json              // Array of {item, passed, notes}
  
  // Findings
  findings        String?
  recommendations String?
  defectsFound    String[]
  
  // Follow-up
  followUpRequired Boolean          @default(false)
  followUpDate    DateTime?
  followUpNotes   String?
  
  // Documents
  photos          String[]
  documents       String[]
  
  createdAt       DateTime          @default(now())
  
  @@index([assetId])
  @@map("fleet_inspections")
}

enum BreakdownCategory {
  MECHANICAL
  ELECTRICAL
  HYDRAULIC
  ENGINE
  TRANSMISSION
  TIRES_TRACKS
  STRUCTURAL
  OPERATOR_ERROR
  EXTERNAL_DAMAGE
  OTHER
}

enum Severity {
  LOW           // Minor issue, can continue operation
  MEDIUM        // Reduced capacity
  HIGH          // Must stop operation
  CRITICAL      // Safety risk
}

enum BreakdownStatus {
  REPORTED
  ACKNOWLEDGED
  DIAGNOSING
  AWAITING_PARTS
  IN_REPAIR
  RESOLVED
  CLOSED
}

enum InspectionType {
  PRE_OPERATION    // Daily pre-start
  POST_OPERATION   // End of shift
  WEEKLY
  MONTHLY
  SAFETY
  REGULATORY
}
```

### API Endpoints
```typescript
// Breakdowns
POST   /api/fleet/breakdowns                      // Report breakdown
GET    /api/fleet/breakdowns                      // List breakdowns
GET    /api/fleet/breakdowns/:id                  // Get breakdown
PUT    /api/fleet/breakdowns/:id                  // Update breakdown
POST   /api/fleet/breakdowns/:id/assign           // Assign technician
POST   /api/fleet/breakdowns/:id/resolve          // Resolve breakdown
GET    /api/fleet/assets/:id/breakdowns           // Asset breakdown history
GET    /api/fleet/breakdowns/active               // Active breakdowns
GET    /api/fleet/breakdowns/stats                // Breakdown statistics

// Usage Logs
POST   /api/fleet/usage                           // Log usage
GET    /api/fleet/usage                           // List usage logs
GET    /api/fleet/assets/:id/usage                // Asset usage history
GET    /api/fleet/usage/by-operator/:id           // Operator usage
GET    /api/fleet/usage/by-site/:site             // Site usage
GET    /api/fleet/usage/summary                   // Usage summary

// Inspections
POST   /api/fleet/inspections                     // Log inspection
GET    /api/fleet/inspections                     // List inspections
GET    /api/fleet/assets/:id/inspections          // Asset inspections
GET    /api/fleet/inspections/due                 // Due inspections
```

## Frontend Deliverables

### Pages
- `/fleet/breakdowns` - Breakdown log
- `/fleet/breakdowns/new` - Report breakdown
- `/fleet/breakdowns/:id` - Breakdown details
- `/fleet/usage` - Usage logs
- `/fleet/usage/log` - Log daily usage
- `/fleet/inspections` - Inspection records

### Components
- `BreakdownReportForm` - Report breakdown
- `BreakdownTimeline` - Resolution timeline
- `UsageLogForm` - Daily usage entry
- `PreOpChecklist` - Pre-operation checklist
- `InspectionForm` - Conduct inspection
- `DowntimeChart` - Downtime analysis

---

# 📋 Session 19.4: Fuel Management & Consumption Tracking

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model FuelRecord {
  id              String      @id @default(uuid())
  assetId         String
  asset           FleetAsset  @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  // Transaction
  transactionDate DateTime
  transactionType FuelTransactionType
  
  // Fuel details
  fuelType        FuelType
  quantity        Decimal     @db.Decimal(10, 2) // Liters
  unitPrice       Decimal     @db.Decimal(10, 4) // Price per liter
  totalCost       Decimal     @db.Decimal(15, 2)
  
  // Readings
  odometerReading Decimal?    @db.Decimal(12, 2)
  hoursReading    Decimal?    @db.Decimal(12, 2)
  
  // Calculated
  distanceSinceLast Decimal?  @db.Decimal(10, 2)
  hoursSinceLast  Decimal?    @db.Decimal(10, 2)
  fuelEfficiency  Decimal?    @db.Decimal(10, 4) // L/100km or L/hour
  
  // Source
  fuelStation     String?     // Station name or site tank
  receiptNumber   String?
  
  // Location
  siteLocation    String
  
  // Personnel
  filledById      String
  filledBy        User        @relation("FuelFiller", fields: [filledById], references: [id])
  approvedById    String?
  approvedBy      User?       @relation("FuelApprover", fields: [approvedById], references: [id])
  
  notes           String?
  receiptImage    String?
  
  createdAt       DateTime    @default(now())
  
  @@index([assetId])
  @@index([transactionDate])
  @@map("fuel_records")
}

model FuelTank {
  id              String      @id @default(uuid())
  name            String
  location        String      // Site location
  fuelType        FuelType
  capacity        Decimal     @db.Decimal(12, 2) // Liters
  currentLevel    Decimal     @db.Decimal(12, 2)
  reorderLevel    Decimal     @db.Decimal(12, 2)
  lastRefillDate  DateTime?
  lastRefillQty   Decimal?    @db.Decimal(12, 2)
  status          String      @default("ACTIVE")
  
  transactions    FuelTankTransaction[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@map("fuel_tanks")
}

model FuelTankTransaction {
  id              String      @id @default(uuid())
  tankId          String
  tank            FuelTank    @relation(fields: [tankId], references: [id], onDelete: Cascade)
  transactionType String      // REFILL, DISPENSE, ADJUSTMENT
  quantity        Decimal     @db.Decimal(12, 2)
  balanceBefore   Decimal     @db.Decimal(12, 2)
  balanceAfter    Decimal     @db.Decimal(12, 2)
  assetId         String?     // If dispensed to asset
  reference       String?
  performedById   String
  performedBy     User        @relation("TankTransactor", fields: [performedById], references: [id])
  transactionDate DateTime    @default(now())
  notes           String?
  
  @@index([tankId])
  @@map("fuel_tank_transactions")
}

enum FuelTransactionType {
  FILL_UP
  PARTIAL_FILL
  TANK_DISPENSE   // From site tank
  EXTERNAL        // External station
}
```

### Fuel Service
```typescript
// Fuel records
- recordFuelTransaction(dto: FuelRecordDto): Promise<FuelRecord>
- calculateFuelEfficiency(assetId: string, period: DateRange): Promise<EfficiencyResult>
- getFuelHistory(assetId: string): Promise<FuelRecord[]>
- getFuelConsumptionReport(filters: FuelFilters): Promise<FuelReport>
- detectAnomalies(assetId: string): Promise<Anomaly[]>  // Unusual consumption

// Tank management
- updateTankLevel(tankId: string, quantity: Decimal, type: string): Promise<FuelTank>
- getTankLevels(): Promise<FuelTank[]>
- getLowTankAlerts(): Promise<FuelTank[]>
- recordTankRefill(tankId: string, dto: RefillDto): Promise<FuelTankTransaction>
```

### API Endpoints
```typescript
// Fuel Records
POST   /api/fleet/fuel                            // Record fuel
GET    /api/fleet/fuel                            // List records
GET    /api/fleet/assets/:id/fuel                 // Asset fuel history
GET    /api/fleet/fuel/efficiency                 // Efficiency report
GET    /api/fleet/fuel/consumption                // Consumption report
GET    /api/fleet/fuel/anomalies                  // Unusual consumption

// Fuel Tanks
GET    /api/fleet/fuel/tanks                      // List tanks
POST   /api/fleet/fuel/tanks                      // Add tank
PUT    /api/fleet/fuel/tanks/:id                  // Update tank
POST   /api/fleet/fuel/tanks/:id/refill           // Record refill
POST   /api/fleet/fuel/tanks/:id/dispense         // Record dispense
GET    /api/fleet/fuel/tanks/low                  // Low level alerts
GET    /api/fleet/fuel/tanks/:id/transactions     // Tank history
```

## Frontend Deliverables

### Pages
- `/fleet/fuel` - Fuel management dashboard
- `/fleet/fuel/record` - Record fuel transaction
- `/fleet/fuel/tanks` - Manage fuel tanks
- `/fleet/fuel/reports` - Consumption reports

### Components
- `FuelRecordForm` - Log fuel transaction
- `FuelEfficiencyChart` - Efficiency trends
- `ConsumptionComparison` - Compare assets
- `TankLevelIndicator` - Visual tank level
- `FuelAnomalyAlert` - Unusual consumption warning

---

# 📋 Session 19.5: Cost Analysis, Reporting & Dashboard

**Duration:** 1 session

## Backend Deliverables

### Database Schema
```prisma
model FleetCost {
  id              String        @id @default(uuid())
  assetId         String
  asset           FleetAsset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  costDate        DateTime
  category        FleetCostCategory
  description     String
  amount          Decimal       @db.Decimal(15, 2)
  currency        String        @default("GHS")
  
  // References
  referenceType   String?       // Maintenance, Fuel, Insurance, etc.
  referenceId     String?
  
  // Approval
  approvedById    String?
  approvedBy      User?         @relation("CostApprover", fields: [approvedById], references: [id])
  
  // Documentation
  invoiceNumber   String?
  receiptUrl      String?
  
  createdById     String
  createdBy       User          @relation("CostCreator", fields: [createdById], references: [id])
  createdAt       DateTime      @default(now())
  
  @@index([assetId])
  @@index([category])
  @@index([costDate])
  @@map("fleet_costs")
}

enum FleetCostCategory {
  FUEL
  MAINTENANCE
  REPAIRS
  INSURANCE
  REGISTRATION
  PERMITS
  TIRES
  PARTS
  LABOR
  EXTERNAL_SERVICE
  DEPRECIATION
  OTHER
}
```

### Analytics Service
```typescript
// Cost analysis
- getTotalCostOfOwnership(assetId: string): Promise<TCOResult>
- getCostBreakdown(assetId: string, period: DateRange): Promise<CostBreakdown>
- getCostPerKm(assetId: string): Promise<Decimal>
- getCostPerHour(assetId: string): Promise<Decimal>
- getFleetCostSummary(period: DateRange): Promise<FleetCostSummary>
- compareCosts(assetIds: string[]): Promise<CostComparison>

// Performance metrics
- getUtilizationRate(assetId: string, period: DateRange): Promise<Decimal>
- getAvailabilityRate(assetId: string, period: DateRange): Promise<Decimal>
- getMTBF(assetId: string): Promise<Decimal>  // Mean Time Between Failures
- getMTTR(assetId: string): Promise<Decimal>  // Mean Time To Repair

// Reports
- generateFleetReport(period: DateRange): Promise<FleetReport>
- generateAssetReport(assetId: string): Promise<AssetReport>
- generateMaintenanceReport(period: DateRange): Promise<MaintenanceReport>
- generateFuelReport(period: DateRange): Promise<FuelReport>
- generateCostReport(period: DateRange): Promise<CostReport>
```

### Dashboard Metrics
```typescript
interface FleetDashboard {
  // Summary
  totalAssets: number;
  activeAssets: number;
  inMaintenance: number;
  breakdowns: number;
  
  // Utilization
  overallUtilization: Decimal;
  utilizationByType: TypeUtilization[];
  utilizationBySite: SiteUtilization[];
  
  // Costs
  totalCostMTD: Decimal;
  totalCostYTD: Decimal;
  costByCategory: CategoryCost[];
  costTrend: MonthlyCost[];
  
  // Fuel
  totalFuelMTD: Decimal;
  avgFuelEfficiency: Decimal;
  fuelCostMTD: Decimal;
  
  // Maintenance
  upcomingMaintenance: number;
  overdueMaintenance: number;
  maintenanceCostMTD: Decimal;
  
  // Breakdowns
  activeBreakdowns: number;
  avgDowntime: Decimal;
  breakdownsByCategory: CategoryBreakdown[];
  
  // Alerts
  expiringDocuments: number;
  lowFuelTanks: number;
  criticalAssets: number;
}
```

### API Endpoints
```typescript
// Dashboard
GET    /api/fleet/dashboard                       // Main dashboard
GET    /api/fleet/dashboard/costs                 // Cost overview
GET    /api/fleet/dashboard/utilization           // Utilization metrics
GET    /api/fleet/dashboard/performance           // Performance KPIs

// Cost Analysis
GET    /api/fleet/costs                           // List costs
POST   /api/fleet/costs                           // Record cost
GET    /api/fleet/assets/:id/costs                // Asset costs
GET    /api/fleet/assets/:id/tco                  // Total cost of ownership
GET    /api/fleet/costs/breakdown                 // Cost breakdown
GET    /api/fleet/costs/comparison                // Compare assets

// Reports
GET    /api/fleet/reports/fleet                   // Fleet summary report
GET    /api/fleet/reports/asset/:id               // Asset report
GET    /api/fleet/reports/maintenance             // Maintenance report
GET    /api/fleet/reports/fuel                    // Fuel report
GET    /api/fleet/reports/costs                   // Cost report
GET    /api/fleet/reports/utilization             // Utilization report

// Export
GET    /api/fleet/export/assets                   // Export asset list
GET    /api/fleet/export/maintenance              // Export maintenance
GET    /api/fleet/export/fuel                     // Export fuel records
GET    /api/fleet/export/costs                    // Export costs
```

## Frontend Deliverables

### Dashboard & Reports Pages
- `/fleet` - Main fleet dashboard
- `/fleet/reports` - Reports hub
- `/fleet/reports/costs` - Cost analysis
- `/fleet/reports/utilization` - Utilization report
- `/fleet/analytics` - Advanced analytics

### Components
- `FleetDashboard` - Main dashboard
- `CostAnalysisChart` - Cost breakdown
- `TCOCalculator` - Total cost of ownership
- `UtilizationGauge` - Utilization indicator
- `PerformanceKPIs` - Key metrics cards
- `AssetComparison` - Compare multiple assets
- `FleetMap` - Geographic asset view
- `AlertsPanel` - Critical alerts

---

# 📊 Phase 19 Summary

## Database Tables Added
1. fleet_assets
2. fleet_documents
3. fleet_assignments
4. maintenance_schedules
5. maintenance_records
6. maintenance_checklists
7. breakdown_logs
8. usage_logs
9. fleet_inspections
10. fuel_records
11. fuel_tanks
12. fuel_tank_transactions
13. fleet_costs

**Total: 13 new tables**

## API Endpoints: ~85 new endpoints

## Frontend Pages: ~18 new pages

## Key Features
- ✅ Complete asset registry (vehicles, machinery, equipment)
- ✅ Maintenance scheduling (time, distance, hours-based)
- ✅ Breakdown logging and resolution tracking
- ✅ Daily usage and operator logs
- ✅ Pre/post operation inspections
- ✅ Fuel consumption tracking
- ✅ Site fuel tank management
- ✅ Comprehensive cost analysis
- ✅ Total cost of ownership calculation
- ✅ Utilization and performance metrics
- ✅ Mining-specific features (operating hours, site allocation)

## Estimated Development Time
- Session 19.1: 5-6 hours
- Session 19.2: 5-6 hours
- Session 19.3: 4-5 hours
- Session 19.4: 4-5 hours
- Session 19.5: 5-6 hours

**Total: 23-28 hours**

---

**Author:** Mining ERP Development Team  
**Budget:** GH₵2,300  
**Status:** Ready for Implementation
