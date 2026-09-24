#!/bin/sh
# Reconstruction quotidienne du site.
#
# Le site est statique : la separation « a venir » / historique est calculee au
# build, par comparaison a la date du jour. Sans reconstruction, une date
# d'hier reste affichee comme a venir jusqu'a la prochaine publication.
#
# Un commit vide suffit a declencher la construction Cloudflare. C'est une ligne
# d'historique par jour, assumee : l'alternative — deviner quand une date bascule
# — serait plus fragile que le cout qu'elle economise.
set -e
cd /home/ubuntu/projects/fx.jam
git pull --rebase --quiet origin main
git commit --allow-empty -q -m "reconstruction quotidienne $(date +%F)"
git push --quiet origin main
