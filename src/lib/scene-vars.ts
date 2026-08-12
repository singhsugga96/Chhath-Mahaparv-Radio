import { paletteAt } from './sky';
import { discAt } from './sun';

/** Disc appearance per body. The sun is warm; the moon is cool. */
const DISC = {
  sun: { color: '#fff3d4', halo: '255 226 168' },
  moon: { color: '#e8eeff', halo: '198 214 255' },
} as const;

/**
 * Maps a narrative minute to the full set of CSS custom property values the
 * scene needs. Pure: no DOM, no clock, no randomness.
 *
 * Halo is emitted as a bare `r g b` triplet rather than a color, because the SVG
 * consumes it as `rgb(var(--disc-halo) / 0.55)` at several different alphas.
 *
 * @param minutes Narrative minute; may exceed 1440.
 * @returns CSS property names mapped to values, ready for `setProperty`.
 */
export function sceneVars(minutes: number): Record<string, string> {
  const palette = paletteAt(minutes);
  const disc = discAt(minutes);
  const look = DISC[disc.kind];

  return {
    '--sky-top': palette.skyTop,
    '--sky-horizon': palette.skyHorizon,
    '--water': palette.water,
    '--diya-glow': palette.diyaGlow.toFixed(3),
    '--disc-x': disc.x.toFixed(2),
    '--disc-y': disc.y.toFixed(2),
    '--disc-color': look.color,
    '--disc-halo': look.halo,
  };
}
