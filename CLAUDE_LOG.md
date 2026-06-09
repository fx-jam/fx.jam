# CLAUDE_LOG.md — Journal de bord hamcat.live

> **Journal chronologique des sessions de travail.** Une entree par session : ce qui a ete fait, decide, ou laisse en cours.
> Ne decrit PAS l'etat courant du projet (role de PLAN.md) ni l'architecture (role d'ARCHITECTURE.md). C'est la memoire partagee entre les instances (Fx, Claude chat web, Claude Code).
>
> **Rituel** : lire ce fichier en debut de session, y ajouter une entree en fin de session.
> **Convention** : entrees anti-chronologiques (plus recente en haut). Pas de secrets ici (acces dans .claude/access.local.md, non versionne).

---

## Session 09/06/2026 — CMS complet : zéro texte hardcodé (feat/cms-complet)

**Branche** : `feat/cms-complet` — EN ATTENTE DE VALIDATION avant merge sur main.

**Fait** : execution integrale du brief `brief-cms-complet.md` en 5 etapes, chacune commitee et pushee.

1. **JSON enrichis** : son/regie/cours/outils/contact.json recus les champs `label`, `teaser`, `headline`, `note_stub` (+ `genres` pour son, `email` pour contact). Valeurs initiales reprises depuis facets.ts.
2. **facets.ts** : importe les 5 JSON, utilise `data.label || 'fallback'` et `data.teaser || 'fallback'` pour chaque facette (sauf Blog hardcode, pas de JSON blog).
3. **son.astro** : importe son.json, remplace `<h1>DJ & Live</h1>` et `<p>psytrance...` par `{sonData.headline}` et `{sonData.genres?.join(' · ')}`. Affiche `bio` si renseignee.
4. **StubPage.astro** : importe les 4 JSON (regie/cours/outils/contact), dataMap par facette, utilise `d.label`, `d.teaser`, `d.note_stub` avec fallback sur facets.ts.
5. **config.yml** : champs `label`, `teaser`, `headline`, `note_stub` ajoutes dans chaque sous-collection donnees-site ; `genres` (list) ajoute pour Son.

**Build** : 8 pages, zero erreur (verifie apres chaque etape).

**Verification finale a faire avant merge** :
- hamcat.live/admin → chaque facette affiche ses champs label/teaser/headline editables
- Valider visuellement que son.astro et les stubs affichent bien le contenu des JSON

---

## Session 09/06/2026 — Maintenance : responsive Son + docs + nettoyage

**Branche** : `fix/maintenance-09-06` → mergee sur main.

**Fait** : execution du brief `brief-maintenance-09-06.md`.

1. **Responsive grille gigs** (`son.astro`) : media query < 640px → 3 colonnes (80px 1fr 44px), venue + genres masques ; media query < 420px → 2 colonnes (1fr 44px), date masquee aussi.
2. **CLAUDE.md mis a jour** : "platine vinyle" → "jog" dans la description projet ; "Enseignement" → "Cours" dans la palette et la liste des facettes ; regle "validation avant merge" ajoutee apres la section Conventions design.
3. **CLAUDE_LOG.md** : entree 08/06 ajoutee (resumant jog-cd-mobile + jog-groupe2 + cms-complet).
4. **hamcat-live/** : dossier absent depuis la racine — rien a faire.

**Build** : 8 pages, zero erreur.

---

## Session 08/06/2026 — Jog complet + CMS etendu

### Travaux realises

**Jog CD mobile-first — feat/jog-cd-mobile (merged) :**
- Disque responsive : --disk-size = min(90vw, 85vh, 560px), RING_R dynamique en JS
- Conic-gradient irise : transform rotate sur .disk, --disk-rotation mis a jour a chaque frame
- Indicateur fixe triangulaire (.disk-indicator) hors du disque, colore par facette active
- Drag souris : mousedown/mousemove/mouseup, logique atan2 identique au tactile
- Tap hors .disk-center → setState(0), tap souris identique
- disk-track invisible : background transparent, border none
- "Cours" remplace "Enseignement" dans tout le systeme (key, label, token CSS, cours.astro)
- Scale unifie : scale(0.70 + 0.90 * proximity), font-size graduelle calc(0.44rem + 0.28rem * proximity)
- Pastille .is-active : scale: 1.6 supprime (conflictuait avec scale dans transform)

**Jog Groupe 2 — feat/jog-groupe2 (merged) :**
- Tokens --facet-* : 6 teintes oklch equidistantes (~60 deg spectre, ex: son=oklch(0.65 0.22 25))
- Conic-gradient : spectre oklch pur 10%, color-mix(in oklch) → transitions douces sans secteurs
- Pastilles en arc : --text-rotation = norm + flip demi-inferieure (texte droit en 12h seulement)
- Inertie clavier : velAngle = STEP * 0.35 injecte avant snapToFacet()
- Drag etat 1 : setState(1, activeIdx) si facette change pendant le drag

**CMS complet — feat/cms-complet (merged) :**
- 6 fichiers JSON crees dans src/data/ : site.json + son/regie/cours/outils/contact.json
- config.yml : collection donnees-site avec profil global + 5 facettes editables dans Sveltia

### Architecture mise a jour
- Vision etat 2 gravee : grand cercle plein ecran, fond jog conserve, contenu riche par facette
- Vision etiquettes iridescentes notee (a concevoir)
- Cercle comme forme fondamentale : jog = petit cercle, pages = grands cercles
- Vocabulaire acte : etat 0 (jog libre), etat 1 (apercu facette), etat 2 (overlay plein ecran)
- Principe spectral acte : couleurs facettes = spectre oklch equidistant (preserver si reorg)

### Prochains chantiers
- Conception etat 2 (grand cercle) — session de conception avant tout code
- Etiquettes : rendu iridescent (vision a preciser)
- Facette Son : etoffer avec vrais contenus (bio, SoundCloud, photos)
- Remplir les JSON via hamcat.live/admin

---

## 2026-06-07 — Jog CD mobile-first : branche feat/jog-cd-mobile (session Claude Code)

**Branche** : `feat/jog-cd-mobile` — EN ATTENTE DE VALIDATION avant merge sur main.

**Fait** : execution complete du brief `brief-jog-mobile.md` (3 evolutions).

1. **Responsive mobile-first** : `--disk-size` calcule en JS (`Math.min(90vw, 85vh, 560px)`). `calcDiskSize()` + `applyDiskSize()` appeles a l'init et au resize (debounce 100ms). `RING_R_0` et `RING_R_1` deviennent des `let` recalcules dynamiquement. Les tailles du centre (29% du disque) et de l'ouverture (42%) suivent aussi automatiquement. Sur iPhone 390px : le disque tient entierement dans le viewport.

2. **Look CD iris** : `.disk` porte un `conic-gradient` arc-en-ciel (6 facettes couleurs, tout en tokens `color-mix()`). Le disque tourne via `--disk-rotation` mis a jour a chaque frame dans `update()`. Le `::before` (tick 12h) tourne naturellement avec le disque.

3. **Pastilles epurees** : padding `0.35rem 0.75rem`, `border-radius: 6px` (etiquette jog vs pill), `font-size: 0.55rem`, `letter-spacing: 0.20em`.

4. **Trou central approfondi** : `background: var(--bg-app)` (plus sombre que `--bg-elevated`) + bordure adoucie `color-mix(border 60%, transparent)`.

**Build** : passe sans erreur (8 pages). Zero hardcode couleur dans le diff (verifie par grep).

**A faire avant merge** : validation visuelle par Fx/Claude chat web sur navigateur (desktop + responsive 390px). Puis : supprimer `brief-jog-mobile.md`.

---

## 2026-06-05 (cloture) — Vision jog VALIDEE + brief maj doc pret

**Resume session** : CMS auth debloquee (voir entree dediee ci-dessous) ; vision du concept "jog" capturee et VALIDEE par Fx sans correction ; brief `brief-maj-doc.md` cree+committe pour que Claude Code mette a jour ARCHITECTURE.md (remplacer "platine vinyle" par "jog") et PLAN.md (etat juin 2026, jog mobile-first).

**Concept jog (resume)** : disque mi-CDJ/vinyle look CD epure (analog+digital) ; evite retro-vinyle ET CDJ utilitaire ; inertie physique + reactivite 1:1 ; symetrie radiale (trou central, 360/N) ; arc-en-ciel par DIFFRACTION irisee facon CD reel (pas d'aplats, demarrage simplifie possible) ; centre = trou = zone de contenu (navigation + contenu) ; MOBILE-FIRST prioritaire (peut impliquer de revoir Turntable.astro). Vision marquee evolutive.

**Prochaine session** :
1. Claude Code : executer `brief-maj-doc.md` (branche `docs/maj-architecture-jog`) -> maj ARCHITECTURE + PLAN, montrer diff avant merge.
2. Puis conception fine du jog en chat AVANT de coder (feeling inertie, prototype diffraction, strategie mobile-first).
3. Nettoyage : branches mergees (feat/import-gigs, feat/facette-son) ; dossier suspect `hamcat-live/` a la racine (investiguer avant suppression) ; ancien Client Secret GitHub obsolete a supprimer (hygiene).
4. Etoffer facette Son (bio, ecoute, visuels, presskit) — necessite contenus de Fx.
5. Graver convention "montrer avant merge" dans CLAUDE.md.
6. M2 : finaliser synchro.

---

## 2026-06-05 (soir) — CMS Sveltia : auth GitHub OPERATIONNELLE

**Fait** : le login GitHub du CMS fonctionne (hamcat.live/admin). Edition en ligne du contenu desormais possible, Fx autonome sur le contenu sans passer par git/Claude Code.

**Diagnostic : 3 bugs empiles (tous corriges)** :
1. `base_url` manquant dans public/admin/config.yml -> Sveltia tombait par defaut sur Netlify (api.netlify.com/auth -> "not found"). Corrige : `base_url: https://sveltia-cms-auth.felix-jambon20.workers.dev`.
2. BOM (caractere invisible U+FEFF) devant la valeur de GITHUB_CLIENT_ID dans le Worker -> GitHub recevait `%EF%BB%BF` + client_id et rejetait l'app. Corrige : variable re-saisie proprement (copiee depuis GitHub, pas depuis un fichier texte d'origine incertaine).
3. Secret nomme `SECRET` dans le Worker alors que le code lit `env.GITHUB_CLIENT_SECRET` -> echange de token echouait. Corrige : nouveau secret genere sur GitHub, enregistre sous `GITHUB_CLIENT_SECRET`, ancienne variable `SECRET` supprimee.

**Infra CMS** : OAuth App GitHub `CMS hamcat.live` (owner fx-jam) ; Worker Cloudflare `sveltia-cms-auth` avec variables GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET (ALLOWED_DOMAINS optionnel, defaut hamcat.live code en dur dans le worker).

**Methode diagnostic cle** : `curl -sI ".../auth?provider=github&site_id=hamcat.live&scope=repo,user"` pour lire la redirection vers GitHub et inspecter le client_id reellement transmis (c'est ainsi qu'on a repere le BOM).

**Lecons** : (1) les BOM invisibles dans les variables d'environnement sont un piege classique, toujours saisir les credentials depuis une source propre (page web) ; (2) verifier les noms de variables attendus en LISANT le code du Worker (Cloudflare -> Edit code), ne pas supposer.

**Reste (optionnel, hygiene secu)** : supprimer l'ancien Client Secret obsolete sur GitHub maintenant qu'un nouveau est actif.

---

## 2026-06-05 — Facette Son v1 : charpente + section Gigs (session Claude Code)

**Branche** : `feat/facette-son`

### Fait cette session
- `src/pages/son.astro` : stub remplacé par vraie page, structure complète.
- **Header** : label `Son` (var(--facet-son)), titre `DJ & Live`, teaser inline (placeholder bio marqué TODO).
- **Section Gigs** fonctionnelle :
  - `getCollection('gigs')` avec filtre `draft: false`.
  - Split date du jour → "À venir" (ascendant) / "Historique" (descendant).
  - "À venir" vide → état propre "Prochaines dates bientôt annoncées.".
  - "Historique" : foldable via `<details open>` / `<summary>`, flèche `▾` animée, compteur de gigs affiché même replié.
  - Grille 5 colonnes (`100px 1fr 140px 130px 48px`) commune à toutes les lignes → alignement parfait des colonnes date / titre / venue / genres / format.
  - Venue masquée si identique au titre (cas majoritaire dans les données).
  - Gigs "à venir" : card accentuée (border-left rouge, fond teinté).
- **Placeholders** structurés (sections vides, opacité 0.45, TODO en commentaire) : Écoute, Visuels, Presskit.
- 100% tokens CSS (`var(--facet-son)`, `var(--bg-*)`, `var(--text-*)`, `var(--font-*)`), zéro couleur/police hardcodée.
- Build validé : 8 pages, aucune erreur.

### Arbitrages pris
- `<details>/<summary>` natif pour le fold (pas de JS additionnel) — fluide, accessible, sans dépendance.
- Grille à largeurs fixes (sauf 1fr titre) plutôt que `display: contents` — plus simple, même résultat visuel.
- Venue toujours rendue (colonne vide si title=venue) pour maintenir l'alignement.
- Preview workflow : serveur `nohup npm run preview` sur VPS + tunnel SSH `-N` depuis PowerShell X13.

### TODO restant pour cette facette
- **Bio** : texte d'accroche Fx (header + presskit).
- **Écoute** : embeds SoundCloud / Mixcloud, liens sets enregistrés.
- **Visuels** : galerie photos / vidéos.
- **Presskit** : bio longue, rider technique, contact booking.
- **Symétrie** : page pas encore 100% symétrique selon Fx — à affiner (chantier transversal noté dans PLAN.md).

---

## 2026-06-05 — Import historique gigs (session Claude Code)

**Branche** : `feat/import-gigs` (pas encore mergee sur main)

### Fait cette session
- VPS re-synce via `git pull --rebase` : 3 commits en retard recuperes (endpoint /claude-log.md, fxstart/fxstop deja faits depuis X13).
- Node.js mis a jour 20 → 22 sur le VPS (Astro 5 requiert >= 22). `npm install` lance.
- 57 fichiers `.md` generes dans `src/content/gigs/` depuis liste brute fournie par Fx.
  - Format parse : `YY/MM/JJ - TITRE @ VENUE (GENRE)` ou sans `@`
  - Champs : title, date, format (live/dj), venue, country, genre[], draft, notes (ligne source brute)
  - Apostrophes YAML escapees (`DRAK''ART`, `L''AMPERAGE`…)
  - `format: live` pour 2023-08-24-hadra-festival uniquement (seul LIVE detecte)
  - `out-of-the-void-festival` : genre corrige `???` → `hi-tech` sur demande de Fx
- Build valide : 8 pages, Complete, schema Zod OK sur les 57 gigs.
- Commit `e7a1615` sur `feat/import-gigs`.

### EN SUSPENS
- **Push bloque** : cle SSH `github_deploy` du VPS non enregistree sur GitHub (perdue apres re-clone). Cle publique a ajouter sur github.com/settings/keys : `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIZ+I0zAPxsK2LtEKMj4eimv4kmGEYmBi5zxjdvWAK0Y deploy@hamcat.live`
  Fx peut aussi pusher directement depuis X13 : `git fetch && git push origin feat/import-gigs`
- Gigs 2025 (janvier → juin) a completer : Fx ajoutera via CMS ou en collant une liste dans la prochaine session.
- Phase 2 terminee une fois la branche mergee. Phase 1 (facette Son) peut demarrer.

---

## 2026-06-05 — Refonte du systeme de contexte + securisation (session chat web, nuit)

**Objectif** : reparer la "faille memoire" — les instances (chat web / Claude Code / Fx) divergeaient faute de source de verite tenue a jour. Mettre en place un environnement de travail synchronise multi-machines.

### Architecture de contexte adoptee
- **Hierarchie doc** : ARCHITECTURE.md (concept, prime sur tout) > PLAN.md (etat courant + 7 phases) > CLAUDE.md (brief Claude Code, lu au demarrage) > CLAUDE_LOG.md (ce journal).
- **CLAUDE_LOG.md** transforme de doc d'etat redondant en journal de bord chronologique (Option B). Branche dans CLAUDE.md (rituel lire-au-debut / ecrire-a-la-fin).
- **Synchro multi-machines = git seul, GitHub comme hub.** PAS de Syncthing (corromprait .git). Chaque machine pull au debut, push a la fin.

### Topologie des machines (detail acces dans .claude/access.local.md, NON versionne)
- **X13** (Windows) : clone dans C:\Users\FX\Documents\GitHub\fx.jam. Accessible par Claude Desktop via Windows-MCP (PowerShell) — VERIFIE, fonctionne en autonomie.
- **M2** : clone existe. Joignable en ping Tailscale depuis X13, mais SSH non-interactif KO (pas de serveur ssh actif / pas de cle ?). Re-sync a faire en local par Fx.
- **O+ (Android)** : clone via Termux. Acces Claude Desktop incertain (pas d'equivalent Windows-MCP teste). Plan B universel = exposer le journal en web sur hamcat.live/claude-log.md (PAS ENCORE FAIT).
- **VPS Oracle** : ou tournent Claude Code, le site, et les sous-domaines. SSH par cle uniquement (port 443). Alias `ssh fx` configure sur X13.

### Limites techniques constatees (IMPORTANT pour comprendre qui fait quoi)
- **Claude Desktop (chat web)** : peut lire/ecrire le X13 via Windows-MCP. NE PEUT PAS tunneler vers le VPS (`ssh fx` via Windows-MCP echoue, exit 255, alors que ca marche en interactif pour Fx). web_fetch refuse les URLs non indexees (donc raw GitHub d'un repo neuf non fetchable).
- **Consequence workflow** : pour le VPS, soit Fx execute dans sa session SSH, soit Claude Code agit directement sur place.

### Outils / services sur le VPS
- **terminal.hamcat.live** : acces terminal web (protege, 401 sans auth). Pas explore en detail.
- **hermes.hamcat.live** : Hermes WebUI (nesquena/hermes-webui). OUTIL PERSO de Fx : atelier multi-modeles + roue de secours quand tokens Claude epuises. **NON integre au site** (decision : garder separe, eviter sur-ingenierie). Multi-agent Hermes+Claude Code = chantier futur a instruire, pas maintenant.

### Fait cette session
- Acces VPS/Tailscale extraits du repo vers .claude/access.local.md (gitignored, verifie git check-ignore).
- CLAUDE_LOG.md reecrit en journal (ce fichier). Rituel branche dans CLAUDE.md.
- Verifie : wrangler.toml n'existe nulle part (doc deja sur wrangler.jsonc), rien a corriger.
- Build valide (8 pages, Complete). Warning collection blog vide = normal.
- **Securite : historique git reecrit** (1 seul commit initial 5d65311, force push). Les anciens commits contenant les IP Tailscale (notamment bcb63c7) sont effaces de GitHub. Branches obsoletes cloudflare/workers-autoconfig et update_worker_name_to_fx-jam supprimees (contenu deja sur main, sans valeur unique).
- Site verifie post-force-push : hamcat.live repond 200. Intact.

### EN SUSPENS (a faire prochaine session)
- **Re-synchroniser VPS et M2** : leur historique local est l'ancien (divergent du nouveau main). Re-cloner. ATTENTION VPS : recreer .claude/access.local.md apres re-clone (non versionne par design). Verifier aussi si le VPS avait deja un .claude/ a preserver.
- **Exposer le journal sur hamcat.live/claude-log.md** (route Astro) : rend le journal lisible par Claude Desktop depuis n'importe quel appareil, dont O+.
- **Scripts fxstart / fxstop** (pull au debut, commit journal + push a la fin) sur les 3 machines.
- **Faire valider la voie par Claude Code** : lui demander de lire ce journal + CLAUDE.md, confirmer que l'archi de contexte tient, et faire sa part (re-sync VPS cote serveur).
- A trancher : modes d'autonomie Claude Code (garde-fous : branches, pas de push direct main), opportunite multi-agent, contenu facette Son (Phase 1 du PLAN).

### Workflow cible valide avec Fx
Boucle : Fx prompte Claude Desktop (depuis X13/M2/O+) -> point sur les cahiers des charges (lecture journal+PLAN+ARCHITECTURE) -> brief pour Claude Code -> Claude Code execute sur VPS en autonomie, commit, push, ecrit son compte-rendu dans le journal -> Claude Desktop relit et analyse -> rebelote. Le journal partage est le pivot.

---

## Avant le 2026-06-05 (resume retrospectif)

Historique non journalise. Synthese de l'etat atteint (detail dans PLAN.md / ARCHITECTURE.md) :
- 28-29/05/2026 : conception platine vinyle, design system (tokens, palette arc-en-ciel, Barlow Condensed + JetBrains Mono), redaction ARCHITECTURE.md v4 et PLAN.md (7 phases).
- Platine vinyle implementee et fonctionnelle (rotation, 3 etats, View Transitions, navigation clavier/tactile).
- 8 routes propres + 404 designee. CMS Sveltia operationnel en local (collections blog, gigs).
- Infra : Cloudflare Workers, deploiement auto sur push main, CI GitHub Actions.
- ~30% du site cible : fondations posees, contenu des facettes a faire.

## 2026-06-05 (apres-midi) — Re-sync VPS + endpoint journal web

**Fait** :
- Clarifie : les branches "apparues" (archive/ancien-site-bricolage, fix/display-issues) etaient anciennes, redecouvertes apres le git init d'hier. fix/display-issues (vestige Roo Code dec. 2025) supprimee. archive/ancien-site-bricolage conservee.
- **VPS re-clone et aligne** sur le nouvel historique (HEAD cce36c6, branche main). X13 + GitHub + VPS desormais synchronises.
- **Endpoint /claude-log.md cree** (src/pages/claude-log.md.ts) : sert CLAUDE_LOG.md en text/markdown, noindex, pas de lien visible. En ligne, verifie 200. Lisible par tout navigateur / Claude Code / agents web depuis n'importe quel appareil.

**Limite confirmee (importante)** : Claude Desktop (chat web) NE PEUT PAS fetcher /claude-log.md ni le raw GitHub — son web_fetch exige une URL deja indexee par un moteur, ce qui n'est pas le cas d'un site neuf/confidentiel. Le lien colle par Fx ne suffit pas non plus (l'outil exige un resultat de recherche). 
=> Pour donner le contexte a Claude Desktop : soit lecture du fichier local via Windows-MCP sur X13 (marche, methode utilisee en pratique), soit coller le contenu. L'endpoint web sert surtout Fx (navigateur, mobile), Claude Code et Hermes.

**Tunnel SSH** : reconfirme KO depuis Windows-MCP (exit 255) ET depuis le bash isole de Claude Desktop (ssh absent, environnement sans reseau vers le VPS). Le souvenir de Fx = Claude Code dans son terminal local (avant setup VPS), qui utilisait le ssh de sa machine. Pour le VPS : Fx en session SSH, ou Claude Code sur place.

**EN SUSPENS** :
- Scripts fxstart / fxstop (pull debut / commit+push fin) sur les 3 machines.
- Re-clone M2 (en local, pas de cle SSH dessus — normal).
- Faire valider l'archi par Claude Code sur le VPS (lire CLAUDE.md + journal, confirmer la voie).
- Phase 1 du PLAN : contenu facette Son.

## 2026-06-05 (suite) — Rituel de synchro X13

**Fait** :
- Profil PowerShell cree sur X13 (Microsoft.PowerShell_profile.ps1) avec deux fonctions :
  - **fxstart** : cd repo + git pull --rebase + affiche 3 derniers commits + status. Teste, fonctionne.
  - **fxstop** [message] : verifie les modifs, commit (message optionnel, defaut horodate) + push origin main.
- Rituel X13 operationnel : fxstart pour commencer, fxstop pour finir une session. Plus de pull/push manuel a penser.

**Pedagogie notee** : VPS = machine allumee 24/7 qui EXECUTE (Hermes, Claude Code autonome, terminal web). Git STOCKE/versionne. Cloudflare SERT le site statique au public. Le site n'a PAS de backend (Astro static) — pas de serveur applicatif ni BDD, c'est voulu (rapide, robuste, gratuit). Le VPS prend sa valeur avec l'autonomie d'agents, pas pour servir le site.

**EN SUSPENS** :
- Repliquer fxstart/fxstop sur M2 (zsh) et O+ (Termux/bash) — syntaxe shell differente, a faire en local.
- VPS : le rituel passera par les instructions de CLAUDE.md (Claude Code les applique), pas un script shell.
- Faire valider l'archi par Claude Code sur le VPS.
- Phase 1 du PLAN : contenu facette Son.

## 2026-06-05 (cloture) — Phase 1 facette Son LIVE + suspens session suivante

**Fait** :
- Facette Son v1 relue par le chat web (tokens BaseLayout OK, AUCUN hardcode, color-mix pour les nuances de --facet-son ; logique upcoming/past correcte). Mergee sur main et deployee.
- brief-facette-son.md supprime (chantier termine, pas de dechet).
- LECON : le "push" de Claude Code etait reste sur la branche feat/facette-son, jamais merge -> "pas live". D'ou regle : verifier l'etat de main + faire relire par le chat web AVANT de considerer un chantier livre.

**Conventions actees** :
- Branche dediee par chantier ; brief en fichier .md versionne ; review chat web avant merge sur main ; montrer echantillon + build avant merge.

**EN SUSPENS prochaine session (priorise)** :
1. Verifier facette Son LIVE sur hamcat.live apres deploiement.
2. FIX CMS : login GitHub Sveltia renvoie "not found" sur api.netlify.com/auth?provider=github&site_id=hamcat.live&scope=repo,user. Config OAuth Sveltia/Netlify a finaliser (TODO de longue date).
3. PLATINE TACTILE : faire defiler les facettes par rotation au toucher, comme les fleches clavier le font deja (composant Turntable).
4. SOCLE MEDIA : bibliotheques photos / videos / audio + integrations RS (Insta, Facebook, SoundCloud, Mixcloud, Spotify). Necessite liens/contenus de Fx.
5. Entretien : MAJ PLAN.md (perime depuis 29/05), graver "montrer avant merge" dans CLAUDE.md, re-cloner M2 (encore ancien historique).

**Note responsive** : la grille gigs a 5 colonnes fixes sera a l'etroit sur mobile -> chantier responsive Son a prevoir.
