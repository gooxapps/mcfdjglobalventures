import type { ProductColourOption } from '@/src/types/store';

export interface StarterProductSeed {
  name: string;
  slug: string;
  categorySlug: string;
  subcategory: string;
  sku: string;
  short_description: string;
  description: string;
  regular_price: number;
  discounted_price: number | null;
  main_image_url: string;
  stock_quantity: number;
  tags: string[];
  available_sizes: string[];
  available_colours: ProductColourOption[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_on_sale: boolean;
}

export const STARTER_LUXURY_PRODUCTS: StarterProductSeed[] = [
  {
    name: 'Noir Pleated Silk Maxi Dress',
    slug: 'noir-pleated-silk-maxi-dress',
    categorySlug: 'womens-fashion',
    subcategory: 'Evening Dresses',
    sku: 'MCFDJ-WM-001',
    short_description:
      'Sleeveless knife-pleated evening gown finished with a sculpted champagne-gold waist belt.',
    description:
      'Cut from fluid Italian silk-crepe, the Noir Pleated Silk Maxi Dress drapes cleanly from the shoulder to a floor-grazing hem. Paired with a removable brushed champagne-gold metallic belt for formal evenings and gallery receptions.',
    regular_price: 289.99,
    discounted_price: null,
    main_image_url: '/src/assets/images/prod_maxi_dress_1795374879485.jpg',
    stock_quantity: 18,
    tags: ['evening', 'silk', 'maxi', 'womens'],
    available_sizes: ['XS', 'S', 'M', 'L', 'XL'],
    available_colours: [{ name: 'Obsidian Black', hex: '#090909' }],
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: true,
    is_on_sale: false,
  },
  {
    name: 'Champagne Contrast-Lapel Blazer',
    slug: 'champagne-contrast-lapel-blazer',
    categorySlug: 'mens-fashion',
    subcategory: 'Tailored Blazers',
    sku: 'MCFDJ-MN-002',
    short_description:
      'Architectural single-breasted ivory blazer accented with midnight-black piped lapels.',
    description:
      'Hand-tailored from breathable virgin wool-silk blend, this signature MCFD J blazer features crisp midnight trim along the notch lapels, horn buttons, and a structured shoulder profile suited for day-to-evening dressing.',
    regular_price: 349.0,
    discounted_price: null,
    main_image_url: '/src/assets/images/prod_classic_blazer_1795374879175.jpg',
    stock_quantity: 14,
    tags: ['blazer', 'tailored', 'ivory', 'mens'],
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    available_colours: [{ name: 'Warm Ivory', hex: '#EDE3CE' }],
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    is_on_sale: false,
  },
  {
    name: 'Atelier Structured Calfskin Handbag',
    slug: 'atelier-structured-calfskin-handbag',
    categorySlug: 'bags-accessories',
    subcategory: 'Top-Handle Bags',
    sku: 'MCFDJ-BG-003',
    short_description:
      'Full-grain obsidian leather top-handle silhouette secured with a brushed gold padlock clasp.',
    description:
      'Crafted from smooth Italian calfskin with hand-painted edges and a suede-lined interior compartment. Includes a detachable crossbody strap and protective champagne-gold metal feet.',
    regular_price: 420.0,
    discounted_price: 359.0,
    main_image_url: '/src/assets/images/prod_luxury_handbag_1795374879477.jpg',
    stock_quantity: 12,
    tags: ['handbag', 'leather', 'calfskin', 'gold'],
    available_sizes: ['One Size'],
    available_colours: [{ name: 'Jet Black', hex: '#090909' }],
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    is_on_sale: true,
  },
  {
    name: 'Champagne Nude Stiletto Pumps',
    slug: 'champagne-nude-stiletto-pumps',
    categorySlug: 'footwear',
    subcategory: 'Evening Heels',
    sku: 'MCFDJ-FW-004',
    short_description:
      'Pointed-toe Italian calf-leather pumps sculpted on a poised 100mm stiletto heel.',
    description:
      'Designed for refined elegance and balanced posture, our Champagne Nude Stiletto Pumps feature a cushioned lambskin insole, razor-clean pointed toe box, and supple leather sole.',
    regular_price: 245.0,
    discounted_price: null,
    main_image_url: '/src/assets/images/prod_fashion_heels_1795374879324.jpg',
    stock_quantity: 22,
    tags: ['heels', 'pumps', 'footwear', 'nude'],
    available_sizes: ['36', '37', '38', '39', '40', '41'],
    available_colours: [{ name: 'Champagne Nude', hex: '#D8B99E' }],
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    is_on_sale: false,
  },
  {
    name: 'Heritage Tortoise Gold Sunglasses',
    slug: 'heritage-tortoise-gold-sunglasses',
    categorySlug: 'bags-accessories',
    subcategory: 'Eyewear',
    sku: 'MCFDJ-AC-005',
    short_description:
      'Oversized Italian acetate frames detailed with engraved champagne-gold temple bars.',
    description:
      'Constructed from rich tortoiseshell cellulose acetate with 100% UV400 smoked gradient lenses and solid gold-plated temple hardware. Presented with a rigid monogrammed travel case.',
    regular_price: 185.0,
    discounted_price: 149.0,
    main_image_url: '/src/assets/images/prod_sunglasses_1795374879889.jpg',
    stock_quantity: 26,
    tags: ['sunglasses', 'eyewear', 'accessories', 'tortoise'],
    available_sizes: ['One Size'],
    available_colours: [{ name: 'Dark Tortoise', hex: '#3B281B' }],
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: false,
    is_on_sale: true,
  },
  {
    name: 'Aurelien 18K Gold Chronograph Watch',
    slug: 'aurelien-18k-gold-chronograph-watch',
    categorySlug: 'jewellery',
    subcategory: 'Timepieces',
    sku: 'MCFDJ-JW-006',
    short_description:
      'Brushed champagne-gold link chronograph timepiece with radiant ivory sunburst dial.',
    description:
      'Precision quartz chronograph housed in a 40mm 18k gold-toned stainless steel case with scratch-resistant sapphire crystal, three sub-dials, and a butterfly deployant clasp.',
    regular_price: 495.0,
    discounted_price: null,
    main_image_url: '/src/assets/images/prod_gold_watch_1795374897534.jpg',
    stock_quantity: 9,
    tags: ['watch', 'chronograph', 'gold', 'jewellery'],
    available_sizes: ['40mm'],
    available_colours: [{ name: 'Champagne Gold', hex: '#D4AF5A' }],
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: true,
    is_on_sale: false,
  },
  {
    name: 'Sandstone Double-Breasted Trench Coat',
    slug: 'sandstone-double-breasted-trench-coat',
    categorySlug: 'womens-fashion',
    subcategory: 'Outerwear',
    sku: 'MCFDJ-WM-007',
    short_description:
      'Water-repellent silk-cotton gabardine trench coat with dark horn buttons and tie belt.',
    description:
      'A timeless architectural outer layer tailored in tightly woven gabardine with storm flaps, belted cuffs, and a full satin-twill lining for effortless seasonal layering.',
    regular_price: 380.0,
    discounted_price: null,
    main_image_url: '/src/assets/images/prod_silk_trench_1795374897349.jpg',
    stock_quantity: 15,
    tags: ['trench', 'coat', 'outerwear', 'womens'],
    available_sizes: ['XS', 'S', 'M', 'L'],
    available_colours: [{ name: 'Sandstone Beige', hex: '#D8C7AE' }],
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    is_on_sale: false,
  },
  {
    name: 'Sovereign Satin-Lapel Tuxedo Jacket',
    slug: 'sovereign-satin-lapel-tuxedo-jacket',
    categorySlug: 'mens-fashion',
    subcategory: 'Evening Suiting',
    sku: 'MCFDJ-MN-008',
    short_description:
      'Jet-black superfine wool evening dinner jacket finished with silk-satin peak lapels.',
    description:
      'Tailored to black-tie atelier standards with a single silk-covered button closure, internal French facing, and sharp sculpted silhouette for formal galas.',
    regular_price: 460.0,
    discounted_price: null,
    main_image_url: '/src/assets/images/prod_mens_tuxedo_1795374897448.jpg',
    stock_quantity: 11,
    tags: ['tuxedo', 'menswear', 'suiting', 'black'],
    available_sizes: ['48', '50', '52', '54', '56'],
    available_colours: [{ name: 'Midnight Black', hex: '#090909' }],
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: false,
    is_on_sale: false,
  },
  {
    name: 'Milano Gold-Buckle Leather Loafers',
    slug: 'milano-gold-buckle-leather-loafers',
    categorySlug: 'footwear',
    subcategory: 'Dress Loafers',
    sku: 'MCFDJ-FW-009',
    short_description:
      'Hand-burnished black calfskin dress loafers crowned with a brushed gold monk strap.',
    description:
      'Built on an elongated almond toe last with Blake-stitched leather soles and breathable calfskin lining for refined boardroom and evening comfort.',
    regular_price: 275.0,
    discounted_price: 239.0,
    main_image_url: '/src/assets/images/prod_leather_loafers_1795374897597.jpg',
    stock_quantity: 16,
    tags: ['loafers', 'leather', 'footwear', 'mens'],
    available_sizes: ['40', '41', '42', '43', '44', '45'],
    available_colours: [{ name: 'Polished Black', hex: '#141414' }],
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    is_on_sale: true,
  },
  {
    name: 'Sculptural 18K Gold Cuff & Hoop Set',
    slug: 'sculptural-18k-gold-cuff-hoop-set',
    categorySlug: 'jewellery',
    subcategory: 'Fine Jewellery',
    sku: 'MCFDJ-JW-010',
    short_description:
      'Mirror-polished architectural open gold cuff bracelet paired with matching sculpted hoops.',
    description:
      'Plated in thick 18k yellow gold vermeil over hypoallergenic sterling silver, designed with fluid ribbons that catch light from every angle.',
    regular_price: 215.0,
    discounted_price: null,
    main_image_url: '/src/assets/images/prod_gold_cuff_1795374896788.jpg',
    stock_quantity: 20,
    tags: ['jewellery', 'cuff', 'earrings', 'gold'],
    available_sizes: ['One Size'],
    available_colours: [{ name: '18K Yellow Gold', hex: '#D4AF5A' }],
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    is_on_sale: false,
  },
];
