# MCFD J GLOBAL VENTURES

Luxury fashion e-commerce boutique and private store administration platform built with React, Vite, TypeScript, Tailwind CSS, **Neon PostgreSQL**, **Vercel Blob**, and **Vercel Serverless Functions**.

Live production URL: `https://mcfdjglobalventures.vercel.app`

---

## Architecture Overview

- **Frontend**: Vite + React 19 + TypeScript SPA (`src/`). Zero direct database credentials or secrets exist in browser code.
- **Database**: Neon PostgreSQL (`DATABASE_URL`) accessed strictly from server-side Vercel API routes (`api/_lib/db.ts`, `api/_lib/storeQueries.ts`).
- **Authentication**: Server-side email/password verification using `bcryptjs` password hashing and `jose` HS256 JWT stored in HTTP-only cookies (`Secure; SameSite=None; Partitioned` over HTTPS) with role-based permissions (`super_admin`, `store_manager`, `content_manager`).
- **Media Storage**: Server-side Vercel Blob uploads (`@vercel/blob` using `BLOB_READ_WRITE_TOKEN`) persisted with metadata in `public.media_library`.
- **Order Flow**: Server-computed WhatsApp order references (`create_whatsapp_order` PostgreSQL function) storing normalized customer, order, and line-item records.

---

## Required Environment Variables

Configure these variables in Vercel Project Settings (and locally in `.env`):

```env
APP_URL=https://mcfdjglobalventures.vercel.app
DATABASE_URL=
JWT_SECRET=
ADMIN_INITIAL_EMAIL=
ADMIN_INITIAL_PASSWORD=
BLOB_READ_WRITE_TOKEN=

# Optional
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
GEMINI_API_KEY=
```

Never prefix any of these private keys with `VITE_`.

---

## Database Setup & Migrations (Neon PostgreSQL)

Migrations are stored in `migrations/`:

1. `migrations/001_initial_schema.sql` — Tables, indexes, constraints, triggers, and `create_whatsapp_order` stored function.
2. `migrations/002_seed_config_and_catalog.sql` — Default `site_settings`, `homepage_sections`, and core `categories`.
3. `migrations/003_seed_starter_products.sql` — 10 starter luxury products.

Run migrations against your Neon `DATABASE_URL`:

```bash
npm install
npm run db:migrate
```

- Applied migrations are tracked in `public.schema_migrations` so scripts are never executed twice.
- If `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` are configured and no administrator exists yet, the initial `super_admin` account is automatically created with a `bcryptjs`-hashed password during migration or first server startup / `/api/admin/bootstrap`. Existing administrators are never overwritten.

---

## Local Development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000` via `server.ts`, mounting the exact same handlers as Vercel serverless functions:

- `GET /api/health` — Service & Neon database connectivity health check
- `GET /api/config-status` — Safe capability/readiness status flags
- `POST /api/auth/login` & `POST /api/admin/login`
- `POST /api/auth/logout` & `POST /api/admin/logout`
- `GET /api/auth/me` & `GET /api/admin/session`
- `POST /api/auth/bootstrap` & `POST /api/admin/bootstrap`
- `GET/POST /api/storefront/*` — Storefront bootstrap, products, WhatsApp orders, newsletter
- `GET/POST/PATCH/DELETE /api/admin/*` — Authenticated & role-checked dashboard, catalog, categories, orders, customers, media uploads (`@vercel/blob`), settings, banners, testimonials, logs, and admin users

---

## Verification & Build

```bash
npm run lint
npm test
npm run build
```

---

## Vercel Deployment Checklist

1. Connect the repository in Vercel (`https://mcfdjglobalventures.vercel.app`).
2. Provision or link a Neon PostgreSQL database (`DATABASE_URL`) and Vercel Blob store (`BLOB_READ_WRITE_TOKEN`).
3. Set `JWT_SECRET`, `APP_URL`, `ADMIN_INITIAL_EMAIL`, and `ADMIN_INITIAL_PASSWORD` in Vercel Environment Variables.
4. Run `npm run db:migrate` against your production `DATABASE_URL`.
5. Deploy (`npm run build` outputs `dist/`, with serverless endpoints in `api/`).
