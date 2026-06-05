/**
 * Source de vérité unique des facettes du site.
 *
 * Liste ordonnée selon le spectre arc-en-ciel (rouge → violet) — l'ordre
 * détermine la position angulaire sur la platine.
 *
 * Pour ajouter une facette :
 *   1. Ajouter un token couleur dans src/layouts/BaseLayout.astro (--facet-XXX)
 *   2. Ajouter l'entrée Tailwind dans tailwind.config.mjs
 *   3. Ajouter l'entrée ci-dessous
 *   4. Ajouter le sélecteur correspondant dans src/components/Tile.astro
 *   5. Créer la page src/pages/XXX.astro
 *
 * Note : ce fichier est volontairement minimal. La structure pourra évoluer
 * (sous-niveaux face A / face B, intégrations, etc.) au fil de la refonte.
 */

export type FacetKey =
  | 'son'
  | 'regie'
  | 'enseignement'
  | 'blog'
  | 'outils'
  | 'contact';

export interface Facet {
  key: FacetKey;
  label: string;        // Affichage court (ex. "Son")
  teaser: string;       // Phrase d'accroche (1 ligne)
  href: string;         // Route Astro
  enabled: boolean;     // Affichée sur le site ? (utile pour cacher une facette en chantier)
}

export const FACETS: readonly Facet[] = [
  {
    key: 'son',
    label: 'Son',
    teaser: 'DJ & Live — psytrance, hi-tech, goa',
    href: '/son',
    enabled: true,
  },
  {
    key: 'regie',
    label: 'Régie',
    teaser: 'Ingénierie son — FOH, X32/M32, festivals',
    href: '/regie',
    enabled: true,
  },
  {
    key: 'enseignement',
    label: 'Enseignement',
    teaser: 'Cours MAO — Ableton, production',
    href: '/cours',
    enabled: true,
  },
  {
    key: 'blog',
    label: 'Blog',
    teaser: 'Notes & articles — son, prod, théorie',
    href: '/blog',
    enabled: true,
  },
  {
    key: 'outils',
    label: 'Outils',
    teaser: 'Utilitaires — BPM, pitch, samples',
    href: '/outils',
    enabled: true,
  },
  {
    key: 'contact',
    label: 'Contact',
    teaser: 'Booking, liens, réseaux',
    href: '/contact',
    enabled: true,
  },
] as const;

/** Retourne la liste des facettes affichables (enabled === true). */
export const visibleFacets = (): readonly Facet[] =>
  FACETS.filter((f) => f.enabled);

/** Retourne une facette par sa clé. */
export const getFacet = (key: FacetKey): Facet | undefined =>
  FACETS.find((f) => f.key === key);
