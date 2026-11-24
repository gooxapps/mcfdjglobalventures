import { getPool, getServerEnv, type ApiRequest, type ApiResponse } from './_lib/db';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const { appUrl } = getServerEnv();
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const baseUrl = (
    appUrl || (host ? `https://${host}` : 'https://mcfdjglobalventures.vercel.app')
  ).replace(/\/+$/, '');

  const staticUrls = [
    '/',
    '/shop',
    '/collections',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/shipping',
  ];
  const dynamicUrls: string[] = [];

  try {
    const pool = getPool();
    if (pool) {
      const [productsRes, categoriesRes] = await Promise.all([
        pool.query<{ slug: string }>(
          `SELECT slug FROM public.products WHERE is_published = true AND is_archived = false LIMIT 500`
        ),
        pool.query<{ slug: string }>(
          `SELECT slug FROM public.categories WHERE is_active = true LIMIT 100`
        ),
      ]);
      categoriesRes.rows.forEach((c) =>
        dynamicUrls.push(`/shop?category=${encodeURIComponent(c.slug)}`)
      );
      productsRes.rows.forEach((p) =>
        dynamicUrls.push(`/product/${encodeURIComponent(p.slug)}`)
      );
    }
  } catch {
    // Graceful fallback to static URLs if DB tables are not initialized yet
  }

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...dynamicUrls]
  .map(
    (route) => `  <url>
    <loc>${escapeXml(`${baseUrl}${route}`)}</loc>
    <changefreq>daily</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  return res.status(200).send(xml);
}
