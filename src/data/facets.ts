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

import sonData from './son.json';
import regieData from './regie.json';
import projetsData from './projets.json';
import blogData from './blog.json';
import outilsData from './outils.json';
import contactData from './contact.json';

export type FacetKey =
  | 'son'
  | 'regie'
  | 'projets'
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
    label: sonData.label || 'Son',
    teaser: sonData.teaser || 'DJ & Live — psytrance, hi-tech, goa',
    href: '/son',
    enabled: true,
  },
  {
    key: 'regie',
    label: regieData.label || 'Régie',
    teaser: regieData.teaser || 'Ingénierie son — FOH, X32/M32, festivals',
    href: '/regie',
    enabled: true,
  },
  {
    // Remplace Cours (24/09) : Fx a une douzaine d'eleves et n'en cherche pas
    // plus, alors que les projets collectifs — ADN, Hadra, le label, le booking
    // — representent des annees de matiere sans aucun endroit ou exister.
    // Le champ `organizer` des fiches fait deja la jointure avec l'agenda.
    key: 'projets',
    label: projetsData.label || 'Projets',
    teaser: projetsData.teaser || 'Collectifs, festivals, label, booking',
    href: '/projets',
    enabled: true,
  },
  {
    key: 'blog',
    label: blogData.label || 'Blog',
    teaser: blogData.teaser || 'Notes & articles',
    href: '/blog',
    enabled: true,
  },
  {
    key: 'outils',
    label: outilsData.label || 'Outils',
    teaser: outilsData.teaser || 'Utilitaires — BPM, pitch, samples',
    href: '/outils',
    enabled: true,
  },
  {
    key: 'contact',
    label: contactData.label || 'Contact',
    teaser: contactData.teaser || 'Booking, liens, réseaux',
    href: '/contact',
    enabled: true,
  },
];

/** Retourne la liste des facettes affichables (enabled === true). */
export const visibleFacets = (): readonly Facet[] =>
  FACETS.filter((f) => f.enabled);

/** Retourne une facette par sa clé. */
export const getFacet = (key: FacetKey): Facet | undefined =>
  FACETS.find((f) => f.key === key);
