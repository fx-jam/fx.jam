import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'child_process';

let commitHash = 'dev';
try { commitHash = execSync('git rev-parse --short HEAD').toString().trim(); } catch (_) {}

export default defineConfig({
  site: 'https://hamcat.live',
  integrations: [tailwind(), sitemap()],
  output: 'static',
  vite: {
    define: { '__COMMIT__': JSON.stringify(commitHash) },
  },
});
