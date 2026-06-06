# Brief — Mise à jour ARCHITECTURE.md & PLAN.md

> **Destinataire : Claude Code.** Objectif : (1) aligner la doc sur l'état réel du projet (juin 2026), (2) remplacer l'ancien concept « platine vinyle » par la vision « jog » de Fx dans ARCHITECTURE.md.
>
> ⚠️ **Validation requise** : Fx doit avoir relu et validé la section « Concept du jog » (Tâche 1) avant application. Appliquer ses corrections éventuelles d'abord.
>
> **Workflow** : créer la branche `docs/maj-architecture-jog`. Éditer les fichiers. Montrer un récap + `git diff` à Fx AVANT tout merge sur main. Ne PAS merger sans relecture (chat web).

---

## Contexte — état réel du projet (juin 2026)

Jalons faits depuis le 29/05 que la doc ne reflète pas encore :
- Domaine `hamcat.live` branché et live.
- Phase 2 faite : 57 gigs réels (2018-2025) importés dans `src/content/gigs/`, déployés.
- Facette Son v1 live (`/son`) : header + section Gigs (à venir / historique repliable) + placeholders bio, écoute, visuels, presskit.
- CMS Sveltia : auth GitHub en ligne OPÉRATIONNELLE (OAuth App `CMS hamcat.live` + Worker Cloudflare `sveltia-cms-auth`). Édition en ligne fonctionnelle.
- Composants jog existants : `src/components/Turntable.astro`, `Tile.astro` ; navigation clavier + View Transitions OK.

---

## Tâche 1 — ARCHITECTURE.md : remplacer la section « platine vinyle » par « le jog »

Remplacer INTÉGRALEMENT la section `## 3. Concept d'interface : la platine vinyle` (tout son contenu, jusqu'à la ligne précédant `## 4. Parti pris de design`) par le bloc ci-dessous :

---DÉBUT NOUVELLE SECTION 3---

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

---FIN NOUVELLE SECTION 3---

---

## Tâche 2 — ARCHITECTURE.md : mettre à jour « État courant »

Remplacer le bloc `## État courant (29/05/2026)` par un état daté de juin 2026 reflétant : domaine live, 57 gigs importés, facette Son v1 live, CMS auth en ligne opérationnelle. Retirer des priorités restantes les points faits (brancher domaine, migrer gigs, OAuth CMS). Réordonner les priorités restantes : jog (mobile-first) -> remplir facettes -> intégrations médias.

Mettre à jour l'en-tête : « Dernière mise à jour : 05/06/2026 (v5 — gigs importés, facette Son live, CMS auth OK, concept jog) ».

## Tâche 3 — ARCHITECTURE.md : ajuster les sections liées

- Partout où « platine » désigne le concept de navigation, utiliser « jog » (garder « platine vinyle » uniquement dans les mentions historiques/comparatives).
- Section « 9. Plan d'implémentation » : remplacer l'étape « composant platine » par « composant jog (mobile-first) : inertie tactile, symétrie radiale, centre = trou, diffraction irisée en cible ».
- Section « 10. Questions ouvertes » : AJOUTER : valeur/feeling de l'inertie (à régler à l'œil) ; faisabilité technique de la diffraction irisée (prototype) ; mobile-first implique-t-il de réécrire `Turntable.astro` ou de l'étendre ? ; renommage éventuel `Turntable.astro` -> `Jog.astro`. RETIRER de cette section : la CMS OAuth (faite). Conserver l'attribution couleur comme proposition.

## Tâche 4 — PLAN.md : mettre à jour état + séquencement

- Remplacer `## État actuel (29/05/2026...)` par un état de juin 2026 : Phase 2 (gigs) FAITE, facette Son v1 LIVE, CMS auth en ligne FAITE. Recalculer le « % du site cible » (plus avancé, ~45-50%).
- Marquer Phase 2 comme FAITE. Marquer Phase 1 (facette Son) « v1 faite, à étoffer (bio, écoute, visuels, presskit) ».
- Promouvoir le **jog mobile-first** comme prochain gros chantier produit. Fusionner l'ancienne « platine » (Phase implicite) et la Phase 4 « mobile » : le jog se conçoit mobile-first dès le départ, plus de « dégradation mobile » a posteriori.
- Mettre à jour « Séquencement recommandé » en conséquence.
- Dans « Notes libres / idées en réserve » : ajouter « intégrations médias (SoundCloud, Mixcloud, Spotify, Insta, Facebook) = chantier socle média à venir, nécessite liens/contenus de Fx ».

## Rappels workflow
- Branche `docs/maj-architecture-jog`. Pas de push direct sur main.
- Montrer récap + `git diff` à Fx AVANT merge.
- Une fois mergé : supprimer ce brief (`brief-maj-doc.md`) et la branche.
- Bonus repérage : un dossier `hamcat-live/` traîne à la racine du repo (résidu ?) — le signaler à Fx, ne pas le supprimer sans accord.
