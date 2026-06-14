#!/usr/bin/env pwsh
# sync-claude-to-hermes.ps1 — Script de synchro mémoire Claude Desktop → VPS
# Usage : powershell -File "C:\Users\FX\scripts\sync-claude-to-hermes.ps1"
# 
# HEURES DE FONCTIONNEMENT RECOMMANDÉES : 8h-22h (éviter de réveiller le VPS la nuit)

$ErrorActionPreference = "SilentlyContinue"

$PROJECT = "C:\Users\FX\Documents\GitHub\fx.jam"
$MEMORY = "$PROJECT\MEMORY.md"
$LOG = "$PROJECT\CLAUDE_LOG.md"
$RECENT = (Get-Date).AddHours(-4)
$HOST = "fx-vps"  # alias SSH dans ~/.ssh/config

Write-Host "=== Sync Claude → Hermes ===" -ForegroundColor Cyan

# Git pull pour récupérer les changements Hermes
Set-Location $PROJECT
git pull --rebase origin main 2>&1 | Out-Null

# Détecter si qqch a changé côté Claude
$hasNew = $false
$changedFiles = @()

foreach ($f in @($LOG, $MEMORY)) {
    if (Test-Path $f) {
        $w = (Get-Item $f).LastWriteTime
        if ($w -gt $RECENT) { $hasNew = $true; $changedFiles += "$f [$w]" }
    }
}

if (-not $hasNew) {
    # Vérifier si le git a des unstaged changes (Claude Desktop a modifié les fichiers)
    $status = git status --porcelain 2>&1
    if ($status -match "CLAUDE_LOG|MEMORY") { $hasNew = $true }
}

if ($hasNew) {
    Write-Host "→ Modifications détectées" -ForegroundColor Green
    git add -A 2>&1 | Out-Null
    git -c user.name="Hamcat" -c user.email="fx-jam@users.noreply.github.com" commit -m "sync: Claude $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>&1 | Out-Null
    git push origin main 2>&1 | Out-Null
    Write-Host "✓ Pushé sur GitHub — Hermes le verra dans < 30 min" -ForegroundColor Green
} else {
    Write-Host "→ Rien de nouveau" -ForegroundColor Gray
}

Write-Host "=== Fin sync ===" -ForegroundColor Cyan