/**
 * Formats a duration for the player's time readout.
 *
 * @param seconds Elapsed or total seconds. Negative, NaN, and non-finite values
 *   collapse to `0:00` rather than rendering garbage into the UI — the YouTube
 *   API returns 0 or NaN before metadata has loaded.
 * @returns `m:ss` below an hour, `h:mm:ss` at or above one.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);

  const pad = (n: number): string => String(n).padStart(2, '0');

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
