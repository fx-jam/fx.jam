# hamcat.live

Site personnel de Fx / Hamcat — DJ, producteur, ingénieur son, prof MAO.

## Stack

- **Astro 5** (statique) + Tailwind CSS
- **Sveltia CMS** pour l'édition de contenu en GUI (collections : `blog`, `gigs`)
- **Cloudflare Workers** pour l'hébergement (déploiement auto à chaque push sur `main`)
- Domaine : `hamcat.live` (DNS chez Cloudflare, registrar Porkbun)

## Plan directeur

Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour la vision du site (concept platine, design system, plan d'implémentation, questions ouvertes).

## Développement local

```bash
npm install         # une seule fois
npm run dev         # serveur de dev : http://localhost:4321
npm run build       # build de production dans ./dist
npm run preview     # prévisualiser le build
```

## CMS — édition de contenu

En local (sans authentification) :

1. Lancer le dev server (`npm run dev`).
2. Ouvrir `http://localhost:4321/admin/index.html`.
3. Cliquer « Work with Local Repository », sélectionner le dossier racine du projet.
4. Éditer les articles de blog ou les dates de gigs en GUI.

Les modifications écrivent directement dans `src/content/blog/` ou `src/content/gigs/`.

## Déploiement

Push sur `main` → Cloudflare Workers redéploie automatiquement.

## Structure

```
src/
├── content/         # Contenu éditable via CMS
│   ├── blog/        # Articles
│   └── gigs/        # Dates de concerts/sets
├── content.config.ts  # Schémas des collections (validation Astro)
├── components/      # Composants Astro réutilisables
├── layouts/         # Layouts (BaseLayout = tokens CSS + polices)
└── pages/           # Routes du site
public/
└── admin/           # Sveltia CMS (index.html + config.yml)
```

## Design tokens

La palette et la typographie sont centralisées dans `src/layouts/BaseLayout.astro` (variables CSS `--facet-*`, `--bg-*`, `--text-*`, `--font-*`). Tailwind est branché dessus dans `tailwind.config.mjs`. Modifier un token = répercussion sur tout le site.
