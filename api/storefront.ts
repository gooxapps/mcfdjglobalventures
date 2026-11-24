import { getPool, getQueryParam, parseJsonBody, type ApiRequest, type ApiResponse } from './_lib/db';
import {
  addNewsletterSubscriber,
  createPublicWhatsAppOrder,
  getPublishedProductBySlug,
  getPublishedProducts,
  getStorefrontBootstrap,
} from './_lib/storeQueries';

function resolveStorefrontPath(req: ApiRequest): string {
  const fromQuery = getQueryParam(req, '__path');
  if (fromQuery) return fromQuery.replace(/^\/+|\/+$/g, '');
  const cleanUrl = (req.url || '').split('?')[0];
  return cleanUrl.replace(/^\/api\/storefront\/?/, '').replace(/^\/+|\/+$/g, '');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const subPath = resolveStorefrontPath(req);
  const method = (req.method || 'GET').toUpperCase();
  const pool = getPool();

  if (!pool) {
    return res.status(503).json({
      error: 'DATABASE_URL is not configured.',
      databaseConfigured: false,
    });
  }

  try {
    if (subPath === 'bootstrap' && method === 'GET') {
      const data = await getStorefrontBootstrap();
      return res.status(200).json({ ...data, databaseConnected: true });
    }

    if (subPath === 'products' && method === 'GET') {
      const search = getQueryParam(req, 'search') || undefined;
      const categorySlug = getQueryParam(req, 'category') || undefined;
      const featuredOnly = getQueryParam(req, 'featured') === 'true';
      const newArrivalsOnly = getQueryParam(req, 'newArrivals') === 'true';
      const bestSellersOnly = getQueryParam(req, 'bestSellers') === 'true';
      const onSaleOnly = getQueryParam(req, 'onSale') === 'true';
      const minPriceRaw = getQueryParam(req, 'minPrice');
      const maxPriceRaw = getQueryParam(req, 'maxPrice');
      const sortByRaw = getQueryParam(req, 'sortBy');
      const limitRaw = getQueryParam(req, 'limit');

      const products = await getPublishedProducts({
        search,
        categorySlug,
        featuredOnly,
        newArrivalsOnly,
        bestSellersOnly,
        onSaleOnly,
        minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
        maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
        sortBy: (['newest', 'price_asc', 'price_desc', 'popular'].includes(sortByRaw)
          ? sortByRaw
          : 'newest') as 'newest' | 'price_asc' | 'price_desc' | 'popular',
        limit: limitRaw ? Number(limitRaw) : undefined,
      });

      return res.status(200).json({ products });
    }

    if (subPath.startsWith('products/') && method === 'GET') {
      const slug = decodeURIComponent(subPath.slice('products/'.length));
      const data = await getPublishedProductBySlug(slug);
      if (!data) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      return res.status(200).json(data);
    }

    if (subPath === 'orders' && method === 'POST') {
      const body = parseJsonBody(req);
      const customerName = typeof body.customerName === 'string' ? body.customerName : '';
      const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone : '';
      const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail : '';
      const deliveryAddress =
        typeof body.deliveryAddress === 'string' ? body.deliveryAddress : '';
      const customerNotes = typeof body.customerNotes === 'string' ? body.customerNotes : '';
      const items = Array.isArray(body.items) ? body.items : [];

      const result = await createPublicWhatsAppOrder({
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        customerNotes,
        items: items as Array<{
          productId: string;
          variantId?: string;
          size?: string;
          colour?: string;
          quantity: number;
        }>,
      });
      return res.status(201).json(result);
    }

    if (subPath === 'newsletter' && method === 'POST') {
      const body = parseJsonBody(req);
      const email = typeof body.email === 'string' ? body.email : '';
      await addNewsletterSubscriber(email);
      return res.status(201).json({ subscribed: true });
    }

    return res.status(404).json({ error: 'Storefront API endpoint not found.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storefront request failed.';
    if (message.includes('newsletter_subscribers_email_key') || message.includes('duplicate key')) {
      return res.status(409).json({ error: 'This email address is already subscribed.' });
    }
    return res.status(400).json({ error: message });
  }
}
