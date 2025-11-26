# Mining ERP API Documentation

## Overview

The Mining ERP Backend API provides comprehensive endpoints for managing all aspects of a mining operation, including inventory, assets, finance, HR, safety, and AI-powered features.

**Base URL**: `https://your-domain.com/api`  
**Version**: 1.0.0  
**Authentication**: JWT Bearer Token

---

## Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourSecurePassword",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourPassword"
}

Response:
{
  "access_token": "your-jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

---

## Inventory Management

### Get All Stock Items
```http
GET /api/inventory/items
Authorization: Bearer {token}

Query Parameters:
- warehouseId (optional): Filter by warehouse
- category (optional): Filter by category
- lowStock (optional): Filter items below reorder level
```

### Create Stock Item
```http
POST /api/inventory/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "itemCode": "ITEM-001",
  "name": "Steel Rods",
  "category": "EQUIPMENT",
  "unit": "PIECES",
  "unitPrice": 150.00,
  "reorderLevel": 50,
  "warehouseId": "warehouse-uuid",
  "currentQuantity": 100
}
```

### Record Stock Movement
```http
POST /api/inventory/movements
Authorization: Bearer {token}
Content-Type: application/json

{
  "itemId": "item-uuid",
  "warehouseId": "warehouse-uuid",
  "movementType": "STOCK_IN",
  "quantity": 50,
  "reason": "Supplier delivery"
}
```

---

## Asset Management

### Get All Assets
```http
GET /api/assets
Authorization: Bearer {token}

Query Parameters:
- status (optional): ACTIVE, MAINTENANCE, RETIRED
- category (optional): Filter by category
```

### Create Asset
```http
POST /api/assets
Authorization: Bearer {token}
Content-Type: application/json

{
  "assetCode": "TRUCK-001",
  "name": "Mining Truck",
  "category": "VEHICLE",
  "purchaseDate": "2024-01-15",
  "purchasePrice": 250000,
  "currentValue": 225000,
  "status": "ACTIVE",
  "location": "Site A"
}
```

### Schedule Maintenance
```http
POST /api/assets/{id}/maintenance
Authorization: Bearer {token}
Content-Type: application/json

{
  "scheduledDate": "2025-12-01",
  "maintenanceType": "PREVENTIVE",
  "description": "Regular oil change and inspection"
}
```

---

## Finance Management

### Get All Budgets
```http
GET /api/finance/budgets
Authorization: Bearer {token}

Query Parameters:
- year (optional): Filter by fiscal year
- department (optional): Filter by department
```

### Create Budget
```http
POST /api/finance/budgets
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Q1 Operations Budget",
  "category": "OPERATIONS",
  "allocatedAmount": 500000,
  "department": "Operations",
  "fiscalYear": "2025",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31"
}
```

### Record Expense
```http
POST /api/finance/expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Equipment maintenance",
  "amount": 5000,
  "category": "MAINTENANCE",
  "budgetId": "budget-uuid",
  "expenseDate": "2025-11-26",
  "receiptUrl": "https://example.com/receipt.pdf"
}
```

---

## HR Management

### Get All Employees
```http
GET /api/hr/employees
Authorization: Bearer {token}

Query Parameters:
- status (optional): ACTIVE, ON_LEAVE, SUSPENDED, TERMINATED
- department (optional): Filter by department
```

### Create Employee
```http
POST /api/hr/employees
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": "EMP-001",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@company.com",
  "phone": "+233123456789",
  "position": "Mining Engineer",
  "department": "Engineering",
  "hireDate": "2025-01-01",
  "salary": 75000,
  "status": "ACTIVE"
}
```

### Record Attendance
```http
POST /api/hr/attendance
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": "employee-uuid",
  "date": "2025-11-26",
  "checkIn": "08:00:00",
  "checkOut": "17:00:00",
  "status": "PRESENT"
}
```

### Submit Leave Request
```http
POST /api/hr/leave-requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": "employee-uuid",
  "leaveType": "ANNUAL",
  "startDate": "2025-12-20",
  "endDate": "2025-12-24",
  "reason": "Family vacation",
  "daysRequested": 5
}
```

---

## Safety & Compliance

### Get All Inspections
```http
GET /api/safety/inspections
Authorization: Bearer {token}

Query Parameters:
- status (optional): SCHEDULED, IN_PROGRESS, COMPLETED
- type (optional): ROUTINE, INCIDENT, COMPLIANCE
```

### Create Safety Inspection
```http
POST /api/safety/inspections
Authorization: Bearer {token}
Content-Type: application/json

{
  "inspectionType": "ROUTINE",
  "location": "Site A - Zone 1",
  "scheduledDate": "2025-11-30",
  "inspectorId": "user-uuid",
  "checklist": ["Safety equipment", "Ventilation", "Emergency exits"]
}
```

### Record Safety Training
```http
POST /api/safety/trainings
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Mine Safety Procedures",
  "trainingType": "SAFETY",
  "scheduledDate": "2025-12-05",
  "duration": 240,
  "instructor": "John Doe",
  "maxParticipants": 20
}
```

---

## AI Intelligence Layer

### Get Procurement Recommendations
```http
POST /api/ai/procurement-advisor
Authorization: Bearer {token}
Content-Type: application/json

{
  "itemId": "item-uuid",
  "currentStock": 25,
  "avgConsumption": 10
}

Response:
{
  "recommendation": "URGENT_ORDER",
  "suggestedQuantity": 150,
  "reasoning": "Stock below reorder level...",
  "supplierSuggestions": [...],
  "costAnalysis": {...}
}
```

### Get Maintenance Predictions
```http
POST /api/ai/maintenance-predictor
Authorization: Bearer {token}
Content-Type: application/json

{
  "assetId": "asset-uuid"
}

Response:
{
  "riskScore": 75,
  "riskLevel": "HIGH",
  "predictedFailureDate": "2025-12-15",
  "recommendedActions": [...],
  "estimatedCost": 15000
}
```

### Knowledge Engine Q&A
```http
POST /api/ai/knowledge-engine/ask
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "What are the safety protocols for drilling?"
}

Response:
{
  "answer": "Drilling safety protocols include...",
  "confidence": 0.92,
  "sources": [...],
  "relatedDocuments": [...]
}
```

---

## Reports & Analytics

### Get Dashboard Analytics
```http
GET /api/reports/dashboard
Authorization: Bearer {token}

Response:
{
  "inventory": {
    "total": 450,
    "lowStock": 12
  },
  "assets": {
    "total": 85,
    "active": 72
  },
  "projects": {
    "total": 15,
    "active": 8
  },
  "finance": {
    "totalBudgets": 2500000,
    "totalExpenses": 1850000
  }
}
```

### Get Financial Summary
```http
GET /api/reports/financial/summary
Authorization: Bearer {token}

Query Parameters:
- startDate (optional): YYYY-MM-DD
- endDate (optional): YYYY-MM-DD
```

### Get Operational Reports
```http
GET /api/reports/operational/inventory
GET /api/reports/operational/assets
GET /api/reports/operational/projects
Authorization: Bearer {token}
```

### Get HR Reports
```http
GET /api/reports/hr
Authorization: Bearer {token}

Query Parameters:
- startDate (optional): YYYY-MM-DD
- endDate (optional): YYYY-MM-DD
```

### Get Safety Reports
```http
GET /api/reports/safety
Authorization: Bearer {token}

Query Parameters:
- startDate (optional): YYYY-MM-DD
- endDate (optional): YYYY-MM-DD
```

---

## Settings & Administration

### Get System Configuration
```http
GET /api/settings/config
Authorization: Bearer {token}
```

### Update System Configuration
```http
PUT /api/settings/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "companyName": "Mining Operations Ltd",
  "currency": "GHS",
  "timezone": "Africa/Accra",
  "features": {
    "approvals": true,
    "ai": true
  }
}
```

### Get All Users
```http
GET /api/settings/users
Authorization: Bearer {token}

Query Parameters:
- role (optional): Filter by role
- status (optional): Filter by status
- search (optional): Search by name or email
```

### Create User
```http
POST /api/settings/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE",
  "status": "ACTIVE",
  "department": "Operations",
  "position": "Operator"
}
```

### Get Audit Logs
```http
GET /api/settings/audit-logs
Authorization: Bearer {token}

Query Parameters:
- limit (optional): Number of logs to return (default: 50)
```

---

## Error Handling

All endpoints return standard HTTP status codes:

### Success Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Delete successful

### Error Codes
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `500 Internal Server Error`: Server error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

---

## Pagination

List endpoints support pagination:

```http
GET /api/resource?page=1&limit=20

Response:
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## User Roles & Permissions

### Available Roles
- `SUPER_ADMIN`: Full system access
- `CEO`: Executive access
- `CFO`: Financial management
- `DEPARTMENT_HEAD`: Department oversight
- `ACCOUNTANT`: Financial operations
- `PROCUREMENT_OFFICER`: Procurement management
- `OPERATIONS_MANAGER`: Operations oversight
- `IT_MANAGER`: System administration
- `HR_MANAGER`: HR management
- `SAFETY_OFFICER`: Safety compliance
- `WAREHOUSE_MANAGER`: Inventory management
- `EMPLOYEE`: Basic access

---

## WebSocket Events

Real-time notifications via WebSocket connection:

```javascript
const socket = io('https://your-domain.com', {
  auth: { token: 'your-jwt-token' }
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});

socket.on('approval-update', (data) => {
  console.log('Approval status changed:', data);
});
```

---

## Support

For API support and questions:
- **Email**: api-support@miningops.com
- **Documentation**: https://docs.miningops.com
- **Status Page**: https://status.miningops.com

---

**Last Updated**: November 26, 2025  
**Version**: 1.0.0
