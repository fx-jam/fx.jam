# Brief : CMS complet — zéro texte hardcodé

**Branche :** `feat/cms-complet`
**Objectif :** Fx doit pouvoir modifier TOUT le contenu textuel du site depuis `hamcat.live/admin`, sans toucher au code.

---

## Audit de l'état actuel

### Ce qui est vide ou non câblé
- `src/data/son.json` : `headline: "", bio: ""` — vide, NON importé par `son.astro`
- `src/data/regie.json`, `cours.json`, `outils.json`, `contact.json` : idem
- `src/layouts/StubPage.astro` : lit `f?.teaser` depuis `facets.ts` (non éditable)
- `src/data/facets.ts` : `label` et `teaser` hardcodés pour toutes les facettes

### Texte hardcodé à éradiquer
Dans `src/pages/son.astro` :
- `<h1>DJ & Live</h1>`
- `<p class="teaser">psytrance · hi-tech · goa</p>`

Dans `src/data/facets.ts` : tous les label + teaser

---

## Travail demandé

### 1. Enrichir les JSON de facette

Remplir avec valeurs pré-existantes + nouveaux champs :

**son.json** : `label`, `teaser`, `headline`, `genres` (list), `note_stub`, `bio`, `links`
**regie.json** : `label`, `teaser`, `headline`, `note_stub`, `bio`, `links`
**cours.json** : `label`, `teaser`, `headline`, `note_stub`, `bio`, `links`
**outils.json** : `label`, `teaser`, `headline`, `note_stub`, `bio`, `links`
**contact.json** : `label`, `teaser`, `headline`, `note_stub`, `email`, `bio`, `links`

Valeurs initiales à reprendre depuis `facets.ts` :
- son : label="Son", teaser="DJ & Live — psytrance, hi-tech, goa", headline="DJ & Live", genres=["psytrance","hi-tech","goa"]
- regie : label="Régie", teaser="Ingénierie son — FOH, X32/M32, festivals", headline="Régie technique"
- cours : label="Cours", teaser="Cours MAO — Ableton, production", headline="Cours MAO"
- outils : label="Outils", teaser="Utilitaires — BPM, pitch, samples", headline="Outils"
- contact : label="Contact", teaser="Booking, liens, réseaux", headline="Contact"

### 2. Mettre à jour facets.ts

Importer les JSON et utiliser leurs valeurs pour `label` + `teaser` (avec fallback défensif) :
`	ypescript
import sonData from './son.json';
// etc.
// Dans FACETS : label: sonData.label || 'Son', teaser: sonData.teaser || '...'
// Blog : garder les valeurs hardcodées (pas de JSON blog pour l'instant)
`

### 3. Câbler son.astro sur son.json

Importer `son.json` et remplacer :
- `<h1>DJ & Live</h1>` → `<h1>{sonData.headline || 'DJ & Live'}</h1>`
- `<p class="teaser">psytrance · hi-tech · goa</p>` → `<p class="teaser">{sonData.genres?.join(' · ') || sonData.teaser}</p>`

### 4. Mettre à jour StubPage.astro

Importer tous les JSON, sélectionner selon props.facet via un dataMap, utiliser `d.label`, `d.teaser`, `d.note_stub` pour le contenu affiché (avec fallback sur `f?.label` etc.).

### 5. Mettre à jour config.yml

Ajouter dans chaque sous-collection `donnees-site` les champs : `label`, `teaser`, `headline`, `note_stub` (et `genres` pour son).

---

## Contraintes absolues

- Zéro texte hardcodé dans les .astro — tout vient des JSON
- Fallbacks défensifs partout : `sonData.label || 'Son'`
- Ne pas toucher aux tokens CSS (BaseLayout.astro uniquement)
- Types TypeScript propres dans facets.ts
- PUSH la branche après chaque étape (pas juste commit local)

## Vérification finale

1. `npm run build` passe sans erreur
2. `hamcat.live/admin` → chaque facette a ses champs label/teaser/headline éditables
3. `git log origin/feat/cms-complet` confirme les commits pushés
