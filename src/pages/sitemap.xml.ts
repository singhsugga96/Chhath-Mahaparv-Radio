import type { APIRoute } from 'astro';

/**
 * A one page sitemap.
 *
 * Hand written rather than pulled in from an integration, because the site is a
 * single route and a dependency would earn nothing. Returns 404 when the origin
 * is unknown, since every URL in a sitemap must be absolute.
 */
export const GET: APIRoute = ({ site }) => {
  if (!site) {
    return new Response('Sitemap unavailable: PUBLIC_SITE_URL is not configured.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${new URL('/', site).href}</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
