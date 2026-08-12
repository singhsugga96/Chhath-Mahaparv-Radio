/**
 * Working out when to set an alarm for Chhath train tickets.
 *
 * Indian Railways' Advance Reservation Period is 60 days *excluding the date of
 * journey*, and general-quota booking opens at 08:00 IST. Seats for Chhath
 * travel to Bihar and eastern UP are gone within minutes, so the reminder is set
 * for 07:30 IST — half an hour before the counter opens.
 */

/** IST is UTC+5:30, and India has no daylight saving. */
const IST_OFFSET_MINUTES = 330;

const DAY_MS = 86_400_000;

/** Advance Reservation Period, in days, excluding the date of journey. */
export const ARP_DAYS = 60;

/** General-quota booking opens at this IST hour and minute. */
export const BOOKING_OPENS = { hour: 8, minute: 0 } as const;

/** The reminder fires half an hour before the counter opens. */
export const REMINDER_TIME = { hour: 7, minute: 30 } as const;

/**
 * Sets a time of day, in IST, on the day containing an instant.
 * @param dayMs Any instant on the target day (interpreted in IST).
 * @param hour IST hour.
 * @param minute IST minute.
 * @returns Epoch ms of that IST wall-clock time.
 */
function atIst(dayMs: number, hour: number, minute: number): number {
  // Shift into IST so date arithmetic lands on the right calendar day, floor to
  // midnight, add the time, then shift back.
  const shifted = dayMs + IST_OFFSET_MINUTES * 60_000;
  const midnight = Math.floor(shifted / DAY_MS) * DAY_MS;
  return midnight + (hour * 60 + minute) * 60_000 - IST_OFFSET_MINUTES * 60_000;
}

/**
 * When booking opens for a given journey date.
 * @param journeyMs Any instant on the day of travel.
 * @returns Epoch ms of 08:00 IST, {@link ARP_DAYS} days before the journey.
 */
export function bookingOpensAt(journeyMs: number): number {
  return atIst(journeyMs - ARP_DAYS * DAY_MS, BOOKING_OPENS.hour, BOOKING_OPENS.minute);
}

/**
 * When to be sitting at the screen, ready.
 * @param journeyMs Any instant on the day of travel.
 * @returns Epoch ms of 07:30 IST on the day booking opens.
 */
export function reminderAt(journeyMs: number): number {
  return atIst(journeyMs - ARP_DAYS * DAY_MS, REMINDER_TIME.hour, REMINDER_TIME.minute);
}

/** Formats an instant as Google Calendar's compact UTC form. */
function toCalendarStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Everything the calendar event needs. */
export interface CalendarEvent {
  /** Event start, epoch ms. */
  start: number;
  /** Event end, epoch ms. */
  end: number;
  title: string;
  details: string;
}

/**
 * Builds a Google Calendar "add event" link.
 *
 * A prefilled template only — following it opens Google's own compose screen,
 * where the person still has to press save. Nothing is written to anyone's
 * calendar by this site.
 *
 * @param event The event to prefill.
 * @returns An absolute calendar.google.com URL.
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toCalendarStamp(event.start)}/${toCalendarStamp(event.end)}`,
    details: event.details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * The booking reminder for a chosen journey date.
 * @param journeyMs Any instant on the day of travel.
 * @returns The event to offer as a calendar reminder, running from 07:30 IST
 *   until the counter opens at 08:00.
 */
export function bookingReminderEvent(journeyMs: number): CalendarEvent {
  return {
    start: reminderAt(journeyMs),
    end: bookingOpensAt(journeyMs),
    title: 'छठ यात्रा — ट्रेन टिकट बुकिंग खुलती है · Chhath train booking opens',
    details:
      'General-quota booking opens at 08:00 IST, exactly 60 days before the date of journey. ' +
      'Chhath trains to Bihar and eastern UP fill within minutes, so be logged in and ready before 08:00. ' +
      'Note: for the first 15 minutes, booking is restricted to Aadhaar-authenticated users on the IRCTC site and app.',
  };
}
