/** @type {import('tailwindcss').Config} */
// Configuration minimale : la source de vérité du design est dans
// src/layouts/BaseLayout.astro (tokens CSS). Tailwind est branché sur ces
// tokens via les variables CSS pour rester cohérent.
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Facettes (couleurs CMS / arc-en-ciel)
        'facet-son': 'var(--facet-son)',
        'facet-regie': 'var(--facet-regie)',
        'facet-cours': 'var(--facet-cours)',
        'facet-blog': 'var(--facet-blog)',
        'facet-outils': 'var(--facet-outils)',
        'facet-contact': 'var(--facet-contact)',
        // Neutres
        'bg-app': 'var(--bg-app)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'border-app': 'var(--border)',
        // Texte
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
