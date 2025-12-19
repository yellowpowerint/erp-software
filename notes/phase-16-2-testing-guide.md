# Phase 16.2 Testing & Verification Guide (Advanced PDF Manipulation & Merging)

## Scope
This guide verifies Phase 16.2 is production-ready:
- Backend PDF manipulation & editing endpoints under `/api/documents/*`
- Frontend PDF Tools UI at `/documents/tools`
- Batch operations with ZIP outputs
- Role-based access enforcement and safe file handling for local + S3 storage

## Prerequisites
- Backend and frontend running
- Logged-in user with access to the documents you will test with
- At least 3 PDF documents uploaded to the document library (Documents → Upload)

## Dependency / Runtime Verification
### Backend package verification
Confirm `pdf-lib` exists in backend dependencies:
- `dev/backend/package.json` includes `pdf-lib`

### Redaction/Compression runtime requirements
- Redaction and rasterize-compress use server-side PDF rasterization via `sharp`.
- Ensure your runtime environment supports PDF rendering in `sharp`.

## Frontend Verification (Primary)
Navigate to:
- `/documents/tools`

### A) Merge PDFs
- Select 2+ PDFs
- Reorder them by:
  - drag-and-drop, and/or
  - the up/down buttons
- Click **Merge**
- Verify:
  - Preview renders
  - Download produces a valid merged PDF

### B) Split PDF
- Go to **Edit & Organize**
- Select a PDF
- Click **Split (ZIP)**
- Verify:
  - A ZIP downloads
  - ZIP contains one PDF per page (`page-1.pdf`, `page-2.pdf`, ...)

### C) Reorder + Delete pages
- Go to **Edit & Organize**
- Select a PDF
- Ensure page order initialized (it auto-initializes after load; you can also click **Initialize order**)
- Drag thumbnails to reorder pages (first 20 pages shown)
- Delete a page using the **Del** button
- Click **Apply reorder**
- Verify:
  - Output preview renders
  - Page order matches
  - Deleted pages are removed

### D) Rotate
- Go to **Edit & Organize**
- Set rotation (0/90/180/270)
- Optionally specify pages in `Pages (for extract/rotate)` (e.g. `1-2,5`)
- Click **Rotate**
- Verify:
  - Output preview renders
  - Rotation applied to selected pages

### E) Add page numbers
- Go to **Edit & Organize**
- Select position and starting number
- Click **Add page numbers**
- Verify numbering appears at the selected position

### F) Watermark
- Go to **Edit & Organize**
- Enter watermark text (e.g. `CONFIDENTIAL`)
- Adjust opacity/rotation
- Click **Watermark**
- Verify watermark appears on each page

### G) Headers / Footers
- Go to **Edit & Organize**
- Enter header and footer text
- Click **Apply header/footer**
- Verify header/footer on each page

### H) Compress
- Go to **Edit & Organize**
- Toggle **Rasterize** to validate strong compression
- Click **Compress**
- Verify:
  - Output preview renders
  - File size is reduced (especially with rasterize enabled)

### I) Redaction
- Go to **Redaction** tab
- Select a page
- Ensure **Draw mode** is enabled
- Click-and-drag to draw one or more redaction rectangles
- Click **Apply redaction**
- Verify:
  - Output preview renders
  - Redacted areas are fully blacked out
  - Open the downloaded PDF in an external viewer and confirm the content is not recoverable

### J) Stamps
- Go to **Stamps** tab
- Choose a preset stamp (e.g. `APPROVED`) or enter custom text
- Apply to a PDF and download
- Verify stamp placement and visibility

## Backend Verification (API)
These are authenticated endpoints; you must include an `Authorization: Bearer <token>` header.

### Endpoints to verify
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

### Expected security behavior
- Users without permission to view a document must be rejected (403)
- Non-PDF documents must be rejected for PDF operations (400)

## Production Readiness Notes
- Redaction is implemented via server-side rasterization + black overlays, then re-embedding into a new PDF.
- Rasterize compression is lossy by design; verify output is acceptable for your operational needs.

## Acceptance Criteria Checklist
- Merge 3+ PDFs into one: Verified by Merge tool
- Split PDF into individual pages: Verified by Split tool (ZIP)
- Reorder pages: Verified by thumbnail drag reorder + Apply reorder
- Rotate pages: Verified by Rotate
- Redact sensitive information: Verified by Draw redactions + Apply redaction
- Add watermark to all pages: Verified by Watermark
- Compress large PDF: Verified by Compress
- Add page numbers: Verified by Add page numbers
