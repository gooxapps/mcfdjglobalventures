import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, isSafeHttpUrl, slugify } from '../src/utils/format';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  isLiveWhatsAppReady,
  normalizeWhatsAppDigits,
} from '../src/utils/whatsapp';
import { parseCsvText } from '../src/utils/csv';

test('formatPrice formats currency consistently with 2 decimals', () => {
  assert.equal(formatPrice(289.99, 'CAD $'), 'CAD $289.99');
  assert.equal(formatPrice(1200, 'CAD $'), 'CAD $1,200.00');
  assert.equal(formatPrice(Number.NaN, '$'), '$0.00');
});

test('slugify creates clean URL-friendly slugs', () => {
  assert.equal(slugify("Women's Silk Maxi Dress!"), 'womens-silk-maxi-dress');
  assert.equal(slugify('  Bags & Accessories  '), 'bags-accessories');
});

test('isSafeHttpUrl rejects dangerous XSS schemes and allows safe web/local URLs', () => {
  assert.equal(isSafeHttpUrl('https://mcfdjglobalventures.vercel.app/shop'), true);
  assert.equal(isSafeHttpUrl('/src/assets/images/hero.jpg'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeHttpUrl(''), false);
});

test('WhatsApp utilities normalize digits, build verified message payloads, and gate unconfirmed numbers', () => {
  assert.equal(normalizeWhatsAppDigits('+1 (780) 691-3209'), '17806913209');
  assert.equal(
    isLiveWhatsAppReady({
      whatsapp_number: '7806913209',
      whatsapp_country_confirmed: false,
      whatsapp_checkout_enabled: false,
    }),
    false
  );
  assert.equal(
    isLiveWhatsAppReady({
      whatsapp_number: '+1 780 691 3209',
      whatsapp_country_confirmed: true,
      whatsapp_checkout_enabled: true,
    }),
    true
  );

  const msg = buildWhatsAppOrderMessage({
    orderReference: 'MCFDJ-2048',
    customerName: 'Amaka Nwosu',
    customerPhone: '+1 780 555 0100',
    deliveryAddress: '101 Jasper Ave, Edmonton, AB',
    items: [
      {
        productName: 'Noir Pleated Silk Maxi Dress',
        size: 'M',
        colour: 'Obsidian Black',
        quantity: 2,
        unitPrice: 289.99,
        subtotal: 579.98,
      },
    ],
    subtotal: 579.98,
    deliveryCharge: 0,
    total: 579.98,
    currencySymbol: 'CAD $',
  });

  assert.ok(msg.includes('ORDER REFERENCE: MCFDJ-2048'));
  assert.ok(msg.includes('Noir Pleated Silk Maxi Dress'));
  assert.ok(msg.includes('TOTAL: CAD $579.98'));

  const waUrl = buildWhatsAppUrl('+1 780 691 3209', msg);
  assert.ok(waUrl.startsWith('https://wa.me/17806913209?text='));
});

test('parseCsvText handles quoted commas and escaped quotes', () => {
  const csv = [
    'name,sku,price,description',
    '"Silk ""Noir"" Gown",MCFDJ-01,289.99,"Evening dress, obsidian"',
  ].join('\n');

  const rows = parseCsvText(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Silk "Noir" Gown');
  assert.equal(rows[0].sku, 'MCFDJ-01');
  assert.equal(rows[0].price, '289.99');
  assert.equal(rows[0].description, 'Evening dress, obsidian');
});
