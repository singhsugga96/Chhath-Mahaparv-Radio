import { describe, expect, it } from 'vitest';
import {
  DAY_IDS,
  SHASHTHI_DATES,
  chhathStatus,
  festivalDays,
  istDateString,
  splitDuration,
} from './chhath';

/** Builds an instant from IST wall-clock components. */
const ist = (
  y: number,
  m: number,
  d: number,
  hh = 0,
  mm = 0,
): Date => new Date(Date.UTC(y, m - 1, d, hh, mm) - 330 * 60_000);

describe('SHASHTHI_DATES', () => {
  it('is in ascending order so the first future entry found is the nearest', () => {
    for (let i = 1; i < SHASHTHI_DATES.length; i++) {
      expect(SHASHTHI_DATES[i]!.date > SHASHTHI_DATES[i - 1]!.date).toBe(true);
    }
  });

  it('records the verified 2026 and 2027 dates', () => {
    expect(SHASHTHI_DATES.find((e) => e.year === 2026)?.date).toBe('2026-11-15');
    expect(SHASHTHI_DATES.find((e) => e.year === 2027)?.date).toBe('2027-11-04');
  });
});

describe('festivalDays', () => {
  it('places Nahay Khay two days before Shashthi and Usha the day after', () => {
    const days = festivalDays('2026-11-15');
    expect(days).toHaveLength(4);
    // 13, 14, 15, 16 November 2026, each at 00:00 IST.
    expect(days[0]).toBe(ist(2026, 11, 13).getTime());
    expect(days[1]).toBe(ist(2026, 11, 14).getTime());
    expect(days[2]).toBe(ist(2026, 11, 15).getTime());
    expect(days[3]).toBe(ist(2026, 11, 16).getTime());
  });

  it('handles a Shashthi that crosses a month boundary', () => {
    // 2027 Shashthi is 4 November, so Nahay Khay is 2 November.
    const days = festivalDays('2027-11-04');
    expect(days[0]).toBe(ist(2027, 11, 2).getTime());
    expect(days[3]).toBe(ist(2027, 11, 5).getTime());
  });

  it('spaces the days exactly 24 hours apart', () => {
    const days = festivalDays('2026-11-15');
    for (let i = 1; i < days.length; i++) {
      expect(days[i]! - days[i - 1]!).toBe(86_400_000);
    }
  });
});

describe('istDateString', () => {
  /*
   * The bug this exists to prevent: these instants are midnight IST, which is
   * 18:30 UTC the previous day. Formatting with toISOString would report every
   * festival date a day early, which is invisible in a countdown and wrong in
   * structured data.
   */
  it('reports the IST calendar date, not the UTC one', () => {
    const days = festivalDays('2026-11-15');
    expect(days.map(istDateString)).toEqual([
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
    ]);
  });

  it('does not agree with naive UTC formatting, which is the whole point', () => {
    const midnightIst = festivalDays('2026-11-15')[0]!;
    expect(new Date(midnightIst).toISOString().slice(0, 10)).toBe('2026-11-12');
    expect(istDateString(midnightIst)).toBe('2026-11-13');
  });

  it('holds across a month boundary', () => {
    expect(festivalDays('2027-11-04').map(istDateString)).toEqual([
      '2027-11-02',
      '2027-11-03',
      '2027-11-04',
      '2027-11-05',
    ]);
  });
});

describe('chhathStatus', () => {
  it('counts down to the 2026 festival from before it', () => {
    const status = chhathStatus(ist(2026, 8, 13, 12, 0));
    expect(status.kind).toBe('upcoming');
    if (status.kind !== 'upcoming') return;
    expect(status.year).toBe(2026);
    expect(status.startsAt).toBe(ist(2026, 11, 13).getTime());
    expect(status.msRemaining).toBeGreaterThan(0);
    // 13 Aug noon to 13 Nov midnight is 91.5 days.
    expect(status.msRemaining / 86_400_000).toBeCloseTo(91.5, 1);
  });

  it('reports the right day during the festival', () => {
    const cases: [Date, number][] = [
      [ist(2026, 11, 13, 9, 0), 0],
      [ist(2026, 11, 14, 23, 59), 1],
      [ist(2026, 11, 15, 17, 30), 2],
      [ist(2026, 11, 16, 6, 15), 3],
    ];
    for (const [when, expected] of cases) {
      const status = chhathStatus(when);
      expect(status.kind).toBe('during');
      if (status.kind !== 'during') continue;
      expect(status.dayIndex).toBe(expected);
      expect(status.dayId).toBe(DAY_IDS[expected]);
    }
  });

  it('switches to during at the exact moment the festival begins', () => {
    expect(chhathStatus(new Date(ist(2026, 11, 13).getTime() - 1)).kind).toBe('upcoming');
    expect(chhathStatus(ist(2026, 11, 13)).kind).toBe('during');
  });

  it('rolls to the next year once the festival is over', () => {
    // One minute after Usha Arghya day ends.
    const status = chhathStatus(ist(2026, 11, 17, 0, 1));
    expect(status.kind).toBe('upcoming');
    if (status.kind !== 'upcoming') return;
    expect(status.year).toBe(2027);
    expect(status.startsAt).toBe(ist(2027, 11, 2).getTime());
  });

  /*
   * The honest failure mode: rather than extrapolating a lunisolar date it
   * cannot know, it reports unknown and the widget hides itself.
   */
  it('reports unknown past the last tabulated year', () => {
    expect(chhathStatus(ist(2028, 1, 1)).kind).toBe('unknown');
    expect(chhathStatus(ist(2030, 6, 1)).kind).toBe('unknown');
  });

  it('never returns a negative countdown', () => {
    for (let day = 1; day <= 28; day++) {
      const status = chhathStatus(ist(2026, 10, day));
      if (status.kind === 'upcoming') expect(status.msRemaining).toBeGreaterThan(0);
    }
  });
});

describe('splitDuration', () => {
  it('splits a duration into whole units', () => {
    const ms = ((2 * 24 + 3) * 60 + 4) * 60_000 + 5_000;
    expect(splitDuration(ms)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it('is all zeroes at zero and for negatives', () => {
    const zero = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    expect(splitDuration(0)).toEqual(zero);
    expect(splitDuration(-50_000)).toEqual(zero);
  });

  it('keeps hours, minutes and seconds inside their own ranges', () => {
    for (let i = 0; i < 400; i++) {
      const c = splitDuration(i * 987_654_321);
      expect(c.hours).toBeLessThan(24);
      expect(c.minutes).toBeLessThan(60);
      expect(c.seconds).toBeLessThan(60);
    }
  });

  it('truncates rather than rounding, so the countdown never shows early', () => {
    expect(splitDuration(1_999).seconds).toBe(1);
  });
});
