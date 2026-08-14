/**
 * The site's identity, in one place.
 *
 * Kept here rather than inline in markup so the name cannot drift between the
 * document title, the entry screen, the structured data and the share previews.
 */

/** Brand name, English. */
export const BRAND = 'Chhath Mahaparv Radio';

/** Brand name, Devanagari. */
export const BRAND_HI = 'छठ महापर्व रेडियो';

/** What the site is, in one line. Used as the title's descriptive half. */
export const TAGLINE = 'How Chhath Puja is performed';

/** Tagline, Devanagari. */
export const TAGLINE_HI = 'छठ पूजा कैसे होती है';

/**
 * Meta description. Kept near 155 characters, which is roughly what Google
 * renders before truncating, and written to read as a sentence rather than a
 * keyword list.
 */
export const DESCRIPTION =
  'Chhath geet playing while a ghat scene moves with the sun. The four days, ' +
  'the prasad, the arghya at sunset and sunrise, and a countdown to Chhath 2026.';

/** The creator's Instagram handle. */
export const CREATOR_HANDLE = 'together_with_suditi';

/** The creator's Instagram profile. */
export const CREATOR_URL = `https://www.instagram.com/${CREATOR_HANDLE}/`;

/** Primary language of the content. */
export const LOCALE = 'hi_IN';

/**
 * Builds the document title.
 *
 * Brand first so it is never truncated away in a crowded results page or a
 * browser tab, then the descriptive half.
 *
 * @returns The full title, brand and tagline joined.
 */
export function documentTitle(): string {
  return `${BRAND} · ${TAGLINE}`;
}
