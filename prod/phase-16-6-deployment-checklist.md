# Phase 16.6 Deployment Checklist (Fillable Forms + Templates + Fill & Sign)

## 1) Database
- [ ] Confirm migration is deployed:
  - `dev/backend/prisma/migrations/20251221_add_phase_16_6_fillable_forms/migration.sql`
- [ ] On Render backend deploy, verify logs show: `prisma migrate deploy` ran successfully

## 2) Backend (NestJS)
- [ ] Confirm backend builds successfully
- [ ] Confirm endpoints exist:
  - `POST /api/documents/:id/form-template`
  - `GET /api/documents/form-templates`
  - `GET /api/documents/form-templates/:templateId`
  - `DELETE /api/documents/form-templates/:templateId`
  - `POST /api/documents/:id/form-drafts`
  - `GET /api/documents/:id/form-drafts`
  - `GET /api/documents/form-drafts/:draftId`
  - `PUT /api/documents/form-drafts/:draftId`
  - `POST /api/documents/form-drafts/:draftId/render`
  - `POST /api/documents/form-drafts/:draftId/finalize`
  - `DELETE /api/documents/form-drafts/:draftId`

## 3) Permissions
- [ ] Template extraction enforces document `view`
- [ ] Draft create/update/render enforces document `edit`
- [ ] Finalize enforces document `edit`
- [ ] If signature is included, finalize enforces document `sign`

## 4) Frontend (Next.js)
- [ ] Document Detail -> Details tab shows **Fillable Forms** panel for PDFs
- [ ] `/documents/tools` includes **Form Templates** tab

## 5) Smoke Tests
- [ ] Upload a PDF that contains fillable fields
- [ ] Open document -> Details -> Fillable Forms
- [ ] Create a draft
- [ ] Fill several fields
- [ ] Save draft and reload modal; values persist
- [ ] Preview draft (download opens PDF)
- [ ] Add signature (optional) and save draft
- [ ] Finalize draft
- [ ] Confirm document version increments and prior version is in Version History
- [ ] Confirm signature audit entry exists (Documents -> Security/Signatures)

## 6) Operational Notes
- Preview render returns `application/pdf` and is safe to download/view.
- Finalize produces a flattened PDF and stores output in the configured storage provider.
