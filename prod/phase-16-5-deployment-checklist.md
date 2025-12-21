# Phase 16.5 Deployment Checklist (Universal Document to PDF Conversion)

## 1) Database
- [ ] Ensure Render PostgreSQL is reachable from backend
- [ ] Confirm migration is deployed:
  - `dev/backend/prisma/migrations/20251221_add_phase_16_5_document_conversion/migration.sql`
- [ ] On Render backend deploy, verify logs show: `prisma migrate deploy` ran successfully

## 2) Backend (NestJS)
- [ ] Build uses `dev/backend` root directory
- [ ] Ensure env vars:
  - [ ] `DATABASE_URL` (Render Internal URL)
  - [ ] `DIRECT_URL` (Render Internal URL)
  - [ ] `FRONTEND_URL` / `FRONTEND_URLS`
  - [ ] `STORAGE_PROVIDER` (recommended: `s3` for production)
  - [ ] `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` (if S3)
  - [ ] `CONVERSION_WORKER_ENABLED=true`
  - [ ] `CONVERSION_WORKER_CONCURRENCY=2` (tune as needed)
  - [ ] `CONVERSION_WORKER_STUCK_MINUTES=30`

### Optional (Office/HTML conversion)
- [ ] Set `CLOUDCONVERT_API_KEY`
- [ ] Confirm storage is **S3** (CloudConvert path requires a signed download URL)

## 3) Frontend (Next.js)
- [ ] Deploy frontend
- [ ] Verify `NEXT_PUBLIC_API_URL` points to backend `/api`

## 4) Smoke Tests
- [ ] Upload a non-PDF image (PNG/JPG/WebP)
- [ ] Open document details
- [ ] Click **Convert to PDF**
- [ ] Confirm status transitions: `PENDING` -> `PROCESSING` -> `COMPLETED`
- [ ] Confirm document becomes `application/pdf`
- [ ] Confirm document `version` increments and previous file appears in **Version History**

## 5) Failure Cases
- [ ] With `CLOUDCONVERT_API_KEY` missing, attempt to convert a DOCX/XLSX/PPTX/HTML
  - Expect: clear error message (conversion provider not available)
- [ ] Cancel a `PENDING/PROCESSING` conversion and confirm status becomes `CANCELLED`

## 6) Operational Notes
- The conversion worker runs inside the backend process (interval poller). If you scale backend instances, multiple workers may run; job claiming is atomic.
- For production Office/HTML conversions, use S3 storage and CloudConvert.
