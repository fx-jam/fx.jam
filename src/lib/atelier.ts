// ─────────────────────────────────────────────────────────────────────────────
//  Atelier — le systeme detecte ses propres trous et les pose en questions.
//
//  Il y a 421 trous dans les fiches. Les montrer tels quels serait une corvee
//  de plus ; tout le travail est donc dans le tri. Deux regles :
//
//  1. Ce qui est mecanique se resout sans question. Une ville deja connue pour
//     ce lieu est proposee par defaut : la question devient une confirmation.
//  2. On ouvre par ce qui coute un geste et se voit tout de suite. Une cover
//     manquante, c'est un tap et la pochette apparait dans le player. Une
//     description, c'est cinq minutes d'ecriture pour un texte lu une fois.
//     Les deux sont utiles, mais pas au meme moment.
//
//  Les parcours ("tracks") existent pour que Fx choisisse selon son humeur et
//  le temps qu'il a, plutot que de subir une file unique.
// ─────────────────────────────────────────────────────────────────────────────

export type Track = 'rapide' | 'lineup' | 'recits';
export type Input = 'choice' | 'text' | 'media';

export type Question = {
  id: string;
  track: Track;
  gig: string;            // identifiant de la fiche
  title: string;
  date: string;           // AAAA-MM-JJ
  field: string;          // champ du frontmatter a renseigner
  prompt: string;
  input: Input;
  options?: string[];     // pour `choice`
  suggestion?: string;    // reponse proposee : la question devient un oui/non
  why?: string;           // ce que la reponse debloque, quand ce n'est pas evident
  media?: { id: string; kind: string }[];
  weight: number;         // plus petit = pose plus tot
};

export const ROLES = [
  'DJ set', 'warm-up', 'closing', 'peak-time', 'live', 'concept set', 'B2B',
];
export const DUREES = ['45min', '1h', '1h30', '2h', '3h', '4h'];

type Gig = {
  id: string;
  data: {
    title: string; date: Date; venue?: string; city?: string;
    role?: string; duration?: string; lineup?: string[];
    description?: string; cover?: string;
    media?: { id: string; kind: string }[];
    draft?: boolean;
  };
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function buildQueue(gigs: Gig[]): Question[] {
  const live = gigs.filter(g => !g.data.draft);

  // Ville deja connue pour ce lieu : c'est ce qui transforme 61 questions
  // ouvertes en 10 confirmations. On ne propose que si le lieu n'a jamais eu
  // qu'une seule ville — sinon on devine, et deviner salit la donnee.
  const cityOf = new Map<string, Set<string>>();
  for (const g of live) {
    const v = (g.data.venue ?? '').trim().toLowerCase();
    if (!v || !g.data.city) continue;
    (cityOf.get(v) ?? cityOf.set(v, new Set()).get(v)!).add(g.data.city);
  }
  const knownCity = (venue?: string) => {
    const s = cityOf.get((venue ?? '').trim().toLowerCase());
    return s && s.size === 1 ? [...s][0] : undefined;
  };

  // Villes deja employees : des suggestions valent mieux qu'un champ vide.
  const cities = [...new Set(live.map(g => g.data.city).filter(Boolean) as string[])]
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const out: Question[] = [];
  const push = (q: Omit<Question, 'title' | 'date' | 'gig'>, g: Gig) =>
    out.push({ ...q, gig: g.id, title: g.data.title, date: iso(g.data.date) });

  for (const g of live) {
    const d = g.data;

    // 1. Cover — un tap, et la pochette apparait aussitot dans le player et
    //    dans la projection. Le retour le plus immediat de toute la file.
    if ((d.media ?? []).length > 0 && !d.cover) {
      push({
        id: `${g.id}:cover`, track: 'rapide', field: 'cover',
        prompt: 'Quelle image represente cette date ?',
        input: 'media', media: d.media, weight: 10,
        why: 'Elle devient la pochette dans le player et la première image projetée.',
      }, g);
    }

    // 2. Ville — confirmation quand elle est deduite du lieu, sinon saisie
    //    assistee par les villes deja connues.
    if (!d.city && d.venue) {
      const sug = knownCity(d.venue);
      push({
        id: `${g.id}:city`, track: 'rapide', field: 'city',
        prompt: sug
          ? `${d.venue} — c'est bien à ${sug} ?`
          : `Dans quelle ville se trouve ${d.venue} ?`,
        input: 'text', suggestion: sug, options: cities,
        weight: sug ? 20 : 40,
      }, g);
    }

    // 3. Role et duree — vocabulaires fermes, donc un tap chacun.
    if (!d.role) {
      push({
        id: `${g.id}:role`, track: 'rapide', field: 'role',
        prompt: 'Quel type de set ?',
        input: 'choice', options: ROLES, weight: 30,
      }, g);
    }
    if (!d.duration) {
      push({
        id: `${g.id}:duration`, track: 'rapide', field: 'duration',
        prompt: 'Combien de temps ?',
        input: 'choice', options: DUREES, weight: 50,
      }, g);
    }

    // 4. Line-up — le plus cher a repondre et le plus rentable : c'est lui qui
    //    fera exister les artistes comme entites, donc le graphe.
    if (!(d.lineup ?? []).length) {
      push({
        id: `${g.id}:lineup`, track: 'lineup', field: 'lineup',
        prompt: 'Qui jouait avec toi ce soir-là ?',
        input: 'text', weight: 60,
        why: 'Chaque nom crée un lien : c’est ce qui fera exister les pages d’artiste.',
      }, g);
    }

    // 5. Description — un texte lu une fois, en dernier.
    if (!d.description) {
      push({
        id: `${g.id}:description`, track: 'recits', field: 'description',
        prompt: 'Qu’est-ce qu’il faut retenir de cette date ?',
        input: 'text', weight: 80,
      }, g);
    }
  }

  // A poids egal, les dates recentes d'abord : la memoire est plus fraiche et
  // ce sont elles qu'on regarde en premier sur le site.
  return out.sort((a, b) => a.weight - b.weight || b.date.localeCompare(a.date));
}

export const TRACKS: { key: Track; label: string; blurb: string }[] = [
  { key: 'rapide', label: 'Rapide',  blurb: 'Un tap par question — cover, ville, type de set, durée.' },
  { key: 'lineup', label: 'Line-up', blurb: 'Qui jouait avec toi. C’est ce qui construit le graphe.' },
  { key: 'recits', label: 'Récits',  blurb: 'Raconter les dates. Le plus long, le moins urgent.' },
];
