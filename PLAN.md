# hamcat.live — Plan d'action

> Feuille de route tactique pour amener le site de « squelette platine fonctionnel » à « vitrine pro complète ». Document vivant — on coche, on amende, on réordonne.
>
> Créé le 29/05/2026. Hypothèse : 2-4 sessions de travail par semaine, mixant chat web (conception) et Claude Code (exécution).

---

## Vision en une ligne

Faire de `hamcat.live` la **carte de visite unique** que tu envoies, indifféremment, à un programmateur de festival, un organisateur cherchant un ingé son, et un élève potentiel — sans jamais avoir à expliquer « ah oui ce site c'est pour mon autre activité ».

---

## Critères de succès

Le site est « bon » quand :

1. Un **booker** qui arrive sur `/son` peut écouter un mix, voir tes 3 prochaines dates, et trouver ton contact booking en moins de 30 secondes, sans scroller.
2. Un **client tech** qui arrive sur `/regie` voit immédiatement ton niveau (X32/M32, festivals, intermittent) et peut te contacter pour un devis.
3. Un **élève potentiel** sur `/cours` comprend ton approche pédagogique et tes formules en quelques phrases.
4. Toi, tu peux **ajouter une date** en moins d'une minute depuis ton téléphone (via le CMS), sans toucher au code.
5. Le site **tient seul** : pas de dépendance à un service tiers qui plante (pas de Lovable, pas de paywall, pas d'IA générative dans le rendu final).

Ces critères sont la boussole. Une feature qui ne sert aucun d'eux est probablement à reporter.

---

## État actuel (07/06/2026)

✅ Infrastructure complète : domaine `hamcat.live` live, SSL OK, déploiement auto à chaque push.
✅ Design system solide (tokens centralisés, palette arc-en-ciel, Barlow Condensed).
✅ 8 routes propres avec page 404 designée.
✅ Facette Son v1 live (`/son`) : header + section Gigs (à venir / historique repliable) + placeholders bio, écoute, visuels, presskit.
✅ 57 gigs réels (2018-2025) importés dans la collection `gigs`, déployés.
✅ CMS Sveltia : auth GitHub en ligne opérationnelle (OAuth App + Worker Cloudflare `sveltia-cms-auth`).
✅ Jog fonctionnel (`Turntable.astro`) : rotation, navigation clavier + View Transitions.

❌ **Contenu des facettes** : toutes sauf Son restent « En construction ».
❌ **Jog à repenser** : mobile-first, inertie tactile, diffraction irisée — `Turntable.astro` est une base desktop.
❌ Aucune intégration de média externe.

**Verdict** : on est à environ 45-50% du site cible. Fondations solides, facette Son v1 live — l'essentiel visible est là, mais la navigation centrale (jog) et le contenu des autres facettes restent à construire.

---

## Phases de travail

### Phase 1 — Facette Son : v1 faite, à étoffer ✅ v1

**Ce qui est fait** : header, section Gigs (à venir / historique repliable), structure de page live.

**Ce qui reste** :
- Bio courte (texte à rédiger).
- Player principal (un mix SoundCloud).
- Visuels (photos live, artwork).
- Presskit (lien ou PDF).
- Sous-niveaux face A (DJ) / face B (Live) — peut rester en Phase 5 si trop complexe.

**Estimation** : 1-2 sessions pour étoffer le contenu (rédaction + intégration).

---

### Phase 2 — Migration des gigs ✅ FAITE

57 gigs réels (2018-2025) importés dans `src/content/gigs/` et déployés. Affichés dans la facette Son.

---

### Phase 3 — Remplir les autres facettes

**Régie technique** (`/regie`) : page la plus simple à remplir. Présentation, compétences (X32/M32, FOH, line array, MD), expérience (festivals listés), tarif/devis, contact pro. Tu as déjà toutes les données en mémoire, c'est une session de rédaction.

**Enseignement** (`/cours`) : à concevoir avec toi en chat web. Approche pédagogique, formules (cours unique vs accompagnement long), modalités (en présentiel Grenoble vs visio), tarifs ou demande de devis. Plus un sujet de **positionnement** que de mise en page — quel élève vises-tu ?

**Contact** (`/contact`) : page centrale qui agrège tous tes points d'entrée. Booking (mail dédié ?), tech (autre mail ?), pédagogie, réseaux. À structurer pour que chaque audience trouve sa porte.

**Outils** (`/outils`) : reportable. Tes anciens outils (bpm.html, pitch.html, samples.html) existent dans la branche d'archive, mais c'est un chantier secondaire qui n'apporte pas de valeur immédiate à tes audiences principales. À garder en réserve.

**Blog** (`/blog`) : déjà prêt techniquement. Ne nécessite que d'écrire des articles quand tu en auras envie — pas une priorité d'ouverture.

**Estimation** : 2-3 sessions au total pour Régie + Enseignement + Contact.

---

### Phase 4 — Jog mobile-first (prochain grand chantier produit)

**Pourquoi fusionner platine + mobile** : le jog se conçoit mobile-first dès le départ — pas de dégradation a posteriori. La contrainte tactile au pouce définit l'objet. Sur un site d'artiste, la majorité des visiteurs viennent du tactile (Instagram → lien en bio → téléphone).

**Travail à faire** :
- Décider : réécrire `Turntable.astro` en mobile-first ou l'étendre avec un breakpoint tactile ? (à trancher en chat web avant de coder).
- Concevoir l'inertie (easing, friction simulée) et la diffraction irisée (prototype en version simplifiée d'abord).
- Remplacer `index.astro` par le jog.
- Valider sur téléphone réellement, ajuster.

**Note** : la contrainte « viewport fixe, pas de scroll » au niveau accueil est maintenue — le jog se plie au petit écran via une conception mobile-first, pas via un carrousel de remplacement.

**Estimation** : 2-3 sessions (1 conception + 1-2 implémentation).

---

### Phase 5 — Sous-niveaux Son (face A / face B)

**Pourquoi pas plus tôt** : ambitieux conceptuellement (mécanique de flip à concevoir) et la facette Son version « simple » suffit largement pour communiquer pendant les premiers mois.

**Travail à faire** :
- Concevoir l'interaction de flip (chat web, prototype interactif).
- Implémenter (Claude Code).
- Peupler face A (DJ) et face B (Live) avec leurs sous-catégories esthétiques.

**Estimation** : 2-3 sessions. À reporter si Phase 1 suffit.

---

### Phase 6 — Intégrations médias externes

**Pourquoi en dernier** : forte valeur ajoutée mais inégale en faisabilité, et chaque plateforme est un mini-chantier.

**Inventaire à faire avant** :
- SoundCloud : embed officiel, marche bien. **Priorité haute** (player principal de la facette Son).
- Spotify : embed officiel, marche bien. **Priorité haute** (playlists).
- Bandcamp : embed officiel, fonctionnel. **Priorité moyenne** (si tu as un compte actif).
- Instagram : embeds Meta = restrictions fortes depuis 2020. Faisable mais limité. **Priorité moyenne**, à tester.
- Facebook : pareil que Instagram, et plus contraignant. **Priorité basse**, à voir si vraiment utile.
- Embeds de sites externes via iframe : **cas par cas**. Beaucoup bloquent via `X-Frame-Options`. À tester un par un.

**Estimation** : variable selon les plateformes choisies. Le minimum (Soundcloud + Spotify) = 1 session.

---

### Phase 7 — Polish & lancement

Avant de communiquer publiquement (annoncer le site sur tes réseaux) :
- `www.hamcat.live` redirigé vers `hamcat.live` (ou inversement).
- Métadonnées SEO/Open Graph propres (image de preview quand on partage le lien).
- Favicon personnalisé.
- Vérif accessibilité (clavier, lecteurs d'écran — la platine est challenging sur ce point).
- Test sur plusieurs navigateurs (Chrome, Firefox, Safari iOS, Samsung Internet).

**Estimation** : 1 session.

---

## Séquencement recommandé

Ordre logique :

1. ~~Phase 2 (migration gigs)~~ — **FAITE.**
2. Phase 4 (jog mobile-first) — prochain grand chantier produit. Conception en chat web d'abord.
3. Phase 1 (étoffer Son) — en parallèle du jog si possible (contenu indépendant de l'interface).
4. Phase 3 (autres facettes) — Régie d'abord (la plus rentable pro), puis Enseignement, puis Contact.
5. Phase 5 (sous-niveaux Son) — optionnel, après lancement.
6. Phase 6 (intégrations) — par incréments, au gré du besoin.
7. Phase 7 (polish) — juste avant communication officielle.

---

## Risques & points d'attention

**Sur-conception.** Le danger principal vu ton profil. Tu aimes les systèmes élégants (codage chromatique, géométrie radiale, métaphores fortes), c'est ta force, mais c'est aussi un risque de polish infini. Discipline : sortir une version "moyennement bien" plutôt que peaufiner indéfiniment une version "parfaite". Tu pourras toujours améliorer après mise en ligne.

**Tokens Claude.** Si tu fais beaucoup de Claude Code en Pro, tu vas hit les limites. Le rythme « 2-3 sessions de Claude Code par semaine + chat web pour la conception » est soutenable. Plus intense = tu seras rate-limité.

**Le piège de la perfection mobile.** La platine est conçue pour le desktop, et la dégradation mobile sera un compromis. Accepte que la version mobile soit différente, pas une copie miniature. Probablement plus simple, plus linéaire — c'est OK.

**La tentation des intégrations.** Tu m'as dit en vouloir « plein ». Attention : chaque intégration ajoute de la dépendance externe (si Meta ferme leur embed demain, ta page Instagram casse). Garder une logique d'**enrichissement** plutôt que de **dépendance** — le site doit rester complet même si toutes les intégrations tombent.

---

## Au retour de presta — la session de redémarrage idéale

1. Vérifier que `hamcat.live` répond toujours et que rien n'a cassé pendant le week-end.
2. Relire ce plan (5 min) et amender si tu vois autrement.
3. Choisir UNE phase à attaquer. Pas deux. Une.
4. Pour cette phase : si conception → chat web. Si exécution mécanique → Claude Code. Si mixte → commence par chat web pour le plan, puis bascule.
5. Commiter à la fin, mettre à jour ce document si tu as coché une étape.

---

## Notes libres / idées en réserve

(Ajoutées au fil des sessions, sans engagement)

- **Intégrations médias** (SoundCloud, Mixcloud, Spotify, Insta, Facebook) = chantier socle média à venir, nécessite liens/contenus de Fx.

---

*Document maintenu par Fx + Claude. Source de vérité conceptuelle = `ARCHITECTURE.md`. Brief Claude Code = `CLAUDE.md`.*

