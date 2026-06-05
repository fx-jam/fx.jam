import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    genre: z.array(z.string()).default([]),      // Ex: ["psytrance", "hi-tech"]
    duration: z.string().optional(),             // Ex: "2h", "1h30"
    lineup: z.array(z.string()).default([]),     // Autres artistes au line-up
    // Médias & liens
    image: z.string().optional(),
    recording: z.string().url().optional(),      // Lien SoundCloud / Mixcloud
    eventUrl: z.string().url().optional(),       // Lien de l'événement
    // Méta
    featured: z.boolean().default(false),        // Mettre en avant
    draft: z.boolean().default(false),
    notes: z.string().optional(),                // Notes privées (ne s'affichent pas forcément)
  }),
});

export const collections = { blog, gigs };
