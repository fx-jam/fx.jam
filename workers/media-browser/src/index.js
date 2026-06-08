export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname.slice(1));

    const isListing = path === '' || path.endsWith('/') || !hasFileExtension(path);

    if (isListing) {
      const prefix = path.endsWith('/') ? path : (path ? path + '/' : '');
      return await renderListing(env, prefix, url);
    }

    return await serveFile(env, path);
  }
};

async function serveFile(env, key) {
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  const filename = key.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    headers.set('Content-Disposition', `inline; filename="${filename}"`);
  } else {
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  }

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
