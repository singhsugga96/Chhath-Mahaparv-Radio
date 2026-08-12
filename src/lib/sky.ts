import { mixOklab } from './color';

/** Resolved scene colors for one instant. */
export interface Palette {
  /** Color at the top of the sky gradient. */
  skyTop: string;
  /** Color at the horizon end of the sky gradient. */
  skyHorizon: string;
  /** Color of the river surface. */
  water: string;
  /** Diya opacity, 0 (unlit) to 1 (full). */
  diyaGlow: number;
}

/** A palette anchored to a time of day. */
export interface Keyframe extends Palette {
  /** Minutes since midnight, 0..1439. */
  minutes: number;
  /** Human-readable stage name. */
  stage: string;
}

/**
 * The 24-hour ramp. The two arghya stages are the emotional peaks and carry the
 * most saturated treatment. The 20:00 and 00:00 entries are deliberately
 * identical so the wrap across midnight is invisible.
 */
export const KEYFRAMES: readonly Keyframe[] = [
  { minutes: 0,    stage: 'Night',          skyTop: '#0b1026', skyHorizon: '#1b2a4a', water: '#0a1a2e', diyaGlow: 1 },
  { minutes: 270,  stage: 'Pre-dawn',       skyTop: '#1e2a44', skyHorizon: '#4a4a6a', water: '#1a2438', diyaGlow: 0.75 },
  { minutes: 370,  stage: 'Usha Arghya',    skyTop: '#2e4a7a', skyHorizon: '#ff7a3c', water: '#c97a4e', diyaGlow: 0.3 },
  { minutes: 480,  stage: 'Morning',        skyTop: '#4a8fd6', skyHorizon: '#bfe0f5', water: '#7fa8c4', diyaGlow: 0 },
  { minutes: 720,  stage: 'Midday',         skyTop: '#3b82c4', skyHorizon: '#cfe6f7', water: '#8fb6d0', diyaGlow: 0 },
  { minutes: 930,  stage: 'Afternoon',      skyTop: '#5a8fc0', skyHorizon: '#f2d9a8', water: '#a89478', diyaGlow: 0 },
  { minutes: 1035, stage: 'Sandhya Arghya', skyTop: '#3a2a5e', skyHorizon: '#e8613c', water: '#b85a3c', diyaGlow: 0.25 },
  { minutes: 1110, stage: 'Dusk',           skyTop: '#221a3a', skyHorizon: '#7a4a5e', water: '#3a2a38', diyaGlow: 0.7 },
  { minutes: 1200, stage: 'Night',          skyTop: '#0b1026', skyHorizon: '#1b2a4a', water: '#0a1a2e', diyaGlow: 1 },
];

const DAY = 1440;

/**
 * Resolves the scene palette for a given time of day, interpolating in Oklab
 * between the two bracketing keyframes.
 * @param minutes Minutes since midnight. Values outside 0..1439 and fractional
 *   values are normalised rather than rejected, which is what lets the caller
 *   pass a narrative minute above 1440.
 * @returns The interpolated palette.
 */
export function paletteAt(minutes: number): Palette {
  const m = ((minutes % DAY) + DAY) % DAY;

  // Find the last keyframe at or before m. KEYFRAMES[0].minutes is 0 and
  // m >= 0, so this always finds one.
  let i = 0;
  for (let k = KEYFRAMES.length - 1; k >= 0; k--) {
    if (KEYFRAMES[k]!.minutes <= m) {
      i = k;
      break;
    }
  }

  const from = KEYFRAMES[i]!;
  const isLast = i === KEYFRAMES.length - 1;

  // Past the final keyframe we wrap to the first one, treating it as sitting at
  // minute 1440 so the span length is correct.
  const to = isLast ? KEYFRAMES[0]! : KEYFRAMES[i + 1]!;
  const toMinutes = isLast ? DAY : to.minutes;

  const span = toMinutes - from.minutes;
  const t = span === 0 ? 0 : (m - from.minutes) / span;

  return {
    skyTop: mixOklab(from.skyTop, to.skyTop, t),
    skyHorizon: mixOklab(from.skyHorizon, to.skyHorizon, t),
    water: mixOklab(from.water, to.water, t),
    diyaGlow: from.diyaGlow + (to.diyaGlow - from.diyaGlow) * t,
  };
}
