/**
 * The site's identity, in one place.
 *
 * Kept here rather than inline in markup so the name cannot drift between the
 * document title, the entry screen, the structured data and the share previews.
 */

/** Brand name, English. Used for the on-page wordmark. */
export const BRAND = 'Chhath Mahaparv Radio';

/** Brand name, Devanagari. */
export const BRAND_HI = 'छठ महापर्व रेडियो';

/**
 * The name search engines and share cards show.
 *
 * Deliberately not the same as {@link BRAND}. People search "Chhath Puja" far
 * more than "Chhath Mahaparv", so the title and previews lead with the phrase
 * anyone would actually type, while the wordmark on the page keeps the fuller
 * name. Both are carried in the structured data, one as name and the other as
 * alternateName.
 */
export const SEARCH_NAME = 'Chhath Puja Radio';

/** What the site is, in one line. Used as the title's descriptive half. */
export const TAGLINE = 'Chhath geet, rituals and 2026 dates';

/** Tagline, Devanagari. */
export const TAGLINE_HI = 'छठ गीत, विधि और 2026 की तारीख़ें';

/**
 * Meta description. Kept near 155 characters, which is roughly what Google
 * renders before truncating, and written to read as a sentence rather than a
 * keyword list.
 */
export const DESCRIPTION =
  'Chhath Puja Radio plays Chhath geet while a ghat scene moves with the sun. ' +
  'The four days, the prasad, the arghya, and a countdown to Chhath 2026.';

/** The creator's Instagram handle. */
export const CREATOR_HANDLE = 'together_with_suditi';

/** The creator's Instagram profile. */
export const CREATOR_URL = `https://www.instagram.com/${CREATOR_HANDLE}/`;

/** Primary language of the content. */
export const LOCALE = 'hi_IN';

/**
 * Builds the document title.
 *
 * Leads with {@link SEARCH_NAME} so the searchable phrase survives truncation in
 * a crowded results page or a narrow browser tab, then the descriptive half.
 *
 * @returns The full title, name and tagline joined.
 */
export function documentTitle(): string {
  return `${SEARCH_NAME} · ${TAGLINE}`;
}
