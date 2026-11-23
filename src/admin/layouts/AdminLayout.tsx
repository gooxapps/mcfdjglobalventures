import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Crown,
  ExternalLink,
  FolderTree,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAdminAuth, type AdminPermission } from '@/src/contexts/AdminAuthContext';
import { useStore } from '@/src/contexts/StoreContext';
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: AdminPermission;
  end?: boolean;
  badgeKey?: 'pendingOrders';
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
    badgeKey: 'pendingOrders',
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
  const { loading, isAuthorizedAdmin, isPreviewMode, fullName, role, signOut, can } =
    useAdminAuth();
  const { settings } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    async function loadPendingCount() {
      if (isPreviewMode && !isSupabaseConfigured) {
        if (active) setPendingOrdersCount(3);
        return;
      }
      if (!isAuthorizedAdmin || !supabase) return;
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('order_status', ['New', 'Pending Confirmation']);
      if (active) setPendingOrdersCount(count ?? 0);
    }
    loadPendingCount();
    return () => {
      active = false;
    };
  }, [isAuthorizedAdmin, isPreviewMode, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <BrandLogo variant="dark" size="md" logoUrl={settings.logo_url} />
          <p className="text-xs text-neutral-400 tracking-wider uppercase">
            Verifying administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  const visibleNav = ADMIN_NAV_ITEMS.filter((item) => can(item.permission));

  const roleLabel =
    role === 'super_admin'
      ? 'Super Admin'
      : role === 'store_manager'
      ? 'Store Manager'
      : 'Content Manager';

  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || 'AD';

  const renderSidebarPromo = () => (
    <div
      className="rounded-xl border border-[#D4AF5A]/30 p-4 text-center relative overflow-hidden"
      style={{
        background:
          'linear-gradient(155deg, #16130E 0%, #090909 55%, rgba(212,175,90,0.28) 100%)',
      }}
    >
      <Crown className="w-5 h-5 text-[#E8BE62] mx-auto mb-1.5" />
      <p className="font-serif text-sm font-semibold text-white">
        MCFD J Global Ventures
      </p>
      <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
        Fashion Redefined.
        <br />
        Elegance Delivered.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7F4EE] text-[#242424] overflow-x-clip">
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
            const showBadge = item.badgeKey === 'pendingOrders' && pendingOrdersCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#D4AF5A] text-[#090909] font-semibold shadow-sm'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {showBadge && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold tabular-nums">
                    {pendingOrdersCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          {renderSidebarPromo()}
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-xs font-medium text-neutral-300 hover:text-white hover:border-[#D4AF5A]/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
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
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#090909] text-white h-full flex flex-col p-5 border-r border-[#D4AF5A]/25">
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
                const showBadge = item.badgeKey === 'pendingOrders' && pendingOrdersCount > 0;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-[#D4AF5A] text-[#090909] font-semibold'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {showBadge && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold tabular-nums">
                        {pendingOrdersCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-white/10 space-y-3">
              {renderSidebarPromo()}
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-xs text-neutral-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="text-white border-b border-[#D4AF5A]/25 px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4 no-print relative overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, #090909 0%, #15120B 48%, #2A200E 78%, #090909 100%)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0 relative z-10">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 text-neutral-300 hover:text-[#D4AF5A]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="font-serif text-lg sm:text-2xl font-semibold text-white truncate">
                Admin Dashboard
              </h1>
              <p className="text-[11px] sm:text-xs text-neutral-300 truncate">
                Manage your store with ease
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 relative z-10">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="flex items-center gap-2.5 pl-2.5 sm:pl-3 border-l border-white/15">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#F3D88B] to-[#D4AF5A] text-[#090909] font-bold text-xs flex items-center justify-center shrink-0">
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

        {isPreviewMode && (
          <div className="bg-[#090909] border-b border-[#D4AF5A]/35 px-4 sm:px-8 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#FAF5EE] no-print">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF5A] text-[#090909] text-[10px] font-bold uppercase tracking-wider shrink-0">
                Preview Mode
              </span>
              <span className="text-neutral-200">
                Inspecting the MCFD J Admin Dashboard before database connection. Connect Supabase anytime to enable live saves &amp; logins.
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs font-semibold text-[#E8BE62] hover:underline whitespace-nowrap self-start sm:self-auto"
            >
              Exit Preview
            </button>
          </div>
        )}

        {!settings.whatsapp_country_confirmed && !isPreviewMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs text-amber-950 no-print">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Action required: Confirm the international country code for WhatsApp number{' '}
                <strong className="font-mono">{settings.whatsapp_number}</strong> before enabling live customer WhatsApp checkout.
              </span>
            </div>
            <Link
              to="/admin/settings"
              className="font-semibold underline whitespace-nowrap text-amber-900 hover:text-black self-start sm:self-auto"
            >
              Verify in Settings
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>

        <footer className="bg-[#090909] text-neutral-400 px-4 sm:px-8 py-3.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#D4AF5A]/20 no-print text-center sm:text-left">
          <p>
            <span className="text-[#E8BE62] font-semibold">MCFD J Global Ventures</span>
            <span className="mx-2 text-neutral-600">|</span>
            <span>Fashion Redefined. Elegance Delivered.</span>
          </p>
          <p className="text-[11px] text-neutral-500">
            Developed by Emmanuel Kenny | StaySafelite
          </p>
        </footer>
      </div>
    </div>
  );
}
