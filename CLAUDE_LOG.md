# CLAUDE_LOG.md — Journal de bord hamcat.live

> **Journal chronologique des sessions de travail.** Une entree par session : ce qui a ete fait, decide, ou laisse en cours.
> Ne decrit PAS l'etat courant du projet (role de PLAN.md) ni l'architecture (role d'ARCHITECTURE.md). C'est la memoire partagee entre les instances (Fx, Claude chat web, Claude Code).
>
> **Rituel** : lire ce fichier en debut de session, y ajouter une entree en fin de session.
> **Convention** : entrees anti-chronologiques (plus recente en haut). Pas de secrets ici (acces dans .claude/access.local.md, non versionne).

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
