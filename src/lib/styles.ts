// ─────────────────────────────────────────────────────────────────────────────
//  Vocabulaire de styles — source unique des helpers.
//
//  Les COULEURS vivent dans BaseLayout (jetons `--style-*`), jamais ici : la
//  regle du projet est que les tokens CSS n'ont qu'un seul domicile. Ce module
//  ne porte que la normalisation et l'affichage, qui etaient jusqu'ici
//  dupliques dans son.astro et library.json.ts — et allaient l'etre une
//  troisieme fois avec les pages de style.
// ─────────────────────────────────────────────────────────────────────────────

/** "Rock Psyché" -> "rock-psyche" : un intitule devient un identifiant stable,
 *  utilisable comme nom de jeton CSS, comme cle de filtre et comme URL. */
export const styleSlug = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
   .toLowerCase().trim()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/^-|-$/g, '');

/** Les styles d'une date, normalises et dedoublonnes en gardant l'ordre saisi :
 *  le premier nomme est le dominant, c'est lui qui colore la waveform. */
export const toStyles = (raw: string[] = []): string[] => {
  const out: string[] = [];
  for (const r of raw) {
    const k = styleSlug(r);
    if (k && !out.includes(k)) out.push(k);
  }
  return out;
};

/** Teinte d'un style, avec repli sur la couleur par defaut si le jeton n'existe
 *  pas encore — un style saisi librement reste affichable. */
export const styleColor = (slug: string): string =>
  `var(--style-${slug}, var(--style-default))`;

/** Quelques intitules ne se devinent pas depuis le slug. Le reste est rendu
 *  tel quel, en minuscules : c'est ainsi qu'ils s'ecrivent dans le milieu. */
const LABELS: Record<string, string> = {
  'hi-tech':           'hi-tech',
  'j-core':            'J-core',
  'dnb':               'drum & bass',
  'psyprog':           'psy prog',
  'dark-prog':         'dark prog',
  'full-on':           'full-on',
  'rock-psyche':       'rock psyché',
  'ethno-grooves':     'ethno grooves',
  'chill-hop':         'chill hop',
  'mashup-multigenre': 'mashup multigenre',
  'tech-house':        'tech house',
};

export const styleLabel = (slug: string): string =>
  LABELS[slug] ?? slug.replace(/-/g, ' ');
