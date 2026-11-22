-- ============================================================================
-- MCFD J GLOBAL VENTURES — STORAGE BUCKETS & INITIAL CONFIGURATION SEED
-- Migration: 002_storage_and_seed.sql
-- ============================================================================

-- 1. Storage Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('category-images', 'category-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('banners', 'banners', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('brand-assets', 'brand-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon'])
on conflict (id) do nothing;

-- Storage RLS Policies (Public read for published storefront assets, Admin-only write/delete)
create policy "public_read_store_buckets"
on storage.objects for select
using (bucket_id in ('product-images', 'category-images', 'banners', 'brand-assets'));

create policy "admin_insert_store_buckets"
on storage.objects for insert
with check (
  bucket_id in ('product-images', 'category-images', 'banners', 'brand-assets')
  and public.is_admin()
);

create policy "admin_update_store_buckets"
on storage.objects for update
using (
  bucket_id in ('product-images', 'category-images', 'banners', 'brand-assets')
  and public.is_admin()
);

create policy "admin_delete_store_buckets"
on storage.objects for delete
using (
  bucket_id in ('product-images', 'category-images', 'banners', 'brand-assets')
  and public.is_admin()
);

-- 2. Default Site Settings Row
-- Note: whatsapp_country_confirmed is false by default so admin verifies country code before live dispatch.
insert into public.site_settings (id)
values ('default')
on conflict (id) do nothing;

-- 3. Default Homepage Sections Order & Headings
insert into public.homepage_sections (section_key, title, subtitle, is_visible, sort_order)
values
  ('categories', 'Curated Collections', 'Explore our signature houses across apparel, leather goods, and fine accessories.', true, 1),
  ('featured_products', 'Featured Collection', 'Signature atelier silhouettes and limited seasonal releases.', true, 2),
  ('new_arrivals', 'New Arrivals', 'Freshly tailored pieces introduced for the current season.', true, 3),
  ('best_sellers', 'Best Sellers', 'Most requested pieces from our international clientele.', true, 4),
  ('promo_banner', 'The Bespoke Concierge Experience', 'Direct WhatsApp styling, measurements verification, and worldwide courier coordination.', true, 5),
  ('testimonials', 'Client Reflections', 'Verified words from clients dressed by MCFD J GLOBAL VENTURES.', true, 6)
on conflict (section_key) do nothing;

-- 4. Core Storefront Categories (manageable via Admin Category Manager)
insert into public.categories (name, slug, description, sort_order, is_active)
values
  ('Women''s Fashion', 'womens-fashion', 'Evening gowns, structured blazers, and tailored silk silhouettes.', 1, true),
  ('Men''s Fashion', 'mens-fashion', 'Architectural suiting, fine knitwear, and contemporary outerwear.', 2, true),
  ('Bags & Accessories', 'bags-accessories', 'Structured calfskin handbags, clutches, and artisanal eyewear.', 3, true),
  ('Footwear', 'footwear', 'Minimalist leather pumps, loafers, and handcrafted evening heels.', 4, true),
  ('Jewellery', 'jewellery', '18k gold sculptural earrings, cuffs, and signature timepieces.', 5, true)
on conflict (slug) do nothing;
