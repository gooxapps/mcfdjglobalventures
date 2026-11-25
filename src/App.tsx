import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { ToastProvider } from '@/src/contexts/ToastContext';
import { StoreProvider } from '@/src/contexts/StoreContext';
import { CartProvider } from '@/src/contexts/CartContext';
import {
  AdminAuthProvider,
  useAdminAuth,
  type AdminPermission,
} from '@/src/contexts/AdminAuthContext';

import { StorefrontLayout } from '@/src/layouts/StorefrontLayout';
import { HomePage } from '@/src/pages/HomePage';
import { ShopPage } from '@/src/pages/ShopPage';
import { ProductDetailPage } from '@/src/pages/ProductDetailPage';
import { CartPage } from '@/src/pages/CartPage';
import { CheckoutPage } from '@/src/pages/CheckoutPage';
import {
  AboutPage,
  CollectionsPage,
  ContactPage,
  PolicyPage,
} from '@/src/pages/InfoPages';
import { CustomDesignPage } from '@/src/pages/CustomDesignPage';
import {
  AsoOkeAndGroupPage,
  BeautyPage,
  SouvenirsPage,
} from '@/src/pages/SpecialtyPages';

import { AdminLayout } from '@/src/admin/layouts/AdminLayout';
import { AdminLoginPage } from '@/src/admin/pages/AdminLoginPage';
import { AdminDashboardPage } from '@/src/admin/pages/AdminDashboardPage';
import { AdminProductsPage } from '@/src/admin/pages/AdminProductsPage';
import { AdminCategoriesPage } from '@/src/admin/pages/AdminCategoriesPage';
import { AdminOrdersPage } from '@/src/admin/pages/AdminOrdersPage';
import { AdminRequestsPage } from '@/src/admin/pages/AdminRequestsPage';
import { AdminCustomersPage } from '@/src/admin/pages/AdminCustomersPage';
import { AdminContentPage } from '@/src/admin/pages/AdminContentPage';
import { AdminMediaPage } from '@/src/admin/pages/AdminMediaPage';
import { AdminSettingsPage } from '@/src/admin/pages/AdminSettingsPage';
import { AdminUsersAndLogsPage } from '@/src/admin/pages/AdminUsersAndLogsPage';

function RequirePermission({
  permission,
  children,
}: {
  permission: AdminPermission;
  children: React.ReactNode;
}) {
  const { can } = useAdminAuth();
  if (!can(permission)) {
    return (
      <div className="bg-white border border-[#E7DEC9] rounded-xl p-10 text-center">
        <h2 className="font-serif text-2xl font-semibold text-[#090909] mb-2">
          Restricted Access
        </h2>
        <p className="text-xs text-neutral-600">
          Your administrator role does not include permission for this module.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <ToastProvider>
          <StoreProvider>
            <CartProvider>
              <AdminAuthProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                  {/* Public Luxury Storefront */}
                  <Route element={<StorefrontLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/collections" element={<CollectionsPage />} />
                    <Route path="/custom-design" element={<CustomDesignPage />} />
                    <Route path="/aso-oke" element={<AsoOkeAndGroupPage mode="aso-oke" />} />
                    <Route path="/group-outfits" element={<AsoOkeAndGroupPage mode="group" />} />
                    <Route path="/souvenirs" element={<SouvenirsPage />} />
                    <Route path="/beauty" element={<BeautyPage />} />
                    <Route path="/product/:slug" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<PolicyPage type="privacy" />} />
                    <Route path="/terms" element={<PolicyPage type="terms" />} />
                    <Route path="/shipping" element={<PolicyPage type="shipping" />} />
                  </Route>

                  {/* Admin Authentication */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />

                  {/* Private Administration Dashboard */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route
                      index
                      element={
                        <RequirePermission permission="view_dashboard">
                          <AdminDashboardPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="products"
                      element={
                        <RequirePermission permission="manage_products">
                          <AdminProductsPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="categories"
                      element={
                        <RequirePermission permission="manage_categories">
                          <AdminCategoriesPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="orders"
                      element={
                        <RequirePermission permission="manage_orders">
                          <AdminOrdersPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="requests"
                      element={
                        <RequirePermission permission="manage_requests">
                          <AdminRequestsPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="customers"
                      element={
                        <RequirePermission permission="manage_customers">
                          <AdminCustomersPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="content"
                      element={
                        <RequirePermission permission="manage_content">
                          <AdminContentPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="media"
                      element={
                        <RequirePermission permission="manage_media">
                          <AdminMediaPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="settings"
                      element={
                        <RequirePermission permission="manage_settings">
                          <AdminSettingsPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="security"
                      element={
                        <RequirePermission permission="view_activity_logs">
                          <AdminUsersAndLogsPage />
                        </RequirePermission>
                      }
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </AdminAuthProvider>
          </CartProvider>
        </StoreProvider>
      </ToastProvider>
    </ErrorBoundary>
    </MotionConfig>
  );
}
