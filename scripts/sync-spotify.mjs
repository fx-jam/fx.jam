#!/usr/bin/env node
// Sync Spotify playlists → src/data/son.json
// Requires env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_USER_ID
// Node 18+ (fetch natif)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SON_JSON = join(__dirname, '../src/data/son.json');

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_USER_ID } = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_USER_ID) {
  console.error('Missing env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_USER_ID');
  process.exit(1);
}

// 1. Client Credentials token
async function getToken() {
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Token error: ${res.status} ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token;
}

// 2. Paginated fetch of user playlists (public only via Client Credentials)
async function fetchAllPlaylists(token) {
  const playlists = [];
  let url = `https://api.spotify.com/v1/users/${SPOTIFY_USER_ID}/playlists?limit=50`;

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Playlists error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    playlists.push(...data.items);
    url = data.next ?? null;
  }
  return playlists;
}

// 3–5. Merge + write
async function main() {
  const token = await getToken();
  const spotifyPlaylists = await fetchAllPlaylists(token);

  const sonJson = JSON.parse(readFileSync(SON_JSON, 'utf8'));
  const existing = sonJson.spotify_playlists ?? [];

  // Index existing entries by Spotify ID
  const existingById = Object.fromEntries(existing.map(p => [p.id, p]));

  // Build new list — preserves user edits (visible/category/description)
  const merged = spotifyPlaylists
    .filter(p => p && p.id)
    .map(p => {
      const prev = existingById[p.id];
      return {
        id:             p.id,
        spotify_title:  p.name ?? '',
        spotify_cover:  p.images?.[0]?.url ?? '',
        spotify_tracks: p.tracks?.total ?? 0,
        visible:        prev?.visible ?? false,
        category:       prev?.category ?? '',
        description:    prev?.description ?? '',
      };
    });

  sonJson.spotify_playlists = merged;

  writeFileSync(SON_JSON, JSON.stringify(sonJson, null, 2) + '\n');
  console.log(`Synced ${merged.length} playlists (${merged.filter(p => p.visible).length} visible).`);
}

main().catch(err => { console.error(err); process.exit(1); });
