### 2026-09-09 — Spotify sync system + corrections physique disque + multi-panneaux son

**Spotify playlist sync**
- `scripts/sync-spotify.mjs` : Client Credentials token, pagination playlists user, merge intelligent — préserve visible/category/description, retire les playlists supprimées de Spotify
- `.github/workflows/sync-spotify.yml` : cron 6h quotidien + workflow_dispatch, `permissions: contents: write` (fix exit 128)
- `son.json` : `spotify_user_id` + `spotify_playlists[]` avec champs auto (id/spotify_title/spotify_cover/spotify_tracks) et champs curatoriaux (visible/category/description)
- `types.ts` : interface `SpotifyPlaylist` mise à jour, `spotify_user_id?` dans `SonData`
- `config.yml` : widget list avec hints "Ne pas modifier" sur champs auto
- `son.astro` : filtre `visible && id`, groupBy catégorie via reduce, iframes 152px avec description + count

**Pages facettes + SEO**
- `regie.astro`, `cours.astro`, `outils.astro` : remplacent les stubs — même structure que son.astro, tokens `--facet-*`, responsive 640/420px, guards champs optionnels
- `BaseLayout.astro` : objet `seo {}` centralisé, balises complètes (canonical, og:url/title/description/image, twitter:card/title/description/image), `og:image` → `media.hamcat.live/logos/logo.jpg`
- `son.astro` : embeds SoundCloud + playlists Spotify, `extractSpotifyPlaylistId()`

**Corrections physique disque (Turntable.astro)**
- Flèches clavier états 0/1 : impulsion immédiate `velAngle += KEY_ACCEL * dir` sur keydown, `wasCoasting = false` pour éviter snap résiduel sur changement de direction
- Drag souris : passage de δpx linéaire à angle polaire incrémental (`wrapDelta` sur `atan2`) — élimine l'inversion au relâché
- Idle timer : ne déclenche retour état 0 que si `appState === 1` (état 2/3 non interrompus)

**Multi-panneaux son.astro**
- Header fixe compact : cover circulaire 56px + label + h1 + bio + genres + ← Accueil
- Grille 3 colonnes `flex:1` avec scroll indépendant : Agenda (gigs + historique) / Sets (streaming + SC embed + mixes) / Playlists (iframes Spotify groupées)
- Mobile < 768px : colonnes empilées, scroll global
- Sections Visuels/Presskit placeholder supprimées

**Prochaine session**
- Player audio persistant site-wide : `PersistentPlayer.astro` barre fixe bottom, `transition:persist="player"`, SoundCloud Widget API (play/pause via postMessage), boutons "Écouter" sur son.astro → signal au player, localStorage pour source active

---

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
---

## SESSION 2026-09-10 — Player seamless : état des travaux

### Objectif
Lecture site-wide sans coupure : quand l'user navigue entre pages, la musique continue.

### Ce qui a été fait
**Commit `9624bb4`** — `astro:page-load` ne recrée plus les iframes SC/Spotify.
Si `state.scIframe?.src` existe → `updateUI()` uniquement, pas de reset src.

**Commit `4f4cfef`** — Iframes SC/Spotify pré-créées en HTML statique avec `transition:persist`.
Plus de `document.createElement` dans `playSC`/`playSpotify` → `getElementById` seulement.

### Résultat observé par Fx
Toujours les mêmes symptômes malgré les 2 commits :
- Changement de page → lecture reset à 0:00
- Retour accueil ou état 1 (pill) → player se ferme complètement

### Hypothèses à vérifier en prochaine session
1. **Scripts Astro 5** : les `<script>` non-`is:inline` sont recompilés en modules ES — est-ce qu'ils ré-exécutent à chaque navigation ? Si oui, `w.__hamcat` pourrait être réinitialisé.
2. **Turntable.astro** : la page d'accueil a peut-être du code qui appelle `pauseAll()` ou ferme le player — à inspecter.
3. **`transition:persist` imbriqués** : `#hamcat-player[transition:persist]` contient maintenant `#sc-embed[transition:persist]` et `#sp-embed[transition:persist]`. Astro 5 gère-t-il bien les persist imbriqués ? Alternatives : mettre les iframes en siblings de `#hamcat-player` plutôt qu'enfants.
4. **Debug direct** : ajouter `console.log` dans `astro:page-load` pour voir `state.scIframe`, `.src`, `state.currentSource` au moment du check.

### Plan pour prochaine session
1. Lire `src/pages/index.astro` et `src/components/Turntable.astro` pour détecter code qui ferme player
2. Ajouter `console.log` debug temporaire dans `astro:page-load`
3. Tester avec debug : ouvrir devtools > console, lancer SC, naviguer, voir les logs
4. Si persist imbriqué est le pb : déplacer les iframes comme siblings de `#hamcat-player` dans `<body>`, les positionner avec `position:fixed` et z-index approprié
5. Si scripts ré-exécutent : passer le player en `<script is:inline>` pour éviter le recompile module

### Fichiers clés
- `src/layouts/BaseLayout.astro` — tout le player (CSS tokens, HTML player, JS player)
- `src/pages/index.astro` ou `src/components/Turntable.astro` — homepage à inspecter
- RÈGLE : tokens CSS uniquement dans `:root` de BaseLayout.astro


---

## SESSION 2026-09-10 (suite) ??? Player v7/v8/v9 : seamless SC site-wide

### Contexte
Suite directe de la session pr??c??dente. Les hypoth??ses de debug ont ??t?? test??es :
- Scripts Astro 5 r??-ex??cutent ?? chaque navigation ??? confirm??, g??r?? via AbortController pattern
- `transition:persist` sur `#hamcat-player` : les iframes resetent leur contexte lors de `document.adoptNode` ??? limitation navigateur incontournable

### Architecture retenue (BaseLayout.astro, ~36KB)
- `window.__hamcat` : ??tat global persistant entre navigations
- `window.__scWidget` : instance SC Widget API (reset + reinit ?? chaque navigation)
- `window.__hamcatNavigating` : flag pour bloquer le PAUSE spurieux lors d'un changement de page
- `window.__scMuted` : ??tat mute SC (le widget n'a pas de mute persistant)
- `AbortController` pattern : chaque re-run du script IIFE annule les listeners pr??c??dents via `{ signal }`
- `iframe.onload + 500ms` : plus rapide que d??lai fixe 1500ms pour l'init SC Widget

### Commits d??ploy??s

**Commit `7a17ac7` ??? v7 : SC Widget API compl??te**
- `initSCWidget(startAtMs, trackIndex, shouldPlay)` : bind READY/PLAY/PAUSE/PLAY_PROGRESS
- Restore track : `skip(index)` + 600ms + `seekTo(ms)` + `play()`
- Play/pause transport bar c??bl?? sur `isPaused()` ??? `play()/pause()`
- `playSC()` : sauvegarde `scTrackIndex` et `scPlaying` dans localStorage
- `updateUI` : suppression du `btn.disabled` qui bloquait les contr??les SC

**Commit `737cfbd` ??? v8 : fixes navigation**
- `pauseAll()` : `spIframe.src = 'about:blank'` (emp??che iframe SP de charger la page courante)
- Homepage : `playSC()` appel?? m??me sur `/` (les iframes resetent via `adoptNode` m??me avec `transition:persist`)
- SC restore : `scIframe.onload = () => setTimeout(initSCWidget, 500)` + fallback 3000ms

**Commit `04d0c8e` ??? v9 : qualit?? + dark embed**
- `w.__hamcatNavigating` flag dans `astro:before-preparation` ??? guard dans PAUSE handler
- `widget.unbind()` pour les 4 ??v??nements avant rebind (handlers accumul??s)
- `updateSCInfo(sound)` helper : titre + artwork depuis SC API ??? affich?? dans transport bar
- Mute SC via `widget.setVolume(0/100)` + flag `__scMuted`
- Embed SC : filtre dark `invert(0.88) hue-rotate(195deg) saturate(0.55)`
- Embed SC cach?? par d??faut, toggle via bouton `???`

### R??sultat observ??
- ??? Lecture SC site-wide (avec coupure in??vitable au changement de page, ~500ms)
- ??? Reprise au bon track et ?? la bonne position
- ??? Transport bar fonctionnelle (play/pause/scrubber/mute)
- ??? Titre + pochette SC dans le player
- ??? Embed SC sombre, cach?? par d??faut
- ?????? Spotify embed : ?? tester post-deploy
- ?????? Coupure inter-pages : limitation browser (iframe reset sur adoptNode), non r??ductible davantage

### SSH VPS ??? note importante
- Cloud container Anthropic : bloqu?? par firewall OCI sur tous les ports
- Desktop Commander Windows : ??galement bloqu?? (egress allowlist)
- Solution : Fx ex??cute les commandes SSH depuis son propre PowerShell avec `ssh fx-vps`
- Cl?? fonctionnelle : `C:\Users\FX\.ssh\oracle_hermes_ed25519` (alias `hamcat-m2` dans authorized_keys)
- Ne jamais faire `ssh ubuntu@129.151.240.139` directement (pas de cl?? par d??faut sur Windows)

### Prochaine session
1. Tester embed Spotify post-deploy v9
2. V??rifier le toggle embed SC (bouton ???)
3. Explorer r??duction de la coupure inter-pages (preload iframe avant navigation ?)

---

## SESSION 2026-09-11 — Player SC : bug "pause à l'ouverture d'une facette" RÉSOLU (v1.14 → v1.21)

### Vraie cause (v1.21)
- Depuis la platine, une facette s'ouvre dans **l'iframe modale** (`#modal-iframe`, `href + '?modal=1'`), pas par navigation.
- La page modale charge le BaseLayout complet → **2e instance du script player** → lit le localStorage partagé (`scPlaying=true`) → `playSC()` → 2e widget SoundCloud invisible (`#hamcat-player{display:none}` en modal) avec `auto_play` → conflit de session audio (iOS : un seul média) → **PAUSE du SC parent**.
- Swipe facette→facette dans la modale = reload de l'iframe modale → rebelote, invisible depuis le parent.
- **Fix** : en mode embarqué (`?modal=1` ou `window.top !== window` same-origin), le script player `return` immédiatement et relaie `hamcat:play` au `window.parent.document` → le player vit uniquement dans la page parente. Vérifié : `__hamcat` null dans la modale, aucun PAUSE parent, bouton play de `/son` en modale → player parent.

### Pourquoi 24h de tâtonnement (v1.14 → v1.19)
- **Instrumentation aveugle** : Eruda s'accrochait dans `<body>`, remplacé à chaque vraie navigation → aucun log de navigation n'a jamais été observé ; chaque log envoyé était un chargement de page ou une ouverture de modale, interprété à tort comme une navigation View Transitions.
- Les guards `__hamcatNavigating` / `navEndTime` / `playSeq` / `wasPlaying` / grace-check `widget.play()` traitaient des symptômes inexistants et, à partir de v1.12/v1.16, `widget.play()` post-nav aggravait le problème. **Code mort à nettoyer.**

### Trouvaille annexe réelle (v1.20) — conservée
- `transition:persist` **ne protège pas une iframe** : le swap Astro fait `oldBody.replaceWith(newBody)` → iframe détachée → browsing context détruit → SoundCloud rechargé à chaque navigation VT (prouvé : event `load` de l'iframe refire ; Astro 5.16.4 `swap-functions.js`).
- **Fix** : swap custom via `astro:before-swap` (`e.swap = …`) réutilisant `swapFunctions.{deselectScripts,swapRootAttributes,swapHeadElements,saveFocus}` ; `document.body` conservé, nouveau contenu inséré autour des nœuds persistants (`[data-astro-transition-persist]` enfants directs + `[data-hmc-keep]`) sans jamais les déplacer. Vérifié : 0 reload d'iframe sur 4 navigations. Utile pour la nav clavier ←→ et l'accès direct aux facettes.
- Retiré au passage : `widget.play()` à 150ms + `isPaused` à 2s dans `astro:page-load` (chemin "widget vivant").

### Instrumentation fiable (v1.20b) — conservée
- `?dbg=1` collant via `sessionStorage['hmc-dbg']` ; `?dbg=0` coupe et vide le journal.
- Eruda dans un conteneur `data-hmc-keep` → **survit aux navigations**.
- `hmcLog()` : journal `sessionStorage['hmc-log']` (80 entrées, timestamp + path), rejoué en `[HMC] HISTORY` au chargement ; `INIT navType=…` distingue reload / navigation ; logs `before-prep`, `custom swap ok`, `after-swap`, `⚠ SC iframe (re)loaded` (ne doit apparaître qu'au 1er chargement).

### Méthode qui a débloqué
- Lire le code complet plutôt que patcher par anchors ; vérifier les hypothèses **dans le navigateur intégré** (Claude Browser : `javascript_tool`, sonde `load` sur l'iframe, `astro:before-swap` prototypé en live avant déploiement).
- Build `npx astro build` sur le VPS avant chaque push.

### Reste à faire
1. **Nettoyage code mort** player : `__hamcatNavigating`, `__hamcatNavEndTime`, `__hamcatPlaySeq`, `__hamcatWasPlaying`, `__hamcatPlayTimeout`, timer 1500ms dans page-load, logs `navigating=` dans PLAY.
2. **Reload de `/` sur iOS** : restauration SC avec `auto_play=true` → bloqué par iOS → PLAY/PAUSE ×2 → UI pause. Restaurer position sans autoplay sur mobile (UI en pause, un tap relance).
3. iPad Firefox : voile devant le texte du disque + facettes qui disparaissent près du haut (visuel, non lié).
4. Reliquat log précédent : tester embed Spotify, toggle embed SC, `blog/` directory pour la collection.

### Commits
- `f493a7c` v1.19 · `97b49a6` v1.20 swap custom · `9575395` v1.20b instrumentation · `04e5008` v1.21 mode embarqué (fix)

---

## NOTE — Player + sélecteur site-wide (v2, pas encore implémenté)

Idée posée par Fx le 2026-09-11, à garder pour une prochaine session de conception.

### Vision
- Le player bottom bar reste (position actuelle, `#hamcat-player`, `transition:persist`).
- **2 panneaux latéraux hide/show**, indépendants de la platine et des pages facettes — accessibles depuis n'importe où sur le site (pas ancrés au disque) :
  - **Gauche** : panneau SoundCloud (sets/mixes)
  - **Droite** : panneau Spotify (playlists)
- Chaque panneau = **sélecteur curé**, pas un embed brut du profil complet. Toutes les releases/playlists existent en base, mais Fx choisit lesquelles apparaissent dans le panneau (logique déjà utilisée : toggle CMS par item).

### Annotations par release (à terme, pas prioritaire)
- **SoundCloud (par set)** : commentaire libre — anecdote, historique, contexte de l'événement où le set a été joué, + médias liés (flyer, photos/vidéos de l'événement).
- **Spotify (par playlist)** : note personnelle simple.
- Implique un champ `note` (markdown/texte) + `media` (liste d'images/vidéos, probablement R2 comme les autres assets) sur chaque item curé.

### Pistes d'architecture (à challenger en session dédiée, pas figées)
- Nouvelle collection CMS (Sveltia) : `curated_soundcloud.json` / `curated_spotify.json` — liste d'objets `{ id, title, url|playlistId, cover, curated: bool, note?, media?[] }`. Cohérent avec le pattern existant (JSON par facette, édité via `/admin`).
- Panneaux = éléments `transition:persist` dans `BaseLayout.astro`, au même niveau que `#hamcat-player` — le swap custom v1.20 les garderait automatiquement (ajout à la liste des nœuds persistants ou `data-hmc-keep`), donc pas de rechargement en changeant de page pendant qu'un panneau est ouvert.
- Réutilise l'event `hamcat:play` existant (`{type, url|playlistId, lbl}`) déclenché depuis les items du panneau — zéro nouvelle plomberie côté lecture, juste la UI de sélection.
- Question ouverte à trancher ensemble : les panneaux affichent-ils juste une liste cliquable (déclenche le player bottom), ou un embed inline par item (plus lourd, iframe par item) ? Vu l'historique du bug player, privilégier la liste cliquable qui réutilise le seul widget SC/Spotify existant plutôt que multiplier les iframes.

### Statut
Idée capturée, non planifiée. Prochaine étape : brief détaillé (UI panneaux, structure CMS, wireframe) avant tout code.

## v1.23 — Player Spotify reel (IFrame API), fix "deux players deconnectes" — 2026-09-11

### Contexte
Fx signale via screenshot : sur `/son`, deux UIs de lecture Spotify coexistent et sont desynchronisees — la barre custom (play/pause/mute/scrub) affiche un faux etat "playing" fige, pendant que l'embed natif Spotify (iframe) joue reellement en preview 30s, sans lien avec nos boutons.

### Root cause
`playSpotify()` ne faisait que poser un `src` sur un `<iframe>` et appeler `updateUI('playing', ...)` de facon optimiste — aucune API de controle Spotify n'etait utilisee. Les handlers play/pause-btn et mute-btn n'avaient tout simplement pas de branche `spotify` : ces boutons ne faisaient rien quand Spotify etait la source active. Le "player" visible et fonctionnel etait en realite l'UI native Spotify (limitee a 30s de preview pour les embeds non authentifies — restriction plateforme Spotify, non contournable cote code).

### Fix
- Ajout du script `https://open.spotify.com/embed/iframe-api/v1` dans le `<head>`.
- `sp-embed` : `<iframe>` -> `<div>` conteneur (l'IFrame API injecte son propre iframe dedans ; confirme en prod que le div est remplace par un vrai iframe Spotify).
- Nouveaux helpers `getSpotifyIframeAPI()` / `ensureSpController(uri)` — pattern singleton `window.__spController` (meme logique que `window.__scWidget` pour SoundCloud), pour survivre aux navigations Astro (soft nav).
- `playSpotify()` reecrit : `controller.loadUri()` + `.play()` au lieu d'un simple `src=`.
- `pauseAll()`, play-btn, mute-btn, scrubber : branches `spotify` ajoutees, cablees sur `controller.pause()/togglePlay()/setVolume()/seek()`.
- Event `playback_update` du controller -> sync reel de l'UI (icone play/pause, largeur scrubber, temps ecoule/duree, `classList.toggle('playing', ...)`, `navigator.mediaSession`).
- **Bug auto-detecte avant deploiement** : le passage `sp-embed` iframe->div cassait silencieusement la detection de restauration apres navigation (`state.spIframe?.src?.includes('open.spotify.com')` — un div n'a pas de `.src` pertinent), ce qui aurait fait rejouer `playSpotify()` (donc `pauseAll()` + reload complet) a chaque changement de page, reintroduisant cote Spotify le bug de coupure deja corrige cote SC en v1.19-1.21. Corrige en testant `(w as any).__spController` a la place.

### Verification live (production, hamcat.live/son)
- `fx_jam_v1.23` confirme charge.
- Clic sur une playlist Spotify -> `__spController` cree, `playback_update` recu (duree ~29.7s, coherent avec la limite preview Spotify).
- Bouton play/pause custom -> pause et reprise reelles, confirmees via `playback_update` (icone + classe `playing` synchronisees).
- Bouton mute custom -> `setVolume(0)`/`setVolume(1)` reel, confirme.
- Reload complet de page pendant lecture -> restauration correcte de l'etat sauvegarde (recree un controller propre, meme playlist).
- Build `npx astro build` sans erreur avant deploiement.

### Limite connue (non fixable cote code)
Les embeds Spotify non authentifies sont limites a 30s de lecture par Spotify lui-meme (restriction plateforme, meme comportement sur n'importe quel site tiers utilisant l'IFrame API sans OAuth utilisateur). Communique a Fx.

### Deploiement
Commit `5c4ef0c` (rebase sur `8bd55b1` — sync Spotify nocturne + CMS UX deja en remote), push -> Cloudflare Workers, deploye et verifie en prod.


## v1.24 — Fix mute Spotify casse + panneau natif visible par defaut — 2026-09-11

### Contexte
Suite au v1.23 (Spotify pilote via IFrame API), Fx signale que le play/pause et la seek bar fonctionnent mais pas le mute, et que l'embed natif Spotify reste visible par defaut (au lieu d'etre masque comme pour SoundCloud), avec son propre bandeau "extrait" + invitation a ouvrir Spotify.

### Root cause
- Inspection directe de `window.__spController` en prod : l'API embed IFrame de Spotify n'expose **aucune methode `setVolume`** (liste complete verifiee : `setIframeDimensions, onWindowMessages, addListener, ..., play, playFromStart, restart, pause, resume, togglePlay, seek, ...` — pas de volume). Le mute v1.23 appelait une methode inexistante, echouait silencieusement (`catch (_) {}`).
- `playSpotify()` appelait `showEmbed()` mais jamais `hideEmbedZone()`, contrairement a `playSC()` — regression/oubli, le panneau natif restait donc `display:block` en permanence.

### Fix
- Bouton mute desactive pour la source Spotify (`disabled`, opacite reduite, tooltip explicatif) plutot que silencieusement casse — honnete sur une limitation plateforme non contournable.
- `playSpotify()` appelle desormais `hideEmbedZone()` juste apres `showEmbed()`, comme `playSC()`.

### Deploiement
Commit `24407d2`, deploye et verifie en prod (panneau natif masque par defaut, bouton mute grise avec tooltip).

## v1.25 — Fix toggle panneau Spotify (ne reagissait plus au clic) — 2026-09-11

### Contexte
Suite au v1.24, Fx signale que le bouton toggle (▲/▼) ne fait plus rien pour Spotify : le panneau natif ne se rouvre pas au clic.

### Root cause
Le handler de toggle Spotify datait d'avant le v1.24 : il ne touchait que la hauteur du panneau (166↔352px, mode "toujours visible, juste plus grand"), jamais `display`. Comme le v1.24 masque desormais le panneau par defaut (`display:none`), cliquer sur toggle changeait une hauteur sans jamais repasser `display` a `block` — aucun effet visible.

### Fix
Toggle Spotify reecrit pour un vrai show/hide (`display: none ↔ block`), sur le meme modele que SoundCloud.

### Deploiement
Commit `ada99fd`, deploye et verifie en prod (toggle ouvre/ferme reellement le panneau, lecture non affectee).

## v1.26 / v1.26b — OAuth Spotify (PKCE) + Web Playback SDK, full playback pour comptes Premium connectes — 2026-09-11

### Contexte
Fx demande si un "vrai" player Spotify sans la limitation 30s est possible. Recherche confirmee : meme connecte en Premium dans le navigateur, l'embed IFrame reste limite a l'extrait (teste et confirme par Fx : "1 c'est toujours un preview"). Seule voie fiable : Web Playback SDK + OAuth utilisateur (obligatoirement Premium). Disclaimer donne a Fx sur les conditions Spotify (usage non-commercial, pas de sync/broadcast) — risque accepte explicitement ("je suis chaud qu'on essaye").

Fx precise avant implementation : ne pas ancrer le redirect OAuth sur `/son` (facette pas gravee, le player deviendra site-wide) → utilise le redirect URI deja enregistre sur l'app existante, la racine `https://hamcat.live`.

### Implementation
- **PKCE côté client** (`spStartAuth`, `spExchangeCode`, `spRefreshToken`) — pas de client secret expose, `code_verifier`/`code_challenge` (SHA-256 + base64url), scopes `streaming user-read-email user-read-private user-modify-playback-state`.
- Tokens stockes dans `localStorage` (`hamcat-spotify-auth`), refresh automatique a l'expiration (`spGetValidToken`).
- **Web Playback SDK** (`sdk.scdn.co/spotify-player.js`) — singleton `spEnsureWebPlayer()` (pattern deja utilise pour `__scWidget`/`__spController`), cree un vrai device Spotify Connect (`w.__spWebPlayer` / `w.__spDeviceId`), ecoute `player_state_changed` pour synchroniser l'UI (play/pause, scrubber, titre/artiste/pochette, MediaSession) exactement comme pour SC/preview.
- `spPlayFull()` demarre la lecture sur ce device via l'API Web (`PUT /me/player/play?device_id=...`).
- `playSpotify()` tente desormais le full playback si un token existe, avec **fallback automatique** vers l'embed IFrame preview (`playSpotifyPreview()`, ex-`playSpotify()`) si pas Premium ou erreur SDK.
- Bouton "Connexion Spotify" (visible uniquement source=spotify + non-connecte) declenche `spStartAuth()`.
- Retour du redirect OAuth (`?code=...` sur la racine) : echange automatique + relance en full playback si une lecture Spotify etait deja sauvegardee (`localStorage hamcat-player`).
- Mute redevient possible en mode full playback (SDK expose bien le volume, contrairement a l'IFrame API).
- **v1.26b (fix immediat)** : le script SDK appelle `window.onSpotifyWebPlaybackSDKReady()` des son chargement sans verifier son existence → `Uncaught ... is not defined` detecte en verification live. Fix : stub no-op pose dans le `<head>` avant le chargement du script ; `spEnsureWebPlayer()` detecte ensuite `window.Spotify` deja pret et demarre directement.

### Limite connue (a communiquer a Fx)
L'app Spotify `hamcat.live` (Client ID `f10100812b4146f199243927da29d982`) est en **Development mode** : seuls les comptes explicitement ajoutes sous "User Management" dans le dashboard Spotify (25 max) peuvent terminer l'OAuth, jusqu'a approbation d'un Extended Quota Mode par Spotify. Fx doit s'ajouter lui-meme pour tester.

### Verification live (hamcat.live/son)
- `fx_jam_v1.26` confirme charge, `window.Spotify` present, aucune erreur console apres fix v1.26b.
- Bouton "Connexion Spotify" declenche une redirection vers `accounts.spotify.com` avec une URL PKCE bien formee (`redirect_uri=https://hamcat.live`, `client_id`, `code_challenge_method=S256`, scopes corrects) — verifie via inspection directe de `location.href`, sans completer de connexion (hors perimetre de l'agent : identifiants).
- Build `npx astro build` sans erreur avant chaque deploiement.
- Connexion effective par un compte Premium reel reste a valider par Fx lui-meme.

### Deploiement
Commits `fe8853c` (v1.26) puis `7ecdbe7` (v1.26b, fix), push -> Cloudflare Workers, deployes et verifies en prod.

### Commits
- `24407d2` v1.24 · `ada99fd` v1.25 · `fe8853c` v1.26 · `7ecdbe7` v1.26b


## v1.27 — Prev/next, like/add to library, titre-artiste cliquable (full playback SDK) — 2026-09-12

### Contexte
Fx confirme le full playback fonctionnel (mute inclus). Comme aucune interface de parcours de playlist n'existe encore en mode SDK (le toggle embed a ete retire en v1.26c faute d'iframe a montrer), Fx demande une integration Web Playback SDK aussi complete que possible en attendant une interface custom dediee : piste precedente/suivante, ajouter a la bibliotheque / aimer, et un lien titre-artiste vers la fiche Spotify du morceau en cours.

### Implementation
- Boutons `#btn-sp-prev` / `#btn-sp-next` de part et d'autre du bouton play, cables sur `player.previousTrack()` / `player.nextTrack()` (natifs au Web Playback SDK).
- Bouton `#btn-sp-like` (♡/♥) — "aimer" et "ajouter a la bibliotheque" sont la meme action cote Spotify (`PUT/DELETE /v1/me/tracks`) : `spToggleLike()` + `spCheckLiked()` (verifie l'etat au changement de piste via `GET /v1/me/tracks/contains`).
- Nouveaux scopes OAuth requis : `user-library-read user-library-modify`, ajoutes a `SP_SCOPES` — **les comptes deja connectes avant ce patch doivent se reconnecter** (`spDisconnect()` puis nouveau `spStartAuth()`) pour obtenir un token avec les scopes etendus.
- `#player-title` : `<span>` -> `<a target="_blank">`, texte "Artiste — Titre", `href` vers `https://open.spotify.com/track/{id}` — mis a jour a chaque `player_state_changed`. Cliquable uniquement quand une info de piste est disponible (`removeAttribute('href')` sinon).
- Ces trois elements (prev/next/like) restent `hidden` hors full playback SDK (meme logique que le bouton connexion, centralisee dans `updateSpotifyConnectBtn()` qui teste `w.__spWebPlayer && w.__spDeviceId`), et se re-cachent au clic sur fermer (`#btn-close`).

### Verification live (hamcat.live/son)
- `fx_jam_v1.27` confirme charge, `#btn-sp-prev` / `#btn-sp-next` / `#btn-sp-like` presents dans le DOM, `#player-title` bien un `<a>`.
- Aucune erreur console apres l'init sur ce nouveau chargement.
- Build `npx astro build` sans erreur avant deploiement.
- Comportement reel des boutons (prev/next/like) avec un compte Premium connecte reste a valider par Fx (l'agent ne peut pas s'authentifier avec de vrais identifiants Spotify).

### Deploiement
Commit `74c2b60`, push -> Cloudflare Workers, deploye et verifie en prod.


## v1.28 — Fix titre invisible dans le player sur mobile — 2026-09-12

### Contexte
Fx confirme que prev/next/play/pause/scrubber/mute fonctionnent bien apres le v1.27, mais signale que le nom du titre/artiste n'apparait pas dans le player sur mobile.

### Root cause
Diagnostic via inspection live du DOM en viewport mobile (375px) : `#player-title` avait bien le bon `textContent`, mais une largeur rendue de **0px**. `.player-full` est une rangee flex avec beaucoup d'elements a largeur fixe (pochette, badge source, boutons prev/next/play/next/mute/like, temps, bouton connexion Spotify). Sur mobile, la somme de ces largeurs fixes depasse la largeur du viewport. `.player-scrubber` a un `min-width: 80px` qui l'empeche de retrecir sous ce seuil — resultat : toute la pression de retrecissement retombe sur `.player-meta` (le conteneur du titre, `min-width: 0`), qui se fait ecraser a 0px. Le titre existait, il n'avait simplement plus aucune place pour s'afficher.

### Fix
Media query mobile (`max-width: 480px`) qui degage de la place plutot que de laisser le titre payer tout le prix :
- Masque la pochette (`#player-artwork`) et le badge source (`#player-source-badge`, redondant avec l'icone ▶ / le contexte).
- Masque le texte du temps (`#player-time`).
- Boutons transport plus compacts (padding/`font-size` reduits).
- Bouton "Connexion Spotify" plus compact (police/padding reduits).
- `.player-meta` recoit un `min-width: 64px` explicite (au lieu de 0) et `.player-scrubber` un `min-width: 30px` (au lieu de 80px) — le titre garde toujours un minimum de place garanti.

### Verification live (hamcat.live/son, viewport 375px)
- `fx_jam_v1.28` confirme charge.
- `#player-title` : largeur rendue 64px (etait 0px avant fix), texte visible.
- Pochette / badge / temps bien masques en dessous de 480px ; scrubber toujours fonctionnel (~63px).
- Build `npx astro build` sans erreur avant deploiement.

### Deploiement
Commit `3579b14`, push -> Cloudflare Workers, deploye et verifie en prod.

### Commits
- `74c2b60` v1.27 · `3579b14` v1.28


## v1.29 — Prev/next fonctionnels sur ecran de veille / notifications — 2026-09-12

### Contexte
Fx confirme le titre visible sur mobile (v1.28), puis signale que les boutons precedent/suivant (et like) du player Spotify ne font rien depuis l'ecran de veille / la barre de notifications du telephone (les controles OS, pas ceux du player dans la page).

### Root cause
Ces controles systeme passent par la Media Session API du navigateur (`navigator.mediaSession`), qui n'agit que si on lui fournit des `setActionHandler`. Le code Spotify SDK ne renseignait que `metadata` et `playbackState` — jamais de handler `play` / `pause` / `previoustrack` / `nexttrack`. Les seuls handlers poses dans tout le fichier l'etaient par le widget SoundCloud (`play`/`pause`/`stop`), donc en mode Spotify l'OS n'avait tout simplement aucune action a declencher pour precedent/suivant.

### Fix
`setActionHandler('play'|'pause'|'previoustrack'|'nexttrack', ...)` ajoutes des la creation du device Spotify Connect (`spEnsureWebPlayer()`, listener `ready`), branches sur les methodes natives du SDK (`player.resume()`, `player.pause()`, `player.previousTrack()`, `player.nextTrack()`).

### Limite (a communiquer a Fx)
Le "like" ne peut pas etre expose sur l'ecran de veille / la notification : la Media Session API ne definit tout simplement aucune action "like" / "favorite" (liste fermee : play, pause, seekbackward, seekforward, seekto, previoustrack, nexttrack, skipad, stop, togglemicrophone, togglecamera, hangup) — ce n'est pas une limitation hamcat.live mais du standard web lui-meme, sur toutes les plateformes. Le like reste disponible dans le player sur la page (bouton ♡/♥).

### Verification live (hamcat.live/son)
- `fx_jam_v1.29` confirme charge.
- Build `npx astro build` sans erreur avant deploiement.
- Fonctionnement reel des boutons prev/next depuis l'ecran de veille / la notification (avec un compte Premium connecte) reste a confirmer par Fx sur son telephone.

### Deploiement
Commit `2155a1a`, push -> Cloudflare Workers, deploye et verifie en prod.

### Commits
- `3579b14` v1.28 · `2764f4d` docs · `2155a1a` v1.29


## v1.30 — Titre et artiste sur 2 lignes distinctes dans le player — 2026-09-12

### Contexte
Fx confirme le prev/next fonctionnel sur ecran de veille/notifications (v1.29), puis signale que le player n'affiche que le nom du morceau, pas l'artiste.

### Root cause
En mode Spotify full playback, `#player-title` affichait "Artiste — Titre" concatene dans **une seule ligne** avec troncature (`text-overflow: ellipsis; white-space: nowrap`). Selon la largeur disponible (surtout apres la compaction mobile du v1.28) et la longueur relative des deux chaines, l'un des deux elements pouvait dominer visuellement ou etre coupe. Cote SoundCloud, c'etait pire : le nom de l'artiste (`sound.user.username`) n'etait meme jamais pose sur le player — seulement transmis a la Media Session (lock screen), jamais affiche a l'ecran.

### Fix
Titre et artiste separes en deux lignes independantes dans `.player-meta`, chacune avec sa propre troncature (comme l'app Spotify officielle) :
- Nouvelle ligne `.player-meta-sub` sous `#player-title`, contenant `#player-artist` (nouveau) + le badge source existant (`#player-source-badge`).
- Spotify SDK (`player_state_changed`) : `#player-title` ne recoit plus que le titre, `#player-artist` recoit l'artiste separement.
- SoundCloud (`updateSCInfo`) : `#player-artist` est desormais renseigne sur le player (avant : uniquement dans `MediaMetadata`, invisible a l'ecran).
- Les deux lignes restent toujours lisibles independamment de la longueur de l'autre, y compris sur mobile (media query v1.28 inchangee, l'artiste garde sa place).

### Verification live (hamcat.live/son)
- `fx_jam_v1.30` confirme charge.
- Test SoundCloud (sans authentification requise) : `#player-title` = "Sky-Hop Beats (Open Mic Chill Session @ Marliave 02/09/21)", `#player-artist` = "Hamcat" — les deux visibles simultanement, chacun sur sa ligne.
- Build `npx astro build` sans erreur avant deploiement.
- Rendu reel cote Spotify (compte Premium connecte) reste a confirmer par Fx.

### Deploiement
Commit `8425999`, push -> Cloudflare Workers, deploye et verifie en prod.

### Commits
- `3579b14` v1.28 · `2155a1a` v1.29 · `8425999` v1.30


## v1.31-v1.33 — Fix pochette SoundCloud filtree + prev/next SoundCloud — 2026-09-12

### Contexte
Fx confirme le titre/artiste en 2 lignes (v1.30), signale un bug visuel sur la pochette SoundCloud filtree sur mobile (petit artwork normal dans un grand artwork delave, capture a l'appui), et demande si les fonctionnalites manquantes de l'embed SoundCloud (previous/next, like...) peuvent etre ajoutees comme pour Spotify.

### Root cause (pochette filtree, v1.31)
L'iframe SoundCloud recoit un filtre CSS (`invert(0.88) hue-rotate(195deg) saturate(0.55)`) pour recolorer son UI blanche au theme sombre du site. Comme ce filtre delave aussi la pochette (photo), un `<img>` `#sc-art-overlay` sans filtre est superpose dessus pour la restaurer. Sa taille etait hardcodee a 72x72px — mesure en direct (captures + zoom), le widget SC natif affiche en realite sa pochette a ~148px de cote dans une iframe de 166px de haut. L'overlay ne couvrait donc que le coin superieur gauche, laissant le reste de la pochette visible avec le filtre delave tout autour.

### Fix (v1.31)
`#sc-art-overlay` porte a 150x150px (position `top:8px;left:8px` inchangee, deja bien alignee) — couvre desormais l'integralite de la pochette native.

### Prev/next SoundCloud (v1.32 + fix v1.33)
Le SC Widget JS API expose nativement `.prev()` / `.next()` sur une iframe playlist — pas besoin d'OAuth SoundCloud pour ca (contrairement a "like", voir plus bas). Boutons `#btn-sp-prev`/`#btn-sp-next` (deja crees pour Spotify) rendus generiques aux deux sources :
- Visibles en SoundCloud (widget pret) en plus du mode full playback Spotify.
- Handlers de clic : branche SoundCloud (`widget.prev()`/`widget.next()`) ajoutee a cote de la branche Spotify SDK existante.
- Media Session (ecran de veille/notifications) : `setActionHandler('previoustrack'/'nexttrack', ...)` ajoutes cote SoundCloud, meme logique que le fix v1.29 pour Spotify.
- **v1.33 (fix immediat)** : les boutons restaient caches en permanence apres le v1.32 — `playSC()` appelle `updateUI(..., 'soundcloud')` *avant* que le widget ne soit charge (`w.__scWidget` explicitement `null` a ce moment), donc la condition de visibilite etait toujours evaluee a false. Fix : `updateSpotifyConnectBtn('soundcloud')` rappele une fois le widget reellement pret (dans `initSCWidget`).

### Limite (a communiquer a Fx) — "like" SoundCloud
Le bouton like ne peut pas etre ajoute a l'embed SoundCloud sans une **vraie connexion OAuth SoundCloud** (un flow separe et distinct de celui de Spotify, nouvelle inscription app sur SC, nouveau bouton "Se connecter a SoundCloud", nouveaux appels a l'API SC `/likes/tracks/{id}`) — le SC Widget JS API n'expose aucune methode "like". C'est un projet a part entiere, pas juste un bouton en plus ; a valider avec Fx avant de s'y lancer.

### Verification live (hamcat.live/son, viewport 375px)
- `fx_jam_v1.33` confirme charge.
- `#sc-art-overlay` : 150x150px, couvre la pochette native en entier (verifie via capture + zoom pixel).
- Prev/next SoundCloud : boutons visibles, clic sur "suivant" change reellement de piste (titre verifie avant/apres : "Sky-Hop Beats..." -> "Psydub Mix @ Spiritus Silvam festival...").
- Build `npx astro build` sans erreur avant chaque deploiement.

### Deploiement
Commits `5f7d53c` (v1.31+v1.32) puis `dbf8227` (v1.33, fix), push -> Cloudflare Workers, deployes et verifies en prod.

### Commits
- `8425999` v1.30 · `5f7d53c` v1.31+v1.32 · `dbf8227` v1.33


## v1.34 — Shuffle + repeat Spotify (full playback) — 2026-09-12

### Contexte
Fx demande si d'autres fonctionnalites du SDK Spotify sont disponibles (exemple cite : shuffle). Choix retenu apres question : shuffle + repeat, oui ; le reste (queue, transfert d'appareil...) pas demande pour l'instant.

### Implementation
- Boutons `#btn-sp-shuffle` (🔀, avant precedent) et `#btn-sp-repeat` (🔁/🔂, apres suivant), visibles uniquement en full playback Spotify (meme logique que like) — masques sur mobile (`@media max-width:480px`) pour ne pas surcharger une barre deja compacte, prev/next/play/mute/like restant prioritaires sur petit ecran.
- Le Web Playback SDK ne pilote pas shuffle/repeat directement : `spSetShuffle()` / `spSetRepeat()` appellent l'API Web Spotify (`PUT /me/player/shuffle`, `PUT /me/player/repeat`) avec le `device_id` du player — aucun nouveau scope OAuth requis (`user-modify-playback-state` deja present couvre ces endpoints).
- Etat reflete automatiquement via `player_state_changed` (le SDK renvoie `st.shuffle` et `st.repeat_mode` a chaque changement) : bouton shuffle colore (`--facet-son`) quand actif, bouton repeat colore + icone 🔂 en mode "repeter la piste".

### Verification live (hamcat.live/son)
- `fx_jam_v1.34` confirme charge, `#btn-sp-shuffle` et `#btn-sp-repeat` presents dans le DOM.
- Build `npx astro build` sans erreur avant deploiement.
- Comportement reel (toggle shuffle, cycle repeat) avec un compte Premium connecte reste a valider par Fx.

### Deploiement
Commit `edc3020` (rebase sur `4959cc9`, sync automatique des playlists Spotify entre-temps), push -> Cloudflare Workers, deploye et verifie en prod.

### Commits
- `5f7d53c` v1.31+v1.32 · `dbf8227` v1.33 · `edc3020` v1.34
