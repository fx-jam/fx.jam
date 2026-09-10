# Brief : CMS boucler — blog + affichage données

**Branche :** `feat/cms-boucler`

## Contexte

Le CMS de base est en place. Trois lacunes à corriger pour que tout le contenu éditable via Sveltia s'affiche réellement sur le site.

---

## Étape 1 — blog.json

Créer `src/data/blog.json` :

```json
{
  "label": "Blog",
  "teaser": "Notes & articles — son, prod, théorie",
  "headline": "Blog",
  "note_stub": "Articles à venir. Revenez bientôt.",
  "bio": ""
}
```

---

## Étape 2 — facets.ts

Importer `blogData` depuis `blog.json` et remplacer les valeurs hardcodées de la facette blog :

```typescript
import blogData from './blog.json';

// Dans FACETS, entrée blog :
{
  key: 'blog',
  label: blogData.label || 'Blog',
  teaser: blogData.teaser || 'Notes & articles',
  href: '/blog',
  enabled: true,
},
```

---

## Étape 3 — src/pages/blog.astro

Créer la page. Structure :

```
Header (label + headline + teaser depuis blog.json)
  ↓
Si des articles existent dans la collection blog :
  → Liste des articles (titre, date, description, lien vers /blog/[slug])
Sinon :
  → Message blog.note_stub

Lien retour accueil
```

Notes importantes :
- Importer la collection blog avec `getCollection('blog', ({ data }) => !data.draft)`
- Trier par date décroissante
- Styler en cohérence avec son.astro (même tokens, même structure header)
- La couleur de la facette est `var(--facet-blog)` — utiliser cette variable pour les accents
- Si la collection est vide, afficher le `note_stub` comme les StubPages

Page de détail d'article (`src/pages/blog/[...slug].astro`) :
- Créer également cette page (layout simple : titre, date, tags, contenu markdown rendu)
- Sans ça, les liens vers les articles seraient cassés

---

## Étape 4 — config.yml : sous-collection blog dans donnees-site

Ajouter dans la collection `donnees-site` (après contact) :

```yaml
- name: blog
  label: "Facette Blog"
  file: src/data/blog.json
  format: json
  fields:
    - { label: "Label (nom court)",   name: label,    widget: string, required: false }
    - { label: "Teaser (1 ligne)",    name: teaser,   widget: string, required: false }
    - { label: "Titre de page",       name: headline, widget: string, required: false }
    - { label: "Message avant ouverture", name: note_stub, widget: text, required: false }
    - { label: "Description du blog", name: bio,      widget: text,   required: false }
```

---

## Étape 5 — son.astro : afficher les liens streaming

Dans la section "Écoute" (actuellement placeholder vide), afficher les boutons de lien si le champ est rempli dans `son.json`.

Remplacer le placeholder actuel par :

```astro
<section class="section ecoute">
  <h2 class="section-title">Écoute</h2>

  {(sonData.links?.soundcloud || sonData.links?.mixcloud || sonData.links?.spotify) ? (
    <div class="links-streaming">
      {sonData.links.soundcloud && (
        <a href={sonData.links.soundcloud} target="_blank" rel="noopener" class="link-btn">
          SoundCloud
        </a>
      )}
      {sonData.links.mixcloud && (
        <a href={sonData.links.mixcloud} target="_blank" rel="noopener" class="link-btn">
          Mixcloud
        </a>
      )}
      {sonData.links.spotify && (
        <a href={sonData.links.spotify} target="_blank" rel="noopener" class="link-btn">
          Spotify
        </a>
      )}
      {sonData.links.presskit && (
        <a href={sonData.links.presskit} target="_blank" rel="noopener" class="link-btn link-btn--secondary">
          Presskit
        </a>
      )}
    </div>
  ) : (
    <p class="empty">Liens à venir.</p>
  )}
</section>
```

Styler `.links-streaming` comme une rangée de boutons avec `var(--facet-son)` pour les accents.
Garder les sections "Visuels" et "Presskit" en placeholder (contenu à venir).

---

## Étape 6 — StubPage.astro : afficher bio et email

Étendre le type du `dataMap` et le template pour afficher le contenu si rempli.

Dans le frontmatter, étendre le type :
```typescript
const dataMap: Record<string, { 
  label?: string; 
  teaser?: string; 
  note_stub?: string;
  bio?: string;
  email?: string;
}> = { ... };
```

Dans le template, ajouter après `.teaser` :
```astro
{d.bio && <p class="bio">{d.bio}</p>}
{d.email && (
  <a href={`mailto:${d.email}`} class="email">{d.email}</a>
)}
```

Styler `.bio` en `var(--text-secondary)` max-width 48ch, et `.email` avec la couleur de la facette.

---

## Contraintes

- Zéro hardcode textuel — tout vient des JSON
- Tokens CSS uniquement depuis BaseLayout.astro — utiliser `var(--facet-blog)`, `var(--text-*)`, etc.
- `npm run build` doit passer sans erreur avant de pusher
- PUSH la branche après chaque étape

## Vérification finale

1. `npm run build` sans erreur
2. `/blog` s'affiche avec header éditable et message note_stub
3. Sveltia → Données du site → Blog → champs éditables présents
4. Sveltia → Articles de blog → peut créer un article → il apparaît sur `/blog`
5. `/son` → section Écoute affiche "Liens à venir." (ou boutons si URLs remplies)
6. `git log origin/feat/cms-boucler` confirme les commits pushés
