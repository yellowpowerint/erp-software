# Mining ERP - Phase 17: CSV Import/Export System

## Overview
**Phase:** 17  
**Duration:** Sessions 17.1 - 17.3 (3 sessions)  
**Objective:** Add comprehensive CSV import and export capabilities across all relevant ERP modules to enable bulk data operations, data migration, and reporting.  
**Priority:** High (enables data migration and bulk operations)

---

## Tech Stack Extensions
- **Backend:** NestJS + csv-parser + fast-csv + json2csv + multer
- **Frontend:** react-papaparse + file-saver
- **Validation:** class-validator (existing) + custom CSV validators

---

# 📋 Session 17.1: CSV Infrastructure & Core Import/Export Service

**Duration:** 1 session

## Backend Deliverables

### Database Schema Additions
```prisma
model ImportJob {
  id            String       @id @default(uuid())
  module        String       // 'inventory', 'suppliers', 'employees', etc.
  fileName      String
  originalName  String
  totalRows     Int
  processedRows Int          @default(0)
  successRows   Int          @default(0)
  errorRows     Int          @default(0)
  status        ImportStatus @default(PENDING)
  errors        Json?        // Array of {row, field, message}
  warnings      Json?        // Array of {row, field, message}
  mappings      Json?        // Column mappings used
  createdById   String
  createdBy     User         @relation("ImportCreator", fields: [createdById], references: [id])
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime     @default(now())
  
  @@index([module])
  @@index([createdById])
  @@index([status])
  @@map("import_jobs")
}

model ExportJob {
  id            String       @id @default(uuid())
  module        String
  fileName      String
  filters       Json?        // Applied filters
  columns       String[]     // Exported columns
  totalRows     Int
  status        ExportStatus @default(PENDING)
  fileUrl       String?      // Download URL
  expiresAt     DateTime?
  createdById   String
  createdBy     User         @relation("ExportCreator", fields: [createdById], references: [id])
  completedAt   DateTime?
  createdAt     DateTime     @default(now())
  
  @@index([module])
  @@index([createdById])
  @@map("export_jobs")
}

model ImportTemplate {
  id          String   @id @default(uuid())
  name        String
  module      String
  description String?
  columns     Json     // Array of {csvColumn, dbField, required, transform}
  isDefault   Boolean  @default(false)
  createdById String
  createdBy   User     @relation("TemplateCreator", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([name, module])
  @@map("import_templates")
}

enum ImportStatus {
  PENDING
  VALIDATING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum ExportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### CSV Service (`src/modules/csv/csv.service.ts`)
```typescript
// Core CSV processing service with:
- parseCSV(file: Buffer, options: ParseOptions): Promise<ParsedData>
- validateCSVStructure(data: ParsedData, template: ImportTemplate): ValidationResult
- transformData(data: ParsedData, mappings: ColumnMapping[]): TransformedData
- generateCSV(data: any[], columns: string[], options: ExportOptions): Buffer
- createImportJob(module: string, file: Express.Multer.File, userId: string): Promise<ImportJob>
- processImportJob(jobId: string): Promise<ImportResult>
- createExportJob(module: string, filters: any, columns: string[], userId: string): Promise<ExportJob>
- processExportJob(jobId: string): Promise<ExportResult>
```

### CSV Module (`src/modules/csv/csv.module.ts`)
- CSVController
- CSVService
- ImportProcessor (queue-based for large files)
- ExportProcessor

### API Endpoints
```typescript
// Core CSV endpoints
POST   /api/csv/upload                    // Upload CSV file for validation
POST   /api/csv/import/:module            // Start import job
GET    /api/csv/import/:jobId             // Get import job status
GET    /api/csv/import/:jobId/errors      // Get import errors
POST   /api/csv/import/:jobId/cancel      // Cancel import job
POST   /api/csv/export/:module            // Start export job
GET    /api/csv/export/:jobId             // Get export job status
GET    /api/csv/export/:jobId/download    // Download exported file

// Templates
GET    /api/csv/templates/:module         // Get import templates for module
POST   /api/csv/templates                 // Create import template
PUT    /api/csv/templates/:id             // Update template
DELETE /api/csv/templates/:id             // Delete template
GET    /api/csv/templates/:module/sample  // Download sample CSV

// History
GET    /api/csv/history/imports           // Import history
GET    /api/csv/history/exports           // Export history
```

### Supported Modules Configuration
```typescript
const CSV_MODULES = {
  inventory: {
    name: 'Stock Items',
    importFields: ['sku', 'name', 'category', 'quantity', 'unitPrice', 'reorderLevel', 'warehouseId', 'supplier'],
    exportFields: ['id', 'sku', 'name', 'category', 'quantity', 'unitPrice', 'totalValue', 'reorderLevel', 'warehouse', 'lastUpdated'],
    requiredFields: ['sku', 'name', 'quantity'],
    validators: { sku: 'unique', quantity: 'number', unitPrice: 'currency' }
  },
  suppliers: {
    name: 'Suppliers/Vendors',
    importFields: ['name', 'contactPerson', 'email', 'phone', 'address', 'city', 'country', 'taxId', 'category', 'paymentTerms'],
    exportFields: ['id', 'name', 'contactPerson', 'email', 'phone', 'address', 'city', 'country', 'taxId', 'category', 'rating', 'isActive'],
    requiredFields: ['name'],
    validators: { email: 'email', phone: 'phone' }
  },
  employees: {
    name: 'Employees',
    importFields: ['employeeId', 'firstName', 'lastName', 'email', 'phone', 'department', 'position', 'hireDate', 'salary', 'employmentType'],
    exportFields: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'phone', 'department', 'position', 'hireDate', 'status'],
    requiredFields: ['firstName', 'lastName', 'email', 'department'],
    validators: { email: 'email|unique', hireDate: 'date', salary: 'currency' }
  },
  warehouses: {
    name: 'Warehouses',
    importFields: ['name', 'code', 'location', 'address', 'manager', 'capacity'],
    exportFields: ['id', 'name', 'code', 'location', 'address', 'manager', 'capacity', 'currentStock', 'utilizationPercent'],
    requiredFields: ['name', 'code'],
    validators: { code: 'unique' }
  },
  projects: {
    name: 'Projects',
    importFields: ['name', 'code', 'description', 'startDate', 'endDate', 'budget', 'status', 'priority', 'manager'],
    exportFields: ['id', 'name', 'code', 'description', 'startDate', 'endDate', 'budget', 'spent', 'status', 'priority', 'progress'],
    requiredFields: ['name', 'code', 'startDate'],
    validators: { startDate: 'date', endDate: 'date', budget: 'currency' }
  },
  assets: {
    name: 'Assets/Equipment',
    importFields: ['assetTag', 'name', 'category', 'serialNumber', 'purchaseDate', 'purchasePrice', 'location', 'assignedTo', 'status'],
    exportFields: ['id', 'assetTag', 'name', 'category', 'serialNumber', 'purchaseDate', 'purchasePrice', 'currentValue', 'location', 'assignedTo', 'status', 'lastMaintenance'],
    requiredFields: ['assetTag', 'name', 'category'],
    validators: { assetTag: 'unique', purchaseDate: 'date', purchasePrice: 'currency' }
  }
};
```

## Frontend Deliverables

### CSV Upload Component (`components/csv/CSVUpload.tsx`)
- Drag & drop CSV file upload
- File validation (size, type)
- Preview first 10 rows
- Column mapping interface
- Validation results display
- Import progress indicator

### CSV Types (`types/csv.ts`)
```typescript
interface ImportJob {
  id: string;
  module: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  status: ImportStatus;
  errors?: ImportError[];
  createdAt: string;
  completedAt?: string;
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ColumnMapping {
  csvColumn: string;
  dbField: string;
  transform?: string;
}

interface ExportOptions {
  module: string;
  filters?: Record<string, any>;
  columns: string[];
  format: 'csv' | 'xlsx';
  includeHeaders: boolean;
}
```

### CSV Hook (`hooks/useCSV.ts`)
- uploadCSV()
- startImport()
- getImportStatus()
- cancelImport()
- startExport()
- downloadExport()
- getTemplates()

## Testing
- Upload valid CSV file
- Upload invalid CSV (wrong format)
- Validate column mapping
- Process small import (100 rows)
- Process large import (10,000 rows)
- Handle duplicate detection
- Export with filters
- Download exported file

---

# 📋 Session 17.2: Module-Specific Import/Export Implementation

**Duration:** 1 session

## Backend Deliverables

### Inventory Import/Export (`src/modules/inventory/inventory-csv.service.ts`)
```typescript
// Inventory-specific CSV operations
- importStockItems(jobId: string): Promise<ImportResult>
- exportStockItems(filters: StockFilters, columns: string[]): Promise<Buffer>
- validateStockItem(row: any): ValidationResult
- handleDuplicateSKU(sku: string, strategy: 'skip' | 'update' | 'error'): Promise<void>

// Stock movement import
- importStockMovements(jobId: string): Promise<ImportResult>
- exportStockMovements(filters: MovementFilters): Promise<Buffer>
```

### Supplier Import/Export (`src/modules/finance/supplier-csv.service.ts`)
```typescript
- importSuppliers(jobId: string): Promise<ImportResult>
- exportSuppliers(filters: SupplierFilters): Promise<Buffer>
- validateSupplier(row: any): ValidationResult
- mergeSupplierData(existing: Supplier, imported: any): Supplier
```

### Employee Import/Export (`src/modules/hr/employee-csv.service.ts`)
```typescript
- importEmployees(jobId: string): Promise<ImportResult>
- exportEmployees(filters: EmployeeFilters): Promise<Buffer>
- validateEmployee(row: any): ValidationResult
- generateEmployeeId(): string
```

### Asset Import/Export (`src/modules/assets/asset-csv.service.ts`)
```typescript
- importAssets(jobId: string): Promise<ImportResult>
- exportAssets(filters: AssetFilters): Promise<Buffer>
- validateAsset(row: any): ValidationResult
- calculateDepreciation(asset: any): number
```

### Project Import/Export (`src/modules/projects/project-csv.service.ts`)
```typescript
- importProjects(jobId: string): Promise<ImportResult>
- exportProjects(filters: ProjectFilters): Promise<Buffer>
- importProjectTasks(projectId: string, jobId: string): Promise<ImportResult>
- exportProjectTasks(projectId: string): Promise<Buffer>
```

### Mining-Specific Exports
```typescript
// Production data export
- exportProductionLogs(filters: ProductionFilters): Promise<Buffer>
- exportShiftReports(filters: ShiftFilters): Promise<Buffer>

// Safety data export
- exportSafetyInspections(filters: InspectionFilters): Promise<Buffer>
- exportIncidentReports(filters: IncidentFilters): Promise<Buffer>
- exportTrainingRecords(filters: TrainingFilters): Promise<Buffer>

// Financial exports
- exportInvoices(filters: InvoiceFilters): Promise<Buffer>
- exportExpenses(filters: ExpenseFilters): Promise<Buffer>
- exportPayments(filters: PaymentFilters): Promise<Buffer>
```

### API Endpoints (Module-Specific)
```typescript
// Inventory
POST   /api/inventory/import              // Import stock items
GET    /api/inventory/export              // Export stock items
GET    /api/inventory/export/movements    // Export stock movements
GET    /api/inventory/import/sample       // Download sample CSV

// Suppliers
POST   /api/finance/suppliers/import      // Import suppliers
GET    /api/finance/suppliers/export      // Export suppliers

// Employees
POST   /api/hr/employees/import           // Import employees
GET    /api/hr/employees/export           // Export employees

// Assets
POST   /api/assets/import                 // Import assets
GET    /api/assets/export                 // Export assets

// Projects
POST   /api/projects/import               // Import projects
GET    /api/projects/export               // Export projects
POST   /api/projects/:id/tasks/import     // Import project tasks
GET    /api/projects/:id/tasks/export     // Export project tasks

// Operations
GET    /api/operations/export/production  // Export production logs
GET    /api/operations/export/shifts      // Export shift reports

// Safety
GET    /api/safety/export/inspections     // Export inspections
GET    /api/safety/export/incidents       // Export incidents
GET    /api/safety/export/training        // Export training records

// Finance
GET    /api/finance/export/invoices       // Export invoices
GET    /api/finance/export/expenses       // Export expenses
GET    /api/finance/export/payments       // Export payments
```

## Frontend Deliverables

### Import Modal Component (`components/csv/ImportModal.tsx`)
- Step 1: Upload file
- Step 2: Preview & map columns
- Step 3: Validation results
- Step 4: Import options (duplicate handling)
- Step 5: Progress & results

### Export Modal Component (`components/csv/ExportModal.tsx`)
- Select columns to export
- Apply filters
- Choose format (CSV/XLSX)
- Include/exclude headers
- Date range selection
- Download button

### Column Mapper Component (`components/csv/ColumnMapper.tsx`)
- Auto-detect column mappings
- Manual mapping override
- Required field indicators
- Data type validation preview
- Sample data display

### Import/Export Buttons Integration
Add to existing module pages:
```typescript
// Inventory page
<ImportButton module="inventory" onComplete={refetch} />
<ExportButton module="inventory" filters={currentFilters} />

// Suppliers page
<ImportButton module="suppliers" onComplete={refetch} />
<ExportButton module="suppliers" filters={currentFilters} />

// Employees page
<ImportButton module="employees" onComplete={refetch} />
<ExportButton module="employees" filters={currentFilters} />

// Assets page
<ImportButton module="assets" onComplete={refetch} />
<ExportButton module="assets" filters={currentFilters} />
```

### Sample CSV Templates

Users can download pre-formatted CSV templates with headers and example data. These templates are served from `/api/csv/templates/:module/sample`.

---

#### 1. Inventory Sample (`inventory-sample.csv`)

```csv
sku,name,category,description,quantity,unit,unitPrice,reorderLevel,warehouseCode,supplierCode,location,notes
INV-001,Hydraulic Oil 20L,Consumables,Premium hydraulic fluid for heavy machinery,150,liters,85.50,50,WH-MAIN,SUP-SHELL,Rack A-12,For excavators and loaders
INV-002,Drill Bit 150mm,Drilling Equipment,Tungsten carbide drill bit for rock drilling,25,pieces,1250.00,10,WH-MAIN,SUP-SANDVIK,Rack B-05,High-wear item
INV-003,Safety Helmet,Safety Gear,Mining-grade safety helmet with lamp mount,200,pieces,45.00,75,WH-SAFETY,SUP-3M,Shelf C-01,Replace annually
INV-004,Conveyor Belt 50m,Processing Equipment,Heavy-duty rubber conveyor belt,5,rolls,8500.00,2,WH-MAIN,SUP-CONTINENTAL,Bay D-01,6-month lead time
INV-005,Diesel Filter,Maintenance Parts,Fuel filter for CAT equipment,80,pieces,125.00,30,WH-MAINT,SUP-CAT,Rack E-08,Compatible with CAT 390F
```

**Required Fields:** `sku`, `name`, `quantity`  
**Field Notes:**
- `sku`: Unique stock keeping unit code
- `category`: Consumables, Drilling Equipment, Safety Gear, Processing Equipment, Maintenance Parts, Explosives, Fuel, Lubricants
- `unit`: pieces, liters, kg, meters, rolls, boxes, sets
- `unitPrice`: Price in Ghana Cedis (GH₵)
- `warehouseCode`: Must match existing warehouse codes

---

#### 2. Suppliers Sample (`suppliers-sample.csv`)

```csv
name,tradingName,type,category,contactPerson,email,phone,alternatePhone,address,city,region,country,taxId,vatNumber,paymentTerms,bankName,accountNumber,accountName,website,notes
Shell Ghana Ltd,Shell,DISTRIBUTOR,"Fuel,Lubricants",Kwame Asante,kwame.asante@shell.com.gh,+233-302-123456,+233-244-567890,15 Independence Ave,Accra,Greater Accra,Ghana,C0012345678,VAT123456,30,GCB Bank,1234567890,Shell Ghana Ltd,www.shell.com.gh,Preferred fuel supplier
Sandvik Mining Ghana,Sandvik,MANUFACTURER,"Drilling Equipment,Maintenance Parts",Ama Mensah,ama.mensah@sandvik.com,+233-302-234567,,Plot 25 Industrial Area,Tema,Greater Accra,Ghana,C0023456789,VAT234567,45,Stanbic Bank,2345678901,Sandvik Mining,www.sandvik.com,OEM parts supplier
3M Ghana,3M,DISTRIBUTOR,Safety Gear,Kofi Owusu,kofi.owusu@3m.com,+233-302-345678,+233-244-678901,8 Ring Road Central,Accra,Greater Accra,Ghana,C0034567890,,30,Ecobank,3456789012,3M Ghana Ltd,www.3m.com.gh,PPE supplier
Local Mining Services,LMS,SERVICE_PROVIDER,"Maintenance,Repairs",Yaw Boateng,info@lms.com.gh,+233-302-456789,,Tarkwa Industrial Zone,Tarkwa,Western,Ghana,C0045678901,,14,Fidelity Bank,4567890123,Local Mining Services,,Equipment repair services
CAT Ghana,Caterpillar,MANUFACTURER,"Heavy Machinery,Maintenance Parts",Efua Dadzie,efua.dadzie@cat.com.gh,+233-302-567890,+233-244-789012,Spintex Road,Accra,Greater Accra,Ghana,C0056789012,VAT345678,60,Standard Chartered,5678901234,Mantrac Ghana Ltd,www.cat.com,Heavy equipment dealer
```

**Required Fields:** `name`, `contactPerson`, `email`, `phone`  
**Field Notes:**
- `type`: MANUFACTURER, DISTRIBUTOR, WHOLESALER, RETAILER, SERVICE_PROVIDER, CONTRACTOR
- `category`: Comma-separated list of categories
- `paymentTerms`: Number of days (e.g., 30, 45, 60)
- `taxId`: Ghana TIN number

---

#### 3. Employees Sample (`employees-sample.csv`)

```csv
employeeId,firstName,lastName,email,phone,department,position,hireDate,employmentType,salary,bankName,accountNumber,emergencyContact,emergencyPhone,address,city,dateOfBirth,nationalId,notes
EMP-001,Kwaku,Mensah,kwaku.mensah@miningco.com,+233-244-111222,Operations,Excavator Operator,2022-03-15,FULL_TIME,4500.00,GCB Bank,1111222233,Ama Mensah,+233-244-333444,25 Tema Road,Tema,1985-06-20,GHA-123456789,Certified heavy equipment operator
EMP-002,Abena,Osei,abena.osei@miningco.com,+233-244-222333,Safety,Safety Officer,2021-08-01,FULL_TIME,5200.00,Ecobank,2222333344,Kofi Osei,+233-244-444555,10 Accra Central,Accra,1988-11-15,GHA-234567890,NEBOSH certified
EMP-003,Yaw,Asante,yaw.asante@miningco.com,+233-244-333444,Maintenance,Mechanic,2023-01-10,FULL_TIME,3800.00,Stanbic Bank,3333444455,Efua Asante,+233-244-555666,5 Tarkwa Main,Tarkwa,1990-02-28,GHA-345678901,Specializes in CAT equipment
EMP-004,Akosua,Boateng,akosua.boateng@miningco.com,+233-244-444555,Finance,Accountant,2020-05-20,FULL_TIME,6000.00,Fidelity Bank,4444555566,Kwame Boateng,+233-244-666777,15 Osu Oxford St,Accra,1987-09-10,GHA-456789012,ACCA qualified
EMP-005,Kofi,Darko,kofi.darko@miningco.com,+233-244-555666,Operations,Drill Operator,2022-11-01,CONTRACT,4000.00,GCB Bank,5555666677,Ama Darko,+233-244-777888,8 Prestea Road,Prestea,1992-04-05,GHA-567890123,Contract ends Dec 2025
```

**Required Fields:** `firstName`, `lastName`, `email`, `department`, `position`, `hireDate`  
**Field Notes:**
- `employeeId`: Auto-generated if not provided
- `department`: Operations, Safety, Maintenance, Finance, HR, Procurement, IT, Administration
- `employmentType`: FULL_TIME, PART_TIME, CONTRACT, TEMPORARY
- `salary`: Monthly salary in Ghana Cedis (GH₵)
- `hireDate`: Format YYYY-MM-DD

---

#### 4. Assets/Equipment Sample (`assets-sample.csv`)

```csv
assetTag,name,category,type,make,model,year,serialNumber,purchaseDate,purchasePrice,currentLocation,status,condition,assignedTo,warrantyExpiry,fuelType,tankCapacity,notes
AST-EXC-001,CAT 390F Excavator,Heavy Machinery,HEAVY_MACHINERY,Caterpillar,390F,2021,CAT390F2021001,2021-06-15,2500000.00,Site A - Main Pit,ACTIVE,GOOD,Kwaku Mensah,2024-06-15,DIESEL,650,Primary excavator for main pit
AST-TRK-001,Volvo A40G Haul Truck,Transport,TRANSPORT,Volvo,A40G,2022,VOLVA40G2022001,2022-03-20,1800000.00,Site A - Main Pit,ACTIVE,EXCELLENT,,2025-03-20,DIESEL,400,40-tonne capacity
AST-DRL-001,Sandvik DR460i Drill Rig,Drilling Equipment,DRILLING_EQUIPMENT,Sandvik,DR460i,2020,SDK460I2020001,2020-09-10,3200000.00,Site B - North Zone,IN_MAINTENANCE,FAIR,,2023-09-10,DIESEL,500,Scheduled for overhaul
AST-GEN-001,CAT C18 Generator,Support Equipment,SUPPORT_EQUIPMENT,Caterpillar,C18,2023,CATC182023001,2023-01-05,450000.00,Site A - Camp,ACTIVE,EXCELLENT,,2026-01-05,DIESEL,1000,Backup power for camp
AST-VEH-001,Toyota Land Cruiser,Vehicle,VEHICLE,Toyota,Land Cruiser 300,2023,TOYLC2023001,2023-04-12,380000.00,Head Office,ACTIVE,EXCELLENT,Abena Osei,2026-04-12,DIESEL,110,Management vehicle
```

**Required Fields:** `assetTag`, `name`, `category`, `type`  
**Field Notes:**
- `type`: VEHICLE, HEAVY_MACHINERY, DRILLING_EQUIPMENT, PROCESSING_EQUIPMENT, SUPPORT_EQUIPMENT, TRANSPORT
- `status`: ACTIVE, IN_MAINTENANCE, BREAKDOWN, STANDBY, DECOMMISSIONED
- `condition`: EXCELLENT, GOOD, FAIR, POOR, CRITICAL
- `fuelType`: DIESEL, PETROL, ELECTRIC, HYBRID, LPG, NONE
- `purchasePrice`: In Ghana Cedis (GH₵)

---

#### 5. Projects Sample (`projects-sample.csv`)

```csv
code,name,description,startDate,endDate,budget,status,priority,manager,siteLocation,client,notes
PRJ-2024-001,North Zone Expansion,Expansion of mining operations to North Zone,2024-01-15,2024-12-31,15000000.00,IN_PROGRESS,HIGH,Kwame Asante,Site B - North Zone,Internal,Phase 1 of 3-year expansion plan
PRJ-2024-002,Processing Plant Upgrade,Upgrade of ore processing capacity,2024-03-01,2024-09-30,8500000.00,IN_PROGRESS,MEDIUM,Ama Mensah,Site A - Processing,Internal,Increase capacity by 30%
PRJ-2024-003,Safety Infrastructure,Installation of new safety systems,2024-02-01,2024-06-30,2500000.00,COMPLETED,HIGH,Abena Osei,All Sites,Internal,Completed ahead of schedule
PRJ-2024-004,Fleet Modernization,Replacement of aging haul trucks,2024-06-01,2025-03-31,12000000.00,PLANNED,MEDIUM,Yaw Boateng,Site A - Main Pit,Internal,5 new Volvo A40G trucks
PRJ-2024-005,Environmental Rehabilitation,Rehabilitation of exhausted mining areas,2024-04-01,2025-12-31,5000000.00,IN_PROGRESS,MEDIUM,Kofi Owusu,Site C - Old Pit,EPA Ghana,Regulatory requirement
```

**Required Fields:** `code`, `name`, `startDate`  
**Field Notes:**
- `status`: PLANNED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
- `priority`: LOW, MEDIUM, HIGH, CRITICAL
- `budget`: In Ghana Cedis (GH₵)
- `startDate`, `endDate`: Format YYYY-MM-DD

---

#### 6. Fleet Assets Sample (`fleet-assets-sample.csv`)

```csv
assetCode,name,type,category,make,model,year,registrationNo,serialNumber,engineNumber,chassisNumber,fuelType,tankCapacity,purchaseDate,purchasePrice,currentLocation,status,condition,currentOdometer,currentHours,insuranceProvider,insurancePolicyNo,insuranceExpiry,miningPermit,permitExpiry,notes
FLT-EXC-001,CAT 390F L Excavator,HEAVY_MACHINERY,Excavator,Caterpillar,390F L,2021,,CAT390FL21001,C18ACERT21001,CAT390FL21001CH,DIESEL,650,2021-06-15,2500000.00,Site A - Main Pit,ACTIVE,GOOD,0,12500,Enterprise Insurance,EI-2024-001,2025-06-30,MP-2024-001,2025-12-31,Primary excavator
FLT-TRK-001,Volvo A40G Articulated Hauler,TRANSPORT,Haul Truck,Volvo,A40G,2022,,VOLVA40G22001,D13K22001,VOLVA40G22001CH,DIESEL,400,2022-03-20,1800000.00,Site A - Main Pit,ACTIVE,EXCELLENT,85000,8200,SIC Insurance,SIC-2024-001,2025-03-31,MP-2024-002,2025-12-31,40-tonne capacity
FLT-DRL-001,Sandvik DR460i Drill Rig,DRILLING_EQUIPMENT,Blast Hole Drill,Sandvik,DR460i,2020,,SDK460I20001,SDK-ENG-20001,SDK460I20001CH,DIESEL,500,2020-09-10,3200000.00,Site B - North Zone,IN_MAINTENANCE,FAIR,0,15800,Enterprise Insurance,EI-2024-002,2025-09-30,MP-2024-003,2025-12-31,Scheduled overhaul
FLT-VEH-001,Toyota Land Cruiser 300,VEHICLE,Light Vehicle,Toyota,Land Cruiser 300,2023,GR-1234-23,TOYLC300-23001,1GR-FE-23001,JTMCY23001,DIESEL,110,2023-04-12,380000.00,Head Office,ACTIVE,EXCELLENT,25000,0,Star Assurance,SA-2024-001,2025-04-30,,,,Management vehicle
FLT-GEN-001,CAT C18 Generator Set,SUPPORT_EQUIPMENT,Generator,Caterpillar,C18,2023,,CATC18-23001,C18-23001,N/A,DIESEL,1000,2023-01-05,450000.00,Site A - Camp,ACTIVE,EXCELLENT,0,4500,SIC Insurance,SIC-2024-002,2026-01-31,,,,500kVA backup power
```

**Required Fields:** `assetCode`, `name`, `type`, `category`, `make`, `model`  
**Field Notes:**
- `type`: VEHICLE, HEAVY_MACHINERY, DRILLING_EQUIPMENT, PROCESSING_EQUIPMENT, SUPPORT_EQUIPMENT, TRANSPORT
- `currentOdometer`: In kilometers (0 for stationary equipment)
- `currentHours`: Operating hours
- `tankCapacity`: In liters

---

#### 7. Vendors Sample (Procurement) (`vendors-sample.csv`)

```csv
vendorCode,companyName,tradingName,type,category,primaryContact,email,phone,alternatePhone,address,city,region,country,taxId,vatNumber,paymentTerms,creditLimit,bankName,accountNumber,accountName,rating,isPreferred,miningLicense,safetyCompliance,insuranceCert,insuranceExpiry,notes
VND-001,Shell Ghana Limited,Shell,DISTRIBUTOR,"Fuel,Lubricants",Kwame Asante,procurement@shell.com.gh,+233-302-123456,+233-244-567890,15 Independence Avenue,Accra,Greater Accra,Ghana,C0012345678,VAT123456,30,500000.00,GCB Bank,1234567890,Shell Ghana Ltd,4.5,true,,,INS-SHELL-2024,2025-06-30,Preferred fuel supplier
VND-002,Sandvik Mining and Construction Ghana,Sandvik,MANUFACTURER,"Drilling Equipment,Spare Parts",Ama Mensah,ghana.sales@sandvik.com,+233-302-234567,+233-244-678901,Plot 25 Tema Industrial Area,Tema,Greater Accra,Ghana,C0023456789,VAT234567,45,1000000.00,Stanbic Bank,2345678901,Sandvik Ghana,4.8,true,ML-SDK-2024,true,INS-SDK-2024,2025-09-30,OEM parts and equipment
VND-003,Mantrac Ghana Ltd,Caterpillar,DISTRIBUTOR,"Heavy Machinery,Spare Parts,Service",Kofi Owusu,sales@mantracghana.com,+233-302-345678,+233-244-789012,Spintex Road,Accra,Greater Accra,Ghana,C0034567890,VAT345678,60,2000000.00,Standard Chartered,3456789012,Mantrac Ghana Ltd,4.7,true,ML-CAT-2024,true,INS-CAT-2024,2025-12-31,CAT authorized dealer
VND-004,3M Ghana Limited,3M,DISTRIBUTOR,Safety Equipment,Efua Dadzie,orders@3m.com.gh,+233-302-456789,,8 Ring Road Central,Accra,Greater Accra,Ghana,C0045678901,,30,200000.00,Ecobank,4567890123,3M Ghana Limited,4.2,false,,,INS-3M-2024,2025-03-31,PPE supplier
VND-005,Local Mining Services Ltd,LMS,CONTRACTOR,"Maintenance,Repairs",Yaw Boateng,info@lms.com.gh,+233-302-567890,+233-244-890123,Tarkwa Industrial Zone,Tarkwa,Western,Ghana,C0056789012,,14,100000.00,Fidelity Bank,5678901234,Local Mining Services,3.8,false,ML-LMS-2024,true,INS-LMS-2024,2025-06-30,Local repair contractor
```

**Required Fields:** `vendorCode`, `companyName`, `primaryContact`, `email`, `phone`  
**Field Notes:**
- `type`: MANUFACTURER, DISTRIBUTOR, WHOLESALER, RETAILER, SERVICE_PROVIDER, CONTRACTOR
- `category`: Comma-separated list
- `creditLimit`: In Ghana Cedis (GH₵)
- `safetyCompliance`: true/false
- `isPreferred`: true/false

---

### Template Download Implementation

**Backend Endpoint:**
```typescript
@Get('templates/:module/sample')
@Public()
async downloadSampleTemplate(
  @Param('module') module: string,
  @Res() res: Response,
) {
  const template = await this.csvService.getSampleTemplate(module);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${module}-sample.csv`);
  res.send(template);
}
```

**Frontend Download Button:**
```typescript
<Button onClick={() => downloadTemplate(module)}>
  <Download className="h-4 w-4 mr-2" />
  Download Sample CSV
</Button>
```

---

## Testing
- Import 500 inventory items
- Export filtered inventory
- Import suppliers with duplicates
- Export employees by department
- Import assets with validation errors
- Export production logs by date range
- Test all sample CSV downloads

---

# 📋 Session 17.3: Advanced Features & Data Migration Tools

**Duration:** 1 session

## Backend Deliverables

### Batch Import Service (`src/modules/csv/batch-import.service.ts`)
```typescript
// Large file handling with chunking
- processLargeFile(file: Buffer, chunkSize: number): AsyncGenerator<Chunk>
- queueChunkProcessing(jobId: string, chunks: Chunk[]): Promise<void>
- mergeChunkResults(jobId: string): Promise<ImportResult>

// Background processing
- scheduleImport(jobId: string, scheduledTime: Date): Promise<void>
- getQueueStatus(): Promise<QueueStatus>
```

### Data Migration Service (`src/modules/csv/migration.service.ts`)
```typescript
// Full system data migration
- exportFullBackup(): Promise<BackupResult>
- importFullBackup(file: Buffer): Promise<RestoreResult>
- exportModuleData(modules: string[]): Promise<Buffer>
- validateBackupIntegrity(file: Buffer): Promise<ValidationResult>

// Migration from other systems
- importFromExternalSystem(systemType: string, file: Buffer): Promise<ImportResult>
- mapExternalFields(systemType: string, data: any): MappedData
```

### Import/Export History & Audit
```typescript
// Audit trail
- logImportAction(jobId: string, action: string, details: any): Promise<void>
- logExportAction(jobId: string, action: string, details: any): Promise<void>
- getAuditTrail(jobId: string): Promise<AuditEntry[]>

// Rollback capability
- createRollbackPoint(jobId: string): Promise<string>
- rollbackImport(rollbackId: string): Promise<RollbackResult>
```

### API Endpoints
```typescript
// Batch operations
POST   /api/csv/batch/import              // Batch import multiple files
GET    /api/csv/batch/:batchId            // Get batch status
POST   /api/csv/schedule                  // Schedule import

// Data migration
POST   /api/csv/backup/export             // Export full backup
POST   /api/csv/backup/import             // Import backup
GET    /api/csv/backup/validate           // Validate backup file

// History & audit
GET    /api/csv/audit/:jobId              // Get audit trail
POST   /api/csv/rollback/:jobId           // Rollback import
GET    /api/csv/stats                     // Import/export statistics
```

### Scheduled Exports
```prisma
model ScheduledExport {
  id          String   @id @default(uuid())
  name        String
  module      String
  filters     Json?
  columns     String[]
  schedule    String   // Cron expression
  recipients  String[] // Email addresses
  format      String   @default("csv")
  isActive    Boolean  @default(true)
  lastRunAt   DateTime?
  nextRunAt   DateTime?
  createdById String
  createdBy   User     @relation("ScheduledExportCreator", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  
  @@map("scheduled_exports")
}
```

## Frontend Deliverables

### Import History Page (`app/settings/import-export/page.tsx`)
- List all import/export jobs
- Filter by module, status, date
- View job details
- Download error reports
- Rollback option for imports

### Data Migration Page (`app/settings/data-migration/page.tsx`)
- Export full system backup
- Import from backup
- Import from external systems
- Validation results
- Migration progress

### Scheduled Exports Page (`app/settings/scheduled-exports/page.tsx`)
- Create scheduled export
- Set schedule (daily, weekly, monthly)
- Select recipients
- Enable/disable schedules
- View run history

### Import Error Report Component (`components/csv/ImportErrorReport.tsx`)
- List all errors by row
- Group errors by type
- Download error CSV
- Fix suggestions
- Re-import failed rows only

### Export Preview Component (`components/csv/ExportPreview.tsx`)
- Preview first 20 rows
- Column selection
- Row count
- Estimated file size
- Download options

### Settings Menu Integration
Add to Settings submenu:
```typescript
{
  id: 'settings-import-export',
  label: 'Import/Export',
  icon: FileSpreadsheet,
  path: '/settings/import-export',
  roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER],
},
{
  id: 'settings-data-migration',
  label: 'Data Migration',
  icon: DatabaseBackup,
  path: '/settings/data-migration',
  roles: [UserRole.SUPER_ADMIN, UserRole.IT_MANAGER],
},
{
  id: 'settings-scheduled-exports',
  label: 'Scheduled Exports',
  icon: Calendar,
  path: '/settings/scheduled-exports',
  roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO],
},
```

## Testing
- Process 50,000 row import
- Schedule weekly inventory export
- Export full system backup
- Restore from backup
- Rollback failed import
- View import audit trail
- Test scheduled export email delivery

---

# 📊 Phase 17 Summary

## Database Tables Added
1. **import_jobs** - Track import operations
2. **export_jobs** - Track export operations
3. **import_templates** - Reusable column mappings
4. **scheduled_exports** - Automated export schedules

**Total: 4 new tables**

## API Endpoints
- Core CSV endpoints: ~15
- Module-specific endpoints: ~25
- Advanced features: ~10

**Total: ~50 new endpoints**

## Frontend Pages
- `/settings/import-export` - Import/export history
- `/settings/data-migration` - Data migration tools
- `/settings/scheduled-exports` - Scheduled exports

**Total: 3 new pages**

## Components Created
- CSVUpload
- ImportModal
- ExportModal
- ColumnMapper
- ImportButton
- ExportButton
- ImportErrorReport
- ExportPreview
- ImportHistory
- ScheduledExportForm

**Total: ~10 new components**

## Modules with Import/Export Support
1. ✅ Inventory (Stock Items, Movements)
2. ✅ Suppliers/Vendors
3. ✅ Employees
4. ✅ Assets/Equipment
5. ✅ Projects & Tasks
6. ✅ Production Logs
7. ✅ Safety (Inspections, Incidents, Training)
8. ✅ Finance (Invoices, Expenses, Payments)
9. ✅ Warehouses

## Dependencies
```json
{
  "backend": [
    "csv-parser",
    "fast-csv",
    "json2csv",
    "xlsx"
  ],
  "frontend": [
    "react-papaparse",
    "file-saver"
  ]
}
```

## Estimated Development Time
- Session 17.1: 4-6 hours
- Session 17.2: 4-6 hours
- Session 17.3: 4-6 hours

**Total: 12-18 hours**

---

# 🎯 Success Criteria

## Session 17.1
- ✅ CSV files can be uploaded and validated
- ✅ Column mapping works correctly
- ✅ Import jobs are tracked with status
- ✅ Export jobs generate downloadable files

## Session 17.2
- ✅ All major modules support import/export
- ✅ Sample CSV templates are available
- ✅ Duplicate handling works correctly
- ✅ Validation errors are clearly reported

## Session 17.3
- ✅ Large files (50,000+ rows) can be processed
- ✅ Full system backup/restore works
- ✅ Scheduled exports run automatically
- ✅ Import rollback is available
- ✅ Audit trail is complete

---

**Author:** Mining ERP Development Team  
**Last Updated:** December 2025  
**Status:** Ready for Implementation
