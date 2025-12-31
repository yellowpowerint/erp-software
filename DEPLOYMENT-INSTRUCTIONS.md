# Fleet Management CSV Import/Export - Deployment Instructions

## Changes Deployed to GitHub
All frontend changes have been committed and pushed to the main branch:
- ✅ CSV import/export UI added to 6 Fleet Management pages
- ✅ ImportModal updated with fleet module column mappings
- ✅ All changes tested and ready for production

## Manual Deployment to VPS (216.158.230.187)

### Step 1: Connect to VPS
```bash
ssh root@216.158.230.187
```

### Step 2: Pull Latest Code
```bash
cd /var/www/mining-erp
git pull origin main
```

### Step 3: Build Frontend
```bash
cd dev/frontend
npm ci
npm run build
```

### Step 4: Restart Frontend Service
```bash
pm2 restart erp-frontend
```

### Step 5: Verify Deployment
Check that PM2 is running correctly:
```bash
pm2 status
pm2 logs erp-frontend --lines 50
```

## Pages Updated with CSV Import/Export

1. **Fleet Vehicles (Assets)** - `/fleet/assets`
2. **Fuel Management** - `/fleet/fuel`
3. **Maintenance Records** - `/fleet/maintenance`
4. **Fleet Inspections** - `/fleet/inspections`
5. **Operator Assignments** - `/fleet/assignments`
6. **Breakdown Logs** - `/fleet/breakdowns`

## Features Added
- **Export Button** (Green) - Exports filtered data to CSV
- **Import Button** (Blue) - Opens import modal for bulk CSV uploads
- **Template Download** - Available in import modal
- **Column Mapping** - Smart column detection and mapping
- **Duplicate Handling** - Skip, update, or error on duplicates

## Important Notes

### Export Functionality
✅ **Fully Functional** - Export works immediately after deployment

### Import Functionality
⚠️ **Backend Required** - Import requires backend bulk import endpoints to be created:
- `POST /fleet/assets/bulk-import`
- `POST /fleet/fuel/bulk-import`
- `POST /fleet/maintenance/bulk-import`
- `POST /fleet/inspections/bulk-import`
- `POST /fleet/assignments/bulk-import`
- `POST /fleet/breakdowns/bulk-import`

Reference implementation: `dev/backend/src/modules/settings/settings.service.ts` (lines 818-875)

## Troubleshooting

### If frontend doesn't update:
```bash
# Clear Next.js cache
cd /var/www/mining-erp/dev/frontend
rm -rf .next
npm run build
pm2 restart erp-frontend
```

### If PM2 is not running:
```bash
pm2 list
pm2 start ecosystem.config.js
```

### Check logs for errors:
```bash
pm2 logs erp-frontend --lines 100
```

## Testing After Deployment

1. Navigate to any Fleet Management page (e.g., `/fleet/assets`)
2. Verify Export and Import buttons are visible (for authorized users)
3. Click Export - should download CSV file
4. Click Import - should open import modal with template download option
5. Test with sample CSV file

## Git Commits
- `bce16ee` - Add CSV import/export to Fleet Management pages (Vehicles, Fuel, Maintenance)
- `48c3b0b` - Add CSV import/export to Fleet Management pages (Maintenance, Inspections, Assignments, Breakdowns)
- `9f73a94` - Update ImportModal to support fleet module CSV keys
- `c2c7d42` - Add deployment script for Fleet CSV import/export
