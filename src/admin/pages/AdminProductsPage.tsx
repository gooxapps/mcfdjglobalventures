import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Archive,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  bulkUpdateProducts,
  deleteProducts,
  fetchAdminCategories,
  fetchAdminProducts,
  saveAdminProduct,
  uploadImageToStorage,
  type ProductSaveInput,
} from '@/src/services/adminService';
import type { Category, Product, ProductColourOption } from '@/src/types/store';
import { STARTER_LUXURY_PRODUCTS } from '@/src/lib/starterCatalog';
import { downloadCsv, parseCsvText } from '@/src/utils/csv';
import { formatPrice, slugify } from '@/src/utils/format';
import { SafeImage } from '@/src/components/SafeImage';

const EMPTY_FORM: ProductSaveInput = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category_id: null,
  subcategory: '',
  sku: '',
  regular_price: 0,
  discounted_price: null,
  cost_price: null,
  currency: 'CAD',
  main_image_url: null,
  stock_quantity: 0,
  tags: [],
  available_sizes: [],
  available_colours: [],
  is_featured: false,
  is_best_seller: false,
  is_new_arrival: false,
  is_on_sale: false,
  is_published: true,
  is_archived: false,
  seo_title: '',
  seo_description: '',
  images: [],
  variants: [],
};

export function AdminProductsPage() {
  const { settings } = useStore();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seedingStarter, setSeedingStarter] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<ProductSaveInput>(EMPTY_FORM);

  // Helper inputs for tags, sizes, colours
  const [tagsText, setTagsText] = useState('');
  const [sizesText, setSizesText] = useState('');
  const [colourName, setColourName] = useState('');
  const [colourHex, setColourHex] = useState('#090909');

  const multiFileRef = useRef<HTMLInputElement | null>(null);
  const csvFileRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchAdminProducts(), fetchAdminCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreateModal();
      setSearchParams({});
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === 'published' && (!p.is_published || p.is_archived)) return false;
      if (statusFilter === 'draft' && (p.is_published || p.is_archived)) return false;
      if (statusFilter === 'archived' && !p.is_archived) return false;
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q) &&
          !p.subcategory.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const openCreateModal = () => {
    setForm({
      ...EMPTY_FORM,
      currency: settings.default_currency || 'CAD',
      category_id: categories[0]?.id ?? null,
    });
    setTagsText('');
    setSizesText('S, M, L, XL');
    setModalOpen(true);
  };

  const openEditModal = (product: Product, asDuplicate = false) => {
    const imgs =
      product.images && product.images.length > 0
        ? product.images.map((i, idx) => ({
            url: i.url,
            alt_text: i.alt_text,
            sort_order: idx,
            is_main: i.is_main || i.url === product.main_image_url,
          }))
        : product.main_image_url
        ? [{ url: product.main_image_url, alt_text: product.name, sort_order: 0, is_main: true }]
        : [];

    setForm({
      id: asDuplicate ? undefined : product.id,
      name: asDuplicate ? `${product.name} (Copy)` : product.name,
      slug: asDuplicate ? `${product.slug}-copy-${Date.now().toString().slice(-4)}` : product.slug,
      short_description: product.short_description,
      description: product.description,
      category_id: product.category_id,
      subcategory: product.subcategory,
      sku: asDuplicate ? `${product.sku}-COPY` : product.sku,
      regular_price: product.regular_price,
      discounted_price: product.discounted_price,
      cost_price: product.cost_price ?? null,
      currency: product.currency || settings.default_currency || 'CAD',
      main_image_url: product.main_image_url,
      stock_quantity: product.stock_quantity,
      tags: product.tags || [],
      available_sizes: product.available_sizes || [],
      available_colours: product.available_colours || [],
      is_featured: product.is_featured,
      is_best_seller: product.is_best_seller,
      is_new_arrival: product.is_new_arrival,
      is_on_sale: product.is_on_sale,
      is_published: asDuplicate ? false : product.is_published,
      is_archived: product.is_archived,
      seo_title: product.seo_title,
      seo_description: product.seo_description,
      images: imgs,
      variants: (product.variants || []).map((v) => ({
        size: v.size,
        colour: v.colour,
        colour_hex: v.colour_hex,
        sku: asDuplicate ? `${v.sku}-COPY` : v.sku,
        stock_quantity: v.stock_quantity,
        is_available: v.is_available,
        price_override: v.price_override,
      })),
    });
    setTagsText((product.tags || []).join(', '));
    setSizesText((product.available_sizes || []).join(', '));
    setModalOpen(true);
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const asset = await uploadImageToStorage(file, 'product-images', 'catalog');
        uploaded.push(asset.public_url);
      }
      setForm((prev) => {
        const nextImgs = [
          ...prev.images,
          ...uploaded.map((url, idx) => ({
            url,
            alt_text: prev.name || 'MCFD J Product',
            sort_order: prev.images.length + idx,
            is_main: prev.images.length === 0 && idx === 0,
          })),
        ];
        const mainUrl =
          nextImgs.find((i) => i.is_main)?.url || nextImgs[0]?.url || prev.main_image_url;
        return { ...prev, images: nextImgs, main_image_url: mainUrl };
      });
      showToast(`Uploaded ${uploaded.length} product image(s).`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploadingImage(false);
      if (multiFileRef.current) multiFileRef.current.value = '';
    }
  };

  const setMainImage = (index: number) => {
    setForm((prev) => {
      const next = prev.images.map((img, i) => ({ ...img, is_main: i === index }));
      return { ...prev, images: next, main_image_url: next[index]?.url || null };
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.images.length) return prev;
      const copy = [...prev.images];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return {
        ...prev,
        images: copy.map((img, i) => ({ ...img, sort_order: i })),
      };
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const copy = prev.images.filter((_, i) => i !== index);
      if (copy.length > 0 && !copy.some((i) => i.is_main)) {
        copy[0].is_main = true;
      }
      return {
        ...prev,
        images: copy.map((img, i) => ({ ...img, sort_order: i })),
        main_image_url: copy.find((i) => i.is_main)?.url || copy[0]?.url || null,
      };
    });
  };

  const addColourOption = () => {
    const clean = colourName.trim();
    if (!clean) return;
    if (form.available_colours.some((c) => c.name.toLowerCase() === clean.toLowerCase())) return;
    setForm((prev) => ({
      ...prev,
      available_colours: [...prev.available_colours, { name: clean, hex: colourHex }],
    }));
    setColourName('');
  };

  const removeColourOption = (name: string) => {
    setForm((prev) => ({
      ...prev,
      available_colours: prev.available_colours.filter((c) => c.name !== name),
    }));
  };

  const generateVariantMatrix = () => {
    const sizes = sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colours: ProductColourOption[] =
      form.available_colours.length > 0
        ? form.available_colours
        : [{ name: 'Standard', hex: '#090909' }];
    const sizeList = sizes.length > 0 ? sizes : ['Standard'];

    const matrix: ProductSaveInput['variants'] = [];
    for (const s of sizeList) {
      for (const c of colours) {
        const existing = form.variants.find((v) => v.size === s && v.colour === c.name);
        matrix.push(
          existing || {
            size: s === 'Standard' ? '' : s,
            colour: c.name === 'Standard' ? '' : c.name,
            colour_hex: c.hex,
            sku: `${form.sku || 'MCFDJ'}-${s}-${c.name}`.replace(/\s+/g, '').toUpperCase(),
            stock_quantity: Math.max(1, form.stock_quantity || 5),
            is_available: true,
            price_override: null,
          }
        );
      }
    }
    setForm((prev) => ({ ...prev, variants: matrix }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedTags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const parsedSizes = sizesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const finalSlug = form.slug.trim() || slugify(form.name);
      const finalSku = form.sku.trim() || `MCFDJ-${Date.now().toString().slice(-6)}`;

      await saveAdminProduct({
        ...form,
        slug: finalSlug,
        sku: finalSku,
        tags: parsedTags,
        available_sizes: parsedSizes,
      });

      showToast(form.id ? 'Product updated successfully.' : 'New product published to catalogue.');
      setModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((p) => p.id));
  };

  const handleBulkAction = async (type: 'publish' | 'unpublish' | 'archive' | 'delete' | 'category') => {
    if (selectedIds.length === 0) return;
    try {
      if (type === 'publish') {
        await bulkUpdateProducts(selectedIds, { is_published: true, is_archived: false }, 'Bulk published');
      } else if (type === 'unpublish') {
        await bulkUpdateProducts(selectedIds, { is_published: false }, 'Bulk unpublished');
      } else if (type === 'archive') {
        await bulkUpdateProducts(selectedIds, { is_archived: true, is_published: false }, 'Bulk archived');
      } else if (type === 'category' && bulkCategoryId) {
        await bulkUpdateProducts(selectedIds, { category_id: bulkCategoryId }, 'Bulk reassigned category');
      } else if (type === 'delete') {
        if (!window.confirm(`Permanently delete ${selectedIds.length} selected product(s)?`)) return;
        await deleteProducts(selectedIds);
      }
      setSelectedIds([]);
      showToast('Bulk action completed.');
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Bulk action failed.', 'error');
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      'mcfdj-products.csv',
      [
        'name',
        'slug',
        'sku',
        'regular_price',
        'discounted_price',
        'cost_price',
        'stock_quantity',
        'short_description',
        'is_published',
        'is_featured',
        'is_new_arrival',
        'is_best_seller',
      ],
      products.map((p) => [
        p.name,
        p.slug,
        p.sku,
        p.regular_price,
        p.discounted_price ?? '',
        p.cost_price ?? '',
        p.stock_quantity,
        p.short_description,
        p.is_published,
        p.is_featured,
        p.is_new_arrival,
        p.is_best_seller,
      ])
    );
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      if (rows.length === 0) throw new Error('CSV file contains no data rows.');

      let importedCount = 0;
      for (const row of rows) {
        if (!row.name) continue;
        await saveAdminProduct({
          ...EMPTY_FORM,
          name: row.name,
          slug: row.slug || `${slugify(row.name)}-${Date.now().toString().slice(-4)}`,
          sku: row.sku || `MCFDJ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          regular_price: Number(row.regular_price) || 0,
          discounted_price: row.discounted_price ? Number(row.discounted_price) : null,
          cost_price: row.cost_price ? Number(row.cost_price) : null,
          stock_quantity: Number(row.stock_quantity) || 0,
          short_description: row.short_description || '',
          is_published: row.is_published === 'true',
          is_featured: row.is_featured === 'true',
          is_new_arrival: row.is_new_arrival === 'true',
          is_best_seller: row.is_best_seller === 'true',
          is_on_sale: Boolean(row.discounted_price),
          category_id: categories[0]?.id ?? null,
        });
        importedCount++;
      }
      showToast(`Imported ${importedCount} product(s) from CSV.`);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'CSV import failed.', 'error');
    } finally {
      if (csvFileRef.current) csvFileRef.current.value = '';
    }
  };

  const handleSeedStarterProducts = async () => {
    setSeedingStarter(true);
    try {
      const existingSlugs = new Set(products.map((p) => p.slug));
      let addedCount = 0;

      for (const item of STARTER_LUXURY_PRODUCTS) {
        if (existingSlugs.has(item.slug)) continue;
        const matchedCat = categories.find((c) => c.slug === item.categorySlug) || categories[0];
        await saveAdminProduct({
          name: item.name,
          slug: item.slug,
          short_description: item.short_description,
          description: item.description,
          category_id: matchedCat?.id ?? null,
          subcategory: item.subcategory,
          sku: item.sku,
          regular_price: item.regular_price,
          discounted_price: item.discounted_price,
          cost_price: null,
          currency: settings.default_currency || 'CAD',
          main_image_url: item.main_image_url,
          stock_quantity: item.stock_quantity,
          tags: item.tags,
          available_sizes: item.available_sizes,
          available_colours: item.available_colours,
          is_featured: item.is_featured,
          is_best_seller: item.is_best_seller,
          is_new_arrival: item.is_new_arrival,
          is_on_sale: item.is_on_sale,
          is_published: true,
          is_archived: false,
          seo_title: `${item.name} | MCFD J GLOBAL VENTURES`,
          seo_description: item.short_description,
          images: [
            {
              url: item.main_image_url,
              alt_text: item.name,
              sort_order: 0,
              is_main: true,
            },
          ],
          variants: [],
        });
        addedCount++;
      }

      if (addedCount === 0) {
        showToast('All 10 starter luxury pieces are already in your store catalogue.');
      } else {
        showToast(`Published ${addedCount} curated luxury pieces to the database.`);
      }
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to seed starter products.', 'error');
    } finally {
      setSeedingStarter(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#090909]">
            Product Catalogue Management
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Create, price, upload images, configure variants, and manage store inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {products.length < 10 && (
            <button
              type="button"
              disabled={seedingStarter}
              onClick={handleSeedStarterProducts}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D4AF5A] bg-[#FAF5EE] text-[#090909] text-xs font-semibold hover:bg-[#F1E8DC] disabled:opacity-60"
            >
              {seedingStarter ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Star className="w-3.5 h-3.5 text-[#B89038]" />
              )}
              {seedingStarter ? 'Publishing...' : 'Add 10 Starter Pieces'}
            </button>
          )}
          <input
            ref={csvFileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCsv}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => csvFileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium hover:border-[#090909]"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium hover:border-[#090909]"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#090909] text-white text-xs font-semibold hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4 text-[#D4AF5A]" />
            Add Product
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#E7DEC9] rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 text-xs focus:outline-none focus:border-[#090909]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'archived')
          }
          className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Unpublished / Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Bulk Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#090909] text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-medium text-[#E8BE62]">
            {selectedIds.length} product(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('unpublish')}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20"
            >
              Unpublish
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('archive')}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20"
            >
              Archive
            </button>
            <div className="flex items-center gap-1">
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="px-2 py-1.5 rounded bg-[#1A1A1A] border border-white/20 text-white"
              >
                <option value="">Assign category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {bulkCategoryId && (
                <button
                  type="button"
                  onClick={() => handleBulkAction('category')}
                  className="px-2.5 py-1.5 rounded bg-[#D4AF5A] text-[#090909] font-semibold"
                >
                  Apply
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-neutral-500">
            Loading catalogue from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-serif text-2xl font-semibold text-[#090909] mb-1">
              No products yet
            </p>
            <p className="text-xs text-neutral-500 mb-5">
              Click Add Product to create your first luxury fashion item.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#090909] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4 text-[#D4AF5A]" />
              Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E7DEC9] text-neutral-600">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3.5 font-semibold">Product</th>
                  <th className="p-3.5 font-semibold">Category</th>
                  <th className="p-3.5 font-semibold">Price</th>
                  <th className="p-3.5 font-semibold">Cost</th>
                  <th className="p-3.5 font-semibold">Stock</th>
                  <th className="p-3.5 font-semibold">Visibility</th>
                  <th className="p-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAF5EE]/60">
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(product.id)
                              ? prev.filter((x) => x !== product.id)
                              : [...prev, product.id]
                          )
                        }
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-12 rounded-lg overflow-hidden bg-[#F1E8DC] shrink-0">
                          <SafeImage
                            src={product.main_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#090909] truncate max-w-[220px]">
                            {product.name}
                          </p>
                          <p className="text-[11px] font-mono text-neutral-500">
                            {product.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-neutral-600">
                      {product.category?.name || '—'}
                    </td>
                    <td className="p-3.5 tabular-nums">
                      <span className="font-semibold text-[#090909]">
                        {formatPrice(
                          product.is_on_sale && product.discounted_price !== null
                            ? product.discounted_price
                            : product.regular_price,
                          settings.currency_symbol
                        )}
                      </span>
                      {product.is_on_sale && product.discounted_price !== null && (
                        <span className="block text-[11px] text-neutral-400 line-through">
                          {formatPrice(product.regular_price, settings.currency_symbol)}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 tabular-nums text-neutral-500">
                      {product.cost_price !== null && product.cost_price !== undefined
                        ? formatPrice(product.cost_price, settings.currency_symbol)
                        : '—'}
                    </td>
                    <td className="p-3.5 tabular-nums">
                      <span
                        className={`font-semibold ${
                          product.stock_quantity <= 0 ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          product.is_archived
                            ? 'bg-neutral-100 text-neutral-600'
                            : product.is_published
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {product.is_archived
                          ? 'Archived'
                          : product.is_published
                          ? 'Published'
                          : 'Draft'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit product"
                          onClick={() => openEditModal(product)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Duplicate product"
                          onClick={() => openEditModal(product, true)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title={product.is_published ? 'Unpublish' : 'Publish'}
                          onClick={async () => {
                            await bulkUpdateProducts(
                              [product.id],
                              { is_published: !product.is_published, is_archived: false },
                              product.is_published ? 'Unpublished' : 'Published'
                            );
                            await loadData();
                          }}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700"
                        >
                          {product.is_published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Archive"
                          onClick={async () => {
                            await bulkUpdateProducts(
                              [product.id],
                              { is_archived: !product.is_archived, is_published: false },
                              'Toggled archive'
                            );
                            await loadData();
                          }}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete product"
                          onClick={async () => {
                            if (!window.confirm(`Delete "${product.name}" permanently?`)) return;
                            await deleteProducts([product.id]);
                            await loadData();
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl border border-[#E7DEC9] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#090909] text-white flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold">
                {form.id ? `Edit Product: ${form.name}` : 'Add New Luxury Product'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name: val,
                        slug: prev.id ? prev.slug : slugify(val),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Product Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={form.category_id || ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category_id: e.target.value || null }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm bg-white"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={form.subcategory}
                    onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
                    placeholder="e.g. Evening Gowns"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Product SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    placeholder="e.g. MCFD-DRS-001"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Total Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stock_quantity}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, stock_quantity: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#FAF5EE] p-4 rounded-xl border border-[#E7DEC9]">
                <div>
                  <label className="block text-xs font-semibold mb-1">Regular Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.regular_price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, regular_price: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Discounted Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discounted_price ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        discounted_price: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Cost Price (Private Admin)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost_price ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        cost_price: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Currency</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Short Description</label>
                  <input
                    type="text"
                    value={form.short_description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, short_description: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Description</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
              </div>

              {/* Multi-Image Upload & Gallery Manager */}
              <div className="space-y-3 border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#090909]">
                      Product Images (Vercel Blob)
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Upload multiple images, reorder, or choose the Main display image.
                    </p>
                  </div>
                  <input
                    ref={multiFileRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleMultiImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => multiFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#090909] text-white text-xs font-semibold"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF5A]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#D4AF5A]" />
                    )}
                    Upload Photos
                  </button>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {form.images.map((img, idx) => (
                      <div
                        key={img.url + idx}
                        className={`border rounded-lg p-2 space-y-2 ${
                          img.is_main ? 'border-[#D4AF5A] bg-[#FAF5EE]' : 'border-neutral-200'
                        }`}
                      >
                        <div className="aspect-square rounded overflow-hidden bg-neutral-100">
                          <SafeImage
                            src={img.url}
                            alt={img.alt_text}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => setMainImage(idx)}
                            className={`inline-flex items-center gap-1 font-medium ${
                              img.is_main ? 'text-[#9A7422]' : 'text-neutral-500 hover:text-[#090909]'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${img.is_main ? 'fill-[#D4AF5A]' : ''}`} />
                            {img.is_main ? 'Main' : 'Set Main'}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveImage(idx, -1)}
                              className="px-1 text-neutral-500 hover:text-black"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(idx, 1)}
                              className="px-1 text-neutral-500 hover:text-black"
                            >
                              →
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="text-red-600 px-1"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes, Colours, Tags & Variants */}
              <div className="space-y-4 border border-neutral-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Available Sizes (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={sizesText}
                      onChange={(e) => setSizesText(e.target.value)}
                      placeholder="XS, S, M, L, XL"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Product Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder="silk, evening, tailored"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Available Colours</label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {form.available_colours.map((c) => (
                      <span
                        key={c.name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-300 text-xs"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}
                        <button
                          type="button"
                          onClick={() => removeColourOption(c.name)}
                          className="text-neutral-400 hover:text-red-600 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colourHex}
                      onChange={(e) => setColourHex(e.target.value)}
                      className="w-9 h-9 rounded border border-neutral-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colourName}
                      onChange={(e) => setColourName(e.target.value)}
                      placeholder="Colour name (e.g. Obsidian Black)"
                      className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={addColourOption}
                      className="px-3.5 py-2 rounded-lg bg-[#090909] text-white text-xs font-medium"
                    >
                      Add Colour
                    </button>
                    <button
                      type="button"
                      onClick={generateVariantMatrix}
                      className="px-3.5 py-2 rounded-lg border border-[#090909] text-xs font-semibold"
                    >
                      Generate Variants
                    </button>
                  </div>
                </div>

                {form.variants.length > 0 && (
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b text-neutral-500">
                          <th className="py-1.5 pr-2">Size</th>
                          <th className="py-1.5 pr-2">Colour</th>
                          <th className="py-1.5 pr-2">Variant SKU</th>
                          <th className="py-1.5 pr-2">Stock</th>
                          <th className="py-1.5 pr-2">Available</th>
                          <th className="py-1.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {form.variants.map((v, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 pr-2">{v.size || '—'}</td>
                            <td className="py-1.5 pr-2">{v.colour || '—'}</td>
                            <td className="py-1.5 pr-2">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setForm((p) => {
                                    const next = [...p.variants];
                                    next[idx] = { ...next[idx], sku: val };
                                    return { ...p, variants: next };
                                  });
                                }}
                                className="px-2 py-1 rounded border border-neutral-200 font-mono w-36"
                              />
                            </td>
                            <td className="py-1.5 pr-2">
                              <input
                                type="number"
                                min="0"
                                value={v.stock_quantity}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setForm((p) => {
                                    const next = [...p.variants];
                                    next[idx] = { ...next[idx], stock_quantity: val };
                                    return { ...p, variants: next };
                                  });
                                }}
                                className="px-2 py-1 rounded border border-neutral-200 w-20 tabular-nums"
                              />
                            </td>
                            <td className="py-1.5 pr-2">
                              <input
                                type="checkbox"
                                checked={v.is_available}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setForm((p) => {
                                    const next = [...p.variants];
                                    next[idx] = { ...next[idx], is_available: val };
                                    return { ...p, variants: next };
                                  });
                                }}
                              />
                            </td>
                            <td className="py-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((p) => ({
                                    ...p,
                                    variants: p.variants.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="text-red-600"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Visibility Toggles & SEO */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#FAF5EE] p-4 rounded-xl border border-[#E7DEC9] text-xs font-medium">
                {[
                  ['is_published', 'Published'],
                  ['is_featured', 'Featured'],
                  ['is_new_arrival', 'New Arrival'],
                  ['is_best_seller', 'Best Seller'],
                  ['is_on_sale', 'On Sale'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof ProductSaveInput])}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [key]: e.target.checked }))
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={form.seo_title}
                    onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">SEO Description</label>
                  <input
                    type="text"
                    value={form.seo_description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, seo_description: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-[#090909] text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
