// fx-jam Worker — relais OAuth SoundCloud + proxy API
// SC_CLIENT_ID  : var wrangler (vars.SC_CLIENT_ID dans wrangler.jsonc)
// SC_CLIENT_SECRET : secret Cloudflare (synced par wrangler-action, jamais versionné)

const SC_API       = 'https://api.soundcloud.com';
const SC_TOKEN_URL = `${SC_API}/oauth2/token`;
const SC_REDIRECT  = 'https://hamcat.live';

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    // OPTIONS preflight pour /api/*
    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // POST /api/sc/token — échange le code OAuth → access_token + refresh_token
    if (path === '/api/sc/token' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (_) { return errJson('invalid_json'); }
      const { code, redirect_uri } = body || {};
      if (!code) return errJson('missing_code');
      const scRes = await fetch(SC_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'authorization_code',
          client_id:     env.SC_CLIENT_ID,
          client_secret: env.SC_CLIENT_SECRET,
          redirect_uri:  redirect_uri || SC_REDIRECT,
          code,
        }),
      });
      if (!scRes.ok) {
        const txt = await scRes.text().catch(() => '');
        return errJson(`sc_token_error: ${txt}`, scRes.status);
      }
      return okJson(await scRes.json());
    }

    // POST /api/sc/refresh — rafraîchit l'access_token via refresh_token
    if (path === '/api/sc/refresh' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (_) { return errJson('invalid_json'); }
      const { refresh_token } = body || {};
      if (!refresh_token) return errJson('missing_refresh_token');
      const scRes = await fetch(SC_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'refresh_token',
          client_id:     env.SC_CLIENT_ID,
          client_secret: env.SC_CLIENT_SECRET,
          refresh_token,
        }),
      });
      if (!scRes.ok) return errJson('sc_refresh_error', scRes.status);
      return okJson(await scRes.json());
    }

    // POST /api/sc/like — like (liked=true) ou unlike (liked=false) une piste
    if (path === '/api/sc/like' && request.method === 'POST') {
      const token = bearerToken(request);
      if (!token) return errJson('unauthorized', 401);
      let body;
      try { body = await request.json(); } catch (_) { return errJson('invalid_json'); }
      const { track_id, liked } = body || {};
      if (!track_id) return errJson('missing_track_id');
      const method = liked ? 'PUT' : 'DELETE';
      const scRes = await fetch(`${SC_API}/me/favorites/${track_id}`, {
        method,
        headers: { Authorization: `OAuth ${token}` },
      });
      // SC retourne 200/201 pour PUT, 200 pour DELETE, 404 si piste inexistante (on ignore)
      if (!scRes.ok && scRes.status !== 404) return errJson('sc_like_error', scRes.status);
      return okJson({ ok: true });
    }

    // GET /api/sc/liked-ids?ids=123,456 — renvoie { liked: [ids likés] }
    if (path === '/api/sc/liked-ids' && request.method === 'GET') {
      const token = bearerToken(request);
      if (!token) return errJson('unauthorized', 401);
      const ids = (url.searchParams.get('ids') || '')
        .split(',').map(s => s.trim()).filter(Boolean);
      if (!ids.length) return okJson({ liked: [] });
      const checks = await Promise.all(ids.map(async (id) => {
        const res = await fetch(`${SC_API}/me/favorites/${id}`, {
          headers: { Authorization: `OAuth ${token}` },
        });
        return { id, liked: res.status === 200 };
      }));
      return okJson({ liked: checks.filter(c => c.liked).map(c => c.id) });
    }

    // Toutes les autres routes → assets statiques Astro (build dist/)
    return env.ASSETS.fetch(request);
  },
};

function bearerToken(req) {
  const auth = req.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

function okJson(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function errJson(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
