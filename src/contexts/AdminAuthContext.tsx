import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, fetchBackendStatus } from '@/src/lib/apiClient';
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

export interface AuthAdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRoleType;
}

interface AdminAuthContextValue {
  user: AuthAdminUser | null;
  role: AdminRoleType | null;
  fullName: string;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  isPreviewMode: boolean;
  previewAllowed: boolean;
  databaseReady: boolean;
  enterPreviewMode: (displayName?: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  can: (permission: AdminPermission) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthAdminUser | null>(null);
  const [role, setRole] = useState<AdminRoleType | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewAllowed, setPreviewAllowed] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const status = await fetchBackendStatus(true);
      const dbOk = Boolean(status.databaseConfigured && status.databaseReachable);
      setDatabaseReady(dbOk);
      setPreviewAllowed(Boolean(status.previewAllowed));

      if (!dbOk) {
        if (status.previewAllowed) {
          try {
            if (sessionStorage.getItem(PREVIEW_MODE_STORAGE_KEY) === '1') {
              setIsPreviewMode(true);
              setRole('super_admin');
              setFullName(
                sessionStorage.getItem(PREVIEW_NAME_STORAGE_KEY) || 'Store Owner (Preview)'
              );
              setUser(null);
              return;
            }
          } catch {
            // Ignore storage errors
          }
        }
        setIsPreviewMode(false);
        setUser(null);
        setRole(null);
        setFullName('');
        return;
      }

      // Live Neon DB connected: clear any local preview flag and verify server JWT session cookie
      try {
        sessionStorage.removeItem(PREVIEW_MODE_STORAGE_KEY);
        sessionStorage.removeItem(PREVIEW_NAME_STORAGE_KEY);
      } catch {
        // Ignore
      }
      setIsPreviewMode(false);

      const me = await apiRequest<{ authenticated: boolean; user: AuthAdminUser | null }>(
        '/api/auth/me'
      );
      if (me.authenticated && me.user) {
        setUser(me.user);
        setRole(me.user.role);
        setFullName(me.user.fullName || me.user.email);
      } else {
        setUser(null);
        setRole(null);
        setFullName('');
      }
    } catch {
      setUser(null);
      setRole(null);
      setFullName('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const enterPreviewMode = useCallback(
    (displayName?: string) => {
      if (databaseReady || !previewAllowed) return;
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
    },
    [databaseReady, previewAllowed]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{ user: AuthAdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });
    setIsPreviewMode(false);
    setUser(res.user);
    setRole(res.user.role);
    setFullName(res.user.fullName || res.user.email);
  }, []);

  const signOut = useCallback(async () => {
    try {
      sessionStorage.removeItem(PREVIEW_MODE_STORAGE_KEY);
      sessionStorage.removeItem(PREVIEW_NAME_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsPreviewMode(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network hiccup during signout
    }
    setUser(null);
    setRole(null);
    setFullName('');
  }, []);

  const updatePassword = useCallback(async (newPassword: string, currentPassword?: string) => {
    if (newPassword.length < 10) {
      throw new Error('Password must be at least 10 characters.');
    }
    await apiRequest<{ updated: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword }),
    });
  }, []);

  const can = useCallback(
    (permission: AdminPermission) => {
      if (isPreviewMode && previewAllowed && !databaseReady) return true;
      if (!role) return false;
      return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    },
    [role, isPreviewMode, previewAllowed, databaseReady]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role,
        fullName,
        loading,
        isAuthorizedAdmin: Boolean(
          (user && role) || (isPreviewMode && previewAllowed && !databaseReady)
        ),
        isPreviewMode: Boolean(isPreviewMode && previewAllowed && !databaseReady),
        previewAllowed,
        databaseReady,
        enterPreviewMode,
        signIn,
        signOut,
        updatePassword,
        refreshSession,
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
