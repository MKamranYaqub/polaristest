# ADO Sync Script - Simplified
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

# Copy frontend files
$files = @(
    "index.html",
    "package.json",
    "package-lock.json",
    "src\App.jsx",
    "src\config\constants.js"
)

foreach ($f in $files) {
    $src = "$sourceRoot\frontend\$f"
    if (Test-Path $src) {
        $dir = Split-Path $f -Parent
        if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item $src $f -Force
        Write-Host "Copied $f" -ForegroundColor Gray
    }
}

# Copy component files
robocopy "$sourceRoot\frontend\src\components" "src\components" /S /NFL /NDL /NJH /NJS /NC /NS /NP
robocopy "$sourceRoot\frontend\src\contexts" "src\contexts" /S /NFL /NDL /NJH /NJS /NC /NS /NP
robocopy "$sourceRoot\frontend\src\features" "src\features" /S /NFL /NDL /NJH /NJS /NC /NS /NP
robocopy "$sourceRoot\frontend\src\hooks" "src\hooks" /S /NFL /NDL /NJH /NJS /NC /NS /NP
robocopy "$sourceRoot\frontend\src\pages" "src\pages" /S /NFL /NDL /NJH /NJS /NC /NS /NP
robocopy "$sourceRoot\frontend\src\utils" "src\utils" /S /NFL /NDL /NJH /NJS /NC /NS /NP

git add .
git commit -m "sync: Frontend changes from Jan 28 - Salesforce, multi-property loan, PDF updates, APRC fixes"
git push origin $branchName

Write-Host "`nSync Complete!" -ForegroundColor Green
Write-Host "Branch created: $branchName" -ForegroundColor Cyan
Write-Host "Next: Create PRs in Azure DevOps" -ForegroundColor Yellow

Set-Location $sourceRoot
