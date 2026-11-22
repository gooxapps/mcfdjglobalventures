import { createClient } from '@supabase/supabase-js';
import { getServerEnv, type ApiRequest, type ApiResponse } from './_lib/supabaseAdmin';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const { supabaseUrl, supabaseAnonKey, appUrl } = getServerEnv();
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
    if (supabaseUrl && supabaseAnonKey) {
      const publicClient = createClient(supabaseUrl, supabaseAnonKey);
      const [{ data: products }, { data: categories }] = await Promise.all([
        publicClient
          .from('products')
          .select('slug')
          .eq('is_published', true)
          .eq('is_archived', false)
          .limit(500),
        publicClient.from('categories').select('slug').eq('is_active', true).limit(100),
      ]);
      categories?.forEach((c) =>
        dynamicUrls.push(`/shop?category=${encodeURIComponent(c.slug)}`)
      );
      products?.forEach((p) => dynamicUrls.push(`/product/${encodeURIComponent(p.slug)}`));
    }
  } catch {
    // Graceful fallback to static URLs
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
