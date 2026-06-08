# Brief — media-browser : file browser sur media.hamcat.live

> Branche : `feat/media-browser` depuis main a jour.
> Nouveau Worker Cloudflare independant dans `workers/media-browser/`.
> Montrer diff + `wrangler deploy --dry-run` (ou build) a Fx AVANT deploy reel.
> Regle tokens : les couleurs CSS du Worker sont inline (pas dans BaseLayout.astro).
> Supprimer ce brief apres merge.

---

## Contexte

media.hamcat.live pointe actuellement directement vers le bucket R2 hamcat-media.
On ajoute un Cloudflare Worker DEVANT R2 pour :
  1. Generer un file browser HTML naviguable (dossiers, fichiers, preview images)
  2. Servir les fichiers avec header Content-Disposition : attachment (bouton download)
  3. Permettre une protection Cloudflare Access ulterieure (pas dans ce brief)

Le Worker remplace le Custom Domain direct de R2.
IMPORTANT : apres deploy du Worker, supprimer le Custom Domain R2 sur hamcat-media dans le dashboard
Cloudflare (Settings → Custom Domains → supprimer media.hamcat.live). Le Worker prend le relais.

---

## Structure a creer

workers/
└── media-browser/
    ├── wrangler.jsonc
    └── src/
        └── index.js

---

## FICHIER 1 — workers/media-browser/wrangler.jsonc

{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "hamcat-media-browser",
  "compatibility_date": "2026-06-09",
  "main": "src/index.js",
  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "hamcat-media"
    }
  ],
  "routes": [
    {
      "pattern": "media.hamcat.live/*",
      "zone_name": "hamcat.live"
    }
  ]
}

---

## FICHIER 2 — workers/media-browser/src/index.js

Worker complet avec deux comportements :
  - URL pointant vers un fichier (avec extension reconnue) → servir le fichier + header download
  - URL pointant vers un "dossier" (pas d'extension ou se terminant par /) → generer le listing HTML

### Logique de routing

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname.slice(1)); // enlever le /

    // Chemin vide ou finissant par / = listing
    const isListing = path === '' || path.endsWith('/') || !hasFileExtension(path);

    if (isListing) {
      const prefix = path.endsWith('/') ? path : (path ? path + '/' : '');
      return await renderListing(env, prefix, url);
    }

    return await serveFile(env, path);
  }
}
```

### Fonction serveFile

```js
async function serveFile(env, key) {
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Forcer le telechargement pour tous les fichiers
  const filename = key.split('/').pop();
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  // Exception : images → affichees inline pour les previews
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','webp','gif'].includes(ext)) {
    headers.set('Content-Disposition', `inline; filename="${filename}"`);
  }

  return new Response(object.body, { headers });
}
```

### Fonction renderListing

Liste les objets R2 avec delimiter "/" pour separer dossiers et fichiers.
Genere une page HTML complete avec :
  - Header : breadcrumb de navigation (liens cliquables vers chaque niveau)
  - Section dossiers : grille de cartes avec icone dossier et nom
  - Section fichiers : grille avec preview (images) ou icone (audio/video/autres)
  - Sur chaque fichier : lien de telechargement direct
  - Footer leger : "media.hamcat.live — Hamcat"

```js
async function renderListing(env, prefix, url) {
  const listed = await env.MEDIA.list({ prefix, delimiter: '/' });

  const folders = listed.delimitedPrefixes || [];   // ex: ["PHOTO/", "audio/"]
  const files   = listed.objects || [];              // ex: [{key: "PHOTO/img.jpg", size: ...}]

  // Breadcrumb : ["", "PHOTO", "Hamcat"] → liens vers /, /PHOTO/, /PHOTO/Hamcat/
  const parts = prefix ? prefix.split('/').filter(Boolean) : [];

  const html = buildHTML(prefix, parts, folders, files);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

### Fonction buildHTML

Genere le HTML complet. Design : fond sombre, typographie propre, coherent avec hamcat.live.
Palette : fond #0c0c14, texte #e2e2ee, accent #a78bfa (violet doux), cards #161622.

```js
function buildHTML(prefix, parts, folders, files) {
  const title = prefix ? prefix.replace(/\/$/, '') : 'media.hamcat.live';

  // Breadcrumb HTML
  let breadcrumb = '<a href="/">media.hamcat.live</a>';
  let cumPath = '/';
  for (const part of parts) {
    cumPath += part + '/';
    breadcrumb += ` / <a href="${cumPath}">${part}</a>`;
  }

  // Dossiers HTML
  const foldersHtml = folders.map(f => {
    const name = f.replace(prefix, '').replace('/', '');
    return `<a class="card folder" href="/${f}">
      <span class="icon">📁</span>
      <span class="name">${name}</span>
    </a>`;
  }).join('');

  // Fichiers HTML
  const filesHtml = files.map(obj => {
    const key = obj.key;
    const name = key.split('/').pop();
    const ext = name.split('.').pop().toLowerCase();
    const size = formatSize(obj.size);
    const isImage = ['jpg','jpeg','png','webp','gif'].includes(ext);
    const isAudio = ['mp3','wav','flac','aac','ogg'].includes(ext);
    const isVideo = ['mp4','mov','avi','mkv'].includes(ext);

    const preview = isImage
      ? `<img class="thumb" src="/${key}" alt="${name}" loading="lazy">`
      : `<span class="icon">${isAudio ? '🎵' : isVideo ? '🎬' : '📄'}</span>`;

    return `<a class="card file" href="/${key}" download="${name}">
      <div class="preview">${preview}</div>
      <div class="meta">
        <span class="name">${name}</span>
        <span class="size">${size}</span>
      </div>
    </a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0c0c14; color: #e2e2ee; font-family: system-ui, sans-serif; min-height: 100vh; }
    header { padding: 1.5rem 2rem; border-bottom: 1px solid #1e1e2e; }
    .breadcrumb { font-size: 0.85rem; color: #888; }
    .breadcrumb a { color: #a78bfa; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    main { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    h2 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #555; margin: 1.5rem 0 0.75rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
    .card { background: #161622; border: 1px solid #1e1e2e; border-radius: 8px; padding: 1rem;
            text-decoration: none; color: #e2e2ee; display: flex; flex-direction: column;
            gap: 0.5rem; transition: border-color 0.15s, background 0.15s; }
    .card:hover { border-color: #a78bfa; background: #1c1c2e; }
    .icon { font-size: 2rem; text-align: center; }
    .name { font-size: 0.8rem; word-break: break-word; line-height: 1.3; }
    .size { font-size: 0.7rem; color: #555; }
    .thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; }
    .preview { min-height: 80px; display: flex; align-items: center; justify-content: center; }
    footer { text-align: center; padding: 2rem; font-size: 0.75rem; color: #333; }
  </style>
</head>
<body>
  <header>
    <div class="breadcrumb">${breadcrumb}</div>
  </header>
  <main>
    ${folders.length ? `<h2>Dossiers</h2><div class="grid">${foldersHtml}</div>` : ''}
    ${files.length   ? `<h2>Fichiers</h2><div class="grid">${filesHtml}</div>` : ''}
    ${!folders.length && !files.length ? '<p style="color:#555;margin-top:2rem">Dossier vide.</p>' : ''}
  </main>
  <footer>media.hamcat.live — Hamcat</footer>
</body>
</html>`;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function hasFileExtension(path) {
  const last = path.split('/').pop();
  return last.includes('.') && last.lastIndexOf('.') > 0;
}
```

---

## Deploy

Depuis la racine du repo :

  cd workers/media-browser
  npm init -y                          # package.json minimal
  npx wrangler deploy                  # deploie le Worker sur Cloudflare

Le Worker sera visible sur le dashboard Cloudflare sous le nom hamcat-media-browser.

Apres deploy reussi : aller dans Cloudflare Dashboard → R2 → hamcat-media → Settings →
Custom Domains → supprimer media.hamcat.live (le Worker prend le relais via sa route).

Confirmer a Fx que https://media.hamcat.live/ repond avec le listing des dossiers.

---

## Test minimal avant de signaler

curl https://media.hamcat.live/ → doit retourner du HTML (pas 404)
curl https://media.hamcat.live/PHOTO/ → doit lister les sous-dossiers
