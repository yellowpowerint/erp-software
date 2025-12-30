# Deploy warehouse edit functionality to VPS
$VPS_IP = "216.158.230.187"
$VPS_USER = "root"
$VPS_PASSWORD = "=2pcZVgDY8Ad5PRK6r"

Write-Host "Deploying warehouse edit functionality to production VPS..." -ForegroundColor Green

# Create SSH commands
$commands = @"
cd /var/www/mining-erp && \
git pull origin main && \
echo '=== Building Backend ===' && \
cd /var/www/mining-erp/dev/backend && \
npm ci && \
npm run build && \
npx prisma generate && \
echo '=== Building Frontend ===' && \
cd /var/www/mining-erp/dev/frontend && \
npm ci && \
npm run build && \
echo '=== Restarting Services ===' && \
pm2 restart erp-backend && \
pm2 restart erp-frontend && \
pm2 status
"@

# Use plink (PuTTY) if available, otherwise provide manual instructions
if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "Using plink for SSH connection..."
    echo y | plink -ssh -pw $VPS_PASSWORD ${VPS_USER}@${VPS_IP} $commands
} else {
    Write-Host "`nPlink not found. Please run these commands manually via SSH:" -ForegroundColor Yellow
    Write-Host "`nSSH Connection:" -ForegroundColor Cyan
    Write-Host "ssh root@216.158.230.187" -ForegroundColor White
    Write-Host "Password: =2pcZVgDY8Ad5PRK6r`n" -ForegroundColor White
    
    Write-Host "Then run:" -ForegroundColor Cyan
    Write-Host $commands -ForegroundColor White
}
