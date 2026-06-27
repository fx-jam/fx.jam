# MEMORY.md — Mémoire partagée Claude Desktop ↔ Hermes

Ce fichier est la **mémoire persistante et bidirectionnelle** entre Claude Desktop (M2) et Hermes (VPS).
Les deux agents le lisent en début de session et le mettent à jour en fin de session.
Ne contient **aucun secret** (tokens, clés, mots de passe).

---

## 🙋 Profil utilisateur

**Félix Jambon** (fx-jam / DJ Hamcat)
- Grenoble, France
- DJ psytrance/hi-tech/goa, ingénieur son, prof MAO, intermittent du spectacle
- Président ADN Music Festival
- Programme Live stage Hadra Trance Festival
- Booke des artistes (Rémi Gallego / The Algorithm)
- Langue : français (parle anglais technique)

### Matos
- **M2** (desktop) : NCase SFF, ROG B760-G, RME AIO Pro, i7-14700K, Win 11 Pro
- **X13** (laptop) : ThinkPad X13, Windows
- **VPS** (fx-1) : 100.74.198.77 (Linux, Hermes Agent, Claude Code)
- **Phone** : OnePlus (fx-oneplus, 100.116.87.52, Termux)

### Software préféré
- Ableton Live + ableton-mcp
- Traktor / VDJ
- Astro 5 + Tailwind + Cloudflare (hamcat.live)
- PowerShell 7, AutoHotKey
- Syncthing, rclone
- Claude.ai Desktop / Claude Code

---

## 🧠 Mémoire personnelle (stable)

- Préfère l'action directe — ne pas demander la permission pour les choses évidentes
- Corrige directement quand quelque chose ne va pas
- N'aime pas les questions de clarification excessives
- Préfère DeepSeek V4 Flash comme modèle par défaut
- A une édition Standard Claude Pro (tokens limités — utilise Hermes pour les tâches longues)
- A des clés API : Anthropic, Gemini, Groq, Apify

---

## 🏗 Mémoire projet — hamcat.live (fx.jam)

Cf. `CLAUDE.md` et `ARCHITECTURE.md` pour le contexte technique détaillé.

### Chantiers en cours
- **Jog (platine)** : composant central + 3 états. État 1 mergé (feat/jog-fix2). Reste état 2 (overlay, accordéons, lightbox).
- **Déploiement** : Cloudflare auto sur push main. Branche par défaut : `main`.
- **CMS** : Sveltia CMS (local), OAuth GitHub à brancher pour le mode online.

### Dépendances techniques
- Astro 5, Tailwind CSS, Cloudflare Workers
- Tokens CSS centralisés dans BaseLayout.astro
- Palette arc-en-ciel : Son=rouge, Régie=orange, Cours=jaune, Blog=vert, Outils=cyan, Contact=violet

---

## 🔄 Journal de synchro bilatérale

### 2026-06-26 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md mis à jour** : journal de synchro.

### 2026-06-27 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md mis à jour** : journal de synchro.

### 2026-06-26 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md mis à jour** : journal de synchro.

### 2026-06-26 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue traitée (entrées de synchro uniquement)
- **→ Queue vidée** : 3 entrées de synchro ingérées
- **→ MEMORY.md mis à jour** : journal de synchro.

### 2026-06-26 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md mis à jour** : journal de synchro.

---

### 2026-06-25 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md mis à jour** : journal de synchro.

### 2026-06-26 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md mis à jour** : journal de synchro.


### 2026-06-14 — Initialisation
- **→ Import mémoire Claude** : 699 conversations, memories.json, projets.json — ingérés dans Hermes
- **→ MEMORY.md créé** : fichier partagé dans le projet fx.jam
- **→ Sync SSH établie** : Hermes peut exécuter PowerShell à distance sur M2

---

## 📝 Rituel de session

**En début de session :**
1. Lire `CLAUDE.md` + `ARCHITECTURE.md` (contexte projet)
2. Lire `CLAUDE_LOG.md` (dernières actions)
3. Lire `MEMORY.md` (mémoire perso + synchro)

**En fin de session :**
1. Ajouter une entrée dans `MEMORY.md` (section Journal de synchro)
2. Mettre à jour `CLAUDE_LOG.md` (si travail sur le projet)
3. Commit + push des changements (pour que l'autre agent les voie)

### 2026-06-24 — Cron sync (Hermes)
- **→ Sync exécutée** : script memory-sync.py, queue vide — aucune nouvelle entrée à ingérer
- **→ MEMORY.md inchangé** : dernière entrée 2026-06-14

---

## 🔧 Pipeline de synchro technique

### Claude Desktop → Hermes
Script PowerShell sur M2 (`~/scripts/sync-memory.ps1`) :
1. Exporte les nouvelles conversations depuis le LevelDB
2. Extrait les décisions, préférences, infos contextuelles
3. Commit dans `MEMORY.md` → push git
4. Hermes détecte le changement et ingère dans sa mémoire

### Hermes → Claude Desktop
1. Hermes met à jour `MEMORY.md` dans le projet
2. Git commit + push
3. Claude Desktop lit via Project Knowledge + CLAUDE.md
4. (Optionnel) Le script PowerShell sur M2 importe les entrées mémoire