import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

function WhatsAppSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.96L2 22l5.26-1.38a9.86 9.86 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm5.77 14.08c-.24.68-1.42 1.31-1.97 1.39-.5.08-1.15.11-1.85-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.29-5.06-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.84 2.04.91 2.19.08.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.18.3.78 1.29 1.67 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.13.08.73-.17 1.42Z" />
    </svg>
  );
}

export function FloatingWhatsAppButton() {
  const { settings } = useStore();
  const { totalItems, isDrawerOpen, openDrawer, closeDrawer } = useCart();
  const location = useLocation();

  if (location.pathname.startsWith('/admin') || !settings.whatsapp_inquiry_enabled) {
    return null;
  }

  const whatsappConfirmed =
    settings.whatsapp_country_confirmed &&
    normalizeWhatsAppDigits(settings.whatsapp_number).length >= 11;

  // Compact circular WhatsApp button matching the reference luxury storefront
  const baseClass =
    'no-print fixed bottom-[72px] right-3 sm:right-5 lg:bottom-5 lg:right-5 z-40 w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center shadow-[0_10px_28px_rgba(34,197,94,0.42)] transition-transform hover:-translate-y-0.5 border-2 border-white/80';

  if (totalItems > 0) {
    return (
      <button
        type="button"
        onClick={() => (isDrawerOpen ? closeDrawer() : openDrawer())}
        aria-label="Open WhatsApp Checkout Cart"
        title={`Your Cart (${totalItems})`}
        className={baseClass}
      >
        <WhatsAppSvg className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center tabular-nums border border-white">
          {totalItems}
        </span>
      </button>
    );
  }

  if (whatsappConfirmed) {
    const url = buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_support_message);
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MCFD J GLOBAL VENTURES on WhatsApp"
        title="Chat on WhatsApp"
        className={baseClass}
      >
        <WhatsAppSvg className="w-6 h-6" />
      </a>
    );
  }

  return (
    <Link
      to="/contact"
      aria-label="WhatsApp Concierge Support"
      title="WhatsApp Concierge"
      className={baseClass}
    >
      <WhatsAppSvg className="w-6 h-6" />
    </Link>
  );
}
