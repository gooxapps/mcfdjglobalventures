import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Gift,
  Loader2,
  MessageCircle,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import { LOCAL_BRAND_ASSETS } from '@/src/lib/defaults';
import {
  fetchPublishedProducts,
  submitAsoOkeEnquiry,
  uploadPublicSampleImage,
} from '@/src/services/storefrontService';
import type { AsoOkeEnquiry, Product } from '@/src/types/store';
import { ProductCard } from '@/src/components/ProductCard';
import { SafeImage } from '@/src/components/SafeImage';
import { SeoHead } from '@/src/components/SeoHead';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

const ASO_OKE_PILLARS = [
  {
    title: 'Aso Oke Fabrics',
    description:
      'Hand-loomed Nigerian heritage weaves in royal plum, champagne gold, wine burgundy, and ivory.',
    tag: 'Signature Weaves',
  },
  {
    title: 'Traditional Wedding Outfits',
    description:
      'Regal couple sets featuring Agbada, Kufi, sculpted Gele, Ipele, and tailored Iro & Buba.',
    tag: 'Bridal & Groom',
  },
  {
    title: 'Party Outfits',
    description:
      'Statement beaded lace, silk kaftans, and celebration attire tailored for milestones and galas.',
    tag: 'Owambe & Gala',
  },
  {
    title: 'Matching Group Outfits',
    description:
      'Coordinated Aso Ebi fabric bundles and bespoke sizing for bridal trains, groomsmen, and families.',
    tag: 'Group Coordination',
  },
  {
    title: 'Wedding & Event Collections',
    description:
      'End-to-end styling packages for traditional engagements, naming ceremonies, and anniversaries.',
    tag: 'Event Packages',
  },
  {
    title: 'Custom Group Branding',
    description:
      'Personalized family crests, monograms, uniform trims, and coordinated guest souvenir hampers.',
    tag: 'Bespoke Identity',
  },
];

export function AsoOkeAndGroupPage({ mode = 'aso-oke' }: { mode?: 'aso-oke' | 'group' }) {
  const { settings, databaseConnected } = useStore();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [enquiryType, setEnquiryType] = useState(
    mode === 'group' ? 'Matching Group Outfits' : 'Aso Oke Fabrics'
  );
  const [groupSize, setGroupSize] = useState('11-25 Guests');
  const [quantity, setQuantity] = useState(10);
  const [eventDate, setEventDate] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<AsoOkeEnquiry | null>(null);

  useEffect(() => {
    setEnquiryType(mode === 'group' ? 'Matching Group Outfits' : 'Aso Oke Fabrics');
  }, [mode]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [asoProducts, groupProducts] = await Promise.all([
          fetchPublishedProducts({ categorySlug: 'aso-oke-traditional', limit: 8 }),
          fetchPublishedProducts({ categorySlug: 'group-event-outfits', limit: 8 }),
        ]);
        if (!active) return;
        const merged =
          mode === 'group'
            ? [...groupProducts, ...asoProducts]
            : [...asoProducts, ...groupProducts];
        const unique = Array.from(new Map(merged.map((p) => [p.id, p])).values());
        setProducts(unique);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [mode, databaseConnected]);

  const handleUploadSample = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadPublicSampleImage(file);
      setReferenceImageUrl(url);
      showToast('Reference sample image attached.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to upload sample.', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsappNumber.trim()) {
      showToast('Please enter your name and WhatsApp number.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitAsoOkeEnquiry({
        name,
        email,
        whatsapp_number: whatsappNumber,
        enquiry_type: enquiryType,
        group_size: groupSize,
        quantity,
        event_date: eventDate,
        delivery_location: deliveryLocation,
        reference_image_url: referenceImageUrl,
        notes,
      });
      setSubmittedEnquiry(res.enquiry);
      showToast(`Enquiry ${res.enquiry.enquiry_reference} submitted!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUrl = (() => {
    const digits = normalizeWhatsAppDigits(settings.whatsapp_number);
    const targetDigits = digits.length === 10 ? `1${digits}` : digits;
    if (!submittedEnquiry || targetDigits.length < 10) return '';
    const msg = [
      `Hello MCFD J Global Ventures, here is my Aso Oke / Group Outfit Enquiry:`,
      `Reference: ${submittedEnquiry.enquiry_reference}`,
      `Name: ${submittedEnquiry.name}`,
      `Category: ${submittedEnquiry.enquiry_type}`,
      `Group Size: ${submittedEnquiry.group_size} (Qty: ${submittedEnquiry.quantity})`,
      submittedEnquiry.event_date ? `Event Date: ${submittedEnquiry.event_date}` : '',
      submittedEnquiry.delivery_location ? `Location: ${submittedEnquiry.delivery_location}` : '',
      submittedEnquiry.notes ? `Notes: ${submittedEnquiry.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    return buildWhatsAppUrl(targetDigits, msg);
  })();

  const isGroup = mode === 'group';

  return (
    <>
      <SeoHead
        title={`${isGroup ? 'Group & Event Outfits' : 'Aso Oke & Traditional Couture'} | ${settings.business_name}`}
        description="Hand-loomed Aso Oke fabrics, traditional wedding couple outfits, matching Aso Ebi party packs, and custom group branding delivered worldwide."
        canonicalPath={isGroup ? '/group-outfits' : '/aso-oke'}
      />

      {/* Page Banner */}
      <section className="relative bg-[#3B0E3F] text-white overflow-hidden">
        <SafeImage
          src={
            isGroup
              ? LOCAL_BRAND_ASSETS.categoryImages['group-event-outfits']
              : LOCAL_BRAND_ASSETS.heroImage
          }
          alt="Aso Oke and Group Event Collections"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(37,6,40,0.95) 0%, rgba(64,11,55,0.82) 55%, rgba(90,21,60,0.65) 100%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F3D88B] to-[#D4AF5A] text-[#250628] text-xs font-bold mb-4">
              {isGroup ? <Users className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
              {isGroup ? 'Bridal Trains • Family Aso Ebi • Event Styling' : 'Heritage Textiles & Celebration Attire'}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight mb-3">
              {isGroup ? 'Group & Event Outfits' : 'Aso Oke & Party Collections'}
            </h1>
            <p className="text-sm sm:text-base text-[#FAF3E8]/90 leading-relaxed mb-6">
              Elegant traditional fabrics, tailored couple ensembles, and coordinated group outfits crafted for unforgettable weddings and milestones.
            </p>
            <a
              href="#aso-oke-enquiry-form"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs sm:text-sm font-bold hover:brightness-105 transition-all"
            >
              Submit Group / Aso Oke Enquiry
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Dedicated Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#2B082D]">
            Crafted for Weddings, Milestones &amp; Group Celebrations
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1.5">
            From individual bridal Aso Oke bundles to 100+ guest Aso Ebi coordination and custom group branding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {ASO_OKE_PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className="bg-white border border-[#EADCCF] rounded-2xl p-6 hover:border-[#C89635] transition-colors shadow-2xs"
            >
              <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7D4B16] bg-[#FAF2E5] px-2.5 py-1 rounded-md mb-3">
                {pillar.tag}
              </span>
              <h3 className="font-serif text-xl font-bold text-[#2D0D31] mb-1.5">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Ready-to-Shop Aso Oke & Group Products */}
      <section className="bg-[#FAF2E5]/70 border-y border-[#E9DAC5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B082D]">
                Featured Aso Oke &amp; Group Pieces
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600">
                Add sets directly to your cart or inquire below for custom colours and bulk group pricing.
              </p>
            </div>
            <Link
              to="/shop?category=aso-oke-traditional"
              className="text-xs font-bold text-[#3B0E3F] hover:text-[#9A6B19] whitespace-nowrap"
            >
              Browse All in Shop →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#EADCCF] rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dedicated Aso Oke & Group Outfit Enquiry Form */}
      <section id="aso-oke-enquiry-form" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white border border-[#EADCCF] rounded-2xl p-6 sm:p-9 shadow-sm">
          {submittedEnquiry ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="font-mono text-xs font-semibold text-[#7D4B16]">
                Enquiry {submittedEnquiry.enquiry_reference}
              </p>
              <h3 className="font-serif text-3xl font-bold text-[#2B082D]">
                Aso Oke &amp; Group Enquiry Logged
              </h3>
              <p className="text-sm text-neutral-600 max-w-md mx-auto">
                Thank you, <strong>{submittedEnquiry.name}</strong>. Our group coordination desk has received your request for{' '}
                <strong>{submittedEnquiry.quantity}</strong> pieces ({submittedEnquiry.group_size}).
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1EA34D] hover:bg-[#17873E] text-white text-xs sm:text-sm font-bold"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    Continue Enquiry on WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSubmittedEnquiry(null)}
                  className="px-5 py-3 rounded-full border border-[#D8C5AF] text-xs font-semibold text-[#2B082D]"
                >
                  New Enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B082D]">
                  Aso Oke &amp; Group Outfit Enquiry Form
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Tell us your group size, desired weave or color palette, quantity, and event date for a coordinated quote.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name or couple name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+1 780 555 0199"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Enquiry Focus</label>
                  <select
                    value={enquiryType}
                    onChange={(e) => setEnquiryType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] bg-white"
                  >
                    {ASO_OKE_PILLARS.map((p) => (
                      <option key={p.title} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Group Size</label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] bg-white"
                  >
                    <option value="Couple / 2-5 People">Couple / 2-5 People</option>
                    <option value="6-10 Guests">6-10 Guests</option>
                    <option value="11-25 Guests">11-25 Guests</option>
                    <option value="26-50 Guests">26-50 Guests</option>
                    <option value="51-100 Guests">51-100 Guests</option>
                    <option value="100+ Guests">100+ Guests</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Estimated Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Delivery Location *</label>
                  <input
                    type="text"
                    required
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Calgary, Canada"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Upload Color Palette / Reference Image (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-dashed border-[#CBB394] bg-[#FCF8F2]">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B0E3F] text-[#E8BE62] text-xs font-semibold cursor-pointer">
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{uploadingImage ? 'Uploading...' : 'Attach Sample Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleUploadSample}
                      disabled={uploadingImage}
                      className="sr-only"
                    />
                  </label>
                  {referenceImageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={referenceImageUrl}
                        alt="Attached sample"
                        className="w-10 h-10 rounded object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setReferenceImageUrl('')}
                        className="text-red-600 p-1"
                        aria-label="Remove attached photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Event &amp; Colour Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share fabric preferences (silk brocade, French lace, metallic Aso Oke), men's vs. women's breakdown, or branding details..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-sm font-bold hover:brightness-105 disabled:opacity-60 transition-all cursor-pointer"
              >
                {submitting ? 'Submitting Enquiry...' : 'Submit Aso Oke / Group Enquiry'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

export function SouvenirsPage() {
  const { settings, databaseConnected } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublishedProducts({ categorySlug: 'souvenirs-gifts', limit: 12 })
      .then((res) => {
        if (active) setProducts(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [databaseConnected]);

  return (
    <>
      <SeoHead
        title={`Branding & Souvenirs | ${settings.business_name}`}
        description="Customized event souvenirs, monogrammed gift hampers, branded caps, mugs, and corporate merchandise crafted by MCFD J Global Ventures."
        canonicalPath="/souvenirs"
      />
      <section className="relative bg-[#250628] text-white overflow-hidden">
        <SafeImage
          src={settings.souvenir_banner_image_url || LOCAL_BRAND_ASSETS.souvenirsBannerImage}
          alt="Branding and Souvenirs"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(37,6,40,0.95) 0%, rgba(74,18,78,0.8) 55%, rgba(37,6,40,0.6) 100%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F3D88B] to-[#D4AF5A] text-[#250628] text-xs font-bold mb-4">
              <Gift className="w-3.5 h-3.5" />
              Event Keepsakes &amp; Corporate Branding
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-3">
              {settings.souvenir_banner_title || 'Branding & Souvenirs'}
            </h1>
            <p className="text-sm sm:text-base text-[#FAF3E8]/90 leading-relaxed mb-6">
              {settings.souvenir_banner_description ||
                'Customized gifts and branded merchandise for events and businesses.'}
            </p>
            <Link
              to="/custom-design?type=Branded+Souvenirs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs sm:text-sm font-bold"
            >
              Order Custom Branded Souvenirs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
          <div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#2B082D]">
              Curated Souvenirs &amp; Gift Sets
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Ready to personalize with wedding monograms, birthday dates, or business logos.
            </p>
          </div>
          <Link
            to="/custom-design?type=Branded+Souvenirs"
            className="text-xs font-bold text-[#3B0E3F] hover:text-[#9A6B19]"
          >
            Request Bulk Branding Quote →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#EADCCF] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Wedding & Milestone Branded Keepsakes',
                desc: 'Custom monogrammed totes, ceramic mugs, caps, and celebration packaging printed to match your Aso Ebi color theme.',
              },
              {
                title: 'Corporate & Gala Merchandise',
                desc: 'Tailored appreciation boxes and embroidered event textiles produced in packs of 25, 50, or 100+ worldwide.',
              },
              {
                title: 'Direct Proof Approval',
                desc: 'Share your crest or logo through our Custom Design studio and preview digital mockups before print production.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-[#EADCCF] rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#2B082D] mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
                </div>
                <Link
                  to="/custom-design?type=Branded+Souvenirs"
                  className="text-xs font-bold text-[#3B0E3F] hover:text-[#9A6B19] inline-flex items-center gap-1"
                >
                  Request Custom Quote <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export function BeautyPage() {
  const { settings, databaseConnected } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublishedProducts({ categorySlug: 'womens-fashion', limit: 8 })
      .then((res) => {
        if (active) setProducts(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [databaseConnected]);

  return (
    <>
      <SeoHead
        title={`Hair, Beauty & Bridal Styling | ${settings.business_name}`}
        description="Complete bridal look styling, Gele tying consultations, hair & crown care guidance paired with vibrant native attires at MCFD J Global Ventures."
        canonicalPath="/beauty"
      />
      <section className="relative bg-[#250628] text-white overflow-hidden">
        <SafeImage
          src={LOCAL_BRAND_ASSETS.categoryImages['hair-beauty']}
          alt="Hair and Beauty Luxury Collection"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(37,6,40,0.95) 0%, rgba(59,14,63,0.8) 55%, rgba(37,6,40,0.55) 100%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F3D88B] to-[#D4AF5A] text-[#250628] text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Bridal Styling, Gele &amp; Crown Radiance
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-3">
              Hair &amp; Beauty
            </h1>
            <p className="text-sm sm:text-base text-[#FAF3E8]/90 leading-relaxed mb-6">
              Pair your ready-made native attire with pre-pleated Auto Gele styling, bridal hair consultations, and coordinated celebration looks.
            </p>
            <Link
              to="/shop?category=womens-fashion"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#E8BE62] to-[#C89635] text-[#250628] text-xs sm:text-sm font-bold"
            >
              Browse Celebration Dresses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#2B082D] mb-6">
          Paired Women&apos;s Attires &amp; Bridal Styles
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#EADCCF] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
