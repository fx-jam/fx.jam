# Brief — Maintenance 09/06 : responsive Son + docs + nettoyage

> Branche : `fix/maintenance-09-06` depuis main a jour.
> Tout peut aller sur main directement si build OK — pas de validation visuelle requise
> pour les taches documentaires. Pour le responsive Son : montrer un apercu des changements CSS.
> Supprimer ce brief apres merge.

---

## TACHE 1 — Responsive grille gigs dans src/pages/son.astro

La grille actuelle `grid-template-columns: 100px 1fr 140px 130px 48px` est trop large sur mobile.

Ajouter deux breakpoints dans le CSS de son.astro :

Sur ecran < 640px (tablette/mobile large) :
- Passer a 3 colonnes : `80px 1fr 44px` (date + titre + format)
- Masquer les colonnes venue et genre : ajouter `display: none` sur les cellules .gig-venue et .gig-genre

Sur ecran < 420px (mobile compact) :
- Passer a 2 colonnes : `1fr 44px` (titre + format, masquer aussi la date)
- Ou flex column si la grille est trop contrainte

S'assurer que le header de grille (.gig-header) suit les memes breakpoints
(masquer les memes colonnes pour garder l'alignement).

---

## TACHE 2 — Mettre a jour CLAUDE.md

Deux corrections + une addition :

1. Remplacer "platine vinyle" par "jog" dans la phrase de description du projet
   (l'interface s'appelle desormais "jog", pas "platine vinyle")

2. Dans la liste des facettes, remplacer "Enseignement" par "Cours"

3. Ajouter apres la section "Conventions design" la regle suivante :

## Regle : validation avant merge

TOUJOURS montrer `git diff` + confirmer `npm run build` a Fx AVANT de merger sur main.
Ne jamais merger une branche feature sans validation explicite de Fx ou du chat web (Claude architecte).
Le merge sur main = deploiement automatique sur hamcat.live. Chaque merge compte.

---

## TACHE 3 — Ajouter entree CLAUDE_LOG.md (session 08/06/2026)

Ajouter en HAUT du fichier (apres l en-tete, avant la premiere entree existante) :

---

## Session 08/06/2026 — Jog complet + CMS etendu

### Travaux realises

**Jog CD mobile-first — feat/jog-cd-mobile (merged) :**
- Disque responsive : --disk-size = min(90vw, 85vh, 560px), RING_R dynamique en JS
- Conic-gradient irise : transform rotate sur .disk, --disk-rotation mis a jour a chaque frame
- Indicateur fixe triangulaire (.disk-indicator) hors du disque, colore par facette active
- Drag souris : mousedown/mousemove/mouseup, logique atan2 identique au tactile
- Tap hors .disk-center → setState(0), tap souris identique
- disk-track invisible : background transparent, border none
- "Cours" remplace "Enseignement" dans tout le systeme (key, label, token CSS, cours.astro)
- Scale unifie : scale(0.70 + 0.90 * proximity), font-size graduelle calc(0.44rem + 0.28rem * proximity)
- Pastille .is-active : scale: 1.6 supprime (conflictuait avec scale dans transform)

**Jog Groupe 2 — feat/jog-groupe2 (merged) :**
- Tokens --facet-* : 6 teintes oklch equidistantes (~60 deg spectre, ex: son=oklch(0.65 0.22 25))
- Conic-gradient : spectre oklch pur 10%, color-mix(in oklch) → transitions douces sans secteurs
- Pastilles en arc : --text-rotation = norm + flip demi-inferieure (texte droit en 12h seulement)
- Inertie clavier : velAngle = STEP * 0.35 injecte avant snapToFacet()
- Drag etat 1 : setState(1, activeIdx) si facette change pendant le drag

**CMS complet — feat/cms-complet (merged) :**
- 6 fichiers JSON crees dans src/data/ : site.json + son/regie/cours/outils/contact.json
- config.yml : collection donnees-site avec profil global + 5 facettes editables dans Sveltia

### Architecture mise a jour
- Vision etat 2 gravee : grand cercle plein ecran, fond jog conserve, contenu riche par facette
- Vision etiquettes iridescentes notee (a concevoir)
- Cercle comme forme fondamentale : jog = petit cercle, pages = grands cercles
- Vocabulaire acte : etat 0 (jog libre), etat 1 (apercu facette), etat 2 (overlay plein ecran)
- Principe spectral acte : couleurs facettes = spectre oklch equidistant (preserver si reorg)

### Prochains chantiers
- Conception etat 2 (grand cercle) — session de conception avant tout code
- Etiquettes : rendu iridescent (vision a preciser)
- Facette Son : etoffer avec vrais contenus (bio, SoundCloud, photos)
- Remplir les JSON via hamcat.live/admin

---

## TACHE 4 — Verifier et supprimer le dossier hamcat-live/ a la racine

Ce dossier est signale comme suspect depuis plusieurs sessions.
- S il est vide ou ne contient que des fichiers non utilises par le projet (pas references dans src/) : le supprimer + committer.
- S il contient des fichiers importants : signaler a Fx SANS supprimer.
- Verifier qu il n est pas dans .gitignore (ce serait bizarre).

---

## Test

npm run build sans erreur. Puis merge sur main + supprimer brief + supprimer branche.
