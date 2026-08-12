import { describe, expect, it } from 'vitest';
import { KEYFRAMES, paletteAt } from './sky';

const HEX = /^#[0-9a-f]{6}$/;

describe('KEYFRAMES', () => {
  it('is sorted ascending by minutes', () => {
    const mins = KEYFRAMES.map((k) => k.minutes);
    expect(mins).toEqual([...mins].sort((a, b) => a - b));
  });

  it('starts at midnight and stays within the day', () => {
    expect(KEYFRAMES[0]!.minutes).toBe(0);
    expect(KEYFRAMES.at(-1)!.minutes).toBeLessThan(1440);
  });

  it('includes both arghya stages at their ritual times', () => {
    expect(KEYFRAMES.find((k) => k.stage === 'Usha Arghya')?.minutes).toBe(370);
    expect(KEYFRAMES.find((k) => k.stage === 'Sandhya Arghya')?.minutes).toBe(1035);
  });
});

describe('paletteAt', () => {
  it('returns a keyframe exactly when the time is exactly on it', () => {
    for (const k of KEYFRAMES) {
      expect(paletteAt(k.minutes)).toEqual({
        skyTop: k.skyTop,
        skyHorizon: k.skyHorizon,
        water: k.water,
        diyaGlow: k.diyaGlow,
      });
    }
  });

  it('returns valid hex and an in-range glow at every minute of the day', () => {
    for (let m = 0; m < 1440; m++) {
      const p = paletteAt(m);
      expect(p.skyTop).toMatch(HEX);
      expect(p.skyHorizon).toMatch(HEX);
      expect(p.water).toMatch(HEX);
      expect(p.diyaGlow).toBeGreaterThanOrEqual(0);
      expect(p.diyaGlow).toBeLessThanOrEqual(1);
    }
  });

  it('interpolates strictly between the bracketing keyframes', () => {
    // 07:00 sits between Usha Arghya (370) and Morning (480).
    const mid = paletteAt(420);
    expect(mid.skyTop).not.toBe(paletteAt(370).skyTop);
    expect(mid.skyTop).not.toBe(paletteAt(480).skyTop);
  });

  /*
   * The 20:00 and 00:00 keyframes carry identical palettes, so interpolating
   * across the seam yields that same palette at every minute between them.
   * That identity is exactly what makes the wrap invisible.
   */
  it('wraps continuously across midnight', () => {
    expect(paletteAt(1439).skyTop).toBe(paletteAt(0).skyTop);
    expect(paletteAt(1439).diyaGlow).toBeCloseTo(paletteAt(0).diyaGlow, 2);
  });

  it('holds full diya glow through the night', () => {
    expect(paletteAt(0).diyaGlow).toBe(1);
    expect(paletteAt(1200).diyaGlow).toBe(1);
  });

  it('extinguishes the diyas in full daylight', () => {
    expect(paletteAt(480).diyaGlow).toBe(0);
    expect(paletteAt(720).diyaGlow).toBe(0);
  });

  it('normalises out-of-range and fractional minutes', () => {
    expect(paletteAt(1440)).toEqual(paletteAt(0));
    expect(paletteAt(-60)).toEqual(paletteAt(1380));
    expect(paletteAt(370.6).skyTop).toMatch(HEX);
  });

  // Narrative minutes above 1440 are how the closing sunrise is expressed.
  it('accepts narrative minutes beyond one day', () => {
    expect(paletteAt(1810)).toEqual(paletteAt(370));
    expect(paletteAt(1920)).toEqual(paletteAt(480));
  });
});
