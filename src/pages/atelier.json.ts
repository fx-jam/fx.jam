import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildQueue } from '../lib/atelier';

// La file est calculee au build, comme /library.json : la page reste legere et
// il n'existe qu'une seule source de verite. Rien de sensible ici — ce sont les
// trous d'un agenda public.
export const GET: APIRoute = async () => {
  const gigs = await getCollection('gigs');
  const questions = buildQueue(gigs as any);
  return new Response(JSON.stringify({ version: 1, questions }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
