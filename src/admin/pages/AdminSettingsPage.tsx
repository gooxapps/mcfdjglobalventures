import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import { updateSiteSettings } from '@/src/services/adminService';
import type { SiteSettings } from '@/src/types/store';
import { normalizeWhatsAppDigits } from '@/src/utils/whatsapp';
import { AdminImagePicker } from '@/src/admin/components/AdminImagePicker';

type SettingsTab = 'business' | 'shopping' | 'whatsapp' | 'social_seo';

export function AdminSettingsPage() {
  const { settings, refreshStore } = useStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<SettingsTab>('business');
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (patch: Partial<SiteSettings>, label: string) => {
    setSaving(true);
    try {
      await updateSiteSettings(patch);
      await refreshStore();
      showToast(`${label} saved.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const digitsCount = normalizeWhatsAppDigits(form.whatsapp_number).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-[#090909]">
          Store Settings
        </h2>
        <p className="text-xs text-neutral-600 mt-0.5">
          Configure business identity, currency, delivery fees, WhatsApp number verification, and SEO metadata.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-white border border-[#E7DEC9] rounded-xl p-1.5">
        {(
          [
            ['business', 'Business Profile'],
            ['shopping', 'Shopping & Delivery'],
            ['whatsapp', 'WhatsApp Configuration'],
            ['social_seo', 'Social Media & SEO'],
          ] as Array<[SettingsTab, string]>
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === k
                ? 'bg-[#090909] text-[#E8BE62]'
                : 'text-neutral-600 hover:text-[#090909]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'business' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Business Name</label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Brand Short Name</label>
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) => setForm((p) => ({ ...p, brand_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Business Email</label>
              <input
                type="email"
                value={form.business_email}
                onChange={(e) => setForm((p) => ({ ...p, business_email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Business Phone</label>
              <input
                type="text"
                value={form.business_phone}
                onChange={(e) => setForm((p) => ({ ...p, business_phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Business Address</label>
              <input
                type="text"
                value={form.business_address}
                onChange={(e) => setForm((p) => ({ ...p, business_address: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Service Regions</label>
              <input
                type="text"
                value={form.service_regions}
                onChange={(e) => setForm((p) => ({ ...p, service_regions: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Business Description</label>
            <textarea
              rows={3}
              value={form.business_description}
              onChange={(e) =>
                setForm((p) => ({ ...p, business_description: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AdminImagePicker
              label="Custom Logo Override (Optional)"
              value={form.logo_url}
              onChange={(url) => setForm((p) => ({ ...p, logo_url: url }))}
              bucket="brand-assets"
              folder="logo"
              hint="Leave empty to use the signature MCFD J gold crest lockup."
            />
            <AdminImagePicker
              label="Favicon"
              value={form.favicon_url}
              onChange={(url) => setForm((p) => ({ ...p, favicon_url: url }))}
              bucket="brand-assets"
              folder="favicon"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSave(
                  {
                    business_name: form.business_name,
                    brand_name: form.brand_name,
                    business_email: form.business_email,
                    business_phone: form.business_phone,
                    business_address: form.business_address,
                    service_regions: form.service_regions,
                    business_description: form.business_description,
                    logo_url: form.logo_url,
                    favicon_url: form.favicon_url,
                  },
                  'Business settings'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Save Business Profile'}
            </button>
          </div>
        </div>
      )}

      {tab === 'shopping' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Default Currency Code</label>
              <input
                type="text"
                value={form.default_currency}
                onChange={(e) =>
                  setForm((p) => ({ ...p, default_currency: e.target.value.toUpperCase() }))
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Currency Display Prefix</label>
              <input
                type="text"
                value={form.currency_symbol}
                onChange={(e) => setForm((p) => ({ ...p, currency_symbol: e.target.value }))}
                placeholder="CAD $"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.tax_rate}
                onChange={(e) => setForm((p) => ({ ...p, tax_rate: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Flat Delivery Charge</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.delivery_charge}
                onChange={(e) =>
                  setForm((p) => ({ ...p, delivery_charge: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Free Delivery Threshold</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.free_delivery_threshold}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    free_delivery_threshold: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Minimum Order Value</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minimum_order_value}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    minimum_order_value: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Shipping Information</label>
            <textarea
              rows={3}
              value={form.shipping_info}
              onChange={(e) => setForm((p) => ({ ...p, shipping_info: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Returns &amp; Exchange Policy</label>
            <textarea
              rows={3}
              value={form.returns_policy}
              onChange={(e) => setForm((p) => ({ ...p, returns_policy: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSave(
                  {
                    default_currency: form.default_currency,
                    currency_symbol: form.currency_symbol,
                    tax_rate: form.tax_rate,
                    delivery_charge: form.delivery_charge,
                    free_delivery_threshold: form.free_delivery_threshold,
                    minimum_order_value: form.minimum_order_value,
                    shipping_info: form.shipping_info,
                    returns_policy: form.returns_policy,
                  },
                  'Shopping & delivery settings'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Save Shopping Settings'}
            </button>
          </div>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5 text-xs">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              form.whatsapp_country_confirmed && digitsCount >= 11
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            {form.whatsapp_country_confirmed && digitsCount >= 11 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {form.whatsapp_country_confirmed && digitsCount >= 11
                  ? 'WhatsApp International Number Verified'
                  : 'Country Code Verification Required Before Live Checkout'}
              </p>
              <p className="mt-1">
                Initially supplied digits are <strong>7806913209</strong>. Confirm the full international number (e.g. <strong>17806913209</strong> for Canada/US +1, without spaces, plus signs, or punctuation) and enable live WhatsApp checkout below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">
                International WhatsApp Number (Digits Only) *
              </label>
              <input
                type="text"
                value={form.whatsapp_number}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    whatsapp_number: normalizeWhatsAppDigits(e.target.value),
                  }))
                }
                placeholder="e.g. 17806913209"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm font-mono"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                wa.me target: https://wa.me/{normalizeWhatsAppDigits(form.whatsapp_number)}
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.whatsapp_country_confirmed}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, whatsapp_country_confirmed: e.target.checked }))
                  }
                />
                I confirm the international country code is correct
              </label>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.whatsapp_checkout_enabled}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, whatsapp_checkout_enabled: e.target.checked }))
                  }
                />
                Enable Live WhatsApp Checkout Dispatch
              </label>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.whatsapp_inquiry_enabled}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, whatsapp_inquiry_enabled: e.target.checked }))
                  }
                />
                Enable Product Inquiry &amp; Floating Concierge Button
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Default Checkout Closing Prompt</label>
            <input
              type="text"
              value={form.whatsapp_checkout_message}
              onChange={(e) =>
                setForm((p) => ({ ...p, whatsapp_checkout_message: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Default Support Greeting Message</label>
            <input
              type="text"
              value={form.whatsapp_support_message}
              onChange={(e) =>
                setForm((p) => ({ ...p, whatsapp_support_message: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSave(
                  {
                    whatsapp_number: normalizeWhatsAppDigits(form.whatsapp_number),
                    whatsapp_country_confirmed: form.whatsapp_country_confirmed,
                    whatsapp_checkout_enabled: form.whatsapp_checkout_enabled,
                    whatsapp_inquiry_enabled: form.whatsapp_inquiry_enabled,
                    whatsapp_checkout_message: form.whatsapp_checkout_message,
                    whatsapp_support_message: form.whatsapp_support_message,
                  },
                  'WhatsApp configuration'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Save WhatsApp Settings'}
            </button>
          </div>
        </div>
      )}

      {tab === 'social_seo' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map((platform) => (
              <div key={platform}>
                <label className="block font-semibold capitalize mb-1">{platform} URL</label>
                <input
                  type="url"
                  value={form.social_links?.[platform] || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      social_links: { ...p.social_links, [platform]: e.target.value },
                    }))
                  }
                  placeholder={`https://${platform}.com/...`}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t space-y-4">
            <div>
              <label className="block font-semibold mb-1">Default SEO Title</label>
              <input
                type="text"
                value={form.seo_title}
                onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={form.seo_description}
                onChange={(e) => setForm((p) => ({ ...p, seo_description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Search Keywords</label>
              <input
                type="text"
                value={form.seo_keywords}
                onChange={(e) => setForm((p) => ({ ...p, seo_keywords: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <AdminImagePicker
              label="Open Graph Social Share Image"
              value={form.og_image_url}
              onChange={(url) => setForm((p) => ({ ...p, og_image_url: url }))}
              bucket="brand-assets"
              folder="seo"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSave(
                  {
                    social_links: form.social_links,
                    seo_title: form.seo_title,
                    seo_description: form.seo_description,
                    seo_keywords: form.seo_keywords,
                    og_image_url: form.og_image_url,
                  },
                  'Social & SEO settings'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Save Social & SEO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
