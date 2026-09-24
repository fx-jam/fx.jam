// ─────────────────────────────────────────────────────────────────────────────
//  Les deux faces d'une facette — étape 1 des jaquettes.
//
//  Voir claude/architecture-jaquettes.md. Le recto porte l'identité, le verso
//  l'index, le livret est la page complète. Trois règles tenues ici :
//
//  1. Le recto ne déborde jamais : ce qui ne tient pas passe au verso. Le code
//     ne tronque pas, il refuse — `rectoDeborde()` le signale à l'atelier, qui
//     le dira à la saisie plutôt que de laisser découvrir le dégât en ligne.
//  2. Les chiffres du recto sont CALCULÉS. Le JSON ne porte qu'une clé
//     (« dates », « sets », « styles ») ; la valeur est comptée au build. Les
//     écrire à la main, c'est se condamner à les voir mentir dans six mois.
//  3. Les fichiers existants ne sont pas restructurés : `recto` et `verso`
//     s'ajoutent à côté de ce qui s'y trouve déjà, et leur absence donne des
//     valeurs par défaut plutôt qu'une erreur.
// ─────────────────────────────────────────────────────────────────────────────
import { getCollection } from 'astro:content';
import { FACETS, type FacetKey } from '../data/facets';
import sonData     from '../data/son.json';
import regieData   from '../data/regie.json';
import coursData   from '../data/cours.json';
import blogData    from '../data/blog.json';
import outilsData  from '../data/outils.json';
import contactData from '../data/contact.json';

export type Chiffre = { cle: string; quoi?: string };
export type Recto = {
  image?: string;
  titre?: string;
  phrase?: string;
  chiffres?: Chiffre[];
};
export type EntreeVerso = { titre: string; texte?: string; href?: string };
export type Verso = { intro?: string; entrees?: EntreeVerso[] };

export type Jaquette = {
  cle: FacetKey;
  label: string;
  href: string;
  recto: Recto & { chiffres: { valeur: string; quoi: string }[] };
  verso: Required<Verso>;
  chantier: string | null;
};

const BRUT: Record<string, any> = {
  son: sonData, regie: regieData, cours: coursData,
  blog: blogData, outils: outilsData, contact: contactData,
};

/** Limites du recto. Au-delà, ça part au verso — ce ne sont pas des seuils
 *  esthétiques mais la condition pour qu'une jaquette reste lisible à deux
 *  mètres, ce qui est sa seule raison d'être en état 2. */
export const RECTO_MAX = { phrase: 42, chiffres: 3, titre: 18 };
export const VERSO_MAX = { intro: 180, entrees: 6, titre: 22, texte: 64 };

export function rectoDeborde(r: Recto): string[] {
  const p: string[] = [];
  if ((r.titre ?? '').length > RECTO_MAX.titre) p.push(`titre > ${RECTO_MAX.titre} signes`);
  if ((r.phrase ?? '').length > RECTO_MAX.phrase) p.push(`phrase > ${RECTO_MAX.phrase} signes`);
  if ((r.chiffres ?? []).length > RECTO_MAX.chiffres) p.push(`plus de ${RECTO_MAX.chiffres} chiffres`);
  return p;
}

export function versoDeborde(v: Verso): string[] {
  const p: string[] = [];
  if ((v.intro ?? '').length > VERSO_MAX.intro) p.push(`intro > ${VERSO_MAX.intro} signes`);
  if ((v.entrees ?? []).length > VERSO_MAX.entrees) p.push(`plus de ${VERSO_MAX.entrees} entrées`);
  return p;
}

/** Compte ce que le site contient réellement. Une seule lecture des collections
 *  pour les six facettes : le build ne doit pas payer six fois la même chose. */
async function compteurs(): Promise<Record<string, { valeur: string; quoi: string }>> {
  const gigs = (await getCollection('gigs')).filter(g => !g.data.draft);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const styles = new Set<string>();
  let sets = 0, media = 0, lieux = new Set<string>();
  for (const g of gigs) {
    for (const s of g.data.genre ?? []) styles.add(s.trim().toLowerCase());
    if (g.data.recording || (g.data.recordings ?? []).length) sets++;
    media += (g.data.media ?? []).length;
    const v = (g.data.venue ?? '').trim();
    if (v && !/^\d+$/.test(v)) lieux.add(v.toLowerCase());
  }
  let billets = 0;
  try { billets = (await getCollection('blog')).filter(b => !b.data.draft).length; } catch { /* collection vide */ }

  const n = (x: number) => String(x);
  return {
    dates:    { valeur: n(gigs.length),  quoi: 'dates' },
    apres:    { valeur: n(gigs.filter(g => g.data.date >= today).length), quoi: 'à venir' },
    sets:     { valeur: n(sets),         quoi: 'sets à écouter' },
    styles:   { valeur: n(styles.size),  quoi: 'styles' },
    lieux:    { valeur: n(lieux.size),   quoi: 'lieux' },
    medias:   { valeur: n(media),        quoi: 'médias' },
    billets:  { valeur: n(billets),      quoi: 'articles' },
  };
}

export async function jaquettes(): Promise<Jaquette[]> {
  const c = await compteurs();
  return FACETS.filter(f => f.enabled).map(f => {
    const d = BRUT[f.key] ?? {};
    const r: Recto = d.recto ?? {};
    const v: Verso = d.verso ?? {};
    return {
      cle: f.key,
      label: f.label,
      href: f.href,
      recto: {
        image:  r.image ?? d.cover_image ?? '',
        titre:  r.titre ?? f.label,
        phrase: r.phrase ?? f.teaser ?? '',
        // Une clé inconnue est ignorée plutôt que rendue en « undefined ».
        chiffres: (r.chiffres ?? [])
          .map(x => (c[x.cle] ? { ...c[x.cle], quoi: x.quoi ?? c[x.cle].quoi } : null))
          .filter(Boolean)
          .slice(0, RECTO_MAX.chiffres) as { valeur: string; quoi: string }[],
      },
      verso: {
        intro:   v.intro ?? '',
        entrees: (v.entrees ?? []).slice(0, VERSO_MAX.entrees),
      },
      chantier: d.chantier ?? null,
    };
  });
}

/** Clés de compteur proposées à la saisie, dans l'atelier. */
export const CLES_CHIFFRES = ['dates', 'apres', 'sets', 'styles', 'lieux', 'medias', 'billets'];
