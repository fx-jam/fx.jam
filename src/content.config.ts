import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Sveltia ecrit '' pour un champ URL laisse vide, et z.string().url() refuse la
// chaine vide : sans ce pretraitement, la moindre edition d'un gig dans le CMS
// faisait echouer le build et bloquait toute mise en ligne.
const urlOrEmpty = z.preprocess(
  v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().url().optional(),
);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const gigs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gigs' }),
  schema: z.object({
    // Identité
    title: z.string(),                          // Nom de l'événement
    date: z.coerce.date(),                       // Date du gig
    // Format & rôle
    format: z.enum(['dj', 'live', 'hybride']),   // Type de set
    role: z.string().optional(),                 // Ex: "DJ set", "Warm-up", "B2B avec X", "Live Sylphyo"
    // Lieu
    venue: z.string(),                           // Nom du lieu / festival
    city: z.string().optional(),
    country: z.string().default('France'),
    // Détails
    description: z.string().optional(),          // Texte libre affiché sur la date
    genre: z.array(z.string()).default([]),      // Ex: ["psytrance", "hi-tech"]
    duration: z.string().optional(),             // Ex: "2h", "1h30"
    lineup: z.array(z.string()).default([]),     // Autres artistes au line-up
    // Médias & liens
    image: z.string().optional(),
    // Medias rattaches a la date, servis depuis R2. `cover` est l'image de la
    // date : pochette dans le player et image principale en fond.
    media: z.array(z.object({
      id:   z.string(),
      kind: z.enum(['image', 'video']).default('image'),
    })).default([]),
    cover: z.string().optional(),
    // Etat de l'enregistrement quand il n'y a pas (encore) d'URL : evite une case
    // vide dans l'agenda et distingue "jamais enregistre" de "enregistre, a venir".
    recordState: z.enum(['none', 'soon', 'tracklist']).default('none'),
    // A defaut d'enregistrement, une playlist Spotify reconstituant le set :
    // chaque date a alors quelque chose a ecouter. URL ou identifiant.
    tracklist: z.string().optional(),
    recording: urlOrEmpty,      // Enregistrement principal (fichier direct R2, SoundCloud, Mixcloud)
    // Un gig peut avoir plusieurs enregistrements (deux scenes le meme week-end, par exemple).
    // `recording` reste l'entree simple ; `recordings` sert des qu'il y en a plus d'un.
    recordings: z.array(z.object({
      url:   z.string(),
      label: z.string().optional(),              // Ex: "Main stage", "Cocon"
    })).default([]),
    eventUrl: urlOrEmpty,       // Lien de l'événement
    // Méta
    featured: z.boolean().default(false),        // Mettre en avant
    draft: z.boolean().default(false),
    notes: z.string().optional(),                // Notes privées (ne s'affichent pas forcément)
  }),
});

export const collections = { blog, gigs };
