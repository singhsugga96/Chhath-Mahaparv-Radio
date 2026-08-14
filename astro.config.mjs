import { defineConfig } from 'astro/config';

/*
 * The public origin, used for canonical links, share previews and the sitemap,
 * all of which have to be absolute.
 *
 * Defaulted rather than left to an env var for the same reason as the analytics
 * id: the origin is public, and a build that forgets to set it produces a site
 * with no canonical and no share preview, which is a silent failure. Override
 * with PUBLIC_SITE_URL when deploying somewhere else.
 */
const site = process.env.PUBLIC_SITE_URL || 'https://chhath-mahaparv-2026.web.app';

export default defineConfig({
  output: 'static',
  site,
});
