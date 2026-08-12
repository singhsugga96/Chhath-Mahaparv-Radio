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
export const PLAYLIST_ID = 'PLYO7ixFsIl3M';

/**
 * Public link to the playlist. It is collaborative, so anyone opening this can
 * add a song, which is why the link is offered rather than buried in a credit.
 */
export const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

/**
 * The rotation, taken from the playlist `PLYO7ixFsIl3M` ("Chhath Puja Radio").
 *
 * Each id was verified against the live YouTube IFrame API: all 14 cued without
 * error code 101 or 150, so none has embedding disabled. Actual playback still
 * requires a real user gesture and is covered by manual smoke testing.
 *
 * Order here follows the playlist. Playback shuffles it per visit anyway.
 */
export const TRACKS: readonly Track[] = [
  { videoId: '6e6Hp6R5SVU', title: 'Uga Hai Suraj Dev', artist: 'Anuradha Paudwal' },
  { videoId: 'j9G3caThH98', title: 'Uthau Suruj Bhaile Bihaan', artist: 'Sharda Sinha' },
  { videoId: '7R9tDvnAfMo', title: 'Kaanch Hi Baans Ke Bahangiya', artist: 'Arvind Akela Kallu' },
  { videoId: 'FGQ0SCK1AtE', title: 'Ugi He Dinanath', artist: 'Kalpana' },
  { videoId: 'yC_qL0a_P7o', title: 'Sawa Lakh Ke Saari Bhije', artist: 'Anu Dubey' },
  { videoId: 'fOVGz9WFymU', title: 'Ho Deenanath', artist: 'Sharda Sinha' },
  { videoId: 'YVrZBmI9_ag', title: 'Kopi Kopi Boleli', artist: 'Devi' },
  { videoId: 'WsvuH5QO23I', title: 'Kelwa Ke Paat Par', artist: 'Devi' },
  { videoId: 'cQ2eX4SrkNg', title: 'Pahile Pahile Baani Kaile Chhathi Maiya', artist: 'Dinesh Lal Yadav' },
  { videoId: 'BKoD7bTLc2k', title: 'Jode Jode Falwa', artist: 'Pawan Singh' },
  { videoId: 'kEJsJ7wn5Zw', title: 'Aadit Manaila', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'izIkAY6w8V8', title: 'Patna Ke Haat Par Nariyar', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'knZ8b5YnQiY', title: 'Kelwa Ke Paat Par', artist: 'Sharda Sinha' },
  { videoId: 'bL6rp6eI_2k', title: 'Chhath Ke Baratiya', artist: 'Sharda Sinha' },
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
