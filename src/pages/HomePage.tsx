import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gem,
  Headphones,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import { LOCAL_BRAND_ASSETS, resolveCategoryImage } from '@/src/lib/defaults';
import {
  fetchPublishedProducts,
  subscribeToNewsletter,
} from '@/src/services/storefrontService';
import type { Product } from '@/src/types/store';
import { ProductCard } from '@/src/components/ProductCard';
import { SafeImage } from '@/src/components/SafeImage';
import { SeoHead } from '@/src/components/SeoHead';

export function HomePage() {
  const { settings, sections, categories, banners, testimonials, databaseConnected } =
    useStore();
  const { showToast } = useToast();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingProducts(true);
      try {
        const [allPublished, recent, best] = await Promise.all([
          fetchPublishedProducts({ sortBy: 'newest', limit: 10 }),
          fetchPublishedProducts({ newArrivalsOnly: true, limit: 12 }),
          fetchPublishedProducts({ bestSellersOnly: true, limit: 12 }),
        ]);
        if (!active) return;
        // Prioritize featured items first, displaying 10 published pieces directly on the homepage
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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      await subscribeToNewsletter(newsletterEmail);
      showToast('Thank you for joining the MCFD J GLOBAL VENTURES private client list.');
      setNewsletterEmail('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to subscribe.', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const orderedSections = [...sections]
    .filter((s) => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  const activePromoBanner = banners.find((b) => b.placement === 'promo' && b.is_active);

  const trustItems = [
    {
      icon: Gem,
      title: 'Premium Quality',
      subtitle: 'Fashion You Can Trust',
    },
    {
      icon: Truck,
      title: 'Fast & Reliable Delivery',
      subtitle: 'Worldwide',
    },
    {
      icon: Headphones,
      title: 'Dedicated Support',
      subtitle: 'Always Here',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Shopping',
      subtitle: 'Shop with Confidence',
    },
  ];

  const renderSection = (sectionKey: string, title: string, subtitle: string) => {
    if (sectionKey === 'categories') {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 pb-4 sm:py-10">
          <div className="flex items-center justify-center gap-3 sm:gap-5 mb-4 sm:mb-7">
            <span className="h-px flex-1 max-w-[48px] sm:max-w-[160px] bg-gradient-to-r from-transparent to-[#D4AF5A]/70" />
            <h2 className="font-serif text-xl sm:text-3xl font-semibold text-[#090909] text-center">
              Shop Our <span className="text-[#9A7422]">Collections</span>
            </h2>
            <span className="h-px flex-1 max-w-[48px] sm:max-w-[160px] bg-gradient-to-l from-transparent to-[#D4AF5A]/70" />
          </div>

          {/* Mobile: slim horizontal 1-row category strip; Tablet/Desktop: 5-col editorial grid */}
          <div className="flex overflow-x-auto gap-2.5 pb-1 snap-x sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-4 sm:overflow-visible sm:pb-0">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                className="group relative w-[124px] shrink-0 snap-start aspect-[4/3] sm:w-auto sm:aspect-[5/4] rounded-xl overflow-hidden bg-[#090909] block shadow-sm border border-[#E7DEC9]/60"
              >
                <SafeImage
                  src={resolveCategoryImage(cat)}
                  alt={cat.name}
                  fallbackLabel={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 flex items-end justify-between gap-1.5">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xs sm:text-lg lg:text-xl font-semibold text-white leading-tight truncate">
                      {cat.name}
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#FAF5EE]/90 mt-1 font-medium">
                      Shop Now
                      <ArrowRight className="w-3 h-3 text-[#E8BE62]" />
                    </span>
                  </div>
                  <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#D4AF5A] text-[#090909] flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'featured_products') {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5 sm:gap-7">
            {/* Left Intro Block matching reference storefront design */}
            <div className="lg:w-56 xl:w-60 shrink-0 flex flex-row lg:flex-col items-center lg:items-start justify-between gap-3 lg:pt-2">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#090909] leading-tight">
                  {title || 'Featured Collection'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 leading-relaxed max-w-xs">
                  {subtitle || 'Elevate your style with our handpicked favourites.'}
                </p>
              </div>
              <div className="flex flex-col items-end lg:items-start gap-2 shrink-0 lg:mt-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#D4AF5A] text-[#090909] text-xs font-semibold hover:brightness-105 transition-all shadow-sm whitespace-nowrap"
                >
                  <span>View All Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/collections"
                  className="hidden lg:inline-flex items-center gap-1 text-xs font-medium text-[#9A7422] hover:text-[#090909] transition-colors"
                >
                  Browse Store Categories →
                </Link>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-[#E7DEC9] rounded-xl h-56 sm:h-72 animate-pulse"
                    />
                  ))}
                </div>
              ) : featuredProducts.length === 0 ? (
                <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 sm:p-10 text-center">
                  <p className="font-serif text-xl sm:text-2xl font-semibold text-[#090909] mb-2">
                    New Season Collection Arriving Shortly
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto mb-5">
                    Our curated seasonal pieces from MCFD J GLOBAL VENTURES are being prepared for release. Browse our store or reach out to our concierge for private styling.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <Link
                      to="/shop"
                      className="px-5 py-2.5 rounded-lg bg-[#090909] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      Open Store Catalogue
                    </Link>
                    <Link
                      to="/contact"
                      className="px-5 py-2.5 rounded-lg border border-[#090909] text-[#090909] text-xs font-semibold hover:bg-[#F1E8DC] transition-colors"
                    >
                      Contact Concierge
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                    {featuredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  <div className="mt-6 lg:hidden flex flex-wrap items-center justify-center gap-2.5">
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#090909] text-[#E8BE62] text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      Visit Store for More Products
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/collections"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#090909] text-[#090909] text-xs font-semibold hover:bg-[#F1E8DC] transition-colors"
                    >
                      Categories
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (sectionKey === 'new_arrivals' && newArrivals.length > 0) {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 border-t border-[#E5D9C5]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-5 sm:mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#090909]">
                {title}
              </h2>
              {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">{subtitle}</p>}
            </div>
            <Link
              to="/shop?filter=new"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#090909] hover:text-[#9A7422] whitespace-nowrap"
            >
              View New Arrivals
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'best_sellers' && bestSellers.length > 0) {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 border-t border-[#E5D9C5]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-5 sm:mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#090909]">
                {title}
              </h2>
              {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">{subtitle}</p>}
            </div>
            <Link
              to="/shop?sort=popular"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#090909] hover:text-[#9A7422] whitespace-nowrap"
            >
              Shop Best Sellers
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'promo_banner') {
      const bannerImg =
        activePromoBanner?.image_url || settings.about_image_url || LOCAL_BRAND_ASSETS.aboutImage;
      const bannerTitle = activePromoBanner?.title || title;
      const bannerSubtitle = activePromoBanner?.subtitle || subtitle;
      const bannerUrl = activePromoBanner?.link_url || '/about';
      const bannerBtn = activePromoBanner?.button_text || 'Discover Our Atelier';

      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 py-7 sm:py-12">
          <div className="bg-[#090909] text-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-stretch border border-[#D4AF5A]/25">
            <div className="p-6 sm:p-12 lg:p-14 flex flex-col justify-center">
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-[#E8BE62] mb-2 sm:mb-3">
                MCFD J GLOBAL VENTURES
              </p>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-white leading-tight mb-3 sm:mb-4">
                {bannerTitle}
              </h2>
              <p className="text-xs sm:text-base text-neutral-300 leading-relaxed mb-5 sm:mb-7 max-w-lg">
                {bannerSubtitle}
              </p>
              <div>
                <Link
                  to={bannerUrl}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#D4AF5A] text-[#090909] text-xs sm:text-sm font-semibold hover:bg-[#E8BE62] transition-colors"
                >
                  {bannerBtn}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[200px] sm:min-h-[300px] lg:min-h-full">
              <SafeImage
                src={bannerImg}
                alt={bannerTitle}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      );
    }

    if (sectionKey === 'testimonials' && testimonials.length > 0) {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 border-t border-[#E5D9C5]">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-9">
            <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#090909]">
              {title}
            </h2>
            {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-1.5">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <blockquote
                key={t.id}
                className="bg-white border border-[#E7DEC9] rounded-xl p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#D4AF5A] mb-3">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-[#D4AF5A]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#242424] leading-relaxed">“{t.quote}”</p>
                </div>
                <footer className="mt-4 pt-3 border-t border-[#F1E8DC] text-xs">
                  <p className="font-semibold text-[#090909]">{t.customer_name}</p>
                  <p className="text-neutral-500">
                    {t.customer_role}
                    {t.location ? ` · ${t.location}` : ''}
                  </p>
                </footer>
              </blockquote>
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

      {/* Compact Editorial Hero on Mobile / Full Luxury Hero on Desktop */}
      <section className="relative bg-[#090909] text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={settings.hero_image_url || LOCAL_BRAND_ASSETS.heroImage}
            alt="MCFD J GLOBAL VENTURES Luxury Fashion Campaign"
            className="w-full h-full object-cover object-top lg:object-[75%_15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/85 sm:via-[#090909]/75 to-[#090909]/30" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 82% 55%, rgba(212,175,90,0.22) 0%, rgba(212,175,90,0) 48%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-20 lg:py-28 min-h-[200px] sm:min-h-[460px] lg:min-h-[580px] flex items-center">
          <div className="max-w-xl">
            <p className="text-[10px] sm:text-xs tracking-[0.28em] uppercase text-[#E8BE62] font-medium mb-1.5 sm:mb-4">
              {settings.business_name}
            </p>
            <h1
              className="font-serif text-2xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] text-white mb-2 sm:mb-5"
              style={{ textWrap: 'balance' }}
            >
              {settings.hero_headline}
              <span className="block mt-0.5 sm:mt-1">
                {(() => {
                  const parts = (settings.hero_subheadline_highlight || 'Elegance Delivered.').trim().split(/\s+/);
                  const first = parts[0] || '';
                  const rest = parts.slice(1).join(' ');
                  return (
                    <>
                      <span className="italic text-[#E8BE62] font-medium">{first}</span>
                      {rest ? <span className="text-white"> {rest}</span> : null}
                    </>
                  );
                })()}
              </span>
            </h1>
            <p className="text-xs sm:text-base text-neutral-200 leading-relaxed max-w-md mb-4 sm:mb-8 line-clamp-2 sm:line-clamp-none">
              {settings.hero_description}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              <Link
                to={settings.hero_button_url || '/shop'}
                className="inline-flex items-center gap-2 px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#D4AF5A] text-[#090909] text-xs sm:text-sm font-semibold hover:brightness-105 transition-all shadow-lg"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{settings.hero_button_text || 'Shop the Collection'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link
                to="/collections"
                className="hidden sm:inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/30 bg-black/30 backdrop-blur-xs text-white text-sm font-medium hover:border-[#D4AF5A] hover:text-[#E8BE62] transition-colors"
              >
                Explore Houses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Cream Trust Strip */}
      <section className="bg-[#FAF5EE] border-b border-[#E5D9C5]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-[#D4AF5A]/25 gap-x-3 gap-y-2.5 sm:gap-y-4 lg:gap-0">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-2 sm:gap-3.5 lg:px-5 lg:first:pl-0"
              >
                <Icon className="w-4 h-4 sm:w-7 sm:h-7 text-[#B89038] shrink-0" strokeWidth={1.6} />
                <div className="min-w-0">
                  <h3 className="text-[11px] sm:text-sm font-semibold text-[#090909] leading-tight truncate">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-neutral-600 truncate">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Admin-Ordered Dynamic Homepage Sections */}
      {orderedSections.map((sec) => renderSection(sec.section_key, sec.title, sec.subtitle))}

      {/* Private Client Newsletter */}
      <section className="bg-[#F1E8DC] border-t border-[#E2D6C1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
          <Mail className="w-6 h-6 text-[#9A7422] mx-auto mb-3" />
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#090909] mb-2">
            Private Client Dispatch
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mb-6">
            Receive seasonal lookbooks, limited-edition releases, and private atelier invitations from MCFD J GLOBAL VENTURES.
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg bg-white border border-[#D8CBB4] text-sm text-[#090909] focus:outline-none focus:border-[#090909]"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="px-6 py-3 rounded-lg bg-[#090909] text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
