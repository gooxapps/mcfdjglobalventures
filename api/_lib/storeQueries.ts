import { dbQuery, getPool, isValidUuid, withTransaction } from './db.js';

export interface ProductFilterParams {
  search?: string;
  categorySlug?: string;
  featuredOnly?: boolean;
  newArrivalsOnly?: boolean;
  bestSellersOnly?: boolean;
  onSaleOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  limit?: number;
}

function normalizeProductRow(row: Record<string, unknown>, includeCostPrice = false) {
  const images = Array.isArray(row.images)
    ? [...row.images].sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) =>
          Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      )
    : [];

  const variants = Array.isArray(row.variants)
    ? row.variants.map((v: Record<string, unknown>) => ({
        ...v,
        stock_quantity: Number(v.stock_quantity ?? 0),
        price_override:
          v.price_override !== null && v.price_override !== undefined
            ? Number(v.price_override)
            : null,
      }))
    : [];

  const base: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    short_description: row.short_description ?? '',
    description: row.description ?? '',
    category_id: row.category_id ?? null,
    category: row.category ?? null,
    subcategory: row.subcategory ?? '',
    sku: row.sku,
    regular_price: Number(row.regular_price ?? 0),
    discounted_price:
      row.discounted_price !== null && row.discounted_price !== undefined
        ? Number(row.discounted_price)
        : null,
    currency: row.currency ?? 'CAD',
    main_image_url: row.main_image_url ?? null,
    stock_quantity: Number(row.stock_quantity ?? 0),
    tags: Array.isArray(row.tags) ? row.tags : [],
    available_sizes: Array.isArray(row.available_sizes) ? row.available_sizes : [],
    available_colours: Array.isArray(row.available_colours) ? row.available_colours : [],
    is_featured: Boolean(row.is_featured),
    is_best_seller: Boolean(row.is_best_seller),
    is_new_arrival: Boolean(row.is_new_arrival),
    is_on_sale: Boolean(row.is_on_sale),
    is_published: Boolean(row.is_published),
    is_archived: Boolean(row.is_archived),
    seo_title: row.seo_title ?? '',
    seo_description: row.seo_description ?? '',
    sales_count: Number(row.sales_count ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    images,
    variants,
  };

  if (includeCostPrice) {
    base.cost_price =
      row.cost_price !== null && row.cost_price !== undefined ? Number(row.cost_price) : null;
  }

  return base;
}

function normalizeSiteSettings(row: Record<string, unknown>) {
  return {
    ...row,
    delivery_charge: Number(row.delivery_charge ?? 0),
    free_delivery_threshold: Number(row.free_delivery_threshold ?? 0),
    minimum_order_value: Number(row.minimum_order_value ?? 0),
    tax_rate: Number(row.tax_rate ?? 0),
  };
}

function normalizeOrderRow(row: Record<string, unknown>): Record<string, any> {
  const items = Array.isArray(row.items)
    ? row.items.map((item: Record<string, unknown>) => ({
        ...item,
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        subtotal: Number(item.subtotal ?? 0),
      }))
    : [];

  return {
    ...row,
    subtotal: Number(row.subtotal ?? 0),
    delivery_charge: Number(row.delivery_charge ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    total: Number(row.total ?? 0),
    items,
  };
}

export async function getStorefrontBootstrap() {
  const [settingsRes, sectionsRes, categoriesRes, bannersRes, testimonialsRes] =
    await Promise.all([
      dbQuery(`SELECT * FROM public.site_settings WHERE id = 'default' LIMIT 1`),
      dbQuery(
        `SELECT * FROM public.homepage_sections WHERE is_visible = true ORDER BY sort_order ASC`
      ),
      dbQuery(
        `SELECT * FROM public.categories WHERE is_active = true ORDER BY sort_order ASC`
      ),
      dbQuery(
        `SELECT * FROM public.banners WHERE is_active = true ORDER BY sort_order ASC`
      ),
      dbQuery(
        `SELECT * FROM public.testimonials WHERE is_published = true ORDER BY sort_order ASC`
      ),
    ]);

  return {
    settings: settingsRes.rows[0] ? normalizeSiteSettings(settingsRes.rows[0]) : null,
    sections: sectionsRes.rows,
    categories: categoriesRes.rows,
    banners: bannersRes.rows,
    testimonials: testimonialsRes.rows,
  };
}

export async function getPublishedProducts(params: ProductFilterParams = {}) {
  const where: string[] = ['p.is_published = true', 'p.is_archived = false'];
  const values: unknown[] = [];

  if (params.categorySlug) {
    values.push(params.categorySlug);
    where.push(`c.slug = $${values.length} AND c.is_active = true`);
  }
  if (params.featuredOnly) where.push('p.is_featured = true');
  if (params.newArrivalsOnly) where.push('p.is_new_arrival = true');
  if (params.bestSellersOnly) where.push('p.is_best_seller = true');
  if (params.onSaleOnly) where.push('p.is_on_sale = true');
  if (params.search && params.search.trim()) {
    values.push(`%${params.search.trim()}%`);
    const idx = values.length;
    where.push(
      `(p.name ILIKE $${idx} OR p.short_description ILIKE $${idx} OR p.description ILIKE $${idx} OR p.sku ILIKE $${idx})`
    );
  }
  if (typeof params.minPrice === 'number' && !Number.isNaN(params.minPrice)) {
    values.push(params.minPrice);
    where.push(`p.regular_price >= $${values.length}`);
  }
  if (typeof params.maxPrice === 'number' && !Number.isNaN(params.maxPrice)) {
    values.push(params.maxPrice);
    where.push(`p.regular_price <= $${values.length}`);
  }

  let orderBy = 'p.created_at DESC';
  if (params.sortBy === 'price_asc') orderBy = 'p.regular_price ASC';
  else if (params.sortBy === 'price_desc') orderBy = 'p.regular_price DESC';
  else if (params.sortBy === 'popular') orderBy = 'p.sales_count DESC, p.created_at DESC';

  let limitClause = '';
  if (typeof params.limit === 'number' && params.limit > 0) {
    values.push(Math.min(params.limit, 200));
    limitClause = `LIMIT $${values.length}`;
  }

  const sql = `
    SELECT
      p.*,
      row_to_json(c.*) AS category,
      COALESCE(
        (SELECT json_agg(pi.* ORDER BY pi.sort_order ASC)
         FROM public.product_images pi WHERE pi.product_id = p.id),
        '[]'::json
      ) AS images,
      COALESCE(
        (SELECT json_agg(pv.* ORDER BY pv.created_at ASC)
         FROM public.product_variants pv WHERE pv.product_id = p.id),
        '[]'::json
      ) AS variants
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}
    ${limitClause}
  `;

  const res = await dbQuery(sql, values);
  return res.rows.map((r) => normalizeProductRow(r, false));
}

export async function getPublishedProductBySlug(slug: string) {
  const sql = `
    SELECT
      p.*,
      row_to_json(c.*) AS category,
      COALESCE(
        (SELECT json_agg(pi.* ORDER BY pi.sort_order ASC)
         FROM public.product_images pi WHERE pi.product_id = p.id),
        '[]'::json
      ) AS images,
      COALESCE(
        (SELECT json_agg(pv.* ORDER BY pv.created_at ASC)
         FROM public.product_variants pv WHERE pv.product_id = p.id),
        '[]'::json
      ) AS variants
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.slug = $1 AND p.is_published = true AND p.is_archived = false
    LIMIT 1
  `;
  const res = await dbQuery(sql, [slug]);
  if (!res.rows[0]) return null;
  const product = normalizeProductRow(res.rows[0], false);

  const relatedRes = await dbQuery(
    `
    SELECT
      p.*,
      row_to_json(c.*) AS category,
      COALESCE(
        (SELECT json_agg(pi.* ORDER BY pi.sort_order ASC)
         FROM public.product_images pi WHERE pi.product_id = p.id),
        '[]'::json
      ) AS images,
      COALESCE(
        (SELECT json_agg(pv.* ORDER BY pv.created_at ASC)
         FROM public.product_variants pv WHERE pv.product_id = p.id),
        '[]'::json
      ) AS variants
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.is_published = true
      AND p.is_archived = false
      AND p.id <> $1
      AND ($2::uuid IS NULL OR p.category_id = $2::uuid)
    ORDER BY p.created_at DESC
    LIMIT 4
    `,
    [product.id, product.category_id]
  );

  return {
    product,
    related: relatedRes.rows.map((r) => normalizeProductRow(r, false)),
  };
}

export async function createPublicWhatsAppOrder(input: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  customerNotes?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    size?: string;
    colour?: string;
    quantity: number;
  }>;
}) {
  const rpcItems = input.items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId || null,
    size: item.size || '',
    colour: item.colour || '',
    quantity: Math.max(1, Number(item.quantity || 1)),
  }));

  const res = await dbQuery<{ result: Record<string, unknown> }>(
    `SELECT public.create_whatsapp_order($1, $2, $3, $4, $5, $6::jsonb) AS result`,
    [
      input.customerName.trim(),
      input.customerPhone.trim(),
      input.customerEmail?.trim() || '',
      input.deliveryAddress.trim(),
      input.customerNotes?.trim() || '',
      JSON.stringify(rpcItems),
    ]
  );
  return res.rows[0]?.result;
}

export async function addNewsletterSubscriber(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  await dbQuery(
    `INSERT INTO public.newsletter_subscribers (email, status) VALUES ($1, 'subscribed')`,
    [cleanEmail]
  );
}

// ============================================================================
// ADMIN QUERIES
// ============================================================================

export async function getAdminDashboardMetrics(startIso: string, endIso: string, currencySymbol = 'CAD $') {
  const [productsRes, ordersRes, customersCountRes] = await Promise.all([
    dbQuery(
      `SELECT p.*, row_to_json(c.*) AS category
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE p.is_archived = false
       ORDER BY p.sales_count DESC`
    ),
    dbQuery(
      `SELECT o.*,
         COALESCE(
           (SELECT json_agg(oi.*) FROM public.order_items oi WHERE oi.order_id = o.id),
           '[]'::json
         ) AS items
       FROM public.orders o
       WHERE o.created_at >= $1::timestamptz AND o.created_at <= $2::timestamptz
       ORDER BY o.created_at DESC`,
      [startIso, endIso]
    ),
    dbQuery<{ cnt: number }>(`SELECT count(*)::int AS cnt FROM public.customers`),
  ]);

  const products = productsRes.rows.map((r) => normalizeProductRow(r, false));
  const orders = ordersRes.rows.map((r) => normalizeOrderRow(r));

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_published).length;
  const outOfStockProducts = products.filter((p) => Number(p.stock_quantity) <= 0).length;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.order_status === 'New' || o.order_status === 'Pending Confirmation'
  ).length;
  const confirmedOrders = orders.filter(
    (o) =>
      o.order_status === 'Confirmed' ||
      o.order_status === 'Processing' ||
      o.order_status === 'Shipped'
  ).length;
  const completedOrders = orders.filter((o) => o.order_status === 'Delivered').length;
  const whatsappInitiations = orders.filter((o) => Boolean(o.whatsapp_initiated)).length;

  const confirmedSalesTotal = orders
    .filter((o) => o.payment_status === 'Paid' || o.payment_status === 'Partially Paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const bucketMap = new Map<string, { orders: number; paidRevenue: number }>();
  for (const o of orders) {
    const createdStr =
      o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at || '');
    const dayKey = createdStr.slice(0, 10);
    if (!dayKey) continue;
    const existing = bucketMap.get(dayKey) || { orders: 0, paidRevenue: 0 };
    existing.orders += 1;
    if (o.payment_status === 'Paid' || o.payment_status === 'Partially Paid') {
      existing.paidRevenue += Number(o.total || 0);
    }
    bucketMap.set(dayKey, existing);
  }

  const dailySeries = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
      }),
      orders: vals.orders,
      paidRevenue: vals.paidRevenue,
    }));

  const topProducts = products.filter((p) => Number(p.sales_count) > 0).slice(0, 5);

  return {
    totalProducts,
    activeProducts,
    outOfStockProducts,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    completedOrders,
    whatsappInitiations,
    totalCustomers: customersCountRes.rows[0]?.cnt ?? 0,
    confirmedSalesTotal,
    currencySymbol,
    recentOrders: orders.slice(0, 8),
    topProducts,
    dailySeries,
  };
}

export async function getAdminPendingOrdersCount(): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  const res = await pool.query<{ cnt: number }>(
    `SELECT count(*)::int AS cnt FROM public.orders WHERE order_status IN ('New', 'Pending Confirmation')`
  );
  return res.rows[0]?.cnt ?? 0;
}

export async function getAdminProducts() {
  const res = await dbQuery(`
    SELECT
      p.*,
      pf.cost_price,
      row_to_json(c.*) AS category,
      COALESCE(
        (SELECT json_agg(pi.* ORDER BY pi.sort_order ASC)
         FROM public.product_images pi WHERE pi.product_id = p.id),
        '[]'::json
      ) AS images,
      COALESCE(
        (SELECT json_agg(pv.* ORDER BY pv.created_at ASC)
         FROM public.product_variants pv WHERE pv.product_id = p.id),
        '[]'::json
      ) AS variants
    FROM public.products p
    LEFT JOIN public.product_financials pf ON pf.product_id = p.id
    LEFT JOIN public.categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
  `);
  return res.rows.map((r) => normalizeProductRow(r, true));
}

export async function saveAdminProduct(input: {
  id?: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string | null;
  subcategory: string;
  sku: string;
  regular_price: number;
  discounted_price: number | null;
  cost_price: number | null;
  currency: string;
  main_image_url: string | null;
  stock_quantity: number;
  tags: string[];
  available_sizes: string[];
  available_colours: Array<{ name: string; hex: string }>;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_on_sale: boolean;
  is_published: boolean;
  is_archived: boolean;
  seo_title: string;
  seo_description: string;
  images: Array<{ url: string; alt_text: string; sort_order: number; is_main: boolean }>;
  variants: Array<{
    size: string;
    colour: string;
    colour_hex: string;
    sku: string;
    stock_quantity: number;
    is_available: boolean;
    price_override: number | null;
  }>;
}) {
  const savedId = await withTransaction(async (client) => {
    let productId = input.id && isValidUuid(input.id) ? input.id : '';

    if (productId) {
      await client.query(
        `UPDATE public.products SET
          name = $1, slug = $2, short_description = $3, description = $4,
          category_id = $5, subcategory = $6, sku = $7, regular_price = $8,
          discounted_price = $9, currency = $10, main_image_url = $11,
          stock_quantity = $12, tags = $13, available_sizes = $14,
          available_colours = $15::jsonb, is_featured = $16, is_best_seller = $17,
          is_new_arrival = $18, is_on_sale = $19, is_published = $20,
          is_archived = $21, seo_title = $22, seo_description = $23
         WHERE id = $24`,
        [
          input.name.trim(),
          input.slug.trim(),
          input.short_description.trim(),
          input.description.trim(),
          input.category_id && isValidUuid(input.category_id) ? input.category_id : null,
          input.subcategory.trim(),
          input.sku.trim(),
          Number(input.regular_price),
          input.discounted_price !== null && input.discounted_price !== undefined
            ? Number(input.discounted_price)
            : null,
          input.currency || 'CAD',
          input.main_image_url || null,
          Number(input.stock_quantity || 0),
          input.tags || [],
          input.available_sizes || [],
          JSON.stringify(input.available_colours || []),
          Boolean(input.is_featured),
          Boolean(input.is_best_seller),
          Boolean(input.is_new_arrival),
          Boolean(input.is_on_sale),
          Boolean(input.is_published),
          Boolean(input.is_archived),
          input.seo_title.trim(),
          input.seo_description.trim(),
          productId,
        ]
      );
    } else {
      const insertRes = await client.query<{ id: string }>(
        `INSERT INTO public.products (
          name, slug, short_description, description, category_id, subcategory, sku,
          regular_price, discounted_price, currency, main_image_url, stock_quantity,
          tags, available_sizes, available_colours, is_featured, is_best_seller,
          is_new_arrival, is_on_sale, is_published, is_archived, seo_title, seo_description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15::jsonb, $16, $17,
          $18, $19, $20, $21, $22, $23
        ) RETURNING id`,
        [
          input.name.trim(),
          input.slug.trim(),
          input.short_description.trim(),
          input.description.trim(),
          input.category_id && isValidUuid(input.category_id) ? input.category_id : null,
          input.subcategory.trim(),
          input.sku.trim(),
          Number(input.regular_price),
          input.discounted_price !== null && input.discounted_price !== undefined
            ? Number(input.discounted_price)
            : null,
          input.currency || 'CAD',
          input.main_image_url || null,
          Number(input.stock_quantity || 0),
          input.tags || [],
          input.available_sizes || [],
          JSON.stringify(input.available_colours || []),
          Boolean(input.is_featured),
          Boolean(input.is_best_seller),
          Boolean(input.is_new_arrival),
          Boolean(input.is_on_sale),
          Boolean(input.is_published),
          Boolean(input.is_archived),
          input.seo_title.trim(),
          input.seo_description.trim(),
        ]
      );
      productId = insertRes.rows[0].id;
    }

    await client.query(
      `INSERT INTO public.product_financials (product_id, cost_price)
       VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE SET cost_price = EXCLUDED.cost_price, updated_at = now()`,
      [
        productId,
        input.cost_price !== null && input.cost_price !== undefined
          ? Number(input.cost_price)
          : null,
      ]
    );

    await client.query(`DELETE FROM public.product_images WHERE product_id = $1`, [productId]);
    for (let idx = 0; idx < (input.images || []).length; idx++) {
      const img = input.images[idx];
      await client.query(
        `INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_main)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, img.url, img.alt_text || input.name, idx, Boolean(img.is_main)]
      );
    }

    await client.query(`DELETE FROM public.product_variants WHERE product_id = $1`, [productId]);
    for (const v of input.variants || []) {
      await client.query(
        `INSERT INTO public.product_variants (
          product_id, size, colour, colour_hex, sku, stock_quantity, is_available, price_override
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          productId,
          v.size || '',
          v.colour || '',
          v.colour_hex || '#090909',
          v.sku || `${input.sku}-${v.size || 'STD'}-${v.colour || 'DEF'}`.toUpperCase(),
          Number(v.stock_quantity || 0),
          Boolean(v.is_available),
          v.price_override !== null && v.price_override !== undefined
            ? Number(v.price_override)
            : null,
        ]
      );
    }

    return productId;
  });

  const res = await dbQuery(
    `SELECT
      p.*,
      pf.cost_price,
      row_to_json(c.*) AS category,
      COALESCE(
        (SELECT json_agg(pi.* ORDER BY pi.sort_order ASC)
         FROM public.product_images pi WHERE pi.product_id = p.id),
        '[]'::json
      ) AS images,
      COALESCE(
        (SELECT json_agg(pv.* ORDER BY pv.created_at ASC)
         FROM public.product_variants pv WHERE pv.product_id = p.id),
        '[]'::json
      ) AS variants
     FROM public.products p
     LEFT JOIN public.product_financials pf ON pf.product_id = p.id
     LEFT JOIN public.categories c ON c.id = p.category_id
     WHERE p.id = $1
     LIMIT 1`,
    [savedId]
  );

  return normalizeProductRow(res.rows[0], true);
}

export async function bulkUpdateAdminProducts(
  ids: string[],
  updates: { is_published?: boolean; is_archived?: boolean; category_id?: string | null }
) {
  const validIds = ids.filter(isValidUuid);
  if (validIds.length === 0) return;

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (typeof updates.is_published === 'boolean') {
    values.push(updates.is_published);
    setClauses.push(`is_published = $${values.length}`);
  }
  if (typeof updates.is_archived === 'boolean') {
    values.push(updates.is_archived);
    setClauses.push(`is_archived = $${values.length}`);
  }
  if (updates.category_id !== undefined) {
    values.push(
      updates.category_id && isValidUuid(updates.category_id) ? updates.category_id : null
    );
    setClauses.push(`category_id = $${values.length}`);
  }

  if (setClauses.length === 0) return;
  values.push(validIds);
  await dbQuery(
    `UPDATE public.products SET ${setClauses.join(', ')} WHERE id = ANY($${values.length}::uuid[])`,
    values
  );
}

export async function deleteAdminProducts(ids: string[]) {
  const validIds = ids.filter(isValidUuid);
  if (validIds.length === 0) return;
  await dbQuery(`DELETE FROM public.products WHERE id = ANY($1::uuid[])`, [validIds]);
}

export async function updateAdminOrder(
  orderId: string,
  updates: {
    order_status?: string;
    payment_status?: string;
    internal_notes?: string;
    delivery_address?: string;
    delivery_charge?: number;
  }
) {
  await withTransaction(async (client) => {
    const currentRes = await client.query<{
      subtotal: string;
      tax_amount: string;
      delivery_charge: string;
      payment_status: string;
    }>(
      `SELECT subtotal, tax_amount, delivery_charge, payment_status FROM public.orders WHERE id = $1 LIMIT 1`,
      [orderId]
    );
    const currentOrder = currentRes.rows[0];
    if (!currentOrder) {
      throw new Error('Order not found.');
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (typeof updates.order_status === 'string') {
      values.push(updates.order_status);
      setClauses.push(`order_status = $${values.length}`);
    }
    if (typeof updates.payment_status === 'string') {
      values.push(updates.payment_status);
      setClauses.push(`payment_status = $${values.length}`);
    }
    if (typeof updates.internal_notes === 'string') {
      values.push(updates.internal_notes);
      setClauses.push(`internal_notes = $${values.length}`);
    }
    if (typeof updates.delivery_address === 'string') {
      values.push(updates.delivery_address);
      setClauses.push(`delivery_address = $${values.length}`);
    }
    if (typeof updates.delivery_charge === 'number') {
      const nextTotal =
        Number(currentOrder.subtotal) +
        Number(currentOrder.tax_amount) +
        Number(updates.delivery_charge);
      values.push(Number(updates.delivery_charge));
      setClauses.push(`delivery_charge = $${values.length}`);
      values.push(nextTotal);
      setClauses.push(`total = $${values.length}`);
    }

    if (setClauses.length > 0) {
      values.push(orderId);
      await client.query(
        `UPDATE public.orders SET ${setClauses.join(', ')} WHERE id = $${values.length}`,
        values
      );
    }

    if (updates.payment_status === 'Paid' && currentOrder.payment_status !== 'Paid') {
      await client.query(
        `UPDATE public.products p
         SET sales_count = p.sales_count + oi.qty
         FROM (
           SELECT product_id, SUM(quantity)::int AS qty
           FROM public.order_items
           WHERE order_id = $1 AND product_id IS NOT NULL
           GROUP BY product_id
         ) oi
         WHERE p.id = oi.product_id`,
        [orderId]
      );
    }
  });
}

export async function updateSiteSettingsAllowed(updates: Record<string, unknown>) {
  const allowedKeys = [
    'business_name',
    'brand_name',
    'tagline',
    'logo_url',
    'favicon_url',
    'business_description',
    'business_email',
    'business_phone',
    'whatsapp_number',
    'whatsapp_country_confirmed',
    'business_address',
    'service_regions',
    'default_currency',
    'currency_symbol',
    'available_currencies',
    'delivery_charge',
    'free_delivery_threshold',
    'minimum_order_value',
    'tax_rate',
    'shipping_info',
    'returns_policy',
    'whatsapp_checkout_message',
    'whatsapp_support_message',
    'whatsapp_checkout_enabled',
    'whatsapp_inquiry_enabled',
    'social_links',
    'seo_title',
    'seo_description',
    'seo_keywords',
    'og_image_url',
    'announcement_text',
    'promo_messages',
    'hero_kicker',
    'hero_headline',
    'hero_subheadline_highlight',
    'hero_description',
    'hero_image_url',
    'hero_script_text',
    'hero_button_text',
    'hero_button_url',
    'hero_secondary_button_text',
    'hero_secondary_button_url',
    'custom_design_title',
    'custom_design_description',
    'custom_design_image_url',
    'custom_design_button_text',
    'process_title',
    'process_steps',
    'aso_oke_banner_title',
    'aso_oke_banner_description',
    'aso_oke_banner_image_url',
    'aso_oke_banner_button_text',
    'souvenir_banner_title',
    'souvenir_banner_description',
    'souvenir_banner_image_url',
    'souvenir_banner_button_text',
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
  ];

  const jsonCols = new Set([
    'available_currencies',
    'social_links',
    'promo_messages',
    'process_steps',
    'about_values',
    'footer_links',
  ]);

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(updates, key) && updates[key] !== undefined) {
      const val = updates[key];
      if (jsonCols.has(key)) {
        values.push(JSON.stringify(val));
        setClauses.push(`${key} = $${values.length}::jsonb`);
      } else {
        values.push(val);
        setClauses.push(`${key} = $${values.length}`);
      }
    }
  }

  if (setClauses.length === 0) {
    const existing = await dbQuery(`SELECT * FROM public.site_settings WHERE id = 'default' LIMIT 1`);
    return normalizeSiteSettings(existing.rows[0]);
  }

  const res = await dbQuery(
    `UPDATE public.site_settings SET ${setClauses.join(', ')} WHERE id = 'default' RETURNING *`,
    values
  );
  return normalizeSiteSettings(res.rows[0]);
}

export async function listAdminOrders() {
  const res = await dbQuery(`
    SELECT o.*,
      COALESCE(
        (SELECT json_agg(oi.*) FROM public.order_items oi WHERE oi.order_id = o.id),
        '[]'::json
      ) AS items
    FROM public.orders o
    ORDER BY o.created_at DESC
  `);
  return res.rows.map((r) => normalizeOrderRow(r));
}

// ============================================================================
// CUSTOM DESIGN REQUESTS & ASO OKE / GROUP ENQUIRIES
// ============================================================================

const ALLOWED_INQUIRY_STATUSES = new Set([
  'New',
  'In Review',
  'Quoted',
  'In Production',
  'Completed',
  'Cancelled',
]);

function normalizeInquiryRow<T extends Record<string, unknown>>(row: T): T & {
  quantity: number;
  quoted_amount: number | null;
  request_reference?: string;
  enquiry_reference?: string;
} {
  return {
    ...row,
    quantity: Number(row.quantity ?? 1),
    quoted_amount:
      row.quoted_amount !== null && row.quoted_amount !== undefined
        ? Number(row.quoted_amount)
        : null,
  };
}

export async function createCustomDesignRequest(input: {
  name: string;
  email?: string;
  whatsapp_number: string;
  customization_type: string;
  reference_image_url?: string;
  description: string;
  quantity: number;
  event_date?: string;
  delivery_location: string;
}) {
  const cleanName = input.name.trim();
  const cleanWhatsapp = input.whatsapp_number.trim();
  const cleanDesc = input.description.trim();
  if (!cleanName || !cleanWhatsapp || !cleanDesc) {
    throw new Error('Name, WhatsApp number, and design description are required.');
  }

  const seqRes = await dbQuery<{ seq: string }>(`SELECT nextval('public.custom_req_seq')::text AS seq`);
  const ref = `#CDR-${seqRes.rows[0]?.seq || Math.floor(1000 + Math.random() * 9000)}`;

  const res = await dbQuery(
    `INSERT INTO public.custom_design_requests (
      request_reference, name, email, whatsapp_number, customization_type,
      reference_image_url, description, quantity, event_date, delivery_location, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'New')
    RETURNING *`,
    [
      ref,
      cleanName,
      (input.email || '').trim(),
      cleanWhatsapp,
      (input.customization_type || 'Custom Outfit').trim(),
      (input.reference_image_url || '').trim(),
      cleanDesc,
      Math.max(1, Number(input.quantity || 1)),
      (input.event_date || '').trim(),
      (input.delivery_location || '').trim(),
    ]
  );

  return normalizeInquiryRow(res.rows[0]);
}

export async function listAdminCustomRequests() {
  const res = await dbQuery(
    `SELECT * FROM public.custom_design_requests ORDER BY created_at DESC`
  );
  return res.rows.map(normalizeInquiryRow);
}

export async function updateAdminCustomRequest(
  id: string,
  updates: {
    status?: string;
    quoted_amount?: number | null;
    internal_notes?: string;
  }
) {
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (typeof updates.status === 'string' && ALLOWED_INQUIRY_STATUSES.has(updates.status)) {
    values.push(updates.status);
    setClauses.push(`status = $${values.length}`);
  }
  if (updates.quoted_amount !== undefined) {
    values.push(
      updates.quoted_amount !== null && !Number.isNaN(Number(updates.quoted_amount))
        ? Number(updates.quoted_amount)
        : null
    );
    setClauses.push(`quoted_amount = $${values.length}`);
  }
  if (typeof updates.internal_notes === 'string') {
    values.push(updates.internal_notes);
    setClauses.push(`internal_notes = $${values.length}`);
  }

  if (setClauses.length === 0) return null;
  values.push(id);
  const res = await dbQuery(
    `UPDATE public.custom_design_requests SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return res.rows[0] ? normalizeInquiryRow(res.rows[0]) : null;
}

export async function deleteAdminCustomRequest(id: string) {
  await dbQuery(`DELETE FROM public.custom_design_requests WHERE id = $1`, [id]);
}

export async function createAsoOkeEnquiry(input: {
  name: string;
  email?: string;
  whatsapp_number: string;
  enquiry_type: string;
  group_size: string;
  quantity: number;
  event_date?: string;
  delivery_location: string;
  reference_image_url?: string;
  notes?: string;
}) {
  const cleanName = input.name.trim();
  const cleanWhatsapp = input.whatsapp_number.trim();
  if (!cleanName || !cleanWhatsapp) {
    throw new Error('Name and WhatsApp number are required.');
  }

  const seqRes = await dbQuery<{ seq: string }>(`SELECT nextval('public.aso_oke_seq')::text AS seq`);
  const ref = `#ASO-${seqRes.rows[0]?.seq || Math.floor(1000 + Math.random() * 9000)}`;

  const res = await dbQuery(
    `INSERT INTO public.aso_oke_enquiries (
      enquiry_reference, name, email, whatsapp_number, enquiry_type,
      group_size, quantity, event_date, delivery_location, reference_image_url, notes, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'New')
    RETURNING *`,
    [
      ref,
      cleanName,
      (input.email || '').trim(),
      cleanWhatsapp,
      (input.enquiry_type || 'Aso Oke Fabrics').trim(),
      (input.group_size || '1-10 Guests').trim(),
      Math.max(1, Number(input.quantity || 1)),
      (input.event_date || '').trim(),
      (input.delivery_location || '').trim(),
      (input.reference_image_url || '').trim(),
      (input.notes || '').trim(),
    ]
  );

  return normalizeInquiryRow(res.rows[0]);
}

export async function listAdminAsoOkeEnquiries() {
  const res = await dbQuery(
    `SELECT * FROM public.aso_oke_enquiries ORDER BY created_at DESC`
  );
  return res.rows.map(normalizeInquiryRow);
}

export async function updateAdminAsoOkeEnquiry(
  id: string,
  updates: {
    status?: string;
    quoted_amount?: number | null;
    internal_notes?: string;
  }
) {
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (typeof updates.status === 'string' && ALLOWED_INQUIRY_STATUSES.has(updates.status)) {
    values.push(updates.status);
    setClauses.push(`status = $${values.length}`);
  }
  if (updates.quoted_amount !== undefined) {
    values.push(
      updates.quoted_amount !== null && !Number.isNaN(Number(updates.quoted_amount))
        ? Number(updates.quoted_amount)
        : null
    );
    setClauses.push(`quoted_amount = $${values.length}`);
  }
  if (typeof updates.internal_notes === 'string') {
    values.push(updates.internal_notes);
    setClauses.push(`internal_notes = $${values.length}`);
  }

  if (setClauses.length === 0) return null;
  values.push(id);
  const res = await dbQuery(
    `UPDATE public.aso_oke_enquiries SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return res.rows[0] ? normalizeInquiryRow(res.rows[0]) : null;
}

export async function deleteAdminAsoOkeEnquiry(id: string) {
  await dbQuery(`DELETE FROM public.aso_oke_enquiries WHERE id = $1`, [id]);
}
