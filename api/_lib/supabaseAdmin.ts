import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  send: (body: string) => void;
  setHeader: (name: string, value: string) => void;
}

export function getServerEnv() {
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  const supabaseAnonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const adminBootstrapSecret = (process.env.ADMIN_BOOTSTRAP_SECRET || '').trim();
  const appUrl = (process.env.APP_URL || '').trim();

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    adminBootstrapSecret,
    appUrl,
  };
}

export function getAdminSupabase() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
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

export async function verifySuperAdminRequest(req: ApiRequest): Promise<
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      adminClient: NonNullable<ReturnType<typeof getAdminSupabase>>;
      caller: { id: string; email?: string };
    }
> {
  const adminClient = getAdminSupabase();
  if (!adminClient) {
    return { ok: false, error: 'Server Supabase credentials are not configured.', status: 503 };
  }

  const rawAuth = req.headers.authorization || req.headers.Authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] || '' : rawAuth || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { ok: false, error: 'Missing bearer authorization token.', status: 401 };
  }

  const { data: userData, error: userErr } = await adminClient.auth.getUser(token);
  if (userErr || !userData.user) {
    return { ok: false, error: 'Invalid or expired session token.', status: 401 };
  }

  const { data: roleData, error: roleErr } = await adminClient
    .from('admin_roles')
    .select('role, is_active')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (roleErr || !roleData || !roleData.is_active || roleData.role !== 'super_admin') {
    return { ok: false, error: 'Super Administrator privileges required.', status: 403 };
  }

  return { ok: true, adminClient, caller: userData.user };
}
