import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Sert CLAUDE_LOG.md en texte brut sur /claude-log.md
// Genere au build (output static). Pas de lien visible sur le site, absent du sitemap.
export const GET: APIRoute = () => {
  const logPath = fileURLToPath(new URL('../../CLAUDE_LOG.md', import.meta.url));
  const content = readFileSync(logPath, 'utf-8');
  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'noindex',
    },
  });
};
