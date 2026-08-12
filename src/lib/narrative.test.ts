import { describe, expect, it } from 'vitest';
import { STAGES, narrativeMinutes } from './narrative';

describe('STAGES', () => {
  // This is the invariant the whole narrative-axis idea rests on.
  it('is strictly ascending, so scrolling never runs time backwards', () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i]!.minutes).toBeGreaterThan(STAGES[i - 1]!.minutes);
    }
  });

  it('has unique ids', () => {
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(STAGES.length);
  });

  it('spans pre-dawn to the morning after the closing sunrise', () => {
    expect(STAGES[0]!.minutes).toBe(270);
    expect(STAGES.at(-1)!.minutes).toBeGreaterThan(1440);
  });

  it('places the closing sunrise on the next day', () => {
    const usha = STAGES.find((s) => s.id === 'usha-arghya');
    expect(usha?.minutes).toBe(1810);
    expect(usha!.minutes % 1440).toBe(370);
  });
});

describe('narrativeMinutes', () => {
  it('returns the first and last stage minutes at the extremes', () => {
    expect(narrativeMinutes(0)).toBe(STAGES[0]!.minutes);
    expect(narrativeMinutes(1)).toBe(STAGES.at(-1)!.minutes);
  });

  it('clamps progress outside 0..1', () => {
    expect(narrativeMinutes(-5)).toBe(STAGES[0]!.minutes);
    expect(narrativeMinutes(5)).toBe(STAGES.at(-1)!.minutes);
  });

  it('hits each stage exactly at its own scroll position', () => {
    STAGES.forEach((stage, i) => {
      expect(narrativeMinutes(i / (STAGES.length - 1))).toBeCloseTo(stage.minutes, 6);
    });
  });

  it('increases monotonically across the whole scroll', () => {
    let previous = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const m = narrativeMinutes(i / 200);
      expect(m).toBeGreaterThanOrEqual(previous);
      previous = m;
    }
  });

  it('interpolates between stages rather than snapping', () => {
    const half = narrativeMinutes(0.5 / (STAGES.length - 1));
    expect(half).toBeGreaterThan(STAGES[0]!.minutes);
    expect(half).toBeLessThan(STAGES[1]!.minutes);
  });
});
