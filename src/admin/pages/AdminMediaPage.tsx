import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  deleteBanner,
  deleteMediaAsset,
  fetchAdminBanners,
  fetchMediaLibrary,
  renameMediaAsset,
  saveBanner,
  updateSiteSettings,
  uploadImageToStorage,
} from '@/src/services/adminService';
import type { Banner, MediaAsset } from '@/src/types/store';
import { SafeImage } from '@/src/components/SafeImage';
import { AdminImagePicker } from '@/src/admin/components/AdminImagePicker';

export function AdminMediaPage() {
  const { refreshStore } = useStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'media' | 'banners'>('media');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState<
    'product-images' | 'category-images' | 'banners' | 'brand-assets'
  >('banners');
  const [uploading, setUploading] = useState(false);

  // Banner creation form
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('/shop');
  const [bannerButton, setBannerButton] = useState('Explore Collection');
  const [bannerPlacement, setBannerPlacement] = useState<
    'hero' | 'promo' | 'category' | 'collection'
  >('promo');

  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    try {
      const [m, b] = await Promise.all([fetchMediaLibrary(), fetchAdminBanners()]);
      setAssets(m);
      setBanners(b);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load media.', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredAssets = useMemo(() => {
    if (!search.trim()) return assets;
    const q = search.trim().toLowerCase();
    return assets.filter(
      (a) =>
        a.file_name.toLowerCase().includes(q) ||
        a.alt_text.toLowerCase().includes(q) ||
        a.bucket_name.toLowerCase().includes(q)
    );
  }, [assets, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const f of files) {
        await uploadImageToStorage(f, bucket, 'library');
      }
      showToast(`Uploaded ${files.length} image(s) to ${bucket}.`);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRename = async (asset: MediaAsset) => {
    const nextName = window.prompt('Enter new file name:', asset.file_name);
    if (!nextName) return;
    try {
      await renameMediaAsset(asset.id, nextName, asset.alt_text);
      showToast('Media file renamed.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Rename failed.', 'error');
    }
  };

  const handleAssignHero = async (url: string) => {
    try {
      await updateSiteSettings({ hero_image_url: url });
      await refreshStore();
      showToast('Assigned image as homepage Hero backdrop.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Assignment failed.', 'error');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage) {
      showToast('Select or upload a banner image first.', 'error');
      return;
    }
    try {
      await saveBanner({
        title: bannerTitle,
        subtitle: bannerSubtitle,
        image_url: bannerImage,
        link_url: bannerLink,
        button_text: bannerButton,
        placement: bannerPlacement,
        is_active: true,
        sort_order: banners.length + 1,
      });
      setBannerTitle('');
      setBannerSubtitle('');
      setBannerImage('');
      await load();
      await refreshStore();
      showToast('Banner published.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Banner save failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#090909]">
            Banner &amp; Media Manager
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Upload images to Vercel Blob storage, copy URLs, and manage promotional banners.
          </p>
        </div>
        <div className="inline-flex bg-white border border-[#E7DEC9] rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab('media')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold ${
              tab === 'media' ? 'bg-[#090909] text-[#E8BE62]' : 'text-neutral-600'
            }`}
          >
            Media Library ({assets.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('banners')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold ${
              tab === 'banners' ? 'bg-[#090909] text-[#E8BE62]' : 'text-neutral-600'
            }`}
          >
            Banners ({banners.length})
          </button>
        </div>
      </div>

      {tab === 'media' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E7DEC9] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search media by filename or bucket..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bucket}
                onChange={(e) =>
                  setBucket(
                    e.target.value as
                      | 'product-images'
                      | 'category-images'
                      | 'banners'
                      | 'brand-assets'
                  )
                }
                className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white"
              >
                <option value="banners">Bucket: banners</option>
                <option value="product-images">Bucket: product-images</option>
                <option value="category-images">Bucket: category-images</option>
                <option value="brand-assets">Bucket: brand-assets</option>
              </select>

              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#090909] text-white text-xs font-semibold"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF5A]" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-[#D4AF5A]" />
                )}
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="bg-white border border-[#E7DEC9] rounded-xl p-12 text-center text-xs text-neutral-500">
              No media assets uploaded yet. Upload product photos, category banners, or brand assets above.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-square bg-[#FAF5EE]">
                    <SafeImage
                      src={asset.public_url}
                      alt={asset.alt_text || asset.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-2 text-[11px]">
                    <p className="font-semibold text-[#090909] truncate" title={asset.file_name}>
                      {asset.file_name}
                    </p>
                    <p className="text-neutral-500 truncate">{asset.bucket_name}</p>
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(asset.public_url);
                          showToast('Public URL copied.');
                        }}
                        title="Copy URL"
                        className="p-1.5 rounded border border-neutral-200 hover:border-[#090909]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRename(asset)}
                        title="Rename"
                        className="p-1.5 rounded border border-neutral-200 hover:border-[#090909]"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignHero(asset.public_url)}
                        className="px-2 py-1 rounded bg-[#FAF5EE] border border-[#E2D6C1] font-medium hover:border-[#090909]"
                      >
                        Use Hero
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Delete this image from Vercel Blob storage?')) return;
                          await deleteMediaAsset(asset);
                          showToast('Asset deleted.');
                          await load();
                        }}
                        title="Delete"
                        className="p-1.5 rounded border border-red-200 text-red-600 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'banners' && (
        <div className="space-y-6 text-xs">
          <form
            onSubmit={handleCreateBanner}
            className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-4"
          >
            <h3 className="font-serif text-xl font-semibold text-[#090909]">
              Create Promotional Banner
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="Banner Headline *"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <input
                type="text"
                value={bannerLink}
                onChange={(e) => setBannerLink(e.target.value)}
                placeholder="Destination URL (/shop)"
                className="px-3 py-2 rounded-lg border border-neutral-300 font-mono"
              />
              <select
                value={bannerPlacement}
                onChange={(e) =>
                  setBannerPlacement(
                    e.target.value as 'hero' | 'promo' | 'category' | 'collection'
                  )
                }
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="promo">Placement: Homepage Promo</option>
                <option value="hero">Placement: Hero</option>
                <option value="collection">Placement: Collection</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                placeholder="Banner Subtitle"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <input
                type="text"
                value={bannerButton}
                onChange={(e) => setBannerButton(e.target.value)}
                placeholder="Button Text"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
            </div>

            <AdminImagePicker
              label="Banner Image"
              value={bannerImage}
              onChange={setBannerImage}
              bucket="banners"
              folder="promos"
            />

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Plus className="w-4 h-4 text-[#D4AF5A]" />
              Save Banner
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/9] bg-neutral-100">
                  <SafeImage
                    src={b.image_url}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm text-[#090909]">{b.title}</p>
                    <p className="text-neutral-500">
                      {b.placement} · {b.link_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveBanner({ ...b, is_active: !b.is_active });
                        await load();
                        await refreshStore();
                      }}
                      className={`px-2.5 py-1 rounded font-medium ${
                        b.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {b.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteBanner(b.id);
                        await load();
                        await refreshStore();
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
