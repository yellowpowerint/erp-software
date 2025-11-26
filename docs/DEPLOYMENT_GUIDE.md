# Mining ERP Deployment Guide

## Overview

This guide covers deploying the Mining ERP System to production environments including Render, Vercel, Railway, and self-hosted options.

---

## Architecture

### Backend (NestJS)
- **Framework**: NestJS v10
- **Runtime**: Node.js 22.x
- **Database**: PostgreSQL 15+
- **Deployment**: Render / Railway / Self-hosted

### Frontend (Next.js)
- **Framework**: Next.js 15
- **Runtime**: Node.js 22.x
- **Deployment**: Vercel / Netlify / Self-hosted

---

## Prerequisites

### Required Services
- PostgreSQL database (production)
- Node.js 22.x or higher
- Git repository access
- Domain name (optional)

### Environment Variables

Create `.env` files for both backend and frontend:

#### Backend `.env`
```env
# Database
DATABASE_URL="<your-postgresql-connection-string>"

# JWT Authentication
JWT_SECRET="your-jwt-secret-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# API Configuration
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://your-frontend-domain.com"

# Optional: AI Services (set only in your hosting platform's env settings)
OPENAI_API_KEY="<your-openai-api-key>"
```

#### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL="https://your-backend-domain.com/api"
```

---

## Deployment Options

### Option 1: Render (Backend) + Vercel (Frontend)

#### Backend on Render

1. **Create New Web Service**
   - Connect GitHub repository
   - Root Directory: `dev/backend`
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

2. **Configure Environment Variables**
   - Add all backend `.env` variables
   - Set DATABASE_URL to Render PostgreSQL

3. **Database Setup**
   - Create PostgreSQL database in Render
   - Copy connection string to DATABASE_URL
   - Run migrations: `npx prisma migrate deploy`

4. **Health Check**
   - Path: `/api/health`
   - Expected response: `{ "status": "ok" }`

#### Frontend on Vercel

1. **Import GitHub Repository**
   - Connect to Vercel
   - Root Directory: `dev/frontend`
   - Framework: Next.js

2. **Configure Environment Variables**
   - Add `NEXT_PUBLIC_API_URL`
   - Point to Render backend URL

3. **Build Settings**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Deploy**
   - Vercel auto-deploys on push to main
   - Custom domain optional

---

### Option 2: Railway (Full Stack)

1. **Create New Project**
   - Connect GitHub repository
   - Railway detects monorepo structure

2. **Backend Service**
   - Root: `dev/backend`
   - Build: `npm install && npm run build`
   - Start: `npm run start:prod`
   - Add PostgreSQL plugin
   - Configure environment variables

3. **Frontend Service**
   - Root: `dev/frontend`
   - Build: `npm run build`
   - Start: `npm start`
   - Set `NEXT_PUBLIC_API_URL` to backend URL

4. **Database**
   - Add PostgreSQL plugin
   - Auto-configures DATABASE_URL
   - Run: `npx prisma migrate deploy`

---

### Option 3: Self-Hosted (Docker)

#### Backend Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY dev/backend/package*.json ./
RUN npm ci --only=production
COPY dev/backend .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY dev/frontend/package*.json ./
RUN npm ci
COPY dev/frontend .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mining_erp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: <your-db-password>
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: dev/backend/Dockerfile
    environment:
      DATABASE_URL: <postgresql-connection-string-pointing-to-postgres-service>
      JWT_SECRET: <your-jwt-secret>
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: dev/frontend/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Database Setup

### Initial Migration
```bash
cd dev/backend
npx prisma migrate deploy
```

### Seed Database (Optional)
```bash
npx prisma db seed
```

### Create Admin User
```bash
# Use the PowerShell script
cd ../..
./create-test-user.ps1
```

Or manually via API:
```bash
curl -X POST https://your-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "YourPassword",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN"
  }'
```

---

## Post-Deployment Checklist

### Backend
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Health endpoint responding
- [ ] CORS configured for frontend domain
- [ ] JWT secret set (production-grade)
- [ ] Environment variables secured
- [ ] Logs accessible
- [ ] Monitoring enabled

### Frontend
- [ ] API URL configured correctly
- [ ] Can login with admin user
- [ ] All pages load without errors
- [ ] Navigation working
- [ ] Reports display data
- [ ] Custom domain configured (if applicable)

### Security
- [ ] HTTPS enabled on both backend and frontend
- [ ] Database credentials secured
- [ ] JWT secret strong (32+ characters)
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled
- [ ] API keys secured in environment variables

---

## Monitoring

### Health Checks
- **Backend**: `GET /api/health`
- **Database**: Check connection in backend logs
- **Frontend**: Access root URL

### Logs
- **Render**: View logs in dashboard
- **Vercel**: View function logs in dashboard
- **Railway**: View logs per service

### Metrics to Monitor
- Response time (< 500ms for most endpoints)
- Database connection pool usage
- Memory usage (< 512MB recommended)
- Error rates
- Active user sessions

---

## Troubleshooting

### Backend Won't Start
1. Check DATABASE_URL is valid
2. Verify Prisma Client generated (`npx prisma generate`)
3. Check migrations applied (`npx prisma migrate deploy`)
4. Review environment variables

### Frontend Can't Connect to Backend
1. Verify NEXT_PUBLIC_API_URL is correct
2. Check CORS settings in backend
3. Verify backend is running and accessible
4. Check network/firewall rules

### Database Connection Errors
1. Verify DATABASE_URL format
2. Check database is running
3. Verify network access to database
4. Check connection pool settings

### Build Failures
1. Ensure Node.js version matches (22.x)
2. Clear build cache
3. Verify all dependencies installed
4. Check for TypeScript errors locally

---

## Backup & Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d mining_erp > backup.sql

# Restore
psql -h hostname -U username -d mining_erp < backup.sql
```

### Automated Backups
- Configure daily backups in Render/Railway
- Store backups in S3/Cloud Storage
- Test restore procedure regularly

---

## Scaling Considerations

### Horizontal Scaling
- Backend: Add more instances behind load balancer
- Database: Use connection pooling (PgBouncer)
- Frontend: Vercel auto-scales

### Database Optimization
- Add indexes for frequently queried fields
- Use database read replicas for reports
- Implement caching (Redis) for hot data

### Performance
- Enable response compression
- Use CDN for static assets
- Implement query optimization
- Monitor slow queries

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT secrets** periodically
3. **Keep dependencies updated** (npm audit)
4. **Use strong passwords** for admin users
5. **Enable rate limiting** on API endpoints
6. **Sanitize user inputs** (already implemented)
7. **Regular security audits**
8. **Backup database** regularly

---

## Support & Maintenance

### Update Deployment
```bash
# Pull latest changes
git pull origin main

# Backend
cd dev/backend
npm install
npx prisma migrate deploy
npm run build

# Frontend  
cd ../frontend
npm install
npm run build
```

### Rollback Deployment
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or use platform-specific rollback
# Render: Deploy previous commit from dashboard
# Vercel: Rollback in deployments tab
```

---

**Deployment Guide Last Updated**: November 26, 2025
