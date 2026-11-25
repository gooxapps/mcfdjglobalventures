import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import {
  getJwtSecretBytes,
  getPool,
  getServerEnv,
  withTransaction,
  type ApiRequest,
  type ApiResponse,
} from './db.js';

export type AdminRoleType = 'super_admin' | 'store_manager' | 'content_manager';

export type AdminPermission =
  | 'view_dashboard'
  | 'manage_products'
  | 'manage_categories'
  | 'manage_orders'
  | 'manage_requests'
  | 'manage_customers'
  | 'manage_content'
  | 'manage_media'
  | 'manage_settings'
  | 'manage_admins'
  | 'view_activity_logs';

export const ROLE_PERMISSIONS: Record<AdminRoleType, AdminPermission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_products',
    'manage_categories',
    'manage_orders',
    'manage_requests',
    'manage_customers',
    'manage_content',
    'manage_media',
    'manage_settings',
    'manage_admins',
    'view_activity_logs',
  ],
  store_manager: [
    'view_dashboard',
    'manage_products',
    'manage_categories',
    'manage_orders',
    'manage_requests',
    'manage_customers',
    'manage_media',
    'view_activity_logs',
  ],
  content_manager: [
    'view_dashboard',
    'manage_content',
    'manage_media',
    'view_activity_logs',
  ],
};

export const SESSION_COOKIE_NAME = 'mcfdj_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  fullName: string;
  role: AdminRoleType;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash || !plain) return false;
  const normalizedHash = hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
  return bcrypt.compare(plain, normalizedHash);
}

export async function signAdminSessionToken(user: AuthenticatedAdmin): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecretBytes());
}

function getHeader(req: ApiRequest, name: string): string {
  const val = req.headers[name.toLowerCase()] ?? req.headers[name];
  if (Array.isArray(val)) return val[0] || '';
  return typeof val === 'string' ? val : '';
}

function parseCookies(req: ApiRequest): Record<string, string> {
  const raw = getHeader(req, 'cookie');
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(value);
      } catch {
        out[key] = value;
      }
    }
  }
  return out;
}

function isHttpsRequest(req: ApiRequest): boolean {
  const proto = getHeader(req, 'x-forwarded-proto').toLowerCase();
  if (proto.includes('https')) return true;
  if (req.secure) return true;
  if (process.env.VERCEL === '1') return true;
  return false;
}

export function setAdminSessionCookie(req: ApiRequest, res: ApiResponse, token: string): void {
  const https = isHttpsRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (https) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAdminSessionCookie(req: ApiRequest, res: ApiResponse): void {
  const https = isHttpsRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
  ];
  if (https) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function verifySameOriginForMutation(req: ApiRequest): boolean {
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const origin = getHeader(req, 'origin');
  if (!origin) {
    // Allow non-browser / server-to-server calls without Origin only if bearer header or same-site referer
    const referer = getHeader(req, 'referer');
    if (!referer) return true;
    try {
      const refHost = new URL(referer).host;
      const reqHost = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host');
      return !reqHost || refHost === reqHost;
    } catch {
      return false;
    }
  }

  try {
    const originHost = new URL(origin).host;
    const reqHost = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host');
    const { appUrl } = getServerEnv();
    const allowedHosts = new Set<string>();
    if (reqHost) allowedHosts.add(reqHost);
    if (appUrl) {
      try {
        allowedHosts.add(new URL(appUrl).host);
      } catch {
        // Ignore invalid APP_URL
      }
    }
    return allowedHosts.size === 0 || allowedHosts.has(originHost);
  } catch {
    return false;
  }
}

export function hasAdminPermission(role: AdminRoleType, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Ensures initial super_admin exists when ADMIN_INITIAL_EMAIL & ADMIN_INITIAL_PASSWORD
 * are configured in server env and admin_roles is currently empty.
 * Never overwrites or recreates if an administrator already exists.
 */
export async function ensureInitialAdminFromEnv(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  const { adminInitialEmail, adminInitialPassword } = getServerEnv();
  if (!adminInitialEmail || !adminInitialPassword) return;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminInitialEmail) || adminInitialPassword.length < 6) {
    return;
  }

  try {
    await withTransaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(92837465)');
      const { rows } = await client.query<{ cnt: number }>(
        'SELECT count(*)::int AS cnt FROM public.admin_roles'
      );
      if ((rows[0]?.cnt ?? 0) > 0) {
        return;
      }

      const passwordHash = await hashPassword(adminInitialPassword);
      const profileRes = await client.query<{ id: string }>(
        `INSERT INTO public.profiles (email, password_hash, full_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [adminInitialEmail, passwordHash, 'Super Administrator']
      );

      const userId = profileRes.rows[0].id;
      await client.query(
        `INSERT INTO public.admin_roles (user_id, role, is_active)
         VALUES ($1, 'super_admin', true)`,
        [userId]
      );

      await client.query(
        `INSERT INTO public.activity_logs (admin_id, admin_email, action, entity_type, entity_id, description)
         VALUES ($1, $2, 'admin_created', 'admin_roles', $3, $4)`,
        [
          userId,
          adminInitialEmail,
          userId,
          `Initial Super Administrator (${adminInitialEmail}) auto-bootstrapped from environment configuration.`,
        ]
      );
    });
  } catch {
    // Table may not exist yet before migrations are run
  }
}

export async function authenticateAdminRequest(
  req: ApiRequest,
  requiredPermission?: AdminPermission
): Promise<
  | { ok: false; status: number; error: string }
  | { ok: true; caller: AuthenticatedAdmin }
> {
  const pool = getPool();
  if (!pool) {
    return { ok: false, status: 503, error: 'Database is not configured on the server.' };
  }

  if (!verifySameOriginForMutation(req)) {
    return { ok: false, status: 403, error: 'Cross-origin mutation rejected.' };
  }

  const authHeader = getHeader(req, 'authorization');
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookies = parseCookies(req);
  const token = bearerToken || cookies[SESSION_COOKIE_NAME] || '';

  if (!token) {
    return { ok: false, status: 401, error: 'Authentication required. Please sign in.' };
  }

  try {
    const verified = await jwtVerify(token, getJwtSecretBytes());
    const userId = verified.payload.sub;
    if (!userId) {
      return { ok: false, status: 401, error: 'Invalid session token.' };
    }

    const { rows } = await pool.query<{
      id: string;
      email: string;
      full_name: string;
      role: AdminRoleType;
      is_active: boolean;
    }>(
      `SELECT p.id, p.email, p.full_name, ar.role, ar.is_active
       FROM public.profiles p
       INNER JOIN public.admin_roles ar ON ar.user_id = p.id
       WHERE p.id = $1
       LIMIT 1`,
      [userId]
    );

    const record = rows[0];
    if (!record || !record.is_active) {
      return { ok: false, status: 403, error: 'Administrator account is inactive or unauthorized.' };
    }

    if (requiredPermission && !hasAdminPermission(record.role, requiredPermission)) {
      return {
        ok: false,
        status: 403,
        error: 'Your administrator role does not include permission for this action.',
      };
    }

    return {
      ok: true,
      caller: {
        id: record.id,
        email: record.email,
        fullName: record.full_name || record.email,
        role: record.role,
      },
    };
  } catch {
    return { ok: false, status: 401, error: 'Session expired or invalid. Please sign in again.' };
  }
}

export async function writeActivityLog(params: {
  adminId?: string | null;
  adminEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO public.activity_logs (admin_id, admin_email, action, entity_type, entity_id, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        params.adminId ?? null,
        params.adminEmail ?? '',
        params.action,
        params.entityType ?? '',
        params.entityId ?? '',
        params.description,
        JSON.stringify(params.metadata ?? {}),
      ]
    );
  } catch {
    // Non-fatal logging error
  }
}
