/** One song in the rotation. */
export interface Track {
  /** YouTube video id, the 11-character value from a watch URL. */
  videoId: string;
  /** Song title as shown in the now-playing bar. */
  title: string;
  /** Performing artist as shown in the now-playing bar. */
  artist: string;
}

/**
 * The rotation, taken from the playlist `PL-HJTkuLZnWxbBolNkLTql6PUUdXgknjX`
 * ("Chaath Songs - Classical").
 *
 * Each id was verified against the live YouTube IFrame API: all 23 cued without
 * error code 101 or 150, so none has embedding disabled. Actual playback still
 * requires a real user gesture and is covered by manual smoke testing.
 *
 * `gcVbtUGLDNk` ("Aapka Kya Hoga Janabe Ali", from Housefull) is deliberately
 * excluded — it is a Bollywood item song that appears in the source playlist by
 * accident. One further video was already hidden as unavailable by YouTube.
 */
export const TRACKS: readonly Track[] = [
  { videoId: 'jRsXRee52xw', title: 'Maarbo Re Sugva Dhanukh Se', artist: 'Anuradha Paudwal' },
  { videoId: 'WYkrgIZFcZw', title: 'Pahile Pahil Chhathi Maiya', artist: 'Sharda Sinha' },
  { videoId: '8MzoVsjL4QU', title: 'Uga Hai Suraj Dev', artist: 'Anuradha Paudwal' },
  { videoId: 'W-w55hqwyUs', title: 'Kaanche Hi Baans Ke Bahangiya', artist: 'T-Series Regional' },
  { videoId: 'kEJsJ7wn5Zw', title: 'Aadit Manaila', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'oJ1h2TtZdjw', title: 'Asiya Puran Hoy', artist: 'Kavita Paudwal' },
  { videoId: 'izIkAY6w8V8', title: 'Patna Ke Haat Par Nariyar', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'pp0bO8uro64', title: 'Kahawa Paibo Sone Ke Katorwa', artist: 'Anu Dubey' },
  { videoId: 'knZ8b5YnQiY', title: 'Kelwa Ke Paat Par', artist: 'Sharda Sinha' },
  { videoId: 'IzDm2ndwWqg', title: 'Angna Mein Pokhri Khonaib', artist: 'Kavita Paudwal' },
  { videoId: 'N3u5P5PjKQU', title: 'Aragh Ke Ber', artist: 'Anuradha Paudwal' },
  { videoId: '6v9PSJFCEMo', title: 'Beriya Ke Beri', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'SocuWpGE2z0', title: 'Darshan Dihi Na Apar Chhathi Maiya', artist: 'Anuradha Paudwal' },
  { videoId: 'iTffu3kgU7s', title: 'Rakho Sabhe Chhath Ke Barat', artist: 'Kavita Paudwal' },
  { videoId: 'WsvuH5QO23I', title: 'Kelwa Ke Paat Par', artist: 'Devi' },
  { videoId: 'O4ARvvmllCA', title: 'Tohe Badka Bhaiya Ho', artist: 'Sharda Sinha' },
  { videoId: '_RDu847nhmU', title: 'Patna Ke Ghat Par', artist: 'Sharda Sinha' },
  { videoId: 'sH1bqkui-pA', title: 'Ho Dinanath', artist: 'T-Series Regional' },
  { videoId: '_ngNpxnA5hY', title: 'Kahele Mahadev Kari Haath Jodiya', artist: 'Pawan Singh' },
  { videoId: 'FIGYq0dsqQM', title: 'Chaar Hi Kunava Ke', artist: 'T-Series Regional' },
  { videoId: 'bL6rp6eI_2k', title: 'Chhath Ke Baratiya', artist: 'Sharda Sinha' },
  { videoId: 'fOVGz9WFymU', title: 'Ho Deenanath', artist: 'Sharda Sinha' },
  { videoId: '3ViLjNee1o0', title: 'Ho Deenanath (alternate)', artist: 'Sharda Sinha' },
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
