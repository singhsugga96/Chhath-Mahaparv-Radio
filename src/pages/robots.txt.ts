import type { APIRoute } from 'astro';

/**
 * robots.txt, generated so the sitemap line can be absolute.
 *
 * The sitemap reference is only included when the site origin is known, since
 * the spec requires an absolute URL there and a relative one would be ignored.
 */
export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /'];

  if (site) {
    lines.push('', `Sitemap: ${new URL('/sitemap.xml', site).href}`);
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
