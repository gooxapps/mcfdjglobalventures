import type { Category, HomepageSection, SiteSettings } from '@/src/types/store';

export const LOCAL_BRAND_ASSETS = {
  heroImage: '/src/assets/images/hero_luxury_atelier_1795367867558.jpg',
  aboutImage: '/src/assets/images/about_atelier_craft_1795367867366.jpg',
  categoryImages: {
    'womens-fashion': '/src/assets/images/cat_womens_fashion_1795367867363.jpg',
    'mens-fashion': '/src/assets/images/cat_mens_fashion_1795367867324.jpg',
    'bags-accessories': '/src/assets/images/cat_bags_accessories_1795367866565.jpg',
    footwear: '/src/assets/images/cat_footwear_1795367867619.jpg',
    jewellery: '/src/assets/images/cat_jewellery_1795367867143.jpg',
  } as Record<string, string>,
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'default',
  business_name: 'MCFD J GLOBAL VENTURES',
  brand_name: 'MCFD J',
  tagline: 'Fashion Redefined. Elegance Delivered.',
  logo_url: '',
  favicon_url: '',
  business_description:
    'International luxury fashion house offering curated womenswear, menswear, leather handbags, footwear, and fine jewellery with worldwide concierge delivery.',
  business_email: 'concierge@mcfdjglobalventures.com',
  business_phone: '+1 780 691 3209',
  whatsapp_number: '7806913209',
  whatsapp_country_confirmed: false,
  business_address: 'Edmonton, Alberta, Canada · Worldwide Shipping',
  service_regions: 'Canada, United States, United Kingdom, Europe & Worldwide',
  default_currency: 'CAD',
  currency_symbol: 'CAD $',
  available_currencies: ['CAD', 'USD', 'GBP', 'EUR', 'NGN'],
  delivery_charge: 0,
  free_delivery_threshold: 0,
  minimum_order_value: 0,
  tax_rate: 0,
  shipping_info:
    'Orders are confirmed via WhatsApp concierge. Express worldwide delivery is arranged per destination with full courier tracking.',
  returns_policy:
    'Unworn items with original atelier tags may be exchanged or returned within 14 days of delivery upon concierge approval.',
  whatsapp_checkout_message: 'Please confirm product availability and provide payment instructions.',
  whatsapp_support_message:
    'Hello MCFD J GLOBAL VENTURES, I have an inquiry regarding your fashion collection.',
  whatsapp_checkout_enabled: false,
  whatsapp_inquiry_enabled: true,
  social_links: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  },
  seo_title: 'MCFD J GLOBAL VENTURES — Luxury Fashion & Apparel',
  seo_description:
    'Fashion Redefined. Elegance Delivered. Discover curated luxury fashion, designer handbags, footwear, and fine jewellery from MCFD J GLOBAL VENTURES.',
  seo_keywords:
    'MCFD J GLOBAL VENTURES, luxury fashion, womenswear, menswear, handbags, footwear, jewellery',
  og_image_url: LOCAL_BRAND_ASSETS.heroImage,
  announcement_text: 'Worldwide Shipping  |  Shop with Confidence',
  promo_messages: [
    'Worldwide Delivery Available',
    'Direct WhatsApp Personal Styling',
    'New Season Arrivals Now Open',
  ],
  hero_headline: 'Style Redefined.',
  hero_subheadline_highlight: 'Elegance Delivered.',
  hero_description:
    'Discover premium fashion, timeless styles and unmatched quality.',
  hero_image_url: LOCAL_BRAND_ASSETS.heroImage,
  hero_button_text: 'Shop the Collection',
  hero_button_url: '/shop',
  about_intro:
    'MCFD J GLOBAL VENTURES is an international luxury fashion atelier dedicated to timeless elegance, sculptural tailoring, and bespoke client service.',
  about_mission:
    'To deliver world-class apparel, leather goods, and fine accessories backed by personal concierge guidance.',
  about_vision:
    'To stand as the premier bridge between timeless couture craftsmanship and modern global wardrobes.',
  about_values: [
    {
      title: 'Uncompromising Quality',
      description:
        'Every textile, stitch, and hardware detail is inspected to luxury atelier standards before dispatch.',
    },
    {
      title: 'Personal Concierge',
      description:
        'Direct one-on-one WhatsApp styling, sizing guidance, and transparent order coordination.',
    },
    {
      title: 'Global Reach',
      description:
        'Reliable insured courier delivery to clients across North America, Europe, Africa, and beyond.',
    },
  ],
  about_image_url: LOCAL_BRAND_ASSETS.aboutImage,
  footer_description:
    'MCFD J GLOBAL VENTURES curates enduring luxury fashion, leather accessories, and statement pieces with dedicated personal concierge ordering.',
  footer_links: [
    { label: 'Home', url: '/' },
    { label: 'Shop', url: '/shop' },
    { label: 'Collections', url: '/collections' },
    { label: 'About Us', url: '/about' },
    { label: 'Contact', url: '/contact' },
  ],
  copyright_text: '© 2026 MCFD J GLOBAL VENTURES. All rights reserved.',
  privacy_policy:
    'MCFD J GLOBAL VENTURES respects your privacy. Order details submitted during checkout are used solely to coordinate product availability, payment confirmation, and delivery.',
  terms_conditions:
    'All orders initiated via WhatsApp are subject to stock verification and payment confirmation prior to courier dispatch.',
  updated_at: new Date().toISOString(),
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-categories',
    section_key: 'categories',
    title: 'Curated Collections',
    subtitle: 'Explore our signature houses across apparel, leather goods, and fine accessories.',
    is_visible: true,
    sort_order: 1,
    config: {},
  },
  {
    id: 'sec-featured',
    section_key: 'featured_products',
    title: 'Featured Collection',
    subtitle: 'Signature atelier silhouettes and limited seasonal releases.',
    is_visible: true,
    sort_order: 2,
    config: {},
  },
  {
    id: 'sec-new',
    section_key: 'new_arrivals',
    title: 'New Arrivals',
    subtitle: 'Freshly tailored pieces introduced for the current season.',
    is_visible: true,
    sort_order: 3,
    config: {},
  },
  {
    id: 'sec-bestsellers',
    section_key: 'best_sellers',
    title: 'Best Sellers',
    subtitle: 'Most requested pieces from our international clientele.',
    is_visible: true,
    sort_order: 4,
    config: {},
  },
  {
    id: 'sec-promo',
    section_key: 'promo_banner',
    title: 'The Bespoke Concierge Experience',
    subtitle: 'Direct WhatsApp styling, measurements verification, and worldwide courier coordination.',
    is_visible: true,
    sort_order: 5,
    config: {},
  },
  {
    id: 'sec-testimonials',
    section_key: 'testimonials',
    title: 'Client Reflections',
    subtitle: 'Verified words from clients dressed by MCFD J GLOBAL VENTURES.',
    is_visible: true,
    sort_order: 6,
    config: {},
  },
];

export const DEFAULT_CATEGORIES_FALLBACK: Category[] = [
  {
    id: 'cat-womens',
    name: "Women's Fashion",
    slug: 'womens-fashion',
    description: 'Evening gowns, structured blazers, and tailored silk silhouettes.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['womens-fashion'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['womens-fashion'],
    sort_order: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-mens',
    name: "Men's Fashion",
    slug: 'mens-fashion',
    description: 'Architectural suiting, fine knitwear, and contemporary outerwear.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['mens-fashion'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['mens-fashion'],
    sort_order: 2,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-bags',
    name: 'Bags & Accessories',
    slug: 'bags-accessories',
    description: 'Structured calfskin handbags, clutches, and artisanal eyewear.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['bags-accessories'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['bags-accessories'],
    sort_order: 3,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-footwear',
    name: 'Footwear',
    slug: 'footwear',
    description: 'Minimalist leather pumps, loafers, and handcrafted evening heels.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['footwear'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['footwear'],
    sort_order: 4,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-jewellery',
    name: 'Jewellery',
    slug: 'jewellery',
    description: '18k gold sculptural earrings, cuffs, and signature timepieces.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['jewellery'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['jewellery'],
    sort_order: 5,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

export function resolveCategoryImage(category: Pick<Category, 'slug' | 'image_url'>): string {
  if (category.image_url && category.image_url.trim().length > 0) {
    return category.image_url;
  }
  return (
    LOCAL_BRAND_ASSETS.categoryImages[category.slug] ||
    LOCAL_BRAND_ASSETS.categoryImages['womens-fashion']
  );
}
