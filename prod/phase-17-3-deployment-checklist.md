# Phase 17.3 Deployment Checklist (CSV Advanced Features)

## 1) Database
- [ ] Confirm migration is deployed:
  - `dev/backend/prisma/migrations/20251221_add_phase_17_3_csv_advanced_features/migration.sql`
- [ ] On Render backend deploy, verify logs show: `prisma migrate deploy` ran successfully

## 2) Backend (NestJS)
- [ ] Confirm backend builds successfully
- [ ] Confirm endpoints exist:
  - `POST /api/csv/batch/import`
  - `GET /api/csv/batch/:batchId`
  - `POST /api/csv/schedule`
  - `POST /api/csv/backup/export`
  - `POST /api/csv/backup/validate`
  - `POST /api/csv/backup/import`
  - `GET /api/csv/audit/:jobId`
  - `POST /api/csv/rollback/:jobId`
  - `GET /api/csv/stats`
  - `POST /api/csv/export/:module/preview`
  - `POST /api/csv/scheduled-exports`
  - `GET /api/csv/scheduled-exports`
  - `POST /api/csv/scheduled-exports/:id/active`
  - `GET /api/csv/scheduled-exports/:id/runs`

## 3) Worker / Async processing
- [ ] Ensure Render backend has import/export workers enabled:
  - `CSV_IMPORT_WORKER_ENABLED=true`
  - `CSV_IMPORT_WORKER_CONCURRENCY=1`
  - `CSV_IMPORT_WORKER_STUCK_MINUTES=30`
  - `CSV_EXPORT_WORKER_ENABLED=true`
  - `CSV_EXPORT_WORKER_CONCURRENCY=1`
  - `CSV_EXPORT_WORKER_STUCK_MINUTES=30`
- [ ] Scheduled exports loop enabled:
  - `CSV_SCHEDULED_EXPORTS_ENABLED=true`
- [ ] Optional:
  - `CSV_PREVIEW_ROWS=20`

## 4) Storage
- [ ] If using local storage:
  - Ensure `BASE_URL` is correct (Render backend URL)
  - Ensure `LOCAL_STORAGE_PATH` is set appropriately (defaults to `./uploads`)
- [ ] If using S3:
  - `STORAGE_PROVIDER=s3`
  - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

## 5) SMTP (Scheduled Exports Email Delivery)
- [ ] Configure SMTP:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM` (optional; falls back to `SMTP_USER`)
  - `SMTP_SECURE` (`true` for 465, otherwise `false`)
- [ ] Verify outbound email works from production environment

## 6) Frontend (Next.js)
- [ ] Settings menu includes:
  - `/settings/import-export`
  - `/settings/data-migration`
  - `/settings/scheduled-exports`
- [ ] Roles:
  - Import/Export: SUPER_ADMIN, CEO, IT_MANAGER
  - Data Migration: SUPER_ADMIN, IT_MANAGER
  - Scheduled Exports: SUPER_ADMIN, CEO, CFO, IT_MANAGER

## 7) Smoke Tests
- [ ] Batch import:
  - Upload 2+ CSV files to batch endpoint and confirm batch status updates
- [ ] Backup:
  - Export backup, validate backup, restore backup (in a non-prod environment)
- [ ] Audit & rollback:
  - Run an import, confirm audit trail exists, rollback and confirm data changes revert
- [ ] Export preview:
  - Preview an export and confirm row count + sample rows are returned
- [ ] Scheduled exports:
  - Create a schedule and confirm run record is created and email is sent
