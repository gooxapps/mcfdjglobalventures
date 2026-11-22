import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { formatPrice } from '@/src/utils/format';
import { SafeImage } from '@/src/components/SafeImage';
import { SeoHead } from '@/src/components/SeoHead';

export function CartPage() {
  const { items, subtotal, totalItems, updateQuantity, updateItemVariant, removeItem, clearCart } =
    useCart();
  const { settings } = useStore();

  return (
    <>
      <SeoHead
        title={`Shopping Bag | ${settings.business_name}`}
        description="Review your selected luxury items and proceed to WhatsApp concierge checkout."
        canonicalPath="/cart"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#9A7422] font-medium mb-1">
              MCFD J GLOBAL VENTURES
            </p>
            <h1 className="font-serif text-4xl font-semibold text-[#090909]">
              Your Shopping Bag ({totalItems})
            </h1>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-neutral-500 hover:text-red-600 underline self-start sm:self-auto"
            >
              Clear Shopping Bag
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-[#E7DEC9] rounded-xl p-14 text-center">
            <ShoppingBag className="w-10 h-10 text-[#9A7422] mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-semibold text-[#090909] mb-2">
              Your shopping bag is empty
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              Add one or multiple pieces to your bag and send a unified order request via WhatsApp.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#090909] text-white text-sm font-semibold"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4 text-[#D4AF5A]" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="bg-white border border-[#E7DEC9] rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                >
                  <Link
                    to={`/product/${item.slug}`}
                    className="w-24 h-28 rounded-lg overflow-hidden bg-[#F1E8DC] shrink-0"
                  >
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          to={`/product/${item.slug}`}
                          className="font-serif text-xl font-semibold text-[#090909] hover:text-[#9A7422]"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-neutral-500">SKU: {item.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`Remove ${item.name}`}
                        className="text-neutral-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {item.availableSizes.length > 0 && (
                        <select
                          aria-label="Size"
                          value={item.size}
                          onChange={(e) =>
                            updateItemVariant(item.key, { size: e.target.value })
                          }
                          className="text-xs bg-[#FAF5EE] border border-[#E2D6C1] rounded-md px-2.5 py-1.5"
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
                          aria-label="Colour"
                          value={item.colour}
                          onChange={(e) =>
                            updateItemVariant(item.key, { colour: e.target.value })
                          }
                          className="text-xs bg-[#FAF5EE] border border-[#E2D6C1] rounded-md px-2.5 py-1.5"
                        >
                          {item.availableColours.map((c) => (
                            <option key={c.name} value={c.name}>
                              Colour: {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="inline-flex items-center border border-[#E2D6C1] rounded-lg bg-[#FAF5EE]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-2 text-neutral-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-4 text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="p-2 text-neutral-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right tabular-nums">
                        <p className="text-xs text-neutral-500">
                          {formatPrice(item.unitPrice, settings.currency_symbol)} each
                        </p>
                        <p className="text-base font-semibold text-[#090909]">
                          {formatPrice(item.unitPrice * item.quantity, settings.currency_symbol)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#090909]">
                Bag Summary
              </h2>
              <div className="space-y-2.5 text-sm border-y border-[#F1E8DC] py-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Items ({totalItems})</span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(subtotal, settings.currency_symbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Delivery</span>
                  <span className="text-neutral-500">
                    {settings.delivery_charge > 0
                      ? settings.free_delivery_threshold > 0 &&
                        subtotal >= settings.free_delivery_threshold
                        ? 'Complimentary'
                        : formatPrice(settings.delivery_charge, settings.currency_symbol)
                      : 'Confirmed on WhatsApp'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-[#090909]">Estimated Subtotal</span>
                <span className="text-xl font-semibold text-[#090909] tabular-nums">
                  {formatPrice(subtotal, settings.currency_symbol)}
                </span>
              </div>
              <Link
                to="/checkout"
                className="w-full py-3.5 px-5 rounded-lg bg-[#090909] text-white text-sm font-semibold hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-2"
              >
                Proceed to WhatsApp Checkout
                <ArrowRight className="w-4 h-4 text-[#D4AF5A]" />
              </Link>
              <Link
                to="/shop"
                className="block text-center text-xs font-medium text-neutral-600 hover:text-[#090909]"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
