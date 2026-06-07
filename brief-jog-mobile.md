# Brief — Jog CD Mobile-First

> **Branche** : `feat/jog-cd-mobile`
> Montrer `git diff` + `npm run build` + descriptif visuel à Fx AVANT merge sur main.
> Ne pas merger sans validation du chat web (Claude architecte).
> **Règle absolue** : zéro hardcode couleur (#hex, rgb, hsl). Uniquement les tokens CSS (var(--...)).
> Supprimer ce brief après merge.

---

## Contexte — ce qui est bien, NE PAS TOUCHER

`src/components/Turntable.astro` est plus avancé que prévu. À PRÉSERVER INTÉGRALEMENT :
- Mécanique tactile angulaire (touchstart/touchmove/touchend + calcul atan2) : parfaite.
- Inertie (`velAngle`, `FRICTION = 0.97`, boucle `animate()` phases inertie+ressort) : bien.
- Machine à états (0/1/2), `setState()`, `snapToFacet()`, `getTargetIdx()` : garder.
- Navigation clavier (flèches, Escape, Enter), molette trackpad : garder.
- View Transitions (`astro:page-load`) + `AbortController` pour nettoyage : garder.
- `src/data/facets.ts` et architecture des données : garder.
- `src/pages/index.astro` (importe juste Turntable) : garder.

---

## Objectif — 3 évolutions uniquement

### 1. RESPONSIVE MOBILE-FIRST (priorité absolue)

**Problème actuel** : `.turntable { width: 620px; height: 620px }` hardcodé -> dépasse sur iPhone (390px).

**Solution** : rendre la taille du disque dynamique via une CSS custom property calculée en JS.

**En JS** (dans le handler `astro:page-load`, avant `update()`) :

```js
function calcDiskSize(): number {
  return Math.min(
    document.documentElement.clientWidth  * 0.90,
    document.documentElement.clientHeight * 0.85,
    560
  );
}

function applyDiskSize(): void {
  const size = calcDiskSize();
  scene.style.setProperty('--disk-size',        size + 'px');
  scene.style.setProperty('--center-size',      Math.round(size * 0.29) + 'px');
  scene.style.setProperty('--center-size-open', Math.round(size * 0.42) + 'px');
  RING_R_0 = size / 2 * 0.80;
  RING_R_1 = size / 2 * 0.99;   // remplace la constante 310 hardcodee
  targetRingR  = appState === 1 ? RING_R_1 : RING_R_0;
  currentRingR = targetRingR;
}

// Appeler au init + au resize (debounce 100ms)
applyDiskSize();
let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(applyDiskSize, 100);
}, { signal: sig });
```

**En CSS** (remplacer les valeurs hardcodees) :

```css
.turntable {
  width:  var(--disk-size, 560px);
  height: var(--disk-size, 560px);
}

.disk-center {
  width:  var(--center-size, 180px);
  height: var(--center-size, 180px);
}

.scene[data-state="1"] .disk-center {
  width:  var(--center-size-open, 260px);
  height: var(--center-size-open, 260px);
}
```

Supprimer (ou ignorer) le `data-ring-r` du frontmatter Astro -> RING_R_0 est desormais calcule cote JS.
Mettre a jour le calcul de `BASE_ANGLES` apres chaque `applyDiskSize()`.

### 2. LOOK CD : SURFACE IRISEE (conic-gradient rotatif)

**Principe** : faire tourner visuellement `.disk` avec `currentAngle` en JS.
Les pastilles (.pastille) et le centre (.disk-center) sont dans `.turntable`, PAS dans `.disk`
-> ils ne tournent pas avec `.disk`. Le conic-gradient du disque tourne -> arc-en-ciel qui balaie.

**En JS** : ajouter cette ligne dans la fonction `update()` (ou `animate()`), apres le calcul de positions :

```js
scene.style.setProperty('--disk-rotation', `${currentAngle.toFixed(2)}deg`);
```

**En CSS** : remplacer le `.disk { background: var(--bg-surface); ... }` par :

```css
.disk {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid var(--border);
  transform: rotate(var(--disk-rotation, 0deg));
  will-change: transform;
  background:
    radial-gradient(
      circle at center,
      var(--bg-elevated) 0%,
      transparent 62%
    ),
    conic-gradient(
      from 0deg,
      color-mix(in srgb, var(--facet-son)          22%, var(--bg-surface))   0deg,
      color-mix(in srgb, var(--facet-regie)         18%, var(--bg-surface))  60deg,
      color-mix(in srgb, var(--facet-enseignement)  18%, var(--bg-surface)) 120deg,
      color-mix(in srgb, var(--facet-blog)          18%, var(--bg-surface)) 180deg,
      color-mix(in srgb, var(--facet-outils)        18%, var(--bg-surface)) 240deg,
      color-mix(in srgb, var(--facet-contact)       22%, var(--bg-surface)) 300deg,
      color-mix(in srgb, var(--facet-son)           22%, var(--bg-surface)) 360deg
    );
  /* PAS de transition sur background ni transform (animation RAF) */
  transition: box-shadow 0.4s ease;
}

.scene[data-state="1"] .disk {
  box-shadow: 0 0 80px -20px rgba(0, 0, 0, 0.7); /* garder */
}
```

Note : le `::before` (tick 12h) tourne avec `.disk` -> effet naturel, le repere pivote comme sur un vrai jog.

### 3. AFFINER LE LOOK : trou central + pastilles

**Centre (trou de CD)** : approfondir visuellement le trou par rapport au disque irisé.

```css
.disk-center {
  /* ... garder le reste ... */
  background: var(--bg-app);       /* plus sombre que --bg-elevated -> creuse le trou */
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
}
```

**Pastilles** : affiner vers un look plus epure (moins pills, plus etiquette de jog).

```css
.pastille {
  /* ... garder --c, --proximity, scale, opacity ... */
  padding: 0.35rem 0.75rem;          /* leger : moins epais */
  border-radius: 6px;                /* moins pill, plus etiquette */
  font-size: 0.55rem;
  letter-spacing: 0.20em;
  /* garder le reste exactement */
}
```

L'etat `.is-active` et le mecanisme `--proximity` existants sont bons, ne pas modifier.

---

## Test de validation avant merge

1. `npm run build` -> doit passer sans erreur (warning "blog vide" normal).
2. Dans le navigateur en DevTools -> responsive mode a 390px de large (iPhone) :
   - Le disque tient dans le viewport sans deborder.
   - La rotation tactile (simulate touch) fonctionne.
   - Les pastilles sont lisibles et cliquables.
3. En desktop (>1024px) : le disque est plafonne a 560px, l'arc-en-ciel tourne.
4. Zero hardcode couleur dans le diff -> verifier avec `git diff | grep -E '#[0-9a-fA-F]{3}|rgb\(|rgba\('`.

---

## Rappels tokens et conventions

Tokens autorises (dans `src/layouts/BaseLayout.astro`) :
- Couleurs facettes : `var(--facet-son)`, `var(--facet-regie)`, `var(--facet-enseignement)`, `var(--facet-blog)`, `var(--facet-outils)`, `var(--facet-contact)`
- Fonds : `var(--bg-app)`, `var(--bg-surface)`, `var(--bg-elevated)`
- Texte : `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)`
- Bordures : `var(--border)`
- Typo : `var(--font-display)`, `var(--font-mono)`
- color-mix() est autorise pour deriver des nuances (ex. dans son.astro).
- Les shadow rgba(0,0,0,...) sont toleres pour les ombres noires neutres.

---

## Ce qu'on ne fait PAS dans ce chantier (reporter a plus tard)

- La diffraction irisee "vraie" avec canvas ou WebGL (version 2 apres validation du conic-gradient).
- Les 3 etats (galerie etat 0, apercu etat 1, plein ecran etat 2) : logique OK, on ne touche pas.
- Le renommage Turntable.astro -> Jog.astro : chantier separe.
- La page /son ou les autres facettes : pas dans ce brief.
