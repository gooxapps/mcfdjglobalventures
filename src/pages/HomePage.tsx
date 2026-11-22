import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gem,
  Globe,
  Headphones,
  ShieldCheck,
  Star,
  Mail,
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
  const { settings, sections, categories, banners, testimonials, supabaseConnected } =
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
        const [feat, recent, best] = await Promise.all([
          fetchPublishedProducts({ featuredOnly: true, limit: 8 }),
          fetchPublishedProducts({ newArrivalsOnly: true, limit: 4 }),
          fetchPublishedProducts({ bestSellersOnly: true, limit: 4 }),
        ]);
        if (!active) return;
        // Fallback to newest published if featured flag not yet toggled on first items
        if (feat.length === 0 && supabaseConnected) {
          const fallbackLatest = await fetchPublishedProducts({ sortBy: 'newest', limit: 8 });
          if (active) setFeaturedProducts(fallbackLatest);
        } else {
          setFeaturedProducts(feat);
        }
        setNewArrivals(recent);
        setBestSellers(best);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [supabaseConnected]);

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
      subtitle: 'Curated luxury textiles & craftsmanship',
    },
    {
      icon: Globe,
      title: 'Worldwide Delivery',
      subtitle: 'Insured international courier dispatch',
    },
    {
      icon: Headphones,
      title: 'Dedicated Concierge',
      subtitle: 'Direct WhatsApp styling & order support',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Ordering',
      subtitle: 'Transparent availability & invoice confirmation',
    },
  ];

  const renderSection = (sectionKey: string, title: string, subtitle: string) => {
    if (sectionKey === 'categories') {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#9A7422] font-medium mb-2">
                MCFD J Houses
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#090909]">
                {title}
              </h2>
              {subtitle && <p className="text-sm text-neutral-600 mt-1.5 max-w-xl">{subtitle}</p>}
            </div>
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#090909] hover:text-[#9A7422] transition-colors whitespace-nowrap"
            >
              View All Collections
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-[#090909] block"
              >
                <SafeImage
                  src={resolveCategoryImage(cat)}
                  alt={cat.name}
                  fallbackLabel={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-white leading-tight">
                      {cat.name}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#E8BE62] mt-1.5 font-medium">
                      Shop Now
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'featured_products') {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-[#E5D9C5]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#090909]">
                {title}
              </h2>
              {subtitle && <p className="text-sm text-neutral-600 mt-1.5 max-w-xl">{subtitle}</p>}
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#090909] hover:text-[#9A7422] whitespace-nowrap"
            >
              Browse Full Catalogue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E7DEC9] rounded-xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="bg-white border border-[#E7DEC9] rounded-xl p-10 text-center">
              <p className="font-serif text-2xl font-semibold text-[#090909] mb-2">
                {supabaseConnected
                  ? 'New Season Collection Arriving Shortly'
                  : 'Storefront Ready for Live Inventory'}
              </p>
              <p className="text-sm text-neutral-600 max-w-lg mx-auto mb-6">
                {supabaseConnected
                  ? 'Products published by the store administrator in the MCFD J dashboard appear here automatically.'
                  : 'Connect your Supabase project and publish products via the Admin Dashboard to populate the live boutique.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/shop"
                  className="px-5 py-2.5 rounded-lg bg-[#090909] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Open Shop Catalogue
                </Link>
                <Link
                  to="/admin"
                  className="px-5 py-2.5 rounded-lg border border-[#090909] text-[#090909] text-xs font-semibold hover:bg-[#F1E8DC] transition-colors"
                >
                  Go to Admin Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      );
    }

    if (sectionKey === 'new_arrivals' && newArrivals.length > 0) {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-[#E5D9C5]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#090909]">
                {title}
              </h2>
              {subtitle && <p className="text-sm text-neutral-600 mt-1.5">{subtitle}</p>}
            </div>
            <Link
              to="/shop?filter=new"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#090909] hover:text-[#9A7422] whitespace-nowrap"
            >
              View New Arrivals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'best_sellers' && bestSellers.length > 0) {
      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-[#E5D9C5]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#090909]">
                {title}
              </h2>
              {subtitle && <p className="text-sm text-neutral-600 mt-1.5">{subtitle}</p>}
            </div>
            <Link
              to="/shop?sort=popular"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#090909] hover:text-[#9A7422] whitespace-nowrap"
            >
              Shop Best Sellers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === 'promo_banner') {
      const bannerImg = activePromoBanner?.image_url || settings.about_image_url || LOCAL_BRAND_ASSETS.aboutImage;
      const bannerTitle = activePromoBanner?.title || title;
      const bannerSubtitle = activePromoBanner?.subtitle || subtitle;
      const bannerUrl = activePromoBanner?.link_url || '/about';
      const bannerBtn = activePromoBanner?.button_text || 'Discover Our Atelier';

      return (
        <section key={sectionKey} className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-[#090909] text-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-stretch border border-[#D4AF5A]/25">
            <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.24em] text-[#E8BE62] mb-3">
                MCFD J GLOBAL VENTURES
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
                {bannerTitle}
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-8 max-w-lg">
                {bannerSubtitle}
              </p>
              <div>
                <Link
                  to={bannerUrl}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#D4AF5A] text-[#090909] text-sm font-semibold hover:bg-[#E8BE62] transition-colors"
                >
                  {bannerBtn}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[280px] lg:min-h-full">
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
        <section key={sectionKey} className="max-w-7xl mx-auto px-4 sm:px-6 py-14 border-t border-[#E5D9C5]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#090909]">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-neutral-600 mt-2">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <blockquote
                key={t.id}
                className="bg-white border border-[#E7DEC9] rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#D4AF5A] mb-3">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-[#D4AF5A]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#242424] leading-relaxed">“{t.quote}”</p>
                </div>
                <footer className="mt-5 pt-4 border-t border-[#F1E8DC] text-xs">
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

      {/* Hero Section */}
      <section className="relative bg-[#090909] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[540px] lg:min-h-[600px]">
          <div className="lg:col-span-6 px-4 sm:px-6 py-14 sm:py-20 flex flex-col justify-center relative z-10">
            <p className="text-xs tracking-[0.28em] uppercase text-[#E8BE62] font-medium mb-4">
              {settings.business_name}
            </p>
            <h1
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.06] text-white mb-5"
              style={{ textWrap: 'balance' }}
            >
              {settings.hero_headline}{' '}
              <span className="block italic text-[#E8BE62] font-medium mt-1">
                {settings.hero_subheadline_highlight}
              </span>
            </h1>
            <p className="text-base text-neutral-300 leading-relaxed max-w-lg mb-8">
              {settings.hero_description}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={settings.hero_button_url || '/shop'}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#D4AF5A] text-[#090909] text-sm font-semibold hover:bg-[#E8BE62] transition-all hover:-translate-y-0.5 shadow-lg"
              >
                {settings.hero_button_text || 'Shop the Collection'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/collections"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-white/25 text-white text-sm font-medium hover:border-[#D4AF5A] hover:text-[#E8BE62] transition-colors"
              >
                Explore Houses
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[340px] lg:min-h-full">
            <SafeImage
              src={settings.hero_image_url || LOCAL_BRAND_ASSETS.heroImage}
              alt="MCFD J GLOBAL VENTURES Luxury Fashion Campaign"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/25 to-transparent lg:block hidden" />
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-[#F1E8DC] border-y border-[#E2D6C1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#090909] text-[#D4AF5A] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#090909]">{item.title}</h3>
                  <p className="text-xs text-neutral-600 mt-0.5">{item.subtitle}</p>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
          <Mail className="w-6 h-6 text-[#9A7422] mx-auto mb-3" />
          <h2 className="font-serif text-3xl font-semibold text-[#090909] mb-2">
            Private Client Dispatch
          </h2>
          <p className="text-sm text-neutral-600 mb-6">
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
