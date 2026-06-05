# hamcat.live — Document d'architecture

> Plan directeur de la refonte. Document de référence vivant : on l'amende au fur et à mesure des décisions.
> Dernière mise à jour : 29/05/2026 (v4 — fondations posées : tokens, collections, routes stub)

---

## État courant (29/05/2026)

**Infrastructure** : site déployé sur Cloudflare Workers (`fx-jam.felix-jambon20.workers.dev`), DNS propagé vers Cloudflare, custom domain `hamcat.live` à brancher (étape C non faite). Repo propre, identité git configurée (Hamcat + noreply).

**Fondations design** : tokens CSS centralisés dans `BaseLayout.astro` (palette arc-en-ciel + neutres + typo Barlow Condensed/JetBrains Mono). Tailwind branché sur ces tokens. **Source de vérité unique** : modifier un token = répercussion partout.

**Routes en place** (vraies URL, branchées sur les tokens) :
- `/` — ancien index (placeholder, sera remplacé par la platine)
- `/son`, `/regie`, `/cours`, `/outils`, `/contact` — pages stub « en construction »
- `/blog` — liste d'articles (vide pour l'instant)
- `/blog/[slug]` — article individuel (rendu Markdown propre)
- `/404` — page 404 designée

**CMS** : Sveltia opérationnel en local avec deux collections (`blog`, `gigs`). Formulaires GUI alignés sur les schémas Astro. Édition en ligne (OAuth) non branchée.

**Composants réutilisables** :
- `Tile.astro` — brique de base de la future platine (full-texte, coloré par facette).
- `src/data/facets.ts` — source de vérité unique de la liste des facettes (ordre = spectre arc-en-ciel).
- `StubPage.astro` — gabarit temporaire des facettes en chantier.

**Ce qui reste à faire (priorités)** :
1. Brancher `hamcat.live` sur le Worker (dashboard Cloudflare → Domains → Add custom domain).
2. Construire la platine (composant central, 3 états, rotation infinie, View Transitions).
3. Remplacer le `index.astro` actuel par la vraie page d'accueil avec la platine.
4. Remplir les facettes (contenu réel de Son, Régie, Cours, etc.).
5. Migrer l'historique des gigs dans la collection.
6. Brancher l'OAuth GitHub pour l'édition CMS en ligne.
7. Dégrader le concept pour mobile.

---

## 1. Intention

Site vitrine personnel de **Fx / Hamcat**. Pas un simple site de musicien : un **hub personnel extensible** présentant plusieurs facettes (activités et passions), chacune de même niveau, auquel on ajoute des sections au fil du temps.

Facettes initiales : **Son** (musique : DJ + Live), **Régie technique** (prestation son), **Enseignement** (cours MAO), **Blog**, **Outils**, **Contact**. Extensible (autres passions à venir : à définir).

**Principe :** un seul site, plusieurs audiences, navigation fluide. La musique (Son) est la facette « point de départ ». Les pages pro sont aussi atteignables par **liens ciblés** envoyés au cas par cas.

---

## 2. Audiences & parcours

| Audience | Entrée typique | Cherche | Facette |
|----------|----------------|---------|---------|
| Fans / public | accueil | écouter, suivre, dates | Son |
| Bookers | accueil ou lien direct | mixes, dates, booking | Son → contact |
| Clients tech / régie | lien ciblé | compétences, matériel, expérience | Régie |
| Élèves MAO | lien ciblé | cours, approche | Enseignement |

---

## 3. Concept d'interface : la platine vinyle

L'interface de navigation est une **platine vinyle interactive** — métaphore juste pour un DJ, et volontairement anti-« template IA ».

### Disposition
- Les facettes sont des **pastilles** (rondes, ou formes proches : hexagones/octogones) réparties **régulièrement** sur la circonférence d'un disque central. N facettes = N points équidistants (360°/N). Ajouter une facette densifie le collier, toujours symétrique.
- **Symétrie radiale stricte** : équilibre garanti quel que soit le nombre de facettes.
- Le **centre** du disque = espace polyvalent (voir les 3 états).

### Navigation
- Le disque **tourne comme un vinyle** : molette/trackpad horizontal, flèches ← →, glisser tactile, ou clic direct sur une pastille.
- **Scroll infini** : pas de rembobinage. Passer de la dernière facette à la première continue dans le même sens (rotation cumulative, jamais de retour-arrière animé).
- Pendant la rotation, le **texte des pastilles reste droit** (effet « grande roue » / nacelles : les pastilles contre-tournent pour rester lisibles).
- La couleur « avance » progressivement vers la facette qui approche de la position active, qui **grossit et s'éclaire**.

### Les 3 états
- **État 0 — Accueil (rien sélectionné)** : le centre est une **galerie** (photos / vidéos / illustrations en diaporama). L'anneau tourne autour.
- **État 1 — Facette active** : le centre bascule et affiche un **aperçu synthétique** de la facette (titre + accroche + quelques mots-clés, lisible sans scroll). Le cercle central **s'agrandit modérément** et **l'anneau s'écarte vers l'extérieur** en même temps (effet diaphragme, évite la collision géométrique). La galerie passe en **arrière-plan plein écran flouté**, le disque restant net et au premier plan.
- **État 2 — Facette ouverte (re-clic au centre)** : **plein écran complet**, 100% du contenu, scroll vertical jusqu'au bout. C'est la page dédiée intégrale (URL propre : `/son`, `/regie`, etc.).

> Gradation voulue : vitrine (0) → bande-annonce (1) → film complet (2). L'aperçu de l'état 1 reste volontairement bref pour préserver la raison d'être de l'état 2.

### Retour
- **Overscroll** : tirer au-delà du haut (quand on est en haut) ou du bas (quand on est en bas) ramène à l'état précédent (2 → 1 → 0). Le scroll normal lit le contenu ; seul l'excès en bout de course déclenche le retour.

---

## 4. Parti pris de design

- **Compact** : viewport fixe en desktop, jamais de scroll de page entière au niveau accueil/aperçu. Le scroll vertical n'existe qu'en état 2 (contenu complet) et dans les zones de contenu long.
- **Symétrie radiale stricte** (cf. platine).
- **Full-texte + média, AUCUNE icône ni emoji.** Pas de pictos contextuels (signature « IA »/template). La **typographie devient l'élément d'identité n°1**. Le média (vraies images, vidéos, players audio) remplace les icônes.
- **Dark theme**, **chromatiquement riche** : couleur comme système de codage — chaque facette a sa teinte identifiable (« arc-en-ciel maîtrisé »). Résonne avec l'intérêt de Fx pour les systèmes de couleur en musique.
- **Anti-IA** : pas de dégradés violet-rose flous génériques, pas de glassmorphism, pas de hero centré mou, pas de typo Inter par défaut. Grille/géométrie assumée, typographie forte, interaction distinctive (la platine).
- **Ultra-nerveux / dynamique** : transitions fluides, réactivité tactile, mouvement qui raconte l'action.

### Modèle de pages : multi-page + View Transitions
Vraies URL (`/`, `/son`, `/regie`, `/cours`, `/blog`, …) pour le SEO et les liens ciblés, **avec** les View Transitions d'Astro pour des transitions animées fluides donnant l'effet « single-app » (le zoom depuis la pastille cliquée). Le beurre (SEO, partage) et l'argent du beurre (fluidité).

### Design system (v1 — validé)

**Palette : arc-en-ciel continu saturé.** Bande spectrale qui devient littéralement l'anneau de la platine. Chaque facette pioche sa couleur selon sa position angulaire — l'ordre des facettes suit le spectre, créant une harmonie chromatique entre voisines. Système extensible : ajouter une facette = insérer un point sur le spectre entre deux teintes existantes.

| Facette | Teinte | Hex |
|---------|--------|-----|
| Son | rouge | `#ff5b6e` |
| Régie | orange | `#ff8a3d` |
| Enseignement | jaune | `#ffc933` |
| Blog | vert | `#6cd97a` |
| Outils | cyan | `#3ec9c3` |
| Contact | violet | `#8b5bff` |

*L'attribution couleur ↔ facette est à confirmer (proposition initiale, peut être changée selon ressenti).*

**Neutres** : fond app `#0b0b10`, surface `#15151c`, surface élevée `#1f1f28`. Bordures `#2a2a33`. Texte primaire `#f0f0f5`, secondaire `#9a9aac`, tertiaire `#55555f`.

**Typographie** :
- **Titres / affichage** : **Barlow Condensed** (700, parfois 500). Condensé sportif, vertical fort, impact assumé. Majuscules avec letter-spacing serré pour les labels de facettes.
- **Texte technique / labels / readouts** : **JetBrains Mono** (ou IBM Plex Mono). Monospace, signature « machine ».
- *Pas de famille pour le corps long pour l'instant* — à valider à l'arrivée du Blog (peut-être Barlow Condensed en regular, ou une serif compagnon).

---

## 5. Arborescence (cible)

```
/            → Accueil : la platine (état 0)
/son         → Son : DJ + Live (+ sous-catégories esthétiques)
/regie       → Régie technique
/cours       → Enseignement MAO
/blog        → Blog (liste)
/blog/[slug] → Article
/outils      → Outils (BPM, pitch, samples…)
/contact     → Contact / liens
```
Routes en français (audience FR ; « MAO » est un terme du métier). Noms encore ajustables.

---

## 6. Contenu éditable (CMS) vs en dur

### Collections Sveltia (édition GUI)
| Collection | Contenu | Priorité | Statut |
|------------|---------|----------|--------|
| `gigs` | Dates : date, nom, lieu, genre, statut, heure | Haute | À créer |
| `blog` | Articles | Moyenne | En place |
| `releases` *(option)* | Mixes / sorties + embeds | Plus tard | À discuter |

### En dur (modifié par prompt)
Textes des facettes Régie / Enseignement, bio, détails EP (jusqu'à sortie), coordonnées, liens réseaux.

---

## 7. Récupération de l'existant
Le placeholder actuel sera remplacé, mais les **données réelles** sont récupérées : historique gigs (≈40 events, à nettoyer) → collection `gigs` ; détails EP (Chill/Main/Alter/Live) → facette Son ; compétences son (X32/M32, FOH, festivals) → facette Régie ; liens (SoundCloud hamcatmusic…) → Contact / intégrations.

---

## 8. Stack (en place)
Astro 5 statique · Tailwind · Sveltia CMS (local sans auth ; OAuth GitHub à brancher) · Cloudflare Workers (deploy auto au push) · domaine `hamcat.live` (Porkbun → NS Cloudflare, propagation en cours) · repo `github.com/fx-jam/fx.jam`.

---

## 9. Plan d'implémentation
1. **Design system** : palette (codage chromatique par facette), typographie (héros visuel), traitement fond/bordures/animations. ← prochaine grande étape.
2. **Composant platine** : anneau, rotation infinie, contre-rotation des pastilles, 3 états, agrandissement centre + écartement anneau.
3. **Layout & View Transitions** : routage vraies pages + transitions zoom.
4. **Page Son** (facette pilote) : structure DJ/Live + intégrations + dates (collection `gigs`).
5. **Autres facettes** : Régie, Enseignement, Outils, Contact, Blog.
6. **Collection `gigs`** : schéma + migration + affichage + Sveltia.
7. **Mobile** : dégradation du concept (la platine et le viewport-fixe doivent s'adapter au petit écran vertical — probablement scroll vertical autorisé, platine simplifiée ou carrousel linéaire).
8. **Polish** : overscroll, accessibilité (clavier OK, mais la platine doit rester navigable et lisible pour les lecteurs d'écran), perfs.

---

## 10. Questions ouvertes / à trancher
- **Sous-niveaux — métaphore « face A / face B »** : chaque facette est un disque qu'on retourne. Ex. Son : face A = DJ, face B = Live, chacune avec ses « tracks » (sous-catégories esthétiques). Mécanique du flip à concevoir (geste, animation). Applicable aussi à d'autres facettes (Régie A=FOH / B=monitors, Enseignement A=cours / B=ressources).
- **Intégrations cibles** (chantier dédié, plus tard) :
  - Instagram (publications)
  - Facebook (posts)
  - SoundCloud (releases)
  - Bandcamp (releases) — à vérifier faisabilité
  - Spotify (playlists)
  - Embed de sites externes ou de sections de sites externes — **cas par cas** : beaucoup de sites bloquent l'iframe via `X-Frame-Options`, à tester.
  - Autres médias son (à voir plus tard).
- **Centre en état 1** : valeur exacte de l'agrandissement + format précis de l'aperçu (à régler à l'œil dans le code).
- **Action du centre en état 0** : la galerie est-elle cliquable ? vers quoi ?
- **Mobile** : stratégie de dégradation à définir.
- **Collection `releases`** : au lancement ou plus tard ?
- **Police de corps long** : à valider à l'arrivée du Blog.
- **Attribution couleur ↔ facette** : confirmer la proposition initiale (Son=rouge ? jaune ? violet ?).
