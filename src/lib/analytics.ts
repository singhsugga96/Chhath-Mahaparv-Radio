/**
 * A GA4 measurement id looks like `G-` followed by an alphanumeric token.
 *
 * Worth validating because a typo here fails silently: the page still builds,
 * gtag still loads, and nothing is ever recorded. Better to break the build.
 */
const MEASUREMENT_ID = /^G-[A-Z0-9]{6,}$/;

/**
 * Whether a string is a plausible GA4 measurement id.
 * @param value Candidate id, e.g. `G-ABC1234567`.
 * @returns True if it matches the GA4 shape.
 */
export function isMeasurementId(value: string): boolean {
  return MEASUREMENT_ID.test(value);
}

/**
 * The site's own property.
 *
 * Committed deliberately. A measurement id is not a secret: it ships in the
 * source of every page that uses it, so keeping it in a private env var buys
 * nothing and costs a silent failure whenever a deploy forgets to set the
 * variable. Anyone forking the project overrides it with `PUBLIC_GA_ID`.
 */
export const DEFAULT_MEASUREMENT_ID = 'G-SNE5SH6CVH';

/**
 * Resolves the measurement id to use.
 *
 * `PUBLIC_GA_ID` wins when set. Otherwise production falls back to
 * {@link DEFAULT_MEASUREMENT_ID}, and development gets nothing at all, so local
 * work never shows up in the reports.
 *
 * @param raw The raw environment value, normally `import.meta.env.PUBLIC_GA_ID`.
 * @param isProduction Whether this is a production build, normally
 *   `import.meta.env.PROD`.
 * @returns The id to load gtag with, or null to render no tracking.
 * @throws If an id is present but malformed, so the mistake surfaces at build
 *   time instead of becoming a site that quietly records nothing.
 */
export function resolveMeasurementId(
  raw: unknown,
  isProduction: boolean,
): string | null {
  const id = typeof raw === 'string' ? raw.trim() : '';

  if (id === '') {
    return isProduction ? DEFAULT_MEASUREMENT_ID : null;
  }

  if (!isMeasurementId(id)) {
    throw new Error(
      `PUBLIC_GA_ID is set to "${id}", which is not a GA4 measurement id. ` +
        'Expected the form G-XXXXXXXXXX.',
    );
  }

  return id;
}
