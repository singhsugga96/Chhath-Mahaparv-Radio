/** One narrative section, anchored to a point on the symbolic day. */
export interface Stage {
  /** Matches the section id in `content/ritual.ts`. */
  id: string;
  /**
   * Minutes on the narrative axis. Strictly ascending across STAGES, and
   * allowed to exceed 1440 — `paletteAt` and `discAt` normalise modulo 1440,
   * so the closing sunrise is 1810 (= 370 the next day).
   */
  minutes: number;
}

/**
 * The symbolic arc.
 *
 * Chhath's four days are NOT monotonic in sun-time: Kharna's fast breaks at
 * dusk, which is later in the day than Sandhya Arghya's sunset. A literal
 * chronology would therefore run the sun backwards as the reader scrolls
 * forward. The page compresses four days into one continuous passage of light
 * instead, and the copy states each rite's real timing.
 */
export const STAGES: readonly Stage[] = [
  { id: 'intro', minutes: 270 },
  { id: 'preparation', minutes: 480 },
  { id: 'nahay-khay', minutes: 660 },
  { id: 'kharna', minutes: 930 },
  { id: 'sandhya-arghya', minutes: 1035 },
  { id: 'kosi-bharai', minutes: 1260 },
  { id: 'usha-arghya', minutes: 1810 },
  { id: 'prasad', minutes: 1920 },
  { id: 'unique', minutes: 2000 },
  { id: 'credits', minutes: 2060 },
];

/**
 * Maps scroll progress to a narrative minute, interpolating between the two
 * bracketing stages so the sky moves continuously rather than snapping.
 * @param progress Fraction of the page scrolled, 0..1. Clamped.
 * @returns The narrative minute, which may exceed 1440.
 */
export function narrativeMinutes(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  const span = 1 / (STAGES.length - 1);
  const raw = p / span;
  const i = Math.min(STAGES.length - 2, Math.floor(raw));
  const t = raw - i;
  const from = STAGES[i]!.minutes;
  const to = STAGES[i + 1]!.minutes;
  return from + (to - from) * t;
}
