import { apiRequest, fetchBackendStatus } from '@/src/lib/apiClient';
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
  databaseConnected: boolean;
}

export async function fetchStorefrontBootstrap(): Promise<StorefrontBootstrapData> {
  try {
    const status = await fetchBackendStatus();
    if (!status.databaseConfigured || !status.databaseReachable) {
      return {
        settings: DEFAULT_SITE_SETTINGS,
        sections: DEFAULT_HOMEPAGE_SECTIONS,
        categories: DEFAULT_CATEGORIES_FALLBACK,
        banners: [],
        testimonials: [],
        databaseConnected: false,
      };
    }

    const res = await apiRequest<{
      settings: SiteSettings | null;
      sections: HomepageSection[];
      categories: Category[];
      banners: Banner[];
      testimonials: Testimonial[];
    }>('/api/storefront/bootstrap');

    const settings: SiteSettings = res.settings
      ? {
          ...DEFAULT_SITE_SETTINGS,
          ...res.settings,
          hero_image_url:
            res.settings.hero_image_url || DEFAULT_SITE_SETTINGS.hero_image_url,
          about_image_url:
            res.settings.about_image_url || DEFAULT_SITE_SETTINGS.about_image_url,
        }
      : DEFAULT_SITE_SETTINGS;

    return {
      settings,
      sections:
        res.sections && res.sections.length > 0
          ? res.sections
          : DEFAULT_HOMEPAGE_SECTIONS,
      categories:
        res.categories && res.categories.length > 0
          ? res.categories
          : DEFAULT_CATEGORIES_FALLBACK,
      banners: res.banners || [],
      testimonials: res.testimonials || [],
      databaseConnected: true,
    };
  } catch {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      sections: DEFAULT_HOMEPAGE_SECTIONS,
      categories: DEFAULT_CATEGORIES_FALLBACK,
      banners: [],
      testimonials: [],
      databaseConnected: false,
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
  const status = await fetchBackendStatus();
  if (!status.databaseConfigured || !status.databaseReachable) {
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

  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.categorySlug) qs.set('category', params.categorySlug);
  if (params.featuredOnly) qs.set('featured', 'true');
  if (params.newArrivalsOnly) qs.set('newArrivals', 'true');
  if (params.bestSellersOnly) qs.set('bestSellers', 'true');
  if (params.onSaleOnly) qs.set('onSale', 'true');
  if (typeof params.minPrice === 'number' && !Number.isNaN(params.minPrice)) {
    qs.set('minPrice', String(params.minPrice));
  }
  if (typeof params.maxPrice === 'number' && !Number.isNaN(params.maxPrice)) {
    qs.set('maxPrice', String(params.maxPrice));
  }
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.limit) qs.set('limit', String(params.limit));

  const data = await apiRequest<{ products: Product[] }>(
    `/api/storefront/products?${qs.toString()}`
  );
  return data.products || [];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;
  const status = await fetchBackendStatus();
  if (!status.databaseConfigured || !status.databaseReachable) {
    return getPreviewAdminProducts().find((p) => p.slug === slug) ?? null;
  }

  try {
    const data = await apiRequest<{ product: Product }>(
      `/api/storefront/products/${encodeURIComponent(slug)}`
    );
    return data.product ?? null;
  } catch {
    return null;
  }
}

export async function fetchRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<Product[]> {
  const status = await fetchBackendStatus();
  if (!status.databaseConfigured || !status.databaseReachable) {
    const all = getPreviewAdminProducts().filter((p) => p.id !== productId);
    const sameCat = categoryId ? all.filter((p) => p.category_id === categoryId) : all;
    return (sameCat.length >= limit ? sameCat : all).slice(0, limit);
  }

  const all = await fetchPublishedProducts({ sortBy: 'newest', limit: 24 });
  const others = all.filter((p) => p.id !== productId);
  const sameCat = categoryId ? others.filter((p) => p.category_id === categoryId) : others;
  return (sameCat.length >= limit ? sameCat : others).slice(0, limit);
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
  const status = await fetchBackendStatus();
  if (!status.databaseConfigured || !status.databaseReachable) {
    throw new Error(
      'Database connection is required to record live orders. Please configure DATABASE_URL on your server.'
    );
  }

  return apiRequest<CreatedOrderResult>('/api/storefront/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  const status = await fetchBackendStatus();
  if (!status.databaseConfigured || !status.databaseReachable) {
    throw new Error('Database connection is not configured yet.');
  }
  await apiRequest<{ subscribed: boolean }>('/api/storefront/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
