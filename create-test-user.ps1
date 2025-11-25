# Create Test User for Mining ERP
# Run this script in PowerShell

Write-Host "Creating test user..." -ForegroundColor Cyan

$body = @{
    email = "admin@mining.com"
    password = "Admin@123"
    firstName = "Admin"
    lastName = "User"
    role = "CEO"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://mining-erp-backend.onrender.com/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "`nSuccess! User created:" -ForegroundColor Green
    Write-Host "Email: $($response.user.email)" -ForegroundColor Yellow
    Write-Host "Name: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Yellow
    Write-Host "Role: $($response.user.role)" -ForegroundColor Yellow
    Write-Host "`nAccess Token: $($response.access_token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "`nYou can now login at: https://erp-swart-psi.vercel.app/login" -ForegroundColor Cyan
}
catch {
    Write-Host "`nError creating user:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
