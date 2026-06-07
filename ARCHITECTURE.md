# hamcat.live — Document d'architecture

> Plan directeur de la refonte. Document de référence vivant : on l'amende au fur et à mesure des décisions.
> Dernière mise à jour : 05/06/2026 (v5 — gigs importés, facette Son live, CMS auth OK, concept jog)

---

## État courant (07/06/2026)

**Infrastructure** : domaine `hamcat.live` live (Cloudflare Workers, SSL OK, déploiement auto à chaque push). Repo propre, identité git configurée (Hamcat + noreply).

**Fondations design** : tokens CSS centralisés dans `BaseLayout.astro` (palette arc-en-ciel + neutres + typo Barlow Condensed/JetBrains Mono). Tailwind branché sur ces tokens. **Source de vérité unique** : modifier un token = répercussion partout.

**Routes en place** :
- `/` — ancien index (placeholder, sera remplacé par le jog)
- `/son` — facette Son v1 live : header + section Gigs (à venir / historique repliable) + placeholders bio, écoute, visuels, presskit
- `/regie`, `/cours`, `/outils`, `/contact` — pages stub « en construction »
- `/blog` — liste d'articles (vide pour l'instant)
- `/blog/[slug]` — article individuel (rendu Markdown propre)
- `/404` — page 404 designée

**CMS** : Sveltia opérationnel en local et en ligne. Auth GitHub (OAuth App `CMS hamcat.live` + Worker Cloudflare `sveltia-cms-auth`) opérationnelle — édition en ligne fonctionnelle.

**Composants réutilisables** :
- `Turntable.astro` — composant jog existant (rotation, navigation clavier + View Transitions OK).
- `Tile.astro` — brique unitaire du jog (full-texte, colorée par facette).
- `src/data/facets.ts` — source de vérité unique de la liste des facettes (ordre = spectre arc-en-ciel).
- `StubPage.astro` — gabarit temporaire des facettes en chantier.

**Collection `gigs`** : 57 gigs réels (2018-2025) importés dans `src/content/gigs/`, déployés et affichés dans la facette Son.

**Ce qui reste à faire (priorités)** :
1. Construire le jog (mobile-first) : inertie tactile, symétrie radiale, centre = trou CD, diffraction irisée.
2. Remplacer le `index.astro` actuel par la vraie page d'accueil avec le jog.
3. Remplir les facettes (contenu réel : Régie, Cours, Outils, Contact, etc.).
4. Étoffer la facette Son (bio, écoute, visuels, presskit).
5. Intégrations médias (SoundCloud, Spotify, etc.).

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

## 3. Concept d'interface : le jog

> **Vision évolutive** (capturée le 05/06/2026, amenée à bouger). Remplace le concept « platine vinyle » initial : on conserve la mécanique radiale (rotation, symétrie, 3 états, contre-rotation des labels, overscroll), on fait évoluer l'objet et son esthétique.

### L'objet : un jog mi-CDJ / mi-vinyle, habillé en CD épuré

L'interface de navigation centrale est un **jog** (l'organe rotatif d'un lecteur DJ), pensé **à mi-chemin entre le jog d'un CDJ et un disque vinyle**, mais habillé du **look épuré et clean d'un CD**. Ce choix traduit l'identité de Fx, **autant analog que digital**.

Deux pièges à éviter explicitement :
- le **rétro-vinyle** (sillons, étiquette papier, texture poussiéreuse) : daté, étranger au quotidien de Fx.
- le **CDJ utilitaire** (boutons, écran LCD, plastique d'outil) : fonctionnel mais sans âme, ce n'est pas sa passion.

Cible : un disque **lisse, circulaire, contemporain**, qui évoque le CD par sa **surface irisée** et son **trou central**, sans skeuomorphisme appuyé.

### Mécanique physique rigoureuse

Le jog doit donner une **vraie sensation de matière**, pas une simple rotation mécanique :
- **Inertie** : un geste de lancement communique un élan ; le disque continue puis **décélère progressivement** sous une friction simulée (easing physique, non linéaire). On peut « lancer » le disque et le regarder ralentir.
- **Réactivité directe 1:1** : doigt/curseur posé sur le disque = le disque suit le geste exactement, sans latence ni décalage.
- La navigation clavier (flèches gauche/droite) existe déjà et reste ; le tactile/drag s'y ajoute avec cette mécanique d'inertie. **Les deux pilotent la même rotation.**

### Symétrie radiale (primordiale)

Principe **non négociable** pour Fx. Le disque s'y prête :
- Disque parfaitement circulaire, **trou central concentrique**.
- Facettes réparties à **360°/N** (équidistantes) via `N_FACETS` — ajouter une facette densifie le collier, toujours symétrique.
- Tout déséquilibre visuel est à proscrire.

### Couleur : diffraction irisée (arc-en-ciel)

L'arc-en-ciel reste la signature, traité **fidèlement à la physique d'un vrai CD** : la surface **diffracte la lumière** en un **dégradé irisé continu** qui **balaie le disque selon la rotation et l'angle**, plutôt qu'en aplats de couleur par facette.
- Quand le jog tourne, un **reflet arc-en-ciel se déplace** sur la surface (diffraction).
- Chaque facette **prend sa teinte dominante** en arrivant en position active.
- Objectif : **impressionnant sans être pompeux** — beau, smooth, fidèle à l'objet.

*À prototyper : l'irisation est l'effet le plus ambitieux techniquement. Valider en maquette avant engagement. Peut démarrer en version simplifiée (teintes par facette) puis évoluer vers la diffraction continue.*

### Le centre = le trou du CD = zone de contenu

Le **centre du disque** (le « trou » du CD) est la **zone d'affichage de la facette active** : l'objet est **à la fois navigation ET contenu** — on tourne pour choisir, le centre révèle. Réconcilie la métaphore du trou central avec les « 3 états » du concept initial (galerie au repos -> aperçu de la facette -> plein écran).

### Mobile-first (priorité de conception)

La vitrine sera **majoritairement consultée sur mobile** (bookers et fans via lien Instagram/réseaux). Le tactile au pouce est l'usage **naturel** d'un jog.
-> Le jog est **conçu d'abord pour le doigt sur petit écran vertical**, le desktop ensuite. Cela peut impliquer de **revoir `Turntable.astro`** (commencé en desktop). À acter avant de coder : repenser mobile-first plutôt que dégrader le desktop a posteriori.

---

## 4. Parti pris de design

- **Compact** : viewport fixe en desktop, jamais de scroll de page entière au niveau accueil/aperçu. Le scroll vertical n'existe qu'en état 2 (contenu complet) et dans les zones de contenu long.
- **Symétrie radiale stricte** (cf. jog).
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
/            → Accueil : le jog (état 0)
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
| `gigs` | Dates : date, nom, lieu, genre, statut, heure | Haute | En place (57 gigs importés) |
| `blog` | Articles | Moyenne | En place |
| `releases` *(option)* | Mixes / sorties + embeds | Plus tard | À discuter |

### En dur (modifié par prompt)
Textes des facettes Régie / Enseignement, bio, détails EP (jusqu'à sortie), coordonnées, liens réseaux.

---

## 7. Récupération de l'existant
Le placeholder actuel sera remplacé, mais les **données réelles** sont récupérées : historique gigs (≈40 events, à nettoyer) → collection `gigs` ; détails EP (Chill/Main/Alter/Live) → facette Son ; compétences son (X32/M32, FOH, festivals) → facette Régie ; liens (SoundCloud hamcatmusic…) → Contact / intégrations.

---

## 8. Stack (en place)
Astro 5 statique · Tailwind · Sveltia CMS (auth GitHub en ligne opérationnelle — OAuth App + Worker Cloudflare) · Cloudflare Workers (deploy auto au push) · domaine `hamcat.live` live · repo `github.com/fx-jam/fx.jam`.

---

## 9. Plan d'implémentation
1. **Design system** : palette (codage chromatique par facette), typographie (héros visuel), traitement fond/bordures/animations. ← prochaine grande étape.
2. **Composant jog (mobile-first)** : inertie tactile, symétrie radiale, centre = trou CD, diffraction irisée en cible (version simplifiée teintes par facette en premier), 3 états, contre-rotation des labels.
3. **Layout & View Transitions** : routage vraies pages + transitions zoom.
4. **Page Son** (facette pilote) : structure DJ/Live + intégrations + dates (collection `gigs`).
5. **Autres facettes** : Régie, Enseignement, Outils, Contact, Blog.
6. **Collection `gigs`** : schéma + migration + affichage + Sveltia.
7. **Mobile** : dégradation du concept (le jog et le viewport-fixe doivent s'adapter au petit écran vertical — probablement scroll vertical autorisé, platine simplifiée ou carrousel linéaire).
8. **Polish** : overscroll, accessibilité (clavier OK, mais la platine doit rester navigable et lisible pour les lecteurs d'écran), perfs.

---



### Étiquettes — rendu iridescent (vision à affiner)

Vision de Fx : les étiquettes de facettes ne doivent pas ressembler à de simples rectangles
posés sur le disque. L'objectif est un rendu qui "ressemble à une iridescence de disque" —
centré, beau, lisible. La vision n'est pas encore arrêtée ; pistes à explorer :
- Texte seul sans fond/bordure (supprimer le rectangle, garder le texte flottant)
- Effet background-clip: text avec gradient iridescent (texte arc-en-ciel)
- Luminosité/glow coloré autour du texte selon la facette (text-shadow multicouche)
- Intégration visuelle dans la surface du disque plutôt que "posé dessus"
Ce chantier nécessite une session de conception visuelle avant d'être briefé.

### État 2 — Grand cercle plein écran (vision enrichie)

Le principe du cercle s'applique partout sur le site. Quand une facette est ouverte (état 2),
un grand cercle prend tout l'écran EN CONSERVANT LE FOND du jog (le disque reste visible
en arrière-plan, atténué). Le contenu de la facette s'ouvre DANS ce grand cercle.

Le grand cercle contient à terme : texte, boutons, liens, images, vidéo, éléments cliquables
ou décoratifs, de fond — changeant selon la facette sélectionnée. Le cercle est la forme
fondamentale de l'UI : le jog est un petit cercle (navigation), les pages sont de grands
cercles (contenu). L'utilisateur ne "quitte" jamais le disque.

Techniquement : animation clip-path circle() de ~30% (jog) à ~150% (plein écran),
ou overlay circulaire à border-radius: 50% qui grossit via scale(). La couleur du cercle
dérive de --facet-* actif. View Transitions peut orchestrer l'animation d'ouverture/fermeture.

### Navigation : l'illusion d'une racine unique (état 1 → état 2)

Vision de Fx (à implémenter dans un chantier dédié) : la transition vers une facette (état 2)
ne doit PAS ressembler à une navigation vers une page radicalement différente. L'objectif est
de donner l'illusion que tout appartient à une même racine — le jog reste le contexte permanent,
les facettes sont des couches qui s'ouvrent PAR DESSUS lui (popup/overlay), pas des destinations
qui le remplacent.

Techniquement : les pages de facettes deviendraient des overlays/drawers sur le jog plutôt que
de vraies navigations (remplacer navigate(href) par un système de couches in-page). Le fond du
jog resterait visible en arrière-plan (atténué/flouté). L'utilisateur ne "quitte" jamais le disque.

Objectif UX : l'arborescence du site est instinctivement compréhensible sans perdre l'utilisateur
dans des sous-pages qui distraient du contexte. On "plonge" dans une facette, on "remonte" au jog.

Vocabulaire acté : état 0 (accueil/jog libre), état 1 (facette sélectionnée/aperçu),
état 2 (facette ouverte/overlay). Ces trois états forment le coeur de la navigation.

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
- **Inertie du jog** : valeur/feeling de la friction simulée (courbe d'easing, durée de décélération) — à régler à l'œil sur le prototype.
- **Diffraction irisée** : faisabilité technique à valider en maquette avant engagement. Démarrer en version simplifiée (teintes par facette) puis évoluer.
- **Mobile-first vs Turntable.astro** : le jog mobile-first implique-t-il de réécrire `Turntable.astro` (commencé en desktop) ou de l'étendre avec un breakpoint tactile ?
- **Renommage** : `Turntable.astro` → `Jog.astro` ? À trancher avant de réécrire le composant.
- **Collection `releases`** : au lancement ou plus tard ?
- **Police de corps long** : à valider à l'arrivée du Blog.
- **Attribution couleur ↔ facette** : confirmer la proposition initiale (Son=rouge ? jaune ? violet ?).


