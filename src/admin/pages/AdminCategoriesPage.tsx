import React, { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  deleteAdminCategory,
  fetchAdminCategories,
  saveAdminCategory,
} from '@/src/services/adminService';
import type { Category } from '@/src/types/store';
import { slugify } from '@/src/utils/format';
import { resolveCategoryImage } from '@/src/lib/defaults';
import { SafeImage } from '@/src/components/SafeImage';
import { AdminImagePicker } from '@/src/admin/components/AdminImagePicker';

export function AdminCategoriesPage() {
  const { refreshStore } = useStore();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminCategories();
      setCategories(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name);
      setSlug(cat.slug);
      setDescription(cat.description);
      setImageUrl(cat.image_url || '');
      setBannerUrl(cat.banner_url || '');
      setSortOrder(cat.sort_order);
      setIsActive(cat.is_active);
    } else {
      setEditingId(undefined);
      setName('');
      setSlug('');
      setDescription('');
      setImageUrl('');
      setBannerUrl('');
      setSortOrder(categories.length + 1);
      setIsActive(true);
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAdminCategory({
        id: editingId,
        name,
        slug: slug || slugify(name),
        description,
        image_url: imageUrl || null,
        banner_url: bannerUrl || null,
        sort_order: sortOrder,
        is_active: isActive,
      });
      showToast(editingId ? 'Category updated.' : 'Category created.');
      setModalOpen(false);
      await load();
      await refreshStore();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteAdminCategory(cat.id);
      showToast('Category deleted.');
      await load();
      await refreshStore();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete blocked.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#090909]">
            Category Management
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Changes sync immediately to storefront navigation, homepage cards, and shop filters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#090909] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4 text-[#D4AF5A]" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-10 text-center text-xs text-neutral-500">
          Loading categories...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/9] bg-[#F1E8DC]">
                <SafeImage
                  src={resolveCategoryImage(cat)}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-xl font-semibold text-[#090909]">
                      {cat.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        cat.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                    Order: {cat.sort_order} · /{cat.slug}
                  </p>
                  <p className="text-xs text-neutral-600 mt-2 line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => openModal(cat)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium hover:border-[#090909]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl border border-[#E7DEC9] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#090909] text-white flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold">
                {editingId ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingId) setSlug(slugify(e.target.value));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                />
              </div>

              <AdminImagePicker
                label="Category Image"
                value={imageUrl}
                onChange={setImageUrl}
                bucket="category-images"
                folder="thumbnails"
              />

              <AdminImagePicker
                label="Category Banner Image"
                value={bannerUrl}
                onChange={setBannerUrl}
                bucket="category-images"
                folder="banners"
              />

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm tabular-nums"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  Active on Storefront
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#090909] text-white text-xs font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
