# Phase 16.1: OCR & Text Extraction - Testing & Verification Guide

## Overview
This guide provides step-by-step instructions for testing and verifying all Phase 16.1 OCR features in production.

---

## Prerequisites

### Backend Setup
1. Install dependencies:
```powershell
cd dev/backend
npm install tesseract.js@^5.0.0 pdf-parse@^1.1.1 sharp@^0.33.0
```

2. Generate Prisma client:
```powershell
npx prisma generate
```

3. Run database migration:
```powershell
npx prisma migrate deploy
```

4. Start backend server:
```powershell
npm run start:dev
```

### Frontend Setup
1. Start frontend:
```powershell
cd dev/frontend
npm run dev
```

2. Verify Next.js rewrites are working (check `/api/*` routes proxy to backend)

---

## Test Suite

### 1. Basic OCR Extraction

#### Test 1.1: Extract Text from Image
**Steps:**
1. Log in as ACCOUNTANT or higher role
2. Upload a scanned invoice image (JPG/PNG)
3. Navigate to document detail page
4. Click "OCR & Text" tab
5. Click "Extract Text" button
6. Wait for processing (2-5 seconds)

**Expected Results:**
- ✅ OCR button shows "Processing..." state
- ✅ Progress indicator appears
- ✅ Text is extracted and displayed
- ✅ Confidence score is shown (should be > 70%)
- ✅ Character count is displayed
- ✅ Success message appears

**Verification:**
```sql
-- Check OCR job was created
SELECT * FROM "OCRJob" WHERE "documentId" = '<document-id>';

-- Check extracted text was saved
SELECT "extractedText" FROM "DocumentMetadata" WHERE "documentId" = '<document-id>';
```

#### Test 1.2: Extract Text from PDF
**Steps:**
1. Upload a PDF document (text-based or scanned)
2. Navigate to document detail → OCR & Text tab
3. Click "Extract Text"

**Expected Results:**
- ✅ Text PDFs: Instant extraction with 100% confidence
- ✅ Scanned PDFs: OCR processing with confidence score
- ✅ Multi-page PDFs: All pages processed

---

### 2. Smart Data Extraction

#### Test 2.1: Parse Invoice Data
**Steps:**
1. Upload a scanned invoice
2. Extract text first (or use auto-OCR)
3. Call parse-invoice endpoint or use SmartUpload component
4. Verify extracted fields

**Expected Results:**
- ✅ Invoice number extracted
- ✅ Supplier name extracted
- ✅ Total amount extracted
- ✅ Invoice date extracted
- ✅ Line items parsed (if present)
- ✅ Confidence scores for each field

**API Test:**
```bash
curl -X POST http://localhost:3001/api/documents/ocr/{documentId}/parse-invoice \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

#### Test 2.2: Parse Receipt Data
**Steps:**
1. Upload a receipt image
2. Extract text
3. Parse receipt data

**Expected Results:**
- ✅ Vendor name extracted
- ✅ Receipt amount extracted
- ✅ Receipt date extracted
- ✅ Payment method identified (if present)
- ✅ Items list parsed

#### Test 2.3: Parse Contract Data
**Steps:**
1. Upload a contract document
2. Extract text
3. Parse contract data

**Expected Results:**
- ✅ Contract number extracted
- ✅ Party names identified
- ✅ Contract value extracted
- ✅ Start/end dates extracted
- ✅ Key terms identified

---

### 3. Batch OCR Processing

#### Test 3.1: Batch Process Multiple Documents
**Steps:**
1. Upload 5 documents
2. Select all 5 documents
3. Trigger batch OCR via API:
```bash
curl -X POST http://localhost:3001/api/documents/ocr/batch-ocr \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": ["id1", "id2", "id3", "id4", "id5"],
    "language": "eng",
    "provider": "TESSERACT_JS"
  }'
```

**Expected Results:**
- ✅ 5 OCR jobs created with status PENDING
- ✅ Jobs are enqueued
- ✅ Queue processes jobs (max 3 concurrent by default)
- ✅ All jobs complete successfully
- ✅ Queue status shows active jobs count

**Verification:**
```sql
-- Check all jobs
SELECT id, "documentId", status, confidence, "processingTime"
FROM "OCRJob"
WHERE "documentId" IN ('id1', 'id2', 'id3', 'id4', 'id5')
ORDER BY "createdAt" DESC;
```

---

### 4. Auto-OCR on Upload

#### Test 4.1: Configure Auto-OCR
**Steps:**
1. Navigate to `/settings/ocr`
2. Enable "Auto-OCR on Upload"
3. Select categories: INVOICE, RECEIPT
4. Save settings

**Expected Results:**
- ✅ Settings saved successfully
- ✅ Configuration persisted in database

**Verification:**
```sql
SELECT "autoOCREnabled", "autoOCRCategories"
FROM "OCRConfiguration"
ORDER BY "updatedAt" DESC
LIMIT 1;
```

#### Test 4.2: Upload Document with Auto-OCR
**Steps:**
1. Ensure auto-OCR is enabled for INVOICE category
2. Upload an invoice document
3. Wait 2-3 seconds

**Expected Results:**
- ✅ Document uploads successfully
- ✅ OCR job automatically created
- ✅ Job is enqueued and processed
- ✅ Text extracted without manual trigger
- ✅ No auto-OCR for non-configured categories

**Verification:**
```sql
-- Check auto-created OCR job
SELECT * FROM "OCRJob"
WHERE "documentId" = '<new-document-id>'
AND "createdAt" > NOW() - INTERVAL '1 minute';
```

---

### 5. OCR Queue System

#### Test 5.1: Queue Recovery on Restart
**Steps:**
1. Create 10 OCR jobs via batch-ocr
2. Stop backend server immediately
3. Restart backend server
4. Check logs

**Expected Results:**
- ✅ Queue service logs "Recovered X pending jobs"
- ✅ Pending jobs are reprocessed
- ✅ No jobs are lost

#### Test 5.2: Concurrent Job Processing
**Steps:**
1. Set maxConcurrentJobs to 3 in OCR settings
2. Submit 10 documents for batch OCR
3. Monitor queue status

**Expected Results:**
- ✅ Maximum 3 jobs processing simultaneously
- ✅ Remaining jobs wait in queue
- ✅ Jobs process sequentially as slots free up

**API Check:**
```bash
# Check queue status
curl http://localhost:3001/api/documents/ocr/queue-status \
  -H "Authorization: Bearer <token>"
```

#### Test 5.3: Job Retry Logic
**Steps:**
1. Submit OCR for a corrupted/invalid file
2. Check job status

**Expected Results:**
- ✅ Job fails initially
- ✅ Job is retried (up to 3 times)
- ✅ After 3 failures, job marked as FAILED
- ✅ Error message logged

---

### 6. Webhook Notifications

#### Test 6.1: Configure Webhook
**Steps:**
1. Set up a webhook receiver (e.g., webhook.site)
2. Navigate to OCR settings
3. Add webhook URL
4. Add webhook secret (optional)
5. Enable "Notify on Completion" and "Notify on Failure"
6. Save settings

**Expected Results:**
- ✅ Webhook URL saved
- ✅ Secret saved securely

#### Test 6.2: Test Webhook on Success
**Steps:**
1. Trigger OCR on a document
2. Wait for completion
3. Check webhook receiver

**Expected Results:**
- ✅ Webhook POST received
- ✅ Payload contains:
  - event: "ocr.completed"
  - jobId
  - documentId
  - status: "COMPLETED"
  - confidence score
  - extractedText (truncated)
  - timestamp
- ✅ X-OCR-Signature header present (if secret configured)

**Sample Payload:**
```json
{
  "event": "ocr.completed",
  "jobId": "job-123",
  "documentId": "doc-456",
  "status": "COMPLETED",
  "confidence": 87.5,
  "extractedText": "Invoice #12345...",
  "timestamp": "2024-12-19T01:00:00.000Z"
}
```

#### Test 6.3: Test Webhook on Failure
**Steps:**
1. Trigger OCR on invalid file
2. Check webhook receiver

**Expected Results:**
- ✅ Webhook POST received
- ✅ event: "ocr.failed"
- ✅ errorMessage present
- ✅ No extractedText

---

### 7. Frontend Integration

#### Test 7.1: OCR Button in Document Detail
**Steps:**
1. Open any document
2. Navigate to "OCR & Text" tab
3. Click "Extract Text"

**Expected Results:**
- ✅ Button shows loading state
- ✅ Progress bar animates
- ✅ Success state shows green checkmark
- ✅ Extracted text viewer appears
- ✅ Can copy text
- ✅ Can download text as .txt file

#### Test 7.2: Edit Extracted Text
**Steps:**
1. View extracted text
2. Click "Edit" button
3. Modify text
4. Click "Save"

**Expected Results:**
- ✅ Text becomes editable in textarea
- ✅ Save button enabled
- ✅ Text saves successfully
- ✅ Updated text persists in database
- ✅ Edit mode exits after save

**Verification:**
```sql
SELECT "extractedText"
FROM "DocumentMetadata"
WHERE "documentId" = '<document-id>';
```

#### Test 7.3: Smart Upload Component
**Steps:**
1. Use SmartUpload component on invoice creation page
2. Drag & drop scanned invoice
3. Wait for processing

**Expected Results:**
- ✅ File uploads
- ✅ OCR processes automatically
- ✅ Invoice data extracted
- ✅ Preview shows extracted fields
- ✅ "Use This Data" button appears
- ✅ Clicking button auto-fills form

#### Test 7.4: OCR Settings Page
**Steps:**
1. Navigate to `/settings/ocr`
2. Modify settings
3. Save

**Expected Results:**
- ✅ All settings load correctly
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Settings persist after page refresh

---

### 8. Authentication & Authorization

#### Test 8.1: Role-Based Access
**Test Matrix:**

| Endpoint | EMPLOYEE | ACCOUNTANT | IT_MANAGER | SUPER_ADMIN |
|----------|----------|------------|------------|-------------|
| extract-text | ❌ | ✅ | ✅ | ✅ |
| parse-invoice | ❌ | ✅ | ✅ | ✅ |
| batch-ocr | ❌ | ✅ | ✅ | ✅ |
| configuration GET | ❌ | ❌ | ✅ | ✅ |
| configuration PATCH | ❌ | ❌ | ✅ | ✅ |

**Steps:**
1. Test each endpoint with different roles
2. Verify 403 Forbidden for unauthorized roles

#### Test 8.2: Token Authentication
**Steps:**
1. Make OCR API call without token
2. Make call with invalid token
3. Make call with valid token

**Expected Results:**
- ✅ No token: 401 Unauthorized
- ✅ Invalid token: 401 Unauthorized
- ✅ Valid token: 200 OK

---

### 9. Error Handling

#### Test 9.1: Invalid File
**Steps:**
1. Upload non-image/PDF file
2. Trigger OCR

**Expected Results:**
- ✅ Clear error message
- ✅ Job marked as FAILED
- ✅ Error logged in OCRProcessingLog

#### Test 9.2: Corrupted File
**Steps:**
1. Upload corrupted image
2. Trigger OCR

**Expected Results:**
- ✅ Graceful error handling
- ✅ Job retried (up to 3 times)
- ✅ Eventually marked as FAILED
- ✅ Error message descriptive

#### Test 9.3: Network Interruption
**Steps:**
1. Start OCR processing
2. Disconnect network mid-process
3. Reconnect

**Expected Results:**
- ✅ Job marked as FAILED
- ✅ Can retry manually
- ✅ No data corruption

---

### 10. Performance Testing

#### Test 10.1: Single Document Processing Time
**Targets:**
- Small image (< 1MB): < 3 seconds
- Large image (> 5MB): < 10 seconds
- Text PDF: < 1 second
- Scanned PDF (5 pages): < 15 seconds

#### Test 10.2: Concurrent Processing
**Steps:**
1. Submit 20 documents for batch OCR
2. Monitor system resources
3. Verify completion time

**Expected Results:**
- ✅ All jobs complete
- ✅ Memory usage stable (< 500MB increase)
- ✅ No crashes or timeouts

#### Test 10.3: Large Document
**Steps:**
1. Upload 50-page scanned PDF
2. Trigger OCR

**Expected Results:**
- ✅ Processes without timeout
- ✅ All pages extracted
- ✅ Reasonable processing time (< 5 min)

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passed
- [ ] Backend dependencies installed
- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Tesseract language data available

### Deployment
- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] API rewrites working
- [ ] Database accessible
- [ ] Storage accessible (local or S3)

### Post-Deployment
- [ ] Smoke test: Upload document and extract text
- [ ] Verify auto-OCR working
- [ ] Check webhook notifications
- [ ] Monitor queue processing
- [ ] Review logs for errors

---

## Troubleshooting

### Issue: OCR Returns Empty Text
**Causes:**
- Image quality too low
- Unsupported language
- File corrupted

**Solutions:**
- Increase image resolution
- Set correct language in options
- Re-upload file

### Issue: Batch OCR Jobs Stuck
**Causes:**
- Queue service not running
- Max concurrent jobs reached
- Database connection lost

**Solutions:**
- Restart backend server
- Check queue status endpoint
- Verify database connectivity

### Issue: Webhook Not Received
**Causes:**
- Invalid webhook URL
- Firewall blocking
- Webhook service down

**Solutions:**
- Verify URL is accessible
- Check firewall rules
- Test with webhook.site

### Issue: Auto-OCR Not Triggering
**Causes:**
- Auto-OCR disabled in settings
- Category not in autoOCRCategories
- Queue service not initialized

**Solutions:**
- Enable auto-OCR in settings
- Add category to auto-OCR list
- Check backend logs for queue initialization

---

## Monitoring & Metrics

### Key Metrics to Track
1. **OCR Success Rate**: % of jobs completed successfully
2. **Average Processing Time**: Time per document
3. **Queue Length**: Number of pending jobs
4. **Confidence Scores**: Average confidence across jobs
5. **Error Rate**: % of failed jobs

### Database Queries for Monitoring

```sql
-- Success rate (last 24 hours)
SELECT
  COUNT(*) FILTER (WHERE status = 'COMPLETED') * 100.0 / COUNT(*) as success_rate
FROM "OCRJob"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- Average processing time
SELECT AVG("processingTime") as avg_time_ms
FROM "OCRJob"
WHERE status = 'COMPLETED'
AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Average confidence
SELECT AVG(confidence) as avg_confidence
FROM "OCRJob"
WHERE status = 'COMPLETED'
AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Failed jobs
SELECT id, "documentId", "errorMessage", "createdAt"
FROM "OCRJob"
WHERE status = 'FAILED'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## Support & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review failed jobs and investigate patterns
2. **Monthly**: Analyze performance metrics and optimize
3. **Quarterly**: Update Tesseract language data
4. **As Needed**: Adjust maxConcurrentJobs based on load

### Backup & Recovery
- OCR jobs and extracted text stored in database (backed up with regular DB backups)
- Can re-run OCR on any document if needed
- Queue recovers automatically on restart

---

## Conclusion

Phase 16.1 OCR & Text Extraction is production-ready when:
- ✅ All tests pass
- ✅ Authentication working
- ✅ Queue processing reliably
- ✅ Webhooks delivering
- ✅ Auto-OCR triggering
- ✅ Frontend components integrated
- ✅ Error handling graceful
- ✅ Performance acceptable

For issues or questions, refer to:
- `notes/phase-16-1-implementation-guide.md`
- `notes/phase-16-1-completion-summary.md`
- Backend logs: `dev/backend/logs/`
- Frontend console: Browser DevTools
