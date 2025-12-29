# Yellow Power ERP - Upload & Preview Issue Troubleshooting

## Issue Overview

**Symptoms:**
- Category picker missing in upload modal → files tagged as "OTHER"
- PDF preview shows "Failed to load PDF"
- Downloads fail with "File wasn't available on site"
- Frontend changes not reflecting after rebuild

## Root Cause Analysis

### 1. Frontend Build Mismatch
**Problem:** Code changes in `dev/frontend/` not being deployed to production build

**Evidence to Check:**
```bash
# Check if changes exist in built code
grep "category" /var/www/mining-erp/frontend/.next/server/app/documents/page.js

# Compare source structure
ls -la /var/www/mining-erp/frontend/
ls -la /var/www/mining-erp/frontend/dev/frontend/
```

**Solution:**
- Ensure build process uses correct source directory
- Copy `dev/frontend/*` to frontend root if needed
- Rebuild: `npm run build`
- Restart: `pm2 restart erp-frontend`

### 2. Invalid File URLs (404 Downloads)
**Problem:** Backend generates file URLs pointing to wrong host/path

**Evidence to Check:**
```bash
# Check backend BASE_URL
grep BASE_URL /var/www/mining-erp/backend/.env

# Check PM2 environment
pm2 env 1 | grep BASE_URL

# Test a download URL
curl -I "http://localhost:5000/api/documents/{doc_id}/download"
```

**Common Issues:**
- BASE_URL still set to `localhost` instead of public IP/domain
- PORT mismatch between .env and actual listening port
- File path in database doesn't match actual storage location

**Solution:**
```bash
# Update .env
echo "BASE_URL=http://your-server-ip:5000" >> /var/www/mining-erp/backend/.env

# Restart with updated env
pm2 restart erp-backend --update-env
```

### 3. File Storage Path Mismatch
**Problem:** Files stored in different location than serving route expects

**Evidence to Check:**
```bash
# Check where files are actually stored
ls -la /var/www/mining-erp/backend/uploads/
ls -la /var/www/mining-erp/backend/uploads/documents/

# Check file serving route
grep -r "'/documents/files'" /var/www/mining-erp/backend/
```

**Common Patterns:**
- Files stored in `uploads/` but route serves from `uploads/documents/`
- Relative vs absolute path confusion
- Missing express.static middleware

**Solution:**
```javascript
// In backend route file
app.use('/api/documents/files', express.static(path.join(__dirname, 'uploads', 'documents')));
```

## Step-by-Step Resolution

### Phase 1: Verify Current State

1. **Run Diagnostics:**
   ```bash
   chmod +x erp_diagnostics.sh
   ./erp_diagnostics.sh > diagnostics_output.txt
   ```

2. **Key Checks:**
   - Section 1: Is category code in built frontend? ✓/✗
   - Section 2: What is current BASE_URL? _____________
   - Section 3: Do upload directories exist? ✓/✗
   - Section 4: Sample document fileUrl: _____________
   - Section 5: Download URL test result: _____________

### Phase 2: Apply Fixes

1. **Frontend Fix:**
   ```bash
   cd /var/www/mining-erp/frontend
   
   # If dev/frontend structure exists
   cp -r dev/frontend/* .
   
   # Rebuild
   npm run build
   
   # Restart
   pm2 restart erp-frontend
   ```

2. **Backend Fix:**
   ```bash
   cd /var/www/mining-erp/backend
   
   # Update BASE_URL (replace with your server IP/domain)
   sed -i '/^BASE_URL=/d' .env
   echo "BASE_URL=http://192.168.1.100:5000" >> .env
   
   # Ensure upload directory
   mkdir -p uploads/documents
   chmod -R 755 uploads
   
   # Restart with env update
   pm2 stop erp-backend
   pm2 restart erp-backend --update-env
   ```

3. **Verify File Serving Route:**
   
   Edit your backend routes file (e.g., `routes/documents.js`):
   ```javascript
   const express = require('express');
   const path = require('path');
   const router = express.Router();
   
   // Serve uploaded files
   router.use('/files', express.static(
     path.join(__dirname, '..', 'uploads', 'documents')
   ));
   
   // In app.js or main file
   app.use('/api/documents', documentRoutes);
   ```

### Phase 3: Test & Verify

1. **Test Upload with Category:**
   - Navigate to Documents & Files
   - Click Upload
   - ✓ Category dropdown should be visible
   - Select a category (not OTHER)
   - Upload an image (PNG/JPG)
   - Check if category is saved correctly

2. **Test Image to PDF Conversion:**
   - Select uploaded image
   - Click "Convert to PDF" (if available)
   - Wait for conversion
   - Check if PDF is created

3. **Test Preview:**
   - Click on any document
   - ✓ Preview should load without "Failed to load PDF"
   - Try different file types

4. **Test Download:**
   - Click Download button
   - ✓ File should download successfully
   - Check filename is correct

## Advanced Diagnostics

### Database Document Structure Check

```javascript
// In MongoDB shell or via API
db.documents.findOne({}, {
  filename: 1,
  fileUrl: 1,
  category: 1,
  mimeType: 1,
  tags: 1,
  storagePath: 1
})

/* Expected result:
{
  filename: "1.jpeg",
  fileUrl: "http://192.168.1.100:5000/api/documents/files/1703721234567-1.jpeg",
  category: "SAFETY_DATA_SHEETS", // Not "OTHER"
  mimeType: "image/jpeg",
  tags: [],
  storagePath: "uploads/documents/1703721234567-1.jpeg"
}
*/
```

### Network Request Inspection

Open browser DevTools → Network tab when:

1. **Uploading:**
   - POST to `/api/documents/upload`
   - Check response contains correct `fileUrl`

2. **Previewing:**
   - GET to `fileUrl`
   - Should return 200, not 404
   - Content-Type should match file type

3. **Downloading:**
   - GET to `/api/documents/{id}/download`
   - Should return signed URL or trigger download
   - Follow redirects if any

### PM2 Runtime Environment

```bash
# Check actual runtime environment
pm2 show erp-backend

# Check logs in real-time
pm2 logs erp-backend --lines 100

# Filter for file-related errors
pm2 logs erp-backend --lines 200 | grep -i "file\|upload\|404"
```

## Common Pitfalls

### ❌ Pitfall 1: Building Wrong Code
```bash
# Wrong - builds whatever is in current directory
cd /var/www/mining-erp/frontend
npm run build

# Check first
ls -la app/documents/page.tsx
# Does this file contain your category picker code?

# If not, find correct source
find /var/www/mining-erp -name "page.tsx" -path "*/documents/*"
```

### ❌ Pitfall 2: BASE_URL Not Applied
```bash
# Environment set but process not restarted
pm2 restart erp-backend  # Wrong - uses old env

pm2 stop erp-backend
pm2 restart erp-backend --update-env  # Correct
```

### ❌ Pitfall 3: Path Separators (Windows vs Linux)
```javascript
// Wrong - Windows style
const filePath = 'uploads\\documents\\file.pdf';

// Correct - Use path.join()
const filePath = path.join('uploads', 'documents', 'file.pdf');
```

### ❌ Pitfall 4: Relative vs Absolute URLs
```javascript
// Wrong - relative URL in database
fileUrl: "/api/documents/files/file.pdf"

// Correct - absolute URL with BASE_URL
fileUrl: `${process.env.BASE_URL}/api/documents/files/file.pdf`
```

## Quick Reference Commands

```bash
# Full diagnostic
./erp_diagnostics.sh > /tmp/diag_$(date +%Y%m%d_%H%M%S).txt

# Quick status check
pm2 status && pm2 logs erp-backend --lines 20 --nostream

# Test backend directly
curl http://localhost:5000/api/documents?limit=1 | jq

# Test file accessibility
curl -I "http://localhost:5000/api/documents/files/[filename]"

# Find latest uploaded file
ls -lt /var/www/mining-erp/backend/uploads/documents/ | head -5

# Check if file URL is accessible
FILE_URL=$(curl -s http://localhost:5000/api/documents | jq -r '.data[0].fileUrl')
curl -I "$FILE_URL"

# Full restart sequence
cd /var/www/mining-erp/frontend && npm run build && \
cd /var/www/mining-erp/backend && \
pm2 stop all && \
pm2 restart all --update-env && \
pm2 logs --lines 20
```

## Escalation Checklist

Before escalating, gather:

- [ ] Diagnostics output (`diagnostics_output.txt`)
- [ ] Sample document JSON from database
- [ ] Network tab screenshot showing failed request
- [ ] PM2 logs (last 100 lines): `pm2 logs > pm2_logs.txt`
- [ ] Current BASE_URL value
- [ ] Directory listing: `ls -la uploads/documents/ > file_listing.txt`
- [ ] Built frontend code check: Does it contain category picker?

## Success Criteria

✅ **Upload Modal:**
- Category dropdown visible and functional
- Can select categories other than "OTHER"
- Tags input working

✅ **File Storage:**
- Files appear in `uploads/documents/`
- Correct filename format
- Permissions allow read access

✅ **Database:**
- `fileUrl` contains full absolute URL with BASE_URL
- `category` field stores selected value (not "OTHER")
- `storagePath` matches actual file location

✅ **Preview:**
- PDFs render in preview pane
- Images display correctly
- No "Failed to load PDF" errors

✅ **Download:**
- Files download successfully
- Correct filename
- File content intact
- No "File wasn't available" errors

## Contact & Support

If issues persist after following this guide:
1. Save all diagnostic outputs
2. Document exact error messages
3. Note which specific step failed
4. Share relevant code sections
5. Provide environment details (OS, Node version, PM2 version)