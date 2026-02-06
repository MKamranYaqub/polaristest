# Azure DevOps Deployment Guide

## Quick Reference

### Git Remotes Configuration
```bash
# Frontend repo
frontend-azure: https://dev.azure.com/mfsastra/MFS%20Astra/_git/mfs-internal-calculator-front-end

# Backend repo  
backend-azure: https://dev.azure.com/mfsastra/MFS%20Astra/_git/mfs-internal-calculator-back-end

# Monorepo (full project)
azure: https://dev.azure.com/mfsastra/MFS%20Astra/_git/MFS%20Polaris
```

---

## Deployment Commands

### 1️⃣ Push Frontend to Azure DevOps

```powershell
# Navigate to project root
cd "c:\Users\MFSD010.MFSUK-D010\Desktop\SF calc\polaristest"

# Commit your changes first (if not already committed)
git add frontend/
git commit -m "Your commit message"

# Split frontend folder and push to dev branch
$frontendCommit = git subtree split --prefix=frontend
git push frontend-azure "${frontendCommit}:dev"
```

**What this does:**
- Extracts only the `frontend/` folder history
- Pushes to `mfs-internal-calculator-front-end` repo, `dev` branch
- Does NOT include docs, backend, or migration files

---

### 2️⃣ Push Backend to Azure DevOps

```powershell
# Navigate to project root
cd "c:\Users\MFSD010.MFSUK-D010\Desktop\SF calc\polaristest"

# Commit your changes first (if not already committed)
git add backend/
git commit -m "Your commit message"

# Split backend folder and push to dev branch
$backendCommit = git subtree split --prefix=backend
git push backend-azure "${backendCommit}:dev"
```

**What this does:**
- Extracts only the `backend/` folder history
- Pushes to `mfs-internal-calculator-back-end` repo, `dev` branch
- Does NOT include docs, frontend, or migration files

---

### 3️⃣ Push Full Monorepo (Rarely Needed)

```powershell
cd "c:\Users\MFSD010.MFSUK-D010\Desktop\SF calc\polaristest"
git push azure develop:dev
```

**What this does:**
- Pushes entire repository (all folders)
- Pushes to `MFS Polaris` repo

---

## Standard Workflow

### For Frontend Changes:

```powershell
# 1. Make your changes in frontend/

# 2. Test locally
cd frontend
npm run build  # Verify build works

# 3. Commit and push to GitHub
cd ..
git add frontend/
git commit -m "Fix: Your change description"
git push origin develop

# 4. Push to Azure DevOps
$frontendCommit = git subtree split --prefix=frontend
git push frontend-azure "${frontendCommit}:dev"
```

### For Backend Changes:

```powershell
# 1. Make your changes in backend/

# 2. Test locally
cd backend
node --check server.js  # Verify syntax

# 3. Commit and push to GitHub
cd ..
git add backend/
git commit -m "Fix: Your change description"
git push origin develop

# 4. Push to Azure DevOps
$backendCommit = git subtree split --prefix=backend
git push backend-azure "${backendCommit}:dev"
```

---

## Pipeline Triggers

### Frontend Pipeline (`frontend/azure-pipelines.yml`)
- **Trigger**: Commits to `dev` branch in `mfs-internal-calculator-front-end`
- **Build**: Node.js 20.x, npm install & build
- **Deploy**: Azure Web App `wa-mfs-calculators-front-end` (dev slot)
- **Environment Variables Required**:
  - `VITE_API_URL`: Backend API URL

### Backend Pipeline (`backend/azure-pipelines.yml`)
- **Trigger**: Commits to `dev` branch in `mfs-internal-calculator-back-end`
- **Build**: Node.js 20.x, npm install
- **Deploy**: Azure Web App `wa-mfs-calculators-back-end` (dev slot)
- **Startup Command**: `node server.js`

---

## Important Notes

### ✅ DO:
- **Always commit locally first** before pushing to Azure DevOps
- Use descriptive commit messages
- Test builds locally before pushing
- Push without `--force` when possible

### ❌ DON'T:
- **Never use `--force`** unless absolutely necessary (destroys history)
- Don't push docs, migrations, or unrelated files (subtree handles this)
- Don't push to Azure without testing locally first

---

## Troubleshooting

### "Push rejected" or conflicts
```powershell
# Only if absolutely necessary, force push:
git push frontend-azure "${frontendCommit}:dev" --force
```

### Check what will be pushed
```powershell
# Preview subtree split (doesn't push)
$frontendCommit = git subtree split --prefix=frontend
git log $frontendCommit -n 5
```

### Verify remote URLs
```powershell
git remote -v
```

### Re-add remotes if missing
```powershell
git remote add frontend-azure https://dev.azure.com/mfsastra/MFS%20Astra/_git/mfs-internal-calculator-front-end
git remote add backend-azure https://dev.azure.com/mfsastra/MFS%20Astra/_git/mfs-internal-calculator-back-end
```

---

## Azure Web Apps

### Frontend
- **Name**: `wa-mfs-calculators-front-end`
- **Resource Group**: `rg-mfs-global-calculators`
- **Slot**: `dev`
- **URL**: (Check Azure Portal)

### Backend
- **Name**: `wa-mfs-calculators-back-end`
- **Resource Group**: `rg-mfs-global-calculators`
- **Slot**: `dev`
- **URL**: (Check Azure Portal)

---

## Quick Copy-Paste Commands

### Frontend Only
```powershell
cd "c:\Users\MFSD010.MFSUK-D010\Desktop\SF calc\polaristest" ; git add frontend/ ; git commit -m "Update frontend" ; $frontendCommit = git subtree split --prefix=frontend ; git push frontend-azure "${frontendCommit}:dev"
```

### Backend Only
```powershell
cd "c:\Users\MFSD010.MFSUK-D010\Desktop\SF calc\polaristest" ; git add backend/ ; git commit -m "Update backend" ; $backendCommit = git subtree split --prefix=backend ; git push backend-azure "${backendCommit}:dev"
```

### Both (Frontend + Backend)
```powershell
cd "c:\Users\MFSD010.MFSUK-D010\Desktop\SF calc\polaristest" ; git add . ; git commit -m "Update frontend and backend" ; $frontendCommit = git subtree split --prefix=frontend ; git push frontend-azure "${frontendCommit}:dev" ; $backendCommit = git subtree split --prefix=backend ; git push backend-azure "${backendCommit}:dev"
```

---

## Semantic Versioning

### Version Format: `MAJOR.MINOR.PATCH`

**Example**: `v1.2.3`
- **MAJOR** (1): Breaking changes - incompatible API changes
- **MINOR** (2): New features - backwards-compatible functionality
- **PATCH** (3): Bug fixes - backwards-compatible bug fixes

### When to Increment

#### MAJOR Version (v2.0.0)
- Breaking API changes
- Database schema changes requiring migration
- Removed deprecated features
- Major architecture changes

**Examples**:
```
v1.5.2 → v2.0.0: Removed Supabase direct access from frontend
v2.3.1 → v3.0.0: Changed authentication system
```

#### MINOR Version (v1.3.0)
- New features added
- New API endpoints
- New calculator functionality
- New admin features

**Examples**:
```
v1.2.5 → v1.3.0: Added Bridging Calculator
v1.3.4 → v1.4.0: Added Global Settings page
```

#### PATCH Version (v1.2.4)
- Bug fixes
- Performance improvements
- Documentation updates
- Security patches (non-breaking)

**Examples**:
```
v1.2.3 → v1.2.4: Fixed Specialist Residential filter
v1.2.4 → v1.2.5: Fixed context provider hierarchy
```

### Git Tagging Workflow

```powershell
# 1. Commit all changes
git add .
git commit -m "Fix: Description of changes"

# 2. Create a version tag
git tag -a v1.2.4 -m "Patch: Fixed Specialist Residential rates filter"

# 3. Push commits and tags to GitHub
git push origin main
git push origin v1.2.4

# OR push all tags at once
git push origin main --tags
```

### Commit Message Convention

Follow conventional commits for clarity:

```bash
# Feature
git commit -m "feat: Add new Bridging Calculator"

# Bug Fix  
git commit -m "fix: Correct property filter for Specialist Residential"

# Breaking Change
git commit -m "BREAKING: Remove Supabase direct access from frontend"

# Patch/Hotfix
git commit -m "patch: Update Azure pipeline configuration"

# Documentation
git commit -m "docs: Add Azure DevOps deployment guide"

# Refactor
git commit -m "refactor: Restructure context provider hierarchy"
```

### Version Tagging for Deployments

#### Frontend Version
```powershell
# Tag frontend version
git tag -a frontend/v1.2.4 -m "Frontend: Fixed Specialist Residential rates"
git push origin frontend/v1.2.4

# Deploy to Azure DevOps
$frontendCommit = git subtree split --prefix=frontend
git push frontend-azure "${frontendCommit}:dev"
```

#### Backend Version
```powershell
# Tag backend version
git tag -a backend/v1.3.1 -m "Backend: Added new rates endpoint"
git push origin backend/v1.3.1

# Deploy to Azure DevOps
$backendCommit = git subtree split --prefix=backend
git push backend-azure "${backendCommit}:dev"
```

### View Version History

```powershell
# List all tags
git tag -l

# List tags with messages
git tag -l -n

# View specific tag details
git show v1.2.4

# List frontend tags only
git tag -l "frontend/*"

# List backend tags only
git tag -l "backend/*"
```

### Current Version Tracking

Update `package.json` version in both frontend and backend:

```json
{
  "name": "supabase-frontend",
  "version": "1.2.4",
  ...
}
```

```powershell
# Update frontend version
cd frontend
npm version patch  # Increments 1.2.3 → 1.2.4
npm version minor  # Increments 1.2.4 → 1.3.0
npm version major  # Increments 1.3.0 → 2.0.0

# This automatically updates package.json and creates a git tag
```

### Release Notes Template

```markdown
## [v1.2.4] - 2026-02-06

### Fixed
- Specialist Residential rates now display correctly
- Context provider hierarchy corrected
- Global Settings API response handling

### Changed
- Removed unused Supabase environment variables from frontend pipeline

### Security
- Removed direct Supabase access from frontend
```

---

**Last Updated**: February 6, 2026
