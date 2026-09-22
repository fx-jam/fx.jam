// ─────────────────────────────────────────────────────────────────────────────
//  Helpers partages autour des dates. Meme raison d'etre que lib/styles :
//  ces fonctions existaient en double dans son.astro et library.json.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type Rec = { url: string; label?: string };

/** Un gig peut avoir un enregistrement simple ou plusieurs (deux scenes le meme
 *  week-end). `recording` reste l'entree simple, `recordings` prend le relais. */
export const recordingsOf = (
  d: { recording?: string; recordings?: Rec[] }
): Rec[] => [
  ...(d.recording ? [{ url: d.recording }] : []),
  ...(d.recordings ?? []),
];

/** Un fichier servi depuis R2 se joue directement ; le reste passe par un
 *  embed (SoundCloud, Spotify). */
export const isDirectAudio = (url: string) =>
  url.startsWith('https://media.hamcat.live/');

/** La waveform se deduit de l'URL du set : sets/x.mp3 → waveforms/x.json.
 *  Les sets SoundCloud passent par le Worker, qui renvoie le meme format. */
export const waveformUrl = (url: string): string | null => {
  const m = url.match(/^(https:\/\/media\.hamcat\.live)\/sets\/(.+)\.[a-z0-9]+$/i);
  if (m) return `${m[1]}/waveforms/${m[2]}.json`;
  if (/^https:\/\/soundcloud\.com\/[\w-]+\/[\w-]+/.test(url)) {
    return `/api/sc/waveform?url=${encodeURIComponent(url.split('?')[0])}`;
  }
  return null;
};
