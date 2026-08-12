/** Minutes since midnight at which the sun crosses the horizon rising. */
export const SUNRISE_MINUTES = 370; // 06:10, Usha Arghya

/** Minutes since midnight at which the sun crosses the horizon setting. */
export const SUNSET_MINUTES = 1035; // 17:15, Sandhya Arghya

/** The celestial body currently on screen, and where to draw it. */
export interface Disc {
  /** Which body is visible. */
  kind: 'sun' | 'moon';
  /** Horizontal position across the arc, 0 (left) to 100 (right), as a percentage. */
  x: number;
  /** Vertical position from the top of the viewport, 0 to 100, as a percentage. */
  y: number;
  /** Height above the horizon, 0 (on the horizon) to 1 (at peak). */
  altitude: number;
}

const DAY = 1440;

/** Percentage of viewport height the horizon sits at. */
const HORIZON_Y = 62;

/** How far above the horizon the disc climbs at peak, in viewport percent. */
const ARC_HEIGHT = 50;

/**
 * Computes the position of the sun or moon for a given time of day.
 *
 * Daytime runs sunrise to sunset; the remaining hours form a single night arc
 * that crosses midnight without discontinuity. Both arcs are a half sine, so
 * altitude is 0 at each end and 1 at the midpoint.
 *
 * @param minutes Minutes since midnight. Out-of-range and fractional values are
 *   normalised rather than rejected.
 * @returns Which body is visible and where to draw it.
 */
export function discAt(minutes: number): Disc {
  const m = ((minutes % DAY) + DAY) % DAY;
  const isDay = m >= SUNRISE_MINUTES && m <= SUNSET_MINUTES;

  let progress: number;
  if (isDay) {
    progress = (m - SUNRISE_MINUTES) / (SUNSET_MINUTES - SUNRISE_MINUTES);
  } else {
    // Night length wraps past midnight, so shift into a continuous coordinate
    // that starts at sunset.
    const nightLength = DAY - SUNSET_MINUTES + SUNRISE_MINUTES;
    const sinceSunset =
      m > SUNSET_MINUTES ? m - SUNSET_MINUTES : m + (DAY - SUNSET_MINUTES);
    progress = sinceSunset / nightLength;
  }

  const altitude = Math.sin(progress * Math.PI);

  return {
    kind: isDay ? 'sun' : 'moon',
    x: progress * 100,
    y: HORIZON_Y - altitude * ARC_HEIGHT,
    altitude,
  };
}
