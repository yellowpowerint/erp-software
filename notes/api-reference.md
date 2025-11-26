# Mining ERP API Reference

**Version:** 1.0  
**Base URL:** `https://your-backend-url.com/api`  
**Authentication:** JWT Bearer Token  
**Last Updated:** November 25, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users Management](#users-management)
3. [Approvals Module](#approvals-module)
4. [Inventory Module](#inventory-module)
5. [Assets Module](#assets-module)
6. [Projects Module](#projects-module)
7. [Operations Module](#operations-module)
8. [Finance Module](#finance-module)
9. [Error Codes](#error-codes)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

All API requests require authentication using JWT Bearer tokens.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "<jwt-access-token>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ACCOUNTANT"
  }
}
```

### Using Authentication
Include the token in the Authorization header:
```http
Authorization: Bearer <jwt-access-token>
```

---

## Users Management

### Get Current User
```http
GET /auth/me
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ACCOUNTANT",
  "department": "Finance",
  "status": "ACTIVE"
}
```

---

## Approvals Module

### Get Pending Approvals
```http
GET /approvals/pending
```

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "INVOICE",
    "referenceId": "uuid",
    "status": "PENDING",
    "createdAt": "2025-11-25T10:00:00Z"
  }
]
```

---

## Inventory Module

### Get All Stock Items
```http
GET /inventory/items?category=EQUIPMENT&warehouse=uuid
```

**Query Parameters:**
- `category` (optional): Filter by category
- `warehouse` (optional): Filter by warehouse ID
- `status` (optional): Filter by status (AVAILABLE, LOW_STOCK, OUT_OF_STOCK)

**Response:**
```json
[
  {
    "id": "uuid",
    "itemCode": "ITM-001",
    "name": "Safety Helmet",
    "category": "SAFETY_EQUIPMENT",
    "quantity": 150,
    "unit": "PIECES",
    "reorderLevel": 50,
    "status": "AVAILABLE"
  }
]
```

### Create Stock Item
```http
POST /inventory/items
Content-Type: application/json

{
  "name": "Safety Helmet",
  "category": "SAFETY_EQUIPMENT",
  "quantity": 150,
  "unit": "PIECES",
  "reorderLevel": 50,
  "warehouseId": "uuid"
}
```

### Update Stock Item
```http
PUT /inventory/items/:id
Content-Type: application/json

{
  "quantity": 200,
  "reorderLevel": 60
}
```

### Delete Stock Item
```http
DELETE /inventory/items/:id
```

### Get Inventory Statistics
```http
GET /inventory/stats
```

**Response:**
```json
{
  "totalItems": 245,
  "lowStockItems": 12,
  "outOfStockItems": 3,
  "totalValue": 125000.50
}
```

---

## Assets Module

### Get All Assets
```http
GET /assets?status=ACTIVE&category=VEHICLE
```

**Query Parameters:**
- `status` (optional): ACTIVE, MAINTENANCE, RETIRED, DISPOSED
- `category` (optional): Filter by category

**Response:**
```json
[
  {
    "id": "uuid",
    "assetCode": "AST-001",
    "name": "Excavator CAT-320",
    "category": "HEAVY_MACHINERY",
    "status": "ACTIVE",
    "purchaseDate": "2024-01-15",
    "purchasePrice": 250000.00,
    "currentValue": 220000.00
  }
]
```

### Create Asset
```http
POST /assets
Content-Type: application/json

{
  "name": "Excavator CAT-320",
  "category": "HEAVY_MACHINERY",
  "purchaseDate": "2024-01-15",
  "purchasePrice": 250000.00,
  "serialNumber": "CAT320-12345",
  "manufacturer": "Caterpillar"
}
```

### Get Asset Maintenance History
```http
GET /assets/:id/maintenance
```

**Response:**
```json
[
  {
    "id": "uuid",
    "maintenanceDate": "2025-10-15",
    "maintenanceType": "PREVENTIVE",
    "description": "Oil change and filter replacement",
    "cost": 500.00,
    "performedBy": "John Mechanic"
  }
]
```

---

## Projects Module

### Get All Projects
```http
GET /projects?status=ACTIVE&priority=HIGH
```

**Query Parameters:**
- `status` (optional): PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
- `priority` (optional): LOW, MEDIUM, HIGH, CRITICAL

**Response:**
```json
[
  {
    "id": "uuid",
    "projectCode": "PROJ-001",
    "name": "Tarkwa Mine Expansion",
    "status": "ACTIVE",
    "priority": "HIGH",
    "progress": 65,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "estimatedBudget": 1000000.00,
    "actualCost": 650000.00
  }
]
```

### Create Project
```http
POST /projects
Content-Type: application/json

{
  "name": "Tarkwa Mine Expansion",
  "description": "Expansion of mining operations",
  "status": "PLANNING",
  "priority": "HIGH",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "estimatedBudget": 1000000.00,
  "location": "Tarkwa"
}
```

### Get Project by ID
```http
GET /projects/:id
```

**Response:**
```json
{
  "id": "uuid",
  "projectCode": "PROJ-001",
  "name": "Tarkwa Mine Expansion",
  "status": "ACTIVE",
  "priority": "HIGH",
  "progress": 65,
  "milestones": [
    {
      "id": "uuid",
      "name": "Phase 1 Completion",
      "dueDate": "2025-06-30",
      "status": "IN_PROGRESS",
      "progress": 80
    }
  ],
  "tasks": [
    {
      "id": "uuid",
      "title": "Site Survey",
      "status": "COMPLETED",
      "assignedTo": "uuid",
      "dueDate": "2025-02-15"
    }
  ]
}
```

### Create Milestone
```http
POST /projects/:projectId/milestones
Content-Type: application/json

{
  "name": "Phase 1 Completion",
  "description": "Complete first phase of expansion",
  "dueDate": "2025-06-30"
}
```

### Create Task
```http
POST /projects/:projectId/tasks
Content-Type: application/json

{
  "title": "Site Survey",
  "description": "Conduct geological survey",
  "assignedTo": "uuid",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2025-02-15"
}
```

### Get Project Statistics
```http
GET /projects/stats
```

**Response:**
```json
{
  "totalProjects": 15,
  "activeProjects": 8,
  "completedProjects": 5,
  "onHoldProjects": 2
}
```

---

## Operations Module

### Production Logs

#### Create Production Log
```http
POST /operations/production-logs
Content-Type: application/json

{
  "projectId": "uuid",
  "date": "2025-11-25",
  "shiftType": "DAY",
  "activityType": "MINING",
  "location": "Pit A, Level 3",
  "quantity": 150.5,
  "unit": "TONS",
  "equipmentUsed": "Excavator CAT-320D",
  "operatorName": "John Operator",
  "createdById": "uuid"
}
```

**Activity Types:**
- MINING, DRILLING, BLASTING, HAULING, CRUSHING, PROCESSING, MAINTENANCE, OTHER

**Shift Types:**
- DAY, NIGHT, MORNING, AFTERNOON, EVENING

#### Get Production Logs
```http
GET /operations/production-logs?date=2025-11-25&shiftType=DAY
```

**Response:**
```json
[
  {
    "id": "uuid",
    "date": "2025-11-25",
    "shiftType": "DAY",
    "activityType": "MINING",
    "location": "Pit A, Level 3",
    "quantity": 150.5,
    "unit": "TONS",
    "equipmentUsed": "Excavator CAT-320D",
    "operatorName": "John Operator"
  }
]
```

---

### Field Reports

#### Create Field Report
```http
POST /operations/field-reports
Content-Type: application/json

{
  "projectId": "uuid",
  "reportDate": "2025-11-25",
  "location": "Tarkwa Mine Site, Pit B",
  "reportedBy": "John Inspector",
  "title": "Safety Inspection Report",
  "description": "Routine safety inspection findings",
  "findings": "All safety protocols being followed",
  "recommendations": "Continue current practices",
  "priority": "MEDIUM"
}
```

**Priority Levels:**
- LOW, MEDIUM, HIGH, CRITICAL

#### Get Field Reports
```http
GET /operations/field-reports?priority=HIGH&projectId=uuid
```

---

### Operations Reports

#### Production Report
```http
GET /operations/reports/production?startDate=2025-11-01&endDate=2025-11-30
```

**Response:**
```json
{
  "totalLogs": 120,
  "totalProduction": 18000.5,
  "byActivity": [
    {
      "activity": "MINING",
      "totalQuantity": 12000.0,
      "count": 80
    }
  ],
  "byShift": [
    {
      "shift": "DAY",
      "totalQuantity": 10000.0,
      "count": 60
    }
  ],
  "dailyProduction": [
    {
      "date": "2025-11-01",
      "quantity": 150.5,
      "count": 1
    }
  ]
}
```

#### Equipment Utilization Report
```http
GET /operations/reports/equipment-utilization?startDate=2025-11-01&endDate=2025-11-30
```

**Response:**
```json
{
  "totalEquipment": 15,
  "equipment": [
    {
      "equipment": "Excavator CAT-320D",
      "usageCount": 45,
      "totalProduction": 6750.0,
      "lastUsed": "2025-11-25"
    }
  ]
}
```

#### Shift Performance Report
```http
GET /operations/reports/shift-performance?startDate=2025-11-01&endDate=2025-11-30
```

**Response:**
```json
{
  "totalShifts": 90,
  "byShiftType": [
    {
      "shiftType": "DAY",
      "totalShifts": 30,
      "totalProduction": 10000.0,
      "avgProduction": 333.33
    }
  ]
}
```

#### Project Progress Report
```http
GET /operations/reports/project-progress
```

**Response:**
```json
[
  {
    "projectCode": "PROJ-001",
    "name": "Tarkwa Mine Expansion",
    "status": "ACTIVE",
    "progress": 65,
    "productionLogs": 45,
    "totalProduction": 6750.0,
    "fieldReports": 12,
    "criticalReports": 2,
    "milestones": 5,
    "tasks": 25
  }
]
```

---

## Finance Module

### Payments

#### Create Payment
```http
POST /finance/payments
Content-Type: application/json

{
  "supplierId": "uuid",
  "projectId": "uuid",
  "amount": 5000.00,
  "currency": "GHS",
  "paymentMethod": "BANK_TRANSFER",
  "paymentDate": "2025-11-25",
  "reference": "REF-12345",
  "description": "Payment for supplies",
  "category": "Supplies"
}
```

**Payment Methods:**
- BANK_TRANSFER, CHEQUE, CASH, MOBILE_MONEY, CREDIT_CARD, WIRE_TRANSFER

**Payment Statuses:**
- PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

#### Get Payments
```http
GET /finance/payments?status=PENDING&supplierId=uuid
```

**Query Parameters:**
- `status` (optional): Filter by payment status
- `supplierId` (optional): Filter by supplier
- `projectId` (optional): Filter by project
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range

**Response:**
```json
[
  {
    "id": "uuid",
    "paymentNumber": "PMT-1732570800-1",
    "supplier": {
      "supplierCode": "SUP-001",
      "name": "ABC Suppliers Ltd"
    },
    "amount": 5000.00,
    "currency": "GHS",
    "paymentMethod": "BANK_TRANSFER",
    "paymentDate": "2025-11-25",
    "status": "PENDING",
    "description": "Payment for supplies"
  }
]
```

#### Update Payment
```http
PUT /finance/payments/:id
Content-Type: application/json

{
  "status": "COMPLETED",
  "reference": "REF-12345-UPDATED",
  "approvedById": "uuid"
}
```

---

### Expenses

#### Create Expense
```http
POST /finance/expenses
Content-Type: application/json

{
  "category": "TRAVEL",
  "projectId": "uuid",
  "description": "Business travel to site",
  "amount": 500.00,
  "currency": "GHS",
  "expenseDate": "2025-11-25",
  "submittedById": "uuid",
  "receipt": "https://example.com/receipt.pdf"
}
```

**Expense Categories:**
- OPERATIONS, MAINTENANCE, SALARIES, SUPPLIES, UTILITIES, FUEL, EQUIPMENT, TRAVEL, PROFESSIONAL_SERVICES, TRAINING, INSURANCE, OTHER

**Expense Statuses:**
- PENDING, APPROVED, REJECTED, CANCELLED

#### Get Expenses
```http
GET /finance/expenses?status=PENDING&category=TRAVEL
```

**Response:**
```json
[
  {
    "id": "uuid",
    "expenseNumber": "EXP-1732570800-1",
    "category": "TRAVEL",
    "description": "Business travel to site",
    "amount": 500.00,
    "currency": "GHS",
    "expenseDate": "2025-11-25",
    "status": "PENDING",
    "submittedBy": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

#### Approve/Reject Expense
```http
PUT /finance/expenses/:id
Content-Type: application/json

{
  "status": "APPROVED",
  "approvedById": "uuid",
  "notes": "Approved for reimbursement"
}
```

---

### Budgets

#### Create Budget
```http
POST /finance/budgets
Content-Type: application/json

{
  "name": "Q4 2025 Operations Budget",
  "description": "Quarterly operations budget",
  "category": "OPERATIONS",
  "projectId": "uuid",
  "period": "QUARTERLY",
  "startDate": "2025-10-01",
  "endDate": "2025-12-31",
  "allocatedAmount": 500000.00,
  "currency": "GHS",
  "createdById": "uuid"
}
```

**Budget Periods:**
- MONTHLY, QUARTERLY, YEARLY

#### Get Budgets
```http
GET /finance/budgets?category=OPERATIONS&period=QUARTERLY
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Q4 2025 Operations Budget",
    "category": "OPERATIONS",
    "period": "QUARTERLY",
    "startDate": "2025-10-01",
    "endDate": "2025-12-31",
    "allocatedAmount": 500000.00,
    "spentAmount": 320000.00,
    "currency": "GHS"
  }
]
```

#### Update Budget
```http
PUT /finance/budgets/:id
Content-Type: application/json

{
  "allocatedAmount": 550000.00,
  "spentAmount": 350000.00
}
```

---

### Suppliers

#### Create Supplier
```http
POST /finance/suppliers
Content-Type: application/json

{
  "name": "ABC Suppliers Ltd",
  "contactPerson": "Jane Smith",
  "email": "jane@abcsuppliers.com",
  "phone": "+233123456789",
  "address": "123 Main St",
  "city": "Accra",
  "country": "Ghana",
  "taxId": "TAX-12345",
  "bankAccount": "ACC-67890",
  "paymentTerms": "Net 30",
  "category": "Equipment",
  "rating": 4
}
```

#### Get Suppliers
```http
GET /finance/suppliers?isActive=true&category=Equipment
```

**Response:**
```json
[
  {
    "id": "uuid",
    "supplierCode": "SUP-1732570800-1",
    "name": "ABC Suppliers Ltd",
    "contactPerson": "Jane Smith",
    "email": "jane@abcsuppliers.com",
    "phone": "+233123456789",
    "city": "Accra",
    "country": "Ghana",
    "category": "Equipment",
    "rating": 4,
    "isActive": true
  }
]
```

#### Get Supplier Details with Payment History
```http
GET /finance/suppliers/:id
```

**Response:**
```json
{
  "id": "uuid",
  "supplierCode": "SUP-001",
  "name": "ABC Suppliers Ltd",
  "contactPerson": "Jane Smith",
  "email": "jane@abcsuppliers.com",
  "payments": [
    {
      "id": "uuid",
      "paymentNumber": "PMT-001",
      "amount": 5000.00,
      "currency": "GHS",
      "paymentMethod": "BANK_TRANSFER",
      "paymentDate": "2025-11-25",
      "status": "COMPLETED"
    }
  ]
}
```

---

### Finance Statistics
```http
GET /finance/stats
```

**Response:**
```json
{
  "totalPayments": 45,
  "pendingPayments": 3,
  "totalPaymentsAmount": 125000.50,
  "totalExpenses": 28,
  "pendingExpenses": 5,
  "totalExpensesAmount": 45000.00,
  "totalBudgets": 12,
  "totalBudgetAllocated": 500000.00,
  "totalBudgetSpent": 320000.00,
  "activeSuppliers": 15
}
```

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be a positive number"
    }
  ]
}
```

---

## Rate Limiting

**Default Limits:**
- 100 requests per minute per IP
- 1000 requests per hour per user

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1732571400
```

**Rate Limit Exceeded Response:**
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfter": 60
}
```

---

## Pagination

For endpoints returning lists, pagination is supported:

```http
GET /inventory/items?page=1&limit=20
```

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "totalPages": 13
  }
}
```

---

## Filtering & Sorting

### Filtering
Most list endpoints support filtering through query parameters:

```http
GET /projects?status=ACTIVE&priority=HIGH
```

### Sorting
Use `sortBy` and `order` parameters:

```http
GET /inventory/items?sortBy=name&order=asc
```

**Sort Orders:**
- `asc`: Ascending
- `desc`: Descending

---

## Date Format

All dates should be in ISO 8601 format:
- Date: `2025-11-25`
- DateTime: `2025-11-25T10:30:00Z`

---

## Supported Currencies

- GHS - Ghana Cedi
- USD - US Dollar
- EUR - Euro
- GBP - British Pound

---

*End of API Reference*
