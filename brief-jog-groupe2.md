# Brief — Jog Groupe 2 : spectral + arc + inertie + drag etat 1

> Branche : feat/jog-groupe2 (creer depuis main a jour)
> Montrer git diff + npm run build a Fx AVANT merge. Ne pas merger sans validation.
> Tokens : zero hardcode dans les composants. Exceptions autorisees :
>   oklch() dans le conic-gradient du disque (spectre physique, pas couleur de marque)
>   oklch() dans les definitions --facet-* de BaseLayout.astro (c est la que les tokens se definissent)

---

## CHANGEMENT 1 — Couleurs spectrales des facettes (BaseLayout.astro)

Vision : 6 facettes, 6 teintes oklch equidistantes sur le spectre (~60 deg d ecart).
Perceptuellement calibre via oklch (pas de jaune trop terne ou bleu trop sombre comme en HSL).

Dans src/layouts/BaseLayout.astro, remplacer les 6 tokens --facet-* par :

  --facet-son:     oklch(0.65 0.22 25);    /* rouge-orange   ~0 deg spectre  */
  --facet-regie:   oklch(0.75 0.18 80);    /* jaune-or       ~60 deg spectre */
  --facet-cours:   oklch(0.70 0.17 145);   /* vert           ~120 deg spectre */
  --facet-blog:    oklch(0.72 0.14 195);   /* cyan           ~180 deg spectre */
  --facet-outils:  oklch(0.65 0.18 260);   /* bleu           ~240 deg spectre */
  --facet-contact: oklch(0.68 0.20 320);   /* violet-rose    ~300 deg spectre */

Si rendu trop terne/vif sur fond sombre, ajuster lightness (premier param) de +/-0.05.

---

## CHANGEMENT 2 — Conic-gradient du disque : spectre oklch continu (Turntable.astro)

Remplacer le conic-gradient actuel par un arc-en-ciel spectral oklch pur, attenue a 10%.
color-mix(in oklch) -> transitions douces, pas de secteurs distincts. Shimmer subtil de CD reel.

Dans le CSS de .disk, remplacer le background par :

  background:
    radial-gradient(circle at center, var(--bg-elevated) 0%, transparent 62%),
    conic-gradient(
      from 0deg,
      color-mix(in oklch, oklch(0.65 0.22 0)   10%, var(--bg-surface))   0deg,
      color-mix(in oklch, oklch(0.75 0.18 60)  10%, var(--bg-surface))  60deg,
      color-mix(in oklch, oklch(0.70 0.17 120) 10%, var(--bg-surface)) 120deg,
      color-mix(in oklch, oklch(0.72 0.14 180) 10%, var(--bg-surface)) 180deg,
      color-mix(in oklch, oklch(0.65 0.18 240) 10%, var(--bg-surface)) 240deg,
      color-mix(in oklch, oklch(0.68 0.20 300) 10%, var(--bg-surface)) 300deg,
      color-mix(in oklch, oklch(0.65 0.22 360) 10%, var(--bg-surface)) 360deg
    );

---

## CHANGEMENT 3 — Etiquettes en arc, rotation dynamique (Turntable.astro)

Effet vise : roue de la chance. Pastille en 12h -> texte droit et lisible.
Les autres inclinées selon leur angle. Flip auto demi-inferieure (evite texte a l envers).

En JS, dans update(), la variable norm est deja calculee (0 deg = 12h).
Ajouter juste apres pastilles[i].setProperty('--proximity', ...) :

  let textRot = norm;
  if (norm > 90 && norm < 270) textRot = norm + 180;
  pastilles[i].style.setProperty('--text-rotation', textRot.toFixed(1) + 'deg');

En CSS, modifier le transform de .pastille :

  .pastille {
    transform:
      translate(calc(-50% + var(--x)), calc(-50% + var(--y)))
      rotate(var(--text-rotation, 0deg))
      scale(calc(0.70 + 0.90 * var(--proximity)));
  }

---

## CHANGEMENT 4 — Inertie clavier (Turntable.astro)

Ajouter un velAngle initial au keydown pour simuler une impulsion sur le jog.
Sensation : "on frappe le jog, il tourne un peu et se cale".

Dans le handler keydown, modifier les deux branches Arrow :

  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    const idx = (getTargetIdx() + 1) % N_FACETS;
    velAngle = STEP * 0.35;
    snapToFacet(idx); setState(1, idx);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    const idx = (getTargetIdx() - 1 + N_FACETS) % N_FACETS;
    velAngle = -STEP * 0.35;
    snapToFacet(idx); setState(1, idx);
  }

---

## CHANGEMENT 5 — Drag etat 1 : mise a jour de la facette active (Turntable.astro)

Drag en etat 1 doit defiler les aperçus comme les fleches clavier.

Dans update(), apres la boucle qui toggle is-active, ajouter :

  if (appState === 1 && activeIdx !== activeFacetIdx) {
    setState(1, activeIdx);
  }

setState met a jour previewLabel, previewTeaser, --preview-c, --stage-c.
Appel conditionnel (seulement si index change) -> pas de surcharge.

---

## Test avant merge

1. npm run build sans erreur.
2. Visuellement :
   - Couleurs des pastilles changees (spectre arc-en-ciel).
   - Disque : shimmer tres subtil, pas de secteurs distincts.
   - Pastilles en arc : texte incline selon position, droit en 12h seulement.
   - Fleches clavier : legere impulsion perceptible avant le snap.
   - Drag en etat 1 : preview du centre change en temps reel.
3. git push origin feat/jog-groupe2 et confirmer a Fx.
