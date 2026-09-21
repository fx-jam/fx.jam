export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname.slice(1));

    const isListing = path === '' || path.endsWith('/') || !hasFileExtension(path);

    if (isListing) {
      const prefix = path.endsWith('/') ? path : (path ? path + '/' : '');
      return await renderListing(env, prefix, url);
    }

    return await serveFile(env, path, request);
  }
};

const INLINE_EXT = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'opus', 'm4a',
  'mp4', 'webm', 'mov',
];

// Parse un en-tete Range simple ("bytes=START-END", "bytes=START-", "bytes=-SUFFIX").
// Retourne l'objet attendu par R2 .get({ range }), ou null si non exploitable.
function parseRange(header) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
  if (!m) return null;
  const start = m[1] === '' ? null : parseInt(m[1], 10);
  const end = m[2] === '' ? null : parseInt(m[2], 10);
  if (start === null && end === null) return null;
  if (start === null) return { suffix: end };
  if (end === null) return { offset: start };
  if (end < start) return null;
  return { offset: start, length: end - start + 1 };
}

async function serveFile(env, key, request) {
  // Les sets font plusieurs centaines de Mo : sans support du Range, le navigateur
  // ne peut pas se deplacer dans la piste (chaque seek relancerait le telechargement
  // depuis le debut, et iOS refuse purement et simplement de lire).
  const wanted = parseRange(request && request.headers.get('range'));

  let object = null;
  if (wanted) {
    object = await env.MEDIA.get(key, { range: wanted });
  }
  if (!object) {
    object = await env.MEDIA.get(key);
  }
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  // hamcat.live et media.hamcat.live sont deux origines distinctes : sans cet en-tete,
  // un fetch() depuis le site (les waveforms JSON, par exemple) est rejete par le navigateur.
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-expose-headers', 'content-length, content-range, accept-ranges');

  const filename = key.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const disposition = INLINE_EXT.includes(ext) ? 'inline' : 'attachment';
  headers.set('Content-Disposition', `${disposition}; filename="${filename}"`);

  const r = object.range;
  if (wanted && r && typeof r.offset === 'number' && typeof r.length === 'number') {
    const start = r.offset;
    const end = start + r.length - 1;
    headers.set('content-range', `bytes ${start}-${end}/${object.size}`);
    headers.set('content-length', String(r.length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set('content-length', String(object.size));
  return new Response(object.body, { headers });
}

async function renderListing(env, prefix, url) {
  const listed = await env.MEDIA.list({ prefix, delimiter: '/' });

  const folders = listed.delimitedPrefixes || [];
  const files = listed.objects || [];

  const parts = prefix ? prefix.split('/').filter(Boolean) : [];

  const html = buildHTML(prefix, parts, folders, files);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function buildHTML(prefix, parts, folders, files) {
  const title = prefix ? prefix.replace(/\/$/, '') : 'media.hamcat.live';

  let breadcrumb = '<a href="/">media.hamcat.live</a>';
  let cumPath = '/';
  for (const part of parts) {
    cumPath += part + '/';
    breadcrumb += ` / <a href="${cumPath}">${part}</a>`;
  }

  const foldersHtml = folders.map(f => {
    const name = f.replace(prefix, '').replace('/', '');
    return `<a class="card folder" href="/${f}">
      <span class="icon">📁</span>
      <span class="name">${name}</span>
    </a>`;
  }).join('');

  const filesHtml = files.map(obj => {
    const key = obj.key;
    const name = key.split('/').pop();
    const ext = name.split('.').pop().toLowerCase();
    const size = formatSize(obj.size);
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    const isAudio = ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext);
    const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(ext);

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
    ${files.length ? `<h2>Fichiers</h2><div class="grid">${filesHtml}</div>` : ''}
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
