import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gem,
  Headphones,
  MessageCircle,
  PenTool,
  Scissors,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { LOCAL_BRAND_ASSETS, resolveCategoryImage } from '@/src/lib/defaults';
import { fetchPublishedProducts } from '@/src/services/storefrontService';
import type { Category, Product } from '@/src/types/store';
import { ProductCard } from '@/src/components/ProductCard';
import { SafeImage } from '@/src/components/SafeImage';
import { SeoHead } from '@/src/components/SeoHead';

const PRIMARY_SIX_SLUGS = [
  'mens-fashion',
  'womens-fashion',
  'hair-beauty',
  'aso-oke-traditional',
  'group-event-outfits',
  'souvenirs-gifts',
];

function getCategoryDestination(slug: string): string {
  if (slug === 'aso-oke-traditional') return '/aso-oke';
  if (slug === 'group-event-outfits') return '/group-outfits';
  if (slug === 'souvenirs-gifts') return '/souvenirs';
  if (slug === 'hair-beauty') return '/beauty';
  return `/shop?category=${encodeURIComponent(slug)}`;
}

export function HomePage() {
  const { settings, sections, categories, banners, testimonials, databaseConnected } =
    useStore();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroSlides = [
    {
      kicker: settings.hero_kicker || 'Fashion • Beauty • Customization • Branding',
      headline: settings.hero_headline || 'Custom Fashion,',
      highlight: settings.hero_subheadline_highlight || 'Made for You',
      description:
        settings.hero_description ||
        'From stylish outfits to branded souvenirs, we bring your ideas to life with elegance and class.',
      imageUrl: settings.hero_image_url || LOCAL_BRAND_ASSETS.heroImage,
      scriptText: settings.hero_script_text || 'Your Vision... Our Creation',
      primaryText: settings.hero_button_text || 'Explore Collections',
      primaryUrl: settings.hero_button_url || '/collections',
      secondaryText: settings.hero_secondary_button_text || 'Request a Custom Design',
      secondaryUrl: settings.hero_secondary_button_url || '/custom-design',
    },
    {
      kicker: 'Bespoke Aso Oke • Bridal & Party Couture',
      headline: 'Royal Heritage,',
      highlight: 'Tailored Today',
      description:
        'Hand-loomed Nigerian Aso Oke ensembles and coordinated Aso Ebi party outfits designed for unforgettable celebrations.',
      imageUrl:
        settings.aso_oke_banner_image_url || LOCAL_BRAND_ASSETS.asoOkeBannerImage,
      scriptText: 'Woven with Majesty',
      primaryText: settings.aso_oke_banner_button_text || 'Shop Aso Oke',
      primaryUrl: '/aso-oke',
      secondaryText: 'Group Outfit Enquiry',
      secondaryUrl: '/group-outfits',
    },
    {
      kicker: 'Your Sample • Precision Embroidery • Worldwide Delivery',
      headline: 'Your Ideas,',
      highlight: 'Our Creation',
      description:
        'Share a reference photo, choose custom colors or logos, and approve your bespoke outfit or branded souvenir hamper.',
      imageUrl:
        settings.custom_design_image_url || LOCAL_BRAND_ASSETS.customCreationImage,
      scriptText: 'Handcrafted for You',
      primaryText: 'Explore Souvenirs',
      primaryUrl: '/souvenirs',
      secondaryText: settings.custom_design_button_text || 'Request Custom Design',
      secondaryUrl: '/custom-design',
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % heroSlides.length);
    }, 6800);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingProducts(true);
      try {
        const [allPublished, recent, best] = await Promise.all([
          fetchPublishedProducts({ sortBy: 'newest', limit: 24 }),
          fetchPublishedProducts({ newArrivalsOnly: true, limit: 12 }),
          fetchPublishedProducts({ bestSellersOnly: true, limit: 12 }),
        ]);
        if (!active) return;
        const orderedHomeProducts = [...allPublished]
          .sort((a, b) => {
            if (a.is_featured === b.is_featured) return 0;
            return a.is_featured ? -1 : 1;
          })
          .slice(0, 10);
        const homeIds = new Set(orderedHomeProducts.map((p) => p.id));
        setFeaturedProducts(orderedHomeProducts);
        setNewArrivals(recent.filter((p) => !homeIds.has(p.id)).slice(0, 8));
        setBestSellers(best.filter((p) => !homeIds.has(p.id)).slice(0, 8));
      } finally {
        if (active) setLoadingProducts(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [databaseConnected]);

  const currentHero = heroSlides[heroIndex % heroSlides.length];

  // Prioritize the 6 signature homepage category cards matching the visual reference
  const homepageSixCategories: Category[] = (() => {
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    const picked = PRIMARY_SIX_SLUGS.map((slug) => bySlug.get(slug)).filter(
      (c): c is Category => Boolean(c)
    );
    if (picked.length >= 6) return picked.slice(0, 6);
    const remaining = categories.filter((c) => !PRIMARY_SIX_SLUGS.includes(c.slug));
    return [...picked, ...remaining].slice(0, 6);
  })();

  const trustItems = [
    { icon: Gem, title: 'Premium Quality', subtitle: 'You Can Trust' },
    { icon: Truck, title: 'Fast & Reliable', subtitle: 'Delivery' },
    { icon: Headphones, title: 'Dedicated Support', subtitle: 'Always Here' },
    { icon: ShieldCheck, title: 'Secure Shopping', subtitle: 'Shop with Confidence' },
  ];

  const processSteps =
    settings.process_steps && settings.process_steps.length === 4
      ? settings.process_steps
      : [
          { step: 1, title: 'Share Your Idea', subtitle: '(Upload Sample)' },
          { step: 2, title: 'We Design & Confirm', subtitle: '' },
          { step: 3, title: 'We Create with Care', subtitle: '' },
          { step: 4, title: 'You Receive Your Order', subtitle: '' },
        ];

  const processIcons = [Camera, PenTool, Scissors, CheckCircle2];

  const orderedSections = [...sections]
    .filter((s) => s.is_visible && s.section_key !== 'categories')
    .sort((a, b) => a.sort_order - b.sort_order);

  const activePromoBanner = banners.find((b) => b.placement === 'promo' && b.is_active);

  const renderDynamicSection = (sectionKey: string, title: string, subtitle: string) => {
    if (sectionKey === 'featured_products') {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5 sm:gap-7">
            <div className="lg:w-56 xl:w-60 shrink-0 flex flex-row lg:flex-col items-center lg:items-start justify-between gap-3 lg:pt-2">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2B082D] leading-tight">
                  {title || 'Featured Collection'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 leading-relaxed max-w-xs">
                  {subtitle || 'Elevate your style with our handpicked favourites.'}
                </p>
              </div>
              <div className="flex flex-col items-end lg:items-start gap-2 shrink-0 lg:mt-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs font-bold hover:brightness-105 transition-all shadow-sm whitespace-nowrap"
                >
                  <span>View All Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/collections"
                  className="hidden lg:inline-flex items-center gap-1 text-xs font-medium text-[#7D4B16] hover:text-[#3B0E3F] transition-colors"
                >
                  Browse All Collections →
                </Link>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-[#EADCCF] rounded-xl h-56 sm:h-72 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                  {featuredProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.08 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(idx, 5) * 0.04,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (sectionKey === 'new_arrivals' && newArrivals.length > 0) {
      return (
        <section
          key={sectionKey}
          className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 border-t border-[#EADCCF]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-5 sm:mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#2B082D]">
                {title}
              </h2>
              {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">{subtitle}</p>}
            </div>
            <Link
              to="/shop?filter=new"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#3B0E3F] hover:text-[#9A6B19] whitespace-nowrap"
            >
              View New Arrivals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'best_sellers' && bestSellers.length > 0) {
      return (
        <section
          key={sectionKey}
          className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 border-t border-[#EADCCF]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-5 sm:mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#2B082D]">
                {title}
              </h2>
              {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">{subtitle}</p>}
            </div>
            <Link
              to="/shop?sort=popular"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#3B0E3F] hover:text-[#9A6B19] whitespace-nowrap"
            >
              Shop Best Sellers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'promo_banner' && activePromoBanner) {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
          <div className="bg-[#2B082D] text-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-[#D4AF5A]/25">
            <div className="p-6 sm:p-12 flex flex-col justify-center">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#E8BE62] mb-2">
                {settings.business_name}
              </p>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold mb-3">
                {activePromoBanner.title}
              </h2>
              <p className="text-xs sm:text-base text-neutral-200 leading-relaxed mb-6">
                {activePromoBanner.subtitle}
              </p>
              <div>
                <Link
                  to={activePromoBanner.link_url || '/shop'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs sm:text-sm font-bold"
                >
                  {activePromoBanner.button_text || 'Explore'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="min-h-[220px] overflow-hidden">
              <SafeImage
                src={activePromoBanner.image_url}
                alt={activePromoBanner.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      );
    }

    if (sectionKey === 'testimonials' && testimonials.length > 0) {
      return (
        <section
          key={sectionKey}
          className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 border-t border-[#EADCCF]"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-2xl mx-auto mb-6 sm:mb-9"
          >
            <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#2B082D]">
              {title}
            </h2>
            {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-1.5">{subtitle}</p>}
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, idx) => (
              <motion.blockquote
                key={t.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-[#EADCCF] rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:border-[#D4AF5A] transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#D4AF5A] mb-3">
                    {Array.from({ length: t.rating }).map((_, starIdx) => (
                      <Star key={starIdx} className="w-4 h-4 fill-[#D4AF5A]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#242424] leading-relaxed">“{t.quote}”</p>
                </div>
                <footer className="mt-4 pt-3 border-t border-[#F4EAE0] text-xs">
                  <p className="font-semibold text-[#2B082D]">{t.customer_name}</p>
                  <p className="text-neutral-500">
                    {t.customer_role}
                    {t.location ? ` · ${t.location}` : ''}
                  </p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <>
      <SeoHead
        title={settings.seo_title}
        description={settings.seo_description}
        keywords={settings.seo_keywords}
        ogImage={settings.og_image_url || settings.hero_image_url}
        canonicalPath="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: settings.business_name,
          url: window.location.origin,
          description: settings.business_description,
        }}
      />

      {/* 1. ROYAL PURPLE & GOLD AFRICAN FASHION HERO SLIDER */}
      <section className="relative bg-[#250628] text-white overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-img-${heroIndex}`}
            initial={{ opacity: 0.55, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.65 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <SafeImage
              src={currentHero.imageUrl}
              alt={`${currentHero.headline} ${currentHero.highlight}`}
              loading="eager"
              className="w-full h-full object-cover object-top lg:object-[72%_18%]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(95deg, rgba(37,6,40,0.94) 0%, rgba(59,14,63,0.78) 42%, rgba(59,14,63,0.28) 72%, rgba(37,6,40,0.18) 100%)',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Left & Right Carousel Navigation Arrows */}
        <button
          type="button"
          onClick={() => setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
          aria-label="Previous hero slide"
          className="hidden sm:flex absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 hover:bg-black/45 border border-white/25 text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setHeroIndex((i) => (i + 1) % heroSlides.length)}
          aria-label="Next hero slide"
          className="hidden sm:flex absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 hover:bg-black/45 border border-white/25 text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Hero Typography & Actions */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-10 py-10 sm:py-16 lg:py-24 min-h-[290px] sm:min-h-[450px] lg:min-h-[530px] flex items-center justify-between gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-copy-${heroIndex}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl"
            >
              <span className="inline-block px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F5DC93] via-[#E8BE62] to-[#D4AF5A] text-[#250628] text-[10px] sm:text-xs font-semibold tracking-wide mb-3 sm:mb-4 shadow-sm">
                {currentHero.kicker}
              </span>

              <h1
                className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.04] text-white mb-2.5 sm:mb-4"
                style={{ textWrap: 'balance' }}
              >
                {currentHero.headline}
                <span className="block italic text-[#E8BE62] mt-0.5 sm:mt-1 font-semibold">
                  {currentHero.highlight}
                </span>
              </h1>

              <p className="text-xs sm:text-base text-[#FAF3E8]/95 leading-relaxed max-w-md mb-5 sm:mb-7">
                {currentHero.description}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                <Link
                  to={currentHero.primaryUrl}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#F3D88B] via-[#E8BE62] to-[#C89635] text-[#250628] text-xs sm:text-sm font-bold hover:brightness-105 transition-all shadow-lg"
                >
                  <span>{currentHero.primaryText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={currentHero.secondaryUrl}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full border border-[#E8BE62]/65 bg-[#1B041F]/65 backdrop-blur-xs text-white text-xs sm:text-sm font-semibold hover:border-[#E8BE62] hover:text-[#E8BE62] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8BE62]" />
                  <span>{currentHero.secondaryText}</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Signature Cursive Script Accent on Right Side matching Design Reference */}
          <div className="hidden lg:flex flex-col items-end justify-center self-center pr-6 select-none pointer-events-none">
            <p
              className="font-script text-4xl xl:text-5xl text-[#FCF6E8] leading-[1.05] text-right drop-shadow-[0_3px_14px_rgba(0,0,0,0.65)] max-w-[240px]"
            >
              {currentHero.scriptText}
            </p>
          </div>
        </div>

        {/* Hero Carousel Dots */}
        <div className="relative z-10 flex items-center justify-center gap-2 pb-4 sm:pb-5">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setHeroIndex(idx)}
              aria-label={`View slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === heroIndex ? 'w-6 bg-[#E8BE62]' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. SIX EDITORIAL CATEGORY CARDS ROW */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-4 sm:pt-7 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
          {homepageSixCategories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
            >
              <Link
                to={getCategoryDestination(cat.slug)}
                className="group bg-gradient-to-b from-[#FAF0E3] to-[#F3E2CD] border border-[#E7D4BC] hover:border-[#C89635] rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all h-full flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F9EFE3]">
                  <SafeImage
                    src={resolveCategoryImage(cat)}
                    alt={cat.name}
                    fallbackLabel={cat.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="px-2.5 py-2.5 sm:py-3 text-center flex-1 flex items-center justify-center">
                  <h2 className="text-[11px] sm:text-xs font-bold text-[#2D0D31] group-hover:text-[#9A6B19] leading-tight inline-flex items-center justify-center gap-1">
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3 h-3 text-[#8E5D1A] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </h2>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. FOUR SERVICE BENEFITS BAR */}
      <section className="bg-[#FAF2E5] border-y border-[#E9DAC5]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-5 grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-[#D4AF5A]/30 gap-3 lg:gap-0">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="flex items-center gap-2.5 sm:gap-3.5 lg:px-5 lg:first:pl-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/75 border border-[#E5D3B6] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8862D]" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#2D0D31] leading-tight truncate">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#6B5465] truncate">{item.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. SPLIT SHOWCASE: "YOUR IDEA, OUR CREATION" + "OUR CUSTOMIZATION PROCESS" */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 pb-4 sm:pt-8 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* Left Card: Your Idea, Our Creation */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-6 relative rounded-2xl overflow-hidden bg-[#2B082D] text-white min-h-[240px] sm:min-h-[265px] flex items-center shadow-md border border-[#D4AF5A]/25"
          >
            <SafeImage
              src={settings.custom_design_image_url || LOCAL_BRAND_ASSETS.customCreationImage}
              alt={settings.custom_design_title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(37,6,40,0.93) 0%, rgba(59,14,63,0.78) 54%, rgba(59,14,63,0.22) 100%)',
              }}
            />
            <div className="relative z-10 p-6 sm:p-8 max-w-md">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3D88B] mb-2">
                {settings.custom_design_title || 'Your Idea, Our Creation'}
              </h2>
              <p className="text-xs sm:text-sm text-[#FAF3E8]/90 leading-relaxed mb-5">
                {settings.custom_design_description}
              </p>
              <Link
                to="/custom-design"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs font-bold hover:brightness-105 transition-all shadow-sm"
              >
                <span>{settings.custom_design_button_text || 'Request Custom Design'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Right Card: 4-Step Illustrated Customization Process */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="lg:col-span-6 rounded-2xl border border-[#E5D3EC] p-5 sm:p-7 flex flex-col justify-between shadow-2xs"
            style={{
              background:
                'linear-gradient(135deg, #FBF4FB 0%, #F7EBFA 52%, #EFE0F4 100%)',
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D0D31]">
                {settings.process_title || 'Our Customization Process'}
              </h2>
              <Link
                to="/custom-design"
                className="text-[11px] font-semibold text-[#7E3484] hover:text-[#3B0E3F] whitespace-nowrap"
              >
                Start Now →
              </Link>
            </div>

            <div className="relative">
              {/* Connecting gold hairline bar behind badges on sm+ */}
              <div
                className="hidden sm:block absolute top-4 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-[#D4AF5A]/60 via-[#D4AF5A] to-[#D4AF5A]/60"
                aria-hidden="true"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                {processSteps.map((stepItem, idx) => {
                  const Icon = processIcons[idx % processIcons.length];
                  return (
                    <Link
                      key={stepItem.step}
                      to="/custom-design"
                      className="group flex flex-col items-center text-center"
                    >
                      <span className="w-8 h-8 rounded-full bg-gradient-to-b from-[#F5DC93] to-[#C89635] text-[#250628] font-bold text-xs flex items-center justify-center shadow-sm mb-3 ring-4 ring-[#FBF4FB]">
                        {stepItem.step}
                      </span>
                      <div className="w-11 h-11 rounded-xl bg-white/85 border border-[#E2CCE8] flex items-center justify-center mb-2.5 text-[#3B0E3F] group-hover:scale-105 group-hover:border-[#C89635] transition-all shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-[11px] sm:text-xs font-bold text-[#2D0D31] leading-snug">
                        {stepItem.title}
                      </p>
                      {stepItem.subtitle && (
                        <p className="text-[10px] text-[#6B5465] mt-0.5 leading-tight">
                          {stepItem.subtitle}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. DUAL PROMO BANNERS: ASO OKE & PARTY COLLECTIONS | BRANDING & SOUVENIRS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Left Banner: Aso Oke & Party Collections */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45 }}
            className="relative rounded-2xl overflow-hidden bg-[#3B0E3F] text-white min-h-[210px] sm:min-h-[235px] flex items-center shadow-md border border-[#D4AF5A]/20 group"
          >
            <SafeImage
              src={settings.aso_oke_banner_image_url || LOCAL_BRAND_ASSETS.asoOkeBannerImage}
              alt={settings.aso_oke_banner_title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(64,11,55,0.94) 0%, rgba(90,21,60,0.78) 48%, rgba(64,11,55,0.18) 100%)',
              }}
            />
            <div className="relative z-10 p-6 sm:p-7 max-w-xs">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight mb-2">
                {settings.aso_oke_banner_title || 'Aso Oke & Party Collections'}
              </h2>
              <p className="text-xs sm:text-sm text-[#F7ECE2]/90 leading-relaxed mb-4">
                {settings.aso_oke_banner_description}
              </p>
              <Link
                to="/aso-oke"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs font-bold hover:brightness-105 transition-all"
              >
                <span>{settings.aso_oke_banner_button_text || 'Shop Aso Oke'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Right Banner: Branding & Souvenirs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="relative rounded-2xl overflow-hidden bg-[#2B082D] text-white min-h-[210px] sm:min-h-[235px] flex items-center shadow-md border border-[#D4AF5A]/20 group"
          >
            <SafeImage
              src={settings.souvenir_banner_image_url || LOCAL_BRAND_ASSETS.souvenirsBannerImage}
              alt={settings.souvenir_banner_title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(43,8,45,0.95) 0%, rgba(74,18,78,0.8) 50%, rgba(43,8,45,0.22) 100%)',
              }}
            />
            <div className="relative z-10 p-6 sm:p-7 max-w-xs">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight mb-2">
                {settings.souvenir_banner_title || 'Branding & Souvenirs'}
              </h2>
              <p className="text-xs sm:text-sm text-[#F7ECE2]/90 leading-relaxed mb-4">
                {settings.souvenir_banner_description}
              </p>
              <Link
                to="/souvenirs"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs font-bold hover:brightness-105 transition-all"
              >
                <span>{settings.souvenir_banner_button_text || 'Explore Souvenirs'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. ADMIN-CONTROLLED STOREFRONT PRODUCTS, NEW ARRIVALS & TESTIMONIALS */}
      {orderedSections.map((sec) =>
        renderDynamicSection(sec.section_key, sec.title, sec.subtitle)
      )}
    </>
  );
}
