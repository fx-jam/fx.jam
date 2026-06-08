# Brief pour Claude Code — projet hamcat.live

Ce fichier est lu automatiquement par Claude Code au démarrage. Il contient le contexte essentiel pour bosser efficacement sur ce projet.

## Le projet en une phrase

Site personnel multi-facettes de **Fx / Hamcat** (DJ psytrance, ingénieur son, prof MAO) : un **hub extensible** où chaque facette (Son, Régie, Cours, Blog, Outils, Contact, et plus à venir) est de même niveau, navigable via une **interface "jog"**.

## Document de référence prioritaire

**Lire `ARCHITECTURE.md` à la racine** avant tout chantier non trivial. C'est le plan directeur (concept platine, 3 états, design system, plan d'implémentation, questions ouvertes). Il prime sur ce CLAUDE.md en cas de conflit.

## Journal de bord — rituel de session

**Lire CLAUDE_LOG.md en debut de session** (entrees anti-chronologiques, la plus recente en haut) pour savoir ce qui a ete fait/decide aux sessions precedentes.

**Ajouter une entree en fin de session** : date, ce qui a ete fait, decisions, ce qui reste en cours. C'est la memoire partagee entre Fx, le chat web et Claude Code. Pas de secrets dedans (acces dans .claude/access.local.md, non versionne).

## Stack

- **Astro 5** (statique) + Tailwind CSS
- **Sveltia CMS** (`public/admin/`) — collections `blog` et `gigs`
- **Cloudflare Workers** — déploiement auto via `wrangler.jsonc` à chaque push sur `main`
- **GitHub** : `fx-jam/fx.jam` — identité git locale = `Hamcat <fx-jam@users.noreply.github.com>` (déjà configurée)

## Conventions design — NON NÉGOCIABLES

Ces choix sont validés et documentés dans `ARCHITECTURE.md`. Ne pas les remettre en cause sans demander.

- **Tokens CSS centralisés** dans `src/layouts/BaseLayout.astro` (variables `--facet-*`, `--bg-*`, `--text-*`, `--font-*`). **Toujours** utiliser les tokens, jamais de couleur/police codée en dur.
- **Tailwind** est branché sur ces tokens (cf. `tailwind.config.mjs`). Classes `bg-bg-app`, `text-text-primary`, `text-facet-son` etc. disponibles. Pas de `bg-gray-900`, `text-indigo-500`, etc. — bannis.
- **Polices** : Barlow Condensed (display) + JetBrains Mono (technique). Pas d'Inter, pas de Space Grotesk, pas de système.
- **Palette arc-en-ciel saturée** : Son=rouge, Régie=orange, Cours=jaune, Blog=vert, Outils=cyan, Contact=violet. Ordre = spectre.
- **Pas d'icônes/emojis** dans l'interface (signature "IA générique" à éviter). Full-texte + média (vraies images/vidéos/audio).
- **Viewport fixe** en desktop : pas de scroll de page entière au niveau accueil/aperçu. Scroll uniquement à l'intérieur des composants ou en plein écran d'une facette.
- **Symétrie stricte** dans la disposition.

## Règle : validation avant merge

TOUJOURS montrer `git diff` + confirmer `npm run build` à Fx AVANT de merger sur main.
Ne jamais merger une branche feature sans validation explicite de Fx ou du chat web (Claude architecte).
Le merge sur main = déploiement automatique sur hamcat.live. Chaque merge compte.

## Source de vérité des facettes

`src/data/facets.ts` : liste ordonnée des facettes (clé, label, teaser, href, enabled). **Toute nouvelle facette passe par là**, sinon elle n'existe pas dans le site. Cf. commentaire en tête du fichier pour la procédure complète (5 étapes).

## Composants existants

- `src/layouts/BaseLayout.astro` — layout racine, tokens CSS, polices, reset.
- `src/layouts/StubPage.astro` — gabarit temporaire pour facettes en chantier.
- `src/components/Tile.astro` — brique unitaire de la future platine (paramétrable par facette).
- `src/components/Header.astro`, `src/components/Modal.astro` — **résidus de l'ancien site**, encore utilisés par `src/pages/index.astro` actuel. Disparaîtront lors de la refonte de l'accueil.

## Routes en place

- `/` — ancien index (placeholder à remplacer par la platine)
- `/son`, `/regie`, `/cours`, `/outils`, `/contact` — stubs propres
- `/blog`, `/blog/[slug]` — liste + article (collection branchée)
- `/404` — page 404 designée

## Commandes utiles

```bash
npm run dev        # serveur de dev (localhost:4321)
npm run build      # build de production
npm run preview    # prévisualiser le build
```

Pour tester un build sans toucher au push, c'est `npm run build` qui sert de validateur. Le déploiement Cloudflare se fait automatiquement sur push `main`.

## Workflow git

- Branche par défaut : `main`. Push direct = déploiement immédiat.
- **Le serveur git MCP** (utilisé dans le chat web) ne fait pas `git add` automatique — commits via PowerShell/bash uniquement. Claude Code lui-même utilisera `git` en CLI directement, donc pas concerné.
- Commits courts, descriptifs, en français.
- Ne **pas** committer `.wrangler/`, `dist/`, `.astro/`, `node_modules/` (déjà dans `.gitignore`).

## État courant des grands chantiers

- **À faire** : construire la platine (composant central + 3 états + rotation infinie + View Transitions), remplacer `src/pages/index.astro`, brancher `hamcat.live` (custom domain Cloudflare), migrer l'historique des gigs depuis l'ancien `index.astro` dans la collection `gigs`, brancher OAuth GitHub pour CMS en ligne, dégrader mobile.
- **À ne pas faire sans demander** : remettre en cause les choix design documentés, supprimer du contenu réel (gigs réels, EP) sans avoir migré les données ailleurs, modifier l'architecture des collections.

## Mode de fonctionnement préféré

L'utilisateur (Fx) préfère :
- **Planifier avant de coder** sur les chantiers non triviaux : proposer un plan, valider, exécuter.
- **Commits incrémentaux** avec un message clair par étape, plutôt qu'un gros commit final.
- **Build de validation** après chaque modification importante (`npm run build` pour s'assurer que rien n'est cassé).
- **Pas de sur-ingénierie** : ne pas introduire des abstractions, dépendances ou patterns qui ne servent pas un besoin actuel. Le projet est petit, garder simple.

