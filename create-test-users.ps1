# Create Multiple Test Users for Mining ERP
# Run this script in PowerShell

Write-Host "Creating test users for Mining ERP..." -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

$users = @(
    @{
        email = "ceo@mining.com"
        password = "CEO@123"
        firstName = "John"
        lastName = "CEO"
        role = "CEO"
        department = "Executive"
        position = "Chief Executive Officer"
    },
    @{
        email = "cfo@mining.com"
        password = "CFO@123"
        firstName = "Jane"
        lastName = "Finance"
        role = "CFO"
        department = "Finance"
        position = "Chief Financial Officer"
    },
    @{
        email = "accountant@mining.com"
        password = "Acc@123"
        firstName = "Bob"
        lastName = "Smith"
        role = "ACCOUNTANT"
        department = "Finance"
        position = "Senior Accountant"
    },
    @{
        email = "operations@mining.com"
        password = "Ops@123"
        firstName = "Alice"
        lastName = "Johnson"
        role = "OPERATIONS_MANAGER"
        department = "Operations"
        position = "Operations Manager"
    },
    @{
        email = "warehouse@mining.com"
        password = "Warehouse@123"
        firstName = "Tom"
        lastName = "Wilson"
        role = "WAREHOUSE_MANAGER"
        department = "Inventory"
        position = "Warehouse Manager"
    },
    @{
        email = "employee@mining.com"
        password = "Emp@123"
        firstName = "Sarah"
        lastName = "Brown"
        role = "EMPLOYEE"
        department = "Operations"
        position = "Field Worker"
    }
)

$successCount = 0
$failCount = 0

foreach ($user in $users) {
    Write-Host "Creating user: $($user.firstName) $($user.lastName) ($($user.role))..." -ForegroundColor Yellow
    
    $body = $user | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://mining-erp-backend.onrender.com/api/auth/register" -Method Post -Body $body -ContentType "application/json"
        
        Write-Host "  ✓ Success! Email: $($user.email)" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Created: $successCount users" -ForegroundColor Green
Write-Host "  Failed: $failCount users" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "`nYou can now login at: https://erp-swart-psi.vercel.app/login" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

Write-Host "Test user credentials:" -ForegroundColor Yellow
Write-Host "  CEO: ceo@mining.com / CEO@123" -ForegroundColor Gray
Write-Host "  CFO: cfo@mining.com / CFO@123" -ForegroundColor Gray
Write-Host "  Accountant: accountant@mining.com / Acc@123" -ForegroundColor Gray
Write-Host "  Operations: operations@mining.com / Ops@123" -ForegroundColor Gray
Write-Host "  Warehouse: warehouse@mining.com / Warehouse@123" -ForegroundColor Gray
Write-Host "  Employee: employee@mining.com / Emp@123" -ForegroundColor Gray

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
