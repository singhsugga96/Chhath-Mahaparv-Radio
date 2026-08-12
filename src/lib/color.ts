/** A color in the Oklab perceptual color space. */
export interface Oklab {
  /** Perceptual lightness, 0 (black) to 1 (white). */
  L: number;
  /** Green–red axis. */
  a: number;
  /** Blue–yellow axis. */
  b: number;
}

/** Expands one sRGB channel (0-255) to linear-light 0..1. */
function srgbToLinear(channel: number): number {
  const x = channel / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/** Compresses one linear-light channel (0..1) back to sRGB 0-255, clamped. */
function linearToSrgb(x: number): number {
  const c = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

/**
 * Parses a hex color into Oklab.
 * @param hex Six-digit hex, with or without a leading `#`, any case.
 * @returns The color in Oklab.
 */
export function hexToOklab(hex: string): Oklab {
  const h = hex.replace('#', '');
  const r = srgbToLinear(parseInt(h.slice(0, 2), 16));
  const g = srgbToLinear(parseInt(h.slice(2, 4), 16));
  const b = srgbToLinear(parseInt(h.slice(4, 6), 16));

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/**
 * Converts an Oklab color back to a hex string, clamping out-of-gamut results.
 * @param c The Oklab color.
 * @returns Lowercase six-digit hex including the leading `#`.
 */
export function oklabToHex(c: Oklab): string {
  const l_ = c.L + 0.3963377774 * c.a + 0.2158037573 * c.b;
  const m_ = c.L - 0.1055613458 * c.a - 0.0638541728 * c.b;
  const s_ = c.L - 0.0894841775 * c.a - 1.291485548 * c.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const b = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Interpolates between two hex colors through Oklab space.
 *
 * Oklab rather than sRGB because an sRGB midpoint between a warm orange and a
 * cool violet passes through desaturated grey-brown mud; Oklab keeps it
 * colorful. Cartesian (L, a, b) rather than polar Oklch because Oklab has no
 * hue-wraparound ambiguity to resolve.
 *
 * @param from Hex color returned at `t <= 0`.
 * @param to Hex color returned at `t >= 1`.
 * @param t Position between the two, clamped to 0..1.
 * @returns Lowercase six-digit hex including the leading `#`.
 */
export function mixOklab(from: string, to: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const x = hexToOklab(from);
  const y = hexToOklab(to);
  return oklabToHex({
    L: x.L + (y.L - x.L) * k,
    a: x.a + (y.a - x.a) * k,
    b: x.b + (y.b - x.b) * k,
  });
}
