# Run from repo root (parent of aaraazi-frontend), e.g. d:\Aaraazi\Aaraazi
# Usage: from repo root: .\aaraazi-frontend\scripts\git-properties-branch.ps1

$ErrorActionPreference = "Stop"
$repoRoot = if ($PWD.Path -like "*aaraazi-frontend*") { (Get-Item $PWD).Parent.FullName } else { $PWD.Path }
Set-Location $repoRoot

Write-Host "Repo root: $repoRoot" -ForegroundColor Cyan

# Create and switch to aaraazi/properties
git checkout -b aaraazi/properties 2>$null; if ($LASTEXITCODE -ne 0) { git checkout aaraazi/properties }

# Add only properties-related files under aaraazi-frontend
$paths = @(
    "aaraazi-frontend/src/lib/api/properties.ts",
    "aaraazi-frontend/src/lib/api/locations.ts",
    "aaraazi-frontend/src/lib/api/client.ts",
    "aaraazi-frontend/src/components/properties/ImageUpload.tsx",
    "aaraazi-frontend/src/components/properties/PropertiesWorkspace.tsx",
    "aaraazi-frontend/src/components/properties/PropertyWorkspaceCard.tsx",
    "aaraazi-frontend/src/components/PropertyForm.tsx",
    "aaraazi-frontend/src/components/PropertyAddressFields.tsx",
    "aaraazi-frontend/app/dashboard/properties/page.tsx",
    "aaraazi-frontend/app/dashboard/properties/new/page.tsx",
    "aaraazi-frontend/app/dashboard/properties/[id]/page.tsx",
    "aaraazi-frontend/app/dashboard/properties/[id]/edit/page.tsx",
    "aaraazi-frontend/src/types/properties.ts"
)

foreach ($p in $paths) {
    if (Test-Path $p) { git add $p; Write-Host "Added $p" } else { Write-Host "Skip (not found): $p" -ForegroundColor Yellow }
}

git status
Write-Host "`nCommit with: git commit -m 'feat(properties): properties module under aaraazi-frontend'" -ForegroundColor Green
Write-Host "Then push:  git push -u origin aaraazi/properties" -ForegroundColor Green
