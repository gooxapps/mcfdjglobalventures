import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { fetchPublishedProducts } from '@/src/services/storefrontService';
import type { Product } from '@/src/types/store';
import { ProductCard } from '@/src/components/ProductCard';
import { SeoHead } from '@/src/components/SeoHead';

const PAGE_SIZE = 12;

export function ShopPage() {
  const { settings, categories, databaseConnected } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';
  const initialSort =
    (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc' | 'popular') ||
    'newest';
  const initialFilter = searchParams.get('filter') || '';

  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>(
    initialSort
  );
  const [onlySale, setOnlySale] = useState(initialFilter === 'sale');
  const [onlyFeatured, setOnlyFeatured] = useState(initialFilter === 'featured');
  const [onlyNew, setOnlyNew] = useState(initialFilter === 'new');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const list = await fetchPublishedProducts({
          search,
          categorySlug: selectedCategory || undefined,
          featuredOnly: onlyFeatured,
          onSaleOnly: onlySale,
          newArrivalsOnly: onlyNew,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sortBy,
        });
        if (active) {
          setProducts(list);
          setPage(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [search, selectedCategory, onlyFeatured, onlySale, onlyNew, minPrice, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const paginatedProducts = useMemo(
    () => products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [products, page]
  );

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setOnlySale(false);
    setOnlyFeatured(false);
    setOnlyNew(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <>
      <SeoHead
        title={`Shop Collection | ${settings.business_name}`}
        description="Browse luxury women's fashion, men's tailoring, leather handbags, footwear, and fine jewellery at MCFD J GLOBAL VENTURES."
        canonicalPath="/shop"
      />

      <div className="bg-[#090909] text-white border-b border-[#D4AF5A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[#E8BE62] mb-1 sm:mb-2">
            MCFD J GLOBAL VENTURES
          </p>
          <h1 className="font-serif text-2xl sm:text-5xl font-semibold">
            The Boutique Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 max-w-2xl">
            Filter by collection, price, or seasonal edit. Add multiple items to your bag and order directly via WhatsApp.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-10">
        {/* Filter Toolbar */}
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-3.5 sm:p-5 mb-5 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-4 items-center">
            <div className="col-span-2 md:col-span-4 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-xs sm:text-sm focus:outline-none focus:border-[#090909]"
              />
            </div>

            <div className="col-span-1 md:col-span-3">
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategory(val);
                  if (val) setSearchParams({ category: val });
                  else setSearchParams({});
                }}
                className="w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-xs sm:text-sm focus:outline-none focus:border-[#090909]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 md:order-last">
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'newest' | 'price_asc' | 'price_desc' | 'popular'
                  )
                }
                className="w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-xs sm:text-sm focus:outline-none focus:border-[#090909]"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-3 flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min $"
                className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-xs sm:text-sm tabular-nums"
              />
              <span className="text-neutral-400">–</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max $"
                className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-xs sm:text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1E8DC]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Edits:
              </span>
              <button
                type="button"
                onClick={() => setOnlyFeatured((v) => !v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  onlyFeatured
                    ? 'bg-[#090909] text-[#E8BE62]'
                    : 'bg-[#FAF5EE] text-[#242424] hover:bg-[#F1E8DC]'
                }`}
              >
                Featured
              </button>
              <button
                type="button"
                onClick={() => setOnlyNew((v) => !v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  onlyNew
                    ? 'bg-[#090909] text-[#E8BE62]'
                    : 'bg-[#FAF5EE] text-[#242424] hover:bg-[#F1E8DC]'
                }`}
              >
                New Arrivals
              </button>
              <button
                type="button"
                onClick={() => setOnlySale((v) => !v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  onlySale
                    ? 'bg-[#090909] text-[#E8BE62]'
                    : 'bg-[#FAF5EE] text-[#242424] hover:bg-[#F1E8DC]'
                }`}
              >
                On Sale
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <span className="tabular-nums">{products.length} piece(s) found</span>
              {(search || selectedCategory || onlyFeatured || onlyNew || onlySale || minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[#090909] font-medium hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Catalogue Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#E7DEC9] rounded-xl h-56 sm:h-96 animate-pulse"
              />
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="bg-white border border-[#E7DEC9] rounded-xl p-12 text-center">
            <p className="font-serif text-2xl font-semibold text-[#090909] mb-2">
              {databaseConnected ? 'No matching pieces found' : 'Collection Catalogue Updating'}
            </p>
            <p className="text-sm text-neutral-600 max-w-md mx-auto mb-6">
              {databaseConnected
                ? 'Try clearing active filters or exploring another fashion category.'
                : 'Our seasonal pieces are currently being curated. Check back shortly or contact our client concierge for bespoke inquiries.'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-lg bg-[#090909] text-white text-xs font-semibold"
              >
                Reset Filters
              </button>
              <Link
                to="/contact"
                className="px-5 py-2.5 rounded-lg border border-[#090909] text-xs font-semibold"
              >
                Contact Concierge
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const num = idx + 1;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPage(num);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-9 h-9 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                        page === num
                          ? 'bg-[#090909] text-[#E8BE62]'
                          : 'bg-white border border-[#E7DEC9] text-[#242424] hover:border-[#090909]'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
