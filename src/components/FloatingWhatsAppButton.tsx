import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

export function FloatingWhatsAppButton() {
  const { settings } = useStore();

  if (!settings.whatsapp_inquiry_enabled || !settings.whatsapp_country_confirmed) {
    return null;
  }

  const digits = normalizeWhatsAppDigits(settings.whatsapp_number);
  if (digits.length < 11) return null;

  const url = buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_support_message);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with MCFD J GLOBAL VENTURES on WhatsApp"
      className="no-print fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#15803D] text-white text-xs sm:text-sm font-semibold shadow-xl hover:bg-[#166534] transition-transform hover:-translate-y-0.5 border border-white/20"
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline whitespace-nowrap">Concierge WhatsApp</span>
    </a>
  );
}
