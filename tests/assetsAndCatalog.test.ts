import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_CATEGORIES_FALLBACK,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_SITE_SETTINGS,
  LOCAL_BRAND_ASSETS,
} from '../src/lib/defaults';
import { STARTER_LUXURY_PRODUCTS } from '../src/lib/starterCatalog';
import {
  getPreviewAdminCategories,
  getPreviewAdminCustomers,
  getPreviewAdminOrders,
  getPreviewAdminProducts,
  getPreviewMediaLibrary,
  getPreviewTestimonials,
} from '../src/lib/adminPreviewData';

const ROOT_DIR = process.cwd();

function assertValidLocalJpeg(relativeWebPath: string) {
  assert.ok(
    relativeWebPath.startsWith('/src/assets/images/'),
    `Expected local asset path, got: ${relativeWebPath}`
  );
  const diskPath = path.join(ROOT_DIR, relativeWebPath.slice(1));
  assert.ok(fs.existsSync(diskPath), `Missing image file on disk: ${diskPath}`);
  const buf = fs.readFileSync(diskPath);
  assert.ok(buf.length > 10_000, `Image file too small (${buf.length} bytes): ${diskPath}`);
  // JPEG magic bytes FF D8 FF
  assert.equal(buf[0], 0xff, `Invalid JPEG header byte 0 for ${diskPath}`);
  assert.equal(buf[1], 0xd8, `Invalid JPEG header byte 1 for ${diskPath}`);
  assert.equal(buf[2], 0xff, `Invalid JPEG header byte 2 for ${diskPath}`);
}

test('all brand, category, and promo editorial images exist on disk as valid JPEGs', () => {
  assertValidLocalJpeg(LOCAL_BRAND_ASSETS.heroImage);
  assertValidLocalJpeg(LOCAL_BRAND_ASSETS.aboutImage);
  assertValidLocalJpeg(LOCAL_BRAND_ASSETS.promoImage);
  assertValidLocalJpeg(LOCAL_BRAND_ASSETS.lookbookImage);

  for (const [slug, assetUrl] of Object.entries(LOCAL_BRAND_ASSETS.categoryImages)) {
    assert.ok(slug.length > 0);
    assertValidLocalJpeg(assetUrl);
  }
});

test('all 10 starter luxury products have valid unique SKUs, slugs, pricing, categories, and JPEG assets', () => {
  assert.equal(STARTER_LUXURY_PRODUCTS.length, 10);

  const validCategorySlugs = new Set(DEFAULT_CATEGORIES_FALLBACK.map((c) => c.slug));
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const product of STARTER_LUXURY_PRODUCTS) {
    assert.ok(product.name.trim().length > 3);
    assert.ok(!seenSkus.has(product.sku), `Duplicate SKU: ${product.sku}`);
    assert.ok(!seenSlugs.has(product.slug), `Duplicate slug: ${product.slug}`);
    seenSkus.add(product.sku);
    seenSlugs.add(product.slug);

    assert.ok(
      validCategorySlugs.has(product.categorySlug),
      `Unknown categorySlug ${product.categorySlug}`
    );
    assert.ok(product.regular_price > 0, `Invalid regular_price on ${product.name}`);
    if (product.is_on_sale) {
      assert.ok(
        product.discounted_price !== null && product.discounted_price < product.regular_price,
        `Sale product ${product.name} must have discounted_price < regular_price`
      );
    }
    assert.equal(product.is_featured, true, `Homepage expects ${product.name} featured`);
    assertValidLocalJpeg(product.main_image_url);
  }
});

test('preview mode data populates storefront categories, sections, testimonials, products, and media library', () => {
  assert.ok(DEFAULT_SITE_SETTINGS.business_name.includes('MCFD J GLOBAL VENTURES'));
  assert.ok(DEFAULT_HOMEPAGE_SECTIONS.length >= 6);

  const previewProducts = getPreviewAdminProducts();
  assert.equal(previewProducts.length, 10);

  const previewCategories = getPreviewAdminCategories();
  assert.equal(previewCategories.length, 5);

  const testimonials = getPreviewTestimonials();
  assert.equal(testimonials.length, 3);
  for (const t of testimonials) {
    assert.ok(t.rating >= 1 && t.rating <= 5);
    assert.ok(t.quote.length > 20);
  }

  const orders = getPreviewAdminOrders();
  const customers = getPreviewAdminCustomers();
  assert.ok(orders.length >= 5);
  assert.equal(customers.length, orders.length);

  const media = getPreviewMediaLibrary();
  assert.equal(media.length, 14);
  for (const asset of media) {
    assertValidLocalJpeg(asset.public_url);
  }
});
