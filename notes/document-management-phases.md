# Mining ERP - Document Management System Implementation Plan

## Tech Stack Extensions
- **Backend:** NestJS + Multer (file uploads) + AWS S3/Cloudinary (storage) + pdf-lib + pdfkit
- **Frontend:** react-pdf + signature_pad + react-dropzone + pdfjs-dist
- **OCR:** Tesseract.js (Phase 2) or Google Cloud Vision API
- **Storage:** AWS S3 or Cloudinary for production
- **File Processing:** Sharp (images), pdf-lib (PDF manipulation)

---

# 📋 PHASE 15: Core Document Management System
**Duration:** Sessions 15.1 - 15.5 (5 sessions)  
**Objective:** Build foundational document management with upload, storage, versioning, PDF generation, and granular permission management capabilities.

---

## Session 15.1: Document Module Setup & File Upload System

**Duration:** 1 session

### Backend Deliverables:
- ✅ **Database Schema** - Add document models to Prisma schema:
  ```prisma
  model Document {
    id          String   @id @default(uuid())
    fileName    String
    originalName String
    fileSize    Int
    mimeType    String
    fileUrl     String   // S3/Cloudinary URL
    category    DocumentCategory
    module      String   // 'invoice', 'project', 'safety', 'hr', etc.
    referenceId String?  // Link to parent record (invoiceId, projectId, etc.)
    description String?
    tags        String[] // Searchable tags
    version     Int      @default(1)
    isLatest    Boolean  @default(true)
    uploadedById String
    uploadedBy  User     @relation("DocumentUploader", fields: [uploadedById], references: [id])
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    // Relations
    versions    DocumentVersion[]
    metadata    DocumentMetadata?
    permissions DocumentPermission[]
    
    @@index([module, referenceId])
    @@index([category])
    @@index([uploadedById])
    @@map("documents")
  }

  model DocumentVersion {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    versionNumber Int
    fileName    String
    fileUrl     String
    fileSize    Int
    uploadedById String
    uploadedBy  User     @relation("VersionUploader", fields: [uploadedById], references: [id])
    changeNotes String?
    createdAt   DateTime @default(now())
    
    @@unique([documentId, versionNumber])
    @@map("document_versions")
  }

  model DocumentMetadata {
    id          String   @id @default(uuid())
    documentId  String   @unique
    document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    pageCount   Int?
    author      String?
    title       String?
    subject     String?
    keywords    String[]
    createdDate DateTime?
    modifiedDate DateTime?
    extractedText String?  // For OCR/search
    
    @@map("document_metadata")
  }

  model DocumentPermission {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    role        UserRole
    canView     Boolean  @default(false)
    canEdit     Boolean  @default(false)
    canDelete   Boolean  @default(false)
    canShare    Boolean  @default(false)
    
    @@unique([documentId, role])
    @@map("document_permissions")
  }

  enum DocumentCategory {
    INVOICE
    RECEIPT
    PURCHASE_ORDER
    QUOTATION
    CONTRACT
    SAFETY_REPORT
    INCIDENT_REPORT
    COMPLIANCE_DOC
    PROJECT_REPORT
    HR_DOCUMENT
    PAYROLL
    TAX_FORM
    AUDIT_DOCUMENT
    TRAINING_MATERIAL
    CERTIFICATE
    EQUIPMENT_MANUAL
    OTHER
  }
  ```

- ✅ **Documents Module** - Create `src/modules/documents/documents.module.ts`
- ✅ **File Upload Service** - Configure Multer with validation:
  - File size limits (configurable, default 10MB)
  - MIME type validation
  - File name sanitization
  - Virus scanning hook (placeholder for future)
- ✅ **Storage Service** - Abstract storage layer supporting:
  - Local storage (development)
  - AWS S3 (production)
  - Cloudinary (alternative)
- ✅ **API Endpoints**:
  ```typescript
  POST   /api/documents/upload          // Upload single file
  POST   /api/documents/upload-multiple // Upload multiple files
  GET    /api/documents                 // List documents (with filters)
  GET    /api/documents/:id             // Get document details
  GET    /api/documents/:id/download    // Download file
  DELETE /api/documents/:id             // Delete document
  PUT    /api/documents/:id             // Update metadata
  GET    /api/documents/search          // Search documents
  ```

### Frontend Deliverables:
- ✅ **Document Upload Component** (`components/documents/DocumentUpload.tsx`):
  - Drag & drop interface using react-dropzone
  - File preview before upload
  - Progress indicator
  - Multiple file support
  - File type validation
  - Size validation with user feedback
- ✅ **Document Types** (`types/document.ts`):
  ```typescript
  interface Document {
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    category: DocumentCategory;
    module: string;
    referenceId?: string;
    description?: string;
    tags: string[];
    version: number;
    uploadedBy: User;
    createdAt: string;
    updatedAt: string;
  }
  ```
- ✅ **Document Service Hook** (`hooks/useDocuments.ts`)
- ✅ **Basic file management utilities** (`lib/utils/file.ts`)

### Testing:
- Upload single file
- Upload multiple files
- Validate file size limits
- Validate file types
- Error handling for failed uploads

---

## Session 15.2: Document Library & Management UI

**Duration:** 1 session

### Backend Deliverables:
- ✅ **Enhanced Search API**:
  ```typescript
  GET /api/documents/search?query=invoice&category=INVOICE&module=finance&startDate=2024-01-01
  GET /api/documents/by-module/:module/:referenceId  // Get all docs for a record
  GET /api/documents/recent                          // Recently uploaded
  GET /api/documents/my-uploads                      // Current user's uploads
  ```
- ✅ **Batch Operations API**:
  ```typescript
  POST   /api/documents/batch-delete    // Delete multiple documents
  POST   /api/documents/batch-download  // Download as ZIP
  PATCH  /api/documents/batch-tag       // Add tags to multiple
  ```
- ✅ **Document Analytics**:
  ```typescript
  GET /api/documents/stats              // Total size, count by category, etc.
  GET /api/documents/storage-usage      // Storage usage by module/user
  ```

### Frontend Deliverables:
- ✅ **Documents Main Page** (`app/documents/page.tsx`):
  - Grid/List view toggle
  - Filter sidebar (category, module, date range, file type)
  - Search bar with instant results
  - Bulk actions (select multiple, delete, download)
  - Sort options (name, date, size, category)
- ✅ **Document Card Component** (`components/documents/DocumentCard.tsx`):
  - File icon based on type
  - File name, size, uploaded by, date
  - Quick actions (view, download, delete, share)
  - File preview thumbnail (for images/PDFs)
- ✅ **Document Detail Modal** (`components/documents/DocumentDetailModal.tsx`):
  - Full metadata display
  - Version history
  - Download/delete actions
  - Preview pane (for images/PDFs)
  - Edit metadata form
  - Tag management
- ✅ **Document Viewer Component** (`components/documents/DocumentViewer.tsx`):
  - PDF viewer using react-pdf
  - Image viewer with zoom
  - Text file viewer
  - "Cannot preview" fallback for other types
- ✅ **Quick Document Widget** (`components/documents/RecentDocumentsWidget.tsx`):
  - Show recent uploads on dashboard
  - Quick access to important documents
- ✅ **Integration Components**:
  - `DocumentsTab` for invoices, projects, etc.
  - `AttachDocuments` button for any module

### Menu Structure Addition:
Add to `lib/config/menu.ts`:
```typescript
import { FileText } from 'lucide-react';

{
  id: 'documents',
  label: 'Documents & Files',
  icon: FileText,
  path: '/documents',
  roles: [
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  ],
  children: [
    {
      id: 'documents-all',
      label: 'All Documents',
      icon: FileText,
      path: '/documents',
      roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.DEPARTMENT_HEAD, UserRole.ACCOUNTANT, UserRole.PROCUREMENT_OFFICER, UserRole.OPERATIONS_MANAGER, UserRole.IT_MANAGER, UserRole.HR_MANAGER, UserRole.SAFETY_OFFICER, UserRole.WAREHOUSE_MANAGER, UserRole.EMPLOYEE],
    },
    {
      id: 'documents-my',
      label: 'My Uploads',
      icon: Upload,
      path: '/documents/my-uploads',
      roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.DEPARTMENT_HEAD, UserRole.ACCOUNTANT, UserRole.PROCUREMENT_OFFICER, UserRole.OPERATIONS_MANAGER, UserRole.IT_MANAGER, UserRole.HR_MANAGER, UserRole.SAFETY_OFFICER, UserRole.WAREHOUSE_MANAGER, UserRole.EMPLOYEE],
    },
    {
      id: 'documents-finance',
      label: 'Finance Documents',
      icon: DollarSign,
      path: '/documents?category=finance',
      roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO, UserRole.ACCOUNTANT],
    },
    {
      id: 'documents-safety',
      label: 'Safety Documents',
      icon: Shield,
      path: '/documents?category=safety',
      roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.SAFETY_OFFICER, UserRole.OPERATIONS_MANAGER],
    },
    {
      id: 'documents-hr',
      label: 'HR Documents',
      icon: Users,
      path: '/documents?category=hr',
      roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.HR_MANAGER],
    },
    {
      id: 'documents-projects',
      label: 'Project Documents',
      icon: HardHat,
      path: '/documents?category=projects',
      roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.OPERATIONS_MANAGER, UserRole.DEPARTMENT_HEAD],
    },
  ],
},
```

### Testing:
- Browse documents with filters
- Search functionality
- View document details
- Preview PDFs and images
- Download documents
- Delete documents (with confirmation)
- Bulk operations

---

## Session 15.3: Document Versioning & PDF Generation

**Duration:** 1 session

### Backend Deliverables:
- ✅ **Document Versioning Service**:
  - Upload new version of existing document
  - Maintain version history
  - Restore previous version
  - Compare versions
- ✅ **Versioning API**:
  ```typescript
  POST   /api/documents/:id/versions      // Upload new version
  GET    /api/documents/:id/versions      // Get version history
  GET    /api/documents/:id/versions/:versionNumber  // Get specific version
  POST   /api/documents/:id/restore/:versionNumber   // Restore old version
  ```
- ✅ **PDF Generation Service** (`services/pdf-generator.service.ts`):
  - Generate invoice PDFs from data
  - Generate purchase order PDFs
  - Generate project reports
  - Generate expense reports
  - Customizable templates using pdfkit
- ✅ **PDF Generation API**:
  ```typescript
  POST   /api/documents/generate/invoice/:invoiceId
  POST   /api/documents/generate/purchase-order/:poId
  POST   /api/documents/generate/expense-report/:expenseId
  POST   /api/documents/generate/project-report/:projectId
  POST   /api/documents/generate/custom      // Custom PDF from template
  ```
- ✅ **PDF Template System**:
  - Company header with logo
  - Footer with page numbers
  - Standard formatting (Ghana Cedis currency)
  - QR code for document verification

### Frontend Deliverables:
- ✅ **Version History Component** (`components/documents/VersionHistory.tsx`):
  - List all versions with details
  - Compare versions side-by-side
  - Restore previous version
  - Download specific version
- ✅ **PDF Generation Buttons**:
  - "Generate PDF" button on invoice detail page
  - "Generate PDF" button on purchase order page
  - "Export as PDF" button on reports
  - "Generate PDF Report" on project detail page
- ✅ **PDF Preview Component**:
  - Preview generated PDF before saving
  - Option to edit and regenerate
  - Save to document library
- ✅ **Generate Document Modal** (`components/documents/GenerateDocumentModal.tsx`):
  - Select document type
  - Choose template
  - Configure options (include attachments, watermark, etc.)
  - Generate and preview

### PDF Templates Created:
1. **Invoice Template** - Professional invoice with company branding
2. **Purchase Order Template** - Standard PO format
3. **Project Summary Template** - Executive summary with charts
4. **Expense Report Template** - Detailed expense breakdown
5. **Safety Report Template** - Incident/compliance report format

### Testing:
- Upload new version of document
- View version history
- Restore previous version
- Generate invoice PDF
- Generate purchase order PDF
- Generate project report PDF
- Preview before saving
- Verify PDF content and formatting

---

## Session 15.4: Digital Signatures & Document Security

**Duration:** 1 session

### Backend Deliverables:
- ✅ **Digital Signature System**:
  ```prisma
  model DocumentSignature {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    signerId    String
    signer      User     @relation("DocumentSigner", fields: [signerId], references: [id])
    signatureData String  // Base64 encoded signature image
    signatureType SignatureType
    ipAddress   String
    userAgent   String
    location    String?  // GPS coordinates if available
    signedAt    DateTime @default(now())
    isValid     Boolean  @default(true)
    revokedAt   DateTime?
    revokedBy   String?
    
    @@map("document_signatures")
  }

  enum SignatureType {
    DRAWN        // Hand-drawn signature
    TYPED        // Typed name
    UPLOADED     // Uploaded signature image
    CERTIFICATE  // Digital certificate (future)
  }
  ```
- ✅ **Signature Service**:
  - Add signature to document
  - Embed signature in PDF
  - Verify signature authenticity
  - Generate signature certificate
  - Timestamp and hash validation
- ✅ **Signature API**:
  ```typescript
  POST   /api/documents/:id/sign             // Add signature to document
  GET    /api/documents/:id/signatures       // Get all signatures
  POST   /api/documents/:id/verify-signature // Verify signature
  DELETE /api/documents/signatures/:id       // Revoke signature
  ```
- ✅ **Document Security Service**:
  - Password protection for PDFs
  - Watermarking
  - Permission-based access control
  - Encryption for sensitive documents
- ✅ **Security API**:
  ```typescript
  POST   /api/documents/:id/protect      // Add password protection
  POST   /api/documents/:id/watermark    // Add watermark
  POST   /api/documents/:id/permissions  // Set access permissions
  GET    /api/documents/:id/access-log   // View access history
  ```
- ✅ **Document Access Logging**:
  ```prisma
  model DocumentAccessLog {
    id          String   @id @default(uuid())
    documentId  String
    userId      String
    action      DocumentAction  // VIEWED, DOWNLOADED, EDITED, DELETED, SHARED
    ipAddress   String
    userAgent   String
    accessedAt  DateTime @default(now())
    
    @@index([documentId])
    @@index([userId])
    @@map("document_access_logs")
  }

  enum DocumentAction {
    VIEWED
    DOWNLOADED
    EDITED
    DELETED
    SHARED
    SIGNED
  }
  ```

### Frontend Deliverables:
- ✅ **Signature Capture Component** (`components/documents/SignatureCapture.tsx`):
  - Drawing canvas for signature
  - Clear and redo options
  - Preview signature
  - Save signature
- ✅ **Sign Document Modal** (`components/documents/SignDocumentModal.tsx`):
  - Document preview
  - Signature capture
  - Legal agreement checkbox
  - Submit signature
  - Confirmation message
- ✅ **Signature Verification Badge**:
  - Show signature status on documents
  - Display all signers
  - Verification indicator
  - Click to view signature details
- ✅ **Document Security Panel** (`components/documents/SecurityPanel.tsx`):
  - Add password protection
  - Set expiration date
  - Configure access permissions
  - Add watermark
  - View access logs
- ✅ **Access Log Component** (`components/documents/AccessLog.tsx`):
  - List all document access events
  - Filter by action type
  - Export access log
- ✅ **Integration with Approval Workflows**:
  - Auto-sign documents on approval
  - Require signature for certain approval levels
  - Signature requirement configuration

### Integration Points:
- Add "Sign Document" button to approval workflow pages
- Auto-generate signed PDFs on invoice approval
- Require CFO signature for high-value invoices (>₵10,000)
- Require CEO signature for contracts
- Add signature verification to audit logs

### Testing:
- Draw and save signature
- Sign a document
- Verify signature authenticity
- Add password protection to PDF
- Set document permissions
- View access logs
- Revoke signature
- Test signature on approval workflow

---

## Session 15.5: Advanced Permission Management & Access Control

**Duration:** 1 session

### Backend Deliverables:
- ✅ **Enhanced Permission Models**:
  ```prisma
  // Already exists - DocumentPermission for role-based access
  // Add new models for granular control:
  
  model DocumentUserPermission {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation("UserPermissions", fields: [documentId], references: [id], onDelete: Cascade)
    userId      String
    user        User     @relation("DocumentUserAccess", fields: [userId], references: [id], onDelete: Cascade)
    canView     Boolean  @default(true)
    canEdit     Boolean  @default(false)
    canDelete   Boolean  @default(false)
    canShare    Boolean  @default(false)
    canSign     Boolean  @default(false)
    grantedById String
    grantedBy   User     @relation("PermissionGranter", fields: [grantedById], references: [id])
    expiresAt   DateTime?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    @@unique([documentId, userId])
    @@index([userId])
    @@map("document_user_permissions")
  }

  model DocumentDepartmentPermission {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation("DepartmentPermissions", fields: [documentId], references: [id], onDelete: Cascade)
    department  String   // Finance, Operations, HR, etc.
    canView     Boolean  @default(true)
    canEdit     Boolean  @default(false)
    canDelete   Boolean  @default(false)
    canShare    Boolean  @default(false)
    canSign     Boolean  @default(false)
    createdAt   DateTime @default(now())
    
    @@unique([documentId, department])
    @@map("document_department_permissions")
  }

  model DocumentCategoryPermission {
    id          String   @id @default(uuid())
    category    DocumentCategory
    role        UserRole
    canView     Boolean  @default(false)
    canEdit     Boolean  @default(false)
    canDelete   Boolean  @default(false)
    canShare    Boolean  @default(false)
    canSign     Boolean  @default(false)
    canUpload   Boolean  @default(false)
    setById     String
    setBy       User     @relation("CategoryPermissionSetter", fields: [setById], references: [id])
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    @@unique([category, role])
    @@map("document_category_permissions")
  }

  model DocumentPermissionTemplate {
    id          String   @id @default(uuid())
    name        String   @unique
    description String?
    category    DocumentCategory?
    module      String?
    roles       Json     // Array of {role, permissions}
    departments Json?    // Array of {department, permissions}
    isDefault   Boolean  @default(false)
    createdById String
    createdBy   User     @relation("TemplateCreator", fields: [createdById], references: [id])
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    @@map("document_permission_templates")
  }

  model DocumentPermissionLog {
    id          String   @id @default(uuid())
    documentId  String?
    category    DocumentCategory?
    action      PermissionAction
    performedById String
    performedBy User     @relation("PermissionChanger", fields: [performedById], references: [id])
    targetUserId  String?
    targetUser    User?  @relation("PermissionTarget", fields: [targetUserId], references: [id])
    targetRole    UserRole?
    targetDepartment String?
    oldPermissions Json?
    newPermissions Json
    reason      String?
    ipAddress   String
    createdAt   DateTime @default(now())
    
    @@index([documentId])
    @@index([performedById])
    @@index([createdAt])
    @@map("document_permission_logs")
  }

  enum PermissionAction {
    GRANT
    REVOKE
    MODIFY
    TEMPLATE_APPLIED
    BULK_UPDATE
  }
  ```

- ✅ **Permission Management Service** (`services/document-permissions.service.ts`):
  - Check if user has permission for document
  - Grant permissions to user/role/department
  - Revoke permissions
  - Bulk permission updates
  - Apply permission templates
  - Get effective permissions (considering role + user-specific)
  - Permission inheritance logic

- ✅ **Permission API Endpoints**:
  ```typescript
  // Document-specific permissions
  GET    /api/documents/:id/permissions              // Get all permissions for document
  POST   /api/documents/:id/permissions/user         // Grant permission to specific user
  POST   /api/documents/:id/permissions/role         // Grant permission to role
  POST   /api/documents/:id/permissions/department   // Grant permission to department
  DELETE /api/documents/:id/permissions/user/:userId // Revoke user permission
  DELETE /api/documents/:id/permissions/role/:role   // Revoke role permission
  PUT    /api/documents/:id/permissions/user/:userId // Update user permission
  
  // Category-level permissions (system-wide defaults)
  GET    /api/documents/permissions/categories       // Get all category permissions
  POST   /api/documents/permissions/categories       // Set category permission for role
  PUT    /api/documents/permissions/categories/:id   // Update category permission
  DELETE /api/documents/permissions/categories/:id   // Remove category permission
  
  // Permission templates
  GET    /api/documents/permissions/templates        // List all templates
  POST   /api/documents/permissions/templates        // Create template
  PUT    /api/documents/permissions/templates/:id    // Update template
  DELETE /api/documents/permissions/templates/:id    // Delete template
  POST   /api/documents/:id/permissions/apply-template/:templateId // Apply template
  
  // Bulk operations
  POST   /api/documents/permissions/bulk-grant       // Grant permissions to multiple documents
  POST   /api/documents/permissions/bulk-revoke      // Revoke permissions from multiple documents
  
  // Permission checking
  GET    /api/documents/:id/my-permissions           // Get current user's permissions
  POST   /api/documents/:id/check-permission         // Check specific permission
  GET    /api/documents/accessible                   // List documents user can access
  
  // Permission logs
  GET    /api/documents/:id/permission-history       // Get permission change history
  GET    /api/documents/permissions/audit-log        // System-wide permission audit log
  ```

- ✅ **Permission Middleware**:
  - `@CheckDocumentPermission(permission)` decorator
  - Automatic permission check on all document endpoints
  - Graceful fallback for super admins

- ✅ **Default Permission Rules**:
  - SUPER_ADMIN: Full access to all documents
  - Document owner: Full access to their uploads
  - CEO/CFO: View all finance documents
  - HR_MANAGER: Full access to HR documents
  - SAFETY_OFFICER: Full access to safety documents
  - OPERATIONS_MANAGER: View project documents
  - Department-based access: Users can view documents in their department

### Frontend Deliverables:

- ✅ **Document Permissions Management Page** (`app/settings/documents/permissions/page.tsx`):
  - **Tab 1: Category Permissions** (System-wide defaults)
    - Table showing all document categories
    - Each row shows which roles have which permissions
    - Edit button to modify permissions
    - Color-coded permission matrix
  
  - **Tab 2: Permission Templates**
    - List of saved permission templates
    - Create new template button
    - Edit/delete existing templates
    - Set default template for categories
  
  - **Tab 3: Permission Audit Log**
    - List all permission changes
    - Filter by user, document, date, action
    - Export audit log
    - Search functionality

- ✅ **Permission Editor Component** (`components/documents/PermissionEditor.tsx`):
  - Used in document detail modal
  - Shows current permissions
  - Add user/role/department
  - Select permission level (View, Edit, Delete, Share, Sign)
  - Set expiration date
  - Quick presets: "View Only", "Full Access", "Edit Only"

- ✅ **Category Permission Editor** (`components/documents/CategoryPermissionEditor.tsx`):
  - Matrix view: Roles vs Permissions
  - Checkboxes for each permission type
  - Select all/none shortcuts
  - Save changes with confirmation
  - Show affected documents count

- ✅ **Permission Template Creator** (`components/documents/PermissionTemplateCreator.tsx`):
  - Template name and description
  - Select category/module (optional)
  - Configure role permissions
  - Configure department permissions
  - Set as default template
  - Preview affected documents

- ✅ **User Permission Picker** (`components/documents/UserPermissionPicker.tsx`):
  - Search and select user
  - Choose permission level
  - Set expiration date
  - Add note/reason
  - Preview current access

- ✅ **Permission Badge Component** (`components/documents/PermissionBadge.tsx`):
  - Display user's permission level on document card
  - Icons: 👁️ View, ✏️ Edit, 🗑️ Delete, 🔗 Share, ✍️ Sign
  - Tooltip shows detailed permissions

- ✅ **Bulk Permission Manager** (`components/documents/BulkPermissionManager.tsx`):
  - Select multiple documents
  - Apply permission template
  - Grant access to user/role/department
  - Revoke access
  - Progress indicator

- ✅ **My Permissions View** (`app/documents/my-permissions/page.tsx`):
  - List all documents user has access to
  - Show permission level for each
  - Filter by permission type
  - Request additional access button

- ✅ **Access Request System** (`components/documents/AccessRequestModal.tsx`):
  - Employee can request access to document
  - Select desired permission level
  - Provide justification
  - Send to document owner/super admin
  - Notification to approver

- ✅ **Permission Quick Actions**:
  - "Share with..." dropdown on document card
  - "Make Public" / "Make Private" toggle
  - "Copy Permissions From..." option
  - "Reset to Default" option

### Settings Menu Integration:
Add to Settings submenu in `lib/config/menu.ts`:
```typescript
{
  id: 'settings-document-permissions',
  label: 'Document Permissions',
  icon: FileKey, // from lucide-react
  path: '/settings/documents/permissions',
  roles: [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.IT_MANAGER],
},
```

### Admin Workflows:

**Workflow 1: Set Category-Level Defaults**
1. Super admin goes to Settings > Document Permissions
2. Select category (e.g., INVOICE)
3. Set which roles can view/edit/delete
4. Save - applies to all future documents in category

**Workflow 2: Create Permission Template**
1. Go to Settings > Document Permissions > Templates
2. Click "Create Template"
3. Name: "Finance Team Access"
4. Grant view to ACCOUNTANT, edit to CFO
5. Save template
6. Apply to existing documents or set as default

**Workflow 3: Grant User-Specific Access**
1. Open document detail
2. Click "Manage Permissions"
3. Click "Add User"
4. Search for user: "John Doe"
5. Select permissions: View + Download
6. Set expiration: 30 days
7. Save

**Workflow 4: Department-Wide Access**
1. Upload HR document
2. Set permission: "HR Department - Full Access"
3. Set permission: "CEO - View Only"
4. Save - all HR staff can access

**Workflow 5: Bulk Permission Update**
1. Select 20 invoices
2. Click "Bulk Actions" > "Update Permissions"
3. Select template: "Finance Team Access"
4. Apply to all selected
5. Confirm

### Permission Priority Logic:
```
Highest Priority → Lowest Priority
1. SUPER_ADMIN (always full access)
2. Document owner (user who uploaded)
3. User-specific permissions (DocumentUserPermission)
4. Department permissions (DocumentDepartmentPermission)
5. Role permissions (DocumentPermission)
6. Category defaults (DocumentCategoryPermission)
7. System defaults (deny by default)
```

### Smart Permission Features:

- ✅ **Auto-Inherit Module Permissions**: Invoice document inherits finance module access
- ✅ **Temporary Access**: Grant access that expires after X days
- ✅ **Permission Suggestions**: AI suggests permissions based on document type and content
- ✅ **Access Request Workflow**: Employees request access, admins approve
- ✅ **Permission Warnings**: Alert when granting unusual permissions
- ✅ **Compliance Checks**: Ensure sensitive documents have proper restrictions

### Default Permission Matrix (Applied at Installation):

| Category | CEO | CFO | ACCOUNTANT | PROCUREMENT | WAREHOUSE | HR_MGR | SAFETY | EMPLOYEE |
|----------|-----|-----|------------|-------------|-----------|--------|--------|----------|
| INVOICE | View | Full | Edit | View | - | - | - | - |
| PURCHASE_ORDER | View | View | Edit | Full | View | - | - | - |
| SAFETY_REPORT | View | - | - | - | - | - | Full | View |
| HR_DOCUMENT | View | - | - | - | - | Full | - | Own |
| PROJECT_REPORT | View | View | - | - | - | - | - | Assigned |
| CONTRACT | Full | Full | View | View | - | View | - | - |

### Testing:

**Permission Checking:**
- ✅ Super admin can access all documents
- ✅ Document owner can edit their documents
- ✅ CFO can view all invoices
- ✅ HR Manager can access HR documents
- ✅ Employee cannot access finance documents (unless granted)

**Permission Granting:**
- ✅ Grant view permission to specific user
- ✅ Grant full access to role (all users with that role)
- ✅ Grant department-wide access
- ✅ Set temporary access (expires in 7 days)
- ✅ Verify expiration works correctly

**Category Permissions:**
- ✅ Set category default: All invoices viewable by accountants
- ✅ Upload new invoice → verify accountant can view
- ✅ Update category permission → verify existing documents affected

**Permission Templates:**
- ✅ Create "Finance Team" template
- ✅ Apply template to 10 documents at once
- ✅ Set template as default for INVOICE category

**Bulk Operations:**
- ✅ Select 20 documents, grant access to user
- ✅ Select 15 documents, apply template
- ✅ Revoke access from multiple documents

**Access Requests:**
- ✅ Employee requests access to document
- ✅ Admin receives notification
- ✅ Admin approves → employee can access
- ✅ Admin rejects → employee notified

**Permission Logs:**
- ✅ View all permission changes for document
- ✅ Filter audit log by user/action
- ✅ Export permission history

**Edge Cases:**
- ✅ User with multiple roles gets highest permission
- ✅ Department permission + user permission = combined
- ✅ Revoking owner's permission not allowed
- ✅ Expired permissions auto-revoke

---

# 📋 PHASE 16: Advanced Document Features & Intelligence
**Duration:** Sessions 16.1 - 16.4 (4 sessions)  
**Objective:** Add OCR, advanced PDF editing, collaboration features, and AI-powered document intelligence.

---

## Session 16.1: OCR & Text Extraction

**Duration:** 1 session

### Backend Deliverables:
- ✅ **OCR Service Integration**:
  - Choice between Tesseract.js (free) or Google Cloud Vision (paid)
  - Auto-detect text in uploaded images/scanned PDFs
  - Extract structured data (invoices, receipts)
  - Store extracted text in DocumentMetadata
- ✅ **Text Extraction Service** (`services/ocr.service.ts`):
  - Process uploaded scanned documents
  - Extract text and structure
  - Identify document type automatically
  - Parse invoice fields (invoice number, amount, date, etc.)
  - Parse receipt fields
- ✅ **OCR API**:
  ```typescript
  POST   /api/documents/:id/extract-text      // Run OCR on document
  POST   /api/documents/:id/parse-invoice     // Extract invoice data
  POST   /api/documents/:id/parse-receipt     // Extract receipt data
  GET    /api/documents/:id/extracted-text    // Get extracted text
  POST   /api/documents/batch-ocr             // Process multiple documents
  ```
- ✅ **Auto-OCR Configuration**:
  - Enable/disable auto-OCR on upload
  - OCR queue for batch processing
  - Webhook for OCR completion notification
- ✅ **Smart Data Extraction**:
  - Extract invoice data → auto-fill invoice form
  - Extract receipt data → auto-create expense
  - Extract contract data → create contract record

### Frontend Deliverables:
- ✅ **OCR Button Component** (`components/documents/OCRButton.tsx`):
  - "Extract Text" button on document detail
  - Processing indicator
  - Display extracted text
  - Copy to clipboard option
- ✅ **Smart Upload Component** (`components/documents/SmartUpload.tsx`):
  - Upload invoice scan → OCR → auto-fill invoice form
  - Upload receipt → OCR → auto-create expense
  - Preview extracted data before saving
  - Edit extracted data if incorrect
- ✅ **Extracted Text Viewer** (`components/documents/ExtractedTextViewer.tsx`):
  - Display OCR results
  - Highlight confidence scores
  - Show original vs extracted side-by-side
  - Edit and save corrections
- ✅ **Smart Invoice Creation Flow**:
  - Upload scanned invoice
  - System extracts: supplier, amount, date, items
  - Pre-filled form appears
  - User reviews and submits
- ✅ **OCR Settings Page** (`app/settings/ocr/page.tsx`):
  - Enable/disable auto-OCR
  - Choose OCR provider
  - Set confidence threshold
  - Configure auto-processing rules

### Smart Features:
1. **Smart Invoice Upload**: Scan → OCR → Auto-fill invoice form
2. **Smart Receipt Upload**: Photo → OCR → Create expense claim
3. **Smart Contract Upload**: Scan → Extract terms → Create contract record
4. **Batch Processing**: Upload folder of scans → Auto-process all

### Testing:
- Upload scanned invoice → extract text
- Upload receipt image → extract amount, vendor
- Review and correct extracted data
- Auto-create invoice from scanned document
- Batch OCR processing
- Test accuracy with various document qualities

---

## Session 16.2: Advanced PDF Manipulation & Merging

**Duration:** 1 session

### Backend Deliverables:
- ✅ **PDF Manipulation Service** (`services/pdf-manipulator.service.ts`):
  - Merge multiple PDFs into one
  - Split PDF into individual pages
  - Extract specific pages from PDF
  - Reorder pages
  - Rotate pages
  - Add page numbers
  - Add headers/footers
  - Compress PDF
- ✅ **PDF Manipulation API**:
  ```typescript
  POST   /api/documents/merge          // Merge multiple PDFs
  POST   /api/documents/batch-merge    // Batch merge multiple sets of PDFs (zip output)
  POST   /api/documents/:id/split      // Split PDF into pages
  POST   /api/documents/:id/extract-pages  // Extract specific pages
  POST   /api/documents/:id/reorder    // Reorder pages
  POST   /api/documents/:id/rotate     // Rotate pages
  POST   /api/documents/:id/add-page-numbers
  POST   /api/documents/:id/add-headers-footers
  POST   /api/documents/:id/compress   // Reduce file size
  POST   /api/documents/:id/combine-with // Combine with another PDF

  // Editing & redaction
  POST   /api/documents/:id/watermark
  POST   /api/documents/:id/stamp
  POST   /api/documents/:id/redact
  POST   /api/documents/:id/annotate-text
  POST   /api/documents/:id/highlight

  // Bulk operations (zip output)
  POST   /api/documents/batch-compress
  POST   /api/documents/batch-watermark
  POST   /api/documents/batch-add-page-numbers
  ```
- ✅ **PDF Editing Service**:
  - Add text annotations
  - Add shapes/highlights
  - Redact sensitive information
  - Add stamps (APPROVED, CONFIDENTIAL, etc.)
- ✅ **Bulk PDF Operations**:
  - Batch merge
  - Batch compress
  - Batch watermark
  - Batch page number addition

### Frontend Deliverables:
- ✅ **PDF Merger Component** (`components/documents/PDFMerger.tsx`):
  - Select multiple PDFs
  - Drag to reorder
  - Preview combined result
  - Download merged PDF
- ✅ **PDF Editor Component** (`components/documents/PDFEditor.tsx`):
  - Page thumbnail view
  - Drag to reorder pages
  - Delete pages
  - Rotate pages
  - Extract pages
  - Add page numbers
  - Add watermark
- ✅ **PDF Tools Page** (`app/documents/tools/page.tsx`):
  - Merge PDFs tool
  - Split PDF tool
  - Compress PDF tool
  - Add page numbers tool
  - Watermark tool
  - Rotate pages tool
- ✅ **Redaction Tool** (`components/documents/RedactionTool.tsx`):
  - Select area to redact
  - Apply black boxes
  - Permanently remove sensitive data
  - Preview before saving
- ✅ **PDF Stamp Library** (`components/documents/StampLibrary.tsx`):
  - Pre-made stamps (APPROVED, PAID, CONFIDENTIAL, URGENT)
  - Custom stamp creator
  - Apply stamp to pages
  - Position and resize

### Use Cases:
1. **Merge audit documents** for submission
2. **Split large reports** into individual sections
3. **Redact sensitive financial data** before sharing
4. **Add "CONFIDENTIAL" watermark** to all pages
5. **Compress large reports** for email
6. **Extract specific pages** from manuals

### Testing:
- Merge 3+ PDFs into one
- Split PDF into individual pages
- Reorder pages in a PDF
- Rotate pages
- Redact sensitive information
- Add watermark to all pages
- Compress large PDF
- Add page numbers

---

## Session 16.3: Document Collaboration & Annotations

**Duration:** 1 session

### Backend Deliverables:
- ✅ **Document Comments System**:
  ```prisma
  model DocumentComment {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    authorId    String
    author      User     @relation("CommentAuthor", fields: [authorId], references: [id])
    content     String
    pageNumber  Int?     // For PDF annotations
    positionX   Float?   // X coordinate on page
    positionY   Float?   // Y coordinate on page
    isResolved  Boolean  @default(false)
    resolvedBy  String?
    resolvedAt  DateTime?
    parentId    String?  // For threaded comments
    parent      DocumentComment? @relation("CommentThread", fields: [parentId], references: [id])
    replies     DocumentComment[] @relation("CommentThread")
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    @@index([documentId])
    @@map("document_comments")
  }

  model DocumentAnnotation {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    authorId    String
    author      User     @relation("AnnotationAuthor", fields: [authorId], references: [id])
    type        AnnotationType
    pageNumber  Int
    coordinates Json     // Position and size
    content     String?
    color       String   @default("#FFFF00")
    createdAt   DateTime @default(now())
    
    @@index([documentId])
    @@map("document_annotations")
  }

  enum AnnotationType {
    HIGHLIGHT
    UNDERLINE
    STRIKETHROUGH
    NOTE
    ARROW
    RECTANGLE
    TEXT
  }
  ```
- ✅ **Comments API**:
  ```typescript
  POST   /api/documents/:id/comments        // Add comment
  GET    /api/documents/:id/comments        // Get all comments
  PUT    /api/documents/comments/:id        // Edit comment
  DELETE /api/documents/comments/:id        // Delete comment
  POST   /api/documents/comments/:id/resolve // Mark resolved
  POST   /api/documents/comments/:id/reply  // Reply to comment
  ```
- ✅ **Annotations API**:
  ```typescript
  POST   /api/documents/:id/annotations     // Add annotation
  GET    /api/documents/:id/annotations     // Get annotations
  DELETE /api/documents/annotations/:id     // Delete annotation
  PUT    /api/documents/annotations/:id     // Update annotation
  ```
- ✅ **Document Sharing**:
  ```prisma
  model DocumentShare {
    id          String   @id @default(uuid())
    documentId  String
    document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
    sharedById  String
    sharedBy    User     @relation("ShareAuthor", fields: [sharedById], references: [id])
    sharedWithId String?
    sharedWith  User?    @relation("ShareRecipient", fields: [sharedWithId], references: [id])
    shareLink   String?  @unique  // Public share link
    expiresAt   DateTime?
    accessCount Int      @default(0)
    canEdit     Boolean  @default(false)
    canDownload Boolean  @default(true)
    createdAt   DateTime @default(now())
    
    @@map("document_shares")
  }
  ```
- ✅ **Sharing API**:
  ```typescript
  POST   /api/documents/:id/share           // Share document
  GET    /api/documents/shared/with-me      // Documents shared with me
  GET    /api/documents/shared/by-me        // Documents I shared
  DELETE /api/documents/shares/:id          // Revoke share
  GET    /api/share/:shareToken             // Access shared document
  ```

### Frontend Deliverables:
- ✅ **Comments Panel** (`components/documents/CommentsPanel.tsx`):
  - List all comments
  - Add new comment
  - Reply to comments (threaded)
  - Resolve/unresolve comments
  - Filter by resolved/unresolved
  - @mention users
- ✅ **PDF Annotation Toolbar** (`components/documents/AnnotationToolbar.tsx`):
  - Highlight tool
  - Text note tool
  - Arrow tool
  - Rectangle tool
  - Color picker
  - Delete annotation
- ✅ **Collaborative PDF Viewer** (`components/documents/CollaborativeViewer.tsx`):
  - Display PDF with all annotations
  - Click annotation to view/edit
  - Add comment at specific location
  - Real-time updates (polling or WebSocket)
  - Show who's viewing (presence indicator)
- ✅ **Share Document Modal** (`components/documents/ShareModal.tsx`):
  - Share with specific users
  - Generate public link
  - Set expiration date
  - Set permissions (view/edit/download)
  - Copy share link
  - Revoke access
- ✅ **Shared Documents Page** (`app/documents/shared/page.tsx`):
  - Documents shared with me
  - Documents I've shared
  - Manage sharing settings
- ✅ **@Mentions System**:
  - @mention user in comment
  - User receives notification
  - Click notification → go to comment

### Collaboration Features:
1. **Review Workflow**: Share document → colleagues add comments → address feedback → approve
2. **Annotation**: Highlight important sections, add notes
3. **Discussion**: Threaded comments on specific pages
4. **Sharing**: Share with internal users or generate public link
5. **Notifications**: Get notified of new comments/annotations

### Testing:
- Add comment to document
- Reply to comment
- Add annotation (highlight, note, arrow)
- Share document with user
- Generate public share link
- View shared document
- Test @mentions
- Mark comment as resolved
- Revoke document share

---

## Session 16.4: AI-Powered Document Intelligence

**Duration:** 1 session

### Backend Deliverables:
- ✅ **AI Document Analysis Service** (`modules/ai/services/document-ai.service.ts`):
  - Auto-categorize documents
  - Extract key information
  - Detect anomalies (duplicate invoices, unusual amounts)
  - Smart search with semantic understanding
  - Document summarization
- ✅ **AI Document API**:
  ```typescript
  POST   /api/ai/documents/:id/analyze      // Analyze document with AI
  POST   /api/ai/documents/:id/categorize   // Auto-categorize
  POST   /api/ai/documents/:id/summarize    // Generate summary
  POST   /api/ai/documents/:id/extract-entities  // Extract names, dates, amounts
  POST   /api/ai/documents/smart-search     // Semantic search
  GET    /api/ai/documents/similar/:id      // Find similar documents
  POST   /api/ai/documents/detect-duplicates // Find duplicate documents
  POST   /api/ai/documents/:id/qa           // Ask questions about document
  ```
- ✅ **Smart Document Classification**:
  - Analyze uploaded document
  - Automatically assign category
  - Suggest tags
  - Link to related records
- ✅ **Document Anomaly Detection**:
  - Detect duplicate invoices
  - Flag unusual amounts (outliers)
  - Detect missing required fields
  - Flag expired documents
- ✅ **Smart Document Linking**:
  - Automatically link invoice to related PO
  - Link safety report to incident
  - Link receipt to expense claim
  - Suggest related documents

### Frontend Deliverables:
- ✅ **AI Document Insights Panel** (`dev/frontend/components/documents/DocumentAiInsightsPanel.tsx`):
  - Document summary
  - Key entities extracted
  - Suggested category/tags
  - Related documents
  - Anomaly warnings
- ✅ **Smart Search Page** (`dev/frontend/app/documents/smart-search/page.tsx`):
  - Natural language search
  - "Find all invoices from Supplier X above ₵5000"
  - Search by content, not just filename
  - Ranked results with relevance score
- ✅ **Document Q&A Interface** (`dev/frontend/components/documents/DocumentQaPanel.tsx`):
  - Ask questions about document
  - "What is the total amount?"
  - "Who is the supplier?"
  - "When is the due date?"
  - Get instant AI-powered answers
- ✅ **Auto-Categorization Banner**:
  - Show suggestion when uploading
  - "This looks like an invoice. Should I categorize it as INVOICE?"
  - Accept/reject suggestion
- ✅ **Duplicate Detection Alert** (`dev/frontend/components/documents/DocumentDuplicateAlert.tsx`):
  - Show warning when uploading duplicate
  - Display similar documents
  - Option to proceed or cancel
- ✅ **Smart Document Recommendations**:
  - "Documents you might be interested in"
  - Based on viewing history and role
  - Trending documents in your department

### AI Features:
1. **Auto-Categorization**: Upload document → AI suggests category
2. **Smart Extraction**: Extract all key info automatically
3. **Duplicate Detection**: Prevent uploading the same invoice twice
4. **Document Q&A**: Ask questions, get answers from document content
5. **Smart Search**: Search by content, not just filename
6. **Anomaly Detection**: Flag unusual invoices, missing fields
7. **Smart Linking**: Auto-link related documents

### AI Models Used:
- **OpenAI GPT-4** or **Claude** for document understanding
- **OpenAI Embeddings** for semantic search
- **Custom fine-tuned model** for invoice classification (optional)

### Integration with Existing AI Module:
- Extend `modules/ai/ai.module.ts`
- Use existing OpenAI/Claude setup
- Share AI configuration and settings
- Add Document AI to AI Dashboard page

### Testing:
- Upload document → verify auto-categorization
- Upload duplicate invoice → verify alert
- Ask questions about document content
- Use smart search with natural language
- Verify entity extraction (dates, amounts, names)
- Test anomaly detection (unusual amounts)
- Verify smart document linking

### Manual Verification Checklist (Production Readiness):
- Confirm `/documents` opens a document and `AI` tab loads without crashing
- Confirm `/documents/smart-search` returns ranked results for a known query
- Confirm `/api/ai/documents/:id/analyze` works when AI keys are missing (heuristic fallback)
- Confirm `/api/ai/documents/:id/qa` returns an answer and `sources` array
- Confirm duplicate detection banner appears when `fileHash` matches another document
- Confirm permission enforcement (user without access cannot analyze/search/view results)

---

## Session 16.5: Universal Document → PDF Conversion (Images + Office Docs + HTML)

**Duration:** 1 session

### Objective:
Enable converting non-PDF documents to PDF in a production-ready way using async jobs, saving the output as a versioned document update.

### Backend Deliverables:
- ✅ **Persistent Conversion Jobs (DB-backed queue)**:
  - Store conversion jobs in Postgres with statuses: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`
  - Jobs survive restarts and can be resumed
  - Concurrency limits and retry handling
- ✅ **Conversion Providers**:
  - Built-in conversion for common inputs:
    - Images (`png`, `jpg`, `webp`) → PDF
    - Text (`txt`, `csv`) → PDF
  - Optional external conversion provider for:
    - Office docs (`doc/docx`, `xls/xlsx`, `ppt/pptx`) → PDF
    - HTML → PDF
- ✅ **Versioning Output**:
  - On successful conversion, store the output PDF in configured storage (S3/local)
  - Archive current document state to `DocumentVersion`
  - Update `Document` to the new PDF output and increment `version`
- ✅ **API**:
  ```typescript
  POST   /api/documents/:id/convert-to-pdf      // Start conversion job
  GET    /api/documents/conversion/jobs/:jobId  // Job status
  GET    /api/documents/:id/conversion-jobs     // Job history
  DELETE /api/documents/conversion/jobs/:jobId  // Cancel job
  ```
- ✅ **Permissions**:
  - Conversion requires document `edit` permission (since it creates a new version)

### Frontend Deliverables:
- ✅ **Convert to PDF Action**:
  - Show for non-PDF documents
  - Trigger conversion job
  - Display job status (processing/success/failure)
  - On success, refresh document and allow viewing/downloading the PDF output

### Acceptance Criteria (Production-Ready):
- ✅ Converting supported image/text documents completes without external dependencies
- ✅ Office/HTML conversion works when external provider credentials are configured; otherwise fails with a clear error
- ✅ Jobs are persistent (restart-safe) and observable via APIs
- ✅ Successful conversion creates a new document version and preserves history
- ✅ Conversion endpoints enforce document permissions

# 📊 Summary of Document Management System

## Menu Structure (Left Sidebar)

**New Menu Item Added:**
```
📄 Documents & Files
  ├── All Documents
  ├── My Uploads
  ├── Finance Documents
  ├── Safety Documents
  ├── HR Documents
  ├── Project Documents
  └── PDF Tools (Phase 16)
```

**Position:** Insert after "Reports & Analytics" and before "Settings"

## Database Tables Added

1. **documents** - Main document records
2. **document_versions** - Version history
3. **document_metadata** - Extracted metadata and text
4. **document_permissions** - Role-based access control
5. **document_user_permissions** - User-specific access control (Session 15.5)
6. **document_department_permissions** - Department-level access (Session 15.5)
7. **document_category_permissions** - Category defaults by role (Session 15.5)
8. **document_permission_templates** - Reusable permission templates (Session 15.5)
9. **document_permission_logs** - Permission change audit trail (Session 15.5)
10. **document_signatures** - Digital signatures
11. **document_access_logs** - Document access audit trail
12. **document_comments** - Collaboration comments
13. **document_annotations** - PDF annotations
14. **document_shares** - Sharing and links

**Total: 14 new database tables**

## API Endpoints Summary

**Phase 15 (Core):** 
- Sessions 15.1-15.4: ~35 endpoints
- Session 15.5 (Permissions): ~25 endpoints
- **Phase 15 Total: ~60 endpoints**

**Phase 16 (Advanced):** ~25 endpoints

**Total:** ~85 new API endpoints

## Frontend Pages Added

**Phase 15:**
- `/documents` - Main documents library
- `/documents/my-uploads` - User's uploaded files
- `/documents/:id` - Document detail view
- `/documents/tools` - PDF generation tools
- `/documents/my-permissions` - User's accessible documents (Session 15.5)
- `/settings/documents/permissions` - Permission management (Session 15.5)

**Phase 16:**
- `/documents/tools` - Advanced PDF tools
- `/documents/shared` - Shared documents
- `/documents/smart-search` - Smart search
- `/settings/ocr` - OCR configuration

**Total: 10 new pages**

## Components Created

**Phase 15:** 
- Sessions 15.1-15.4: ~15 components
- Session 15.5 (Permissions): ~10 components
- **Phase 15 Total: ~25 components**

**Phase 16:** ~12 components

**Total:** ~37 new React components

## External Dependencies

```json
{
  "backend": [
    "multer",
    "@aws-sdk/client-s3",
    "pdf-lib",
    "pdfkit",
    "sharp",
    "qrcode",
    "tesseract.js"
  ],
  "frontend": [
    "react-pdf",
    "signature_pad",
    "react-dropzone",
    "pdfjs-dist",
    "react-signature-canvas"
  ]
}
```

## Estimated Development Time

- **Phase 15 (Core + Permissions):** 5 sessions × 4-6 hours = 20-30 hours
  - Session 15.1: Document Module Setup & Upload (4-6 hours)
  - Session 15.2: Document Library & Management UI (4-6 hours)
  - Session 15.3: Versioning & PDF Generation (4-6 hours)
  - Session 15.4: Digital Signatures & Security (4-6 hours)
  - Session 15.5: Permission Management (4-6 hours)
- **Phase 16 (Advanced Features):** 4 sessions × 4-6 hours = 16-24 hours
- **Total:** 36-54 hours of development

## Storage Considerations

- **Development:** Local file system
- **Production:** AWS S3 or Cloudinary
- **Estimated Storage Needs:** 10GB-100GB depending on usage
- **Monthly Cost:** ~$2-10 for S3, ~$0-25 for Cloudinary

## Security Features

- ✅ File type validation
- ✅ File size limits
- ✅ Multi-level access control (Role, User, Department, Category)
- ✅ Permission templates and inheritance
- ✅ Temporary access with expiration dates
- ✅ Password-protected PDFs
- ✅ Digital signatures with timestamps
- ✅ Document access audit logs
- ✅ Permission change audit trail
- ✅ Encrypted storage (S3 server-side encryption)
- ✅ Secure share links with expiration
- ✅ Access request and approval workflow

## Integration Points

Documents can be attached to:
- Invoices
- Purchase Requests
- IT Requests
- Payment Requests
- Projects
- Safety Incidents
- HR Records (employee files, performance reviews)
- Compliance Reports
- Training Records
- Equipment Manuals

---

# 🎯 Success Criteria

## Phase 15 Success:
- ✅ Users can upload documents with drag & drop
- ✅ Documents are organized by category and searchable
- ✅ PDFs can be generated from system records
- ✅ Documents can be digitally signed
- ✅ Version history is maintained
- ✅ Access is logged for audit
- ✅ **Super admin can set category-level permissions** (Session 15.5)
- ✅ **User-specific, role-based, and department-based access control works** (Session 15.5)
- ✅ **Permission templates can be created and applied** (Session 15.5)
- ✅ **Temporary access with expiration dates functions correctly** (Session 15.5)
- ✅ **Permission changes are logged in audit trail** (Session 15.5)
- ✅ **Access request workflow operates smoothly** (Session 15.5)

## Phase 16 Success:
- ✅ Scanned invoices are OCR'd and auto-fill forms
- ✅ PDFs can be merged, split, and edited
- ✅ Users can collaborate with comments and annotations
- ✅ Documents can be shared securely
- ✅ AI provides smart categorization and search
- ✅ Duplicate documents are detected

---

# 📝 Post-Implementation Tasks

1. **Configure S3/Cloudinary** for production storage
2. **Set file size limits** based on business needs
3. **Configure default permission matrix** for all document categories (Session 15.5)
4. **Create permission templates** for common access patterns (Session 15.5)
5. **Set up permission notification workflows** (Session 15.5)
6. **Configure OCR provider** (Tesseract or Google Vision)
7. **Train AI model** on company-specific documents
8. **Create PDF templates** with company branding
9. **Set up automated backups** for document storage
10. **Configure document retention policies**
11. **Train users** on document management features
12. **Train admins** on permission management and template creation (Session 15.5)
13. **Set up monitoring** for storage usage
14. **Set up monitoring** for unusual permission changes (Session 15.5)
15. **Document workflows** for common document tasks

---

**Author:** Mining ERP Development Team  
**Last Updated:** December 2025  
**Status:** Ready for Implementation
