# Phase 16.8 Deployment Checklist (Finalize: Scan Cleanup + Permanent Redaction + Integrity)

## 1) Database
- [ ] Confirm migration is deployed:
  - `dev/backend/prisma/migrations/20251221_add_phase_16_8_finalize_jobs/migration.sql`
- [ ] On Render backend deploy, verify logs show: `prisma migrate deploy` ran successfully

## 2) Backend (NestJS)
- [ ] Confirm backend builds successfully
- [ ] Confirm endpoints exist:
  - `POST /api/documents/:id/finalize/jobs`
  - `GET /api/documents/finalize/jobs/:jobId`
  - `GET /api/documents/:id/finalize-jobs`
  - `DELETE /api/documents/finalize/jobs/:jobId`

## 3) Worker / Async processing
- [ ] Ensure Render backend has worker enabled:
  - `FINALIZE_WORKER_ENABLED=true`
  - `FINALIZE_WORKER_CONCURRENCY=1`
  - `FINALIZE_WORKER_STUCK_MINUTES=30`

## 4) Permissions
- [ ] Starting/cancelling requires document `edit`
- [ ] Viewing jobs requires document `view`

## 5) Frontend (Next.js)
- [ ] `/documents/tools` includes a **Finalize** tab
- [ ] User can:
  - choose cleanup options (density/quality/enhancements)
  - add permanent redaction boxes
  - configure watermark + allowPrint/allowCopy + password flag
  - start a finalize job
  - view job status and open the updated document

## 6) Smoke Tests
- [ ] Upload a scanned PDF (or any PDF)
- [ ] Go to `/documents/tools` → Finalize
- [ ] Enable Rasterize and set density/quality
- [ ] Draw at least 1 redaction on a page
- [ ] Add watermark text (optional)
- [ ] Start job and observe status transitions
- [ ] On completion, open the updated document
- [ ] Verify:
  - redacted content is irrecoverable (no selectable text under redaction)
  - file was versioned (document version increments; prior version in `document_versions`)
  - `document_integrity_seals` has an entry for the new version
  - security preferences are saved (`document_security`)

## 7) Operational Notes
- If jobs appear stuck, the worker recovers PROCESSING jobs older than `FINALIZE_WORKER_STUCK_MINUTES`.
