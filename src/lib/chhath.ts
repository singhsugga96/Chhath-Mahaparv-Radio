/**
 * When the next Chhath Puja is.
 *
 * Chhath is lunisolar — it falls on Kartik Shukla Shashthi — so the dates cannot
 * be computed from the Gregorian calendar and must be tabulated. Only years
 * whose dates have actually been verified appear below; past the last entry the
 * status is `unknown` and the UI hides itself rather than showing a wrong date.
 */

/** IST is UTC+5:30, and India has no daylight saving. */
const IST_OFFSET_MINUTES = 330;

const DAY_MS = 86_400_000;

/**
 * Shashthi — the Sandhya Arghya day, and the festival's main date.
 *
 * The other three days are consecutive around it (Nahay Khay two days before,
 * Kharna one day before, Usha Arghya the morning after), so only this one date
 * is stored per year and the rest are derived. Sources: Chhath 2026 runs
 * 13–16 November; Chhath 2027 falls on 4 November.
 */
export const SHASHTHI_DATES: readonly { year: number; date: string }[] = [
  { year: 2026, date: '2026-11-15' },
  { year: 2027, date: '2027-11-04' },
];

/** The four days, in order, as they are labelled on the page. */
export const DAY_IDS = ['nahay-khay', 'kharna', 'sandhya-arghya', 'usha-arghya'] as const;

/** One of the four ritual days. */
export type DayId = (typeof DAY_IDS)[number];

/** Where we are relative to Chhath right now. */
export type ChhathStatus =
  | {
      kind: 'upcoming';
      /** Epoch ms of 00:00 IST on Nahay Khay. */
      startsAt: number;
      /** Milliseconds from `now` until the festival begins. Always > 0. */
      msRemaining: number;
      /** Calendar year the festival falls in. */
      year: number;
      /** Epoch ms of 00:00 IST for each of the four days. */
      days: readonly number[];
    }
  | {
      kind: 'during';
      /** Which of the four days is happening, 0-based. */
      dayIndex: number;
      /** The day's id, matching the section ids on the page. */
      dayId: DayId;
      year: number;
      days: readonly number[];
    }
  /** Past the last tabulated year — the caller should hide the widget. */
  | { kind: 'unknown' };

/**
 * Epoch milliseconds of midnight IST on a `YYYY-MM-DD` date.
 * @param date Calendar date, interpreted in IST.
 * @returns Epoch ms of 00:00:00 IST that day.
 */
function istMidnight(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d) - IST_OFFSET_MINUTES * 60_000;
}

/**
 * The four days' start instants for a given Shashthi date. Nahay Khay is two
 * days before Shashthi, and Usha Arghya is the day after.
 * @param shashthi Sandhya Arghya date, `YYYY-MM-DD` in IST.
 * @returns Epoch ms of 00:00 IST for each of the four days, in order.
 */
export function festivalDays(shashthi: string): number[] {
  const shashthiMs = istMidnight(shashthi);
  return [-2, -1, 0, 1].map((offset) => shashthiMs + offset * DAY_MS);
}

/**
 * Works out whether Chhath is coming, happening, or beyond what we know.
 *
 * @param now The current instant. Injected rather than read from the clock so
 *   this stays pure and testable.
 * @returns The current status. `unknown` once `now` is past the final tabulated
 *   festival, which is the signal to hide the countdown rather than guess.
 */
export function chhathStatus(now: Date): ChhathStatus {
  const t = now.getTime();

  for (const entry of SHASHTHI_DATES) {
    const days = festivalDays(entry.date);
    const start = days[0]!;
    // The festival runs until the end of Usha Arghya day.
    const end = days[3]! + DAY_MS;

    if (t < start) {
      return {
        kind: 'upcoming',
        startsAt: start,
        msRemaining: start - t,
        year: entry.year,
        days,
      };
    }

    if (t < end) {
      let dayIndex = 0;
      for (let i = 0; i < days.length; i++) {
        if (t >= days[i]!) dayIndex = i;
      }
      return {
        kind: 'during',
        dayIndex,
        dayId: DAY_IDS[dayIndex]!,
        year: entry.year,
        days,
      };
    }
  }

  return { kind: 'unknown' };
}

/**
 * Formats an instant as a `YYYY-MM-DD` calendar date **in IST**.
 *
 * Not `toISOString().slice(0, 10)`: these instants are midnight IST, which is
 * 18:30 UTC the previous day, so formatting in UTC reports every festival date a
 * day early. That is invisible in a countdown and wrong in structured data.
 *
 * @param ms Epoch milliseconds.
 * @returns The IST calendar date, e.g. `2026-11-13`.
 */
export function istDateString(ms: number): string {
  return new Date(ms + IST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

/** A countdown broken into whole units. */
export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Splits a duration into days, hours, minutes and seconds.
 * @param ms Milliseconds remaining. Negative values clamp to all zeroes.
 * @returns The duration in whole units.
 */
export function splitDuration(ms: number): Countdown {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor(total / 3_600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
}
