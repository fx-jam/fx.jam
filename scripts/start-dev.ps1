# start-dev.ps1 — Hamcat.live dev launcher
# Double-clic pour démarrer : sync git + lancer le serveur

$env:PATH += ";C:\Program Files\Git\cmd"
$env:PATH += ";C:\Program Files\nodejs"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  hamcat.live — démarrage dev" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Récupérer les dernières modifs depuis GitHub
Write-Host "🔄 Sync git..." -ForegroundColor Yellow
git pull --rebase origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  git pull a rencontré un problème." -ForegroundColor Red
    Write-Host "   Vérifie et résous les conflits avant de continuer." -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuie sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "✅ Code à jour." -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Lancement pnpm dev..." -ForegroundColor Cyan
Write-Host ""

# Lancer le serveur de dev
& "C:\Program Files\nodejs\node_modules\pnpm\dist\pnpm.cjs" dev
