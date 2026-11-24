import { del, put } from '@vercel/blob';
import {
  authenticateAdminRequest,
  hasAdminPermission,
  hashPassword,
  writeActivityLog,
  type AdminRoleType,
} from './_lib/auth';
import {
  dbQuery,
  getPool,
  getQueryParam,
  getServerEnv,
  isValidUuid,
  parseJsonBody,
  withTransaction,
  type ApiRequest,
  type ApiResponse,
} from './_lib/db';
import {
  bulkUpdateAdminProducts,
  deleteAdminProducts,
  getAdminDashboardMetrics,
  getAdminPendingOrdersCount,
  getAdminProducts,
  listAdminOrders,
  saveAdminProduct,
  updateAdminOrder,
  updateSiteSettingsAllowed,
} from './_lib/storeQueries';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
]);
const ALLOWED_BUCKETS = new Set([
  'product-images',
  'category-images',
  'banners',
  'brand-assets',
]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

function resolveAdminPath(req: ApiRequest): string {
  const fromQuery = getQueryParam(req, '__path');
  if (fromQuery) return fromQuery.replace(/^\/+|\/+$/g, '');
  const cleanUrl = (req.url || '').split('?')[0];
  return cleanUrl.replace(/^\/api\/admin\/?/, '').replace(/^\/+|\/+$/g, '');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const subPath = resolveAdminPath(req);
  const method = (req.method || 'GET').toUpperCase();
  const pool = getPool();

  if (!pool) {
    return res.status(503).json({ error: 'DATABASE_URL is not configured on the server.' });
  }

  try {
    // Base authentication for all /api/admin/* endpoints
    const baseAuth = await authenticateAdminRequest(req);
    if (!baseAuth.ok) {
      return res.status(baseAuth.status).json({ error: baseAuth.error });
    }
    const { caller } = baseAuth;

    // 1. Dashboard & Pending Orders Count
    if (subPath === 'pending-count' && method === 'GET') {
      const count = await getAdminPendingOrdersCount();
      return res.status(200).json({ count });
    }

    if (subPath === 'dashboard' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'view_dashboard')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const start =
        getQueryParam(req, 'start') || new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      const end = getQueryParam(req, 'end') || new Date().toISOString();
      const currencySymbol = getQueryParam(req, 'currencySymbol') || 'CAD $';
      const metrics = await getAdminDashboardMetrics(start, end, currencySymbol);
      return res.status(200).json(metrics);
    }

    // 2. Vercel Blob Upload & Media Library
    if (subPath === 'upload' && method === 'POST') {
      const canUpload =
        hasAdminPermission(caller.role, 'manage_media') ||
        hasAdminPermission(caller.role, 'manage_products') ||
        hasAdminPermission(caller.role, 'manage_categories') ||
        hasAdminPermission(caller.role, 'manage_content') ||
        hasAdminPermission(caller.role, 'manage_settings');

      if (!canUpload) {
        return res.status(403).json({ error: 'Permission denied for media upload.' });
      }

      const { blobToken } = getServerEnv();
      if (!blobToken) {
        return res.status(503).json({
          error:
            'BLOB_READ_WRITE_TOKEN is not configured on the server. Add your Vercel Blob token in environment variables.',
        });
      }

      const body = parseJsonBody(req);
      const fileName =
        typeof body.fileName === 'string' && body.fileName.trim()
          ? body.fileName.trim()
          : 'upload.webp';
      const mimeType =
        typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : 'image/webp';
      const rawBucket = typeof body.bucket === 'string' ? body.bucket.trim() : 'product-images';
      const bucket = ALLOWED_BUCKETS.has(rawBucket) ? rawBucket : 'product-images';
      const rawFolder = typeof body.folder === 'string' ? body.folder.trim() : 'general';
      const folder =
        rawFolder.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 40) || 'general';
      const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';

      if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        return res
          .status(400)
          .json({ error: 'Unsupported file format. Upload JPG, PNG, WebP, AVIF, or SVG images.' });
      }

      const stripped = dataBase64.replace(/^data:[^;]+;base64,/, '');
      if (!stripped) {
        return res.status(400).json({ error: 'Missing image file payload.' });
      }

      const buffer = Buffer.from(stripped, 'base64');
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_UPLOAD_BYTES) {
        return res.status(400).json({ error: 'Image must be between 1 byte and 10MB.' });
      }

      const ext =
        fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'webp';
      const safeBase =
        fileName
          .replace(/\.[^.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9-_]/g, '-')
          .slice(0, 48) || 'asset';
      const blobPathname = `${bucket}/${folder}/${Date.now()}-${safeBase}.${ext}`;

      const blobResult = await put(blobPathname, buffer, {
        access: 'public',
        contentType: mimeType,
        token: blobToken,
        addRandomSuffix: true,
      });

      const inserted = await dbQuery(
        `INSERT INTO public.media_library (
          file_name, storage_path, public_url, bucket_name, mime_type, size_bytes, alt_text, folder, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          fileName,
          blobResult.pathname,
          blobResult.url,
          bucket,
          mimeType,
          buffer.byteLength,
          safeBase.replace(/-/g, ' '),
          folder,
          caller.id,
        ]
      );

      const asset = inserted.rows[0];
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'media_uploaded',
        entityType: 'media_library',
        entityId: String(asset.id),
        description: `Uploaded ${fileName} to Vercel Blob (${bucket}).`,
      });

      return res.status(201).json({
        ...asset,
        size_bytes: Number(asset.size_bytes ?? 0),
      });
    }

    if (subPath === 'media' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'manage_media')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const resDb = await dbQuery(
        `SELECT * FROM public.media_library ORDER BY created_at DESC`
      );
      return res.status(200).json({
        assets: resDb.rows.map((a) => ({
          ...a,
          size_bytes: Number(a.size_bytes ?? 0),
        })),
      });
    }

    if (subPath.startsWith('media/')) {
      if (!hasAdminPermission(caller.role, 'manage_media')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const mediaId = subPath.slice('media/'.length);
      if (!isValidUuid(mediaId)) {
        return res.status(400).json({ error: 'Invalid media asset ID.' });
      }

      if (method === 'PATCH') {
        const body = parseJsonBody(req);
        const fileName =
          typeof body.file_name === 'string' ? body.file_name.trim() : '';
        const altText =
          typeof body.alt_text === 'string' ? body.alt_text.trim() : '';
        if (!fileName) {
          return res.status(400).json({ error: 'File name is required.' });
        }
        await dbQuery(
          `UPDATE public.media_library SET file_name = $1, alt_text = $2 WHERE id = $3`,
          [fileName, altText, mediaId]
        );
        return res.status(200).json({ updated: true });
      }

      if (method === 'DELETE') {
        const existing = await dbQuery<{ public_url: string }>(
          `SELECT public_url FROM public.media_library WHERE id = $1 LIMIT 1`,
          [mediaId]
        );
        const publicUrl = existing.rows[0]?.public_url;
        const { blobToken } = getServerEnv();
        if (publicUrl && blobToken && publicUrl.startsWith('https://')) {
          try {
            await del(publicUrl, { token: blobToken });
          } catch {
            // Continue DB cleanup if remote blob already removed
          }
        }
        await dbQuery(`DELETE FROM public.media_library WHERE id = $1`, [mediaId]);
        return res.status(200).json({ deleted: true });
      }
    }

    // 3. Products CRUD & Bulk
    if (subPath === 'products' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'manage_products')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const products = await getAdminProducts();
      return res.status(200).json({ products });
    }

    if (subPath === 'products' && method === 'POST') {
      if (!hasAdminPermission(caller.role, 'manage_products')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const body = parseJsonBody(req);
      const saved = await saveAdminProduct(body as Parameters<typeof saveAdminProduct>[0]);
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: body.id ? 'product_updated' : 'product_created',
        entityType: 'products',
        entityId: String(saved.id),
        description: `${body.id ? 'Updated' : 'Created'} product "${String(saved.name)}" (SKU: ${String(saved.sku)})`,
      });
      return res.status(200).json({ product: saved });
    }

    if (subPath === 'products/bulk' && method === 'POST') {
      if (!hasAdminPermission(caller.role, 'manage_products')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const body = parseJsonBody(req);
      const ids = Array.isArray(body.ids) ? (body.ids as string[]) : [];
      const actionType = body.action === 'delete' ? 'delete' : 'update';
      if (actionType === 'delete') {
        await deleteAdminProducts(ids);
        await writeActivityLog({
          adminId: caller.id,
          adminEmail: caller.email,
          action: 'product_deleted',
          entityType: 'products',
          description: `Deleted ${ids.length} product(s).`,
        });
      } else {
        const updates = (body.updates || {}) as {
          is_published?: boolean;
          is_archived?: boolean;
          category_id?: string | null;
        };
        const description =
          typeof body.description === 'string' ? body.description : 'Bulk updated products';
        await bulkUpdateAdminProducts(ids, updates);
        await writeActivityLog({
          adminId: caller.id,
          adminEmail: caller.email,
          action: 'products_bulk_updated',
          entityType: 'products',
          description: `${description} (${ids.length} products)`,
        });
      }
      return res.status(200).json({ ok: true });
    }

    // 4. Categories CRUD
    if (subPath === 'categories' && method === 'GET') {
      if (
        !hasAdminPermission(caller.role, 'manage_categories') &&
        !hasAdminPermission(caller.role, 'manage_products')
      ) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const resDb = await dbQuery(
        `SELECT * FROM public.categories ORDER BY sort_order ASC`
      );
      return res.status(200).json({ categories: resDb.rows });
    }

    if (subPath === 'categories' && method === 'POST') {
      if (!hasAdminPermission(caller.role, 'manage_categories')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const body = parseJsonBody(req);
      const id = typeof body.id === 'string' && isValidUuid(body.id) ? body.id : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
      if (!name || !slug) {
        return res.status(400).json({ error: 'Category name and slug are required.' });
      }
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const imageUrl = typeof body.image_url === 'string' && body.image_url ? body.image_url : null;
      const bannerUrl =
        typeof body.banner_url === 'string' && body.banner_url ? body.banner_url : null;
      const sortOrder = Number(body.sort_order ?? 0);
      const isActive = body.is_active !== false;

      const saved = id
        ? await dbQuery(
            `UPDATE public.categories
             SET name = $1, slug = $2, description = $3, image_url = $4, banner_url = $5, sort_order = $6, is_active = $7
             WHERE id = $8 RETURNING *`,
            [name, slug, description, imageUrl, bannerUrl, sortOrder, isActive, id]
          )
        : await dbQuery(
            `INSERT INTO public.categories (name, slug, description, image_url, banner_url, sort_order, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, slug, description, imageUrl, bannerUrl, sortOrder, isActive]
          );

      const category = saved.rows[0];
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: id ? 'category_updated' : 'category_created',
        entityType: 'categories',
        entityId: String(category.id),
        description: `${id ? 'Updated' : 'Created'} category "${name}".`,
      });
      return res.status(200).json({ category });
    }

    if (subPath.startsWith('categories/') && method === 'DELETE') {
      if (!hasAdminPermission(caller.role, 'manage_categories')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const catId = subPath.slice('categories/'.length);
      if (!isValidUuid(catId)) {
        return res.status(400).json({ error: 'Invalid category ID.' });
      }
      const countRes = await dbQuery<{ cnt: number }>(
        `SELECT count(*)::int AS cnt FROM public.products WHERE category_id = $1`,
        [catId]
      );
      const assigned = countRes.rows[0]?.cnt ?? 0;
      if (assigned > 0) {
        return res.status(400).json({
          error: `Cannot delete category because ${assigned} product(s) are assigned to it. Reassign those products first.`,
        });
      }
      await dbQuery(`DELETE FROM public.categories WHERE id = $1`, [catId]);
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'category_deleted',
        entityType: 'categories',
        entityId: catId,
        description: `Deleted category ${catId}.`,
      });
      return res.status(200).json({ deleted: true });
    }

    // 5. Orders & Customers
    if (subPath === 'orders' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'manage_orders')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const orders = await listAdminOrders();
      return res.status(200).json({ orders });
    }

    if (subPath.startsWith('orders/') && method === 'PATCH') {
      if (!hasAdminPermission(caller.role, 'manage_orders')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const orderId = subPath.slice('orders/'.length);
      if (!isValidUuid(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID.' });
      }
      const body = parseJsonBody(req);
      const updates = (body.updates || body) as {
        order_status?: string;
        payment_status?: string;
        internal_notes?: string;
        delivery_address?: string;
        delivery_charge?: number;
      };
      const orderReference =
        typeof body.orderReference === 'string' ? body.orderReference : orderId;
      await updateAdminOrder(orderId, updates);
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action:
          updates.payment_status === 'Paid' ? 'payment_confirmed' : 'order_status_changed',
        entityType: 'orders',
        entityId: orderId,
        description: `Updated order ${orderReference}: ${Object.keys(updates).join(', ')}`,
      });
      return res.status(200).json({ updated: true });
    }

    if (subPath === 'customers' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'manage_customers')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const resDb = await dbQuery(
        `SELECT * FROM public.customers ORDER BY last_order_at DESC NULLS LAST`
      );
      return res.status(200).json({ customers: resDb.rows });
    }

    if (subPath.startsWith('customers/') && method === 'PATCH') {
      if (!hasAdminPermission(caller.role, 'manage_customers')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const customerId = subPath.slice('customers/'.length);
      if (!isValidUuid(customerId)) {
        return res.status(400).json({ error: 'Invalid customer ID.' });
      }
      const body = parseJsonBody(req);
      const allowed = ['full_name', 'phone', 'email', 'default_address', 'notes'];
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const key of allowed) {
        if (typeof body[key] === 'string') {
          vals.push(body[key]);
          sets.push(`${key} = $${vals.length}`);
        }
      }
      if (sets.length > 0) {
        vals.push(customerId);
        await dbQuery(
          `UPDATE public.customers SET ${sets.join(', ')} WHERE id = $${vals.length}`,
          vals
        );
      }
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'customer_updated',
        entityType: 'customers',
        entityId: customerId,
        description: `Updated customer profile ${typeof body.full_name === 'string' ? body.full_name : customerId}.`,
      });
      return res.status(200).json({ updated: true });
    }

    // 6. Site Settings & Content
    if (subPath === 'settings' && method === 'PATCH') {
      const canEditSettings = hasAdminPermission(caller.role, 'manage_settings');
      const canEditContent = hasAdminPermission(caller.role, 'manage_content');
      if (!canEditSettings && !canEditContent) {
        return res.status(403).json({ error: 'Permission denied.' });
      }

      const rawBody = parseJsonBody(req);
      let safeUpdates = rawBody;

      if (!canEditSettings) {
        // content_manager may only edit storefront copy/hero/about/footer/seo fields
        const contentAllowed = new Set([
          'announcement_text',
          'promo_messages',
          'hero_headline',
          'hero_subheadline_highlight',
          'hero_description',
          'hero_image_url',
          'hero_button_text',
          'hero_button_url',
          'about_intro',
          'about_mission',
          'about_vision',
          'about_values',
          'about_image_url',
          'footer_description',
          'footer_links',
          'copyright_text',
          'privacy_policy',
          'terms_conditions',
          'seo_title',
          'seo_description',
          'seo_keywords',
          'og_image_url',
        ]);
        safeUpdates = Object.fromEntries(
          Object.entries(rawBody).filter(([k]) => contentAllowed.has(k))
        );
      }

      const settings = await updateSiteSettingsAllowed(safeUpdates);
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'website_settings_updated',
        entityType: 'site_settings',
        entityId: 'default',
        description: `Updated store & website configuration (${Object.keys(safeUpdates).slice(0, 4).join(', ')}).`,
      });
      return res.status(200).json({ settings });
    }

    if (subPath === 'sections' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'manage_content')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const resDb = await dbQuery(
        `SELECT * FROM public.homepage_sections ORDER BY sort_order ASC`
      );
      return res.status(200).json({ sections: resDb.rows });
    }

    if (subPath === 'sections' && method === 'PATCH') {
      if (!hasAdminPermission(caller.role, 'manage_content')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const body = parseJsonBody(req);
      const sections = Array.isArray(body.sections) ? body.sections : [];
      await withTransaction(async (client) => {
        for (const s of sections as Array<Record<string, unknown>>) {
          if (typeof s.id === 'string' && isValidUuid(s.id)) {
            await client.query(
              `UPDATE public.homepage_sections
               SET title = $1, subtitle = $2, is_visible = $3, sort_order = $4
               WHERE id = $5`,
              [
                String(s.title ?? ''),
                String(s.subtitle ?? ''),
                Boolean(s.is_visible),
                Number(s.sort_order ?? 0),
                s.id,
              ]
            );
          }
        }
      });
      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'homepage_sections_updated',
        entityType: 'homepage_sections',
        description: 'Updated homepage section layout, visibility, and headings.',
      });
      return res.status(200).json({ updated: true });
    }

    if (subPath === 'testimonials' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'manage_content')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const resDb = await dbQuery(
        `SELECT * FROM public.testimonials ORDER BY sort_order ASC`
      );
      return res.status(200).json({ testimonials: resDb.rows });
    }

    if (subPath === 'testimonials' && method === 'POST') {
      if (!hasAdminPermission(caller.role, 'manage_content')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const body = parseJsonBody(req);
      const id = typeof body.id === 'string' && isValidUuid(body.id) ? body.id : '';
      const customerName =
        typeof body.customer_name === 'string' ? body.customer_name.trim() : '';
      const quote = typeof body.quote === 'string' ? body.quote.trim() : '';
      if (!customerName || !quote) {
        return res.status(400).json({ error: 'Customer name and quote are required.' });
      }
      const role =
        typeof body.customer_role === 'string' && body.customer_role.trim()
          ? body.customer_role.trim()
          : 'Verified Client';
      const location = typeof body.location === 'string' ? body.location.trim() : '';
      const rating = Math.min(5, Math.max(1, Number(body.rating ?? 5)));
      const isPublished = body.is_published !== false;
      const sortOrder = Number(body.sort_order ?? 0);

      if (id) {
        await dbQuery(
          `UPDATE public.testimonials
           SET customer_name = $1, customer_role = $2, location = $3, quote = $4, rating = $5, is_published = $6, sort_order = $7
           WHERE id = $8`,
          [customerName, role, location, quote, rating, isPublished, sortOrder, id]
        );
      } else {
        await dbQuery(
          `INSERT INTO public.testimonials (customer_name, customer_role, location, quote, rating, is_published, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [customerName, role, location, quote, rating, isPublished, sortOrder]
        );
      }
      return res.status(200).json({ ok: true });
    }

    if (subPath.startsWith('testimonials/') && method === 'DELETE') {
      if (!hasAdminPermission(caller.role, 'manage_content')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const tId = subPath.slice('testimonials/'.length);
      if (!isValidUuid(tId)) return res.status(400).json({ error: 'Invalid ID.' });
      await dbQuery(`DELETE FROM public.testimonials WHERE id = $1`, [tId]);
      return res.status(200).json({ deleted: true });
    }

    if (subPath === 'banners' && method === 'GET') {
      if (
        !hasAdminPermission(caller.role, 'manage_media') &&
        !hasAdminPermission(caller.role, 'manage_content')
      ) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const resDb = await dbQuery(`SELECT * FROM public.banners ORDER BY sort_order ASC`);
      return res.status(200).json({ banners: resDb.rows });
    }

    if (subPath === 'banners' && method === 'POST') {
      if (
        !hasAdminPermission(caller.role, 'manage_media') &&
        !hasAdminPermission(caller.role, 'manage_content')
      ) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const body = parseJsonBody(req);
      const id = typeof body.id === 'string' && isValidUuid(body.id) ? body.id : '';
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
      if (!title || !imageUrl) {
        return res.status(400).json({ error: 'Banner title and image URL are required.' });
      }
      const subtitle = typeof body.subtitle === 'string' ? body.subtitle.trim() : '';
      const linkUrl =
        typeof body.link_url === 'string' && body.link_url.trim() ? body.link_url.trim() : '/shop';
      const buttonText =
        typeof body.button_text === 'string' && body.button_text.trim()
          ? body.button_text.trim()
          : 'Explore Collection';
      const placement = ['hero', 'promo', 'category', 'collection'].includes(
        String(body.placement)
      )
        ? String(body.placement)
        : 'promo';
      const isActive = body.is_active !== false;
      const sortOrder = Number(body.sort_order ?? 0);

      if (id) {
        await dbQuery(
          `UPDATE public.banners
           SET title = $1, subtitle = $2, image_url = $3, link_url = $4, button_text = $5, placement = $6, is_active = $7, sort_order = $8
           WHERE id = $9`,
          [title, subtitle, imageUrl, linkUrl, buttonText, placement, isActive, sortOrder, id]
        );
      } else {
        await dbQuery(
          `INSERT INTO public.banners (title, subtitle, image_url, link_url, button_text, placement, is_active, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [title, subtitle, imageUrl, linkUrl, buttonText, placement, isActive, sortOrder]
        );
      }
      return res.status(200).json({ ok: true });
    }

    if (subPath.startsWith('banners/') && method === 'DELETE') {
      if (
        !hasAdminPermission(caller.role, 'manage_media') &&
        !hasAdminPermission(caller.role, 'manage_content')
      ) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const bId = subPath.slice('banners/'.length);
      if (!isValidUuid(bId)) return res.status(400).json({ error: 'Invalid banner ID.' });
      await dbQuery(`DELETE FROM public.banners WHERE id = $1`, [bId]);
      return res.status(200).json({ deleted: true });
    }

    // 7. Admin Users & Activity Logs
    if (subPath === 'logs' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'view_activity_logs')) {
        return res.status(403).json({ error: 'Permission denied.' });
      }
      const limitRaw = Number(getQueryParam(req, 'limit') || 100);
      const limit = Math.min(Math.max(1, limitRaw), 300);
      const resDb = await dbQuery(
        `SELECT * FROM public.activity_logs ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
      return res.status(200).json({ logs: resDb.rows });
    }

    if (subPath === 'users' && method === 'GET') {
      if (!hasAdminPermission(caller.role, 'manage_admins')) {
        return res.status(403).json({ error: 'Super Administrator privileges required.' });
      }
      const resDb = await dbQuery(
        `SELECT ar.id, ar.user_id, ar.role, ar.is_active, ar.created_at,
                json_build_object(
                  'email', p.email,
                  'full_name', p.full_name,
                  'avatar_url', p.avatar_url,
                  'phone', p.phone
                ) AS profile
         FROM public.admin_roles ar
         INNER JOIN public.profiles p ON p.id = ar.user_id
         ORDER BY ar.created_at DESC`
      );
      return res.status(200).json({ users: resDb.rows });
    }

    if (subPath === 'users' && method === 'POST') {
      if (!hasAdminPermission(caller.role, 'manage_admins')) {
        return res.status(403).json({ error: 'Super Administrator privileges required.' });
      }
      const body = parseJsonBody(req);
      const { email, password, fullName, role } = body;

      if (
        typeof email !== 'string' ||
        !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ||
        typeof password !== 'string' ||
        password.length < 10
      ) {
        return res
          .status(400)
          .json({ error: 'Valid email and password (min 10 chars) are required.' });
      }
      if (
        typeof role !== 'string' ||
        !['super_admin', 'store_manager', 'content_manager'].includes(role)
      ) {
        return res.status(400).json({ error: 'Invalid administrator role selected.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName =
        typeof fullName === 'string' && fullName.trim() ? fullName.trim() : cleanEmail;
      const passwordHash = await hashPassword(password);

      const newUserId = await withTransaction(async (client) => {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM public.profiles WHERE email = $1 LIMIT 1`,
          [cleanEmail]
        );
        if (existing.rows[0]) {
          throw new Error('An administrator account with this email already exists.');
        }

        const prof = await client.query<{ id: string }>(
          `INSERT INTO public.profiles (email, password_hash, full_name)
           VALUES ($1, $2, $3) RETURNING id`,
          [cleanEmail, passwordHash, cleanName]
        );
        const uid = prof.rows[0].id;
        await client.query(
          `INSERT INTO public.admin_roles (user_id, role, is_active, created_by)
           VALUES ($1, $2, true, $3)`,
          [uid, role as AdminRoleType, caller.id]
        );
        return uid;
      });

      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'admin_created',
        entityType: 'admin_roles',
        entityId: newUserId,
        description: `Created administrator ${cleanEmail} with role ${role}.`,
      });

      return res.status(201).json({ id: newUserId, email: cleanEmail, role });
    }

    if (subPath.startsWith('users/') && method === 'PATCH') {
      if (!hasAdminPermission(caller.role, 'manage_admins')) {
        return res.status(403).json({ error: 'Super Administrator privileges required.' });
      }
      const targetUserId = subPath.slice('users/'.length);
      if (!isValidUuid(targetUserId)) {
        return res.status(400).json({ error: 'Invalid administrator user ID.' });
      }

      const body = parseJsonBody(req);
      const { role, is_active } = body;

      if (targetUserId === caller.id && is_active === false) {
        return res
          .status(400)
          .json({ error: 'You cannot deactivate your own active session.' });
      }

      const setClauses: string[] = [];
      const vals: unknown[] = [];

      if (
        typeof role === 'string' &&
        ['super_admin', 'store_manager', 'content_manager'].includes(role)
      ) {
        vals.push(role);
        setClauses.push(`role = $${vals.length}`);
      }
      if (typeof is_active === 'boolean') {
        vals.push(is_active);
        setClauses.push(`is_active = $${vals.length}`);
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No valid administrator updates provided.' });
      }

      vals.push(targetUserId);
      await dbQuery(
        `UPDATE public.admin_roles SET ${setClauses.join(', ')} WHERE user_id = $${vals.length}`,
        vals
      );

      await writeActivityLog({
        adminId: caller.id,
        adminEmail: caller.email,
        action: 'admin_updated',
        entityType: 'admin_roles',
        entityId: targetUserId,
        description: `Updated administrator ${targetUserId} permissions.`,
      });

      return res.status(200).json({ updated: true });
    }

    return res.status(404).json({ error: 'Admin endpoint not found.' });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Admin request failed.',
    });
  }
}
