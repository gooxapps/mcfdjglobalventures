import React, { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Globe,
  Image as ImageIcon,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAdminAuth, type AdminPermission } from '@/src/contexts/AdminAuthContext';
import { useStore } from '@/src/contexts/StoreContext';
import { isSupabaseConfigured } from '@/src/lib/supabase';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: AdminPermission;
  end?: boolean;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboard,
    permission: 'view_dashboard',
    end: true,
  },
  {
    label: 'Products',
    to: '/admin/products',
    icon: Package,
    permission: 'manage_products',
  },
  {
    label: 'Categories',
    to: '/admin/categories',
    icon: FolderTree,
    permission: 'manage_categories',
  },
  {
    label: 'Orders',
    to: '/admin/orders',
    icon: ShoppingCart,
    permission: 'manage_orders',
  },
  {
    label: 'Customers',
    to: '/admin/customers',
    icon: Users,
    permission: 'manage_customers',
  },
  {
    label: 'Website Content',
    to: '/admin/content',
    icon: Globe,
    permission: 'manage_content',
  },
  {
    label: 'Media & Banners',
    to: '/admin/media',
    icon: ImageIcon,
    permission: 'manage_media',
  },
  {
    label: 'Store Settings',
    to: '/admin/settings',
    icon: Settings,
    permission: 'manage_settings',
  },
  {
    label: 'Admins & Logs',
    to: '/admin/security',
    icon: Shield,
    permission: 'view_activity_logs',
  },
];

export function AdminLayout() {
  const { loading, isAuthorizedAdmin, fullName, role, signOut, can } = useAdminAuth();
  const { settings } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <BrandLogo variant="dark" size="md" logoUrl={settings.logo_url} />
          <p className="text-xs text-neutral-400 tracking-wider uppercase">
            Verifying administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured || !isAuthorizedAdmin) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  const visibleNav = ADMIN_NAV_ITEMS.filter((item) => can(item.permission));

  const roleLabel =
    role === 'super_admin'
      ? 'Super Admin'
      : role === 'store_manager'
      ? 'Store Manager'
      : 'Content Manager';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'AD';

  return (
    <div className="min-h-screen flex bg-[#F7F4EE] text-[#242424]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#090909] text-white flex-col border-r border-[#D4AF5A]/20">
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="block">
            <BrandLogo variant="dark" size="sm" logoUrl={settings.logo_url} />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#D4AF5A] text-[#090909] font-semibold shadow-sm'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-[#191610] to-[#090909] border border-[#D4AF5A]/30 p-4 text-center">
            <p className="font-serif text-sm font-semibold text-[#E8BE62]">
              MCFD J GLOBAL VENTURES
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Fashion Redefined. Elegance Delivered.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-xs font-medium text-neutral-300 hover:text-white hover:border-[#D4AF5A]/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 bg-[#090909] text-white h-full flex flex-col p-5 border-r border-[#D4AF5A]/25">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <BrandLogo variant="dark" size="sm" logoUrl={settings.logo_url} />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="p-1.5 text-neutral-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-[#D4AF5A] text-[#090909] font-semibold'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-xs text-neutral-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#090909] text-white border-b border-[#D4AF5A]/25 px-4 sm:px-8 h-20 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 text-neutral-300 hover:text-[#D4AF5A]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-white truncate">
                Admin Dashboard
              </h1>
              <p className="text-xs text-neutral-400 truncate">
                Manage your MCFD J GLOBAL VENTURES boutique
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/15">
              <div className="w-9 h-9 rounded-full bg-[#D4AF5A] text-[#090909] font-semibold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                  {fullName}
                </p>
                <p className="text-[11px] text-[#E8BE62]">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {!settings.whatsapp_country_confirmed && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4 text-xs text-amber-950 no-print">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Action required: Confirm the international country code for WhatsApp number{' '}
                <strong className="font-mono">{settings.whatsapp_number}</strong> before enabling live customer WhatsApp checkout.
              </span>
            </div>
            <Link
              to="/admin/settings"
              className="font-semibold underline whitespace-nowrap text-amber-900 hover:text-black"
            >
              Verify in Settings
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <Outlet />
        </main>

        <footer className="bg-[#090909] text-neutral-400 px-4 sm:px-8 py-3.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#D4AF5A]/20 no-print">
          <p>
            <span className="text-[#E8BE62] font-medium">MCFD J Global Ventures</span> · Fashion Redefined. Elegance Delivered.
          </p>
          <p className="text-[11px] text-neutral-500">
            Developed by Emmanuel Kenny | StaySafelite
          </p>
        </footer>
      </div>
    </div>
  );
}
