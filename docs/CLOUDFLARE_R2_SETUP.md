# Cloudflare R2 Storage Setup Guide

## Why Cloudflare R2?

**Cloudflare R2** is the recommended storage solution for this ERP system deployed on Render because:

✅ **Generous Free Tier**
- 10 GB storage free forever
- 10 million read operations/month
- 1 million write operations/month
- **Zero egress fees** (unlimited downloads!)

✅ **Easy Setup**
- Sign up in 5 minutes
- S3-compatible API (no code changes needed)
- Simple API token generation

✅ **Perfect for Mining ERP**
- 10GB = ~1,000-2,000 documents
- Unlimited downloads for reports, invoices, etc.
- Fast global CDN
- 99.9% uptime SLA

✅ **Cost After Free Tier**
- Storage: $0.015/GB/month (cheaper than AWS S3)
- Operations: $0.36/million reads, $4.50/million writes
- Egress: $0 (always free!)

---

## Step-by-Step Setup

### 1. Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with email (free account)
3. Verify your email
4. Log in to Cloudflare Dashboard

### 2. Enable R2 Storage

1. In Cloudflare Dashboard, click **R2** in the left sidebar
2. Click **Purchase R2 Plan** (don't worry, it's free!)
3. Select **Free Plan** (10GB included)
4. Click **Proceed** to enable R2

### 3. Create R2 Bucket

1. In R2 dashboard, click **Create bucket**
2. Bucket settings:
   - **Name**: `erp-documents` (or your choice, must be unique)
   - **Location**: Automatic (Cloudflare picks best location)
3. Click **Create bucket**
4. Your bucket is now ready!

### 4. Generate API Token

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Token settings:
   - **Token name**: `erp-backend-token`
   - **Permissions**: 
     - ✅ Object Read & Write
     - ✅ (or select "Admin Read & Write" for full access)
   - **TTL**: Forever (or set expiration if you want)
   - **Bucket scope**: Select your bucket (`erp-documents`)
4. Click **Create API Token**
5. **IMPORTANT**: Copy and save these values immediately (you won't see them again):
   - **Access Key ID** (starts with something like `abc123...`)
   - **Secret Access Key** (long random string)
   - **Endpoint URL** (looks like `https://abc123.r2.cloudflarestorage.com`)

### 5. Configure Render Environment Variables

1. Go to your Render dashboard
2. Select your backend service (`erp-software-mbx9`)
3. Click **Environment** tab
4. Add these environment variables:

```env
STORAGE_PROVIDER=s3
AWS_REGION=auto
AWS_ACCESS_KEY_ID=<your-r2-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
AWS_S3_BUCKET=erp-documents
S3_ENDPOINT=<your-r2-endpoint-url>
BASE_URL=https://erp-software-mbx9.onrender.com
```

**Example with real values:**
```env
STORAGE_PROVIDER=s3
AWS_REGION=auto
AWS_ACCESS_KEY_ID=abc123def456ghi789
AWS_SECRET_ACCESS_KEY=xyz789uvw456rst123opq
AWS_S3_BUCKET=erp-documents
S3_ENDPOINT=https://abc123def456.r2.cloudflarestorage.com
BASE_URL=https://erp-software-mbx9.onrender.com
```

5. Click **Save Changes**
6. Render will automatically redeploy with new configuration

### 6. Verify Setup

After Render redeploys:

1. Check Render logs for: `"S3-compatible storage initialized with endpoint: https://..."`
2. Log into your ERP frontend
3. Try uploading a document (e.g., in Documents module)
4. Go back to Cloudflare R2 dashboard
5. Click on your bucket → **Objects**
6. You should see your uploaded file!

---

## Troubleshooting

### "S3 credentials not found, falling back to local storage"

**Problem**: Environment variables not set correctly in Render

**Solution**:
1. Go to Render → Environment tab
2. Verify all 6 variables are set (STORAGE_PROVIDER, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, S3_ENDPOINT)
3. Make sure there are no extra spaces or quotes
4. Click Save Changes to redeploy

### "Access Denied" or 403 errors

**Problem**: API token doesn't have correct permissions

**Solution**:
1. Go to Cloudflare R2 → Manage R2 API Tokens
2. Delete old token
3. Create new token with "Admin Read & Write" permissions
4. Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Render
5. Redeploy

### "Bucket not found" errors

**Problem**: Bucket name mismatch

**Solution**:
1. Verify bucket name in Cloudflare R2 dashboard
2. Update AWS_S3_BUCKET in Render to match exactly
3. Bucket names are case-sensitive!

### Files upload but can't download

**Problem**: S3_ENDPOINT not set or incorrect

**Solution**:
1. Go to Cloudflare R2 → your bucket
2. Look for "S3 API" section to find your endpoint URL
3. Update S3_ENDPOINT in Render (should include `https://`)
4. Redeploy

### "Region not found" errors

**Problem**: Wrong region value

**Solution**:
- For Cloudflare R2, always use `AWS_REGION=auto`
- Do NOT use specific regions like `us-east-1`

---

## Usage Monitoring

### Check Your R2 Usage

1. Go to Cloudflare Dashboard → R2
2. Click on your bucket
3. View **Metrics** tab to see:
   - Storage used (out of 10GB free)
   - Read operations (out of 10M/month free)
   - Write operations (out of 1M/month free)
   - Egress (always free!)

### Typical Mining ERP Usage

Based on typical usage patterns:

| Activity | Estimated Usage |
|----------|----------------|
| Upload 100 invoices/month | ~100 MB storage, 100 writes |
| Upload 50 safety reports/month | ~50 MB storage, 50 writes |
| Upload 200 misc documents/month | ~200 MB storage, 200 writes |
| View/download 1000 documents/month | 1,000 reads |
| **Monthly Total** | **~350 MB, 350 writes, 1,000 reads** |
| **% of Free Tier Used** | **3.5% storage, 0.035% writes, 0.01% reads** |

**Conclusion**: You can run for **years** on the free tier with typical usage!

---

## Advanced: Custom Domain (Optional)

You can serve files from your own domain instead of R2's default URL:

1. In R2 bucket settings, click **Settings** → **Custom Domains**
2. Add your domain (e.g., `files.yourdomain.com`)
3. Add CNAME record in your DNS:
   - Type: `CNAME`
   - Name: `files`
   - Target: Your R2 bucket endpoint
4. Wait for DNS propagation (~5-10 minutes)
5. Files will be accessible at `https://files.yourdomain.com/...`

---

## Migration from Local Storage

If you already have documents in local storage (from development):

### Option 1: Fresh Start (Recommended)
- Just enable R2 and start fresh
- Old local files will be lost on next Render deploy anyway

### Option 2: Manual Migration
1. Download files from local storage
2. Use Cloudflare R2 dashboard to upload manually
3. Update `fileUrl` in database to point to R2 URLs

---

## Alternative: Backblaze B2

If you prefer Backblaze B2 instead of R2:

### Free Tier
- 10 GB storage free
- 1 GB/day download free (~30GB/month)
- After: $0.006/GB storage, $0.01/GB egress

### Setup
1. Sign up at backblaze.com
2. Create B2 bucket
3. Generate application key
4. Use these Render env vars:

```env
STORAGE_PROVIDER=s3
AWS_REGION=us-west-004
AWS_ACCESS_KEY_ID=<your-b2-key-id>
AWS_SECRET_ACCESS_KEY=<your-b2-application-key>
AWS_S3_BUCKET=<your-b2-bucket-name>
S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
BASE_URL=https://erp-software-mbx9.onrender.com
```

**Note**: Backblaze regions vary (us-west-004, us-west-002, eu-central-003, etc.)

---

## Security Best Practices

1. ✅ **Never commit API keys to git** - always use environment variables
2. ✅ **Use bucket-scoped tokens** - don't give access to all buckets
3. ✅ **Set token expiration** if possible (or rotate periodically)
4. ✅ **Enable R2 bucket versioning** for disaster recovery
5. ✅ **Monitor usage** regularly in Cloudflare dashboard
6. ✅ **Use separate buckets** for dev/staging/production if needed

---

## Cost Estimate (After Free Tier)

If you exceed the free tier:

| Scenario | Storage | Operations | Egress | Monthly Cost |
|----------|---------|------------|--------|--------------|
| Small (20GB, 2M ops) | $0.30 | $0.72 | $0 | **$1.02** |
| Medium (50GB, 5M ops) | $0.75 | $1.80 | $0 | **$2.55** |
| Large (100GB, 10M ops) | $1.50 | $3.60 | $0 | **$5.10** |

**Compare to AWS S3:**
- Same 100GB + 10M ops + 50GB egress = **$7.80/month**
- R2 saves you ~35% on storage + 100% on egress!

---

## Support

### Cloudflare R2 Documentation
- Getting Started: https://developers.cloudflare.com/r2/get-started/
- API Reference: https://developers.cloudflare.com/r2/api/s3/
- Pricing: https://developers.cloudflare.com/r2/pricing/

### Common Issues
- Check Render logs for storage initialization messages
- Verify all 6 environment variables are set
- Test API credentials using AWS CLI with R2 endpoint
- Join Cloudflare Discord for community support

### Need Help?
1. Check Render deployment logs
2. Verify R2 bucket exists and token is valid
3. Test upload/download in R2 dashboard directly
4. Review `StorageService` logs in application
