import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Camera,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PenTool,
  Scissors,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import { LOCAL_BRAND_ASSETS } from '@/src/lib/defaults';
import {
  submitCustomDesignRequest,
  uploadPublicSampleImage,
} from '@/src/services/storefrontService';
import type { CustomDesignRequest } from '@/src/types/store';
import { SafeImage } from '@/src/components/SafeImage';
import { SeoHead } from '@/src/components/SeoHead';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

const CUSTOMIZATION_TYPES = [
  'Custom Outfit',
  'Aso Oke Ensemble',
  'Group Event Outfits',
  'Branded Souvenirs',
  'Bridal / Engagement Couture',
  'Hair & Beauty Custom Gift',
];

export function CustomDesignPage() {
  const { settings } = useStore();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [customizationType, setCustomizationType] = useState('Custom Outfit');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [eventDate, setEventDate] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<CustomDesignRequest | null>(null);
  const [submittedPreviewMode, setSubmittedPreviewMode] = useState(false);

  useEffect(() => {
    const presetType = searchParams.get('type');
    if (presetType && CUSTOMIZATION_TYPES.includes(presetType)) {
      setCustomizationType(presetType);
    }
  }, [searchParams]);

  const handleSampleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadPublicSampleImage(file);
      setReferenceImageUrl(url);
      showToast('Reference sample uploaded.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to upload sample.', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsappNumber.trim() || !description.trim()) {
      showToast('Please enter your name, WhatsApp number, and design details.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCustomDesignRequest({
        name,
        email,
        whatsapp_number: whatsappNumber,
        customization_type: customizationType,
        reference_image_url: referenceImageUrl,
        description,
        quantity,
        event_date: eventDate,
        delivery_location: deliveryLocation,
      });
      setSubmittedRecord(res.request);
      setSubmittedPreviewMode(res.previewMode);
      showToast(`Request ${res.request.request_reference} received!`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not submit your request. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const buildWhatsappContinuation = () => {
    const digits = normalizeWhatsAppDigits(settings.whatsapp_number);
    const targetDigits = digits.length === 10 ? `1${digits}` : digits;
    if (!submittedRecord || targetDigits.length < 10) return '/contact';
    const lines = [
      `Hello MCFD J Global Ventures, I just submitted a Custom Design Request:`,
      `Reference: ${submittedRecord.request_reference}`,
      `Name: ${submittedRecord.name}`,
      `Type: ${submittedRecord.customization_type}`,
      `Quantity: ${submittedRecord.quantity}`,
      submittedRecord.event_date ? `Event Date: ${submittedRecord.event_date}` : '',
      submittedRecord.delivery_location ? `Delivery Location: ${submittedRecord.delivery_location}` : '',
      `Details: ${submittedRecord.description}`,
      submittedRecord.reference_image_url.startsWith('http')
        ? `Sample Image: ${submittedRecord.reference_image_url}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    return buildWhatsAppUrl(targetDigits, lines);
  };

  const steps =
    settings.process_steps && settings.process_steps.length === 4
      ? settings.process_steps
      : [
          { step: 1, title: 'Share Your Idea', subtitle: '(Upload Sample)' },
          { step: 2, title: 'We Design & Confirm', subtitle: '' },
          { step: 3, title: 'We Create with Care', subtitle: '' },
          { step: 4, title: 'You Receive Your Order', subtitle: '' },
        ];
  const stepIcons = [Camera, PenTool, Scissors, CheckCircle2];

  return (
    <>
      <SeoHead
        title={`Custom Design & Personalization | ${settings.business_name}`}
        description="Bring a sample, share your idea, or choose from our designs — MCFD J Global Ventures crafts bespoke African outfits, Aso Oke sets, and branded souvenirs to order."
        canonicalPath="/custom-design"
      />

      {/* Page Hero */}
      <section className="relative bg-[#250628] text-white overflow-hidden">
        <SafeImage
          src={settings.custom_design_image_url || LOCAL_BRAND_ASSETS.customCreationImage}
          alt="Your Idea, Our Creation"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(37,6,40,0.95) 0%, rgba(59,14,63,0.84) 55%, rgba(90,21,60,0.65) 100%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F3D88B] to-[#D4AF5A] text-[#250628] text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Bespoke Atelier &amp; Branding Studio
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight mb-3">
              {settings.custom_design_title || 'Your Idea, Our Creation'}
            </h1>
            <p className="text-sm sm:text-base text-[#FAF3E8]/90 leading-relaxed">
              {settings.custom_design_description ||
                "Bring a sample, share your idea, or choose from our designs — we'll deliver exactly what you want."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 4-Step Process Visual Strip */}
      <section
        className="border-b border-[#E5D3EC]"
        style={{
          background: 'linear-gradient(135deg, #FBF4FB 0%, #F6EAF9 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D0D31] text-center mb-7">
            {settings.process_title || 'Our Customization Process'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {steps.map((s, idx) => {
              const Icon = stepIcons[idx % stepIcons.length];
              return (
                <div
                  key={s.step}
                  className="bg-white/85 border border-[#E2CCE8] rounded-2xl p-5 text-center flex flex-col items-center shadow-2xs"
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-b from-[#F5DC93] to-[#C89635] text-[#250628] text-xs font-bold flex items-center justify-center mb-3">
                    {s.step}
                  </span>
                  <Icon className="w-6 h-6 text-[#3B0E3F] mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-[#2D0D31]">{s.title}</p>
                  {s.subtitle && <p className="text-[11px] text-[#6B5465] mt-0.5">{s.subtitle}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Custom Design Request Form */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <div className="lg:col-span-8 bg-white border border-[#EADCCF] rounded-2xl p-6 sm:p-8 shadow-sm">
            {submittedRecord ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="font-mono text-xs font-semibold text-[#7D4B16]">
                  Reference {submittedRecord.request_reference}
                </p>
                <h2 className="font-serif text-3xl font-bold text-[#2B082D]">
                  Custom Design Request Received
                </h2>
                <p className="text-sm text-neutral-600 max-w-md mx-auto">
                  Thank you, <strong>{submittedRecord.name}</strong>. Our fashion &amp; branding specialists have logged your brief for{' '}
                  <strong>{submittedRecord.customization_type}</strong>.
                  {submittedPreviewMode
                    ? ' (Recorded locally in Preview Mode until Neon DB is connected.)'
                    : ''}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {typeof buildWhatsappContinuation() === 'string' &&
                  buildWhatsappContinuation().startsWith('http') ? (
                    <a
                      href={buildWhatsappContinuation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1EA34D] hover:bg-[#17873E] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      Continue on WhatsApp with Details
                    </a>
                  ) : (
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#3B0E3F] text-white text-xs sm:text-sm font-bold"
                    >
                      Contact Concierge
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRecord(null);
                      setDescription('');
                      setReferenceImageUrl('');
                    }}
                    className="px-5 py-3 rounded-full border border-[#D8C5AF] text-xs font-semibold text-[#2B082D] hover:bg-[#FAF5EE]"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B082D]">
                    Request a Custom Design
                  </h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    Share your specifications and upload a reference photo or logo. We’ll confirm pricing, fabric options, and turnaround directly with you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Chidinma Okafor"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] focus:outline-none focus:border-[#3B0E3F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+1 780 555 0199"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] focus:outline-none focus:border-[#3B0E3F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] focus:outline-none focus:border-[#3B0E3F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                      Customization Type *
                    </label>
                    <select
                      value={customizationType}
                      onChange={(e) => setCustomizationType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] bg-white focus:outline-none focus:border-[#3B0E3F]"
                    >
                      {CUSTOMIZATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Upload Reference Image / Sample */}
                <div>
                  <label className="block text-xs font-semibold text-[#2D0D31] mb-1.5">
                    Reference Image / Sample Photo (Optional)
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl border border-dashed border-[#CBB394] bg-[#FCF8F2]">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B0E3F] hover:bg-[#4A124E] text-[#E8BE62] text-xs font-semibold cursor-pointer transition-colors">
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{uploadingImage ? 'Uploading Sample...' : 'Upload Sample Photo'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={handleSampleUpload}
                        disabled={uploadingImage}
                        className="sr-only"
                      />
                    </label>
                    <span className="text-[11px] text-neutral-500">
                      JPG, PNG, or WebP up to 6MB. Bring a sketch, fabric inspiration, or logo.
                    </span>
                  </div>

                  {referenceImageUrl && (
                    <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl border border-[#EADCCF] bg-white">
                      <img
                        src={referenceImageUrl}
                        alt="Uploaded design reference"
                        className="w-16 h-16 rounded-lg object-cover border border-[#EADCCF]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#2D0D31]">
                          Sample Attached Ready for Review
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          Included with your custom request
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReferenceImageUrl('')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Remove uploaded sample"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                    Design Description &amp; Sizing / Colour Notes *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe fabric tones, embroidery details, monogram wording, sizing preferences, or style notes..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] focus:outline-none focus:border-[#3B0E3F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] focus:outline-none focus:border-[#3B0E3F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                      Event Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] focus:outline-none focus:border-[#3B0E3F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2D0D31] mb-1">
                      Delivery City &amp; Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      placeholder="e.g. Toronto, Canada"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DECBAE] focus:outline-none focus:border-[#3B0E3F]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E8BE62] via-[#D4AF5A] to-[#C89635] text-[#250628] text-sm font-bold hover:brightness-105 disabled:opacity-60 transition-all shadow-md cursor-pointer"
                >
                  {submitting ? 'Submitting Custom Design Request...' : 'Submit Custom Design Request'}
                </button>
              </form>
            )}
          </div>

          {/* Right Info Panel */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-[#250628] text-white rounded-2xl p-6 border border-[#D4AF5A]/30 space-y-3">
              <h3 className="font-serif text-2xl font-bold text-[#E8BE62]">
                What We Custom-Create
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#FAF3E8]/90">
                <li>• Bespoke Women’s Gowns, Lace &amp; Reception Pieces</li>
                <li>• Custom Embroidered Agbada, Kaftans &amp; Suits</li>
                <li>• Matching Bridal Trains &amp; Family Aso Ebi</li>
                <li>• Monogrammed Caps, Totes, Flasks &amp; Gift Boxes</li>
                <li>• Event &amp; Corporate Branded Souvenir Hampers</li>
              </ul>
            </div>

            <div className="bg-white border border-[#EADCCF] rounded-2xl p-6 space-y-3 text-xs">
              <h3 className="font-serif text-xl font-bold text-[#2D0D31]">
                Need Immediate Styling Advice?
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Chat directly with our tailoring and merchandise team on WhatsApp for fabric swatches, rush event lead times, or group pricing.
              </p>
              <Link
                to="/aso-oke"
                className="inline-block font-semibold text-[#3B0E3F] hover:text-[#9A6B19]"
              >
                Planning a Wedding or Group Event? →
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
