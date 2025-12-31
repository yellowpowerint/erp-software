# Run Sites migration on VPS
$VPS_IP = "216.158.230.187"
$VPS_USER = "root"
$VPS_PASSWORD = "=2pcZVgDY8Ad5PRK6r"

Write-Host "Running Sites database migration on production VPS..." -ForegroundColor Green

$commands = @"
cd /var/www/mining-erp/dev/backend && \
npx prisma migrate deploy && \
npx prisma generate
"@

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
