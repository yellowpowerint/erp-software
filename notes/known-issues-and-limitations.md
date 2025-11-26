# Mining ERP – Known Issues and Limitations

This document consolidates the key constraints and outstanding considerations for the Mining ERP system as of **Phase 14.3**. It complements the high‑level "Known Limitations" section in `docs/README.md`.

Use this as a reference when planning future phases, sign‑offs, or change requests.

---

## 1. Functional Limitations

These are **by‑design constraints** of the current version:

1. **Email/SMS Notifications Not Wired by Default**  
   - Notification flows are implemented conceptually, but production email/SMS delivery requires configuring external providers (e.g., SMTP, SendGrid, Twilio).  
   - No provider credentials are committed; operations must supply them via environment variables before enabling real notifications.

2. **File Upload Size Limit (~5MB)**  
   - File and attachment handling is intended for light documents and images.  
   - Large file storage, archival, or streaming are out of scope; consider integrating a dedicated object store (S3, etc.) if required.

3. **No Real‑Time Collaborative Editing**  
   - The system is request/response based; there is no WebSocket or real‑time collaboration layer.  
   - Concurrent edits are resolved last‑write‑wins; there is no conflict resolution UI.

4. **No Offline / Disconnected Mode**  
   - The application requires a stable internet connection; it is not designed as an offline‑first PWA.  
   - Field staff must be online to submit logs, incidents, and approvals.

5. **Single‑Tenant Deployment Model**  
   - Current documentation and configuration assume one mining company per deployment (single tenant).  
   - Multi‑tenant isolation, tenant‑aware schemas, and cross‑tenant reporting are not implemented.

6. **AI Features Depend on External LLM APIs**  
   - AI modules (project summaries, procurement advisor, etc.) rely on external providers (OpenAI/Claude) when enabled.  
   - If API keys are missing, invalid, or rate‑limited, AI features may be disabled or return generic fallbacks; this is expected behavior, not a bug.

---

## 2. Technical & Operational Constraints

1. **Performance Assumptions**  
   - Performance targets (e.g., API < 500ms, reports < 2s) are based on typical dataset sizes and may degrade with very large historical datasets.  
   - For high‑volume environments, database indexing, archiving, and caching (e.g., Redis) may need to be extended beyond the baseline.

2. **Reporting Load**  
   - Some heavy analytics and multi‑dimension reports are executed synchronously.  
   - There is no asynchronous report generation or background job queue in production configuration.

3. **CI/CD Pipeline Optional**  
   - Example GitHub Actions workflows are provided in `docs/DEVELOPER_GUIDE.md`, but a full CI/CD pipeline may not be enabled in all deployments.  
   - It is strongly recommended to wire tests and linting into CI before allowing production deploys from feature branches.

4. **Environment‑Specific Scripts**  
   - Helper scripts (e.g., `create-test-user.ps1`) are oriented around a Windows/PowerShell workflow.  
   - Teams running Linux/macOS may need equivalent shell scripts.

---

## 3. Security‑Related Notes

1. **Database Connection String in Notes**  
   - `notes/production-urls.md` includes a Neon PostgreSQL connection string that should be treated as **sensitive**.  
   - For real deployments, rotate these credentials, move secrets to environment variables only, and treat the values in this repository as placeholders.

2. **Secrets Management**  
   - All JWT secrets, API keys, and SMTP/Twilio credentials must be supplied via environment variables in Render/Vercel/Neon.  
   - No additional secret management system (e.g., Vault, SSM) is configured by default.

3. **Rate Limiting & WAF**  
   - Basic input validation is implemented via NestJS + class‑validator, but a full rate‑limiting strategy and web application firewall rules are not included by default.  
   - Production deployments should sit behind platform‑level protections (e.g., Vercel/Render/CDN‑level safeguards) where possible.

---

## 4. Open Items for Future Phases

These are not blocking the current release but are natural candidates for future improvement:

- **Offline & Sync** – Field‑ready offline capture with background synchronization.  
- **Advanced Analytics** – More sophisticated dashboards and drill‑downs over very large datasets.  
- **Mobile Experience** – Dedicated mobile apps or deeper mobile‑first UI optimization.  
- **Multi‑Tenant Architecture** – Support multiple independent companies in a single deployment with strict isolation and billing.  
- **Stronger Observability** – Centralized logging, tracing, and alerting beyond basic platform logs.

Whenever a limitation here is addressed in code or configuration, update this document and the relevant section in `docs/README.md` so stakeholders have a single, current source of truth.
