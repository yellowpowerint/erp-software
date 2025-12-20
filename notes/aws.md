# AWS Deployment Plan (ERP + Company Website)

This document is the **AWS-first deployment runbook** for:

- **ERP** (frontend + backend) on `erp.yellowpowerinternational.com`
- **Company website** (Next.js) on `yellowpowerinternational.com`

It prioritizes:

- **Cost control** (maximize AWS credits, avoid common cost traps)
- **Security** (TLS everywhere, least-privilege, secrets management)
- **Maintainability** (repeatable deployments, clear env config)

---

## 0) Assumptions based on your answers

- **Domain registrar / DNS**: domain is registered at **Namecheap**.
- **Website**: updated periodically with company news/events and embedded/linked YouTube videos + photos.
- **ERP**: actively used during working hours by multiple departments and stores many documents.
- **User base**: Ghana (UK/EU or US regions acceptable).
- **Mobile apps**: will integrate with the ERP backend API.

Default choices for this runbook (we can adjust later without re-architecting):

- **DNS hosting**: Route 53 hosted zone, with Namecheap pointing nameservers to Route 53.
- **Region**: `eu-west-1` for ECS/RDS (CloudFront cert in `us-east-1`).
- **Company website**: deploy as **static** to S3 + CloudFront (content updates via Git/CI rebuild).
- **ERP frontend**: deploy as **static** to S3 + CloudFront (API calls via `/api` rewrite/proxy).
- **ERP backend**: ECS Fargate behind ALB on `api.erp.yellowpowerinternational.com`.
- **Mobile auth**: keep current JWT login flow initially; plan refresh tokens as a later enhancement.

## 1) Target architecture (high level)

### 1.1 Domains and routing

- `yellowpowerinternational.com`
  - CloudFront distribution (Website)
- `www.yellowpowerinternational.com`
  - Redirect to apex or serve same content (your choice)
- `erp.yellowpowerinternational.com`
  - CloudFront distribution (ERP frontend)
- `api.erp.yellowpowerinternational.com`
  - Application Load Balancer (ALB) → ECS service (ERP backend)

Notes:

- Separating `api.erp...` from `erp...` simplifies CORS, cookies, routing, and allows different caching policies.
- CloudFront can front the ALB if you want a single edge endpoint for API too, but it’s optional.

Mobile note:

- Mobile apps should call `https://api.erp.yellowpowerinternational.com` directly.

### 1.2 Services used

- **Route 53**: DNS hosted zone + records (or keep current DNS provider and create equivalent records)
- **ACM**: TLS certificates (free)
  - CloudFront certs must be in **us-east-1**
  - ALB certs in your chosen region (e.g. `eu-west-1` or `us-east-1`)
- **S3**:
  - Website static files (optional)
  - Document storage for ERP (recommended)
- **CloudFront**:
  - CDN + TLS termination for website and ERP frontend
- **ECS Fargate**:
  - ERP backend (NestJS) running as containers
  - Optional: ERP frontend (Next.js SSR) if you need server-side rendering
- **RDS PostgreSQL**:
  - Primary ERP database
- **Secrets Manager**:
  - Store and rotate sensitive env values (`DATABASE_URL`, `JWT_SECRET`, etc.)
- **CloudWatch**:
  - Logs + metrics + alarms
- **SQS (recommended)**:
  - Async jobs for OCR/conversion/audit packages (Phase 16.5+ readiness)

---

## 2) Decision points (choose your path)

### 2.1 Company website: static vs SSR

Pick one:

- **Option A (lowest cost)**: Static site
  - Build/export → upload to S3 → CloudFront
  - Best when content is mostly marketing pages (even if updated frequently)
- **Option B (SSR)**: Next.js server
  - Containerize → ECS Fargate behind ALB → optional CloudFront
  - Best when you require SSR, dynamic routing, personalization

Recommendation for your website:

- **Option A (Static) + a content workflow** is usually best.
- Posting news/events and updating photos/videos typically does not require SSR. You can:
  - rebuild and deploy on every content update, or
  - use a headless CMS and fetch content at build time (still static).

### 2.2 ERP frontend: static vs SSR

- **If ERP frontend is client-heavy** and uses API calls for data:
  - You can often deploy it as **static** (S3 + CloudFront)
- **If you require SSR** (server-side auth redirects, SEO is not usually important for ERP):
  - Deploy via **ECS Fargate**

This plan includes both approaches.

---

## 3) Region selection

Choose one AWS region for compute + database:

- Recommended if you’re in Africa/Europe: `eu-west-1` (Ireland)
- Otherwise: `us-east-1` can be cost-effective and close to many users

Recommendation for Ghana:

- Start with **`eu-west-1` (Ireland)** for ECS + RDS.
- Use **CloudFront** for global edge caching.
- Use **us-east-1 only for CloudFront ACM certificates** (required by AWS).

Rules:

- **CloudFront** is global.
- **ACM for CloudFront** must be requested in **us-east-1**.
- **RDS + ECS + ALB** should live in your chosen region.

---

## 4) Networking (VPC) — cost-aware

### 4.1 Avoid the NAT Gateway trap

NAT Gateway is a frequent hidden cost. You can avoid it in early production:

- Run ECS tasks in **public subnets** with security groups (acceptable for many setups if you lock inbound)
- Or use **VPC endpoints** (S3, ECR, CloudWatch, Secrets Manager, SQS) and still keep tasks private

**Recommendation for credits/cost control**:

- Start with **public subnets** for ECS tasks + strict inbound rules, then harden later.

Availability note (ERP is active during working hours):

- Use **2 AZs** for ALB and ECS tasks.
- Keep minimum desired count at **1** initially for cost, but consider **2 tasks** during business hours if the load grows.

### 4.2 VPC layout

- VPC with 2 AZs
- Public subnets (2)
  - ALB
  - ECS tasks (if choosing public)
- Private subnets (2)
  - RDS

Security groups:

- **ALB SG**: inbound 443 from `0.0.0.0/0`, outbound to ECS backend
- **ECS Backend SG**: inbound from ALB SG only on container port, outbound to RDS and AWS services
- **RDS SG**: inbound 5432 from ECS Backend SG only

---

## 5) Database (RDS Postgres)

### 5.1 Provisioning

- RDS PostgreSQL
- Enable:
  - Automated backups (start with 7 days)
  - Storage autoscaling (optional)
  - Performance Insights (optional; watch cost)

### 5.2 Connection strategy

- Use `DATABASE_URL` via Secrets Manager.
- Use SSL mode if required.

Example format:

```text
postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
```

---

## 6) Storage (S3) for documents (ERP)

Create an S3 bucket:

- `yellowpower-erp-documents-prod` (example)

Settings:

- Block public access: ON
- Versioning: ON (recommended)
- Default encryption: SSE-S3 (or SSE-KMS if required)

Access pattern:

- Backend generates **pre-signed URLs** for upload/download
- Store object keys in DB (not public URLs)

Optional:

- Add CloudFront in front of S3 for downloads (only if you need edge caching). Usually not required.

---

## 7) Container registry (ECR)

Create two ECR repos:

- `mining-erp-backend`
- `mining-erp-frontend` (only if SSR frontend on ECS)

Build and push images from CI.

---

## 8) ERP Backend deployment (NestJS) on ECS Fargate

### 8.1 Build

- Build Docker image for `dev/backend`
- Expose container port (commonly 3000)

### 8.2 ECS service

- ECS Cluster (Fargate)
- Service desired count: `1` initially
- Autoscaling:
  - CPU 60% target (optional)
  - Min 1 / Max 2 for cost control

Recommended for an actively used ERP:

- Start with **Min 1 / Max 2**, then move to **Min 2 / Max 4** once you want higher availability (and once migrations are handled safely).

### 8.3 Load Balancer (ALB)

- ALB listener: 443
- Target group: backend container port

### 8.4 Health checks

- Implement a health endpoint if not present:
  - `GET /api/health`
- Configure ALB health check path accordingly.

### 8.5 Migrations

Recommended strategy:

- Run Prisma migrations as a **one-off ECS task** during deployment.
- Avoid running migrations on every container startup unless you control concurrency.

If you must keep current behavior, ensure:

- Only one task is active during migration
- Or migrations run before scaling

---

## 9) ERP Frontend deployment (Next.js)

### Option A: Static frontend (S3 + CloudFront)

Use this when SSR is not required.

1. Build in CI:
   - `next build`
   - export if applicable (`next export`) or produce static output depending on config
2. Upload build output to S3 bucket (e.g. `yellowpower-erp-frontend-prod`)
3. CloudFront distribution with origin S3
4. Configure caching:
   - HTML: low TTL
   - static assets: long TTL

### Option B: SSR frontend (ECS + ALB + CloudFront optional)

1. Containerize Next.js app
2. ECS service with desired count 1
3. ALB listener 443 → target group
4. (Optional) CloudFront in front of ALB

---

## 10) Company website deployment (Next.js)

### Option A: Static (recommended for cost)

1. S3 bucket: `yellowpower-website-prod`
2. CloudFront distribution
3. Upload static assets via CI

Content update workflow options:

- **Git-based updates**: update content in repo → CI rebuild → upload to S3 → CloudFront invalidation.
- **Headless CMS**: store news/events in a CMS → build pulls content → redeploy. (Keeps site fast and cheap.)

### Option B: SSR on ECS

Same pattern as ERP frontend SSR:

- ECS service + ALB + optional CloudFront

---

## 11) TLS certificates (ACM)

### 11.1 CloudFront certificates (must be us-east-1)

Request a single cert in **us-east-1** covering:

- `yellowpowerinternational.com`
- `www.yellowpowerinternational.com`
- `erp.yellowpowerinternational.com`

Use DNS validation.

### 11.2 ALB certificates (in your chosen region)

Request a cert covering:

- `api.erp.yellowpowerinternational.com`

DNS validation.

---

## 12) DNS (Route 53)

If Route 53 is your DNS host:

- Create hosted zone: `yellowpowerinternational.com`
- Records:
  - `A/AAAA` ALIAS apex → CloudFront (website)
  - `CNAME` or `A` ALIAS `www` → CloudFront
  - `CNAME` or `A` ALIAS `erp` → CloudFront (ERP frontend)
  - `CNAME` or `A` ALIAS `api.erp` → ALB

If DNS is hosted elsewhere (e.g. Cloudflare):

- Create equivalent records pointing to CloudFront/ALB.

### 12.1 Namecheap DNS (your case)

You have two workable approaches. **Recommended is to keep the domain registered at Namecheap but move DNS hosting to Route 53**.

#### Option A (recommended): Namecheap registrar + Route 53 nameservers (DNS hosted in AWS)

Why:

- Route 53 supports **ALIAS** records to CloudFront for the **apex/root domain** (`yellowpowerinternational.com`).
- Many registrars (including Namecheap) do not support ALIAS/ANAME at the apex in a way that works cleanly with CloudFront.

Steps:

1. In AWS Route 53:
   - Create a hosted zone: `yellowpowerinternational.com`.
   - Copy the 4 assigned Route 53 nameservers.
2. In Namecheap:
   - Set **Custom DNS** nameservers to the Route 53 nameservers.
3. Back in Route 53, create records:
   - `A/AAAA` ALIAS for `yellowpowerinternational.com` → CloudFront distribution (website)
   - `CNAME` `www` → CloudFront distribution domain
   - `CNAME` `erp` → CloudFront distribution domain (ERP frontend)
   - `CNAME` `api.erp` → ALB DNS name

#### Option B (fallback): Keep Namecheap DNS and point subdomains to AWS

What works well:

- `www`, `erp`, `api.erp` can be pointed using **CNAME** records.

What is tricky:

- The apex/root `yellowpowerinternational.com` usually cannot be a CNAME.

Fallback pattern:

- Host the website on `www.yellowpowerinternational.com` (CNAME → CloudFront)
- Set `yellowpowerinternational.com` to redirect to `www` (URL redirect at registrar/DNS provider)

This is functional, but **Route 53 nameservers** is the cleaner long-term approach.

---

## 13) ERP environment variables (production)

This section lists the **recommended environment variables** for the ERP.

### 13.1 Backend (NestJS) env vars

**Required** (typical):

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...` (strong random)
- `JWT_EXPIRES_IN=1d` (or your preferred value)

**CORS / Frontend allowlist** (matches your `main.ts` CORS allowlist):

- `FRONTEND_URLS=https://erp.yellowpowerinternational.com,https://yellowpowerinternational.com`
  - Add other frontends if needed (staging, admin domains)

Mobile note:

- Mobile apps do not use browser CORS, but they still must call the correct API domain.
- Do not add mobile app bundle identifiers here; instead secure the API using auth + rate limiting.

**Uploads / Storage** (recommended S3):

- `STORAGE_DRIVER=s3`
- `AWS_REGION=...`
- `S3_BUCKET_NAME=yellowpower-erp-documents-prod`

Credentials:

- Recommended: use **task role IAM permissions** (no long-lived keys)
- If you must use keys (not recommended):
  - `AWS_ACCESS_KEY_ID=...`
  - `AWS_SECRET_ACCESS_KEY=...`

**App URLs**:

- `APP_BASE_URL=https://erp.yellowpowerinternational.com`
- `API_BASE_URL=https://api.erp.yellowpowerinternational.com`

**Optional (recommended)**:

- `LOG_LEVEL=info`
- `MAX_UPLOAD_MB=50`

### 13.2 Frontend (Next.js) env vars

This repo uses a backend proxy rewrite (`/api` → `${BACKEND_URL}/api`).

Set:

- `NEXT_PUBLIC_APP_URL=https://erp.yellowpowerinternational.com`
- `BACKEND_URL=https://api.erp.yellowpowerinternational.com`

If the frontend also has a direct API base env:

- `NEXT_PUBLIC_API_BASE_URL=/api`

(Prefer `/api` so the browser always hits the same origin and you avoid CORS complexities.)

---

## 14) IAM permissions (least privilege)

### 14.1 ECS task role for backend

Allow:

- Read secrets from Secrets Manager (specific secret ARNs)
- Read/write to S3 bucket for documents
- CloudWatch logs
- (If using SQS) send/receive/delete from queue

Avoid:

- AdministratorAccess
- Wildcard `s3:*` on `*`

---

## 15) CI/CD (recommended)

### 15.1 Build + deploy pipeline

A minimal pipeline:

- On push to `main`:
  - Build backend image → push to ECR → update ECS service
  - Run migrations as one-off ECS task (or controlled step)
  - Build frontend:
    - If static: sync to S3 + invalidate CloudFront
    - If SSR: build image → push to ECR → update ECS service

### 15.2 CloudFront invalidations

- Invalidate `/*` only when required (cost)
- Prefer cache-busting asset hashes

---

## 16) Monitoring + cost controls (credits-safe)

### 16.1 AWS Budgets

Create budgets:

- Total monthly spend budget (e.g. $200)
- Service budgets:
  - RDS
  - CloudFront data transfer
  - ECS/Fargate

Add alerts:

- 50%, 80%, 100% thresholds

### 16.2 CloudWatch alarms

- ALB 5xx spikes
- ECS task restarts
- RDS CPU / storage thresholds

Recommended additions for an ERP:

- ALB target health count < desired
- RDS connections too high

### 16.3 Logs

- Backend logs to CloudWatch
- Add request correlation ids if needed (later)

---

## 17) Go-live checklist

- DNS records created and validated
- ACM certificates issued
- Website CloudFront distribution deployed
- ERP frontend deployed (CloudFront)
- Backend ECS service healthy behind ALB
- RDS reachable from backend only
- Prisma migrations executed successfully
- S3 bucket permissions locked down
- Secrets stored in Secrets Manager and not hard-coded
- Backups enabled and tested
- Budgets + alarms configured

---

## 18) Recommended “first deployment” minimal configuration

To get live quickly and safely:

- Website: **S3 + CloudFront**
- ERP frontend: **CloudFront + S3** (if feasible)
- ERP backend: **ECS Fargate + ALB**
- DB: **RDS Postgres**
- Documents: **S3**
- Secrets: **Secrets Manager**
- Cost controls: **Budgets + alarms**

Recommended defaults for your case:

- **Region**: `eu-west-1` for ECS/RDS
- **DNS**: keep Namecheap registration, move DNS hosting to **Route 53 nameservers**
- **API**: dedicate `api.erp.yellowpowerinternational.com` for backend
- **Mobile**: mobile apps integrate with API domain; keep auth consistent with web

---

## 19) Step-by-step deployment runbook (AWS Console)

This section is written as a practical runbook you can follow.

### 19.1 Create the hosted zone (Route 53) and connect Namecheap

1. In AWS Console → Route 53 → Hosted zones → Create hosted zone
   - Domain: `yellowpowerinternational.com`
   - Type: Public hosted zone
2. Copy the assigned Route 53 nameservers (4).
3. In Namecheap → Domain List → Manage → Nameservers
   - Select **Custom DNS**
   - Paste the 4 Route 53 nameservers
4. Wait for DNS propagation (commonly 5–60 minutes, sometimes longer).

### 19.2 Request TLS certificates (ACM)

CloudFront requires ACM certs from **us-east-1**.

1. Switch region to **us-east-1** → ACM → Request certificate
   - Add domains:
     - `yellowpowerinternational.com`
     - `www.yellowpowerinternational.com`
     - `erp.yellowpowerinternational.com`
   - Validation: DNS
2. ACM will show DNS validation records.
3. Create these validation records in Route 53 (ACM often offers an “Create records in Route 53” button).
4. Wait until the cert is **Issued**.

For the backend ALB cert (regional):

1. Switch region to **eu-west-1** → ACM → Request certificate
   - Domain: `api.erp.yellowpowerinternational.com`
   - Validation: DNS
2. Create validation records in Route 53.
3. Wait until **Issued**.

### 19.3 Create S3 buckets (static sites + documents)

Create 3 buckets (names are examples; use globally-unique names):

- `yellowpower-website-prod`
- `yellowpower-erp-frontend-prod`
- `yellowpower-erp-documents-prod`

For each bucket:

1. S3 → Create bucket
2. Region: `eu-west-1` (or your preference; CloudFront will front static buckets anyway)
3. Settings:
   - **Block all public access: ON**
   - Bucket versioning:
     - Website + ERP frontend: optional
     - Documents: recommended **ON**
   - Default encryption: **ON**

Important:

- Do **not** use S3 “static website hosting” when using CloudFront. Prefer private buckets + CloudFront Origin Access Control (OAC).

### 19.4 Create CloudFront distributions (website + ERP frontend)

Create one CloudFront distribution for the website:

1. CloudFront → Create distribution
2. Origin:
   - Origin domain: S3 bucket `yellowpower-website-prod`
   - Origin access: choose **Origin Access Control (OAC)**
   - Create a new OAC
3. Default behavior:
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD
   - Cache policy: CachingOptimized (fine for static)
4. Alternate domain names (CNAMEs):
   - `yellowpowerinternational.com`
   - `www.yellowpowerinternational.com`
5. Custom SSL certificate: select the **us-east-1** ACM cert that covers these names.
6. Create distribution.
7. CloudFront will show a bucket policy update prompt for OAC. Apply the suggested bucket policy.

Create another distribution for ERP frontend:

1. CloudFront → Create distribution
2. Origin:
   - S3 bucket `yellowpower-erp-frontend-prod`
   - OAC enabled
3. Default behavior:
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed methods: GET, HEAD
4. Alternate domain names:
   - `erp.yellowpowerinternational.com`
5. Custom SSL certificate: use the same **us-east-1** ACM cert (must include `erp.yellowpowerinternational.com`).
6. Create distribution and apply the OAC bucket policy.

### 19.5 Route 53 records (CloudFront + API)

In Route 53 → Hosted zone `yellowpowerinternational.com`:

Website:

- Create **A** record for apex:
  - Name: (blank)
  - Alias: Yes
  - Alias target: CloudFront distribution (website)
- Create **CNAME** (or A alias if you prefer) for `www`:
  - `www` → CloudFront distribution domain (website)

ERP frontend:

- Create **CNAME** for `erp`:
  - `erp` → CloudFront distribution domain (ERP frontend)

API (created later after ALB exists):

- Create **CNAME** for `api.erp`:
  - `api.erp` → ALB DNS name

### 19.6 Create VPC (minimal but safe)

Use the VPC wizard:

1. VPC → Create VPC
   - Create VPC and more
   - 2 AZs
   - Public subnets: 2
   - Private subnets: 2
2. NAT Gateways:
   - For cost control: start with **None**
3. VPC endpoints (optional now, good later): S3, ECR, CloudWatch Logs, Secrets Manager

### 19.7 Create RDS PostgreSQL

1. RDS → Create database
2. Engine: PostgreSQL
3. Template: Production (or Dev/Test if starting small)
4. Credentials:
   - Store the master password in Secrets Manager (recommended)
5. Connectivity:
   - VPC: your new VPC
   - Subnet group: private subnets
   - Public access: **No**
6. Security group:
   - Create an RDS SG that allows inbound 5432 from the ECS backend SG (created later)
7. Backups:
   - Enable automated backups

After creation:

- Note the RDS endpoint hostname.
- Confirm you can build a correct `DATABASE_URL`.

### 19.8 Create ECR repositories

1. ECR → Create repository
   - `mining-erp-backend`

(Optional if you later deploy SSR frontends on ECS)

- `mining-erp-frontend`
- `yellowpower-website`

### 19.9 Store secrets in AWS Secrets Manager

Create secrets for:

- `erp/prod/database_url`
- `erp/prod/jwt_secret`
- Any third-party keys later (email provider, OCR provider, etc.)

Recommendation:

- Store *values* in Secrets Manager.
- Reference them in ECS task definition as environment variables.

### 19.10 Create ECS cluster + task definition (backend)

1. ECS → Clusters → Create cluster → Networking only (Fargate)
2. Create a task definition:
   - Launch type: Fargate
   - CPU/Memory: start small (e.g. 0.5 vCPU / 1GB)
   - Container:
     - Image: ECR image for backend
     - Port mappings: container port 3000 (or whatever backend uses)
   - Environment variables:
     - Non-sensitive as plain env
     - Sensitive from Secrets Manager
   - Logging: awslogs to CloudWatch

### 19.11 Create ALB + ECS service

1. EC2 → Load Balancers → Create ALB
   - Internet-facing
   - Subnets: public subnets in 2 AZs
   - Security group: allow inbound 443 from the internet
2. Listener:
   - HTTPS 443
   - Attach ACM cert from **eu-west-1** for `api.erp.yellowpowerinternational.com`
3. Target group:
   - Type: IP
   - Port: 3000
   - Health check path: `/api/health` (implement if missing)
4. ECS → Create service
   - Launch type: Fargate
   - Attach the ALB target group
   - Desired tasks: 1

### 19.12 Create Route 53 record for API

After ALB is created:

- Route 53: create `CNAME` record
  - Name: `api.erp`
  - Value: ALB DNS name

### 19.13 Deploy website + ERP frontend artifacts to S3

Website:

- Build your Next.js website to static output
- Upload the output to `yellowpower-website-prod`
- CloudFront invalidation: invalidate `/*` after deploy

ERP frontend:

- Build frontend
- Upload the output to `yellowpower-erp-frontend-prod`
- Invalidate `/*`

### 19.14 Configure budgets + alarms

1. AWS Budgets:
   - Monthly cost budget
   - Alerts at 50/80/100%
2. CloudWatch alarms:
   - ALB 5xx
   - ECS task count < desired
   - RDS CPU and free storage

---

## 20) Mobile apps integration (ERP)

### 20.1 API base URL

- Mobile apps should call:
  - `https://api.erp.yellowpowerinternational.com/api`

### 20.2 Authentication

If your ERP uses JWT today (web login returns a token):

- Mobile app uses the same login endpoint and stores the JWT securely.

Recommended improvements when you introduce mobile:

- Add **refresh tokens** (short-lived access token + long-lived refresh token)
- Add device/session management (logout device)

### 20.3 API hardening for mobile + web

- Add rate limiting (per IP / per user)
- Consider AWS WAF on the ALB (or CloudFront if you front the API)
- Add request logging fields (userId, route, latency)

---

## 21) Open questions to finalize

Based on your answers, these are the only remaining decisions needed to make this 100% executable:

1. Website deployment model:
   - static build with Git updates only, or
   - static build + headless CMS workflow?
2. ERP frontend:
   - confirm it can be static behind CloudFront (preferred), or does it require SSR?
3. Expected usage:
   - rough number of staff users and typical document sizes (to size RDS/ECS and S3 lifecycle)
4. Mobile app auth:
   - keep current JWT only, or add refresh tokens + device sessions?

---

## 22) ERP environment variables: copy/paste templates

### 21.1 Backend (ECS task) env template

Set these in the ECS task definition:

- `NODE_ENV=production`
- `PORT=3000`

Secrets Manager (recommended as secrets, not plain env):

- `DATABASE_URL=...`
- `JWT_SECRET=...`

Plain env:

- `JWT_EXPIRES_IN=1d`
- `FRONTEND_URLS=https://erp.yellowpowerinternational.com,https://yellowpowerinternational.com`
- `APP_BASE_URL=https://erp.yellowpowerinternational.com`
- `API_BASE_URL=https://api.erp.yellowpowerinternational.com`
- `STORAGE_DRIVER=s3`
- `AWS_REGION=eu-west-1`
- `S3_BUCKET_NAME=yellowpower-erp-documents-prod`
- `LOG_LEVEL=info`
- `MAX_UPLOAD_MB=50`

### 21.2 Frontend (build-time) env template

Set these in your frontend build pipeline/environment:

- `NEXT_PUBLIC_APP_URL=https://erp.yellowpowerinternational.com`
- `BACKEND_URL=https://api.erp.yellowpowerinternational.com`
- `NEXT_PUBLIC_API_BASE_URL=/api`

---

## 23) Notes for mobile apps

- Use `API_BASE_URL=https://api.erp.yellowpowerinternational.com/api` in mobile.
- Store access tokens securely (Keychain/Keystore).
- Consider adding refresh tokens when you start mobile production rollout.

---

## 24) Completion criteria

- `https://yellowpowerinternational.com` loads via CloudFront with valid TLS
- `https://erp.yellowpowerinternational.com` loads via CloudFront with valid TLS
- `https://api.erp.yellowpowerinternational.com/api/health` returns 200
- ERP login works end-to-end
- Document upload stores to S3 (not local disk)
- Budgets + alarms are enabled
