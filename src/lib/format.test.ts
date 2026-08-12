import { describe, expect, it } from 'vitest';
import { formatTime } from './format';

describe('formatTime', () => {
  it('formats under a minute with a zero minute field', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(59)).toBe('0:59');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(304)).toBe('5:04');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('adds an hours field only at or above an hour', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('truncates fractional seconds rather than rounding up', () => {
    expect(formatTime(59.9)).toBe('0:59');
    expect(formatTime(0.4)).toBe('0:00');
  });

  /*
   * The YouTube API returns 0 or NaN for duration before metadata loads, and a
   * NaN reaching the DOM would render "NaN:NaN" in the player.
   */
  it('collapses NaN, Infinity, and negatives to zero', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
    expect(formatTime(-Infinity)).toBe('0:00');
    expect(formatTime(-30)).toBe('0:00');
  });
});
