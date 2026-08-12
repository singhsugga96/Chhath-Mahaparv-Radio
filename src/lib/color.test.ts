import { describe, expect, it } from 'vitest';
import { hexToOklab, mixOklab, oklabToHex } from './color';

describe('hexToOklab', () => {
  it('maps white to L=1 with no chroma', () => {
    const { L, a, b } = hexToOklab('#ffffff');
    expect(L).toBeCloseTo(1, 3);
    expect(a).toBeCloseTo(0, 3);
    expect(b).toBeCloseTo(0, 3);
  });

  it('maps black to L=0', () => {
    expect(hexToOklab('#000000').L).toBeCloseTo(0, 3);
  });

  it('accepts hex without a leading hash and is case insensitive', () => {
    expect(hexToOklab('FFFFFF').L).toBeCloseTo(1, 3);
  });
});

describe('oklabToHex', () => {
  it('round-trips a saturated color', () => {
    expect(oklabToHex(hexToOklab('#e8613c'))).toBe('#e8613c');
  });

  it('round-trips a dark blue', () => {
    expect(oklabToHex(hexToOklab('#0b1026'))).toBe('#0b1026');
  });

  it('clamps out-of-gamut values instead of emitting invalid hex', () => {
    expect(oklabToHex({ L: 2, a: 0.5, b: 0.5 })).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('mixOklab', () => {
  it('returns the endpoints exactly at t=0 and t=1', () => {
    expect(mixOklab('#0b1026', '#e8613c', 0)).toBe('#0b1026');
    expect(mixOklab('#0b1026', '#e8613c', 1)).toBe('#e8613c');
  });

  it('clamps t outside 0..1', () => {
    expect(mixOklab('#0b1026', '#e8613c', -3)).toBe('#0b1026');
    expect(mixOklab('#0b1026', '#e8613c', 9)).toBe('#e8613c');
  });

  it('always returns valid six-digit hex', () => {
    for (let i = 0; i <= 10; i++) {
      expect(mixOklab('#3a2a5e', '#ffb03a', i / 10)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  /*
   * The reason this module exists, demonstrated on the case where it actually
   * shows: complementary hues. Averaging pure blue and pure yellow channelwise
   * in sRGB gives #808080 — literal grey, all color annihilated. Oklab keeps a
   * measurable amount of chroma at the same midpoint.
   *
   * Note this does NOT hold for every hue pair. For non-complementary colors an
   * sRGB average can be MORE chromatic than the Oklab mix, because Oklab is
   * interpolating a straight line in perceptual space rather than maximising
   * saturation. Oklab's benefit is perceptual uniformity and hue stability, not
   * chroma everywhere.
   */
  it('does not collapse complementary hues to grey the way sRGB does', () => {
    const chroma = (hex: string): number => {
      const { a, b } = hexToOklab(hex);
      return Math.hypot(a, b);
    };

    const oklabMid = mixOklab('#0000ff', '#ffff00', 0.5);

    // The naive channelwise sRGB average of these two is exactly #808080.
    expect(chroma('#808080')).toBeLessThan(0.01);
    expect(chroma(oklabMid)).toBeGreaterThan(0.03);
  });
});
