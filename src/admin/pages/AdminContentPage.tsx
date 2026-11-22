import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  deleteTestimonial,
  fetchAdminHomepageSections,
  fetchAdminTestimonials,
  saveHomepageSections,
  saveTestimonial,
  updateSiteSettings,
} from '@/src/services/adminService';
import type {
  AboutValue,
  FooterNavLink,
  HomepageSection,
  SiteSettings,
  Testimonial,
} from '@/src/types/store';
import { AdminImagePicker } from '@/src/admin/components/AdminImagePicker';

type ContentTab = 'hero' | 'sections' | 'about' | 'testimonials' | 'footer';

export function AdminContentPage() {
  const { settings, refreshStore } = useStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<ContentTab>('hero');
  const [form, setForm] = useState<SiteSettings>(settings);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [saving, setSaving] = useState(false);

  // Testimonial quick add
  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('Verified Client');
  const [tLocation, setTLocation] = useState('');
  const [tQuote, setTQuote] = useState('');
  const [tRating, setTRating] = useState(5);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const loadSubTables = async () => {
    try {
      const [secs, tests] = await Promise.all([
        fetchAdminHomepageSections(),
        fetchAdminTestimonials(),
      ]);
      setSections(secs);
      setTestimonials(tests);
    } catch {
      // Initial load graceful
    }
  };

  useEffect(() => {
    loadSubTables();
  }, []);

  const saveSettingsPatch = async (patch: Partial<SiteSettings>, label: string) => {
    setSaving(true);
    try {
      await updateSiteSettings(patch);
      await refreshStore();
      showToast(`${label} updated on the live website.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setSections(copy.map((s, idx) => ({ ...s, sort_order: idx + 1 })));
  };

  const handleSaveSections = async () => {
    setSaving(true);
    try {
      await saveHomepageSections(sections);
      await refreshStore();
      showToast('Homepage sections updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save sections.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveTestimonial({
        customer_name: tName,
        customer_role: tRole,
        location: tLocation,
        quote: tQuote,
        rating: tRating,
        is_published: true,
        sort_order: testimonials.length + 1,
      });
      setTName('');
      setTLocation('');
      setTQuote('');
      await loadSubTables();
      await refreshStore();
      showToast('Testimonial added.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add testimonial.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-[#090909]">
          Website Content Management
        </h2>
        <p className="text-xs text-neutral-600 mt-0.5">
          Edit hero headlines, homepage section order, About Us, testimonials, and footer links in real time.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white border border-[#E7DEC9] rounded-xl p-1.5">
        {(
          [
            ['hero', 'Hero & Announcements'],
            ['sections', 'Homepage Sections'],
            ['about', 'About Us'],
            ['testimonials', 'Testimonials'],
            ['footer', 'Footer & Policies'],
          ] as Array<[ContentTab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === key
                ? 'bg-[#090909] text-[#E8BE62]'
                : 'text-neutral-600 hover:text-[#090909]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Hero & Announcements */}
      {tab === 'hero' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Hero Headline</label>
              <input
                type="text"
                value={form.hero_headline}
                onChange={(e) => setForm((p) => ({ ...p, hero_headline: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hero Gold Highlight Line</label>
              <input
                type="text"
                value={form.hero_subheadline_highlight}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hero_subheadline_highlight: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Hero Supporting Description</label>
            <textarea
              rows={3}
              value={form.hero_description}
              onChange={(e) => setForm((p) => ({ ...p, hero_description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <AdminImagePicker
            label="Hero Editorial Image"
            value={form.hero_image_url}
            onChange={(url) => setForm((p) => ({ ...p, hero_image_url: url }))}
            bucket="banners"
            folder="hero"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Hero Button Text</label>
              <input
                type="text"
                value={form.hero_button_text}
                onChange={(e) => setForm((p) => ({ ...p, hero_button_text: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hero Button Destination URL</label>
              <input
                type="text"
                value={form.hero_button_url}
                onChange={(e) => setForm((p) => ({ ...p, hero_button_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Top Announcement Bar Text</label>
            <input
              type="text"
              value={form.announcement_text}
              onChange={(e) => setForm((p) => ({ ...p, announcement_text: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveSettingsPatch(
                  {
                    hero_headline: form.hero_headline,
                    hero_subheadline_highlight: form.hero_subheadline_highlight,
                    hero_description: form.hero_description,
                    hero_image_url: form.hero_image_url,
                    hero_button_text: form.hero_button_text,
                    hero_button_url: form.hero_button_url,
                    announcement_text: form.announcement_text,
                  },
                  'Hero & announcement settings'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Publish Hero Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Homepage Sections */}
      {tab === 'sections' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-4 text-xs">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className="p-4 rounded-xl border border-neutral-200 bg-[#FAF5EE]/50 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-neutral-500">
                    #{idx + 1} ({sec.section_key})
                  </span>
                  <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sec.is_visible}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSections((prev) =>
                          prev.map((s) =>
                            s.id === sec.id ? { ...s, is_visible: checked } : s
                          )
                        );
                      }}
                    />
                    Show on Homepage
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, -1)}
                    className="p-1.5 rounded border bg-white hover:bg-neutral-50"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 1)}
                    className="p-1.5 rounded border bg-white hover:bg-neutral-50"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) =>
                      prev.map((s) => (s.id === sec.id ? { ...s, title: val } : s))
                    );
                  }}
                  placeholder="Section Heading"
                  className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
                />
                <input
                  type="text"
                  value={sec.subtitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSections((prev) =>
                      prev.map((s) => (s.id === sec.id ? { ...s, subtitle: val } : s))
                    );
                  }}
                  placeholder="Section Description"
                  className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSections}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Save Section Order & Headings'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: About Us */}
      {tab === 'about' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5 text-xs">
          <div>
            <label className="block font-semibold mb-1">Company Introduction</label>
            <textarea
              rows={3}
              value={form.about_intro}
              onChange={(e) => setForm((p) => ({ ...p, about_intro: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Mission</label>
              <textarea
                rows={3}
                value={form.about_mission}
                onChange={(e) => setForm((p) => ({ ...p, about_mission: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Vision</label>
              <textarea
                rows={3}
                value={form.about_vision}
                onChange={(e) => setForm((p) => ({ ...p, about_vision: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
          </div>

          <AdminImagePicker
            label="About Atelier Image"
            value={form.about_image_url}
            onChange={(url) => setForm((p) => ({ ...p, about_image_url: url }))}
            bucket="brand-assets"
            folder="about"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold">Company Core Values</label>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    about_values: [
                      ...(p.about_values || []),
                      { title: 'New Value', description: '' },
                    ],
                  }))
                }
                className="text-xs font-semibold text-[#9A7422]"
              >
                + Add Value
              </button>
            </div>
            {(form.about_values || []).map((val: AboutValue, idx: number) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={val.title}
                  onChange={(e) => {
                    const next = [...form.about_values];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setForm((p) => ({ ...p, about_values: next }));
                  }}
                  className="sm:col-span-4 px-3 py-2 rounded-lg border border-neutral-300"
                />
                <input
                  type="text"
                  value={val.description}
                  onChange={(e) => {
                    const next = [...form.about_values];
                    next[idx] = { ...next[idx], description: e.target.value };
                    setForm((p) => ({ ...p, about_values: next }));
                  }}
                  className="sm:col-span-7 px-3 py-2 rounded-lg border border-neutral-300"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      about_values: p.about_values.filter((_, i) => i !== idx),
                    }))
                  }
                  className="sm:col-span-1 text-red-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveSettingsPatch(
                  {
                    about_intro: form.about_intro,
                    about_mission: form.about_mission,
                    about_vision: form.about_vision,
                    about_values: form.about_values,
                    about_image_url: form.about_image_url,
                  },
                  'About Us content'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Save About Us'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Testimonials */}
      {tab === 'testimonials' && (
        <div className="space-y-6 text-xs">
          <form
            onSubmit={handleAddTestimonial}
            className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-4"
          >
            <h3 className="font-serif text-xl font-semibold text-[#090909]">
              Add Client Testimonial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                placeholder="Client Name *"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <input
                type="text"
                value={tRole}
                onChange={(e) => setTRole(e.target.value)}
                placeholder="Role / Title"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <input
                type="text"
                value={tLocation}
                onChange={(e) => setTLocation(e.target.value)}
                placeholder="City / Country"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <select
                value={tRating}
                onChange={(e) => setTRating(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
              >
                {[5, 4, 3].map((r) => (
                  <option key={r} value={r}>
                    {r} Stars
                  </option>
                ))}
              </select>
            </div>
            <textarea
              required
              rows={2}
              value={tQuote}
              onChange={(e) => setTQuote(e.target.value)}
              placeholder="Client quote..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-300"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Plus className="w-4 h-4 text-[#D4AF5A]" />
              Add Testimonial
            </button>
          </form>

          <div className="bg-white border border-[#E7DEC9] rounded-xl divide-y">
            {testimonials.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                No testimonials recorded yet.
              </div>
            ) : (
              testimonials.map((t) => (
                <div key={t.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm text-[#090909]">
                      {t.customer_name}{' '}
                      <span className="text-xs font-normal text-neutral-500">
                        · {t.customer_role} {t.location ? `(${t.location})` : ''}
                      </span>
                    </p>
                    <p className="text-neutral-700 mt-1">“{t.quote}”</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveTestimonial({ ...t, is_published: !t.is_published });
                        await loadSubTables();
                        await refreshStore();
                      }}
                      className={`px-2.5 py-1 rounded font-medium ${
                        t.is_published
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {t.is_published ? 'Published' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteTestimonial(t.id);
                        await loadSubTables();
                        await refreshStore();
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Footer & Legal */}
      {tab === 'footer' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5 text-xs">
          <div>
            <label className="block font-semibold mb-1">Footer Business Description</label>
            <textarea
              rows={2}
              value={form.footer_description}
              onChange={(e) => setForm((p) => ({ ...p, footer_description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Copyright Text</label>
            <input
              type="text"
              value={form.copyright_text}
              onChange={(e) => setForm((p) => ({ ...p, copyright_text: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold">Footer Navigation Links</label>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    footer_links: [...(p.footer_links || []), { label: 'Link', url: '/shop' }],
                  }))
                }
                className="font-semibold text-[#9A7422]"
              >
                + Add Link
              </button>
            </div>
            {(form.footer_links || []).map((lnk: FooterNavLink, idx: number) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={lnk.label}
                  onChange={(e) => {
                    const next = [...form.footer_links];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setForm((p) => ({ ...p, footer_links: next }));
                  }}
                  className="sm:col-span-5 px-3 py-2 rounded-lg border border-neutral-300"
                />
                <input
                  type="text"
                  value={lnk.url}
                  onChange={(e) => {
                    const next = [...form.footer_links];
                    next[idx] = { ...next[idx], url: e.target.value };
                    setForm((p) => ({ ...p, footer_links: next }));
                  }}
                  className="sm:col-span-6 px-3 py-2 rounded-lg border border-neutral-300 font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      footer_links: p.footer_links.filter((_, i) => i !== idx),
                    }))
                  }
                  className="sm:col-span-1 text-red-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-semibold mb-1">Privacy Policy</label>
            <textarea
              rows={3}
              value={form.privacy_policy}
              onChange={(e) => setForm((p) => ({ ...p, privacy_policy: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Terms &amp; Conditions</label>
            <textarea
              rows={3}
              value={form.terms_conditions}
              onChange={(e) => setForm((p) => ({ ...p, terms_conditions: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                saveSettingsPatch(
                  {
                    footer_description: form.footer_description,
                    copyright_text: form.copyright_text,
                    footer_links: form.footer_links,
                    privacy_policy: form.privacy_policy,
                    terms_conditions: form.terms_conditions,
                  },
                  'Footer & legal policies'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Save className="w-4 h-4 text-[#D4AF5A]" />
              {saving ? 'Saving...' : 'Save Footer & Policies'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
