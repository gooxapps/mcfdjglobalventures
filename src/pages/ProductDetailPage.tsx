import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  fetchProductBySlug,
  fetchRelatedProducts,
} from '@/src/services/storefrontService';
import type { Product } from '@/src/types/store';
import { formatPrice } from '@/src/utils/format';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';
import { ProductCard } from '@/src/components/ProductCard';
import { SafeImage } from '@/src/components/SafeImage';
import { SeoHead } from '@/src/components/SeoHead';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useStore();
  const { addToCart, openDrawer } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColour, setSelectedColour] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const p = await fetchProductBySlug(slug);
        if (!active) return;
        setProduct(p);
        if (p) {
          const gallery = [
            ...(p.main_image_url ? [p.main_image_url] : []),
            ...(p.images?.map((i) => i.url) || []),
          ];
          setActiveImage(gallery[0] || '');
          setSelectedSize(p.available_sizes?.[0] || '');
          setSelectedColour(p.available_colours?.[0]?.name || '');
          setQuantity(1);
          const rel = await fetchRelatedProducts(p.id, p.category_id, 4);
          if (active) setRelated(rel);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const urls = new Set<string>();
    if (product.main_image_url) urls.add(product.main_image_url);
    product.images?.forEach((img) => {
      if (img.url) urls.add(img.url);
    });
    return Array.from(urls);
  }, [product]);

  const activeVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return undefined;
    return product.variants.find(
      (v) =>
        (!selectedSize || v.size === selectedSize) &&
        (!selectedColour || v.colour === selectedColour)
    );
  }, [product, selectedSize, selectedColour]);

  const isVariantSelectable = (sizeVal: string, colourVal: string): boolean => {
    if (!product?.variants || product.variants.length === 0) return true;
    return product.variants.some(
      (v) =>
        v.is_available &&
        v.stock_quantity > 0 &&
        (!sizeVal || v.size === sizeVal) &&
        (!colourVal || v.colour === colourVal)
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/5] bg-white rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-white rounded w-2/3 animate-pulse" />
            <div className="h-6 bg-white rounded w-1/3 animate-pulse" />
            <div className="h-32 bg-white rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#090909] mb-3">
          Product Not Found
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          This piece may have been archived or is no longer available.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#090909] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Boutique
        </Link>
      </div>
    );
  }

  const effectivePrice =
    activeVariant?.price_override !== null && activeVariant?.price_override !== undefined
      ? Number(activeVariant.price_override)
      : product.is_on_sale && product.discounted_price !== null
      ? Number(product.discounted_price)
      : Number(product.regular_price);

  const effectiveStock = activeVariant
    ? activeVariant.is_available
      ? activeVariant.stock_quantity
      : 0
    : product.stock_quantity;

  const isOutOfStock = effectiveStock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, {
      size: selectedSize,
      colour: selectedColour,
      variant: activeVariant,
      quantity,
    });
    showToast(`${product.name} added to your shopping bag.`);
    openDrawer();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, {
      size: selectedSize,
      colour: selectedColour,
      variant: activeVariant,
      quantity,
    });
    navigate('/checkout');
  };

  const canInquireWhatsApp =
    settings.whatsapp_inquiry_enabled &&
    settings.whatsapp_country_confirmed &&
    normalizeWhatsAppDigits(settings.whatsapp_number).length >= 11;

  const inquiryUrl = canInquireWhatsApp
    ? buildWhatsAppUrl(
        settings.whatsapp_number,
        `Hello MCFD J GLOBAL VENTURES, I would like to inquire about "${product.name}" (SKU: ${
          activeVariant?.sku || product.sku
        })${selectedSize ? `, Size: ${selectedSize}` : ''}${
          selectedColour ? `, Colour: ${selectedColour}` : ''
        }.`
      )
    : '';

  return (
    <>
      <SeoHead
        title={product.seo_title || `${product.name} | ${settings.business_name}`}
        description={product.seo_description || product.short_description || product.description}
        ogImage={product.main_image_url || undefined}
        canonicalPath={`/product/${product.slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: galleryImages,
          description: product.short_description || product.description,
          sku: product.sku,
          offers: {
            '@type': 'Offer',
            priceCurrency: product.currency || settings.default_currency,
            price: effectivePrice,
            availability: isOutOfStock
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          },
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
          <Link to="/" className="hover:text-[#090909]">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#090909]">
            Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                to={`/shop?category=${encodeURIComponent(product.category.slug)}`}
                className="hover:text-[#090909]"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#090909] font-medium truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] bg-white border border-[#E7DEC9] rounded-xl overflow-hidden">
              <SafeImage
                src={activeImage || product.main_image_url}
                alt={product.name}
                fallbackLabel={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {galleryImages.map((url, idx) => (
                  <button
                    key={url + idx}
                    type="button"
                    onClick={() => setActiveImage(url)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImage === url
                        ? 'border-[#090909]'
                        : 'border-transparent hover:border-[#D4AF5A]'
                    }`}
                  >
                    <SafeImage
                      src={url}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-5 bg-white border border-[#E7DEC9] rounded-xl p-6 sm:p-8 lg:sticky lg:top-28 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9A7422] font-medium mb-1">
                {product.category?.name || 'MCFD J Atelier'} · SKU {activeVariant?.sku || product.sku}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#090909] leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-semibold text-[#090909]">
                {formatPrice(effectivePrice, settings.currency_symbol)}
              </span>
              {product.is_on_sale &&
                product.discounted_price !== null &&
                product.regular_price > effectivePrice && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatPrice(product.regular_price, settings.currency_symbol)}
                  </span>
                )}
            </div>

            <div className="text-xs font-medium">
              {isOutOfStock ? (
                <span className="text-red-600">Currently Out of Stock</span>
              ) : (
                <span className="text-emerald-700 inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  In Stock ({effectiveStock} available)
                </span>
              )}
            </div>

            {product.short_description && (
              <p className="text-sm text-neutral-700 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Size Selector */}
            {product.available_sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[#090909]">
                    Select Size
                  </span>
                  <span className="text-neutral-500">{selectedSize}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.available_sizes.map((size) => {
                    const available = isVariantSelectable(size, selectedColour);
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[46px] px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedSize === size
                            ? 'bg-[#090909] text-[#E8BE62] border-[#090909]'
                            : available
                            ? 'bg-[#FAF5EE] text-[#242424] border-[#E2D6C1] hover:border-[#090909]'
                            : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colour Selector */}
            {product.available_colours.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[#090909]">
                    Select Colour
                  </span>
                  <span className="text-neutral-500">{selectedColour}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.available_colours.map((col) => {
                    const available = isVariantSelectable(selectedSize, col.name);
                    return (
                      <button
                        key={col.name}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedColour(col.name)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          selectedColour === col.name
                            ? 'border-[#090909] bg-[#FAF5EE] font-semibold'
                            : available
                            ? 'border-[#E2D6C1] hover:border-[#090909]'
                            : 'opacity-45 cursor-not-allowed border-neutral-200'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: col.hex || '#090909' }}
                        />
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & CTAs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#090909]">
                  Quantity
                </span>
                <div className="inline-flex items-center border border-[#E2D6C1] rounded-lg bg-[#FAF5EE]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="p-2.5 text-neutral-700 hover:text-[#090909]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-semibold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        effectiveStock > 0 ? Math.min(effectiveStock, q + 1) : q + 1
                      )
                    }
                    aria-label="Increase quantity"
                    className="p-2.5 text-neutral-700 hover:text-[#090909]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAdd}
                  className="py-3.5 px-5 rounded-lg bg-[#090909] text-white text-sm font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#D4AF5A]" />
                  Add to Bag
                </button>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="py-3.5 px-5 rounded-lg bg-[#D4AF5A] text-[#090909] text-sm font-semibold hover:bg-[#E8BE62] disabled:bg-neutral-200 disabled:text-neutral-500 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Buy Now
                </button>
              </div>

              {canInquireWhatsApp && (
                <a
                  href={inquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-5 rounded-lg border border-[#15803D] text-[#15803D] text-xs font-semibold hover:bg-[#15803D] hover:text-white transition-colors inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask Stylist About This Piece on WhatsApp
                </a>
              )}
            </div>

            {product.description && (
              <div className="pt-4 border-t border-[#F1E8DC]">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#090909] mb-2">
                  Atelier Notes &amp; Details
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E5D9C5]">
            <h2 className="font-serif text-3xl font-semibold text-[#090909] mb-8">
              Complementary Pieces
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
