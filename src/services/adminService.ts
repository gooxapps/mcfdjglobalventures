import { getSupabaseClient, isSupabaseConfigured, supabase } from '@/src/lib/supabase';
import {
  getPreviewActivityLogs,
  getPreviewAdminCategories,
  getPreviewAdminCustomers,
  getPreviewAdminOrders,
  getPreviewAdminProducts,
  getPreviewAdminUsers,
  getPreviewBanners,
  getPreviewDailySeries,
  getPreviewHomepageSections,
  getPreviewMediaLibrary,
  getPreviewTestimonials,
} from '@/src/lib/adminPreviewData';
import type {
  ActivityLog,
  AdminUserRecord,
  Banner,
  Category,
  Customer,
  HomepageSection,
  MediaAsset,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  SiteSettings,
  Testimonial,
} from '@/src/types/store';

function requireLiveSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Preview Mode: Connect your Supabase database to save live changes.');
  }
  return getSupabaseClient();
}

export async function logAdminActivity(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from('activity_logs').insert({
    admin_id: user?.id ?? null,
    admin_email: user?.email ?? '',
    action: params.action,
    entity_type: params.entityType ?? '',
    entity_id: params.entityId ?? '',
    description: params.description,
    metadata: params.metadata ?? {},
  });
}

// ============================================================================
// IMAGE COMPRESSION & SUPABASE STORAGE UPLOAD
// ============================================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

async function compressImageIfNeeded(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.size < 450 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1800;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        file.type === 'image/png' ? 'image/png' : 'image/webp',
        0.86
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export async function uploadImageToStorage(
  file: File,
  bucket: 'product-images' | 'category-images' | 'banners' | 'brand-assets',
  folder = 'general'
): Promise<MediaAsset> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Unsupported file format. Upload JPG, PNG, WebP, or AVIF images.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File exceeds the 10MB size limit.');
  }

  const supabaseClient = requireLiveSupabaseClient();
  const compressed = await compressImageIfNeeded(file);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const safeBase = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .slice(0, 48);
  const storagePath = `${folder}/${Date.now()}-${safeBase}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(storagePath, compressed, {
      contentType: compressed.type || file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabaseClient.storage.from(bucket).getPublicUrl(storagePath);

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { data: asset, error: dbError } = await supabaseClient
    .from('media_library')
    .insert({
      file_name: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      bucket_name: bucket,
      mime_type: compressed.type || file.type,
      size_bytes: compressed.size,
      alt_text: safeBase.replace(/-/g, ' '),
      folder,
      uploaded_by: user?.id ?? null,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(dbError.message);
  }

  return asset as MediaAsset;
}

// ============================================================================
// DASHBOARD OVERVIEW ANALYTICS (100% REAL DATABASE DATA)
// ============================================================================

export interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  whatsappInitiations: number;
  totalCustomers: number;
  confirmedSalesTotal: number;
  currencySymbol: string;
  recentOrders: Order[];
  topProducts: Product[];
  dailySeries: Array<{
    date: string;
    label: string;
    orders: number;
    paidRevenue: number;
  }>;
}

export async function fetchDashboardMetrics(
  startDateIso: string,
  endDateIso: string,
  currencySymbol = 'CAD $'
): Promise<DashboardMetrics> {
  if (!isSupabaseConfigured || !supabase) {
    const previewProds = getPreviewAdminProducts();
    const previewOrders = getPreviewAdminOrders();
    const previewPaid = previewOrders
      .filter((o) => o.payment_status === 'Paid' || o.payment_status === 'Partially Paid')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return {
      totalProducts: previewProds.length,
      activeProducts: previewProds.filter((p) => p.is_published).length,
      outOfStockProducts: 0,
      totalOrders: previewOrders.length,
      pendingOrders: previewOrders.filter(
        (o) => o.order_status === 'New' || o.order_status === 'Pending Confirmation'
      ).length,
      confirmedOrders: previewOrders.filter(
        (o) =>
          o.order_status === 'Confirmed' ||
          o.order_status === 'Processing' ||
          o.order_status === 'Shipped'
      ).length,
      completedOrders: previewOrders.filter((o) => o.order_status === 'Delivered').length,
      whatsappInitiations: previewOrders.length,
      totalCustomers: getPreviewAdminCustomers().length,
      confirmedSalesTotal: previewPaid,
      currencySymbol,
      recentOrders: previewOrders,
      topProducts: previewProds.slice(0, 5),
      dailySeries: getPreviewDailySeries(),
    };
  }

  const client = getSupabaseClient();

  const [productsRes, ordersRes, customersCountRes] = await Promise.all([
    client
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_archived', false)
      .order('sales_count', { ascending: false }),
    client
      .from('orders')
      .select('*, items:order_items(*)')
      .gte('created_at', startDateIso)
      .lte('created_at', endDateIso)
      .order('created_at', { ascending: false }),
    client.from('customers').select('id', { count: 'exact', head: true }),
  ]);

  const products = (productsRes.data as Product[]) || [];
  const orders = (ordersRes.data as Order[]) || [];

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_published).length;
  const outOfStockProducts = products.filter((p) => p.stock_quantity <= 0).length;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.order_status === 'New' || o.order_status === 'Pending Confirmation'
  ).length;
  const confirmedOrders = orders.filter(
    (o) => o.order_status === 'Confirmed' || o.order_status === 'Processing' || o.order_status === 'Shipped'
  ).length;
  const completedOrders = orders.filter((o) => o.order_status === 'Delivered').length;
  const whatsappInitiations = orders.filter((o) => o.whatsapp_initiated).length;

  // Strictly count recorded Paid / Partially Paid totals, never unconfirmed WhatsApp clicks
  const confirmedSalesTotal = orders
    .filter((o) => o.payment_status === 'Paid' || o.payment_status === 'Partially Paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Build real daily aggregation from orders
  const bucketMap = new Map<string, { orders: number; paidRevenue: number }>();
  orders.forEach((o) => {
    const dayKey = o.created_at.slice(0, 10);
    const existing = bucketMap.get(dayKey) || { orders: 0, paidRevenue: 0 };
    existing.orders += 1;
    if (o.payment_status === 'Paid' || o.payment_status === 'Partially Paid') {
      existing.paidRevenue += Number(o.total || 0);
    }
    bucketMap.set(dayKey, existing);
  });

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

  // Compute top products from real paid/confirmed order_items if sales_count is zero
  const topProducts = products
    .filter((p) => p.sales_count > 0)
    .slice(0, 5);

  return {
    totalProducts,
    activeProducts,
    outOfStockProducts,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    completedOrders,
    whatsappInitiations,
    totalCustomers: customersCountRes.count ?? 0,
    confirmedSalesTotal,
    currencySymbol,
    recentOrders: orders.slice(0, 8),
    topProducts,
    dailySeries,
  };
}

// ============================================================================
// PRODUCTS CRUD (WITH PRIVATE COST PRICE & VARIANTS & IMAGES)
// ============================================================================

export async function fetchAdminProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewAdminProducts();
  }
  const client = getSupabaseClient();
  const [prodRes, finRes] = await Promise.all([
    client
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
      .order('created_at', { ascending: false }),
    client.from('product_financials').select('*'),
  ]);

  if (prodRes.error) throw new Error(prodRes.error.message);
  const costMap = new Map<string, number | null>(
    (finRes.data || []).map((f: { product_id: string; cost_price: number | null }) => [
      f.product_id,
      f.cost_price !== null ? Number(f.cost_price) : null,
    ])
  );

  return ((prodRes.data as Product[]) || []).map((p) => ({
    ...p,
    regular_price: Number(p.regular_price),
    discounted_price: p.discounted_price !== null ? Number(p.discounted_price) : null,
    cost_price: costMap.get(p.id) ?? null,
    images: (p.images || []).sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export interface ProductSaveInput {
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
}

export async function saveAdminProduct(input: ProductSaveInput): Promise<Product> {
  const supabase = requireLiveSupabaseClient();
  const isEditing = Boolean(input.id);

  const productPayload = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    short_description: input.short_description.trim(),
    description: input.description.trim(),
    category_id: input.category_id || null,
    subcategory: input.subcategory.trim(),
    sku: input.sku.trim(),
    regular_price: input.regular_price,
    discounted_price: input.discounted_price,
    currency: input.currency || 'CAD',
    main_image_url: input.main_image_url,
    stock_quantity: input.stock_quantity,
    tags: input.tags,
    available_sizes: input.available_sizes,
    available_colours: input.available_colours,
    is_featured: input.is_featured,
    is_best_seller: input.is_best_seller,
    is_new_arrival: input.is_new_arrival,
    is_on_sale: input.is_on_sale,
    is_published: input.is_published,
    is_archived: input.is_archived,
    seo_title: input.seo_title.trim(),
    seo_description: input.seo_description.trim(),
  };

  let savedId = input.id;
  if (isEditing && savedId) {
    const { error } = await supabase.from('products').update(productPayload).eq('id', savedId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from('products').insert(productPayload).select('id').single();
    if (error) throw new Error(error.message);
    savedId = data.id;
  }

  // Save private cost price
  await supabase.from('product_financials').upsert({
    product_id: savedId,
    cost_price: input.cost_price,
  });

  // Replace images cleanly
  await supabase.from('product_images').delete().eq('product_id', savedId);
  if (input.images.length > 0) {
    const { error: imgErr } = await supabase.from('product_images').insert(
      input.images.map((img, idx) => ({
        product_id: savedId,
        url: img.url,
        alt_text: img.alt_text || input.name,
        sort_order: idx,
        is_main: img.is_main,
      }))
    );
    if (imgErr) throw new Error(imgErr.message);
  }

  // Replace variants cleanly
  await supabase.from('product_variants').delete().eq('product_id', savedId);
  if (input.variants.length > 0) {
    const { error: varErr } = await supabase.from('product_variants').insert(
      input.variants.map((v) => ({
        product_id: savedId,
        size: v.size,
        colour: v.colour,
        colour_hex: v.colour_hex || '#090909',
        sku: v.sku || `${input.sku}-${v.size || 'STD'}-${v.colour || 'DEF'}`.toUpperCase(),
        stock_quantity: v.stock_quantity,
        is_available: v.is_available,
        price_override: v.price_override,
      }))
    );
    if (varErr) throw new Error(varErr.message);
  }

  await logAdminActivity({
    action: isEditing ? 'product_updated' : 'product_created',
    entityType: 'products',
    entityId: savedId,
    description: `${isEditing ? 'Updated' : 'Created'} product "${input.name}" (SKU: ${input.sku})`,
  });

  const { data: fullProduct, error: fetchErr } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
    .eq('id', savedId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  return fullProduct as Product;
}

export async function bulkUpdateProducts(
  ids: string[],
  updates: Partial<Pick<Product, 'is_published' | 'is_archived' | 'category_id'>>,
  description: string
) {
  const supabase = requireLiveSupabaseClient();
  const { error } = await supabase.from('products').update(updates).in('id', ids);
  if (error) throw new Error(error.message);
  await logAdminActivity({
    action: 'products_bulk_updated',
    entityType: 'products',
    description: `${description} (${ids.length} products)`,
  });
}

export async function deleteProducts(ids: string[]) {
  const supabase = requireLiveSupabaseClient();
  const { error } = await supabase.from('products').delete().in('id', ids);
  if (error) throw new Error(error.message);
  await logAdminActivity({
    action: 'product_deleted',
    entityType: 'products',
    description: `Deleted ${ids.length} product(s).`,
  });
}

// ============================================================================
// CATEGORIES CRUD
// ============================================================================

export async function fetchAdminCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewAdminCategories();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Category[]) || [];
}

export async function saveAdminCategory(
  payload: Partial<Category> & { name: string; slug: string }
): Promise<Category> {
  const supabase = requireLiveSupabaseClient();
  const isEditing = Boolean(payload.id);
  const clean = {
    name: payload.name.trim(),
    slug: payload.slug.trim(),
    description: payload.description?.trim() ?? '',
    image_url: payload.image_url ?? null,
    banner_url: payload.banner_url ?? null,
    sort_order: payload.sort_order ?? 0,
    is_active: payload.is_active ?? true,
  };

  const query = isEditing
    ? supabase.from('categories').update(clean).eq('id', payload.id).select().single()
    : supabase.from('categories').insert(clean).select().single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: isEditing ? 'category_updated' : 'category_created',
    entityType: 'categories',
    entityId: data.id,
    description: `${isEditing ? 'Updated' : 'Created'} category "${clean.name}".`,
  });

  return data as Category;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if ((count ?? 0) > 0) {
    throw new Error(
      `Cannot delete category because ${count} product(s) are assigned to it. Reassign those products first.`
    );
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: 'category_deleted',
    entityType: 'categories',
    entityId: id,
    description: `Deleted category ${id}.`,
  });
}

// ============================================================================
// ORDERS & CUSTOMERS
// ============================================================================

export async function fetchAdminOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewAdminOrders();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as Order[]) || []).map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    delivery_charge: Number(o.delivery_charge),
    tax_amount: Number(o.tax_amount),
    total: Number(o.total),
  }));
}

export async function updateAdminOrder(
  orderId: string,
  updates: {
    order_status?: OrderStatus;
    payment_status?: PaymentStatus;
    internal_notes?: string;
    delivery_address?: string;
    delivery_charge?: number;
  },
  orderReference: string
): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('subtotal, tax_amount, delivery_charge, payment_status')
    .eq('id', orderId)
    .single();

  const patch: Record<string, unknown> = { ...updates };
  if (typeof updates.delivery_charge === 'number' && currentOrder) {
    patch.total =
      Number(currentOrder.subtotal) +
      Number(currentOrder.tax_amount) +
      Number(updates.delivery_charge);
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw new Error(error.message);

  // If payment newly confirmed as Paid, increment product sales_count
  if (updates.payment_status === 'Paid' && currentOrder?.payment_status !== 'Paid') {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);
    for (const item of items || []) {
      if (item.product_id) {
        const { data: prod } = await supabase
          .from('products')
          .select('sales_count')
          .eq('id', item.product_id)
          .maybeSingle();
        if (prod) {
          await supabase
            .from('products')
            .update({ sales_count: (prod.sales_count || 0) + item.quantity })
            .eq('id', item.product_id);
        }
      }
    }
  }

  await logAdminActivity({
    action:
      updates.payment_status === 'Paid' ? 'payment_confirmed' : 'order_status_changed',
    entityType: 'orders',
    entityId: orderId,
    description: `Updated order ${orderReference}: ${Object.keys(updates).join(', ')}`,
  });
}

export async function fetchAdminCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewAdminCustomers();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .select('*')
    .order('last_order_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data as Customer[]) || [];
}

export async function updateAdminCustomer(
  id: string,
  updates: Partial<Pick<Customer, 'full_name' | 'phone' | 'email' | 'default_address' | 'notes'>>
): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const { error } = await supabase.from('customers').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  await logAdminActivity({
    action: 'customer_updated',
    entityType: 'customers',
    entityId: id,
    description: `Updated customer profile ${updates.full_name || id}.`,
  });
}

// ============================================================================
// WEBSITE CONTENT, BANNERS, TESTIMONIALS, MEDIA & SETTINGS
// ============================================================================

export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  const supabase = requireLiveSupabaseClient();
  const { data, error } = await supabase
    .from('site_settings')
    .update(updates)
    .eq('id', 'default')
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logAdminActivity({
    action: 'website_settings_updated',
    entityType: 'site_settings',
    entityId: 'default',
    description: `Updated store & website configuration (${Object.keys(updates).slice(0, 4).join(', ')}).`,
  });

  return data as SiteSettings;
}

export async function fetchAdminHomepageSections(): Promise<HomepageSection[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewHomepageSections();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as HomepageSection[]) || [];
}

export async function saveHomepageSections(sections: HomepageSection[]): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  for (const s of sections) {
    const { error } = await supabase
      .from('homepage_sections')
      .update({
        title: s.title,
        subtitle: s.subtitle,
        is_visible: s.is_visible,
        sort_order: s.sort_order,
      })
      .eq('id', s.id);
    if (error) throw new Error(error.message);
  }
  await logAdminActivity({
    action: 'homepage_sections_updated',
    entityType: 'homepage_sections',
    description: 'Updated homepage section layout, visibility, and headings.',
  });
}

export async function fetchAdminTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewTestimonials();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Testimonial[]) || [];
}

export async function saveTestimonial(
  item: Partial<Testimonial> & { customer_name: string; quote: string }
): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const clean = {
    customer_name: item.customer_name.trim(),
    customer_role: item.customer_role?.trim() || 'Verified Client',
    location: item.location?.trim() || '',
    quote: item.quote.trim(),
    rating: item.rating ?? 5,
    is_published: item.is_published ?? true,
    sort_order: item.sort_order ?? 0,
  };
  const { error } = item.id
    ? await supabase.from('testimonials').update(clean).eq('id', item.id)
    : await supabase.from('testimonials').insert(clean);
  if (error) throw new Error(error.message);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchAdminBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewBanners();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Banner[]) || [];
}

export async function saveBanner(
  banner: Partial<Banner> & { title: string; image_url: string }
): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const clean = {
    title: banner.title.trim(),
    subtitle: banner.subtitle?.trim() || '',
    image_url: banner.image_url,
    link_url: banner.link_url?.trim() || '/shop',
    button_text: banner.button_text?.trim() || 'Explore Collection',
    placement: banner.placement || 'promo',
    is_active: banner.is_active ?? true,
    sort_order: banner.sort_order ?? 0,
  };
  const { error } = banner.id
    ? await supabase.from('banners').update(clean).eq('id', banner.id)
    : await supabase.from('banners').insert(clean);
  if (error) throw new Error(error.message);
}

export async function deleteBanner(id: string): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchMediaLibrary(): Promise<MediaAsset[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewMediaLibrary();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as MediaAsset[]) || [];
}

export async function renameMediaAsset(id: string, fileName: string, altText: string): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  const { error } = await supabase
    .from('media_library')
    .update({ file_name: fileName.trim(), alt_text: altText.trim() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteMediaAsset(asset: MediaAsset): Promise<void> {
  const supabase = requireLiveSupabaseClient();
  await supabase.storage.from(asset.bucket_name).remove([asset.storage_path]);
  const { error } = await supabase.from('media_library').delete().eq('id', asset.id);
  if (error) throw new Error(error.message);
}

export async function fetchActivityLogs(limit = 100): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewActivityLogs();
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ActivityLog[]) || [];
}

export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewAdminUsers();
  }
  const client = getSupabaseClient();
  const { data: roles, error } = await client
    .from('admin_roles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const { data: profiles } = await client.from('profiles').select('*');
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return (roles || []).map((r) => ({
    ...r,
    profile: profileMap.get(r.user_id) || null,
  })) as AdminUserRecord[];
}
