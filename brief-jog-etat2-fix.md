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
