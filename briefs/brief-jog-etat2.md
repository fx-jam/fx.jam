# Brief : Jog état 2 — overlay + refonte typographique

**Branche :** `feat/jog-etat2`
**Modèle :** `/model opus` (chantier complexe — design + animation)

---

## RÈGLE ABSOLUE

Zéro valeur hardcodée. Tailles, nombre de facettes, labels — tout calculé depuis les données (`facets.ts`, JSON). Si le nombre de facettes ou un label change, tout s'adapte automatiquement.

---


## Étape 1 — Typographie : labels en arc textPath

Remplacer le système actuel de labels par des textPath SVG sur des arcs circulaires.

### Calcul dynamique (aucun hardcode)

```typescript
const nFacets    = FACETS.length;
const longestLen = Math.max(...FACETS.map(f => [...f.label].length));
const COND_RATIO = 0.42;  // Barlow Condensed char width ratio
const CAP_RATIO  = 0.72;  // cap-height / font-size
const R_CAP      = 92;    // cible cap-height (SVG units, disque = 100)
const ARC_DEG    = 360 / nFacets - 4;
const ARC_RAD    = ARC_DEG * Math.PI / 180;
// Résoudre : longestLen*COND*fs = r_base*ARC_RAD  ET  r_base + CAP*fs = R_CAP
const fontSize  = R_CAP / (longestLen * COND_RATIO / ARC_RAD + CAP_RATIO);
const rBaseline = R_CAP - CAP_RATIO * fontSize; // identique pour TOUS les labels
```


### Arc textPath

Pour chaque facette : path dans defs à rBaseline, startOffset=50%, text-anchor=middle.
- Demi sup (angle <=90 ou >=270) : sweep=1
- Demi inf (91-269) : arc inversé swap start/end, sweep=0

Formule arcPath :
```typescript
function arcPath(angleDeg: number, r: number): string {
  const toRad = (d: number) => (d - 90) * Math.PI / 180;
  const half = ARC_DEG / 2;
  const s = toRad(angleDeg - half), e = toRad(angleDeg + half);
  const upper = angleDeg <= 90 || angleDeg >= 270;
  const sx=r*Math.cos(s), sy=r*Math.sin(s), ex=r*Math.cos(e), ey=r*Math.sin(e);
  return upper
    ? `M\,\ A\,\ 0 0 1 \,\`
    : `M\,\ A\,\ 0 0 0 \,\`;
}
```


### Style labels

- font-family: Barlow Condensed, Arial Narrow, sans-serif
- font-weight: 800
- fill: var(--facet-{key})
- stroke: var(--bg-app), stroke-width: 3, paint-order: stroke fill
- opacity: 0.65 inactif / 1.0 actif

### Glow radial en cône CD

Le glow s'intensifie du centre vers le bord (reflets CD). Implémenter avec radialGradient mask + filter :
- radialGradient transparent au centre (offset 25%), opaque au bord (offset 100%)
- mask appliqué au groupe contenant le texte actif
- filter feGaussianBlur stdDeviation=4 (large) + 1.5 (serré) + feMerge avec SourceGraphic
- Labels inactifs : glow subtil stdDeviation=1.2

### Fond du disque

Utiliser CSS conic-gradient directement sur .disk avec oklch à luminosité réduite (0.25-0.35).
La rotation est assurée par CSS variable --disk-rotation mis à jour en JS chaque frame (inchangé).


---

## Étape 2 — Logo au centre

Ajouter `logo_url: ''` dans site.json + champ Sveltia.
Dans Turntable.astro : si logo_url → SVG image element x=-22 y=-22 w=44 h=44.
Sinon : texte HAMCAT monospace en var(--text-tertiary).

---

## Étape 3 — Comportement du jog

### État 0 = accueil strict
Au chargement : activeIdx=-1. Première rotation initiée → setState(1, computeActiveFacet()).

### Accélération clavier progressive
- Maintenir la touche → vitesse augmente : step = min(BASE_STEP + frames_held * 0.15, MAX_STEP)
- BASE_STEP=2.5°, MAX_STEP=12°
- Relâcher → inertie proportionnelle (existante)

### Transitions de contour
CSS variable --active-facet-color sur :root, mise à jour à chaque changement de facette.
Radial gradient très subtil (opacity 0.10) autour du disque via ::after sur .disk-container.
Transition 0.7s ease.


---

## Étape 4 — Overlay état 2

Déclencheur : clic .disk-center quand state===1.

### Animation
CSS : clip-path: circle(0%) → circle(150vmax) depuis la position du centre du jog dans le viewport.
Origin : CSS variables --ov-cx --ov-cy calculées au moment du clic (getBoundingClientRect).
Durée : 0.55s cubic-bezier(0.4, 0, 0.2, 1).
Fermeture : Escape, clic ×, clic hors .overlay-inner → animation inverse.

### Contenu (centré, symétrique)
- Header : label chip + headline (h2) + teaser — tout centré
- 4 blocs accordéon details/summary (déployables) :
  1. Gigs : N prochains (configurable) + bouton Voir tous → /son
  2. Écoute : boutons SoundCloud/Mixcloud/Spotify si remplis dans le JSON
  3. Visuels : grille photos depuis photos[] du JSON → lightbox au clic
  4. Liens : autres liens du JSON
- Bouton Explorer la page complète → href de la facette

### Données JSON (ajouter à chaque facette)
Ajouter photos:[] et image_fond:'' dans tous les JSON + config.yml Sveltia.


---

## Étape 5 — Passe symétrie

### Règle
Tous titres/textes/boutons centrés H+V dans leur conteneur.
Listes (gigs) : conteneur centré, lignes alignées à gauche (lisibilité).

### son.astro
- .section : display flex, flex-direction column, align-items center, margin 0 auto
- Boutons streaming : flex, justify-content center, gap 0.75rem, flex-wrap wrap
- Liens ← Accueil : text-align center

### Toutes les pages
- Padding symétrique gauche/droite
- Boutons en groupe : centrés

---

## Vérification finale

1. npm run build sans erreur
2. Changer nb de facettes dans facets.ts → typo s'adapte ✓
3. Clic facette → transition contour coloré ✓
4. Tenir touche flèche → accélération progressive ✓
5. Clic centre (état 1) → overlay s'ouvre en cercle depuis ce point ✓
6. Overlay : blocs déployables, photos (lightbox), bouton Explorer ✓
7. Escape / × / clic hors → fermeture → retour état 1 ✓
8. Logo visible si site.json.logo_url rempli ✓
9. Symétrie H+V sur toutes les pages ✓
10. git log origin/feat/jog-etat2 — commits pushés par étape ✓

