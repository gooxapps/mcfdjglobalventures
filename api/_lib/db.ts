import crypto from 'crypto';
import pg from 'pg';
import type { Pool as PgPool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const { Pool } = pg;

export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  url?: string;
  secure?: boolean;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  send: (body: string) => void;
  setHeader: (name: string, value: string | string[]) => void;
}

export function getServerEnv() {
  const databaseUrl = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  ).trim();
  const appUrl = (process.env.APP_URL || '').trim();
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  const adminInitialEmail = (process.env.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
  const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD || '';
  const blobToken = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  return {
    databaseUrl,
    appUrl,
    jwtSecret,
    adminInitialEmail,
    adminInitialPassword,
    blobToken,
    isProduction,
  };
}

declare global {
  var __mcfdjPgPool: PgPool | undefined;
  var __mcfdjPgPoolUrl: string | undefined;
  var __mcfdjJwtFallback: Uint8Array | undefined;
}

export function getPool(): PgPool | null {
  const { databaseUrl } = getServerEnv();
  if (!databaseUrl) return null;

  if (globalThis.__mcfdjPgPool && globalThis.__mcfdjPgPoolUrl === databaseUrl) {
    return globalThis.__mcfdjPgPool;
  }

  const isLocal =
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1');

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

  globalThis.__mcfdjPgPool = pool;
  globalThis.__mcfdjPgPoolUrl = databaseUrl;
  return pool;
}

export function requirePool(): PgPool {
  const pool = getPool();
  if (!pool) {
    throw new Error('DATABASE_URL is not configured on the server.');
  }
  return pool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const pool = requirePool();
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = requirePool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function getJwtSecretBytes(): Uint8Array {
  const { jwtSecret, databaseUrl } = getServerEnv();
  if (jwtSecret) {
    return new TextEncoder().encode(jwtSecret);
  }
  if (databaseUrl) {
    const derived = crypto
      .createHmac('sha256', databaseUrl)
      .update('mcfdj-session-jwt-v1')
      .digest();
    return new Uint8Array(derived);
  }
  if (!globalThis.__mcfdjJwtFallback) {
    globalThis.__mcfdjJwtFallback = crypto.randomBytes(32);
  }
  return globalThis.__mcfdjJwtFallback;
}

export function parseJsonBody(req: ApiRequest): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return {};
}

export function getQueryParam(req: ApiRequest, key: string): string {
  const fromParams = req.params?.[key];
  if (typeof fromParams === 'string') return fromParams;
  const raw = req.query?.[key];
  if (Array.isArray(raw)) return raw[0] || '';
  if (typeof raw === 'string') return raw;
  return '';
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
