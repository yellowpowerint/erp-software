# Phase 16.7 Deployment Checklist (Audit Package Builder)

## 1) Database
- [ ] Confirm migration is deployed:
  - `dev/backend/prisma/migrations/20251221_add_phase_16_7_audit_packages/migration.sql`
- [ ] On Render backend deploy, verify logs show: `prisma migrate deploy` ran successfully

## 2) Backend (NestJS)
- [ ] Confirm backend builds successfully
- [ ] Confirm endpoints exist:
  - `POST /api/documents/audit-packages/jobs`
  - `GET /api/documents/audit-packages/jobs`
  - `GET /api/documents/audit-packages/jobs/:jobId`
  - `DELETE /api/documents/audit-packages/jobs/:jobId`

## 3) Worker / Async processing
- [ ] Ensure Render backend has worker enabled (same service is OK):
  - `AUDIT_PACKAGE_WORKER_ENABLED=true`
  - `AUDIT_PACKAGE_WORKER_CONCURRENCY=1`
  - `AUDIT_PACKAGE_WORKER_STUCK_MINUTES=30`

## 4) Permissions
- [ ] Starting a job requires `view` permission for every included document
- [ ] Listing/getting/cancelling a job is restricted to the job creator

## 5) Frontend (Next.js)
- [ ] `/documents/tools` includes an **Audit Packages** tab
- [ ] User can:
  - create sections
  - add PDF documents per section
  - start a job
  - view job status
  - open output document on completion

## 6) Smoke Tests
- [ ] Upload at least 2 PDFs
- [ ] Go to `/documents/tools` → Audit Packages
- [ ] Create 2 sections and add PDFs to each
- [ ] Start job and observe status transitions
- [ ] On completion, open output
- [ ] Verify package contains:
  - cover page
  - table of contents
  - section divider pages
  - merged PDFs in chosen order
  - PDF bookmarks/outlines for sections and docs
- [ ] Verify output is saved as a `Document` with category `AUDIT_DOCUMENT`

## 7) Operational Notes
- If jobs appear stuck, the worker recovers PROCESSING jobs older than `AUDIT_PACKAGE_WORKER_STUCK_MINUTES`.
