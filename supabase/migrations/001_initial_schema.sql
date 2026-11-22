-- ============================================================================
-- MCFD J GLOBAL VENTURES — SUPABASE POSTGRESQL SCHEMA & SECURITY MIGRATION
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES & ADMINISTRATOR ROLES
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'store_manager', 'content_manager')),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Security helper functions (SECURITY DEFINER to avoid recursive RLS checks)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.has_admin_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid()
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

-- Trigger to auto-update updated_at columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  image_url text,
  banner_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_active_order on public.categories(is_active, sort_order);

-- ============================================================================
-- 3. PRODUCTS, FINANCIALS, IMAGES & VARIANTS
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text not null default '',
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  subcategory text default '',
  sku text not null unique,
  regular_price numeric(12,2) not null check (regular_price >= 0),
  discounted_price numeric(12,2) check (discounted_price is null or discounted_price >= 0),
  currency text not null default 'CAD',
  main_image_url text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  tags text[] not null default '{}',
  available_sizes text[] not null default '{}',
  available_colours jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new_arrival boolean not null default false,
  is_on_sale boolean not null default false,
  is_published boolean not null default false,
  is_archived boolean not null default false,
  seo_title text default '',
  seo_description text default '',
  sales_count integer not null default 0 check (sales_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private admin-only cost price table so cost_price is never exposed to public queries
create table if not exists public.product_financials (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text default '',
  sort_order integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null default '',
  colour text not null default '',
  colour_hex text default '#090909',
  sku text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_available boolean not null default true,
  price_override numeric(12,2) check (price_override is null or price_override >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, colour)
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_published on public.products(is_published, is_archived, created_at desc);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_product_images_product on public.product_images(product_id, sort_order);
create index if not exists idx_product_variants_product on public.product_variants(product_id);

-- ============================================================================
-- 4. CUSTOMERS & ORDERS
-- ============================================================================

create sequence if not exists public.order_ref_seq start with 1001 increment by 1;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  email text default '',
  default_address text default '',
  notes text default '',
  total_orders integer not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text default '',
  delivery_address text not null,
  customer_notes text default '',
  internal_notes text default '',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_charge numeric(12,2) not null default 0 check (delivery_charge >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'CAD',
  order_status text not null default 'Pending Confirmation'
    check (order_status in ('New', 'Pending Confirmation', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_status text not null default 'Unpaid'
    check (payment_status in ('Unpaid', 'Awaiting Payment', 'Paid', 'Partially Paid', 'Refunded')),
  whatsapp_initiated boolean not null default true,
  whatsapp_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  product_sku text default '',
  size text default '',
  colour text default '',
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  image_url text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(order_status, payment_status);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ============================================================================
-- 5. WEBSITE CONTENT, SETTINGS, BANNERS, TESTIMONIALS, MEDIA & LOGS
-- ============================================================================

create table if not exists public.site_settings (
  id text primary key default 'default',
  business_name text not null default 'MCFD J GLOBAL VENTURES',
  brand_name text not null default 'MCFD J',
  tagline text not null default 'Fashion Redefined. Elegance Delivered.',
  logo_url text default '',
  favicon_url text default '',
  business_description text not null default 'International luxury fashion house offering curated womenswear, menswear, leather handbags, footwear, and fine jewellery with worldwide concierge delivery.',
  business_email text not null default 'concierge@mcfdjglobalventures.com',
  business_phone text not null default '+1 780 691 3209',
  whatsapp_number text not null default '7806913209',
  whatsapp_country_confirmed boolean not null default false,
  business_address text not null default 'Edmonton, Alberta, Canada · Worldwide Shipping',
  service_regions text not null default 'Canada, United States, United Kingdom, Europe & Worldwide',
  default_currency text not null default 'CAD',
  currency_symbol text not null default 'CAD $',
  available_currencies jsonb not null default '["CAD", "USD", "GBP", "EUR", "NGN"]'::jsonb,
  delivery_charge numeric(12,2) not null default 0,
  free_delivery_threshold numeric(12,2) not null default 0,
  minimum_order_value numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  shipping_info text not null default 'Orders are confirmed via WhatsApp concierge. Express worldwide delivery is arranged per destination with full tracking.',
  returns_policy text not null default 'Unworn items with original tags may be exchanged or returned within 14 days of delivery upon concierge approval.',
  whatsapp_checkout_message text not null default 'Please confirm product availability and provide payment instructions.',
  whatsapp_support_message text not null default 'Hello MCFD J GLOBAL VENTURES, I have a question regarding your collection.',
  whatsapp_checkout_enabled boolean not null default false,
  whatsapp_inquiry_enabled boolean not null default true,
  social_links jsonb not null default '{"instagram":"","facebook":"","tiktok":"","youtube":""}'::jsonb,
  seo_title text not null default 'MCFD J GLOBAL VENTURES — Luxury Fashion & Apparel',
  seo_description text not null default 'Fashion Redefined. Elegance Delivered. Discover timeless luxury styles, designer handbags, footwear, and jewellery from MCFD J GLOBAL VENTURES.',
  seo_keywords text not null default 'MCFD J GLOBAL VENTURES, luxury fashion, womenswear, menswear, handbags, footwear, jewellery',
  og_image_url text default '',
  announcement_text text not null default 'Free Worldwide Concierge Consultation · Authentic Luxury Collections',
  promo_messages jsonb not null default '["Worldwide Delivery Available","Direct WhatsApp Personal Styling","New Season Arrivals Now Open"]'::jsonb,
  hero_headline text not null default 'Fashion Redefined.',
  hero_subheadline_highlight text not null default 'Elegance Delivered.',
  hero_description text not null default 'Discover curated luxury fashion, timeless silhouettes, and refined craftsmanship tailored for the modern global wardrobe.',
  hero_image_url text default '',
  hero_button_text text not null default 'Shop the Collection',
  hero_button_url text not null default '/shop',
  about_intro text not null default 'MCFD J GLOBAL VENTURES is an international luxury fashion atelier dedicated to timeless elegance, sculptural tailoring, and bespoke client service.',
  about_mission text not null default 'To deliver world-class apparel, leather goods, and fine accessories backed by personal concierge guidance.',
  about_vision text not null default 'To stand as the premier bridge between timeless couture craftsmanship and modern global wardrobes.',
  about_values jsonb not null default '[{"title":"Uncompromising Quality","description":"Every textile, stitch, and hardware detail is inspected to luxury atelier standards."},{"title":"Personal Concierge","description":"Direct one-on-one WhatsApp styling, sizing guidance, and transparent order coordination."},{"title":"Global Reach","description":"Reliable insured dispatch to clients across North America, Europe, Africa, and beyond."}]'::jsonb,
  about_image_url text default '',
  footer_description text not null default 'MCFD J GLOBAL VENTURES curates enduring luxury fashion, leather accessories, and statement pieces with dedicated personal concierge ordering.',
  footer_links jsonb not null default '[]'::jsonb,
  copyright_text text not null default '© 2026 MCFD J GLOBAL VENTURES. All rights reserved.',
  privacy_policy text not null default 'MCFD J GLOBAL VENTURES respects your privacy. Order details submitted during checkout are used solely to coordinate product availability, payment confirmation, and delivery.',
  terms_conditions text not null default 'All orders initiated via WhatsApp are subject to stock verification and payment confirmation before dispatch.',
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null,
  subtitle text default '',
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  image_url text not null,
  link_url text default '/shop',
  button_text text default 'Explore Collection',
  placement text not null default 'promo' check (placement in ('hero', 'promo', 'category', 'collection')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_role text default 'Verified Client',
  location text default '',
  quote text not null,
  rating integer not null default 5 check (rating >= 1 and rating <= 5),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null unique,
  public_url text not null,
  bucket_name text not null,
  mime_type text default 'image/jpeg',
  size_bytes bigint not null default 0,
  alt_text text default '',
  folder text default 'general',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  admin_email text default '',
  action text not null,
  entity_type text default '',
  entity_id text default '',
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================================

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_roles_updated on public.admin_roles;
create trigger trg_admin_roles_updated before update on public.admin_roles for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists trg_product_variants_updated on public.product_variants;
create trigger trg_product_variants_updated before update on public.product_variants for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated before update on public.customers for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated before update on public.site_settings for each row execute function public.set_updated_at();

drop trigger if exists trg_homepage_sections_updated on public.homepage_sections;
create trigger trg_homepage_sections_updated before update on public.homepage_sections for each row execute function public.set_updated_at();

drop trigger if exists trg_banners_updated on public.banners;
create trigger trg_banners_updated before update on public.banners for each row execute function public.set_updated_at();

drop trigger if exists trg_testimonials_updated on public.testimonials;
create trigger trg_testimonials_updated before update on public.testimonials for each row execute function public.set_updated_at();

-- ============================================================================
-- 7. CONTROLLED PUBLIC CHECKOUT RPC (Price-Verified Server-Side in Postgres)
-- ============================================================================

create or replace function public.create_whatsapp_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_address text,
  p_customer_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_ref text;
  v_seq bigint;
  v_subtotal numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
  v_tax numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_settings public.site_settings%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_unit_price numeric(12,2);
  v_qty integer;
  v_line_subtotal numeric(12,2);
  v_result_items jsonb := '[]'::jsonb;
begin
  if p_customer_name is null or length(trim(p_customer_name)) < 2 then
    raise exception 'Customer name is required';
  end if;
  if p_customer_phone is null or length(trim(p_customer_phone)) < 6 then
    raise exception 'Valid phone number is required';
  end if;
  if p_delivery_address is null or length(trim(p_delivery_address)) < 4 then
    raise exception 'Delivery address or location is required';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart cannot be empty';
  end if;

  select * into v_settings from public.site_settings where id = 'default' limit 1;

  -- Upsert customer by normalized phone
  insert into public.customers (full_name, phone, email, default_address, total_orders, last_order_at)
  values (trim(p_customer_name), trim(p_customer_phone), coalesce(trim(p_customer_email), ''), trim(p_delivery_address), 1, now())
  on conflict (phone) do update
    set full_name = excluded.full_name,
        email = case when excluded.email <> '' then excluded.email else public.customers.email end,
        default_address = excluded.default_address,
        total_orders = public.customers.total_orders + 1,
        last_order_at = now(),
        updated_at = now()
  returning id into v_customer_id;

  v_seq := nextval('public.order_ref_seq');
  v_order_ref := '#MCFD-' || lpad(v_seq::text, 4, '0');

  insert into public.orders (
    order_reference, customer_id, customer_name, customer_phone, customer_email,
    delivery_address, customer_notes, subtotal, delivery_charge, tax_amount, total,
    currency, order_status, payment_status, whatsapp_initiated, whatsapp_sent_at
  )
  values (
    v_order_ref, v_customer_id, trim(p_customer_name), trim(p_customer_phone), coalesce(trim(p_customer_email), ''),
    trim(p_delivery_address), coalesce(trim(p_customer_notes), ''), 0, 0, 0, 0,
    coalesce(v_settings.default_currency, 'CAD'), 'Pending Confirmation', 'Unpaid', true, now()
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((v_item->>'quantity')::integer, 1));
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and is_published = true
      and is_archived = false;

    if not found then
      raise exception 'Product % is unavailable', (v_item->>'product_id');
    end if;

    v_unit_price := coalesce(
      case when v_product.is_on_sale and v_product.discounted_price is not null then v_product.discounted_price else null end,
      v_product.regular_price
    );

    if (v_item->>'variant_id') is not null and (v_item->>'variant_id') <> '' then
      select * into v_variant
      from public.product_variants
      where id = (v_item->>'variant_id')::uuid
        and product_id = v_product.id
        and is_available = true;
      if found and v_variant.price_override is not null then
        v_unit_price := v_variant.price_override;
      end if;
    end if;

    v_line_subtotal := round(v_unit_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_subtotal;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_sku,
      size, colour, quantity, unit_price, subtotal, image_url
    )
    values (
      v_order_id,
      v_product.id,
      case when (v_item->>'variant_id') is not null and (v_item->>'variant_id') <> '' then (v_item->>'variant_id')::uuid else null end,
      v_product.name,
      coalesce(v_variant.sku, v_product.sku),
      coalesce(v_item->>'size', ''),
      coalesce(v_item->>'colour', ''),
      v_qty,
      v_unit_price,
      v_line_subtotal,
      coalesce(v_product.main_image_url, '')
    );

    v_result_items := v_result_items || jsonb_build_object(
      'product_name', v_product.name,
      'size', coalesce(v_item->>'size', ''),
      'colour', coalesce(v_item->>'colour', ''),
      'quantity', v_qty,
      'unit_price', v_unit_price,
      'subtotal', v_line_subtotal
    );
  end loop;

  if coalesce(v_settings.delivery_charge, 0) > 0 then
    if coalesce(v_settings.free_delivery_threshold, 0) > 0 and v_subtotal >= v_settings.free_delivery_threshold then
      v_delivery := 0;
    else
      v_delivery := v_settings.delivery_charge;
    end if;
  end if;

  if coalesce(v_settings.tax_rate, 0) > 0 then
    v_tax := round(v_subtotal * (v_settings.tax_rate / 100.0), 2);
  end if;

  v_total := round(v_subtotal + v_delivery + v_tax, 2);

  update public.orders
  set subtotal = v_subtotal,
      delivery_charge = v_delivery,
      tax_amount = v_tax,
      total = v_total
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_reference', v_order_ref,
    'subtotal', v_subtotal,
    'delivery_charge', v_delivery,
    'tax_amount', v_tax,
    'total', v_total,
    'currency', coalesce(v_settings.default_currency, 'CAD'),
    'items', v_result_items
  );
end;
$$;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_financials enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.banners enable row level security;
alter table public.testimonials enable row level security;
alter table public.media_library enable row level security;
alter table public.activity_logs enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Profiles: users read/update own profile; super_admin reads all
create policy "profiles_self_select" on public.profiles for select
  using (auth.uid() = id or public.has_admin_role(array['super_admin']));
create policy "profiles_self_update" on public.profiles for update
  using (auth.uid() = id or public.has_admin_role(array['super_admin']));
create policy "profiles_admin_insert" on public.profiles for insert
  with check (public.has_admin_role(array['super_admin']) or auth.uid() = id);

-- Admin Roles: admins can read own role; super_admin manages all
create policy "admin_roles_select" on public.admin_roles for select
  using (auth.uid() = user_id or public.has_admin_role(array['super_admin']));
create policy "admin_roles_super_write" on public.admin_roles for all
  using (public.has_admin_role(array['super_admin']))
  with check (public.has_admin_role(array['super_admin']));

-- Categories: public reads active; super_admin & store_manager manage
create policy "categories_public_read" on public.categories for select
  using (is_active = true or public.is_admin());
create policy "categories_admin_write" on public.categories for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

-- Products: public reads published & non-archived; super_admin & store_manager manage
create policy "products_public_read" on public.products for select
  using ((is_published = true and is_archived = false) or public.is_admin());
create policy "products_admin_write" on public.products for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

-- Product Financials: strictly super_admin & store_manager (never public)
create policy "product_financials_admin_only" on public.product_financials for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

-- Product Images & Variants: public reads for visible products; store_manager/super_admin manage
create policy "product_images_public_read" on public.product_images for select
  using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.is_published = true and p.is_archived = false
    )
  );
create policy "product_images_admin_write" on public.product_images for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

create policy "product_variants_public_read" on public.product_variants for select
  using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.is_published = true and p.is_archived = false
    )
  );
create policy "product_variants_admin_write" on public.product_variants for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

-- Customers, Orders, Order Items: strictly super_admin & store_manager (public creates via SECURITY DEFINER RPC)
create policy "customers_admin_only" on public.customers for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

create policy "orders_admin_only" on public.orders for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

create policy "order_items_admin_only" on public.order_items for all
  using (public.has_admin_role(array['super_admin', 'store_manager']))
  with check (public.has_admin_role(array['super_admin', 'store_manager']));

-- Site Settings: public reads storefront config; super_admin edits all, content_manager edits content
create policy "site_settings_public_read" on public.site_settings for select
  using (true);
create policy "site_settings_admin_write" on public.site_settings for all
  using (public.has_admin_role(array['super_admin', 'content_manager']))
  with check (public.has_admin_role(array['super_admin', 'content_manager']));

-- Homepage Sections & Banners & Testimonials: public reads published/active; super_admin & content_manager manage
create policy "homepage_sections_public_read" on public.homepage_sections for select
  using (is_visible = true or public.is_admin());
create policy "homepage_sections_admin_write" on public.homepage_sections for all
  using (public.has_admin_role(array['super_admin', 'content_manager']))
  with check (public.has_admin_role(array['super_admin', 'content_manager']));

create policy "banners_public_read" on public.banners for select
  using (is_active = true or public.is_admin());
create policy "banners_admin_write" on public.banners for all
  using (public.has_admin_role(array['super_admin', 'content_manager']))
  with check (public.has_admin_role(array['super_admin', 'content_manager']));

create policy "testimonials_public_read" on public.testimonials for select
  using (is_published = true or public.is_admin());
create policy "testimonials_admin_write" on public.testimonials for all
  using (public.has_admin_role(array['super_admin', 'content_manager']))
  with check (public.has_admin_role(array['super_admin', 'content_manager']));

-- Media Library: admins read/manage
create policy "media_library_admin_read" on public.media_library for select
  using (public.is_admin());
create policy "media_library_admin_write" on public.media_library for all
  using (public.is_admin())
  with check (public.is_admin());

-- Activity Logs: admins insert/read (never public)
create policy "activity_logs_admin_read" on public.activity_logs for select
  using (public.is_admin());
create policy "activity_logs_admin_insert" on public.activity_logs for insert
  with check (public.is_admin());

-- Newsletter Subscribers: public can subscribe; only admins read
create policy "newsletter_public_insert" on public.newsletter_subscribers for insert
  with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
create policy "newsletter_admin_read" on public.newsletter_subscribers for select
  using (public.has_admin_role(array['super_admin', 'store_manager']));

-- Grant execute on checkout RPC to public anon & authenticated roles
grant execute on function public.create_whatsapp_order(text, text, text, text, text, jsonb) to anon, authenticated;
