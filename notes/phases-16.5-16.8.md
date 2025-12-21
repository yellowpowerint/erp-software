I’ll (1) extend Phase 16 by adding Sessions **16.5+** to cover the missing Acrobat-replacement gaps (PDF conversion, form fill, audit packages, scan cleanup, compliance/security hardening) without touching Phase 17, and (2) outline an AWS deployment plan using free credits for both `erp.yellowpowerinternational.com` and the main `yellowpowerinternational.com` Next.js website, including recommended services and cost-control notes.



I’m going to (1) update [document-management-phases.md](cci:7://file:///c:/Users/Plange/Downloads/Projects/mining-erp/notes/document-management-phases.md:0:0-0:0) to extend Phase 16 with **Sessions 16.5+** that cover the missing Acrobat/Adobe replacement gaps (universal PDF conversion, form fill/templates, audit packages/bookmarks, scan cleanup + hardened security/compliance), and (2) answer your AWS question with a concrete, cost-aware deployment approach for `erp.yellowpowerinternational.com` (ERP) and `yellowpowerinternational.com` (website), including how AWS free credits can be used safely.
## Phase 16 updated (16.5 → 16.8) ✅
I added **Sessions 16.5–16.8** to [notes/document-management-phases.md](cci:7://file:///c:/Users/Plange/Downloads/Projects/mining-erp/notes/document-management-phases.md:0:0-0:0) to close the Acrobat/Adobe replacement gaps *without touching Phase 17*:

- **16.5** Universal Document → PDF conversion (images + office docs + HTML), version the output, AWS-friendly async jobs
- **16.6** Fillable forms + templates + “Fill & Sign” (drafts, finalize/flatten, signature integration)
- **16.7** Audit package builder (cover page, TOC, section dividers, bookmarks/outlines)
- **16.8** Scan cleanup + hardened PDF security (permanent redaction, PDF-level restrictions where supported, tamper-evident integrity hash + finalize)

Also updated:
- **Phase 16 duration**: 16.1–16.8
- **Endpoint estimate**: ~45
- **Dev time estimate**: 32–48 hours
- **Phase 16 success criteria** to include these deliverables

## Can you use AWS free credits to set this up?
Yes—**AWS credits are commonly used** for exactly this kind of staging/early production setup, as long as you control costs.

Key points:
- **Credits typically cover AWS usage charges** (EC2/ECS, RDS, S3, CloudFront, etc.), but the exact coverage depends on the credit type.
- You must still set up **budgets + alarms** so you don’t burn the credits unexpectedly (especially with RDS, NAT Gateway, and CloudFront egress).

## Recommended AWS architecture (optimized for production)
You have two Next.js apps:
- **ERP** (Next.js + NestJS backend + Postgres + document storage) at:
  - `erp.yellowpowerinternational.com`
- **Company website** (Next.js only) at:
  - `yellowpowerinternational.com` (root domain)

### A) Company website (`yellowpowerinternational.com`) — cheapest & simplest
If it’s mostly static or can be statically exported:
- **S3 (static hosting) + CloudFront**
- **ACM certificate** (free) + CloudFront HTTPS
- DNS via **Route 53** (optional; depends where DNS is hosted)

If it needs SSR:
- Host on **ECS/Fargate** (still fine), or use a Next.js-on-AWS approach you prefer.

### B) ERP (`erp.yellowpowerinternational.com`) — production-ready setup
- **Frontend (ERP Next.js)**:
  - Option 1: ECS/Fargate (SSR-compatible)
  - Option 2: S3+CloudFront if you can make it static (often not ideal for ERPs)
- **Backend (NestJS)**:
  - **ECS/Fargate**
- **Database**:
  - **RDS Postgres**
- **Documents**:
  - **S3 bucket** for all uploads (do not rely on container/local disk)
  - CloudFront for downloads if desired
  - Use **pre-signed S3 URLs** for upload/download (reduces backend load)
- **Async processing for Phase 16.5+ features**:
  - **SQS** queue + **worker service** (ECS) for conversion/OCR/package building
- **Secrets**:
  - **AWS Secrets Manager** for `DATABASE_URL`, `JWT_SECRET`, S3 credentials, etc.
- **Observability**:
  - CloudWatch logs + alarms

## DNS / subdomain routing (high level)
You’ll typically do:
- `yellowpowerinternational.com` → CloudFront distribution for website
- `erp.yellowpowerinternational.com` → CloudFront (or ALB) for ERP frontend and API routing

Certificates:
- Use **ACM in us-east-1** for CloudFront certs.

## Cost traps to avoid (so credits last)
- **NAT Gateway** (can burn money fast). Avoid by:
  - running ECS tasks in public subnets if acceptable for now, or
  - using VPC endpoints where needed.
- **RDS size**: start small.
- **CloudFront egress**: monitor bandwidth.
- **OCR/Conversion**: keep heavy processing async and rate-limited.

## Next: do you want me to produce a concrete AWS plan?
Answer these and I’ll give you an exact step-by-step AWS setup plan tailored to your environment:

1. **Where is DNS hosted currently** for `yellowpowerinternational.com`? (Route 53 / Cloudflare / other)
2. Does the **company website** require SSR, or can it be static-exported?
3. Do you want the ERP frontend to be **SSR** (Next.js server) or **static**?
4. Do you prefer containers (ECS) or simpler EC2 for first AWS rollout?

## Status
- **Done**: Phase 16 extended to include 16.5–16.8 with all missing Acrobat/Adobe replacement items.
- **Next**: confirm your DNS + SSR/static preferences so I can provide the AWS deployment runbook for both domains.