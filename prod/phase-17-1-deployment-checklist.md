# Phase 17.1 Deployment Checklist (CSV Import/Export Infrastructure)

## 1) Database
- [ ] Confirm migration is deployed:
  - `dev/backend/prisma/migrations/20251221_add_phase_17_1_csv_jobs/migration.sql`
- [ ] On Render backend deploy, verify logs show: `prisma migrate deploy` ran successfully

## 2) Backend (NestJS)
- [ ] Confirm backend builds successfully
- [ ] Confirm endpoints exist:
  - `POST /api/csv/upload`
  - `POST /api/csv/import/:module`
  - `GET /api/csv/import/:jobId`
  - `GET /api/csv/import/:jobId/errors`
  - `POST /api/csv/import/:jobId/cancel`
  - `POST /api/csv/export/:module`
  - `GET /api/csv/export/:jobId`
  - `GET /api/csv/export/:jobId/download`
  - `GET /api/csv/templates/:module`
  - `POST /api/csv/templates`
  - `PUT /api/csv/templates/:id`
  - `DELETE /api/csv/templates/:id`
  - `GET /api/csv/templates/:module/sample` (public)
  - `GET /api/csv/history/imports`
  - `GET /api/csv/history/exports`

## 3) Worker / Async processing
- [ ] Ensure Render backend has workers enabled:
  - `CSV_IMPORT_WORKER_ENABLED=true`
  - `CSV_IMPORT_WORKER_CONCURRENCY=1`
  - `CSV_IMPORT_WORKER_STUCK_MINUTES=30`
  - `CSV_EXPORT_WORKER_ENABLED=true`
  - `CSV_EXPORT_WORKER_CONCURRENCY=1`
  - `CSV_EXPORT_WORKER_STUCK_MINUTES=30`
- [ ] Optional:
  - `CSV_PREVIEW_ROWS=20`

## 4) Storage
- [ ] If using local storage:
  - Ensure `BASE_URL` is correct (Render backend URL)
  - Ensure `LOCAL_STORAGE_PATH` is set appropriately (defaults to `./uploads`)
- [ ] If using S3:
  - `STORAGE_PROVIDER=s3`
  - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

## 5) Permissions
- [ ] All CSV routes require JWT + roles (except sample template endpoint)
- [ ] Import/export job access:
  - Job creator can view/download
  - Admin roles (SUPER_ADMIN/CEO/IT_MANAGER) can access jobs as implemented

## 6) Frontend (Next.js)
- [ ] Settings includes **CSV Import/Export**:
  - `/settings/csv`
- [ ] User can:
  - select module
  - upload CSV
  - preview rows
  - map required columns
  - start an import and see job progress
  - start an export and download results

## 7) Smoke Tests
- [ ] Login as admin (or permitted role)
- [ ] Go to `/settings/csv`
- [ ] Download a sample template and verify CSV headers
- [ ] Import:
  - Upload a small CSV for one module
  - Preview shows headers + rows
  - Start import and observe status changes to COMPLETED or FAILED
- [ ] Export:
  - Start export and wait for COMPLETED
  - Download the CSV and open it

## 8) Operational Notes
- If jobs appear stuck, workers recover PROCESSING jobs older than:
  - `CSV_IMPORT_WORKER_STUCK_MINUTES`
  - `CSV_EXPORT_WORKER_STUCK_MINUTES`
