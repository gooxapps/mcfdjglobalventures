import {
  DEFAULT_CATEGORIES_FALLBACK,
  DEFAULT_HOMEPAGE_SECTIONS,
  LOCAL_BRAND_ASSETS,
} from '@/src/lib/defaults';
import { STARTER_LUXURY_PRODUCTS } from '@/src/lib/starterCatalog';
import type {
  ActivityLog,
  AdminUserRecord,
  Banner,
  Category,
  Customer,
  HomepageSection,
  MediaAsset,
  Order,
  Product,
  Testimonial,
} from '@/src/types/store';

const categoryMap = new Map<string, Category>(
  DEFAULT_CATEGORIES_FALLBACK.map((c) => [c.slug, c])
);

export function getPreviewAdminCategories(): Category[] {
  return DEFAULT_CATEGORIES_FALLBACK;
}

export function getPreviewAdminProducts(): Product[] {
  const now = new Date().toISOString();
  return STARTER_LUXURY_PRODUCTS.map((item, idx) => {
    const cat = categoryMap.get(item.categorySlug) ?? DEFAULT_CATEGORIES_FALLBACK[0];
    const id = `preview-prod-${idx + 1}`;
    return {
      id,
      name: item.name,
      slug: item.slug,
      short_description: item.short_description,
      description: item.description,
      category_id: cat.id,
      category: cat,
      subcategory: item.subcategory,
      sku: item.sku,
      regular_price: item.regular_price,
      discounted_price: item.discounted_price,
      cost_price: Number((item.regular_price * 0.45).toFixed(2)),
      currency: 'CAD',
      main_image_url: item.main_image_url,
      stock_quantity: item.stock_quantity,
      tags: item.tags,
      available_sizes: item.available_sizes,
      available_colours: item.available_colours,
      is_featured: item.is_featured,
      is_best_seller: item.is_best_seller,
      is_new_arrival: item.is_new_arrival,
      is_on_sale: item.is_on_sale,
      is_published: true,
      is_archived: false,
      seo_title: `${item.name} | MCFD J GLOBAL VENTURES`,
      seo_description: item.short_description,
      sales_count: Math.max(12, 48 - idx * 4),
      created_at: now,
      updated_at: now,
      images: [
        {
          id: `preview-img-${idx + 1}`,
          product_id: id,
          url: item.main_image_url,
          alt_text: item.name,
          sort_order: 0,
          is_main: true,
        },
      ],
      variants: [],
    };
  });
}

export function getPreviewAdminOrders(): Order[] {
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

  return [
    {
      id: 'preview-ord-1',
      order_reference: 'MCFDJ-1012',
      customer_id: 'preview-cust-1',
      customer_name: 'Blessing Okafor',
      customer_phone: '+1 780 555 0142',
      customer_email: 'blessing.okafor@example.com',
      delivery_address: '10420 Jasper Ave, Edmonton, AB, Canada',
      customer_notes: 'Please confirm evening delivery time via WhatsApp.',
      internal_notes: 'Preview order entry',
      subtotal: 289.99,
      delivery_charge: 0,
      tax_amount: 0,
      total: 289.99,
      currency: 'CAD',
      order_status: 'Pending Confirmation',
      payment_status: 'Awaiting Payment',
      whatsapp_initiated: true,
      whatsapp_sent_at: daysAgo(0),
      created_at: daysAgo(0),
      updated_at: daysAgo(0),
      items: [
        {
          id: 'preview-oi-1',
          order_id: 'preview-ord-1',
          product_id: 'preview-prod-1',
          variant_id: null,
          product_name: 'Noir Pleated Silk Maxi Dress',
          product_sku: 'MCFDJ-WM-001',
          size: 'M',
          colour: 'Obsidian Black',
          quantity: 1,
          unit_price: 289.99,
          subtotal: 289.99,
          image_url: STARTER_LUXURY_PRODUCTS[0].main_image_url,
        },
      ],
    },
    {
      id: 'preview-ord-2',
      order_reference: 'MCFDJ-1011',
      customer_id: 'preview-cust-2',
      customer_name: 'Amina Yusuf',
      customer_phone: '+44 7700 900123',
      customer_email: 'amina.yusuf@example.com',
      delivery_address: '28 Kensington High St, London, UK',
      customer_notes: '',
      internal_notes: '',
      subtotal: 359.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 359.0,
      currency: 'CAD',
      order_status: 'Confirmed',
      payment_status: 'Paid',
      whatsapp_initiated: true,
      whatsapp_sent_at: daysAgo(1),
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
      items: [
        {
          id: 'preview-oi-2',
          order_id: 'preview-ord-2',
          product_id: 'preview-prod-3',
          variant_id: null,
          product_name: 'Atelier Structured Calfskin Handbag',
          product_sku: 'MCFDJ-BG-003',
          size: 'One Size',
          colour: 'Jet Black',
          quantity: 1,
          unit_price: 359.0,
          subtotal: 359.0,
          image_url: STARTER_LUXURY_PRODUCTS[2].main_image_url,
        },
      ],
    },
    {
      id: 'preview-ord-3',
      order_reference: 'MCFDJ-1010',
      customer_id: 'preview-cust-3',
      customer_name: 'Grace Johnson',
      customer_phone: '+1 416 555 0198',
      customer_email: 'grace.j@example.com',
      delivery_address: '88 Bloor St W, Toronto, ON, Canada',
      customer_notes: 'Gift wrap requested.',
      internal_notes: '',
      subtotal: 594.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 594.0,
      currency: 'CAD',
      order_status: 'Processing',
      payment_status: 'Paid',
      whatsapp_initiated: true,
      whatsapp_sent_at: daysAgo(2),
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
      items: [
        {
          id: 'preview-oi-3',
          order_id: 'preview-ord-3',
          product_id: 'preview-prod-2',
          variant_id: null,
          product_name: 'Champagne Contrast-Lapel Blazer',
          product_sku: 'MCFDJ-MN-002',
          size: 'L',
          colour: 'Warm Ivory',
          quantity: 1,
          unit_price: 349.0,
          subtotal: 349.0,
          image_url: STARTER_LUXURY_PRODUCTS[1].main_image_url,
        },
        {
          id: 'preview-oi-4',
          order_id: 'preview-ord-3',
          product_id: 'preview-prod-4',
          variant_id: null,
          product_name: 'Champagne Nude Stiletto Pumps',
          product_sku: 'MCFDJ-FW-004',
          size: '39',
          colour: 'Champagne Nude',
          quantity: 1,
          unit_price: 245.0,
          subtotal: 245.0,
          image_url: STARTER_LUXURY_PRODUCTS[3].main_image_url,
        },
      ],
    },
    {
      id: 'preview-ord-4',
      order_reference: 'MCFDJ-1009',
      customer_id: 'preview-cust-4',
      customer_name: 'Precious Eze',
      customer_phone: '+234 809 555 0184',
      customer_email: 'precious.eze@example.com',
      delivery_address: 'Victoria Island, Lagos, Nigeria',
      customer_notes: '',
      internal_notes: '',
      subtotal: 495.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 495.0,
      currency: 'CAD',
      order_status: 'Delivered',
      payment_status: 'Paid',
      whatsapp_initiated: true,
      whatsapp_sent_at: daysAgo(4),
      created_at: daysAgo(4),
      updated_at: daysAgo(3),
      items: [
        {
          id: 'preview-oi-5',
          order_id: 'preview-ord-4',
          product_id: 'preview-prod-6',
          variant_id: null,
          product_name: 'Aurelien 18K Gold Chronograph Watch',
          product_sku: 'MCFDJ-JW-006',
          size: '40mm',
          colour: 'Champagne Gold',
          quantity: 1,
          unit_price: 495.0,
          subtotal: 495.0,
          image_url: STARTER_LUXURY_PRODUCTS[5].main_image_url,
        },
      ],
    },
    {
      id: 'preview-ord-5',
      order_reference: 'MCFDJ-1008',
      customer_id: 'preview-cust-5',
      customer_name: 'David Williams',
      customer_phone: '+1 403 555 0175',
      customer_email: 'david.w@example.com',
      delivery_address: '225 7 Ave SW, Calgary, AB, Canada',
      customer_notes: '',
      internal_notes: '',
      subtotal: 239.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 239.0,
      currency: 'CAD',
      order_status: 'Delivered',
      payment_status: 'Paid',
      whatsapp_initiated: true,
      whatsapp_sent_at: daysAgo(6),
      created_at: daysAgo(6),
      updated_at: daysAgo(5),
      items: [
        {
          id: 'preview-oi-6',
          order_id: 'preview-ord-5',
          product_id: 'preview-prod-9',
          variant_id: null,
          product_name: 'Milano Gold-Buckle Leather Loafers',
          product_sku: 'MCFDJ-FW-009',
          size: '43',
          colour: 'Polished Black',
          quantity: 1,
          unit_price: 239.0,
          subtotal: 239.0,
          image_url: STARTER_LUXURY_PRODUCTS[8].main_image_url,
        },
      ],
    },
  ];
}

export function getPreviewAdminCustomers(): Customer[] {
  return getPreviewAdminOrders().map((o, idx) => ({
    id: `preview-cust-${idx + 1}`,
    full_name: o.customer_name,
    phone: o.customer_phone,
    email: o.customer_email,
    default_address: o.delivery_address,
    notes: 'Preview client profile',
    total_orders: idx === 1 ? 3 : 1,
    last_order_at: o.created_at,
    created_at: o.created_at,
    updated_at: o.updated_at,
  }));
}

export function getPreviewHomepageSections(): HomepageSection[] {
  return DEFAULT_HOMEPAGE_SECTIONS;
}

export function getPreviewBanners(): Banner[] {
  return [];
}

export function getPreviewTestimonials(): Testimonial[] {
  return [];
}

export function getPreviewMediaLibrary(): MediaAsset[] {
  const now = new Date().toISOString();
  const entries = [
    { name: 'hero_luxury_atelier.jpg', url: LOCAL_BRAND_ASSETS.heroImage, folder: 'banners', bucket: 'banners' },
    { name: 'about_atelier_craft.jpg', url: LOCAL_BRAND_ASSETS.aboutImage, folder: 'brand', bucket: 'brand-assets' },
    ...STARTER_LUXURY_PRODUCTS.map((p) => ({
      name: `${p.slug}.jpg`,
      url: p.main_image_url,
      folder: 'products',
      bucket: 'product-images',
    })),
  ];

  return entries.map((e, idx) => ({
    id: `preview-media-${idx + 1}`,
    file_name: e.name,
    storage_path: `${e.folder}/${e.name}`,
    public_url: e.url,
    bucket_name: e.bucket,
    mime_type: 'image/jpeg',
    size_bytes: 185000,
    alt_text: e.name.replace(/\.jpg$/, '').replace(/[-_]/g, ' '),
    folder: e.folder,
    created_at: now,
  }));
}

export function getPreviewAdminUsers(): AdminUserRecord[] {
  return [
    {
      id: 'preview-role-1',
      user_id: 'preview-user-1',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
      profile: {
        email: 'owner@mcfdjglobalventures.com',
        full_name: 'Theresa Odediran (Preview)',
        avatar_url: null,
        phone: '+1 780 691 3209',
      },
    },
  ];
}

export function getPreviewActivityLogs(): ActivityLog[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'preview-log-1',
      admin_id: 'preview-user-1',
      admin_email: 'owner@mcfdjglobalventures.com',
      action: 'preview_session_started',
      entity_type: 'dashboard',
      entity_id: 'preview',
      description: 'Opened Admin Dashboard in Preview Mode before database setup.',
      metadata: {},
      created_at: now,
    },
  ];
}

export function getPreviewDailySeries() {
  const today = new Date();
  const amounts = [320, 480, 290, 610, 540, 890, 760, 1120, 940, 680, 845, 990];
  const orderCounts = [2, 3, 1, 4, 3, 5, 4, 6, 5, 3, 4, 5];

  return amounts.map((paidRevenue, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (amounts.length - 1 - idx));
    const date = d.toISOString().slice(0, 10);
    return {
      date,
      label: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      orders: orderCounts[idx],
      paidRevenue,
    };
  });
}
