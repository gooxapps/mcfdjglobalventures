import type { SiteSettings } from '@/src/types/store';
import { formatPrice } from './format';

export interface WhatsAppOrderPayload {
  orderReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  customerNotes?: string;
  items: Array<{
    productName: string;
    size?: string;
    colour?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  taxAmount?: number;
  total: number;
  currencySymbol: string;
  closingInstruction?: string;
}

/**
 * Strips spaces, plus signs, parentheses, dashes and non-digits for wa.me URLs.
 */
export function normalizeWhatsAppDigits(rawNumber: string): string {
  return (rawNumber || '').replace(/\D/g, '');
}

export function buildWhatsAppOrderMessage(payload: WhatsAppOrderPayload): string {
  const lines: string[] = [];

  lines.push('Hello MCFD J GLOBAL VENTURES,');
  lines.push('');
  lines.push('I would like to place an order.');
  lines.push('');
  lines.push(`ORDER REFERENCE: ${payload.orderReference}`);
  lines.push('');
  lines.push('CUSTOMER DETAILS:');
  lines.push(`Name: ${payload.customerName}`);
  lines.push(`Phone: ${payload.customerPhone}`);
  if (payload.customerEmail?.trim()) {
    lines.push(`Email: ${payload.customerEmail.trim()}`);
  }
  lines.push(`Delivery Location: ${payload.deliveryAddress}`);
  lines.push('');
  lines.push('ORDER ITEMS:');
  lines.push('');

  payload.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.productName}`);
    if (item.size?.trim()) {
      lines.push(`   Size: ${item.size.trim()}`);
    }
    if (item.colour?.trim()) {
      lines.push(`   Colour: ${item.colour.trim()}`);
    }
    lines.push(`   Quantity: ${item.quantity}`);
    lines.push(`   Unit Price: ${formatPrice(item.unitPrice, payload.currencySymbol)}`);
    lines.push(`   Subtotal: ${formatPrice(item.subtotal, payload.currencySymbol)}`);
    lines.push('');
  });

  lines.push(`Subtotal: ${formatPrice(payload.subtotal, payload.currencySymbol)}`);
  lines.push(
    payload.deliveryCharge > 0
      ? `Delivery: ${formatPrice(payload.deliveryCharge, payload.currencySymbol)}`
      : 'Delivery: To be confirmed'
  );
  if (payload.taxAmount && payload.taxAmount > 0) {
    lines.push(`Tax: ${formatPrice(payload.taxAmount, payload.currencySymbol)}`);
  }
  lines.push(`TOTAL: ${formatPrice(payload.total, payload.currencySymbol)}`);

  if (payload.customerNotes?.trim()) {
    lines.push('');
    lines.push(`Additional Instructions: ${payload.customerNotes.trim()}`);
  }

  lines.push('');
  lines.push(
    payload.closingInstruction?.trim() ||
      'Please confirm product availability and provide payment instructions.'
  );
  lines.push('');
  lines.push('Thank you.');

  return lines.join('\n');
}

export function buildWhatsAppUrl(rawNumber: string, message: string): string {
  const digits = normalizeWhatsAppDigits(rawNumber);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function isLiveWhatsAppReady(settings: Pick<SiteSettings, 'whatsapp_number' | 'whatsapp_country_confirmed' | 'whatsapp_checkout_enabled'>): boolean {
  const digits = normalizeWhatsAppDigits(settings.whatsapp_number);
  return Boolean(
    settings.whatsapp_country_confirmed &&
      settings.whatsapp_checkout_enabled &&
      digits.length >= 11
  );
}
