# Storage Configuration Guide

## Overview

The Mining ERP system includes a comprehensive document management module that handles file uploads for:
- Document analysis and OCR
- PDF conversion and manipulation
- Invoice/receipt attachments
- Safety incident reports
- HR documents
- Fleet maintenance records
- And more...

## Storage Architecture

The system uses a **pluggable storage architecture** via `StorageService` that supports multiple backends:

### Supported Storage Providers

1. **LOCAL** - File system storage (development only)
2. **S3** - AWS S3 object storage (recommended for production)
3. **CLOUDINARY** - Placeholder (not yet implemented)

## ⚠️ Critical: Render Deployment Requires S3

**Render uses ephemeral containers** - the filesystem is wiped on every deploy or container restart. This means:

- ❌ **LOCAL storage will NOT work on Render**
- ❌ All uploaded files will be lost on redeploy
- ✅ **You MUST use S3 for production on Render**

## Production Setup: AWS S3

### Step 1: Create S3 Bucket

1. Log into AWS Console → S3
2. Click **Create bucket**
3. Bucket settings:
   - **Name**: `yellowpower-erp-documents` (or your choice)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Block Public Access**: Keep enabled (files served via signed URLs)
   - **Versioning**: Enable (recommended for document history)
   - **Encryption**: Enable server-side encryption (recommended)

### Step 2: Create IAM User

1. AWS Console → IAM → Users → **Add users**
2. User name: `erp-s3-uploader`
3. Access type: **Programmatic access** (API keys)
4. Attach permissions:
   - Option A: Attach existing policy `AmazonS3FullAccess` (simple but broad)
   - Option B: Create custom policy (recommended):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::yellowpower-erp-documents",
        "arn:aws:s3:::yellowpower-erp-documents/*"
      ]
    }
  ]
}
```

5. Save the **Access Key ID** and **Secret Access Key** securely

### Step 3: Configure Render Environment Variables

In your Render dashboard for the backend service (`erp-software-mbx9`):

1. Go to **Environment** tab
2. Add these variables:

```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your-key...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=yellowpower-erp-documents
BASE_URL=https://erp-software-mbx9.onrender.com
```

3. Click **Save Changes**
4. Render will automatically redeploy with new settings

### Step 4: Verify Configuration

After deployment:

1. Check Render logs for: `"S3 storage initialized"`
2. Test document upload via frontend
3. Verify file appears in S3 bucket
4. Test document download

## Development Setup: Local Storage

For local development, you can use local filesystem storage:

```env
# dev/backend/.env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
BASE_URL=http://localhost:3001
```

Files will be stored in `dev/backend/uploads/` directory.

## Storage Features

### Automatic Features
- ✅ **File validation** - Size limits, MIME type checks
- ✅ **Deduplication** - SHA-256 hash prevents duplicate uploads
- ✅ **Version control** - Previous versions archived automatically
- ✅ **Signed URLs** - Secure temporary download links (S3)
- ✅ **Metadata tracking** - Original name, size, uploader, timestamps

### Document Processing
- **OCR** - Automatic text extraction from PDFs/images
- **Conversion** - Office docs → PDF
- **PDF manipulation** - Merge, split, rotate, watermark, redact
- **Form filling** - Fill PDF forms programmatically
- **Digital signatures** - Sign documents electronically

### Security
- **Role-based access control** (RBAC)
- **Document permissions** - Granular view/download/edit permissions
- **Sharing** - Share with expiration and permission limits
- **Access logs** - Audit trail for compliance
- **Encryption** - At-rest and in-transit

## File Organization

Files are organized by module in S3/local storage:

```
documents/
  ├── {timestamp}-{sanitized-filename}
procurement/
  ├── {timestamp}-invoice.pdf
hr/
  ├── {timestamp}-contract.pdf
fleet/
  ├── {timestamp}-maintenance-report.pdf
```

## Cost Considerations

### AWS S3 Pricing (as of 2024)
- **Storage**: ~$0.023/GB/month (Standard)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: $0.09/GB (first 10TB)

**Estimated monthly cost for typical mining ERP usage:**
- 10GB storage: ~$0.23
- 10,000 uploads: ~$0.05
- 50,000 downloads: ~$0.02
- 5GB transfer: ~$0.45
- **Total: ~$0.75/month** (scales with usage)

### Alternative: Cloudflare R2
If you want S3-compatible storage with zero egress fees:
- Cloudflare R2 is S3-compatible
- No egress charges
- Similar pricing for storage/operations
- Requires code changes to use R2 endpoint

## Troubleshooting

### Files disappearing on Render
- ✅ Verify `STORAGE_PROVIDER=s3` is set in Render
- ✅ Check Render logs for "S3 storage initialized"
- ❌ If using `local`, files will be lost on redeploy

### S3 upload errors
- Check IAM permissions include `s3:PutObject`
- Verify bucket name matches `AWS_S3_BUCKET`
- Check AWS credentials are valid
- Ensure bucket region matches `AWS_REGION`

### Download URLs not working
- For S3: Signed URLs expire after 1 hour (configurable)
- For local: Ensure `BASE_URL` matches your backend URL
- Check document permissions in database

### OCR not working
- S3 files are downloaded to temp directory for processing
- Check `/uploads/temp/` has write permissions (local)
- Verify OCR service has access to storage service

## Migration from Local to S3

If you have existing documents in local storage and need to migrate:

1. Export document metadata from database
2. Upload files to S3 using AWS CLI or SDK
3. Update `fileUrl` in `Document` table to S3 URLs
4. Update `fileName` to match S3 keys
5. Test downloads before deleting local files

## Security Best Practices

1. **Never commit AWS credentials** to git
2. **Use IAM roles** if running on AWS EC2/ECS (not applicable for Render)
3. **Enable S3 bucket versioning** for disaster recovery
4. **Set up S3 lifecycle policies** to archive old files to Glacier
5. **Enable CloudTrail** to audit S3 access
6. **Use separate buckets** for dev/staging/production
7. **Rotate AWS credentials** periodically

## Support

For issues with storage configuration:
1. Check Render logs for storage initialization messages
2. Verify all environment variables are set correctly
3. Test S3 access using AWS CLI with same credentials
4. Review `StorageService` logs in application

## References

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/
- Render Environment Variables: https://render.com/docs/environment-variables
