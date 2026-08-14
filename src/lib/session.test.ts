import { describe, expect, it } from 'vitest';
import {
  MAX_SESSION_AGE_MS,
  type SavedSession,
  isResumable,
  parseSession,
  resumePoint,
} from './session';

const valid: SavedSession = {
  videoId: 'j9G3caThH98',
  elapsed: 137.5,
  scrollY: 2400,
  savedAt: 1_700_000_000_000,
};

describe('parseSession', () => {
  it('round-trips a valid session', () => {
    expect(parseSession(JSON.stringify(valid))).toEqual(valid);
  });

  it('returns null when nothing is stored', () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession('')).toBeNull();
  });

  /*
   * Storage is shared with the user, other tabs and older builds, so its
   * contents are untrusted input. A malformed entry must not throw on load.
   */
  it('rejects malformed JSON without throwing', () => {
    expect(parseSession('{')).toBeNull();
    expect(parseSession('not json')).toBeNull();
    expect(parseSession('null')).toBeNull();
    expect(parseSession('[]')).toBeNull();
    expect(parseSession('42')).toBeNull();
  });

  it('rejects a bad video id', () => {
    expect(parseSession(JSON.stringify({ ...valid, videoId: 'short' }))).toBeNull();
    expect(parseSession(JSON.stringify({ ...valid, videoId: 'has spaces!' }))).toBeNull();
    expect(parseSession(JSON.stringify({ ...valid, videoId: 42 }))).toBeNull();
  });

  it('rejects impossible numbers', () => {
    expect(parseSession(JSON.stringify({ ...valid, elapsed: -5 }))).toBeNull();
    expect(parseSession(JSON.stringify({ ...valid, elapsed: 'abc' }))).toBeNull();
    expect(parseSession(JSON.stringify({ ...valid, scrollY: -1 }))).toBeNull();
    expect(parseSession(JSON.stringify({ ...valid, savedAt: null }))).toBeNull();
  });

  it('rejects a session missing fields entirely', () => {
    expect(parseSession(JSON.stringify({ videoId: valid.videoId }))).toBeNull();
  });
});

describe('isResumable', () => {
  it('accepts a session from moments ago', () => {
    expect(isResumable(valid, valid.savedAt + 30_000)).toBe(true);
  });

  it('accepts one right on the age limit', () => {
    expect(isResumable(valid, valid.savedAt + MAX_SESSION_AGE_MS)).toBe(true);
  });

  /*
   * An hours-old session is a different sitting, not "where I was". Resuming it
   * would be more confusing than starting fresh.
   */
  it('rejects a stale session', () => {
    expect(isResumable(valid, valid.savedAt + MAX_SESSION_AGE_MS + 1)).toBe(false);
    expect(isResumable(valid, valid.savedAt + 24 * 60 * 60 * 1000)).toBe(false);
  });

  it('rejects a session stamped in the future, which means a bad clock', () => {
    expect(isResumable(valid, valid.savedAt - 1000)).toBe(false);
  });
});

describe('resumePoint', () => {
  it('backs off a couple of seconds so it reads as continuing', () => {
    expect(resumePoint(137.5)).toBe(135.5);
  });

  it('never goes negative near the start of a track', () => {
    expect(resumePoint(1)).toBe(0);
    expect(resumePoint(0)).toBe(0);
  });
});
