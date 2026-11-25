import {
  DEFAULT_CATEGORIES_FALLBACK,
  DEFAULT_HOMEPAGE_SECTIONS,
  LOCAL_BRAND_ASSETS,
} from '@/src/lib/defaults';
import { STARTER_LUXURY_PRODUCTS } from '@/src/lib/starterCatalog';
import type {
  ActivityLog,
  AdminUserRecord,
  AsoOkeEnquiry,
  Banner,
  Category,
  CustomDesignRequest,
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
      sales_count: Math.max(12, 52 - idx * 2),
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
      customer_notes: 'Please confirm chest/waist measurement fitting via WhatsApp.',
      internal_notes: 'Preview order entry',
      subtotal: 169.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 169.0,
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
          product_name: STARTER_LUXURY_PRODUCTS[0].name,
          product_sku: STARTER_LUXURY_PRODUCTS[0].sku,
          size: 'M',
          colour: 'Emerald & Sunshine',
          quantity: 1,
          unit_price: 169.0,
          subtotal: 169.0,
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
      subtotal: 340.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 340.0,
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
          product_id: 'preview-prod-2',
          variant_id: null,
          product_name: STARTER_LUXURY_PRODUCTS[1].name,
          product_sku: STARTER_LUXURY_PRODUCTS[1].sku,
          size: 'M',
          colour: 'Crimson & Marigold Kente',
          quantity: 1,
          unit_price: 340.0,
          subtotal: 340.0,
          image_url: STARTER_LUXURY_PRODUCTS[1].main_image_url,
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
      customer_notes: 'Include matching Gele pleats please.',
      internal_notes: '',
      subtotal: 540.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 540.0,
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
          product_id: 'preview-prod-3',
          variant_id: null,
          product_name: STARTER_LUXURY_PRODUCTS[2].name,
          product_sku: STARTER_LUXURY_PRODUCTS[2].sku,
          size: 'L',
          colour: 'Bright Emerald & Gold',
          quantity: 1,
          unit_price: 295.0,
          subtotal: 295.0,
          image_url: STARTER_LUXURY_PRODUCTS[2].main_image_url,
        },
        {
          id: 'preview-oi-4',
          order_id: 'preview-ord-3',
          product_id: 'preview-prod-5',
          variant_id: null,
          product_name: STARTER_LUXURY_PRODUCTS[4].name,
          product_sku: STARTER_LUXURY_PRODUCTS[4].sku,
          size: 'L/XL',
          colour: 'Turquoise & Coral Pink',
          quantity: 1,
          unit_price: 245.0,
          subtotal: 245.0,
          image_url: STARTER_LUXURY_PRODUCTS[4].main_image_url,
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
      subtotal: 465.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 465.0,
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
          product_id: 'preview-prod-4',
          variant_id: null,
          product_name: STARTER_LUXURY_PRODUCTS[3].name,
          product_sku: STARTER_LUXURY_PRODUCTS[3].sku,
          size: 'XL',
          colour: 'Imperial Purple & Gold',
          quantity: 1,
          unit_price: 465.0,
          subtotal: 465.0,
          image_url: STARTER_LUXURY_PRODUCTS[3].main_image_url,
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
      subtotal: 240.0,
      delivery_charge: 0,
      tax_amount: 0,
      total: 240.0,
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
          product_id: 'preview-prod-7',
          variant_id: null,
          product_name: STARTER_LUXURY_PRODUCTS[6].name,
          product_sku: STARTER_LUXURY_PRODUCTS[6].sku,
          size: 'L',
          colour: 'Royal Cobalt & Gold',
          quantity: 1,
          unit_price: 240.0,
          subtotal: 240.0,
          image_url: STARTER_LUXURY_PRODUCTS[6].main_image_url,
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
  const now = new Date().toISOString();
  return [
    {
      id: 'preview-test-1',
      customer_name: 'Amaka Nwosu',
      customer_role: 'Bridal Client',
      location: 'Toronto, Canada',
      quote:
        'The Rainbow Kente Mermaid Gown and coral Iro & Buba arrived impeccably tailored. Every vibrant colour popped in our wedding photographs!',
      rating: 5,
      is_published: true,
      sort_order: 1,
      created_at: now,
    },
    {
      id: 'preview-test-2',
      customer_name: 'Daniel Adeyemi',
      customer_role: 'Groom & Executive Client',
      location: 'London, United Kingdom',
      quote:
        'From the Emerald Senator Kaftan to my Royal Purple Aso Oke Agbada, every stitch carries regal weight and sharp native finish.',
      rating: 5,
      is_published: true,
      sort_order: 2,
      created_at: now,
    },
    {
      id: 'preview-test-3',
      customer_name: 'Claire Beaumont',
      customer_role: 'Event Host',
      location: 'Edmonton, Canada',
      quote:
        'MCFD J GLOBAL VENTURES dressed my entire bridal train in matching magenta, gold, and teal Aso Ebi sets—ready to wear and delivered on schedule.',
      rating: 5,
      is_published: true,
      sort_order: 3,
      created_at: now,
    },
  ];
}

const PREVIEW_CDR_KEY = 'mcfdj_preview_custom_requests_v1';
const PREVIEW_ASO_KEY = 'mcfdj_preview_aso_oke_enquiries_v1';

export function getPreviewCustomRequests(): CustomDesignRequest[] {
  const now = new Date().toISOString();
  const seeded: CustomDesignRequest[] = [
    {
      id: 'preview-cdr-1',
      request_reference: '#CDR-1004',
      name: 'Chidinma Okafor',
      email: 'chidinma@example.com',
      whatsapp_number: '+1 780 555 0119',
      customization_type: 'Custom Outfit',
      reference_image_url: LOCAL_BRAND_ASSETS.customCreationImage,
      description: 'Deep royal purple mermaid reception gown with gold beadwork along bodice and train.',
      quantity: 1,
      event_date: '2026-12-19',
      delivery_location: 'Edmonton, AB, Canada',
      status: 'New',
      quoted_amount: null,
      internal_notes: 'Awaiting measurements confirmation on WhatsApp.',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'preview-cdr-2',
      request_reference: '#CDR-1003',
      name: 'Tunde Balogun',
      email: 'tunde.b@example.com',
      whatsapp_number: '+44 7700 900456',
      customization_type: 'Branded Souvenir',
      reference_image_url: LOCAL_BRAND_ASSETS.souvenirsBannerImage,
      description: 'Gold-monogrammed royal purple tote bags and insulated flasks engraved for our anniversary dinner.',
      quantity: 50,
      event_date: '2026-12-28',
      delivery_location: 'Manchester, United Kingdom',
      status: 'Quoted',
      quoted_amount: 1850,
      internal_notes: 'Digital crest proof approved.',
      created_at: now,
      updated_at: now,
    },
  ];
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(PREVIEW_CDR_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomDesignRequest[];
        return [...parsed, ...seeded];
      }
    }
  } catch {
    // Ignore storage errors
  }
  return seeded;
}

export function addPreviewCustomRequest(item: CustomDesignRequest): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(PREVIEW_CDR_KEY);
      const list = raw ? (JSON.parse(raw) as CustomDesignRequest[]) : [];
      sessionStorage.setItem(PREVIEW_CDR_KEY, JSON.stringify([item, ...list].slice(0, 20)));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getPreviewAsoOkeEnquiries(): AsoOkeEnquiry[] {
  const now = new Date().toISOString();
  const seeded: AsoOkeEnquiry[] = [
    {
      id: 'preview-aso-1',
      enquiry_reference: '#ASO-1005',
      name: 'Folake & Adewale',
      email: 'folake.ade@example.com',
      whatsapp_number: '+1 416 555 0188',
      enquiry_type: 'Traditional Wedding Outfits',
      group_size: '25-40 Guests',
      quantity: 30,
      event_date: '2027-01-16',
      delivery_location: 'Toronto, ON, Canada',
      reference_image_url: LOCAL_BRAND_ASSETS.heroImage,
      notes: 'Couple Aso Oke Agbada + Iro/Buba with matching purple & champagne gold gele packs for immediate family.',
      status: 'In Review',
      quoted_amount: 4200,
      internal_notes: 'Weaving sample dispatched.',
      created_at: now,
      updated_at: now,
    },
  ];
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(PREVIEW_ASO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AsoOkeEnquiry[];
        return [...parsed, ...seeded];
      }
    }
  } catch {
    // Ignore storage errors
  }
  return seeded;
}

export function addPreviewAsoOkeEnquiry(item: AsoOkeEnquiry): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(PREVIEW_ASO_KEY);
      const list = raw ? (JSON.parse(raw) as AsoOkeEnquiry[]) : [];
      sessionStorage.setItem(PREVIEW_ASO_KEY, JSON.stringify([item, ...list].slice(0, 20)));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getPreviewMediaLibrary(): MediaAsset[] {
  const now = new Date().toISOString();
  const entries = [
    { name: 'hero_african_aso_oke_couple.jpg', url: LOCAL_BRAND_ASSETS.heroImage, folder: 'banners', bucket: 'banners' },
    { name: 'banner_custom_creation_atelier.jpg', url: LOCAL_BRAND_ASSETS.customCreationImage, folder: 'banners', bucket: 'banners' },
    { name: 'banner_souvenirs_collection.jpg', url: LOCAL_BRAND_ASSETS.souvenirsBannerImage, folder: 'banners', bucket: 'banners' },
    { name: 'promo_concierge_atelier.jpg', url: LOCAL_BRAND_ASSETS.promoImage, folder: 'banners', bucket: 'banners' },
    { name: 'editorial_lookbook_banner.jpg', url: LOCAL_BRAND_ASSETS.lookbookImage, folder: 'banners', bucket: 'banners' },
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
