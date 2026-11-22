import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  submitWhatsAppOrder,
  type CreatedOrderResult,
} from '@/src/services/storefrontService';
import { formatPrice } from '@/src/utils/format';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  isLiveWhatsAppReady,
} from '@/src/utils/whatsapp';
import { SeoHead } from '@/src/components/SeoHead';

export function CheckoutPage() {
  const { items, subtotal, totalItems, clearCart } = useCart();
  const { settings } = useStore();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{
    result: CreatedOrderResult;
    message: string;
    whatsappUrl: string;
  } | null>(null);

  const calculatedDelivery = useMemo(() => {
    if (!settings.delivery_charge || settings.delivery_charge <= 0) return 0;
    if (
      settings.free_delivery_threshold > 0 &&
      subtotal >= settings.free_delivery_threshold
    ) {
      return 0;
    }
    return Number(settings.delivery_charge);
  }, [settings.delivery_charge, settings.free_delivery_threshold, subtotal]);

  const calculatedTax = useMemo(() => {
    if (!settings.tax_rate || settings.tax_rate <= 0) return 0;
    return Number(((subtotal * settings.tax_rate) / 100).toFixed(2));
  }, [settings.tax_rate, subtotal]);

  const estimatedTotal = subtotal + calculatedDelivery + calculatedTax;
  const whatsappLiveReady = isLiveWhatsAppReady(settings);

  const belowMinOrder =
    settings.minimum_order_value > 0 && subtotal < settings.minimum_order_value;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Your shopping bag is empty.', 'error');
      return;
    }
    if (belowMinOrder) {
      showToast(
        `Minimum order value is ${formatPrice(
          settings.minimum_order_value,
          settings.currency_symbol
        )}.`,
        'error'
      );
      return;
    }
    if (!consentChecked) {
      showToast('Please confirm your consent to submit your order details.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitWhatsAppOrder({
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        customerNotes,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          size: item.size,
          colour: item.colour,
          quantity: item.quantity,
        })),
      });

      const formattedMessage = buildWhatsAppOrderMessage({
        orderReference: result.order_reference,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        deliveryAddress: deliveryAddress.trim(),
        customerNotes: customerNotes.trim(),
        items: result.items.map((i) => ({
          productName: i.product_name,
          size: i.size,
          colour: i.colour,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
          subtotal: Number(i.subtotal),
        })),
        subtotal: Number(result.subtotal),
        deliveryCharge: Number(result.delivery_charge),
        taxAmount: Number(result.tax_amount),
        total: Number(result.total),
        currencySymbol: settings.currency_symbol,
        closingInstruction: settings.whatsapp_checkout_message,
      });

      const waUrl = whatsappLiveReady
        ? buildWhatsAppUrl(settings.whatsapp_number, formattedMessage)
        : '';

      setSubmittedOrder({
        result,
        message: formattedMessage,
        whatsappUrl: waUrl,
      });
      clearCart();
      showToast(`Order ${result.order_reference} recorded. Review and send on WhatsApp.`);

      if (waUrl) {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to complete order submission.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyMessage = async () => {
    if (!submittedOrder) return;
    await navigator.clipboard.writeText(submittedOrder.message);
    showToast('Order summary copied to clipboard.');
  };

  if (submittedOrder) {
    return (
      <>
        <SeoHead
          title={`Order ${submittedOrder.result.order_reference} | ${settings.business_name}`}
          description="Your MCFD J GLOBAL VENTURES order summary is ready for WhatsApp dispatch."
          canonicalPath="/checkout"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white border border-[#E7DEC9] rounded-2xl p-6 sm:p-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9A7422] font-semibold">
                  Order Reference {submittedOrder.result.order_reference}
                </p>
                <h1 className="font-serif text-3xl font-semibold text-[#090909] mt-1">
                  Review &amp; Send Your Order on WhatsApp
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Your order details have been recorded with Pending Confirmation status. Payment is only finalized after our concierge confirms availability with you.
                </p>
              </div>
            </div>

            {!whatsappLiveReady && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Live WhatsApp Dispatch Pending Country Code Verification
                  </p>
                  <p className="text-xs mt-1 text-amber-800">
                    The store administrator must verify the international country code for the WhatsApp number and enable live checkout in Admin Store Settings before direct wa.me links activate. You can copy your complete order summary below.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[#FAF5EE] border border-[#E2D6C1] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Prepared WhatsApp Message
                </span>
                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#090909] hover:text-[#9A7422]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-[#242424] leading-relaxed">
                {submittedOrder.message}
              </pre>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 no-print">
              {submittedOrder.whatsappUrl && (
                <a
                  href={submittedOrder.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Open WhatsApp &amp; Send Order
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#090909] text-sm font-semibold text-[#090909] hover:bg-[#FAF5EE]"
              >
                <Printer className="w-4 h-4" />
                Print Summary
              </button>
              <Link
                to="/shop"
                className="ml-auto text-sm font-medium text-neutral-600 hover:text-[#090909]"
              >
                Return to Boutique
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={`WhatsApp Checkout | ${settings.business_name}`}
        description="Complete your luxury order summary and dispatch directly via MCFD J GLOBAL VENTURES WhatsApp Concierge."
        canonicalPath="/checkout"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-[#9A7422] font-medium mb-1">
            Concierge Ordering
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[#090909]">
            WhatsApp Order Checkout
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            No online card payment required. Submit your delivery details to generate your verified order reference and send all selected items in one WhatsApp message.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-[#E7DEC9] rounded-xl p-12 text-center">
            <h2 className="font-serif text-2xl font-semibold text-[#090909] mb-2">
              Your shopping bag is empty
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              Add items from our boutique before proceeding to WhatsApp checkout.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#090909] text-white text-sm font-semibold"
            >
              Browse Boutique
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleCheckoutSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left: Customer & Delivery Form */}
            <div className="lg:col-span-7 bg-white border border-[#E7DEC9] rounded-xl p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#090909]">
                Client &amp; Delivery Details
              </h2>

              {!whatsappLiveReady && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    WhatsApp number country code verification is pending by the store administrator. You may still record your order reference and copy the generated order summary.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Blessing Okafor"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-sm focus:outline-none focus:border-[#090909]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +1 780 555 0199"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-sm focus:outline-none focus:border-[#090909]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-sm focus:outline-none focus:border-[#090909]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Delivery Address or Location *
                </label>
                <textarea
                  required
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street address, city, province/state, postal code, and country"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-sm focus:outline-none focus:border-[#090909]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Additional Order Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Preferred delivery timeframe, gift wrapping, or sizing questions..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2D6C1] bg-[#FAF5EE] text-sm focus:outline-none focus:border-[#090909]"
                />
              </div>

              <label className="flex items-start gap-3 pt-2 cursor-pointer text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-[#090909] accent-[#090909]"
                />
                <span>
                  I consent to submit my order details to MCFD J GLOBAL VENTURES so a concierge can confirm stock availability, payment instructions, and delivery coordination via WhatsApp.
                </span>
              </label>
            </div>

            {/* Right: Final Order Summary */}
            <div className="lg:col-span-5 bg-white border border-[#E7DEC9] rounded-xl p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#090909]">
                Final Order Summary ({totalItems})
              </h2>

              <div className="divide-y divide-[#F1E8DC] max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.key} className="py-3 flex justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#090909] truncate">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        Qty: {item.quantity}
                        {item.size ? ` · Size: ${item.size}` : ''}
                        {item.colour ? ` · Colour: ${item.colour}` : ''}
                      </p>
                    </div>
                    <span className="font-semibold text-[#090909] tabular-nums shrink-0">
                      {formatPrice(item.unitPrice * item.quantity, settings.currency_symbol)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-[#F1E8DC] pt-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(subtotal, settings.currency_symbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Delivery</span>
                  <span className="tabular-nums text-neutral-700">
                    {calculatedDelivery > 0
                      ? formatPrice(calculatedDelivery, settings.currency_symbol)
                      : settings.delivery_charge > 0
                      ? 'Complimentary'
                      : 'To be confirmed'}
                  </span>
                </div>
                {calculatedTax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">
                      Tax ({settings.tax_rate}%)
                    </span>
                    <span className="tabular-nums">
                      {formatPrice(calculatedTax, settings.currency_symbol)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline border-t border-[#E2D6C1] pt-4">
                <span className="font-semibold text-[#090909]">TOTAL</span>
                <span className="text-2xl font-semibold text-[#090909] tabular-nums">
                  {formatPrice(estimatedTotal, settings.currency_symbol)}
                </span>
              </div>

              {belowMinOrder && (
                <p className="text-xs text-red-600">
                  Minimum order value is{' '}
                  {formatPrice(settings.minimum_order_value, settings.currency_symbol)}.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || belowMinOrder}
                className="w-full py-4 px-5 rounded-lg bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2.5 shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                {submitting
                  ? 'Recording Order...'
                  : 'Complete Order & Open WhatsApp'}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9A7422]" />
                All {items.length} selected item(s) are combined into one order message.
              </p>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
