### 2026-09-08 — câblage rendu des champs CMS dans les composants Astro

- **son.astro** : `cover_image` hero image, `links.instagram`/`facebook` dans section Écoute, section Mixes (titre, date, genre, durée, liens Mixcloud/SC) ; type cast `SonData` pour éviter `never[]`
- **contact.astro** : page complète remplace StubPage — `booking_email` CTA, `social.*` liens filtrés, `press_kit_url`, `cover_image` hero, fallback note_stub
- **BaseLayout.astro** : OG meta (`og:title`, `og:type`, `og:site_name`, `og:description`, `og:image`) + `twitter:card`
- **StubPage.astro** : `contact_email` câblé (pour la régie)
- Build OK, pushé `7142767`

---

### 2026-09-08 — feat: CMS complet + face-B contenu riche

- **5 JSON de facettes enrichis** : `cover_image`, listes (`mixes`, `equipment`, `references`, `courses`, `tools`, `social`), champs typés conservant les champs existants
- **`src/data/types.ts` créé** : interfaces TypeScript `SonData`, `RegieData`, `CoursData`, `OutilsData`, `ContactData`
- **`public/admin/config.yml` mis à jour** : collections CMS avec labels FR, widgets `image`/`markdown`/`list`/`object`/`number` par facette — édition 100% sans code
- **`Turntable.astro` — face-B alimentée par facette** :
  - Carré 1 : `cover_image` (ou placeholder coloré)
  - Carré 2 : contenu contextuel selon `item.key` — grille mixes (Son), références + équipement (Régie), liste cours niveau/prix (Cours), outils avec liens (Outils), booking email + réseaux sociaux + EPK (Contact), 3 derniers articles (Blog)
  - Guards partout : aucun champ vide ne casse le rendu
- **Build OK** : zéro erreur TS, zéro erreur Astro — déployé sur main → Cloudflare auto
- **À faire** : remplir les JSON via `/admin` pour voir le contenu réel en face-B ; ajouter `blog/` directory pour que la collection blog existe

---

### 2026-09-07 — physique de rotation v2 (volant d'inertie)

- **Refonte complète de la physique** dans `src/components/Turntable.astro`
- **3 modes d'entrée distincts implémentés** :
  - Clavier flèches : accélération progressive par appui maintenu (`KEY_ACCEL=0.4 deg/frame²`, cap `KEY_MAX_VEL=20`), snap au relâchement via friction dynamique
  - Drag souris : physique scratch pixel-delta (`MOUSE_SENS=0.28 deg/px`), 1:1 avec la vitesse de la souris, inertie au lâcher
  - Tactile : inchangé dans le mécanisme (velBuf, atan2), mais relances désormais cumulatives
- **Modèle volant d'inertie** : friction dynamique proportionnelle à la vélocité — `f(v) = lerp(0.88, 0.985, v/15)`. À faible vitesse → arrêt rapide (~12 frames). À v≥15 deg/frame → coast long (~200 frames / 3s). Même physique pour toutes les entrées.
- **Relances touch** : `velAngle` non remis à zéro au touchstart. Au touchend, même direction → `velAngle = 40% existant + nouvelle impulsion` (cumul). Direction inverse → remplacement (frein naturel).
- **Molette** : refaite additive à `velAngle` (`factor 0.09`) au lieu du snap discret sur `targetAngle`. Scrolls rapides = momentum qui s'accumule.
- **Supprimé** : `FRICTION_TOUCH`, `KEY_FRICTION`, `MOUSE_FRICTION`, `inputSource` (dispatch par source remplacé par la friction unifiée dynamique), `BASE_STEP`, `MAX_STEP` (morts), `getTargetIdx()` (mort).
- **Ajouté** : `window.blur` → reset `keyIsHeld` (touche coincée si focus perdu).
- **En cours / à explorer** : tuning fin des constantes physiques selon ressenti réel, snap comportement en état 0, effet "frein" quand on pose le doigt sur un disque en rotation

---

### 2026-09-07 — feat/states-v2 (suite — corrections + merge main)

- **Logo état 1/2** : atténuation forte (`--logo-dim: 0.15`) via CSS, texte du centre lisible sans conflit
- **Portrait état 2 symétrie** : panels pleine largeur (`max-width: none; width: 100%`), contenu centré (`align-items: center; text-align: center`), centrage pixel-perfect confirmé (x=195 sur 390px)
- **Clic centre disque** : fonctionne depuis tous les états — état 0 → snap + state 2 ; état 1 → state 2 ; état 2 → ouvre modal
- **Modal état 3 redesigné** : iframe chargée avec `?modal=1` → page facette complète (`/son`, `/regie`…) scrollable dans l'overlay ; `scene.dataset.state` reste `"2"` → fond homepage toujours visible + flouté (`backdrop-filter: blur(10px)`) ; script inline dans `BaseLayout.astro` neutralise `overflow:hidden` + `position:fixed` pour le mode iframe
- **Carrousel état 3** : flèches + swipe + clavier ←→ changent la facette ET mettent à jour l'iframe src
- **Suppression code mort** : ~120 lignes CSS (modal-chip, modal-block, modal-gig…) + fonction `populateModal` retirées
- **Merge** : `feat/states-v2` → `main` via fast-forward, déploiement Cloudflare automatique

---

### 2026-09-07 — feat/states-v2

- **Implémenté** : refonte complète du système d'états de `Turntable.astro` selon `brief-states-v2.md`
- **État 2** : platine réduite `scale(0.55)`, grid CSS responsive (landscape: 3 colonnes, portrait: 3 lignes), panels gauche/droite avec chip coloré + headline + teaser + gigs + streams + CTA
- **État 3** : modal portrait scrollable (width min(420px, 92vw), max-height 85vh), contenu dynamique via JS (gigs, streams, liens), fermeture par Échap/×/clic hors modal
- **Carrousel** : flèches prev/next (position:fixed), swipe horizontal touch (delta > 50px), clavier ←→ en état 2
- **Machine d'états** : 0↔1 (rotation/preview) → 2 (panels) → 3 (modal), Échap remonte d'un niveau
- **Données** : overlayItems sérialisés en `data-items` sur div caché, JS lit et met à jour panels/modal dynamiquement
- **Tokens** ajoutés dans `BaseLayout.astro` : `--radius-lg: 16px`, `--panel-max-w: 300px`
- **Build** : `npm run build` sans erreur ✓
- **Branch** : `feat/states-v2` poussée, PR à créer sur GitHub
- **À valider** : tester visuellement en desktop (landscape) et mobile (portrait), merger sur main après validation Fx

---

# Session Log — 2026-06-24

## Memory Sync
- Ran `python3 ~/projects/fx.jam/scripts/memory-sync.py`
- Queue file was empty (no entries to ingest)
- Cleared queue file
- No new memories to ingest
- MEMORY.md unchanged since last sync

## Notes
- Memory tool unavailable in cron job context (expected)
- MEMORY.md contains shared context: user profile, hardware, project state

---

### 2026-06-27 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md mis à jour** : journal de synchro.

### 2026-06-27 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue traitée (2 entrées : MEMORY.md avec journal de synchro + CLAUDE_LOG.md vide)
- **→ Queue vidée** : memory_queue.json vidé
- **→ MEMORY.md mis à jour** : journal de synchro ajouté

---

### 2026-06-26 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue traitée (entrées de synchro uniquement)
- **→ Queue vidée** : 3 entrées de synchro ingérées
- **→ MEMORY.md mis à jour** : journal de synchro.

---

### 2026-06-26 — Cron sync (Hermes)

## Previous Entries

### 2026-06-14 — Initialisation
- **→ Import mémoire Claude** : 699 conversations, memories.json, projets.json — ingérés dans Hermes
- **→ MEMORY.md créé** : fichier partagé dans le projet fx.jam
- **→ Sync SSH établie** : Hermes peut exécuter PowerShell à distance sur M2