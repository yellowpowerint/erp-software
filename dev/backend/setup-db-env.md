# Database Environment Setup Instructions

## Issue
The local `dev/backend/.env` file has placeholder values for `DATABASE_URL` and `DIRECT_URL`, which blocks Prisma migration generation.

## Solution
You need to temporarily add your Render PostgreSQL database credentials to `dev/backend/.env`.

### Steps:

1. **Get your Render database credentials:**
   - Go to your Render dashboard
   - Navigate to your PostgreSQL database instance
   - Copy the **External Database URL** (this is your `DATABASE_URL`)
   - Copy the **Internal Database URL** (this is your `DIRECT_URL`)

2. **Update `dev/backend/.env`:**
   
   Replace these lines:
   ```env
   DATABASE_URL="__REPLACE_WITH_NEON_DATABASE_URL__"
   DIRECT_URL="__REPLACE_WITH_NEON_DIRECT_URL__"
   ```
   
   With your actual Render credentials:
   ```env
   DATABASE_URL="postgresql://user:password@host.render.com:5432/dbname"
   DIRECT_URL="postgresql://user:password@host-internal.render.com:5432/dbname"
   ```

3. **Verify the format:**
   - Both URLs should start with `postgresql://`
   - Include username, password, host, port (5432), and database name
   - External URL uses the public hostname
   - Internal URL uses the Render internal hostname (if available)

### Alternative: Use Environment Variables

If you don't want to commit database credentials to `.env`, you can:

1. Set them as environment variables in PowerShell:
   ```powershell
   $env:DATABASE_URL="postgresql://user:password@host.render.com:5432/dbname"
   $env:DIRECT_URL="postgresql://user:password@host-internal.render.com:5432/dbname"
   ```

2. Then run the migration command in the same PowerShell session.

### Security Note
- **Never commit real database credentials to Git**
- The `.env` file is already in `.gitignore`
- After generating the migration, you can revert to placeholder values if needed
- Production deployments use Render's environment variables, not the `.env` file

### Next Steps
Once you've updated the `.env` file with valid credentials, I'll generate the Prisma migration for Session 18.1.
