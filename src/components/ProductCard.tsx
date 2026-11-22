import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/src/types/store';
import { formatPrice } from '@/src/utils/format';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, openDrawer } = useCart();
  const { settings } = useStore();
  const { showToast } = useToast();

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
    singleLabel = 'New Arrival';
  } else if (product.is_best_seller) {
    singleLabel = 'Best Seller';
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, { quantity: 1 });
    showToast(`${product.name} added to your shopping bag.`);
    openDrawer();
  };

  return (
    <article className="group bg-white border border-[#E7DEC9] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-12px_rgba(9,9,9,0.12)]">
      <Link
        to={`/product/${product.slug}`}
        className="relative aspect-[4/5] w-full bg-[#F1E8DC] overflow-hidden block"
      >
        <SafeImage
          src={product.main_image_url || product.images?.[0]?.url}
          alt={product.name}
          fallbackLabel={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {singleLabel && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase rounded ${
              isOutOfStock
                ? 'bg-[#090909]/85 text-white'
                : singleLabel === 'Sale'
                ? 'bg-[#090909] text-[#E8BE62]'
                : 'bg-[#FAF5EE]/95 text-[#090909]'
            }`}
          >
            {singleLabel}
          </span>
        )}
      </Link>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1 truncate">
            {product.category?.name || 'Atelier Collection'}
          </p>
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-serif text-lg font-semibold text-[#090909] leading-snug group-hover:text-[#9A7422] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-2.5 tabular-nums">
            <span className="text-[15px] font-semibold text-[#090909]">
              {formatPrice(currentPrice, settings.currency_symbol)}
            </span>
            {product.is_on_sale &&
              product.discounted_price !== null &&
              product.regular_price > product.discounted_price && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(product.regular_price, settings.currency_symbol)}
                </span>
              )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#090909] text-white text-xs font-medium tracking-wide hover:bg-[#1E1E1E] disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF5A]" />
              {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
            </button>
            <Link
              to={`/product/${product.slug}`}
              className="py-2.5 px-3 rounded-lg border border-[#E2D6C1] text-xs font-medium text-[#242424] hover:border-[#090909] transition-colors whitespace-nowrap"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
