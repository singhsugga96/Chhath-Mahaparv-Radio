import { describe, expect, it } from 'vitest';
import { STAGES } from './narrative';
import { stageOpacity, stageVars } from './stages';

describe('stageOpacity', () => {
  it('is fully on at a stage and fully off at every other stage', () => {
    STAGES.forEach((stage, i) => {
      STAGES.forEach((_, j) => {
        expect(stageOpacity(stage.minutes, j)).toBe(i === j ? 1 : 0);
      });
    });
  });

  it('cross-fades evenly at the midpoint between two stages', () => {
    for (let i = 0; i < STAGES.length - 1; i++) {
      const mid = (STAGES[i]!.minutes + STAGES[i + 1]!.minutes) / 2;
      expect(stageOpacity(mid, i)).toBeCloseTo(0.5, 6);
      expect(stageOpacity(mid, i + 1)).toBeCloseTo(0.5, 6);
    }
  });

  /*
   * The property that makes uneven stage spacing safe: whatever the gaps, the
   * visible layers always add up to exactly one scene's worth of opacity.
   */
  it('has weights summing to 1 everywhere across the arc', () => {
    const first = STAGES[0]!.minutes;
    const last = STAGES.at(-1)!.minutes;
    for (let m = first; m <= last; m += 7) {
      const total = STAGES.reduce((sum, _, i) => sum + stageOpacity(m, i), 0);
      expect(total).toBeCloseTo(1, 6);
    }
  });

  it('holds the first stage open before the arc begins', () => {
    expect(stageOpacity(0, 0)).toBe(1);
    expect(stageOpacity(STAGES[0]!.minutes - 100, 0)).toBe(1);
    expect(stageOpacity(0, 1)).toBe(0);
  });

  it('holds the last stage open after the arc ends', () => {
    const lastIndex = STAGES.length - 1;
    expect(stageOpacity(STAGES[lastIndex]!.minutes + 500, lastIndex)).toBe(1);
    expect(stageOpacity(STAGES[lastIndex]!.minutes + 500, 0)).toBe(0);
  });

  it('stays within 0..1 everywhere', () => {
    for (let m = 0; m <= 2400; m += 3) {
      STAGES.forEach((_, i) => {
        const o = stageOpacity(m, i);
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThanOrEqual(1);
      });
    }
  });

  it('returns 0 for an index outside the stage list', () => {
    expect(stageOpacity(500, -1)).toBe(0);
    expect(stageOpacity(500, STAGES.length)).toBe(0);
  });
});

describe('stageVars', () => {
  it('emits one property per stage, named by id', () => {
    expect(Object.keys(stageVars(1035)).sort()).toEqual(
      STAGES.map((s) => `--s-${s.id}`).sort(),
    );
  });

  it('emits numeric strings usable directly as CSS opacity', () => {
    for (const value of Object.values(stageVars(1147))) {
      expect(value).toMatch(/^\d\.\d{3}$/);
      expect(Number(value)).toBeGreaterThanOrEqual(0);
      expect(Number(value)).toBeLessThanOrEqual(1);
    }
  });

  it('lights only the arghya layer at the arghya minute', () => {
    const vars = stageVars(1035);
    expect(vars['--s-sandhya-arghya']).toBe('1.000');
    expect(vars['--s-kosi-bharai']).toBe('0.000');
    expect(vars['--s-kharna']).toBe('0.000');
  });
});
