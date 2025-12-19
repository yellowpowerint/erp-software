# Phase 16.2 Completion Summary (Advanced PDF Manipulation & Merging)

## Status
Phase 16.2 is implemented and production-ready per `document-management-phases.md`.

## Backend Deliverables
### Services
- `dev/backend/src/modules/documents/services/pdf-manipulator.service.ts`
  - PDF merge
  - Split to per-page PDFs
  - Extract pages
  - Reorder pages
  - Rotate pages
  - Add page numbers
  - Add headers/footers
  - Watermark
  - Stamp
  - Text annotation
  - Highlight rectangle
  - Rasterize-based redaction
  - Compression (normal save + optional rasterize)

### API Endpoints
Implemented under `/api/documents/*`:
- `POST /api/documents/merge`
- `POST /api/documents/batch-merge` (ZIP)
- `POST /api/documents/:id/split` (ZIP)
- `POST /api/documents/:id/extract-pages`
- `POST /api/documents/:id/reorder`
- `POST /api/documents/:id/rotate`
- `POST /api/documents/:id/add-page-numbers`
- `POST /api/documents/:id/add-headers-footers`
- `POST /api/documents/:id/compress`
- `POST /api/documents/:id/combine-with`
- `POST /api/documents/:id/watermark`
- `POST /api/documents/:id/stamp`
- `POST /api/documents/:id/redact`
- `POST /api/documents/:id/annotate-text`
- `POST /api/documents/:id/highlight`
- `POST /api/documents/batch-compress` (ZIP)
- `POST /api/documents/batch-watermark` (ZIP)
- `POST /api/documents/batch-add-page-numbers` (ZIP)

### Security / Access Control
- All endpoints are protected with `JwtAuthGuard` + `RolesGuard`.
- Access is validated by loading documents through `DocumentsService.findOne(...)` before reading files.

### Storage Compatibility
- Uses `StorageService.getLocalPath()` so the same endpoints work for:
  - Local storage
  - S3 storage (via temporary downloads)
- Temporary files are cleaned up after processing.

## Frontend Deliverables
### PDF Tools Page
- `dev/frontend/app/documents/tools/page.tsx`
  - Accessible via sidebar: Documents → PDF Tools

### Components
- `dev/frontend/components/documents/PDFMerger.tsx`
  - Select multiple PDFs
  - Drag-and-drop reorder
  - Preview merged output
  - Download merged PDF

- `dev/frontend/components/documents/PDFEditor.tsx`
  - Split to ZIP
  - Extract pages
  - Reorder pages (thumbnail drag reorder)
  - Delete pages
  - Rotate pages
  - Add page numbers
  - Add watermark
  - Add headers/footers
  - Compress
  - Preview + download

- `dev/frontend/components/documents/RedactionTool.tsx`
  - Click-and-drag area selection (page overlay)
  - Manual coordinate list editing
  - Preview + download

- `dev/frontend/components/documents/StampLibrary.tsx`
  - Preset stamps + custom stamps
  - Preview + download

### API Client
- `dev/frontend/lib/pdf-tools-api.ts`
  - Centralized helpers for calling endpoints and downloading output

## Production Assets
Scripts added under `prod/`:
- `install-phase-16-2-backend-deps.ps1`
- `install-phase-16-2-backend-deps.sh`
- `deploy-phase-16-2.ps1`
- `deploy-phase-16-2.sh`

## Verification
- See `notes/phase-16-2-testing-guide.md`

## Known Constraints
- Redaction and rasterize compression are implemented via server-side rasterization; this is intentional to ensure sensitive content is not trivially recoverable.
- Thumbnail view in `PDFEditor` shows the first 20 pages for responsiveness.
