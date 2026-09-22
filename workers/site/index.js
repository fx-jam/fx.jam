// fx-jam Worker — relais OAuth SoundCloud + proxy API + proxy VPS agent
// SC_CLIENT_ID  : var wrangler (vars.SC_CLIENT_ID dans wrangler.jsonc)
// SC_CLIENT_SECRET : secret Cloudflare (synced par wrangler-action, jamais versionné)

const SC_API       = 'https://api.soundcloud.com';
const SC_TOKEN_URL = `${SC_API}/oauth2/token`;
const SC_REDIRECT  = 'https://hamcat.live';
const VPS_AGENT    = 'https://api-vps.hamcat.live';

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
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // /api/vps/* — proxy transparent vers vps-agent via Cloudflare Tunnel
    // Auth gérée par vps-agent : Bearer VPS_API_TOKEN dans l'en-tête Authorization
    if (path.startsWith('/api/vps/')) {
      const vpsPath = path.slice('/api/vps'.length);
      const vpsUrl  = `${VPS_AGENT}${vpsPath}${url.search}`;
      const proxyReq = new Request(vpsUrl, {
        method:  request.method,
        headers: request.headers,
        body:    ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      });
      const vpsRes = await fetch(proxyReq);
      return new Response(vpsRes.body, {
        status:  vpsRes.status,
        headers: {
          'Content-Type':                vpsRes.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
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

    // GET /api/sc/waveform?url=<url du set SoundCloud>
    // Renvoie { duration, peaks } au meme format que les waveforms generees
    // par ffmpeg et rangees dans R2, pour que les sets SoundCloud s'affichent
    // exactement comme les sets heberges. Cache au bord : SoundCloud n'est
    // interroge qu'une fois par set.
    if (path === '/api/sc/waveform' && request.method === 'GET') {
      const track = url.searchParams.get('url') || '';
      if (!/^https:\/\/soundcloud\.com\/[\w-]+\/[\w-]+/.test(track)) {
        return errJson('bad_url');
      }
      const cache = caches.default;
      const ck = new Request(`https://wf.hamcat.live/${encodeURIComponent(track)}`);
      const hit = await cache.match(ck);
      if (hit) return hit;

      try {
        const token = await scAppToken(env);
        const res = await fetch(
          `${SC_API}/resolve?url=${encodeURIComponent(track)}`,
          { headers: { Authorization: `OAuth ${token}`, Accept: 'application/json' } },
        );
        if (!res.ok) return errJson('sc_resolve_error', res.status);
        const t = await res.json();
        if (!t || !t.waveform_url) return errJson('no_waveform', 404);

        const wRes = await fetch(t.waveform_url);
        if (!wRes.ok) return errJson('sc_waveform_error', wRes.status);
        const w = await wRes.json();
        const samples = w.samples || [];
        if (!samples.length) return errJson('no_samples', 404);

        // SoundCloud echantillonne sur `height` ; on ramene sur 0-255 comme
        // les fichiers R2, en gardant la crete de chaque tranche.
        const H = w.height || Math.max(...samples) || 100;
        const WANT = 1200;
        const step = samples.length / Math.min(WANT, samples.length);
        const peaks = [];
        for (let i = 0; i < samples.length; i += step) {
          let m = 0;
          for (let j = Math.floor(i); j < Math.min(samples.length, Math.floor(i + step)); j++) {
            if (samples[j] > m) m = samples[j];
          }
          peaks.push(Math.round((m / H) * 255));
        }

        const out = new Response(
          JSON.stringify({ duration: (t.duration || 0) / 1000, peaks }),
          { headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=604800',
          } },
        );
        await cache.put(ck, out.clone());
        return out;
      } catch (_) {
        return errJson('sc_waveform_failed', 502);
      }
    }

    // Toutes les autres routes → assets statiques Astro (build dist/)
    return env.ASSETS.fetch(request);
  },
};

// Jeton client_credentials : sert les appels qui ne concernent aucun
// utilisateur (resolution d'un set public). Garde en memoire le temps de vie
// de l'isolat pour ne pas redemander un jeton a chaque requete.
let appToken = { value: '', expires: 0 };
async function scAppToken(env) {
  if (appToken.value && Date.now() < appToken.expires) return appToken.value;
  const res = await fetch(SC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     env.SC_CLIENT_ID,
      client_secret: env.SC_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error('sc_app_token');
  const j = await res.json();
  appToken = {
    value: j.access_token,
    expires: Date.now() + Math.max(60, (j.expires_in || 3600) - 120) * 1000,
  };
  return appToken.value;
}

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
