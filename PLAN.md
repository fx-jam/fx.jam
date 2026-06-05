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

## État actuel (29/05/2026, fin de matinée)

✅ Infrastructure complète : domaine branché, SSL OK, déploiement auto à chaque push.
✅ Platine vinyle fonctionnelle (rotation, 3 états, View Transitions, navigation clavier/tactile).
✅ Design system solide (tokens centralisés, palette arc-en-ciel, Barlow Condensed).
✅ 8 routes propres avec page 404 designée.
✅ CMS Sveltia opérationnel en local (collections `blog` et `gigs`).
✅ Repo propre, doc d'architecture v4, brief Claude Code en place.

❌ **Aucune facette n'a de vrai contenu** — la platine est une coquille fonctionnelle.
❌ Mobile non traité (la platine 620×620 ne tient pas verticalement).
❌ Historique des gigs réels pas encore migré.
❌ Aucune intégration de média externe.

**Verdict** : on est à environ 30% du site cible. Les fondations valent les 70% restants — c'est juste qu'on en voit peu visuellement.

---

## Phases de travail

### Phase 1 — Rendre la facette Son présentable (la plus urgente)

**Pourquoi en premier** : Son est ta facette principale, c'est celle vers laquelle 80% des visiteurs vont aller. Tant qu'elle dit « En construction », la platine ressemble à une démo, pas à un site.

**Travail à faire** :
- Concevoir la mise en page de la facette Son en plein écran (chat web, maquette nécessaire).
- Décider du traitement des sous-niveaux face A / face B (DJ vs Live) — peut-être différé en Phase 4 si trop complexe.
- Coder le layout (Claude Code).
- Remplir le contenu : présentation courte, player principal (un mix SoundCloud par défaut), 3 prochaines dates depuis la collection `gigs`, lien booking.

**Pré-requis** : migration des gigs (Phase 2) doit avoir commencé pour qu'on ait des dates à afficher. Sinon on met des dates statiques temporairement.

**Estimation** : 2-3 sessions (1 conception + 1-2 implémentation).

---

### Phase 2 — Migrer l'historique des gigs (chantier idéal Claude Code)

**Pourquoi maintenant** : c'est mécanique, ennuyeux, parfait pour de l'autonomie agent. Et ça débloque la facette Son qui dépend des gigs.

**Travail à faire** :
- Récupérer le contenu de la branche `archive/ancien-site-bricolage` (les ~40 gigs en HTML).
- Nettoyer les incohérences (dates 2024 sous header 2018, formats mélangés — tu m'avais signalé toi-même que le contenu était « placeholder à wipe »).
- Écrire un fichier `.md` par gig dans `src/content/gigs/`, conforme au schéma existant.
- Vérifier que le build passe et que les dates s'affichent dans la collection.

**Important** : il faudra **trancher au cas par cas** sur les gigs douteux (dates floues, événements jamais confirmés). Claude Code te listera ces cas, tu décides.

**Estimation** : 1 session Claude Code en autonomie (30-60 minutes de calcul, peu d'aller-retours).

---

### Phase 3 — Remplir les autres facettes

**Régie technique** (`/regie`) : page la plus simple à remplir. Présentation, compétences (X32/M32, FOH, line array, MD), expérience (festivals listés), tarif/devis, contact pro. Tu as déjà toutes les données en mémoire, c'est une session de rédaction.

**Enseignement** (`/cours`) : à concevoir avec toi en chat web. Approche pédagogique, formules (cours unique vs accompagnement long), modalités (en présentiel Grenoble vs visio), tarifs ou demande de devis. Plus un sujet de **positionnement** que de mise en page — quel élève vises-tu ?

**Contact** (`/contact`) : page centrale qui agrège tous tes points d'entrée. Booking (mail dédié ?), tech (autre mail ?), pédagogie, réseaux. À structurer pour que chaque audience trouve sa porte.

**Outils** (`/outils`) : reportable. Tes anciens outils (bpm.html, pitch.html, samples.html) existent dans la branche d'archive, mais c'est un chantier secondaire qui n'apporte pas de valeur immédiate à tes audiences principales. À garder en réserve.

**Blog** (`/blog`) : déjà prêt techniquement. Ne nécessite que d'écrire des articles quand tu en auras envie — pas une priorité d'ouverture.

**Estimation** : 2-3 sessions au total pour Régie + Enseignement + Contact.

---

### Phase 4 — Mobile (incontournable avant de communiquer)

**Pourquoi à cette étape** : sur un site d'artiste, la majorité des visiteurs viennent du tactile (Instagram → lien en bio → téléphone). Lancer sans version mobile = brûler 70% du trafic.

**Travail à faire** :
- Concevoir la dégradation de la platine sur petit écran vertical (chat web, maquette). Options : platine simplifiée, carrousel linéaire vertical, ou grille — à comparer.
- Implémenter le breakpoint et la version mobile (Claude Code).
- Tester sur ton téléphone réellement, ajuster.

**Note importante** : la contrainte « viewport fixe, pas de scroll » devra **être relâchée sur mobile**. Documenté dans `ARCHITECTURE.md` comme question ouverte.

**Estimation** : 2 sessions (1 conception + 1 implémentation/itérations).

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
- OAuth GitHub branché pour le CMS en ligne (édition depuis le téléphone, en déplacement).
- `www.hamcat.live` redirigé vers `hamcat.live` (ou inversement).
- Métadonnées SEO/Open Graph propres (image de preview quand on partage le lien).
- Favicon personnalisé.
- Vérif accessibilité (clavier, lecteurs d'écran — la platine est challenging sur ce point).
- Test sur plusieurs navigateurs (Chrome, Firefox, Safari iOS, Samsung Internet).

**Estimation** : 1 session.

---

## Séquencement recommandé

Ordre logique :

1. Phase 2 (migration gigs) — Claude Code en autonomie, idéal en début de soirée.
2. Phase 1 (facette Son) — chat web pour conception puis Claude Code pour exécution.
3. Phase 3 (autres facettes) — par ordre d'importance pour toi : Régie d'abord (la plus rentable pro), puis Enseignement, puis Contact.
4. Phase 4 (mobile) — **avant toute communication publique du site**.
5. Phase 5 (sous-niveaux Son) — optionnel, après lancement.
6. Phase 6 (intégrations) — par incréments, au gré du besoin.
7. Phase 7 (polish) — juste avant communication officielle.

Phases 2 et 3 peuvent se faire en parallèle si tu veux.

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

- *(rien pour l'instant — à enrichir)*

---

*Document maintenu par Fx + Claude. Source de vérité conceptuelle = `ARCHITECTURE.md`. Brief Claude Code = `CLAUDE.md`.*
