-- ============================================================================
-- MCFD J GLOBAL VENTURES — INITIAL CONFIGURATION, SECTIONS & CATEGORIES SEED
-- Migration: 002_seed_config_and_catalog.sql
-- ============================================================================

-- 1. Default Site Settings Row
insert into public.site_settings (id)
values ('default')
on conflict (id) do nothing;

-- 2. Default Homepage Sections Order & Headings
insert into public.homepage_sections (section_key, title, subtitle, is_visible, sort_order)
values
  ('categories', 'Shop Our Collections', 'Explore our signature houses across apparel, leather goods, and fine accessories.', true, 1),
  ('featured_products', 'Featured Collection', 'Elevate your style with our handpicked favourites.', true, 2),
  ('new_arrivals', 'New Arrivals', 'Freshly tailored pieces introduced for the current season.', true, 3),
  ('best_sellers', 'Best Sellers', 'Most requested pieces from our international clientele.', true, 4),
  ('promo_banner', 'The Bespoke Concierge Experience', 'Direct WhatsApp styling, measurements verification, and worldwide courier coordination.', true, 5),
  ('testimonials', 'Client Reflections', 'Verified words from clients dressed by MCFD J GLOBAL VENTURES.', true, 6)
on conflict (section_key) do nothing;

-- 3. Core Storefront Categories
insert into public.categories (name, slug, description, sort_order, is_active)
values
  ('Women''s Fashion', 'womens-fashion', 'Evening gowns, structured blazers, and tailored silk silhouettes.', 1, true),
  ('Men''s Fashion', 'mens-fashion', 'Architectural suiting, fine knitwear, and contemporary outerwear.', 2, true),
  ('Bags & Accessories', 'bags-accessories', 'Structured calfskin handbags, clutches, and artisanal eyewear.', 3, true),
  ('Footwear', 'footwear', 'Minimalist leather pumps, loafers, and handcrafted evening heels.', 4, true),
  ('Jewellery', 'jewellery', '18k gold sculptural earrings, cuffs, and signature timepieces.', 5, true)
on conflict (slug) do nothing;
