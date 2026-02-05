# ADO Sync Script - Fixed
$ErrorActionPreference = "Stop"
$sourceRoot = Get-Location
$tempDir = "$env:TEMP\ado-sync-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$branchName = "sync/changes-jan28-$(Get-Date -Format 'MMdd')"

Write-Host "Creating temp directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Backend Sync
Write-Host "`nBackend Sync Starting..." -ForegroundColor Yellow
$backendDir = "$tempDir\backend"
git clone https://dev.azure.com/mfsastra/MFS%20Astra/_git/mfs-internal-calculator-back-end $backendDir
Set-Location $backendDir
git checkout dev
git checkout -b $branchName

# Create directories if needed
New-Item -ItemType Directory -Path "services" -Force | Out-Null

Copy-Item "$sourceRoot\backend\config\validateEnv.js" "config\validateEnv.js" -Force
Copy-Item "$sourceRoot\backend\routes\canvas.js" "routes\canvas.js" -Force
Copy-Item "$sourceRoot\backend\routes\salesforce.js" "routes\salesforce.js" -Force
Copy-Item "$sourceRoot\backend\services\salesforceService.js" "services\salesforceService.js" -Force
Copy-Item "$sourceRoot\backend\server.js" "server.js" -Force
Copy-Item "$sourceRoot\backend\package.json" "package.json" -Force
Copy-Item "$sourceRoot\backend\package-lock.json" "package-lock.json" -Force

Write-Host "Copied 7 backend files" -ForegroundColor Green

git add .
git commit -m "sync: Backend changes from Jan 28 - Salesforce integration and package updates"
git push origin $branchName

Write-Host "Backend pushed successfully!" -ForegroundColor Green

# Frontend Sync  
Write-Host "`nFrontend Sync Starting..." -ForegroundColor Yellow
Set-Location $tempDir
$frontendDir = "$tempDir\frontend"
git clone https://dev.azure.com/mfsastra/MFS%20Astra/_git/mfs-internal-calculator-front-end $frontendDir
Set-Location $frontendDir
git checkout main
git checkout -b $branchName

# Copy all source directories with robocopy
robocopy "$sourceRoot\frontend\src" "src" /S /XF *.test.* /NFL /NDL /NJH /NJS /NC /NS /NP

# Copy root files
Copy-Item "$sourceRoot\frontend\index.html" "index.html" -Force
Copy-Item "$sourceRoot\frontend\package.json" "package.json" -Force
Copy-Item "$sourceRoot\frontend\package-lock.json" "package-lock.json" -Force

Write-Host "Frontend files copied" -ForegroundColor Green

git add .
git commit -m "sync: Frontend changes from Jan 28 - Salesforce, multi-property loan, PDF updates, APRC fixes"
git push origin $branchName

Write-Host "`nSync Complete!" -ForegroundColor Green
Write-Host "Branch created: $branchName" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Go to Azure DevOps" -ForegroundColor White
Write-Host "2. Create Pull Request for backend: $branchName to dev" -ForegroundColor White
Write-Host "3. Create Pull Request for frontend: $branchName to main" -ForegroundColor White

Set-Location $sourceRoot
