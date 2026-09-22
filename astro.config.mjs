import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'child_process';

let commitHash = 'dev';
try { commitHash = execSync('git rev-parse --short HEAD').toString().trim(); } catch (_) {}

export default defineConfig({
  site: 'https://hamcat.live',
  // L'atelier est une page interne : elle n'a rien a faire dans le sitemap.
  integrations: [tailwind(), sitemap({ filter: (u) => !u.includes('/atelier') })],
  output: 'static',
  vite: {
    define: { '__COMMIT__': JSON.stringify(commitHash) },
  },
});
