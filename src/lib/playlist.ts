/** One song in the rotation. */
export interface Track {
  /** YouTube video id, the 11-character value from a watch URL. */
  videoId: string;
  /** Song title as shown in the now-playing bar. */
  title: string;
  /** Performing artist as shown in the now-playing bar. */
  artist: string;
}

/** The playlist these tracks come from. */
export const PLAYLIST_ID = 'PLDuwVatASV5k';

/**
 * Public link to the playlist. It is collaborative, so anyone opening this can
 * add a song, which is why the link is offered rather than buried in a credit.
 */
export const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

/**
 * The rotation, taken from the playlist `PLDuwVatASV5k`
 * ("Chhath Mahaparv - Radio").
 *
 * Each id was verified against the live YouTube IFrame API: all 10 cued without
 * error code 101 or 150, so none has embedding disabled. That check mattered
 * more here than usual, because four of these come from "- Topic" channels,
 * which are auto-generated YouTube Music art tracks and the most likely of all
 * to refuse embedding. They passed. Actual playback still needs a real user
 * gesture and is covered by manual smoke testing.
 *
 * Order here follows the playlist. Playback shuffles it per visit anyway.
 */
export const TRACKS: readonly Track[] = [
  { videoId: 'GZKPkb5dUsI', title: 'Kaanch Hi Baans Ke Bahangiya', artist: 'Kalpana' },
  { videoId: '-oga0dNKD0k', title: 'Ugg Ho Suraj Dev', artist: 'Anuradha Paudwal' },
  { videoId: 'mFqvZp8FLhg', title: 'Jal Beech Khada Hoee', artist: 'Pawan Singh' },
  { videoId: 'EFIRAw14dXc', title: 'Ho Deenanath', artist: 'Sharda Sinha' },
  { videoId: 'qUeuWi81PmM', title: 'Kelwa Ke Paat Par', artist: 'Sharda Sinha' },
  { videoId: '-QdCOBCaB5g', title: 'Chati Maiya Aayi Na Duriya', artist: 'Sharda Sinha' },
  { videoId: 'QplS7uIb6zk', title: 'Chaar Pahar Hum Jal Thal Sevila', artist: 'Anuradha Paudwal' },
  { videoId: '5Nx-gQr9IBA', title: 'Futi Futi Bhorahi Se Rove', artist: 'Pawan Singh' },
  { videoId: 'up3_Bx7RvnM', title: 'Darshan Dekhai Dihi', artist: 'Kalpana Katwari' },
  { videoId: 'jYJBHvlUrwY', title: 'Chhathi Maiya Aaihein Hamaar', artist: 'Kalpana' },
];

/**
 * Returns a shuffled copy using Fisher–Yates.
 * @param items The list to shuffle. Not mutated.
 * @param rand Returns a float in [0, 1). Pass `Math.random` in production; pass
 *   a stub in tests to make the result deterministic. Injecting it is what lets
 *   this function live in a pure module.
 * @returns A new array containing the same items in a new order.
 */
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Filters out tracks that failed to play earlier in this session.
 * @param tracks The full rotation.
 * @param dead Video ids known to be unplayable.
 * @returns A new array of tracks worth attempting.
 */
export function playableTracks(
  tracks: readonly Track[],
  dead: ReadonlySet<string>,
): Track[] {
  return tracks.filter((t) => !dead.has(t.videoId));
}
