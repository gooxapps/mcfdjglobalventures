import {
  ensureSupabaseInitialized,
  isSupabaseConfigured,
  supabase,
} from '@/src/lib/supabase';
import {
  DEFAULT_CATEGORIES_FALLBACK,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_SITE_SETTINGS,
} from '@/src/lib/defaults';
import { getPreviewAdminProducts } from '@/src/lib/adminPreviewData';
import type {
  Banner,
  Category,
  HomepageSection,
  Product,
  SiteSettings,
  Testimonial,
} from '@/src/types/store';

export interface StorefrontBootstrapData {
  settings: SiteSettings;
  sections: HomepageSection[];
  categories: Category[];
  banners: Banner[];
  testimonials: Testimonial[];
  supabaseConnected: boolean;
}

export async function fetchStorefrontBootstrap(): Promise<StorefrontBootstrapData> {
  await ensureSupabaseInitialized();
  if (!isSupabaseConfigured || !supabase) {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      sections: DEFAULT_HOMEPAGE_SECTIONS,
      categories: DEFAULT_CATEGORIES_FALLBACK,
      banners: [],
      testimonials: [],
      supabaseConnected: false,
    };
  }

  try {
    const [settingsRes, sectionsRes, categoriesRes, bannersRes, testimonialsRes] =
      await Promise.all([
        supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle(),
        supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('testimonials')
          .select('*')
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),
      ]);

    const settings: SiteSettings = settingsRes.data
      ? {
          ...DEFAULT_SITE_SETTINGS,
          ...settingsRes.data,
          hero_image_url:
            settingsRes.data.hero_image_url || DEFAULT_SITE_SETTINGS.hero_image_url,
          about_image_url:
            settingsRes.data.about_image_url || DEFAULT_SITE_SETTINGS.about_image_url,
        }
      : DEFAULT_SITE_SETTINGS;

    return {
      settings,
      sections:
        sectionsRes.data && sectionsRes.data.length > 0
          ? (sectionsRes.data as HomepageSection[])
          : DEFAULT_HOMEPAGE_SECTIONS,
      categories:
        categoriesRes.data && categoriesRes.data.length > 0
          ? (categoriesRes.data as Category[])
          : DEFAULT_CATEGORIES_FALLBACK,
      banners: (bannersRes.data as Banner[]) || [],
      testimonials: (testimonialsRes.data as Testimonial[]) || [],
      supabaseConnected: true,
    };
  } catch {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      sections: DEFAULT_HOMEPAGE_SECTIONS,
      categories: DEFAULT_CATEGORIES_FALLBACK,
      banners: [],
      testimonials: [],
      supabaseConnected: false,
    };
  }
}

export interface ProductQueryParams {
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

export async function fetchPublishedProducts(
  params: ProductQueryParams = {}
): Promise<Product[]> {
  await ensureSupabaseInitialized();
  if (!isSupabaseConfigured || !supabase) {
    let items = getPreviewAdminProducts();
    if (params.categorySlug) {
      items = items.filter((p) => p.category?.slug === params.categorySlug);
    }
    if (params.featuredOnly) items = items.filter((p) => p.is_featured);
    if (params.newArrivalsOnly) items = items.filter((p) => p.is_new_arrival);
    if (params.bestSellersOnly) items = items.filter((p) => p.is_best_seller);
    if (params.onSaleOnly) items = items.filter((p) => p.is_on_sale);
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    if (typeof params.minPrice === 'number' && !Number.isNaN(params.minPrice)) {
      items = items.filter((p) => p.regular_price >= params.minPrice!);
    }
    if (typeof params.maxPrice === 'number' && !Number.isNaN(params.maxPrice)) {
      items = items.filter((p) => p.regular_price <= params.maxPrice!);
    }
    if (params.sortBy === 'price_asc') {
      items = [...items].sort((a, b) => a.regular_price - b.regular_price);
    } else if (params.sortBy === 'price_desc') {
      items = [...items].sort((a, b) => b.regular_price - a.regular_price);
    } else if (params.sortBy === 'popular') {
      items = [...items].sort((a, b) => b.sales_count - a.sales_count);
    }
    return params.limit ? items.slice(0, params.limit) : items;
  }

  let categoryIdFilter: string | null = null;
  if (params.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.categorySlug)
      .eq('is_active', true)
      .maybeSingle();
    if (!cat) return [];
    categoryIdFilter = cat.id;
  }

  let query = supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `
    )
    .eq('is_published', true)
    .eq('is_archived', false);

  if (categoryIdFilter) query = query.eq('category_id', categoryIdFilter);
  if (params.featuredOnly) query = query.eq('is_featured', true);
  if (params.newArrivalsOnly) query = query.eq('is_new_arrival', true);
  if (params.bestSellersOnly) query = query.eq('is_best_seller', true);
  if (params.onSaleOnly) query = query.eq('is_on_sale', true);
  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    query = query.or(
      `name.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`
    );
  }
  if (typeof params.minPrice === 'number' && !Number.isNaN(params.minPrice)) {
    query = query.gte('regular_price', params.minPrice);
  }
  if (typeof params.maxPrice === 'number' && !Number.isNaN(params.maxPrice)) {
    query = query.lte('regular_price', params.maxPrice);
  }

  switch (params.sortBy) {
    case 'price_asc':
      query = query.order('regular_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('regular_price', { ascending: false });
      break;
    case 'popular':
      query = query.order('sales_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Product[]).map((p) => ({
    ...p,
    regular_price: Number(p.regular_price),
    discounted_price: p.discounted_price !== null ? Number(p.discounted_price) : null,
    images: (p.images || []).sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  await ensureSupabaseInitialized();
  if (!slug) return null;
  if (!isSupabaseConfigured || !supabase) {
    return getPreviewAdminProducts().find((p) => p.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_archived', false)
    .maybeSingle();

  if (error || !data) return null;

  const product = data as Product;
  return {
    ...product,
    regular_price: Number(product.regular_price),
    discounted_price: product.discounted_price !== null ? Number(product.discounted_price) : null,
    images: (product.images || []).sort((a, b) => a.sort_order - b.sort_order),
  };
}

export async function fetchRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<Product[]> {
  await ensureSupabaseInitialized();
  if (!isSupabaseConfigured || !supabase) {
    const all = getPreviewAdminProducts().filter((p) => p.id !== productId);
    const sameCat = categoryId ? all.filter((p) => p.category_id === categoryId) : all;
    return (sameCat.length >= limit ? sameCat : all).slice(0, limit);
  }

  let query = supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
    .eq('is_published', true)
    .eq('is_archived', false)
    .neq('id', productId)
    .limit(limit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data } = await query;
  return ((data as Product[]) || []).map((p) => ({
    ...p,
    regular_price: Number(p.regular_price),
    discounted_price: p.discounted_price !== null ? Number(p.discounted_price) : null,
  }));
}

export interface CreateWhatsAppOrderInput {
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
}

export interface CreatedOrderResult {
  order_id: string;
  order_reference: string;
  subtotal: number;
  delivery_charge: number;
  tax_amount: number;
  total: number;
  currency: string;
  items: Array<{
    product_name: string;
    size: string;
    colour: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

export async function submitWhatsAppOrder(
  input: CreateWhatsAppOrderInput
): Promise<CreatedOrderResult> {
  await ensureSupabaseInitialized();
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Database connection is required to record live orders. Please configure Supabase credentials.'
    );
  }

  const rpcItems = input.items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId || null,
    size: item.size || '',
    colour: item.colour || '',
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('create_whatsapp_order', {
    p_customer_name: input.customerName.trim(),
    p_customer_phone: input.customerPhone.trim(),
    p_customer_email: input.customerEmail?.trim() || '',
    p_delivery_address: input.deliveryAddress.trim(),
    p_customer_notes: input.customerNotes?.trim() || '',
    p_items: rpcItems,
  });

  if (error) {
    throw new Error(error.message || 'Unable to submit order to database.');
  }

  return data as CreatedOrderResult;
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  await ensureSupabaseInitialized();
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.');
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: cleanEmail, status: 'subscribed' });
  if (error) {
    if (error.code === '23505') {
      throw new Error('This email address is already subscribed.');
    }
    throw new Error(error.message);
  }
}
