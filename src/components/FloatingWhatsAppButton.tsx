import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCart } from '@/src/contexts/CartContext';
import { useStore } from '@/src/contexts/StoreContext';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

function WhatsAppSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.96L2 22l5.26-1.38a9.86 9.86 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm5.77 14.08c-.24.68-1.42 1.31-1.97 1.39-.5.08-1.15.11-1.85-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.29-5.06-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.84 2.04.91 2.19.08.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.18.3.78 1.29 1.67 2.09 1.15 1.03 2.12 1.35 2.42 1.5.3.15.48.13.66-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.13.08.73-.17 1.42Z" />
    </svg>
  );
}

export function FloatingWhatsAppButton() {
  const { settings } = useStore();
  const { totalItems, isDrawerOpen, openDrawer, closeDrawer } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (location.pathname.startsWith('/admin') || !settings.whatsapp_inquiry_enabled) {
    return null;
  }

  const digits = normalizeWhatsAppDigits(settings.whatsapp_number);
  const hasPhone = digits.length >= 10;
  const targetDigits = digits.length === 10 ? `1${digits}` : digits;

  const pageMessage = location.pathname.startsWith('/custom-design')
    ? 'Hello MCFD J Global Ventures, I would like to discuss a custom fashion or souvenir design request.'
    : location.pathname.startsWith('/aso-oke') || location.pathname.startsWith('/group-outfits')
    ? 'Hello MCFD J Global Ventures, I am inquiring about Aso Oke fabrics and coordinated group event outfits.'
    : settings.whatsapp_support_message;

  // Positioned safely above mobile bottom navigation and right side on desktop
  const baseClass =
    'no-print fixed bottom-[76px] right-3.5 sm:right-5 lg:bottom-6 lg:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1EA34D] hover:bg-[#17873E] text-white flex items-center justify-center shadow-[0_12px_30px_rgba(30,163,77,0.45)] border-2 border-white/90 transition-colors';

  const buttonInner = (
    <>
      <span
        className={`absolute inset-0 rounded-full bg-[#22C55E] opacity-30 ${
          scrolled ? 'animate-ping' : ''
        }`}
        style={{ animationDuration: '2.8s' }}
        aria-hidden="true"
      />
      <WhatsAppSvg className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
    </>
  );

  if (totalItems > 0) {
    return (
      <motion.button
        type="button"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.07, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => (isDrawerOpen ? closeDrawer() : openDrawer())}
        aria-label="Open WhatsApp Checkout Cart"
        title={`Your Cart (${totalItems})`}
        className={baseClass}
      >
        {buttonInner}
        <span className="absolute -top-1 -right-1 z-20 min-w-[20px] h-[20px] px-1 rounded-full bg-[#B91C1C] text-white text-[10px] font-bold flex items-center justify-center tabular-nums border-2 border-white">
          {totalItems}
        </span>
      </motion.button>
    );
  }

  if (hasPhone) {
    const url = buildWhatsAppUrl(targetDigits, pageMessage);
    return (
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.07, y: -2 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Chat with MCFD J Global Ventures on WhatsApp"
        title="Chat on WhatsApp"
        className={baseClass}
      >
        {buttonInner}
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.07, y: -2 }}
    >
      <Link
        to="/contact"
        aria-label="WhatsApp Concierge Support"
        title="WhatsApp Concierge"
        className={baseClass}
      >
        {buttonInner}
      </Link>
    </motion.div>
  );
}
