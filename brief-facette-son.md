# BRIEF : facette Son v1 — branche dediee feat/facette-son

CONTEXTE : remplace le stub src/pages/son.astro par une vraie page. La facette Son est le point d'entree principal (fans + bookers). Pour cette v1, on code la CHARPENTE complete + la section GIGS pleinement fonctionnelle. Les autres sections sont des placeholders structures (a remplir plus tard).

REGLE ABSOLUE : tous les styles utilisent les tokens CSS de BaseLayout.astro. AUCUNE couleur/taille/police hardcodee. Couleur d'accent de cette facette = var(--facet-son) (#ff5b6e). Fonds = var(--bg-app / --bg-surface / --bg-elevated), textes = var(--text-primary / --text-secondary / --text-tertiary), polices = var(--font-display / --font-mono).

## Etapes

1. Cree et bascule sur la branche feat/facette-son.

2. Structure de la page /son, dans cet ordre :
   a. HEADER : titre de la facette (accent var(--facet-son)) + placeholder pour description courte (marque clairement TODO, pas de faux contenu).
   b. SECTION GIGS (le coeur, fonctionnel) :
      - Lit la collection "gigs" via getCollection('gigs').
      - Separe en DEUX groupes par rapport a la date du jour : "A venir" (date >= aujourd'hui, tri ascendant) et "Historique" (date < aujourd'hui, tri descendant, plus recent en haut).
      - "A venir" affiche en avant, en haut. "Historique" en dessous.
      - Chaque gig affiche : date (format lisible FR), title, venue (si differente du title), genre (tags). Format (dj/live) discret.
      - Si "A venir" est vide : etat propre (ex "Prochaines dates bientot annoncees").
   c. PLACEHOLDERS structures (sections vides mais stylees, marquees TODO en commentaire) pour : Ecoute/Streaming, Visuels (photos/videos), Presskit. Juste des conteneurs <section> avec titre, prets a remplir. PAS de faux contenu.

3. Reutilise les composants/layout existants si pertinent (regarde BaseLayout, src/components/). Coherent avec le reste (View Transitions, navigation clavier inter-facettes deja en place).

4. Ne touche PAS a main. Ne modifie PAS BaseLayout.astro (les tokens existent deja, utilise-les). Lance npm run build pour verifier.

5. MONTRE le code de son.astro + le resultat du build + decris le rendu. ATTENDS validation explicite de Fx avant commit/push. PAS de merge sur main sans accord.

6. Quand valide : commit + push sur feat/facette-son. Entree CLAUDE_LOG.md (fait, arbitrages pris, TODO restants : bio, streaming, visuels, presskit).
