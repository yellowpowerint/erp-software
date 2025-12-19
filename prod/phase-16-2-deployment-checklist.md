# Phase 16.2 Deployment Checklist (Advanced PDF Manipulation & Merging)

## 1) Backend
- [ ] Confirm backend environment variables are configured (same as existing backend deployment)
- [ ] Install dependencies
  - PowerShell: `prod/install-phase-16-2-backend-deps.ps1`
  - Bash: `prod/install-phase-16-2-backend-deps.sh`
- [ ] Confirm `pdf-lib` is present in `dev/backend/package.json`
- [ ] Generate Prisma client
  - `npx prisma generate`
- [ ] Restart backend
  - `npm run start:dev` or `npm run start:prod`

## 2) Frontend
- [ ] Build frontend
  - `npm run build`
- [ ] Restart frontend
  - `npm run dev` or `npm run start`

## 3) Smoke Tests
- [ ] Login and open: `/documents/tools`
- [ ] Merge 2 PDFs and download merged output
- [ ] Split a PDF and confirm ZIP downloads
- [ ] Reorder pages + delete a page and confirm output
- [ ] Rotate pages and confirm output
- [ ] Apply watermark and confirm output
- [ ] Apply headers/footers and confirm output
- [ ] Compress a PDF and confirm output
- [ ] Redact an area using click-drag and confirm output is irrecoverable
- [ ] Apply a stamp and confirm output

## 4) API Spot Checks (Optional)
Ensure endpoints return correct content types:
- Merge returns `application/pdf`
- Split/batch endpoints return `application/zip`

## 5) Operational Notes
- Redaction and rasterize compression require server runtime support for PDF rasterization.
- For large PDFs, confirm acceptable performance and memory usage under expected load.
