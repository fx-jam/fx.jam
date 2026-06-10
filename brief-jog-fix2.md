# Brief correctif final : feat/jog-fix2

**Branche :** `feat/jog-fix2` (depuis main)
**Tous les bugs ont une cause commune analysée ci-dessous.**

---

## Bug racine : décalage +90° entre pastilles et arcs

BASE_ANGLES = [i * STEP - 90] (SVG natif : -90° = haut).
- Pastilles : `rad = deg * PI/180` → correct (Son à -90° = haut ✓)
- arcPathJS : `toRad = (d-90)*PI/180` → attend une convention "0°=haut"
  → arcPathJS(-90, R) calcule l'arc en bas-gauche au lieu du haut ✗

### Correction (1 ligne)

```javascript
// AVANT :
arcPathEls[i]?.setAttribute('d', arcPathJS(absAngleDeg, R_BASELINE));

// APRÈS : ajouter +90 pour aligner les conventions
arcPathEls[i]?.setAttribute('d', arcPathJS(absAngleDeg + 90, R_BASELINE));
```

Cela corrige d'un coup : hitbox alignée, arcs au bon endroit, navigation flèches.

---

## Bug flip : formule avec +90 incorrecte

Dans arcPathJS, la formule actuelle :
```javascript
const absAngle = ((angleDeg + 90) % 360 + 360) % 360;
const upper = absAngle <= 90 || absAngle >= 270;
```
Après la correction ci-dessus, `angleDeg` reçoit `absAngleDeg + 90`
(convention 0°=haut). La formule doit devenir :

```javascript
// APRÈS (supprimer le +90 interne, il est déjà dans l'appel) :
const normAngle = ((angleDeg % 360) + 360) % 360;
const upper = normAngle <= 90 || normAngle >= 270;
```

Résultat :
- 12h (0°) → normAngle=0 → upper, pas de flip ✓ (position sélecteur)
- 6h (180°) → normAngle=180 → lower, flip ✓
- 3h/9h (90°/270°) → border, upper → pas de flip (le mot est lisible sur le côté)

---

## Logo : remplir tout le cercle central

Le logo fait 44px CSS dans un cercle de 180px → trop petit.

Remplacer le contenu `.center-s0` par :
```astro
<div class="center-s0">
  {siteData.logo_url && (
    <img
      src={siteData.logo_url}
      alt={siteData.displayName}
      class="center-logo-bg"
    />
  )}
  {!siteData.logo_url && (
    <span class="center-name">{siteData.displayName}</span>
  )}
</div>
```

CSS :
```css
.center-logo-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;   /* remplit tout le cercle */
  border-radius: 50%;
  opacity: 0.85;
  z-index: 0;           /* derrière le texte center-s1 */
}
.center-s0, .center-s1 {
  position: absolute; inset: 0;
  z-index: 1;           /* au-dessus du logo */
  ...
}
```

---

## État 1 : garder l'aperçu compact dans le centre (sans agrandissement)

Rétablir center-s1 (label + teaser) en état 1, MAIS sans agrandir le cercle.

```css
/* Supprimer ou commenter ce bloc : */
/* .scene[data-state="1"] .disk-center {
  width:  var(--center-size-open, 260px);
  height: var(--center-size-open, 260px);
  ...
} */

/* Le centre garde sa taille fixe. center-s1 s'affiche quand même : */
.center-s1 { opacity: 0; pointer-events: none; }
.scene[data-state="1"] .center-s0 { opacity: 0; pointer-events: none; }
.scene[data-state="1"] .center-s1 { opacity: 1; }
```

center-s1 contient : label coloré + teaser court + "ouvrir →".

---

## Fond de page : augmenter l'opacité

Dans BaseLayout.astro, trouver le style appliqué à body ou .page-bg
et augmenter opacity de la valeur actuelle à **0.22**.

---

## Glow : vérifier application du filtre sur labels actifs

Si le glow a disparu, vérifier que le JS applique bien `filter="url(#tt-glow-l)"`
sur le label actif. Le filtre est dans le SVG `.disk-labels`, les refs doivent
correspondre. Si nécessaire, appliquer via JS :
```javascript
labelEls[i].setAttribute('filter', isActive ? 'url(#tt-glow-l)' : 'url(#tt-glow-s)');
```

---

## Lettres chevauchées : COND_RATIO

Passer COND_RATIO de 0.55 à **0.62** (valeur plus proche du rendu réel Barlow Condensed).
Propager la valeur mise à jour dans `data-font-size` si utilisé.

---

## Ordre d'exécution

1. Correction ligne `arcPathJS(absAngleDeg + 90, R_BASELINE)` → résout hitbox + alignement
2. Correction formule flip (suppression `+90` interne) → résout flip
3. Logo cover + center-s1 sans agrandissement
4. Fond opacity 0.22 + glow JS fix + COND_RATIO 0.62
5. `npm run build` → push `feat/jog-fix2`

NE PAS merger sur main — Claude (chat) vérifie avant.
