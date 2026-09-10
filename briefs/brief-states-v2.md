# Brief : Refonte états platine — v2

**Branche :** `feat/states-v2`  
**Modèle :** opus

---

## Architecture des états

| État | Déclencheur | Layout |
|------|-------------|--------|
| 0 | Chargement / Échap | Platine plein écran, logo visible |
| 1 | Drag / flèches / touch | Layout inchangé, centre assombri + micro-descriptif |
| 2 | Clic pastille OU clic centre (état 1) | Platine réduite centrée, panels gauche+droite (desktop) ou haut+bas (mobile) |
| 3 | Clic "explorer →" | Modal scrollable portrait |

---

## État 1 — Rotation active

Pas de changement de layout. Seul le centre évolue :

```css
/* Logo/image centrale s'assombrit */
.scene[data-state="1"] .center-logo-bg {
  opacity: 0.25;
  transition: opacity 0.3s ease;
}
/* Micro-descriptif apparaît par-dessus */
.scene[data-state="1"] .center-s1 {
  opacity: 1;
}
```

Le `center-s1` contient : label coloré (var(--facet-{key})) + teaser court (2 lignes max, overflow hidden).

---

## État 2 — Contenu partiel + carrousel

### Transition depuis état 0/1

Déclencheurs :
- Clic sur une `.pastille`
- Clic sur `.disk-center` quand `data-state="1"`

### Layout responsive

```css
.scene[data-state="2"] {
  display: grid;
  align-items: center;
  justify-items: center;
}

/* Desktop : colonnes */
@media (orientation: landscape) {
  .scene[data-state="2"] {
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: 1fr;
  }
  .panel-start { grid-column: 1; }
  .turntable-wrap { grid-column: 2; }
  .panel-end   { grid-column: 3; }
}

/* Mobile portrait : lignes */
@media (orientation: portrait) {
  .scene[data-state="2"] {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto 1fr;
  }
  .panel-start { grid-row: 1; }
  .turntable-wrap { grid-row: 2; }
  .panel-end   { grid-row: 3; }
}
```

### Réduction de la platine

```css
.scene[data-state="2"] .turntable {
  transform: scale(0.55);
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Flèches carrousel

Deux boutons `<button class="carousel-arrow carousel-arrow--prev">` et `--next` positionnés sur les bords extérieurs de l'écran (pas des panels). Navigation : facette précédente / suivante dans le tableau `facets`. Le disque snappe sur la facette cible (animation existante `snapToFacet`).

### Contenu des panels

**Panel start** (gauche desktop / haut mobile) :
```html
<div class="panel-content">
  <span class="facet-chip"><!-- label coloré --></span>
  <h2 class="panel-headline"><!-- headline depuis JSON --></h2>
  <p class="panel-teaser"><!-- teaser --></p>
</div>
```

**Panel end** (droite desktop / bas mobile) :
```html
<div class="panel-content">
  <!-- Gigs à venir (max 3, uniquement facette "son") -->
  <!-- Liens streaming si remplis -->
  <button class="cta-explorer">Explorer la page complète →</button>
</div>
```

Les données viennent des `overlayItems` déjà calculés côté serveur (variable `overlayItems` dans Turntable.astro).

### Animation entrée panels

```css
.panel-start, .panel-end {
  opacity: 0;
  transform: translateX(-24px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.panel-end { transform: translateX(24px); }

.scene[data-state="2"] .panel-start,
.scene[data-state="2"] .panel-end {
  opacity: 1;
  transform: translateX(0);
}

@media (orientation: portrait) {
  .panel-start { transform: translateY(-24px); }
  .panel-end   { transform: translateY(24px); }
}
```

### Navigation carrousel

En JS, la fonction `goToFacet(idx)` :
1. Met à jour `activeIdx`
2. Appelle `snapToFacet(idx)` (rotation disque existante)
3. Met à jour le contenu des deux panels (innerHTML ou data binding)
4. Met à jour `data-active-facet` sur `.scene`

Les flèches appellent `goToFacet((activeIdx ± 1 + N) % N)`.  
Swipe horizontal (`touchstart` / `touchend`, delta > 50px) → même logique.

---

## État 3 — Modal portrait

Déclencheur : `.cta-explorer`

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: oklch(0 0 0 / 0.75);
  z-index: 100;
}

.modal-inner {
  width: min(420px, 92vw);
  max-height: 85vh;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
```

Contenu : headline + description complète + gigs + liens + bouton "Voir la page → /son" (ou href de la facette). Fermeture : Échap, clic hors `.modal-inner`, bouton ×.

---

## Retour à l'état 0

- Échap depuis état 2 → état 0 (platine reprend sa taille, panels disparaissent)
- Clic sur le fond `.bg-stage` → état 0

---

## Contraintes absolues

- Zéro hardcode — tout vient de `facets.ts` et des JSON
- Tokens CSS uniquement dans `BaseLayout.astro`
- `npm run build` sans erreur avant push
- `data-state` sur `.scene` est la seule source de vérité pour les styles

---

## Ordre d'exécution

1. Créer la branche `feat/states-v2` depuis `main`
2. Ajouter `.panel-start` / `.panel-end` dans le HTML de `Turntable.astro` (après `.turntable` et avant la fermeture de `.scene`)
3. CSS : layout grid responsive + transitions (tokens dans `BaseLayout.astro`)
4. JS : `goToFacet()`, flèches carrousel, swipe touch, mise à jour panels
5. État 3 : modal HTML + CSS + JS open/close
6. `pnpm build` sans erreur → push `feat/states-v2`
