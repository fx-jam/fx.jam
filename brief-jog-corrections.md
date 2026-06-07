# Brief — Corrections jog (Groupe 1)

> **Branche** : `feat/jog-cd-mobile` (git checkout feat/jog-cd-mobile si besoin)
> Appliquer dans `src/components/Turntable.astro` et `src/data/facets.ts`.
> Montrer `git diff` a Fx AVANT de terminer. Ne PAS merger.
> Regle absolue : zero hardcode couleur. Uniquement tokens CSS var(--...).

---

## CORRECTION 1 — Indicateur fixe triangulaire hors disque

Probleme : le ::before de .disk tourne avec le disque. Fx veut un indicateur FIXE, hors du disque.

1. Supprimer le bloc ::before de .disk dans le CSS.

2. Ajouter dans le HTML de .turntable (sibling de .disk) :
   <div class="disk-indicator" aria-hidden="true"></div>

3. CSS de l indicateur (triangle pointe vers le bas, fixe en haut du disque) :
   .disk-indicator {
     position: absolute;
     top: calc(50% - var(--disk-size, 560px) / 2 - 14px);
     left: 50%;
     transform: translateX(-50%);
     width: 0; height: 0;
     border-left: 7px solid transparent;
     border-right: 7px solid transparent;
     border-top: 11px solid var(--text-secondary);
     pointer-events: none;
     z-index: 10;
     transition: border-top-color 0.3s ease;
   }

4. En JS dans update(), apres le calcul de closestIdx, colorer l indicateur avec la facette active :
   indicator.style.setProperty('border-top-color', `var(--facet-${facets[closestIdx].id})`);
   (Recuperer indicator = scene.querySelector('.disk-indicator') en debut de handler.)

---

## CORRECTION 2 — Drag a la souris (mousedown/mousemove/mouseup)

Repliquer la logique tactile (atan2, velAngle, samples) pour la souris.

Variables : mouseDown=false, mouseDragStartAngle, mouseDragStartRotation, mouseDragDist, mouseDragStartX/Y.

scene.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  e.preventDefault();
  mouseDown = true;
  mouseDragStartX = e.clientX; mouseDragStartY = e.clientY; mouseDragDist = 0;
  const rect = scene.getBoundingClientRect();
  const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
  mouseDragStartAngle = Math.atan2(e.clientY-cy, e.clientX-cx) * (180/Math.PI);
  mouseDragStartRotation = currentAngle;
  velAngle = 0; samples = [];
}, { signal: sig });

window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  mouseDragDist = Math.hypot(e.clientX-mouseDragStartX, e.clientY-mouseDragStartY);
  const rect = scene.getBoundingClientRect();
  const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
  const angle = Math.atan2(e.clientY-cy, e.clientX-cx) * (180/Math.PI);
  currentAngle = mouseDragStartRotation + (angle - mouseDragStartAngle);
  targetAngle = currentAngle;
  const now = performance.now();
  samples.push({ angle: currentAngle, t: now });
  if (samples.length > 4) samples.shift();
  update();
}, { signal: sig });

window.addEventListener('mouseup', e => {
  if (!mouseDown) return;
  mouseDown = false;
  if (samples.length >= 2) {
    const first = samples[0], last = samples[samples.length-1];
    const dt = last.t - first.t;
    if (dt > 0) velAngle = (last.angle - first.angle) / dt * 16;
  }
  // TAP SOURIS : si mouvement < 5px et hors .disk-center -> retour accueil
  if (mouseDragDist < 5 && !e.target.closest('.disk-center')) setState(0);
}, { signal: sig });

---

## CORRECTION 3 — Tap touch hors .disk-center -> setState(0)

Dans touchstart existant, stocker touchStartX et touchStartY.
Dans touchend existant, calculer la distance. Si < 5px et cible hors .disk-center : setState(0).

---

## CORRECTION 4 — Supprimer le cercle noir des etiquettes

Dans le CSS de .disk-track : background: transparent; border: none;
Les pastilles enfants restent positionnees correctement.

---

## CORRECTION 5 — Label "Cours" au lieu de "Enseignement"

Dans src/data/facets.ts : verifier si src/pages/enseignement.astro existe.
- Si oui : changer uniquement le champ label (pas le id ni le href).
- Si non : changer aussi id et href en "cours".

---

## CORRECTION 6 — Agrandir l etiquette active

Dans le CSS de .pastille.is-active (ou equivalent) :
  scale: 1.6;
  font-weight: 700;
  font-size: 0.72rem;
  opacity: 1;
Effet doit etre clairement visible — l etiquette active doit vraiment se distinguer.

---

## Test avant de signaler

npm run build sans erreur.
git diff confirme zero hardcode (sauf rgba(0,0,0,...) pour ombres).
