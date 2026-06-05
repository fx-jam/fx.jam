# CLAUDE_LOG.md — Journal de bord hamcat.live

> **Journal chronologique des sessions de travail.** Une entree par session : ce qui a ete fait, decide, ou laisse en cours.
> Ne decrit PAS l'etat courant du projet (role de PLAN.md) ni l'architecture (role d'ARCHITECTURE.md). C'est la memoire partagee entre les instances (Fx, Claude chat web, Claude Code).
>
> **Rituel** : lire ce fichier en debut de session, y ajouter une entree en fin de session.
> **Convention** : entrees anti-chronologiques (plus recente en haut). Pas de secrets ici (acces dans .claude/access.local.md, non versionne).

---

## 2026-06-05 — Refonte du systeme de contexte + securisation

**Contexte** : session de conception (chat web) consacree a reparer la "faille memoire" — les instances divergeaient faute de source de verite tenue a jour.

**Decisions** :
- Hierarchie doc clarifiee : ARCHITECTURE.md (concept, prime sur tout) > PLAN.md (etat courant + 7 phases) > CLAUDE.md (brief Claude Code) > CLAUDE_LOG.md (ce journal, historique des sessions).
- CLAUDE_LOG.md transforme de "doc d'etat redondant" en vrai journal de bord chronologique (Option B).
- Synchro multi-machines = git seul (GitHub comme hub). PAS de Syncthing par-dessus un repo git.
- Hermes (hermes.hamcat.live, nesquena/hermes-webui) reste un OUTIL perso separe, NON integre au site. Multi-agent = chantier futur dedie, pas maintenant.
- Autonomie : Claude Code gere l'execution code en autonomie (avec garde-fous : branches, pas de push direct sur main). Conception = chat web. Actions irreversibles = validation Fx explicite.

**Fait** :
- Acces VPS/Tailscale sortis du repo vers .claude/access.local.md (gitignored, verifie).
- (en cours) Branchement du journal dans CLAUDE.md, nouveau depart d'historique git pour effacer les anciens commits contenant les acces, scripts fxstart/fxstop.

**A trancher prochaine session** : modes d'autonomie Claude Code (garde-fous precis), opportunite multi-agent Hermes+Claude Code, contenu facette Son (Phase 1).

---

## Avant le 2026-06-05 (resume retrospectif)

Historique non journalise. Synthese de l'etat atteint (detail dans PLAN.md / ARCHITECTURE.md) :
- 28-29/05/2026 : conception platine vinyle, design system (tokens, palette arc-en-ciel, Barlow Condensed + JetBrains Mono), redaction ARCHITECTURE.md v4 et PLAN.md (7 phases).
- Platine vinyle implementee et fonctionnelle (rotation, 3 etats, View Transitions, navigation clavier/tactile).
- 8 routes propres + 404 designee. CMS Sveltia operationnel en local (collections blog, gigs).
- Infra : Cloudflare Workers, deploiement auto sur push main, CI GitHub Actions.
- ~30% du site cible : fondations posees, contenu des facettes a faire.

