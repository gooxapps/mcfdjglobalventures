export type AdminRoleType = 'super_admin' | 'store_manager' | 'content_manager';

export type OrderStatus =
  | 'New'
  | 'Pending Confirmation'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus =
  | 'Unpaid'
  | 'Awaiting Payment'
  | 'Paid'
  | 'Partially Paid'
  | 'Refunded';

export type InquiryStatus =
  | 'New'
  | 'In Review'
  | 'Quoted'
  | 'In Production'
  | 'Completed'
  | 'Cancelled';

export interface ProductColourOption {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  banner_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_main: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  colour: string;
  colour_hex: string;
  sku: string;
  stock_quantity: number;
  is_available: boolean;
  price_override: number | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string | null;
  category?: Category | null;
  subcategory: string;
  sku: string;
  regular_price: number;
  discounted_price: number | null;
  cost_price?: number | null;
  currency: string;
  main_image_url: string | null;
  stock_quantity: number;
  tags: string[];
  available_sizes: string[];
  available_colours: ProductColourOption[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_on_sale: boolean;
  is_published: boolean;
  is_archived: boolean;
  seo_title: string;
  seo_description: string;
  sales_count: number;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface CartItem {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  sku: string;
  imageUrl: string | null;
  size: string;
  colour: string;
  unitPrice: number;
  regularPrice: number;
  currency: string;
  quantity: number;
  maxStock: number;
  availableSizes: string[];
  availableColours: ProductColourOption[];
  variants?: ProductVariant[];
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  default_address: string;
  notes: string;
  total_orders: number;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string;
  size: string;
  colour: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  image_url: string;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  customer_notes: string;
  internal_notes: string;
  subtotal: number;
  delivery_charge: number;
  tax_amount: number;
  total: number;
  currency: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  whatsapp_initiated: boolean;
  whatsapp_sent_at: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CustomDesignRequest {
  id: string;
  request_reference: string;
  name: string;
  email: string;
  whatsapp_number: string;
  customization_type: string;
  reference_image_url: string;
  description: string;
  quantity: number;
  event_date: string;
  delivery_location: string;
  status: InquiryStatus;
  quoted_amount: number | null;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export interface AsoOkeEnquiry {
  id: string;
  enquiry_reference: string;
  name: string;
  email: string;
  whatsapp_number: string;
  enquiry_type: string;
  group_size: string;
  quantity: number;
  event_date: string;
  delivery_location: string;
  reference_image_url: string;
  notes: string;
  status: InquiryStatus;
  quoted_amount: number | null;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export interface AboutValue {
  title: string;
  description: string;
}

export interface FooterNavLink {
  label: string;
  url: string;
}

export interface ProcessStepConfig {
  step: number;
  title: string;
  subtitle: string;
}

export interface SiteSettings {
  id: string;
  business_name: string;
  brand_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  business_description: string;
  business_email: string;
  business_phone: string;
  whatsapp_number: string;
  whatsapp_country_confirmed: boolean;
  business_address: string;
  service_regions: string;
  default_currency: string;
  currency_symbol: string;
  available_currencies: string[];
  delivery_charge: number;
  free_delivery_threshold: number;
  minimum_order_value: number;
  tax_rate: number;
  shipping_info: string;
  returns_policy: string;
  whatsapp_checkout_message: string;
  whatsapp_support_message: string;
  whatsapp_checkout_enabled: boolean;
  whatsapp_inquiry_enabled: boolean;
  social_links: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  };
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image_url: string;
  announcement_text: string;
  promo_messages: string[];
  hero_kicker: string;
  hero_headline: string;
  hero_subheadline_highlight: string;
  hero_description: string;
  hero_image_url: string;
  hero_script_text: string;
  hero_button_text: string;
  hero_button_url: string;
  hero_secondary_button_text: string;
  hero_secondary_button_url: string;
  custom_design_title: string;
  custom_design_description: string;
  custom_design_image_url: string;
  custom_design_button_text: string;
  process_title: string;
  process_steps: ProcessStepConfig[];
  aso_oke_banner_title: string;
  aso_oke_banner_description: string;
  aso_oke_banner_image_url: string;
  aso_oke_banner_button_text: string;
  souvenir_banner_title: string;
  souvenir_banner_description: string;
  souvenir_banner_image_url: string;
  souvenir_banner_button_text: string;
  about_intro: string;
  about_mission: string;
  about_vision: string;
  about_values: AboutValue[];
  about_image_url: string;
  footer_description: string;
  footer_links: FooterNavLink[];
  copyright_text: string;
  privacy_policy: string;
  terms_conditions: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  sort_order: number;
  config: Record<string, unknown>;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_text: string;
  placement: 'hero' | 'promo' | 'category' | 'collection';
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_role: string;
  location: string;
  quote: string;
  rating: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  bucket_name: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  folder: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  admin_id: string | null;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminUserRecord {
  id: string;
  user_id: string;
  role: AdminRoleType;
  is_active: boolean;
  created_at: string;
  profile?: {
    email: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}
