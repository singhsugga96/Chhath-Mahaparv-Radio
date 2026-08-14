import { describe, expect, it } from 'vitest';
import {
  BRAND,
  BRAND_HI,
  CREATOR_HANDLE,
  CREATOR_URL,
  DESCRIPTION,
  documentTitle,
} from './brand';

describe('brand constants', () => {
  it('names the site Chhath Mahaparv Radio', () => {
    expect(BRAND).toBe('Chhath Mahaparv Radio');
    expect(BRAND_HI).toBe('छठ महापर्व रेडियो');
  });

  it('points the creator link at the handle it names', () => {
    expect(CREATOR_URL).toContain(CREATOR_HANDLE);
    expect(new URL(CREATOR_URL).host).toBe('www.instagram.com');
  });
});

describe('DESCRIPTION', () => {
  /*
   * Search results truncate around 160 characters, so a longer description
   * loses its ending. Too short and it wastes the slot.
   */
  it('fits the length a search result will actually render', () => {
    expect(DESCRIPTION.length).toBeGreaterThan(110);
    expect(DESCRIPTION.length).toBeLessThanOrEqual(165);
  });

  it('mentions what the site is about', () => {
    expect(DESCRIPTION).toMatch(/Chhath/);
    expect(DESCRIPTION).toMatch(/arghya/);
  });

  it('is a single paragraph with no stray whitespace', () => {
    expect(DESCRIPTION).not.toMatch(/\n/);
    expect(DESCRIPTION).toBe(DESCRIPTION.trim());
    expect(DESCRIPTION).not.toMatch(/\s{2,}/);
  });
});

describe('documentTitle', () => {
  it('leads with the brand so truncation cannot cut it', () => {
    expect(documentTitle().startsWith(BRAND)).toBe(true);
  });

  /*
   * Titles longer than about 60 characters get cut in results pages. Leading
   * with the brand means a cut still shows who this is.
   */
  it('stays inside the length a search result renders', () => {
    expect(documentTitle().length).toBeLessThanOrEqual(60);
  });
});
