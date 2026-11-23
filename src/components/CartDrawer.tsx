import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { formatPrice } from '@/src/utils/format';
import { SafeImage } from './SafeImage';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.96L2 22l5.26-1.38a9.86 9.86 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm5.77 14.08c-.24.68-1.42 1.31-1.97 1.39-.5.08-1.15.11-1.85-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.29-5.06-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.84 2.04.91 2.19.08.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.18.3.78 1.29 1.67 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.13.08.73-.17 1.42Z" />
    </svg>
  );
}

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
    <aside
      role="dialog"
      aria-label="Your Cart"
      className="no-print fixed right-3 sm:right-6 bottom-[126px] lg:bottom-22 z-50 w-[calc(100vw-24px)] sm:w-[350px] bg-white text-[#242424] rounded-2xl shadow-[0_22px_60px_rgba(9,9,9,0.28)] border border-[#E7DEC9] overflow-hidden flex flex-col"
    >
      {/* Floating Card Header */}
      <div className="px-4 py-3.5 bg-[#FAF5EE]/80 border-b border-[#EFE6D6] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#090909]" />
          <h2 className="text-sm font-bold text-[#090909]">
            Your Cart ({totalItems})
          </h2>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close cart"
          className="p-1 rounded-lg text-neutral-500 hover:text-[#090909] hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Items List */}
      <div className="max-h-[260px] sm:max-h-[300px] overflow-y-auto px-4 py-3 divide-y divide-[#F3ECE0]">
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingCart className="w-8 h-8 text-[#D4AF5A] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#090909] mb-1">Your cart is empty</p>
            <p className="text-xs text-neutral-500 mb-4">
              Tap the cart icon on any item to add it here.
            </p>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                navigate('/shop');
              }}
              className="px-4 py-2 rounded-lg bg-[#090909] text-[#E8BE62] text-xs font-semibold hover:bg-neutral-800"
            >
              Browse Store
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.key} className="py-3 first:pt-1 last:pb-1 flex items-start gap-3">
              <Link
                to={`/product/${item.slug}`}
                onClick={closeDrawer}
                className="w-12 h-14 rounded-lg overflow-hidden bg-[#FAF5EE] border border-[#E7DEC9] shrink-0"
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
                    className="text-xs font-semibold text-[#090909] hover:text-[#9A7422] leading-snug line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="text-neutral-400 hover:text-red-600 transition-colors shrink-0 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-neutral-500">
                  {item.availableSizes.length > 0 ? (
                    <select
                      aria-label="Select size"
                      value={item.size}
                      onChange={(e) => updateItemVariant(item.key, { size: e.target.value })}
                      className="bg-[#FAF5EE] border border-[#E7DEC9] rounded px-1.5 py-0.5 text-[10px] text-[#242424]"
                    >
                      {item.availableSizes.map((s) => (
                        <option key={s} value={s}>
                          Size: {s}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <span>Qty: {item.quantity}</span>
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs font-bold text-[#090909] tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity, settings.currency_symbol)}
                  </span>

                  <div className="inline-flex items-center border border-[#E7DEC9] rounded-md bg-[#FAF5EE]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="px-1.5 py-0.5 text-neutral-700 hover:text-[#090909]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-1.5 text-[11px] font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="px-1.5 py-0.5 text-neutral-700 hover:text-[#090909]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Footer */}
      {items.length > 0 && (
        <div className="p-4 bg-[#FAF5EE]/60 border-t border-[#EFE6D6] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700">Subtotal</span>
            <span className="text-sm font-bold text-[#090909] tabular-nums">
              {formatPrice(subtotal, settings.currency_symbol)}
            </span>
          </div>

          <Link
            to="/checkout"
            onClick={closeDrawer}
            className="w-full py-2.5 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
            <span>Checkout via WhatsApp</span>
          </Link>

          <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
            <span>Your order will open in WhatsApp with all details</span>
            <Link
              to="/cart"
              onClick={closeDrawer}
              className="text-[#090909] font-semibold hover:underline shrink-0 ml-2"
            >
              Full Bag
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
