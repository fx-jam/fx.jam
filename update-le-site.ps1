# Script pour mettre à jour le site avec un message par défaut
$message = "Mise à jour du site " + (Get-Date -Format "yyyy-MM-dd HH:mm")
.\update.ps1 $message
