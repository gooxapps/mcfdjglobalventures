import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { formatPrice } from '@/src/utils/format';
import { SafeImage } from './SafeImage';

export function CartDrawer() {
  const {
    items,
    totalItems,
    subtotal,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    updateItemVariant,
    removeItem,
  } = useCart();
  const { settings } = useStore();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Shopping Bag"
        className="relative z-10 w-full max-w-md bg-[#FAF5EE] text-[#242424] h-full flex flex-col shadow-2xl border-l border-[#E5D9C5]"
      >
        <div className="px-6 py-5 bg-[#090909] text-white flex items-center justify-between border-b border-[#D4AF5A]/30">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#D4AF5A]" />
            <h2 className="font-serif text-xl font-semibold tracking-wide">
              Your Shopping Bag ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close shopping bag"
            className="p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#F1E8DC] flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-[#9A7422]" />
              </div>
              <p className="font-serif text-xl font-semibold text-[#090909] mb-1">
                Your bag is currently empty
              </p>
              <p className="text-sm text-neutral-600 max-w-xs mb-6">
                Explore our curated apparel, leather bags, footwear, and fine jewellery collections.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  navigate('/shop');
                }}
                className="px-5 py-2.5 bg-[#090909] text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Explore Shop
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.key}
                className="bg-white border border-[#E7DEC9] rounded-xl p-4 flex gap-4"
              >
                <Link
                  to={`/product/${item.slug}`}
                  onClick={closeDrawer}
                  className="w-20 h-24 rounded-lg overflow-hidden bg-[#F1E8DC] shrink-0"
                >
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={closeDrawer}
                      className="font-serif text-base font-semibold text-[#090909] hover:text-[#9A7422] line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove ${item.name}`}
                      className="text-neutral-400 hover:text-red-600 transition-colors shrink-0 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-[#090909] tabular-nums mt-0.5">
                    {formatPrice(item.unitPrice, settings.currency_symbol)}
                  </p>

                  {(item.availableSizes.length > 0 || item.availableColours.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.availableSizes.length > 0 && (
                        <select
                          aria-label="Select size"
                          value={item.size}
                          onChange={(e) =>
                            updateItemVariant(item.key, { size: e.target.value })
                          }
                          className="text-xs bg-[#FAF5EE] border border-[#E2D6C1] rounded px-2 py-1 text-[#242424]"
                        >
                          {item.availableSizes.map((s) => (
                            <option key={s} value={s}>
                              Size: {s}
                            </option>
                          ))}
                        </select>
                      )}
                      {item.availableColours.length > 0 && (
                        <select
                          aria-label="Select colour"
                          value={item.colour}
                          onChange={(e) =>
                            updateItemVariant(item.key, { colour: e.target.value })
                          }
                          className="text-xs bg-[#FAF5EE] border border-[#E2D6C1] rounded px-2 py-1 text-[#242424]"
                        >
                          {item.availableColours.map((c) => (
                            <option key={c.name} value={c.name}>
                              Colour: {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#E2D6C1] rounded-lg bg-[#FAF5EE]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-neutral-700 hover:text-[#090909]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 text-neutral-700 hover:text-[#090909]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-[#242424] tabular-nums">
                      {formatPrice(item.unitPrice * item.quantity, settings.currency_symbol)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-[#E5D9C5] space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="text-lg font-semibold text-[#090909] tabular-nums">
                {formatPrice(subtotal, settings.currency_symbol)}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Delivery fees and payment instructions are finalized directly with our WhatsApp concierge.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="py-3 px-4 rounded-lg border border-[#090909] text-center text-xs font-semibold text-[#090909] hover:bg-[#FAF5EE] transition-colors"
              >
                View Full Bag
              </Link>
              <Link
                to="/checkout"
                onClick={closeDrawer}
                className="py-3 px-4 rounded-lg bg-[#090909] text-white text-center text-xs font-semibold hover:bg-[#1D1D1D] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                WhatsApp Checkout
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF5A]" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
