# PowerShell Script to Setup Local Development Environment
# This script updates the .env file to point to localhost backend

$envPath = "c:\Users\nk756\Desktop\Doctor-Connect\fronted\.env"

Write-Host "Setting up local development environment..." -ForegroundColor Green

# Create or update .env file
$envContent = @"
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
"@

Set-Content -Path $envPath -Value $envContent

Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend:  cd backend && npm start" -ForegroundColor Cyan
Write-Host "2. Start frontend: cd fronted && npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
