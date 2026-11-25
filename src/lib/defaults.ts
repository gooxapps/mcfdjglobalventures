import type { Category, HomepageSection, SiteSettings } from '@/src/types/store';

export const LOCAL_BRAND_ASSETS = {
  heroImage: '/src/assets/images/hero_african_aso_oke_couple_1795571493128.jpg',
  heroLegacyImage: '/src/assets/images/hero_luxury_atelier_1795367867558.jpg',
  aboutImage: '/src/assets/images/about_atelier_craft_1795367867366.jpg',
  promoImage: '/src/assets/images/promo_concierge_atelier_1795484994325.jpg',
  lookbookImage: '/src/assets/images/editorial_lookbook_banner_1795484994487.jpg',
  customCreationImage: '/src/assets/images/banner_custom_creation_atelier_1795571497122.jpg',
  souvenirsBannerImage: '/src/assets/images/banner_souvenirs_collection_1795571496656.jpg',
  asoOkeBannerImage: '/src/assets/images/cat_group_event_outfits_1795571495215.jpg',
  categoryImages: {
    'mens-fashion': '/src/assets/images/cat_african_mens_fashion_1795571493598.jpg',
    'womens-fashion': '/src/assets/images/cat_african_womens_fashion_1795571494088.jpg',
    'hair-beauty': '/src/assets/images/cat_hair_beauty_luxury_1795571494590.jpg',
    'aso-oke-traditional': '/src/assets/images/cat_aso_oke_fabric_1795571494430.jpg',
    'group-event-outfits': '/src/assets/images/cat_group_event_outfits_1795571495215.jpg',
    'souvenirs-gifts': '/src/assets/images/cat_souvenirs_branded_1795571495372.jpg',
  } as Record<string, string>,
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'default',
  business_name: 'MCFD J GLOBAL VENTURES',
  brand_name: 'MCFD J',
  tagline: '...Your Style. Your Identity. Custom Made.',
  logo_url: '',
  favicon_url: '',
  business_description:
    'African luxury fashion, bespoke Aso Oke, colorful native ready-to-wear attires, group event tailoring, hair & beauty essentials, and custom branded souvenirs delivered worldwide.',
  business_email: 'concierge@mcfdjglobalventures.com',
  business_phone: '+1 780 691 3209',
  whatsapp_number: '7806913209',
  whatsapp_country_confirmed: false,
  business_address: 'Edmonton, Alberta, Canada · Worldwide Shipping',
  service_regions: 'Canada, United States, United Kingdom, Nigeria, Europe & Worldwide',
  default_currency: 'CAD',
  currency_symbol: 'CAD $',
  available_currencies: ['CAD', 'USD', 'GBP', 'EUR', 'NGN'],
  delivery_charge: 0,
  free_delivery_threshold: 0,
  minimum_order_value: 0,
  tax_rate: 0,
  shipping_info:
    'Orders and bespoke commissions are confirmed via WhatsApp concierge. Express worldwide delivery is arranged per destination with full courier tracking.',
  returns_policy:
    'Ready-to-wear unworn items with original atelier tags may be exchanged within 14 days of delivery. Custom tailored & branded items are confirmed via measurement approval prior to production.',
  whatsapp_checkout_message: 'Please confirm availability and provide payment instructions.',
  whatsapp_support_message:
    'Hello MCFD J Global Ventures, I would like to inquire about custom fashion, Aso Oke, or ready-to-wear native attire.',
  whatsapp_checkout_enabled: false,
  whatsapp_inquiry_enabled: true,
  social_links: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  },
  seo_title: 'MCFD J Global Ventures — Custom African Fashion, Native Attires & Aso Oke',
  seo_description:
    'Your Style. Your Identity. Custom Made. Shop colorful ready-made native attires, Ankara dresses, Senator suits, Aso Oke, men’s & women’s fashion, and group event outfits.',
  seo_keywords:
    'MCFD J Global Ventures, Aso Oke, African fashion, native attires, Ankara ready to wear, Senator kaftan, group Aso Ebi, custom design outfits',
  og_image_url: LOCAL_BRAND_ASSETS.heroImage,
  announcement_text: '...Your Style. Your Identity. Custom Made.',
  promo_messages: [
    'Fast Worldwide Delivery  |  Custom Tailoring & Vibrant Native Attires',
    'Bespoke Aso Oke, Ankara Ready-to-Wear & Coordinated Wedding Group Outfits',
    'Direct WhatsApp Concierge Styling & Sample Uploads',
  ],
  hero_kicker: 'Fashion • Beauty • Customization • Branding',
  hero_headline: 'Custom Fashion,',
  hero_subheadline_highlight: 'Made for You',
  hero_description:
    'From vibrant native attires and ready-made clothes to bespoke celebrations, we bring your ideas to life with elegance and class.',
  hero_image_url: LOCAL_BRAND_ASSETS.heroImage,
  hero_script_text: 'Your Vision... Our Creation',
  hero_button_text: 'Explore Collections',
  hero_button_url: '/collections',
  hero_secondary_button_text: 'Request a Custom Design',
  hero_secondary_button_url: '/custom-design',
  custom_design_title: 'Your Idea, Our Creation',
  custom_design_description:
    "Bring a sample, share your idea, or choose from our designs — we'll deliver exactly what you want.",
  custom_design_image_url: LOCAL_BRAND_ASSETS.customCreationImage,
  custom_design_button_text: 'Request Custom Design',
  process_title: 'Our Customization Process',
  process_steps: [
    { step: 1, title: 'Share Your Idea', subtitle: '(Upload Sample)' },
    { step: 2, title: 'We Design & Confirm', subtitle: '' },
    { step: 3, title: 'We Create with Care', subtitle: '' },
    { step: 4, title: 'You Receive Your Order', subtitle: '' },
  ],
  aso_oke_banner_title: 'Aso Oke & Party Collections',
  aso_oke_banner_description:
    'Elegant traditional fabrics and matching outfits for your special events.',
  aso_oke_banner_image_url: LOCAL_BRAND_ASSETS.asoOkeBannerImage,
  aso_oke_banner_button_text: 'Shop Aso Oke',
  souvenir_banner_title: 'Branding & Souvenirs',
  souvenir_banner_description:
    'Customized gifts and branded merchandise for events and businesses.',
  souvenir_banner_image_url: LOCAL_BRAND_ASSETS.souvenirsBannerImage,
  souvenir_banner_button_text: 'Explore Souvenirs',
  about_intro:
    'MCFD J Global Ventures is a premier African fashion, bespoke tailoring, native ready-to-wear, and event customization house delivering timeless elegance to individuals, wedding parties, and corporate brands worldwide.',
  about_mission:
    'To translate every client’s personal vision into vibrant native attires, hand-loomed Aso Oke, ready-made couture, and celebration ensembles backed by dedicated concierge service.',
  about_vision:
    'To stand as the trusted global destination for colorful African couture, native ready-to-wear clothing, and group celebration outfits.',
  about_values: [
    {
      title: 'Uncompromising Craft',
      description:
        'From hand-loomed Aso Oke weaves to precision embroidery and bright wax prints, every garment passes strict atelier inspection.',
    },
    {
      title: 'Your Vision First',
      description:
        'Upload your sample or brief, collaborate directly with our designers on WhatsApp, and approve every detail before creation.',
    },
    {
      title: 'Worldwide Concierge',
      description:
        'Insured international courier delivery to clients across Canada, the US, UK, Nigeria, Europe, and beyond.',
    },
  ],
  about_image_url: LOCAL_BRAND_ASSETS.aboutImage,
  footer_description:
    'Colorful native attires, ready-made African fashion, bespoke Aso Oke collections, and coordinated group event outfits.',
  footer_links: [
    { label: 'Home', url: '/' },
    { label: 'Shop', url: '/shop' },
    { label: 'Custom Design', url: '/custom-design' },
    { label: 'About Us', url: '/about' },
    { label: 'Contact', url: '/contact' },
  ],
  copyright_text: '© 2026 MCFD J Global Ventures. All rights reserved.',
  privacy_policy:
    'MCFD J Global Ventures respects your privacy. Order details and custom design enquiries submitted on our platform are used solely to coordinate sizing, sample approvals, payment, and delivery.',
  terms_conditions:
    'Ready-to-wear and bespoke commission requests initiated via checkout or WhatsApp are subject to textile availability and payment confirmation prior to dispatch.',
  updated_at: new Date().toISOString(),
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-categories',
    section_key: 'categories',
    title: 'Curated Collections',
    subtitle: 'Men’s & Women’s native fashion, Aso Oke, group celebration outfits, beauty, and branded souvenirs.',
    is_visible: true,
    sort_order: 1,
    config: {},
  },
  {
    id: 'sec-featured',
    section_key: 'featured_products',
    title: 'Featured Collection',
    subtitle: 'Elevate your wardrobe with colorful native attires, ready-made dresses, Senator kaftans, and Aso Oke sets.',
    is_visible: true,
    sort_order: 2,
    config: {},
  },
  {
    id: 'sec-new',
    section_key: 'new_arrivals',
    title: 'New Arrivals',
    subtitle: 'Freshly tailored bright Ankara, Kente, Adire, and celebration pieces introduced this season.',
    is_visible: true,
    sort_order: 3,
    config: {},
  },
  {
    id: 'sec-bestsellers',
    section_key: 'best_sellers',
    title: 'Best Sellers',
    subtitle: 'Most requested native attires and ready-made garments from our global clientele.',
    is_visible: true,
    sort_order: 4,
    config: {},
  },
  {
    id: 'sec-promo',
    section_key: 'promo_banner',
    title: 'The Bespoke Concierge Experience',
    subtitle: 'Direct WhatsApp styling, measurement verification, and worldwide courier coordination.',
    is_visible: true,
    sort_order: 5,
    config: {},
  },
  {
    id: 'sec-testimonials',
    section_key: 'testimonials',
    title: 'Client Reflections',
    subtitle: 'Verified words from clients dressed by MCFD J Global Ventures.',
    is_visible: true,
    sort_order: 6,
    config: {},
  },
];

export const DEFAULT_CATEGORIES_FALLBACK: Category[] = [
  {
    id: 'cat-mens',
    name: "Men's Fashion",
    slug: 'mens-fashion',
    description: 'Vibrant ready-made Senator kaftans, embroidered Dashiki sets, Babanriga robes, and Ankara shirts.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['mens-fashion'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['mens-fashion'],
    sort_order: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-womens',
    name: "Women's Fashion",
    slug: 'womens-fashion',
    description: 'Bright Ankara peplum gowns, handwoven Kente dresses, Adire silk boubous, and beaded lace Iro & Buba.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['womens-fashion'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['womens-fashion'],
    sort_order: 2,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-beauty',
    name: 'Hair & Beauty',
    slug: 'hair-beauty',
    description: 'Personal styling consultations, crown hair care guidance, and bridal glam referrals.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['hair-beauty'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['hair-beauty'],
    sort_order: 3,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-aso-oke',
    name: 'Aso Oke & Traditional',
    slug: 'aso-oke-traditional',
    description: 'Hand-loomed Nigerian Aso Oke textiles, royal Agbada sets, Iro & Buba, and Auto Gele ensembles.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['aso-oke-traditional'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['aso-oke-traditional'],
    sort_order: 4,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-group',
    name: 'Group & Event Outfits',
    slug: 'group-event-outfits',
    description: 'Coordinated colorful Aso Ebi bridal trains, couple ensembles, and family celebration outfits.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['group-event-outfits'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['group-event-outfits'],
    sort_order: 5,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'cat-souvenirs',
    name: 'Souvenirs & Gifts',
    slug: 'souvenirs-gifts',
    description: 'Custom event branding, monogrammed keepsakes, and corporate appreciation gifts on request.',
    image_url: LOCAL_BRAND_ASSETS.categoryImages['souvenirs-gifts'],
    banner_url: LOCAL_BRAND_ASSETS.categoryImages['souvenirs-gifts'],
    sort_order: 6,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

export function resolveCategoryImage(category: Pick<Category, 'slug' | 'image_url'>): string {
  const canonical = LOCAL_BRAND_ASSETS.categoryImages[category.slug];
  if (category.image_url && category.image_url.trim().length > 0) {
    // Prefer updated African editorial artwork over legacy Western category placeholders for men/women
    if (
      (category.slug === 'mens-fashion' &&
        category.image_url.includes('cat_mens_fashion_1795367867324.jpg')) ||
      (category.slug === 'womens-fashion' &&
        category.image_url.includes('cat_womens_fashion_1795367867363.jpg'))
    ) {
      return canonical || category.image_url;
    }
    return category.image_url;
  }
  return canonical || LOCAL_BRAND_ASSETS.categoryImages['womens-fashion'];
}
