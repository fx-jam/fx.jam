// fx-jam Worker — relais OAuth SoundCloud + proxy API + proxy VPS agent
// SC_CLIENT_ID  : var wrangler (vars.SC_CLIENT_ID dans wrangler.jsonc)
// SC_CLIENT_SECRET : secret Cloudflare (synced par wrangler-action, jamais versionné)

const SC_API       = 'https://api.soundcloud.com';
const SC_TOKEN_URL = `${SC_API}/oauth2/token`;
const SC_REDIRECT  = 'https://hamcat.live';
const VPS_AGENT    = 'https://api-vps.hamcat.live';


// ── En-tetes de securite ─────────────────────────────────────────────────────
//  Ajoutes en sortie, sur toutes les reponses. Trois choix assumes :
//
//  - `frame-ancestors 'self'` et non DENY : les facettes du site s'ouvrent en
//    iframe depuis la platine. Interdire tout cadrage casserait la navigation.
//  - HSTS a une semaine pour commencer. L'en-tete est collant : un navigateur
//    qui l'a vu refusera le HTTP pendant toute la duree annoncee. On monte a
//    six mois une fois qu'on est sur que tout passe en HTTPS.
//  - CSP en mode RAPPORT SEUL. Une politique posee d'emblee casserait les
//    embeds SoundCloud et Spotify sans prevenir ; en rapport seul, les
//    violations s'affichent dans la console sans rien bloquer. On bascule en
//    application une fois la liste stabilisee.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https://media.hamcat.live https://i.scdn.co https://*.sndcdn.com",
  "media-src 'self' blob: https://media.hamcat.live",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://w.soundcloud.com https://sdk.scdn.co https://open.spotify.com",
  "connect-src 'self' https://media.hamcat.live https://api.soundcloud.com https://api.spotify.com",
  "frame-src https://w.soundcloud.com https://open.spotify.com",
].join('; ');

function withSecurity(res) {
  const h = new Headers(res.headers);
  h.set('Strict-Transport-Security', 'max-age=604800');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'SAMEORIGIN');
  h.set('Content-Security-Policy-Report-Only', CSP);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    // Le site repondait 200 en clair sur http:// — le trafic pouvait etre lu
    // et modifie en chemin. Redirection permanente avant tout le reste.
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

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

        // SoundCloud sert historiquement une image ; la meme adresse en .json
        // renvoie les echantillons bruts, qui sont ce qui nous interesse.
        const wfUrl = String(t.waveform_url).replace(/\.png(\?|$)/, '.json$1');
        const wRes = await fetch(wfUrl);
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
      } catch (e) {
        return errJson(`sc_waveform_failed: ${e && e.message}`, 502);
      }
    }


    // /api/atelier/quick et /push — ecriture eclair. `quick` valide et commite
    // sans construire (0,4 s mesure) ; `push` publie la salve, protege par un
    // build tiede (34 s), une seule fois par salve et non par reponse.
    const ATELIER_ROUTES = new Set([
      '/api/atelier/quick', '/api/atelier/push',
      '/api/atelier/fiches', '/api/atelier/save', '/api/atelier/delete',
      '/api/atelier/facettes', '/api/atelier/facette-save',
      '/api/atelier/devoirs', '/api/atelier/devoir-save',
    ]);
    if (ATELIER_ROUTES.has(path) && request.method === 'POST') {
      let who;
      try {
        who = await verifyAccess(request, env);
      } catch (e) {
        const m = (e && e.message) || 'access_error';
        return errJson(m, m === 'access_not_configured' ? 503 : 401);
      }
      if (!env.VPS_TOKEN) return errJson('vps_token_absent', 503);
      const route = path.slice('/api/atelier'.length);
      let body = {};
      if (route !== '/push' && route !== '/fiches' && route !== '/facettes'
          && route !== '/devoirs') {
        try { body = await request.json(); } catch { return errJson('json_invalide', 400); }
      }
      if (route === '/quick' && (!Array.isArray(body.answers) || !body.answers.length)) {
        return errJson('aucune_reponse', 400);
      }
      if (route === '/save' || route === '/delete') {
        if (!body.gig || typeof body.gig !== 'string') return errJson('gig_requis', 400);
      }
      if (route === '/facette-save' && (!body.cle || typeof body.cle !== 'string')) {
        return errJson('cle_requise', 400);
      }
      if (route === '/devoir-save' && (!body.id || typeof body.id !== 'string')) {
        return errJson('id_requis', 400);
      }
      try {
        const res = await fetch(`${VPS_AGENT}/atelier${route}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.VPS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        return new Response(await res.text(), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return errJson(`agent_injoignable: ${e && e.message}`, 502);
      }
    }

    // /api/atelier/answers — applique un lot de reponses. Le Worker ne patche
    // RIEN lui-meme : il authentifie, puis transmet a l'agent VPS, seul endroit
    // ou l'on sait verifier un build en conditions reelles avant de pousser.
    if (path === '/api/atelier/answers' && request.method === 'POST') {
      let who;
      try {
        who = await verifyAccess(request, env);
      } catch (e) {
        const m = (e && e.message) || 'access_error';
        return errJson(m, m === 'access_not_configured' ? 503 : 401);
      }
      if (!env.VPS_TOKEN) return errJson('vps_token_absent', 503);
      let body;
      try { body = await request.json(); } catch { return errJson('json_invalide', 400); }
      const answers = Array.isArray(body && body.answers) ? body.answers : [];
      if (!answers.length) return errJson('aucune_reponse', 400);
      try {
        const res = await fetch(`${VPS_AGENT}/atelier/apply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.VPS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers,
            message: `atelier: ${answers.length} reponses (${who.email})`,
          }),
        });
        return new Response(await res.text(), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return errJson(`agent_injoignable: ${e && e.message}`, 502);
      }
    }

    // /api/atelier/whoami — preuve de vie de l'authentification. Ne lit ni
    // n'ecrit rien : elle sert a verifier qu'Access est bien branche AVANT de
    // poser un chemin d'ecriture dessus.
    if (path === '/api/atelier/whoami') {
      try {
        const who = await verifyAccess(request, env);
        // Diagnostic de cablage : uniquement des NOMS de liaisons et un booleen,
        // jamais une valeur. Derriere Access, et c'est ce qui permet de dire en
        // un coup d'oeil si un secret est pose, mal nomme, ou absent.
        return okJson({
          ok: true,
          email: who.email,
          vps_token: Boolean(env.VPS_TOKEN),
          bindings: Object.keys(env).sort(),
        });
      } catch (e) {
        const m = e && e.message || 'access_error';
        return errJson(m, m === 'access_not_configured' ? 503 : 401);
      }
    }

    // Toutes les autres routes → assets statiques Astro (build dist/)
    return withSecurity(await env.ASSETS.fetch(request));
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
  if (!res.ok) throw new Error(`sc_app_token ${res.status} ${(await res.text().catch(() => '')).slice(0, 160)}`);
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

// ── Cloudflare Access ────────────────────────────────────────────────────────
//  Verification du jeton que Access pose sur chaque requete vers une route
//  protegee. On verifie la signature ET l'emetteur ET l'audience : l'AUD seul
//  dirait pour quelle application le jeton a ete emis, pas qui l'a emis.
//
//  La route echoue FERMEE : sans ACCESS_TEAM et ACCESS_AUD configures, elle
//  refuse tout. Une couche d'authentification qui s'ouvre quand sa config
//  manque ne protege rien.
const ACCESS_CERTS_TTL = 3600e3;
let accessKeys = { at: 0, team: '', keys: new Map() };

async function accessJwks(team) {
  if (accessKeys.team === team && Date.now() - accessKeys.at < ACCESS_CERTS_TTL) {
    return accessKeys.keys;
  }
  const res = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`access_certs ${res.status}`);
  const { keys = [] } = await res.json();
  const map = new Map();
  for (const jwk of keys) {
    if (jwk.kty !== 'RSA' || !jwk.kid) continue;
    map.set(jwk.kid, await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify'],
    ));
  }
  accessKeys = { at: Date.now(), team, keys: map };
  return map;
}

const b64urlToBytes = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
};
const b64urlToJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

/** Rend l'identite si le jeton est valide, sinon leve. */
async function verifyAccess(request, env) {
  const team = env.ACCESS_TEAM, aud = env.ACCESS_AUD;
  if (!team || !aud) throw new Error('access_not_configured');

  // L'en-tete est la source recommandee : le cookie n'est pose que pour les
  // requetes de navigation et peut manquer sur un fetch().
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
             || (request.headers.get('Cookie') || '').match(/CF_Authorization=([^;]+)/)?.[1];
  if (!token) throw new Error('access_missing_token');

  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('access_malformed');

  const head = b64urlToJson(h);
  if (head.alg !== 'RS256') throw new Error('access_bad_alg');

  const key = (await accessJwks(team)).get(head.kid);
  if (!key) throw new Error('access_unknown_kid');

  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key,
    b64urlToBytes(s),
    new TextEncoder().encode(`${h}.${p}`),
  );
  if (!ok) throw new Error('access_bad_signature');

  const c = b64urlToJson(p);
  const now = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(c.aud) ? c.aud : [c.aud];
  const allowed = aud.split(',').map(s => s.trim()).filter(Boolean);
  if (!auds.some(a => allowed.includes(a)))   throw new Error('access_bad_aud');
  if (c.iss !== `https://${team}.cloudflareaccess.com`) throw new Error('access_bad_iss');
  if (!c.exp || c.exp < now)                  throw new Error('access_expired');
  if (c.nbf && c.nbf > now + 60)              throw new Error('access_not_yet_valid');

  // Une politique Access peut etre elargie par megarde. Si ATELIER_EMAIL est
  // pose, il fait office de second verrou, independant du tableau de bord.
  if (env.ATELIER_EMAIL && c.email !== env.ATELIER_EMAIL) throw new Error('access_wrong_identity');

  return { email: c.email, sub: c.sub, exp: c.exp };
}
