# Brief micro : fix désaxement mots retournés

**Branche :** `feat/jog-fix3` depuis main

## Problème

En SVG textPath, les lettres "montent" toujours vers y négatif (haut écran).
- Arc upper (haut disque) : baseline à rBaseline, cap monte vers R_CAP (bord) ✓
- Arc lower (bas disque, flip) : baseline à rBaseline aussi, cap monte vers centre ✗
  → les mots retournés paraissent plus proches du centre

## Correction

Dans `arcPathJS`, utiliser un rayon différent selon l'orientation :
- Upper : arc à `rBaseline` (baseline vers le centre, cap vers le bord)
- Lower : arc à `R_CAP`     (baseline vers le bord, cap vers le centre)

Les deux occupent le même espace radial [rBaseline, R_CAP].

### Code

```javascript
// Lire R_CAP depuis un data-attribute sur .scene (ex: data-r-cap)
// Côté serveur Astro : <div class="scene" data-r-cap={R_CAP.toFixed(3)} ...>

function arcPathJS(angleDeg: number, rUpper: number, rLower: number): string {
  const normAngle = ((angleDeg % 360) + 360) % 360;
  const upper = normAngle <= 90 || normAngle >= 270;
  const r = upper ? rUpper : rLower;
  const toRad = (d: number) => (d - 90) * Math.PI / 180;
  const half = ARC_DEG / 2;
  const s = toRad(angleDeg - half), e = toRad(angleDeg + half);
  const sx = r*Math.cos(s), sy = r*Math.sin(s);
  const ex = r*Math.cos(e), ey = r*Math.sin(e);
  return upper
    ? `M ${sx.toFixed(3)},${sy.toFixed(3)} A ${r},${r} 0 0 1 ${ex.toFixed(3)},${ey.toFixed(3)}`
    : `M ${ex.toFixed(3)},${ey.toFixed(3)} A ${r},${r} 0 0 0 ${sx.toFixed(3)},${sy.toFixed(3)}`;
}

// Appel dans update() :
arcPathEls[i]?.setAttribute('d', arcPathJS(absAngleDeg + 90, R_BASELINE, R_CAP));
```

Côté serveur, même logique dans `arcPath` statique (initialisation) :
```typescript
function arcPath(angleDeg: number, rUpper: number, rLower: number): string {
  const upper = angleDeg <= 90 || angleDeg >= 270;
  const r = upper ? rUpper : rLower;
  // ... reste identique
}
// Appelé avec arcPath(i * 360/N, rBaseline, R_CAP)
```

Ajouter `data-r-cap={R_CAP.toFixed(3)}` sur `.scene` pour exposer R_CAP au JS
(comme data-r-baseline existant).

## Vérification

Faire tourner le disque lentement : les mots à l'endroit et à l'envers doivent
tous avoir leur texte aligné sur le même cercle extérieur.

npm run build → push feat/jog-fix3. NE PAS merger.
