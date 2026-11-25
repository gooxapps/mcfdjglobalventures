import { put } from '@vercel/blob';
import { verifySameOriginForMutation } from './_lib/auth';
import { getPool, getQueryParam, getServerEnv, parseJsonBody, type ApiRequest, type ApiResponse } from './_lib/db';
import {
  addNewsletterSubscriber,
  createAsoOkeEnquiry,
  createCustomDesignRequest,
  createPublicWhatsAppOrder,
  getPublishedProductBySlug,
  getPublishedProducts,
  getStorefrontBootstrap,
} from './_lib/storeQueries';

const PUBLIC_SAMPLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_PUBLIC_UPLOAD_BYTES = 6 * 1024 * 1024; // 6MB

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

    if (subPath === 'upload-sample' && method === 'POST') {
      if (!verifySameOriginForMutation(req)) {
        return res.status(403).json({ error: 'Cross-origin upload rejected.' });
      }
      const { blobToken } = getServerEnv();
      if (!blobToken) {
        return res.status(503).json({
          error: 'BLOB_READ_WRITE_TOKEN is not configured for reference uploads.',
        });
      }

      const body = parseJsonBody(req);
      const fileName =
        typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : 'sample.jpg';
      const mimeType =
        typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : 'image/jpeg';
      const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';

      if (!PUBLIC_SAMPLE_MIME_TYPES.has(mimeType)) {
        return res.status(400).json({ error: 'Unsupported sample format. Upload JPG, PNG, WebP, or AVIF images.' });
      }

      const stripped = dataBase64.replace(/^data:[^;]+;base64,/, '');
      if (!stripped) {
        return res.status(400).json({ error: 'Missing image file payload.' });
      }

      const buffer = Buffer.from(stripped, 'base64');
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_PUBLIC_UPLOAD_BYTES) {
        return res.status(400).json({ error: 'Sample image must be between 1 byte and 6MB.' });
      }

      const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const safeBase =
        fileName
          .replace(/\.[^.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, '-')
          .slice(0, 40) || 'sample';
      const blobPathname = `custom-samples/${Date.now()}-${safeBase}.${ext}`;

      const blobResult = await put(blobPathname, buffer, {
        access: 'public',
        contentType: mimeType,
        token: blobToken,
        addRandomSuffix: true,
      });

      return res.status(201).json({ public_url: blobResult.url, pathname: blobResult.pathname });
    }

    if (subPath === 'custom-design' && method === 'POST') {
      if (!verifySameOriginForMutation(req)) {
        return res.status(403).json({ error: 'Cross-origin request rejected.' });
      }
      const body = parseJsonBody(req);
      const record = await createCustomDesignRequest({
        name: typeof body.name === 'string' ? body.name : '',
        email: typeof body.email === 'string' ? body.email : '',
        whatsapp_number: typeof body.whatsapp_number === 'string' ? body.whatsapp_number : '',
        customization_type:
          typeof body.customization_type === 'string' ? body.customization_type : 'Custom Outfit',
        reference_image_url:
          typeof body.reference_image_url === 'string' ? body.reference_image_url : '',
        description: typeof body.description === 'string' ? body.description : '',
        quantity: Number(body.quantity ?? 1),
        event_date: typeof body.event_date === 'string' ? body.event_date : '',
        delivery_location: typeof body.delivery_location === 'string' ? body.delivery_location : '',
      });
      return res.status(201).json({ request: record });
    }

    if (subPath === 'aso-oke-enquiry' && method === 'POST') {
      if (!verifySameOriginForMutation(req)) {
        return res.status(403).json({ error: 'Cross-origin request rejected.' });
      }
      const body = parseJsonBody(req);
      const record = await createAsoOkeEnquiry({
        name: typeof body.name === 'string' ? body.name : '',
        email: typeof body.email === 'string' ? body.email : '',
        whatsapp_number: typeof body.whatsapp_number === 'string' ? body.whatsapp_number : '',
        enquiry_type:
          typeof body.enquiry_type === 'string' ? body.enquiry_type : 'Aso Oke Fabrics',
        group_size: typeof body.group_size === 'string' ? body.group_size : '1-10 Guests',
        quantity: Number(body.quantity ?? 1),
        event_date: typeof body.event_date === 'string' ? body.event_date : '',
        delivery_location: typeof body.delivery_location === 'string' ? body.delivery_location : '',
        reference_image_url:
          typeof body.reference_image_url === 'string' ? body.reference_image_url : '',
        notes: typeof body.notes === 'string' ? body.notes : '',
      });
      return res.status(201).json({ enquiry: record });
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
