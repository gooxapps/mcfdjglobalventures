import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiRequest,
  fetchBackendStatus,
  getAdminSessionToken,
  setAdminSessionToken,
} from '@/src/lib/apiClient';
import type { AdminRoleType } from '@/src/types/store';

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

const ROLE_PERMISSIONS: Record<AdminRoleType, AdminPermission[]> = {
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
  databaseReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  setAuthenticatedSession: (adminUser: AuthAdminUser, token?: string | null) => void;
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
  const [databaseReady, setDatabaseReady] = useState(false);

  const setAuthenticatedSession = useCallback(
    (adminUser: AuthAdminUser, token?: string | null) => {
      if (token) {
        setAdminSessionToken(token);
      }
      setDatabaseReady(true);
      setUser(adminUser);
      setRole(adminUser.role);
      setFullName(adminUser.fullName || adminUser.email);
      setLoading(false);
    },
    []
  );

  const refreshSession = useCallback(async () => {
    try {
      const [status, me] = await Promise.all([
        fetchBackendStatus(true),
        apiRequest<{ authenticated: boolean; user: AuthAdminUser | null }>('/api/auth/me'),
      ]);
      const dbOk = Boolean(status.databaseConfigured && status.databaseReachable);
      setDatabaseReady(dbOk);

      if (me.authenticated && me.user) {
        setUser(me.user);
        setRole(me.user.role);
        setFullName(me.user.fullName || me.user.email);
      } else {
        setAdminSessionToken(null);
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

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiRequest<{ user: AuthAdminUser; token?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      setAuthenticatedSession(res.user, res.token ?? null);
    },
    [setAuthenticatedSession]
  );

  const signOut = useCallback(async () => {
    const token = getAdminSessionToken();
    setAdminSessionToken(null);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
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
      if (!role) return false;
      return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    },
    [role]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role,
        fullName,
        loading,
        isAuthorizedAdmin: Boolean(user && role),
        databaseReady,
        signIn,
        setAuthenticatedSession,
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
