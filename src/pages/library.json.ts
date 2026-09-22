import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import sonJson from '../data/son.json';
import type { SonData } from '../data/types';
import { styleSlug, toStyles } from '../lib/styles';

// ─────────────────────────────────────────────────────────────────────────────
//  /library.json — catalogue unifie de tout ce qui est ecoutable sur le site.
//
//  Le panneau bibliotheque vit dans le player, donc dans le layout, donc sur
//  toutes les pages. Plutot que de reinjecter la liste dans chaque page HTML,
//  on genere ce fichier une fois au build et le panneau le telecharge a sa
//  premiere ouverture. Les pages restent legeres et il n'existe qu'une seule
//  source de verite.
//
//  Les tags sont ranges par categorie des maintenant (style, mood, lieu, orga,
//  artiste) meme si seules les deux premieres sont alimentees : ajouter une
//  categorie plus tard ne demandera alors aucune migration du panneau.
// ─────────────────────────────────────────────────────────────────────────────

const sonData = sonJson as unknown as SonData;

const waveformUrl = (url: string): string | null => {
  const m = url.match(/^(https:\/\/media\.hamcat\.live)\/sets\/(.+)\.[a-z0-9]+$/i);
  if (m) return `${m[1]}/waveforms/${m[2]}.json`;
  // Les sets SoundCloud passent par le Worker, qui va chercher les echantillons
  // chez SoundCloud et les renvoie au meme format : meme rendu que les sets R2.
  if (/^https:\/\/soundcloud\.com\/[\w-]+\/[\w-]+/.test(url)) {
    return `/api/sc/waveform?url=${encodeURIComponent(url.split('?')[0])}`;
  }
  return null;
};

const isDirect = (url: string) => url.startsWith('https://media.hamcat.live/');

const playlistIdOf = (v?: string): string | null => {
  if (!v) return null;
  const m = v.match(/playlist[/:]([A-Za-z0-9]+)/);
  return m ? m[1] : (/^[A-Za-z0-9]{16,}$/.test(v.trim()) ? v.trim() : null);
};

const sourceOf = (url: string): string =>
  isDirect(url) ? 'audio'
  : url.includes('mixcloud.com') ? 'mixcloud'
  : 'soundcloud';

type Entry = {
  id: string;
  title: string;
  sub: string;
  date: string;          // ISO ou '' — sert au tri
  source: string;        // audio | soundcloud | mixcloud | spotify
  url: string;
  playlistId?: string;
  waveform: string | null;
  download: boolean;
  tags: Record<string, string[]>;
};

export const GET: APIRoute = async () => {
  const gigs = await getCollection('gigs', ({ data }) => !data.draft);
  const entries: Entry[] = [];

  for (const g of gigs) {
    const recs = [
      ...(g.data.recording ? [{ url: g.data.recording, label: undefined as string | undefined }] : []),
      ...(g.data.recordings ?? []),
    ];
    for (const r of recs) {
      entries.push({
        id: `${g.id}:${r.url}`,
        title: g.data.title,
        sub: r.label ?? g.data.role ?? g.data.venue ?? '',
        date: g.data.date.toISOString(),
        source: sourceOf(r.url),
        url: r.url,
        waveform: waveformUrl(r.url),
        download: isDirect(r.url),
        tags: {
          style:  toStyles(g.data.genre ?? []),
          venue:  g.data.venue ? [g.data.venue] : [],
          orga:   [],
          mood:   [],
          artist: [],
        },
      });
    }
    // Une date sans enregistrement mais avec sa tracklist reconstituee reste
    // ecoutable : elle a donc sa place dans la bibliotheque.
    const pl = recs.length ? null : playlistIdOf(g.data.tracklist);
    if (pl) {
      entries.push({
        id: `${g.id}:tracklist`,
        title: g.data.title,
        sub: 'tracklist',
        date: g.data.date.toISOString(),
        source: 'spotify',
        url: '',
        playlistId: pl,
        waveform: null,
        download: false,
        tags: {
          style:  toStyles(g.data.genre ?? []),
          venue:  g.data.venue ? [g.data.venue] : [],
          orga:   [], mood: [], artist: [],
        },
      });
    }
  }

  // Les mixes sans date rattachee : sets studio, podcasts, selections.
  const linked = new Set(entries.map(e => e.url));
  for (const m of sonData.mixes ?? []) {
    const url = m.audio_url || m.soundcloud_url || m.mixcloud_url;
    if (!url || linked.has(url)) continue;
    entries.push({
      id: `mix:${url}`,
      title: m.title,
      sub: '',
      date: m.date || '',
      source: sourceOf(url),
      url,
      waveform: m.audio_url ? waveformUrl(m.audio_url) : null,
      download: isDirect(url),
      tags: { style: toStyles(m.tags ?? []), venue: [], orga: [], mood: [], artist: [] },
    });
  }

  for (const p of sonData.spotify_playlists ?? []) {
    if (!p.visible || !p.id) continue;
    entries.push({
      id: `sp:${p.id}`,
      title: p.name || 'Playlist',
      sub: p.category || 'Spotify',
      date: '',
      source: 'spotify',
      url: '',
      playlistId: p.id,
      waveform: null,
      download: false,
      tags: { style: [], venue: [], orga: [], mood: [], artist: [] },
    });
  }

  // Plus recent d'abord ; ce qui n'a pas de date ferme la marche.
  entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return new Response(JSON.stringify({ version: 1, entries }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
