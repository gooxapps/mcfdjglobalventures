import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  ensureSupabaseInitialized,
  isSupabaseConfigured,
  supabase,
} from '@/src/lib/supabase';
import type { AdminRoleType } from '@/src/types/store';

export type AdminPermission =
  | 'view_dashboard'
  | 'manage_products'
  | 'manage_categories'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_content'
  | 'manage_media'
  | 'manage_settings'
  | 'manage_admins'
  | 'view_activity_logs';

const ROLE_PERMISSIONS: Record<AdminRoleType, AdminPermission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_products',
    'manage_categories',
    'manage_orders',
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

const PREVIEW_MODE_STORAGE_KEY = 'mcfdj_admin_preview_mode_v1';
const PREVIEW_NAME_STORAGE_KEY = 'mcfdj_admin_preview_name_v1';

interface AdminAuthContextValue {
  user: User | null;
  session: Session | null;
  role: AdminRoleType | null;
  fullName: string;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  isPreviewMode: boolean;
  enterPreviewMode: (displayName?: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  can: (permission: AdminPermission) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AdminRoleType | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const loadAdminProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser || !supabase) {
      setRole(null);
      setFullName('');
      return;
    }

    const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
      supabase
        .from('admin_roles')
        .select('role, is_active')
        .eq('user_id', currentUser.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle(),
    ]);

    if (roleRow && roleRow.is_active) {
      setRole(roleRow.role as AdminRoleType);
      setFullName(
        profileRow?.full_name ||
          (currentUser.user_metadata?.full_name as string) ||
          currentUser.email ||
          'Administrator'
      );
    } else {
      setRole(null);
      setFullName('');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    async function init() {
      await ensureSupabaseInitialized();
      if (!mounted) return;

      if (!isSupabaseConfigured || !supabase) {
        try {
          if (sessionStorage.getItem(PREVIEW_MODE_STORAGE_KEY) === '1') {
            setIsPreviewMode(true);
            setRole('super_admin');
            setFullName(
              sessionStorage.getItem(PREVIEW_NAME_STORAGE_KEY) || 'Store Owner (Preview)'
            );
          }
        } catch {
          // Ignore storage error
        }
        setLoading(false);
        return;
      }

      // Live Supabase configured: clear any prior preview flag and enforce real auth
      try {
        sessionStorage.removeItem(PREVIEW_MODE_STORAGE_KEY);
        sessionStorage.removeItem(PREVIEW_NAME_STORAGE_KEY);
      } catch {
        // Ignore
      }
      setIsPreviewMode(false);

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadAdminProfile(data.session?.user ?? null);
      if (mounted) setLoading(false);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        await loadAdminProfile(nextSession?.user ?? null);
        if (mounted) setLoading(false);
      });
      unsubscribe = () => subscription.unsubscribe();
    }

    init();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [loadAdminProfile]);

  const enterPreviewMode = useCallback((displayName?: string) => {
    if (isSupabaseConfigured) return;
    const cleanName = displayName?.trim() || 'Store Owner (Preview)';
    try {
      sessionStorage.setItem(PREVIEW_MODE_STORAGE_KEY, '1');
      sessionStorage.setItem(PREVIEW_NAME_STORAGE_KEY, cleanName);
    } catch {
      // Ignore storage error
    }
    setIsPreviewMode(true);
    setRole('super_admin');
    setFullName(cleanName);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = (await ensureSupabaseInitialized()) || supabase;
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error(error.message);

      // Immediately verify admin_roles membership
      const { data: roleRow } = await client
        .from('admin_roles')
        .select('role, is_active')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!roleRow || !roleRow.is_active) {
        await client.auth.signOut();
        throw new Error('This account does not have active administrator access.');
      }

      await loadAdminProfile(data.user);
    },
    [loadAdminProfile]
  );

  const signOut = useCallback(async () => {
    try {
      sessionStorage.removeItem(PREVIEW_MODE_STORAGE_KEY);
      sessionStorage.removeItem(PREVIEW_NAME_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsPreviewMode(false);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setFullName('');
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const redirectTo = `${window.location.origin}/admin/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (newPassword.length < 10) {
      throw new Error('Password must be at least 10 characters.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  const can = useCallback(
    (permission: AdminPermission) => {
      if (isPreviewMode && !isSupabaseConfigured) return true;
      if (!role) return false;
      return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    },
    [role, isPreviewMode]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        role,
        fullName,
        loading,
        isAuthorizedAdmin: Boolean((user && role) || (isPreviewMode && !isSupabaseConfigured)),
        isPreviewMode: Boolean(isPreviewMode && !isSupabaseConfigured),
        enterPreviewMode,
        signIn,
        signOut,
        sendPasswordReset,
        updatePassword,
        can,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
