import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let runtimeUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
let runtimeAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export let isSupabaseConfigured = Boolean(runtimeUrl && runtimeAnonKey);

export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(runtimeUrl, runtimeAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

let initPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Supports both Vite build-time VITE_SUPABASE_* env vars and server runtime Secrets
 * exposed safely via /api/public-config.
 */
export async function ensureSupabaseInitialized(): Promise<SupabaseClient | null> {
  if (supabase) return supabase;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/api/public-config');
      if (!res.ok) return null;
      const data = (await res.json()) as {
        supabaseUrl?: string;
        supabaseAnonKey?: string;
      };
      const url = data.supabaseUrl?.trim() || '';
      const key = data.supabaseAnonKey?.trim() || '';
      if (url && key) {
        runtimeUrl = url;
        runtimeAnonKey = key;
        isSupabaseConfigured = true;
        supabase = createClient(runtimeUrl, runtimeAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        return supabase;
      }
    } catch {
      // Running in pure static host without /api/public-config
    }
    return null;
  })();

  return initPromise;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }
  return supabase;
}
