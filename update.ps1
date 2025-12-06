# Script simple pour mettre à jour le dépôt Git
# Utilisation : .\update.ps1 "Votre message de commit"

param (
    [Parameter(Mandatory=$true)]
    [string]$message
)

try {
    # Vérifier si git est disponible
    $gitCheck = git --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur : Git n'est pas installe ou n'est pas dans le PATH" -ForegroundColor Red
        exit 1
    }

    # Ajouter tous les fichiers
    Write-Host "[1/3] Ajout des fichiers..." -ForegroundColor Cyan
    git add .

    # Faire le commit
    Write-Host "[2/3] Creation du commit..." -ForegroundColor Cyan
    git commit -m $message
    
    if ($LASTEXITCODE -eq 0) {
        # Pousser les changements
        Write-Host "[3/3] Envoi des changements..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCES] Mise a jour reussie ! Votre site est en ligne." -ForegroundColor Green
        } else {
            Write-Host "[ERREUR] Echec du push vers le depot distant" -ForegroundColor Red
        }
    } else {
        Write-Host "[INFO] Aucun changement a commiter." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERREUR] $_" -ForegroundColor Red
}
