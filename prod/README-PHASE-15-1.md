# Phase 15.1 Document Management System - Production Deployment Guide

## 📦 Package Contents

This deployment package contains:

1. **Deployment Scripts**
   - `deploy-phase-15-1.ps1` - PowerShell deployment script (Windows)
   - `deploy-phase-15-1.sh` - Bash deployment script (Linux/Mac)

2. **Configuration Templates**
   - `.env.production.template` - Environment variables template

3. **Documentation**
   - `README-PHASE-15-1.md` - This file
   - `../notes/phase-15-1-implementation-guide.md` - Complete implementation guide

4. **Deployment Artifacts** (generated after running deployment script)
   - `phase-15-1-deployment-{timestamp}.zip` - Deployment archive
   - `deployment-checklist-{timestamp}.txt` - Deployment checklist

## 🚀 Quick Start

### For Windows (PowerShell)

```powershell
# Navigate to project root
cd C:\Users\Plange\Downloads\Projects\mining-erp

# Run deployment script
.\prod\deploy-phase-15-1.ps1
```

### For Linux/Mac (Bash)

```bash
# Navigate to project root
cd /path/to/mining-erp

# Make script executable
chmod +x prod/deploy-phase-15-1.sh

# Run deployment script
./prod/deploy-phase-15-1.sh
```

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL database running
- [ ] Database backup completed
- [ ] Environment variables configured
- [ ] AWS S3 bucket created (if using S3 storage)
- [ ] Sufficient disk space (if using local storage)
- [ ] SSL certificates configured (for production)

## 🔧 Configuration

### 1. Environment Variables

Copy the environment template and configure:

```bash
cp prod/.env.production.template dev/backend/.env
```

Edit `.env` with your production values:

```env
# Essential Configuration
STORAGE_PROVIDER=local              # or 's3' or 'cloudinary'
DATABASE_URL=postgresql://...       # Your database connection
JWT_SECRET=your_secure_secret       # Strong random string
BASE_URL=https://your-domain.com    # Your production URL

# If using S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
```

### 2. Storage Configuration

#### Option A: Local Storage (Development/Small Scale)

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
```

**Pros:**
- No external dependencies
- No additional costs
- Simple setup

**Cons:**
- Limited scalability
- Requires disk space management
- No built-in redundancy

#### Option B: AWS S3 (Production/Recommended)

```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name
```

**Pros:**
- Highly scalable
- Built-in redundancy
- CDN integration available
- Pay-as-you-go pricing

**Cons:**
- Requires AWS account
- Additional costs
- More complex setup

**S3 Bucket Configuration:**
1. Create S3 bucket in AWS Console
2. Configure bucket policy for private access
3. Enable versioning (recommended)
4. Configure lifecycle rules for cost optimization
5. Create IAM user with permissions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`

### 3. Database Migration

```bash
cd dev/backend
npx prisma migrate deploy
```

This will create the following tables:
- `documents`
- `document_versions`
- `document_metadata`
- `document_permissions`

## 📦 Deployment Process

### Automated Deployment

The deployment script will:

1. ✅ Install backend dependencies
2. ✅ Install frontend dependencies
3. ✅ Generate Prisma client
4. ✅ Run database migrations
5. ✅ Create uploads directory
6. ✅ Build backend application
7. ✅ Build frontend application
8. ✅ Run tests (if available)
9. ✅ Create deployment archive
10. ✅ Generate deployment checklist

### Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Backend Setup
cd dev/backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# 2. Frontend Setup
cd ../frontend
npm install
npm run build

# 3. Create uploads directory
mkdir -p ../backend/uploads/documents

# 4. Start services
cd ../backend
npm run start:prod

# In another terminal
cd dev/frontend
npm start
```

## 🧪 Post-Deployment Testing

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

### 2. Test File Upload

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "category=INVOICE" \
  -F "module=finance"
```

### 3. Test File Download

```bash
curl -X GET http://localhost:3000/api/documents/:id/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Verify Storage

**Local Storage:**
```bash
ls -la dev/backend/uploads/documents/
```

**S3 Storage:**
```bash
aws s3 ls s3://your-bucket-name/documents/
```

## 🔒 Security Checklist

After deployment, verify:

- [ ] JWT authentication is working
- [ ] Role-based access control is enforced
- [ ] File size limits are applied
- [ ] File type validation is working
- [ ] HTTPS is enabled (production)
- [ ] CORS is properly configured
- [ ] Environment variables are secure
- [ ] Database credentials are not exposed
- [ ] S3 bucket is private (if using S3)

## 📊 Monitoring

### Key Metrics to Monitor

1. **Upload Success Rate**
   - Track successful vs failed uploads
   - Monitor error types

2. **Storage Usage**
   - Disk space (local storage)
   - S3 costs (S3 storage)

3. **API Performance**
   - Response times for upload/download
   - Concurrent upload handling

4. **Error Rates**
   - File validation errors
   - Permission errors
   - Storage errors

### Logging

Logs are available at:
- Application logs: `dev/backend/logs/`
- Upload errors: Check application error logs
- S3 errors: AWS CloudWatch (if using S3)

## 🐛 Troubleshooting

### Issue: Upload fails with "File too large"

**Solution:**
```env
# Increase in .env
MAX_FILE_SIZE=20971520  # 20MB
```

Also check nginx/proxy configuration:
```nginx
client_max_body_size 20M;
```

### Issue: "Permission denied" on uploads directory

**Solution:**
```bash
chmod 755 dev/backend/uploads
chown -R www-data:www-data dev/backend/uploads  # Adjust user as needed
```

### Issue: S3 upload fails

**Solution:**
1. Verify AWS credentials
2. Check IAM permissions
3. Verify bucket name
4. Check bucket region

```bash
# Test AWS credentials
aws s3 ls s3://your-bucket-name
```

### Issue: Database migration fails

**Solution:**
```bash
# Reset and reapply migrations
cd dev/backend
npx prisma migrate reset
npx prisma migrate deploy
```

### Issue: Frontend can't connect to backend

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` in frontend `.env`
2. Verify CORS configuration in backend
3. Check firewall rules
4. Verify backend is running

## 🔄 Rollback Procedure

If deployment fails:

1. **Stop services**
   ```bash
   # Stop backend
   pm2 stop mining-erp-backend
   
   # Stop frontend
   pm2 stop mining-erp-frontend
   ```

2. **Restore database**
   ```bash
   psql mining_erp < backup.sql
   ```

3. **Revert to previous deployment**
   ```bash
   # Extract previous deployment archive
   unzip phase-15-1-deployment-previous.zip
   ```

4. **Restart services**
   ```bash
   pm2 restart all
   ```

## 📈 Performance Optimization

### For High-Volume Uploads

1. **Use S3 for storage**
   - Better scalability
   - Parallel uploads

2. **Increase worker processes**
   ```javascript
   // In main.ts
   const app = await NestFactory.create(AppModule, {
     logger: ['error', 'warn'],
   });
   ```

3. **Enable compression**
   ```typescript
   app.use(compression());
   ```

4. **Configure rate limiting**
   ```env
   RATE_LIMIT_MAX=100  # Requests per minute
   ```

## 🔐 Production Best Practices

1. **Use HTTPS**
   - Configure SSL certificates
   - Redirect HTTP to HTTPS

2. **Enable Rate Limiting**
   - Prevent abuse
   - Protect against DDoS

3. **Regular Backups**
   - Database: Daily backups
   - Files: S3 versioning or backup script

4. **Monitor Logs**
   - Set up log aggregation
   - Configure alerts for errors

5. **Update Dependencies**
   - Regular security updates
   - Test in staging first

## 📞 Support

For issues or questions:

1. Check the implementation guide: `notes/phase-15-1-implementation-guide.md`
2. Review logs for error details
3. Verify configuration against templates
4. Check database migrations status

## 📝 Changelog

### Version 1.0.0 (December 17, 2025)
- ✅ Initial release
- ✅ File upload (single & multiple)
- ✅ Local and S3 storage support
- ✅ Role-based access control
- ✅ File validation
- ✅ Document search and filtering
- ✅ Complete API documentation

## 🎯 Next Steps

After successful deployment:

1. Test all endpoints with production data
2. Monitor performance and errors
3. Configure backup procedures
4. Set up monitoring alerts
5. Plan for Phase 15.2 (Document Library UI)

---

**Deployment Package Version:** 1.0.0  
**Compatible with:** Mining ERP v0.1.0+  
**Last Updated:** December 17, 2025
