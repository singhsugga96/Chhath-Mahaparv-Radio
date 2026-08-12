import { describe, expect, it } from 'vitest';
import { SUNRISE_MINUTES, SUNSET_MINUTES, discAt } from './sun';

describe('discAt', () => {
  it('shows the sun between sunrise and sunset', () => {
    expect(discAt(SUNRISE_MINUTES + 1).kind).toBe('sun');
    expect(discAt(720).kind).toBe('sun');
    expect(discAt(SUNSET_MINUTES - 1).kind).toBe('sun');
  });

  it('shows the moon at night', () => {
    expect(discAt(120).kind).toBe('moon');
    expect(discAt(1300).kind).toBe('moon');
  });

  /*
   * Math.sin(Math.PI) is ~1.2e-16 rather than exactly 0, hence toBeCloseTo.
   * Do not "fix" this by rounding inside discAt.
   */
  it('sits on the horizon exactly at sunrise and sunset', () => {
    expect(discAt(SUNRISE_MINUTES).altitude).toBeCloseTo(0, 6);
    expect(discAt(SUNSET_MINUTES).altitude).toBeCloseTo(0, 6);
  });

  it('peaks at solar noon, midway between sunrise and sunset', () => {
    const noon = (SUNRISE_MINUTES + SUNSET_MINUTES) / 2;
    expect(discAt(noon).altitude).toBeCloseTo(1, 6);
    // 12:00 is near but not exactly solar noon here, so still very high.
    expect(discAt(720).altitude).toBeGreaterThan(0.99);
  });

  it('rises monotonically from sunrise to solar noon', () => {
    const noon = (SUNRISE_MINUTES + SUNSET_MINUTES) / 2;
    let previous = -1;
    for (let m = SUNRISE_MINUTES; m <= noon; m += 5) {
      const { altitude } = discAt(m);
      expect(altitude).toBeGreaterThan(previous);
      previous = altitude;
    }
  });

  it('keeps altitude in 0..1 and position in 0..100 all day', () => {
    for (let m = 0; m < 1440; m++) {
      const d = discAt(m);
      expect(d.altitude).toBeGreaterThanOrEqual(0);
      expect(d.altitude).toBeLessThanOrEqual(1);
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(100);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(100);
    }
  });

  it('maps higher altitude to a smaller y', () => {
    const noon = (SUNRISE_MINUTES + SUNSET_MINUTES) / 2;
    expect(discAt(noon).y).toBeLessThan(discAt(SUNRISE_MINUTES).y);
  });

  it('travels left to right across the daytime arc', () => {
    expect(discAt(SUNRISE_MINUTES).x).toBeCloseTo(0, 6);
    expect(discAt(SUNSET_MINUTES).x).toBeCloseTo(100, 6);
    expect(discAt(600).x).toBeLessThan(discAt(900).x);
  });

  it('gives the moon its own continuous arc across midnight', () => {
    const justBefore = discAt(1439);
    const justAfter = discAt(0);
    expect(Math.abs(justAfter.x - justBefore.x)).toBeLessThan(1);
    expect(Math.abs(justAfter.altitude - justBefore.altitude)).toBeLessThan(0.05);
  });

  it('normalises out-of-range minutes', () => {
    expect(discAt(1440)).toEqual(discAt(0));
    expect(discAt(-60)).toEqual(discAt(1380));
  });

  // The closing sunrise of the narrative arc is minute 1810.
  it('treats narrative minute 1810 as the rising sun', () => {
    expect(discAt(1810).kind).toBe('sun');
    expect(discAt(1810).altitude).toBeCloseTo(0, 6);
  });
});
