import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { jwtVerify } from 'jose';
import {
  hasAdminPermission,
  hashPassword,
  signAdminSessionToken,
  verifyPassword,
} from '../api/_lib/auth';
import { getJwtSecretBytes, type ApiRequest, type ApiResponse } from '../api/_lib/db';
import healthHandler from '../api/health';
import configStatusHandler from '../api/config-status';
import authHandler from '../api/auth';
import adminHandler from '../api/admin';

function createMockRes() {
  let statusCode = 200;
  let body: unknown = null;
  const headers: Record<string, string | string[]> = {};

  const res: ApiResponse = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
    send(payload: string | Buffer) {
      body = payload;
      return res;
    },
    setHeader(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
      return res;
    },
  };

  return {
    res,
    getStatus: () => statusCode,
    getBody: <T = Record<string, unknown>>() => body as T,
    getHeaders: () => headers,
  };
}

test('bcrypt password hashing and JWT session token signing verify cleanly', async () => {
  const hash = await hashPassword('CoutureAtelier!2026');
  assert.notEqual(hash, 'CoutureAtelier!2026');
  assert.equal(await verifyPassword('CoutureAtelier!2026', hash), true);
  assert.equal(await verifyPassword('WrongPassword', hash), false);
  const yPrefixHash = hash.startsWith('$2b$') ? `$2y$${hash.slice(4)}` : hash;
  assert.equal(await verifyPassword('CoutureAtelier!2026', yPrefixHash), true);

  const token = await signAdminSessionToken({
    id: 'admin-123',
    email: 'owner@mcfdjglobalventures.com',
    fullName: 'Super Administrator',
    role: 'super_admin',
  });

  const verified = await jwtVerify(token, getJwtSecretBytes());
  assert.equal(verified.payload.sub, 'admin-123');
  assert.equal(verified.payload.role, 'super_admin');
});

test('RBAC permissions enforce super_admin, store_manager, and content_manager boundaries', () => {
  assert.equal(hasAdminPermission('super_admin', 'manage_admins'), true);
  assert.equal(hasAdminPermission('super_admin', 'manage_requests'), true);
  assert.equal(hasAdminPermission('store_manager', 'manage_products'), true);
  assert.equal(hasAdminPermission('store_manager', 'manage_requests'), true);
  assert.equal(hasAdminPermission('store_manager', 'manage_admins'), false);
  assert.equal(hasAdminPermission('content_manager', 'manage_content'), true);
  assert.equal(hasAdminPermission('content_manager', 'manage_orders'), false);
  assert.equal(hasAdminPermission('content_manager', 'manage_requests'), false);
});

test('API handlers respond safely for /api/health, /api/config-status, /api/auth/me, and reject unauthenticated /api/admin calls', async () => {
  const healthMock = createMockRes();
  await healthHandler({ method: 'GET', headers: {} } as ApiRequest, healthMock.res);
  assert.equal(healthMock.getStatus(), 200);
  assert.equal(healthMock.getBody().status, 'ok');
  assert.equal(healthMock.getBody().service, 'mcfdj-global-ventures');

  const configMock = createMockRes();
  await configStatusHandler({ method: 'GET', headers: {} } as ApiRequest, configMock.res);
  assert.equal(configMock.getStatus(), 200);
  assert.equal(typeof configMock.getBody().databaseConfigured, 'boolean');
  assert.equal(configMock.getBody().previewAllowed, false);

  const meMock = createMockRes();
  await authHandler(
    { method: 'GET', url: '/api/auth/me', headers: {}, query: { __path: 'me' } } as ApiRequest,
    meMock.res
  );
  assert.equal(meMock.getStatus(), 200);
  assert.equal(meMock.getBody().authenticated, false);

  const adminSessionMock = createMockRes();
  await adminHandler(
    {
      method: 'GET',
      url: '/api/admin/session',
      headers: {},
      query: { __path: 'session' },
    } as ApiRequest,
    adminSessionMock.res
  );
  assert.equal(adminSessionMock.getStatus(), 200);
  assert.equal(adminSessionMock.getBody().authenticated, false);

  const adminLoginMock = createMockRes();
  await adminHandler(
    {
      method: 'POST',
      url: '/api/admin/login',
      headers: {},
      query: { __path: 'login' },
      body: { email: 'owner@mcfdjglobalventures.com', password: 'test-password' },
    } as ApiRequest,
    adminLoginMock.res
  );
  assert.equal(adminLoginMock.getStatus(), 503);

  const adminMock = createMockRes();
  await adminHandler(
    { method: 'GET', url: '/api/admin/products', headers: {}, query: { __path: 'products' } } as ApiRequest,
    adminMock.res
  );
  assert.ok(adminMock.getStatus() === 401 || adminMock.getStatus() === 503);

  const adminReqMock = createMockRes();
  await adminHandler(
    {
      method: 'GET',
      url: '/api/admin/custom-requests',
      headers: {},
      query: { __path: 'custom-requests' },
    } as ApiRequest,
    adminReqMock.res
  );
  assert.ok(adminReqMock.getStatus() === 401 || adminReqMock.getStatus() === 503);
});

test('Neon PostgreSQL migrations cover all 19 tables, schema_migrations tracking, and zero Supabase remnants', () => {
  const root = process.cwd();
  const schemaSql = fs.readFileSync(
    path.join(root, 'migrations/001_initial_schema.sql'),
    'utf-8'
  );
  const seedSql = fs.readFileSync(
    path.join(root, 'migrations/002_seed_config_and_catalog.sql'),
    'utf-8'
  );
  const prodSql = fs.readFileSync(
    path.join(root, 'migrations/003_seed_starter_products.sql'),
    'utf-8'
  );
  const redesignSql = fs.readFileSync(
    path.join(root, 'migrations/004_redesign_catalog_and_requests.sql'),
    'utf-8'
  );
  const attiresSql = fs.readFileSync(
    path.join(root, 'migrations/005_native_fashion_attires_catalog.sql'),
    'utf-8'
  );
  const migrateScript = fs.readFileSync(path.join(root, 'scripts/migrate.ts'), 'utf-8');
  const pkgJson = fs.readFileSync(path.join(root, 'package.json'), 'utf-8');
  const metadataJson = fs.readFileSync(path.join(root, 'metadata.json'), 'utf-8');

  const requiredTables = [
    'profiles',
    'admin_roles',
    'categories',
    'products',
    'product_financials',
    'product_images',
    'product_variants',
    'customers',
    'orders',
    'order_items',
    'site_settings',
    'homepage_sections',
    'banners',
    'testimonials',
    'media_library',
    'activity_logs',
    'newsletter_subscribers',
  ];

  for (const tbl of requiredTables) {
    assert.ok(
      schemaSql.includes(`public.${tbl}`),
      `Expected table public.${tbl} in 001_initial_schema.sql`
    );
  }

  assert.ok(redesignSql.includes('public.custom_design_requests'));
  assert.ok(redesignSql.includes('public.aso_oke_enquiries'));
  assert.ok(attiresSql.includes('emerald-sunburst-ankara-peplum-gown'));
  assert.ok(migrateScript.includes('public.schema_migrations'));
  assert.equal(pkgJson.toLowerCase().includes('supabase'), false);
  assert.equal(metadataJson.toLowerCase().includes('supabase'), false);

  const combined = `${schemaSql}\n${seedSql}\n${prodSql}\n${redesignSql}\n${attiresSql}`.toLowerCase();
  assert.equal(combined.includes('auth.users'), false);
  assert.equal(combined.includes('storage.buckets'), false);
  assert.equal(combined.includes('supabase'), false);
});
