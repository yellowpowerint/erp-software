# Cloudflare R2 Quick Start (5 Minutes)

## What You Get Free
- ✅ 10 GB storage
- ✅ 10M reads/month
- ✅ 1M writes/month  
- ✅ Unlimited downloads (zero egress fees!)

## Setup Steps

### 1. Sign Up (2 min)
```
1. Go to: https://dash.cloudflare.com/sign-up
2. Create free account
3. Verify email
```

### 2. Create Bucket (1 min)
```
1. Dashboard → R2 → Purchase R2 Plan (select FREE)
2. Create bucket → Name: "erp-documents"
3. Location: Automatic
```

### 3. Generate API Token (1 min)
```
1. R2 → Manage R2 API Tokens
2. Create API token
   - Name: "erp-backend"
   - Permissions: Admin Read & Write
   - Bucket: erp-documents
3. SAVE THESE (you won't see them again):
   - Access Key ID
   - Secret Access Key
   - Endpoint URL
```

### 4. Add to Render (1 min)
```
Go to Render → erp-software-mbx9 → Environment

Add these 6 variables:

STORAGE_PROVIDER=s3
AWS_REGION=auto
AWS_ACCESS_KEY_ID=<paste-your-access-key>
AWS_SECRET_ACCESS_KEY=<paste-your-secret-key>
AWS_S3_BUCKET=erp-documents
S3_ENDPOINT=<paste-your-endpoint-url>

Save Changes → Render auto-deploys
```

### 5. Verify (30 sec)
```
1. Check Render logs for: "S3-compatible storage initialized"
2. Upload a document in your ERP
3. Check R2 dashboard → bucket → Objects
4. See your file! ✅
```

## Done! 🎉

Your documents are now stored in Cloudflare R2 with:
- Persistent storage (survives Render deploys)
- Fast global CDN
- Free for typical usage
- Automatic backups

## Troubleshooting

**"Falling back to local storage"**
→ Check all 6 env vars are set in Render

**"Access Denied"**  
→ Recreate API token with "Admin Read & Write"

**"Bucket not found"**
→ Verify AWS_S3_BUCKET matches bucket name exactly

## Full Documentation
- [Detailed R2 Setup Guide](./CLOUDFLARE_R2_SETUP.md)
- [Storage Configuration](./STORAGE_CONFIGURATION.md)
