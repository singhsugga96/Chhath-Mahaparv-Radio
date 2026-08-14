/**
 * Remembering where the listener was, so a reload does not start from nothing.
 *
 * Mobile browsers discard a backgrounded tab under memory pressure and reload it
 * when the person comes back, which is what happens whenever a phone screen
 * locks for a while. Nothing can keep a YouTube embed playing through that, but
 * landing back on a cold "tap to begin" throws away the whole session, and that
 * part is avoidable.
 */

/** Where the listener was when we last looked. */
export interface SavedSession {
  /** Video id that was playing. */
  videoId: string;
  /** Seconds into that track. */
  elapsed: number;
  /** Page scroll offset in pixels. */
  scrollY: number;
  /** Epoch ms the snapshot was taken. */
  savedAt: number;
}

/** How stale a session may be and still be worth resuming. */
export const MAX_SESSION_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * Parses a stored session, rejecting anything malformed.
 *
 * Storage is shared with the user, other tabs and older versions of this code,
 * so its contents are treated as untrusted input rather than assumed valid.
 *
 * @param raw The stored string, or null when nothing is stored.
 * @returns The session, or null if absent or unusable.
 */
export function parseSession(raw: string | null): SavedSession | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;

  if (typeof v.videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(v.videoId)) return null;
  if (typeof v.elapsed !== 'number' || !Number.isFinite(v.elapsed) || v.elapsed < 0) return null;
  if (typeof v.scrollY !== 'number' || !Number.isFinite(v.scrollY) || v.scrollY < 0) return null;
  if (typeof v.savedAt !== 'number' || !Number.isFinite(v.savedAt)) return null;

  return {
    videoId: v.videoId,
    elapsed: v.elapsed,
    scrollY: v.scrollY,
    savedAt: v.savedAt,
  };
}

/**
 * Whether a session is recent enough to resume.
 *
 * An hours-old session is not "where I was", it is a different sitting. Resuming
 * one would be more confusing than starting fresh.
 *
 * @param session The candidate session.
 * @param now Current epoch ms.
 * @returns True when the session is within {@link MAX_SESSION_AGE_MS}.
 */
export function isResumable(session: SavedSession, now: number): boolean {
  const age = now - session.savedAt;
  return age >= 0 && age <= MAX_SESSION_AGE_MS;
}

/**
 * Where to resume a track, backed off slightly from where it stopped.
 *
 * Restarting exactly where audio was cut mid-word feels broken. A couple of
 * seconds of overlap reads as continuing rather than jumping.
 *
 * @param elapsed Seconds into the track when the snapshot was taken.
 * @returns Seconds to seek to, never negative.
 */
export function resumePoint(elapsed: number): number {
  return Math.max(0, elapsed - 2);
}
