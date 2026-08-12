import { describe, expect, it } from 'vitest';
import { festivalDays } from './chhath';
import {
  ARP_DAYS,
  bookingOpensAt,
  bookingReminderEvent,
  googleCalendarUrl,
  reminderAt,
} from './travel';

/** Builds an instant from IST wall-clock components. */
const ist = (y: number, m: number, d: number, hh = 0, mm = 0): number =>
  Date.UTC(y, m - 1, d, hh, mm) - 330 * 60_000;

describe('bookingOpensAt', () => {
  /*
   * The anchor case for the whole widget. Nahay Khay 2026 is 13 November, so
   * travelling on the 12th to arrive in time means booking on 13 September:
   * 12 Nov minus 60 days, ARP excluding the journey date.
   */
  it('opens 60 days before the journey, at 08:00 IST', () => {
    expect(bookingOpensAt(ist(2026, 11, 12))).toBe(ist(2026, 9, 13, 8, 0));
  });

  it('matches the railway convention on a new year boundary', () => {
    // Travelling 1 January, booking opens 2 November.
    expect(bookingOpensAt(ist(2027, 1, 1))).toBe(ist(2026, 11, 2, 8, 0));
  });

  it('is independent of the time of day given for the journey', () => {
    const morning = bookingOpensAt(ist(2026, 11, 12, 6, 15));
    const night = bookingOpensAt(ist(2026, 11, 12, 23, 45));
    expect(morning).toBe(night);
  });

  it('is exactly ARP_DAYS earlier in calendar days', () => {
    const journey = ist(2026, 11, 12);
    const opens = bookingOpensAt(journey);
    const wholeDays = Math.round((journey - opens) / 86_400_000);
    expect(wholeDays).toBe(ARP_DAYS);
  });
});

describe('reminderAt', () => {
  it('fires at 07:30 IST, half an hour before the counter opens', () => {
    const journey = ist(2026, 11, 12);
    expect(reminderAt(journey)).toBe(ist(2026, 9, 13, 7, 30));
    expect(bookingOpensAt(journey) - reminderAt(journey)).toBe(30 * 60_000);
  });

  it('lands on the same calendar day as the opening', () => {
    for (let d = 1; d <= 28; d++) {
      const journey = ist(2027, 1, d);
      const gap = bookingOpensAt(journey) - reminderAt(journey);
      expect(gap).toBe(30 * 60_000);
    }
  });
});

describe('bookingReminderEvent', () => {
  it('runs from the reminder to the moment booking opens', () => {
    const journey = ist(2026, 11, 12);
    const event = bookingReminderEvent(journey);
    expect(event.start).toBe(reminderAt(journey));
    expect(event.end).toBe(bookingOpensAt(journey));
    expect(event.title).toContain('Chhath train booking opens');
  });

  it('warns about the Aadhaar-only opening window in the details', () => {
    expect(bookingReminderEvent(ist(2026, 11, 12)).details).toContain('Aadhaar');
  });
});

describe('googleCalendarUrl', () => {
  it('encodes the event as a Google Calendar template link', () => {
    const url = googleCalendarUrl(bookingReminderEvent(ist(2026, 11, 12)));
    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true);
    expect(url).toContain('action=TEMPLATE');
    // 07:30 IST is 02:00 UTC; 08:00 IST is 02:30 UTC.
    expect(decodeURIComponent(url)).toContain('20260913T020000Z/20260913T023000Z');
  });

  /*
   * Read back through searchParams rather than decodeURIComponent:
   * URLSearchParams uses form encoding, so spaces become "+", which
   * decodeURIComponent does not turn back into spaces. Google Calendar accepts
   * "+" for spaces, so this is correct output — only the naive assertion was wrong.
   */
  it('percent-encodes the Devanagari title rather than emitting raw text', () => {
    const event = bookingReminderEvent(ist(2026, 11, 12));
    const url = googleCalendarUrl(event);
    expect(url).not.toContain('छठ');
    expect(new URL(url).searchParams.get('text')).toBe(event.title);
  });

  it('produces a URL that parses, with the expected parameters', () => {
    const url = new URL(googleCalendarUrl(bookingReminderEvent(ist(2026, 11, 12))));
    expect(url.host).toBe('calendar.google.com');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
    expect(url.searchParams.get('text')).toBeTruthy();
    expect(url.searchParams.get('details')).toBeTruthy();
  });
});

describe('integration with the festival dates', () => {
  it('gives 13 September 2026 for arriving the day before Nahay Khay', () => {
    const days = festivalDays('2026-11-15');
    const journey = days[0]! - 86_400_000; // travel the day before Nahay Khay
    expect(bookingOpensAt(journey)).toBe(ist(2026, 9, 13, 8, 0));
  });

  it('gives a booking date before the festival for every sensible journey day', () => {
    const days = festivalDays('2026-11-15');
    for (let offset = 1; offset <= 3; offset++) {
      const journey = days[0]! - offset * 86_400_000;
      expect(bookingOpensAt(journey)).toBeLessThan(days[0]!);
    }
  });
});
