-- ============================================================================
-- MCFD J GLOBAL VENTURES — WEBSITE REDESIGN CATALOG, REQUESTS & ENQUIRIES
-- Migration: 004_redesign_catalog_and_requests.sql (safe & idempotent)
-- ============================================================================

-- 1. Extend site_settings with admin-editable redesigned homepage sections
alter table public.site_settings
  add column if not exists hero_kicker text not null default 'Fashion • Beauty • Customization • Branding',
  add column if not exists hero_script_text text not null default 'Your Vision... Our Creation',
  add column if not exists hero_secondary_button_text text not null default 'Request a Custom Design',
  add column if not exists hero_secondary_button_url text not null default '/custom-design',
  add column if not exists custom_design_title text not null default 'Your Idea, Our Creation',
  add column if not exists custom_design_description text not null default 'Bring a sample, share your idea, or choose from our designs — we''ll deliver exactly what you want.',
  add column if not exists custom_design_image_url text default '/src/assets/images/banner_custom_creation_atelier_1795571497122.jpg',
  add column if not exists custom_design_button_text text not null default 'Request Custom Design',
  add column if not exists process_title text not null default 'Our Customization Process',
  add column if not exists process_steps jsonb not null default '[{"step":1,"title":"Share Your Idea","subtitle":"(Upload Sample)"},{"step":2,"title":"We Design & Confirm","subtitle":""},{"step":3,"title":"We Create with Care","subtitle":""},{"step":4,"title":"You Receive Your Order","subtitle":""}]'::jsonb,
  add column if not exists aso_oke_banner_title text not null default 'Aso Oke & Party Collections',
  add column if not exists aso_oke_banner_description text not null default 'Elegant traditional fabrics and matching outfits for your special events.',
  add column if not exists aso_oke_banner_image_url text default '/src/assets/images/cat_group_event_outfits_1795571495215.jpg',
  add column if not exists aso_oke_banner_button_text text not null default 'Shop Aso Oke',
  add column if not exists souvenir_banner_title text not null default 'Branding & Souvenirs',
  add column if not exists souvenir_banner_description text not null default 'Customized gifts and branded merchandise for events and businesses.',
  add column if not exists souvenir_banner_image_url text default '/src/assets/images/banner_souvenirs_collection_1795571496656.jpg',
  add column if not exists souvenir_banner_button_text text not null default 'Explore Souvenirs';

-- Upgrade uncustomized default copy cleanly without clobbering manual admin edits
update public.site_settings
set
  tagline = case when tagline = 'Fashion Redefined. Elegance Delivered.' then '...Your Style. Your Identity. Custom Made.' else tagline end,
  hero_headline = case when hero_headline = 'Style Redefined.' then 'Custom Fashion,' else hero_headline end,
  hero_subheadline_highlight = case when hero_subheadline_highlight = 'Elegance Delivered.' then 'Made for You' else hero_subheadline_highlight end,
  hero_description = case when hero_description = 'Discover premium fashion, timeless styles and unmatched quality.' then 'From stylish outfits to branded souvenirs, we bring your ideas to life with elegance and class.' else hero_description end,
  hero_button_text = case when hero_button_text = 'Shop the Collection' then 'Explore Collections' else hero_button_text end,
  hero_image_url = case when coalesce(hero_image_url, '') in ('', '/src/assets/images/hero_luxury_atelier_1795367867558.jpg') then '/src/assets/images/hero_african_aso_oke_couple_1795571493128.jpg' else hero_image_url end,
  og_image_url = case when coalesce(og_image_url, '') in ('', '/src/assets/images/hero_luxury_atelier_1795367867558.jpg') then '/src/assets/images/hero_african_aso_oke_couple_1795571493128.jpg' else og_image_url end
where id = 'default';

-- 2. Custom Design Requests Table
create sequence if not exists public.custom_req_seq start with 1001 increment by 1;

create table if not exists public.custom_design_requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique,
  name text not null,
  email text not null default '',
  whatsapp_number text not null,
  customization_type text not null default 'Custom Outfit',
  reference_image_url text default '',
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  event_date text default '',
  delivery_location text not null default '',
  status text not null default 'New'
    check (status in ('New', 'In Review', 'Quoted', 'In Production', 'Completed', 'Cancelled')),
  quoted_amount numeric(12,2),
  internal_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_design_requests_created on public.custom_design_requests(created_at desc);
create index if not exists idx_custom_design_requests_status on public.custom_design_requests(status);

drop trigger if exists trg_custom_design_requests_updated on public.custom_design_requests;
create trigger trg_custom_design_requests_updated
  before update on public.custom_design_requests
  for each row execute function public.set_updated_at();

-- 3. Aso Oke & Group Outfit Enquiries Table
create sequence if not exists public.aso_oke_seq start with 1001 increment by 1;

create table if not exists public.aso_oke_enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_reference text not null unique,
  name text not null,
  email text not null default '',
  whatsapp_number text not null,
  enquiry_type text not null default 'Aso Oke Fabrics',
  group_size text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  event_date text default '',
  delivery_location text not null default '',
  reference_image_url text default '',
  notes text not null default '',
  status text not null default 'New'
    check (status in ('New', 'In Review', 'Quoted', 'In Production', 'Completed', 'Cancelled')),
  quoted_amount numeric(12,2),
  internal_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aso_oke_enquiries_created on public.aso_oke_enquiries(created_at desc);
create index if not exists idx_aso_oke_enquiries_status on public.aso_oke_enquiries(status);

drop trigger if exists trg_aso_oke_enquiries_updated on public.aso_oke_enquiries;
create trigger trg_aso_oke_enquiries_updated
  before update on public.aso_oke_enquiries
  for each row execute function public.set_updated_at();

-- 4. Seed / Align African Fashion, Beauty, Aso Oke, Group Outfits & Souvenirs Categories
insert into public.categories (name, slug, description, image_url, sort_order, is_active)
values
  ('Men''s Fashion', 'mens-fashion', 'Bespoke African kaftans, embroidered agbada robes, and tailored suiting.', '/src/assets/images/cat_african_mens_fashion_1795571493598.jpg', 1, true),
  ('Women''s Fashion', 'womens-fashion', 'Regal beaded lace ensembles, silk maxi gowns, and sculpted gele styles.', '/src/assets/images/cat_african_womens_fashion_1795571494088.jpg', 2, true),
  ('Hair & Beauty', 'hair-beauty', 'Botanical crown hair elixirs, silk serums, and luxury beauty essentials.', '/src/assets/images/cat_hair_beauty_luxury_1795571494590.jpg', 3, true),
  ('Aso Oke & Traditional', 'aso-oke-traditional', 'Hand-loomed Nigerian Aso Oke textiles, gele sets, and heritage celebration wear.', '/src/assets/images/cat_aso_oke_fabric_1795571494430.jpg', 4, true),
  ('Group & Event Outfits', 'group-event-outfits', 'Coordinated Aso Ebi bridal trains, family event outfits, and custom group styling.', '/src/assets/images/cat_group_event_outfits_1795571495215.jpg', 5, true),
  ('Souvenirs & Gifts', 'souvenirs-gifts', 'Monogrammed caps, ceramic mugs, corporate totes, and event souvenir hampers.', '/src/assets/images/cat_souvenirs_branded_1795571495372.jpg', 6, true),
  ('Bags & Accessories', 'bags-accessories', 'Structured calfskin handbags, clutches, and artisanal eyewear.', '/src/assets/images/cat_bags_accessories_1795367866565.jpg', 7, true),
  ('Footwear', 'footwear', 'Minimalist leather pumps, loafers, and handcrafted evening heels.', '/src/assets/images/cat_footwear_1795367867619.jpg', 8, true),
  ('Jewellery', 'jewellery', '18k gold sculptural earrings, cuffs, and signature timepieces.', '/src/assets/images/cat_jewellery_1795367867143.jpg', 9, true)
on conflict (slug) do update
  set image_url = coalesce(nullif(public.categories.image_url, ''), excluded.image_url);

-- 5. Seed New African Fashion, Aso Oke, Group Outfit, Beauty & Souvenir Products (idempotent)
insert into public.products (
  name, slug, short_description, description, category_id, subcategory, sku,
  regular_price, discounted_price, currency, main_image_url, stock_quantity,
  tags, available_sizes, available_colours,
  is_featured, is_best_seller, is_new_arrival, is_on_sale, is_published, is_archived
)
values
  (
    'Royal Purple Aso Oke Agbada & Kufi Set',
    'royal-purple-aso-oke-agbada-set',
    'Three-piece handwoven royal plum Aso Oke Agbada crowned with intricate champagne-gold embroidery.',
    'Expertly hand-loomed and tailored for weddings, chieftaincy titles, and landmark galas. Includes the grand flowing Agbada robe, long-sleeve inner Kaftan tunic, tapered trousers, and embroidered Kufi cap.',
    (select id from public.categories where slug = 'aso-oke-traditional' limit 1),
    'Traditional Menswear',
    'MCFDJ-AO-011',
    520.00,
    465.00,
    'CAD',
    '/src/assets/images/prod_aso_oke_agbada_1795571586016.jpg',
    12,
    array['aso-oke','agbada','traditional','wedding','purple'],
    array['M','L','XL','XXL','Custom Fit'],
    '[{"name":"Imperial Purple & Gold","hex":"#3B0E3F"}]'::jsonb,
    true, true, true, true, true, false
  ),
  (
    'Bridal Metallic Gold & Plum Aso Oke Bundle',
    'bridal-metallic-gold-plum-aso-oke-bundle',
    'Luxury Nigerian Bridal Aso Oke weave finished with matching pleated Gele and shoulder Ipele.',
    'Handcrafted metallic gold-thread and deep plum Aso Oke bundle curated for brides, mothers of the day, and traditional engagement ceremonies. Soft drape and radiant shimmer.',
    (select id from public.categories where slug = 'aso-oke-traditional' limit 1),
    'Bridal Aso Oke',
    'MCFDJ-AO-012',
    360.00,
    null,
    'CAD',
    '/src/assets/images/prod_aso_oke_bridal_set_1795571526916.jpg',
    20,
    array['aso-oke','bridal','gele','ipele','wedding'],
    array['Full Set','Fabric + Gele Only'],
    '[{"name":"Plum & 24K Gold","hex":"#4A124E"},{"name":"Burgundy Wine","hex":"#6E1A42"}]'::jsonb,
    true, true, true, false, true, false
  ),
  (
    'Botanical Crown Hair Growth Elixir & Silk Kit',
    'botanical-crown-hair-growth-elixir-kit',
    'Deep violet dropper scalp growth serum paired with champagne-gold whipped silk moisture balm.',
    'Formulated with hibiscus extract, chebe botanicals, black castor oil, and silk proteins to nourish natural texture, protective braids, and lustrous wigs without greasy residue.',
    (select id from public.categories where slug = 'hair-beauty' limit 1),
    'Hair & Scalp Care',
    'MCFDJ-HB-013',
    89.00,
    null,
    'CAD',
    '/src/assets/images/prod_hair_elixir_kit_1795571498737.jpg',
    35,
    array['hair','beauty','serum','elixir'],
    array['2-Piece Duo','Travel Size'],
    '[{"name":"Violet Botanical","hex":"#4B1248"}]'::jsonb,
    true, true, true, false, true, false
  ),
  (
    'Royal Plum & Gold Aso Ebi Group Lace Pack',
    'royal-plum-gold-aso-ebi-group-lace-pack',
    'Coordinated French corded lace, wine silk brocade, and gold gele bundle tailored for wedding parties.',
    'Designed for seamless Aso Ebi group coordination across bridesmaids, groomsmen, and family tables. Bulk quantity pricing and custom color dyeing available on request.',
    (select id from public.categories where slug = 'group-event-outfits' limit 1),
    'Group & Event Packs',
    'MCFDJ-GE-014',
    295.00,
    260.00,
    'CAD',
    '/src/assets/images/prod_group_aso_ebi_pack_1795571499353.jpg',
    40,
    array['aso-ebi','group','lace','party','wedding'],
    array['1 Person Pack','5 Guests Bundle','10 Guests Bundle'],
    '[{"name":"Royal Purple Lace","hex":"#4A124E"},{"name":"Wine Brocade","hex":"#6E1A42"}]'::jsonb,
    true, true, false, true, true, false
  ),
  (
    'Executive Crown Branded Event Souvenir Hamper',
    'executive-crown-branded-event-souvenir-hamper',
    'Bespoke royal purple gift box featuring custom monogrammed tumbler, cap, notebook, and canvas tote.',
    'Personalize with family crests, wedding monograms, or corporate logos in champagne gold foil or precision embroidery. Ideal for milestone birthdays, weddings, and executive retreats.',
    (select id from public.categories where slug = 'souvenirs-gifts' limit 1),
    'Custom Souvenirs',
    'MCFDJ-SV-015',
    115.00,
    98.00,
    'CAD',
    '/src/assets/images/prod_branded_souvenir_hamper_1795571499840.jpg',
    60,
    array['souvenirs','branded','gifts','events','merchandise'],
    array['Single Box','Pack of 25','Pack of 50'],
    '[{"name":"Imperial Purple & Gold","hex":"#3B0E3F"}]'::jsonb,
    true, true, true, true, true, false
  )
on conflict (slug) do nothing;
