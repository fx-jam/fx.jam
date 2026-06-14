# Index memoire - hamcat.live (fx.jam)

Ce fichier est injecte automatiquement en debut de session par le hook SessionStart.
Il reference les sources de memoire disponibles - il ne contient pas le contenu lui-meme.

## Sources de memoire

- ARCHITECTURE.md (racine) : plan directeur, concept platine/jog, 3 etats,
  design system. PRIME sur CLAUDE.md en cas de conflit.
  A lire avant tout chantier non trivial.

- CLAUDE_LOG.md (racine) : journal de bord anti-chronologique.
  Les 30 dernieres lignes sont injectees automatiquement ci-dessous.
  Pour remonter plus loin : lire le fichier directement.

- CLAUDE.md (racine) : brief projet, stack, conventions, rituel de session.

- .claude/access.local.md : acces et secrets (NON versionne, NON injecte).
  A lire uniquement si une tache le requiert.

## Convention fin de session
Ajouter une entree en tete de CLAUDE_LOG.md :
date | ce qui a ete fait | decisions prises | ce qui reste en cours
Pas de secrets dans ce fichier.
