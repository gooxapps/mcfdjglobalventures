import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/src/types/store';
import { formatPrice } from '@/src/utils/format';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

const WISHLIST_KEY = 'mcfdj_wishlist_ids_v1';

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, openDrawer } = useCart();
  const { settings } = useStore();
  const { showToast } = useToast();
  const [wishlisted, setWishlisted] = useState<boolean>(() =>
    readWishlist().includes(product.id)
  );

  const currentPrice =
    product.is_on_sale && product.discounted_price !== null
      ? product.discounted_price
      : product.regular_price;

  const isOutOfStock = product.stock_quantity <= 0;

  let singleLabel: string | null = null;
  if (isOutOfStock) {
    singleLabel = 'Sold Out';
  } else if (product.is_on_sale && product.discounted_price !== null) {
    singleLabel = 'Sale';
  } else if (product.is_new_arrival) {
    singleLabel = 'New';
  } else if (product.is_best_seller) {
    singleLabel = 'Hot';
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = readWishlist();
    const next = current.includes(product.id)
      ? current.filter((id) => id !== product.id)
      : [...current, product.id];
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
    const added = next.includes(product.id);
    setWishlisted(added);
    showToast(
      added ? `${product.name} saved to wishlist.` : `${product.name} removed from wishlist.`
    );
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, { quantity: 1 });
    showToast(`${product.name} added to your shopping bag.`);
    openDrawer();
  };

  return (
    <article className="group bg-white border border-[#E7DEC9] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(9,9,9,0.14)]">
      <Link
        to={`/product/${product.slug}`}
        className="relative aspect-square w-full bg-[#FAF5EE] overflow-hidden block"
      >
        <SafeImage
          src={product.main_image_url || product.images?.[0]?.url}
          alt={product.name}
          fallbackLabel={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-[#E7DEC9] flex items-center justify-center text-[#090909] hover:border-[#D4AF5A] transition-colors shadow-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              wishlisted ? 'fill-[#D4AF5A] text-[#D4AF5A]' : 'text-neutral-600'
            }`}
          />
        </button>

        {singleLabel && (
          <span
            className={`absolute top-2 right-2 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-full shadow-xs ${
              isOutOfStock
                ? 'bg-[#090909]/85 text-white'
                : singleLabel === 'Sale'
                ? 'bg-[#DC2626] text-white'
                : singleLabel === 'New'
                ? 'bg-[#E8BE62] text-[#090909]'
                : 'bg-[#D4AF5A] text-[#090909]'
            }`}
          >
            {singleLabel}
          </span>
        )}
      </Link>

      <div className="px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center justify-between gap-2 bg-[#FAF5EE]/40">
        <div className="min-w-0 flex-1">
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-xs sm:text-[13px] font-semibold text-[#090909] leading-snug group-hover:text-[#9A7422] transition-colors truncate">
              {product.name}
            </h3>
          </Link>
          <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5 tabular-nums">
            {product.is_on_sale &&
            product.discounted_price !== null &&
            product.regular_price > product.discounted_price ? (
              <>
                <span className="text-[10px] sm:text-[11px] text-neutral-400 line-through">
                  {formatPrice(product.regular_price, settings.currency_symbol)}
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#DC2626]">
                  {formatPrice(currentPrice, settings.currency_symbol)}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-[13px] font-bold text-[#090909]">
                {formatPrice(currentPrice, settings.currency_symbol)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleQuickAdd}
          aria-label={isOutOfStock ? 'Unavailable' : `Add ${product.name} to cart`}
          title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#E7DEC9] bg-white text-[#090909] hover:bg-[#090909] hover:text-[#E8BE62] hover:border-[#090909] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors shadow-2xs"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
