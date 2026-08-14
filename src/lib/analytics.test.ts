import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MEASUREMENT_ID,
  isMeasurementId,
  resolveMeasurementId,
} from './analytics';

describe('isMeasurementId', () => {
  it('accepts GA4 ids', () => {
    expect(isMeasurementId('G-ABC1234567')).toBe(true);
    expect(isMeasurementId('G-1A2B3C4D5E')).toBe(true);
  });

  it('accepts the site\'s own id', () => {
    expect(isMeasurementId(DEFAULT_MEASUREMENT_ID)).toBe(true);
  });

  it('rejects the older Universal Analytics form', () => {
    expect(isMeasurementId('UA-12345678-1')).toBe(false);
  });

  it('rejects near misses', () => {
    expect(isMeasurementId('G-abc1234567')).toBe(false); // lowercase
    expect(isMeasurementId('GABC1234567')).toBe(false); // missing hyphen
    expect(isMeasurementId('G-12345')).toBe(false); // too short
    expect(isMeasurementId('G-')).toBe(false);
    expect(isMeasurementId('')).toBe(false);
  });
});

describe('resolveMeasurementId', () => {
  /*
   * The property that keeps local work out of the reports. Running npm run dev
   * must never send anything to Google.
   */
  it('tracks nothing in development when no id is set', () => {
    expect(resolveMeasurementId(undefined, false)).toBeNull();
    expect(resolveMeasurementId('', false)).toBeNull();
    expect(resolveMeasurementId('   ', false)).toBeNull();
  });

  /*
   * The property that stops a deploy silently forgetting analytics. Production
   * works with no environment configuration at all.
   */
  it('falls back to the site id in production when no id is set', () => {
    expect(resolveMeasurementId(undefined, true)).toBe(DEFAULT_MEASUREMENT_ID);
    expect(resolveMeasurementId('', true)).toBe(DEFAULT_MEASUREMENT_ID);
  });

  it('lets an explicit id override in either mode', () => {
    expect(resolveMeasurementId('G-OVERRIDE01', true)).toBe('G-OVERRIDE01');
    expect(resolveMeasurementId('  G-OVERRIDE01  ', false)).toBe('G-OVERRIDE01');
  });

  /*
   * A typo would otherwise build fine, load gtag, and record nothing, which is
   * the kind of failure nobody notices for months.
   */
  it('throws on a malformed id rather than tracking nothing', () => {
    expect(() => resolveMeasurementId('G-oops', true)).toThrow(/not a GA4 measurement id/);
    expect(() => resolveMeasurementId('UA-12345678-1', true)).toThrow(/G-XXXXXXXXXX/);
    expect(() => resolveMeasurementId('G-oops', false)).toThrow();
  });

  it('ignores non-string values without throwing', () => {
    expect(resolveMeasurementId(42, false)).toBeNull();
    expect(resolveMeasurementId({}, true)).toBe(DEFAULT_MEASUREMENT_ID);
  });
});
