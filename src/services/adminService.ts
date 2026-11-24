import { apiRequest, fetchBackendStatus } from '@/src/lib/apiClient';
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
  AdminRoleType,
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

async function isDatabaseLive(): Promise<boolean> {
  const status = await fetchBackendStatus();
  return Boolean(status.databaseConfigured && status.databaseReachable);
}

async function requireLiveDatabase(): Promise<void> {
  const live = await isDatabaseLive();
  if (!live) {
    throw new Error('Preview Mode: Configure DATABASE_URL to save live database changes.');
  }
}

// ============================================================================
// IMAGE COMPRESSION & VERCEL BLOB SERVER UPLOAD
// ============================================================================

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

async function compressImageIfNeeded(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.size < 350 * 1024) {
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
        0.84
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to encode file for upload.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadImageToStorage(
  file: File,
  bucket: 'product-images' | 'category-images' | 'banners' | 'brand-assets',
  folder = 'general'
): Promise<MediaAsset> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Unsupported file format. Upload JPG, PNG, WebP, AVIF, or SVG images.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File exceeds the 10MB size limit.');
  }

  await requireLiveDatabase();
  const compressed = await compressImageIfNeeded(file);
  const dataBase64 = await blobToBase64(compressed);

  return apiRequest<MediaAsset>('/api/admin/upload', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      mimeType: compressed.type || file.type,
      bucket,
      folder,
      dataBase64,
    }),
  });
}

// ============================================================================
// DASHBOARD OVERVIEW ANALYTICS
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

export async function fetchPendingOrdersCount(): Promise<number> {
  if (!(await isDatabaseLive())) return 3;
  try {
    const data = await apiRequest<{ count: number }>('/api/admin/pending-count');
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

export async function fetchDashboardMetrics(
  startDateIso: string,
  endDateIso: string,
  currencySymbol = 'CAD $'
): Promise<DashboardMetrics> {
  if (!(await isDatabaseLive())) {
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

  const qs = new URLSearchParams({
    start: startDateIso,
    end: endDateIso,
    currencySymbol,
  });
  return apiRequest<DashboardMetrics>(`/api/admin/dashboard?${qs.toString()}`);
}

// ============================================================================
// PRODUCTS CRUD
// ============================================================================

export async function fetchAdminProducts(): Promise<Product[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewAdminProducts();
  }
  const data = await apiRequest<{ products: Product[] }>('/api/admin/products');
  return data.products || [];
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
  await requireLiveDatabase();
  const data = await apiRequest<{ product: Product }>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.product;
}

export async function bulkUpdateProducts(
  ids: string[],
  updates: Partial<Pick<Product, 'is_published' | 'is_archived' | 'category_id'>>,
  description: string
) {
  await requireLiveDatabase();
  await apiRequest('/api/admin/products/bulk', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', ids, updates, description }),
  });
}

export async function deleteProducts(ids: string[]) {
  await requireLiveDatabase();
  await apiRequest('/api/admin/products/bulk', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', ids }),
  });
}

// ============================================================================
// CATEGORIES CRUD
// ============================================================================

export async function fetchAdminCategories(): Promise<Category[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewAdminCategories();
  }
  const data = await apiRequest<{ categories: Category[] }>('/api/admin/categories');
  return data.categories || [];
}

export async function saveAdminCategory(
  payload: Partial<Category> & { name: string; slug: string }
): Promise<Category> {
  await requireLiveDatabase();
  const data = await apiRequest<{ category: Category }>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.category;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await requireLiveDatabase();
  await apiRequest(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// ORDERS & CUSTOMERS
// ============================================================================

export async function fetchAdminOrders(): Promise<Order[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewAdminOrders();
  }
  const data = await apiRequest<{ orders: Order[] }>('/api/admin/orders');
  return data.orders || [];
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
  await requireLiveDatabase();
  await apiRequest(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates, orderReference }),
  });
}

export async function fetchAdminCustomers(): Promise<Customer[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewAdminCustomers();
  }
  const data = await apiRequest<{ customers: Customer[] }>('/api/admin/customers');
  return data.customers || [];
}

export async function updateAdminCustomer(
  id: string,
  updates: Partial<Pick<Customer, 'full_name' | 'phone' | 'email' | 'default_address' | 'notes'>>
): Promise<void> {
  await requireLiveDatabase();
  await apiRequest(`/api/admin/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ============================================================================
// WEBSITE CONTENT, BANNERS, TESTIMONIALS, MEDIA & SETTINGS
// ============================================================================

export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  await requireLiveDatabase();
  const data = await apiRequest<{ settings: SiteSettings }>('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.settings;
}

export async function fetchAdminHomepageSections(): Promise<HomepageSection[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewHomepageSections();
  }
  const data = await apiRequest<{ sections: HomepageSection[] }>('/api/admin/sections');
  return data.sections || [];
}

export async function saveHomepageSections(sections: HomepageSection[]): Promise<void> {
  await requireLiveDatabase();
  await apiRequest('/api/admin/sections', {
    method: 'PATCH',
    body: JSON.stringify({ sections }),
  });
}

export async function fetchAdminTestimonials(): Promise<Testimonial[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewTestimonials();
  }
  const data = await apiRequest<{ testimonials: Testimonial[] }>('/api/admin/testimonials');
  return data.testimonials || [];
}

export async function saveTestimonial(
  item: Partial<Testimonial> & { customer_name: string; quote: string }
): Promise<void> {
  await requireLiveDatabase();
  await apiRequest('/api/admin/testimonials', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function deleteTestimonial(id: string): Promise<void> {
  await requireLiveDatabase();
  await apiRequest(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminBanners(): Promise<Banner[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewBanners();
  }
  const data = await apiRequest<{ banners: Banner[] }>('/api/admin/banners');
  return data.banners || [];
}

export async function saveBanner(
  banner: Partial<Banner> & { title: string; image_url: string }
): Promise<void> {
  await requireLiveDatabase();
  await apiRequest('/api/admin/banners', {
    method: 'POST',
    body: JSON.stringify(banner),
  });
}

export async function deleteBanner(id: string): Promise<void> {
  await requireLiveDatabase();
  await apiRequest(`/api/admin/banners/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function fetchMediaLibrary(): Promise<MediaAsset[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewMediaLibrary();
  }
  const data = await apiRequest<{ assets: MediaAsset[] }>('/api/admin/media');
  return data.assets || [];
}

export async function renameMediaAsset(id: string, fileName: string, altText: string): Promise<void> {
  await requireLiveDatabase();
  await apiRequest(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ file_name: fileName.trim(), alt_text: altText.trim() }),
  });
}

export async function deleteMediaAsset(asset: MediaAsset): Promise<void> {
  await requireLiveDatabase();
  await apiRequest(`/api/admin/media/${encodeURIComponent(asset.id)}`, {
    method: 'DELETE',
  });
}

export async function fetchActivityLogs(limit = 100): Promise<ActivityLog[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewActivityLogs();
  }
  const data = await apiRequest<{ logs: ActivityLog[] }>(`/api/admin/logs?limit=${limit}`);
  return data.logs || [];
}

export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  if (!(await isDatabaseLive())) {
    return getPreviewAdminUsers();
  }
  const data = await apiRequest<{ users: AdminUserRecord[] }>('/api/admin/users');
  return data.users || [];
}

export async function createAdminUser(payload: {
  fullName: string;
  email: string;
  password: string;
  role: AdminRoleType;
}) {
  await requireLiveDatabase();
  return apiRequest<{ id: string; email: string; role: AdminRoleType }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUserAccess(
  userId: string,
  updates: { is_active?: boolean; role?: AdminRoleType }
) {
  await requireLiveDatabase();
  return apiRequest<{ updated: boolean }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
