# Brief correctif : feat/jog-etat2 — fix labels arc + effet CD

## Bug fondamental identifié (priorité absolue)

Les labels SVG (`disk-labels`) sont DANS le `.disk` qui tourne.
Quand le disque tourne, les arcs textPath tournent avec lui → les mots se
retrouvent à l'envers selon la position angulaire courante.

### Architecture correcte

Les labels doivent être dans un **SVG overlay FIXE** séparé du disque,
positionné au-dessus (z-index supérieur), qui NE tourne PAS.
Les arcs textPath sont recalculés en JS à chaque frame d'animation.

### Structure HTML à modifier

```html
<div class="turntable">
  <!-- Fond coloré SEULEMENT : tourne avec --disk-rotation -->
  <div class="disk">
    <!-- PAS de SVG labels ici -->
  </div>

  <!-- Labels FIXES : SVG overlay qui NE tourne PAS -->
  <svg class="disk-labels" viewBox="-100 -100 200 200"
       aria-hidden="true" focusable="false">
    <defs>
      <!-- Les <path> d'arc sont mis à jour par JS à chaque frame -->
      {labelItems.map(item => (
        <path id={`tt-arc-${item.key}`} d="" fill="none"/>
      ))}
      <!-- Filtres glow inchangés -->
      <!-- Masque CD inchangé -->
    </defs>

    <!-- Labels : les <text> restent ici, les arcs changent via JS -->
    {labelItems.map(item => (
      <text class={`disk-label disk-label--${item.key}`} ...>
        <textPath href={`#tt-arc-${item.key}`} startOffset="50%"
          text-anchor="middle">{item.label}</textPath>
      </text>
    ))}
  </svg>

  <div class="disk-track"></div>
  <div class="disk-center" ...>...</div>
  <!-- Pastilles de clic inchangées -->
</div>
```

### CSS à modifier

```css
/* disk-labels est FIXE, pas dans le flux du disk qui tourne */
.disk-labels {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 3;           /* Au-dessus du disque */
  overflow: visible;
  pointer-events: none;
  /* PAS de transform, PAS de rotation */
}
```

### JS : recalcul des arcs à chaque frame

Dans la fonction `update()`, après le calcul de `currentAngle`, ajouter :

```javascript
// Recalculer les arcs textPath selon la rotation actuelle
function arcPath(angleDeg: number, r: number): string {
  const toRad = (d: number) => (d - 90) * Math.PI / 180;
  const half = ARC_DEG / 2;
  const s = toRad(angleDeg - half);
  const e = toRad(angleDeg + half);
  const sx = r*Math.cos(s), sy = r*Math.sin(s);
  const ex = r*Math.cos(e), ey = r*Math.sin(e);
  // Flip : si la facette est dans la demi-inférieure VISUELLE
  // (angle absolu normalisé entre 91° et 269°), inverser le sens
  const absAngle = ((angleDeg + 90) % 360 + 360) % 360;
  const upper = absAngle <= 90 || absAngle >= 270;
  return upper
    ? `M ${sx.toFixed(3)},${sy.toFixed(3)} A ${r},${r} 0 0 1 ${ex.toFixed(3)},${ey.toFixed(3)}`
    : `M ${ex.toFixed(3)},${ey.toFixed(3)} A ${r},${r} 0 0 0 ${sx.toFixed(3)},${sy.toFixed(3)}`;
}

// Dans update(), à chaque frame :
for (let i = 0; i < N_FACETS; i++) {
  const absAngleDeg = BASE_ANGLES[i] + currentAngle;  // angle absolu avec rotation
  const pathEl = document.getElementById(`tt-arc-${labelItems[i].key}`);
  if (pathEl) pathEl.setAttribute('d', arcPath(absAngleDeg, rBaseline));
}
```

Note : `BASE_ANGLES` et `rBaseline` doivent être accessibles dans `update()`.
`rBaseline` est calculé côté serveur → passer sa valeur au script JS via
un attribut data sur `.scene` : `data-r-baseline={rBaseline.toFixed(3)}`.

---

## Corrections supplémentaires

### 1. Lettres qui se chevauchent → réduire COND_RATIO

Le ratio réel de Barlow Condensed dans le navigateur est plus large que 0.42.
Changer :
```typescript
const COND_RATIO = 0.42;
```
en :
```typescript
const COND_RATIO = 0.55;  // valeur empirique Barlow Condensed réel
```
Cela réduit le fontSize calculé et donne plus d'espace entre les lettres.
Propager la valeur corrigée au JS via `data-font-size={fontSize.toFixed(3)}`
sur `.scene`, comme pour `rBaseline`.

### 2. Stroke trop gros → réduire à 2

Dans le template SVG :
```
stroke-width="3"  →  stroke-width="2"
```

### 3. Glow SourceAlpha → SourceGraphic

Dans les deux filtres `tt-glow-l` et `tt-glow-s` :
```xml
<!-- AVANT -->
<feGaussianBlur in="SourceAlpha" .../>

<!-- APRÈS : préserve la couleur du texte dans le halo -->
<feGaussianBlur in="SourceGraphic" .../>
```

### 4. Effet iridescent CD (amélioration du fond disque)

Remplacer le conic-gradient actuel par une version plus lumineuse/irisée,
avec un `radial-gradient` blanc-argent superposé qui simule la brillance
centrale d'un CD :

```css
.disk {
  background:
    /* Brillance centrale argentée */
    radial-gradient(circle at 50% 50%,
      oklch(0.95 0.00 0 / 0.25) 0%,
      oklch(0.80 0.00 0 / 0.12) 20%,
      transparent 55%
    ),
    /* Spectre irisé — couleurs plus vives et lumineuses qu'avant */
    conic-gradient(
      from 0deg,
      oklch(0.50 0.28   0),
      oklch(0.55 0.24  60),
      oklch(0.52 0.24 120),
      oklch(0.50 0.20 180),
      oklch(0.50 0.24 240),
      oklch(0.52 0.26 300),
      oklch(0.50 0.28 360)
    );
}
```

---

## Ordre d'exécution

1. Sortir le SVG disk-labels du .disk (architecture fixe)
2. Implémenter recalcul dynamique des arcs dans update()
3. Corriger COND_RATIO = 0.55
4. Stroke 2px + SourceGraphic dans les filtres
5. Fond disque plus irisé
6. npm run build → push feat/jog-etat2

---

## Corrections supplémentaires (ajout post-review)

### 6. Clic pastille → overlay direct (supprime l'état 1.5 parasite)

Actuellement : clic pastille → setState(1) → centre s'agrandit → clic sur centre → overlay.
Attendu : clic pastille → overlay direct (un seul clic).

Dans le handler des pastilles, remplacer :
```javascript
pastilles.forEach((el, idx) => {
  el.addEventListener('click', (e) => {
    e.stopPropagation(); snapToFacet(idx); setState(1, idx);
  }, { signal: sig });
});
```
Par :
```javascript
pastilles.forEach((el, idx) => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    snapToFacet(idx);
    setState(1, idx);               // facette active pour la logique interne
    openOverlay(pastilles[idx].dataset.facet!);  // overlay immédiat
  }, { signal: sig });
});
```

L'état 1 reste fonctionnel pour le drag et le clavier (le disque tourne, une facette
est mise en surbrillance), mais un clic direct sur une pastille ouvre l'overlay sans
passer par l'affichage intermédiaire du centre agrandi.

### 7. Simplifier l'état 1 visuellement

L'état 1 agrandit le centre à --center-size-open (42% du jog) et affiche
un label/teaser dans le centre — ce "mini-overlay" est confus.

- Supprimer l'agrandissement du centre en état 1 :
  `.scene[data-state="1"] .disk-center` → garder la même taille qu'en état 0
- Supprimer ou réduire le contenu `.center-s1` (label/teaser/cta dans le centre)
- L'état 1 = uniquement : indicateur coloré, fond subtle, label actif sur le disque

Si on veut garder une indication visuelle du nom de la facette en état 1,
afficher juste le label coloré en petit texte centré dans le cercle central
(pas le teaser, pas la CTA "ouvrir →").

### 8. Hitbox des pastilles → secteurs couvrant tout le mot

Les pastilles font 72×72px → trop petit.
Deux options, choisir la plus simple :

Option A — Zones de clic SVG en secteur (dans le SVG overlay fixe, après fix architecture) :
Ajouter des `<path>` de secteur invisibles dans le SVG overlay, mis à jour
à chaque frame en même temps que les arcs :

```javascript
// Dans update(), à chaque frame, après le recalcul des arcs :
const sectorPath = (angleDeg: number, inner = 12, outer = 100): string => {
  const toRad = (d: number) => (d - 90) * Math.PI / 180;
  const half = ARC_DEG / 2;
  const s = toRad(angleDeg - half), e = toRad(angleDeg + half);
  const p = (r: number, a: number) => [r*Math.cos(a), r*Math.sin(a)];
  const [osx,osy]=p(outer,s), [oex,oey]=p(outer,e);
  const [isx,isy]=p(inner,s), [iex,iey]=p(inner,e);
  return `M${osx},${osy} A${outer},${outer} 0 0 1 ${oex},${oey} L${iex},${iey} A${inner},${inner} 0 0 0 ${isx},${isy} Z`;
};
// Mettre à jour les paths de hit à chaque frame :
hitPaths[i].setAttribute('d', sectorPath(absAngleDeg));
```

Option B — Agrandir les pastilles divs (rapide) :
Remplacer les pastilles carrées 72px par des ellipses plus larges :
```css
.pastille {
  width: 140px;
  height: 80px;
  border-radius: 50%;
  /* ... reste inchangé */
}
```

Choisir Option A car elle sera recalculée dynamiquement avec la rotation,
et l'Option B laisserait des zones de clic qui se chevauchent en cas de
beaucoup de facettes.

### 9. Logo et fond : remplir dans site.json

Mettre à jour src/data/site.json :
```json
{
  "logo_url": "https://media.hamcat.live/logos/logo.jpg"
}
```

Note : fond.png dans R2 n'a pas de champ dédié dans le code actuel.
Si Fx veut l'utiliser comme fond global de la page ou du disque,
ajouter un champ "fond_url" dans site.json et câbler dans BaseLayout ou Turntable.
À confirmer avec Fx.
