import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { LOCAL_BRAND_ASSETS, resolveCategoryImage } from '@/src/lib/defaults';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';
import { SafeImage } from '@/src/components/SafeImage';
import { SeoHead } from '@/src/components/SeoHead';

export function CollectionsPage() {
  const { settings, categories } = useStore();

  return (
    <>
      <SeoHead
        title={`Collections | ${settings.business_name}`}
        description="Explore curated luxury fashion collections across Women's Fashion, Men's Fashion, Handbags, Footwear, and Fine Jewellery."
        canonicalPath="/collections"
      />
      <div className="bg-[#090909] text-white border-b border-[#D4AF5A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-xs uppercase tracking-[0.24em] text-[#E8BE62] mb-2">
            MCFD J GLOBAL VENTURES
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold">
            Fashion Houses &amp; Collections
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop?category=${encodeURIComponent(cat.slug)}`}
            className="group bg-white border border-[#E7DEC9] rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden bg-[#F1E8DC]">
              <SafeImage
                src={resolveCategoryImage(cat)}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#090909] group-hover:text-[#9A7422] transition-colors">
                  {cat.name}
                </h2>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#090909] mt-5">
                Explore Category
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF5A]" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function AboutPage() {
  const { settings } = useStore();

  return (
    <>
      <SeoHead
        title={`About Us | ${settings.business_name}`}
        description={settings.about_intro}
        canonicalPath="/about"
      />
      <div className="bg-[#090909] text-white border-b border-[#D4AF5A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-xs uppercase tracking-[0.24em] text-[#E8BE62] mb-2">
            Our Story
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold">
            {settings.business_name}
          </h1>
          <p className="text-base text-neutral-300 mt-3 max-w-2xl leading-relaxed">
            {settings.about_intro}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#E7DEC9] bg-white">
            <SafeImage
              src={settings.about_image_url || LOCAL_BRAND_ASSETS.aboutImage}
              alt="MCFD J GLOBAL VENTURES Atelier Craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-[#090909] mb-2">
                Our Mission
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                {settings.about_mission}
              </p>
            </div>
            <div>
              <h2 className="font-serif text-3xl font-semibold text-[#090909] mb-2">
                Our Vision
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                {settings.about_vision}
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#090909] text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
            >
              Browse Our Collection
              <ArrowRight className="w-4 h-4 text-[#D4AF5A]" />
            </Link>
          </div>
        </div>

        {settings.about_values && settings.about_values.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {settings.about_values.map((val, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-2"
              >
                <span className="text-xs font-mono text-[#9A7422]">0{idx + 1}.</span>
                <h3 className="font-serif text-2xl font-semibold text-[#090909]">
                  {val.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ContactPage() {
  const { settings } = useStore();
  const whatsappConfirmed =
    settings.whatsapp_country_confirmed &&
    normalizeWhatsAppDigits(settings.whatsapp_number).length >= 11;

  const waUrl = whatsappConfirmed
    ? buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_support_message)
    : '';

  return (
    <>
      <SeoHead
        title={`Contact & Concierge | ${settings.business_name}`}
        description="Reach the MCFD J GLOBAL VENTURES personal styling and client concierge team."
        canonicalPath="/contact"
      />
      <div className="bg-[#090909] text-white border-b border-[#D4AF5A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-xs uppercase tracking-[0.24em] text-[#E8BE62] mb-2">
            Client Services
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold">
            Concierge &amp; Inquiries
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-7 space-y-5">
          <h2 className="font-serif text-2xl font-semibold text-[#090909]">
            Direct Atelier Contact
          </h2>
          <div className="space-y-4 text-sm text-neutral-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#9A7422] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#090909]">Atelier &amp; Dispatch</p>
                <p>{settings.business_address}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{settings.service_regions}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#9A7422] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#090909]">Email</p>
                <a
                  href={`mailto:${settings.business_email}`}
                  className="text-[#9A7422] hover:underline"
                >
                  {settings.business_email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#9A7422] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#090909]">Phone</p>
                <p>{settings.business_phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#090909] text-white border border-[#D4AF5A]/30 rounded-xl p-7 flex flex-col justify-between space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#E8BE62] mb-2">
              WhatsApp Personal Shopping
            </p>
            <h2 className="font-serif text-2xl font-semibold mb-3">
              Instant Concierge Assistance
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Speak directly with our team for sizing recommendations, international shipping timelines, or custom multi-item orders.
            </p>
          </div>
          {whatsappConfirmed ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp Now
            </a>
          ) : (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300">
              WhatsApp direct chat is awaiting administrator country code confirmation in Store Settings.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function PolicyPage({ type }: { type: 'privacy' | 'terms' | 'shipping' }) {
  const { settings } = useStore();

  const meta =
    type === 'privacy'
      ? {
          title: 'Privacy Policy',
          body: settings.privacy_policy,
          path: '/privacy',
        }
      : type === 'terms'
      ? {
          title: 'Terms & Conditions',
          body: settings.terms_conditions,
          path: '/terms',
        }
      : {
          title: 'Shipping & Returns',
          body: `${settings.shipping_info}\n\nReturns & Exchanges:\n${settings.returns_policy}`,
          path: '/shipping',
        };

  return (
    <>
      <SeoHead
        title={`${meta.title} | ${settings.business_name}`}
        description={meta.body.slice(0, 150)}
        canonicalPath={meta.path}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-xs uppercase tracking-[0.22em] text-[#9A7422] font-medium mb-2">
          MCFD J GLOBAL VENTURES
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[#090909] mb-6">
          {meta.title}
        </h1>
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-8 text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line">
          {meta.body}
        </div>
      </div>
    </>
  );
}
