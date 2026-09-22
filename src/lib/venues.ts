// ─────────────────────────────────────────────────────────────────────────────
//  Lieux — deuxieme entite de premier rang (decision du 2026-09-22).
//
//  Il n'existe pas de referentiel de lieux : `venue` est du texte libre sur
//  chaque date. L'orthographe a ete unifiee en amont (fusion des variantes de
//  casse, d'accent et d'apostrophe), donc le slug suffit ici a regrouper.
//  Le jour ou un lieu meritera ses propres champs (adresse, capacite, site),
//  ce module sera l'endroit ou brancher la collection.
// ─────────────────────────────────────────────────────────────────────────────

export const venueSlug = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
   .toLowerCase().trim()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/^-|-$/g, '');

/** Un `venue` qui ne nomme pas un lieu mais une zone : on ne lui fabrique pas
 *  de page, ca ferait une fiche vide qui dessert la vitrine. Les dates
 *  concernees restent dans l'agenda, simplement sans lien de lieu. */
export const isPlaceholderVenue = (v: string): boolean =>
  !v || /^\d+$/.test(v.trim());
