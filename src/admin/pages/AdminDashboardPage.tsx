import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FolderTree,
  Globe,
  MessageCircle,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Tag,
  Users,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import {
  fetchDashboardMetrics,
  type DashboardMetrics,
} from '@/src/services/adminService';
import { formatDateTime, formatPrice } from '@/src/utils/format';
import { SafeImage } from '@/src/components/SafeImage';

type DateRangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';

export function AdminDashboardPage() {
  const { settings } = useStore();
  const [rangeKey, setRangeKey] = useState<DateRangeKey>('30d');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const { startIso, endIso } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (rangeKey === 'today') {
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }
    if (rangeKey === '7d') {
      start.setDate(start.getDate() - 6);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }
    if (rangeKey === '30d') {
      start.setDate(start.getDate() - 29);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }
    if (rangeKey === '90d') {
      start.setDate(start.getDate() - 89);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }
    const cStart = new Date(`${customStart}T00:00:00`);
    const cEnd = new Date(`${customEnd}T23:59:59`);
    return {
      startIso: Number.isNaN(cStart.getTime()) ? start.toISOString() : cStart.toISOString(),
      endIso: Number.isNaN(cEnd.getTime()) ? end.toISOString() : cEnd.toISOString(),
    };
  }, [rangeKey, customStart, customEnd]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchDashboardMetrics(startIso, endIso, settings.currency_symbol);
        if (active) setMetrics(res);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [startIso, endIso, settings.currency_symbol]);

  const maxOrders = useMemo(() => {
    if (!metrics || metrics.dailySeries.length === 0) return 1;
    return Math.max(1, ...metrics.dailySeries.map((d) => d.orders));
  }, [metrics]);

  const maxRevenue = useMemo(() => {
    if (!metrics || metrics.dailySeries.length === 0) return 1;
    return Math.max(1, ...metrics.dailySeries.map((d) => d.paidRevenue));
  }, [metrics]);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Processing':
      case 'Shipped':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#090909]">
            Boutique Performance Overview
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Live metrics computed directly from your Supabase orders, recorded payments, products, and customers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-white border border-neutral-200 rounded-lg p-1 gap-1">
            {(
              [
                ['today', 'Today'],
                ['7d', '7 Days'],
                ['30d', '30 Days'],
                ['90d', '90 Days'],
                ['custom', 'Custom'],
              ] as Array<[DateRangeKey, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRangeKey(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  rangeKey === key
                    ? 'bg-[#090909] text-[#E8BE62]'
                    : 'text-neutral-600 hover:text-[#090909]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {rangeKey === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
              <span>–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-[#9A7422]" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-[#090909] tabular-nums truncate">
              {loading ? '—' : formatPrice(metrics?.confirmedSalesTotal || 0, settings.currency_symbol)}
            </p>
            <p className="text-xs text-neutral-500">Confirmed Paid Sales</p>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEC9] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-sky-700" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-[#090909] tabular-nums">
              {loading ? '—' : metrics?.totalOrders ?? 0}
            </p>
            <p className="text-xs text-neutral-500">
              Total Orders ({metrics?.pendingOrders ?? 0} pending)
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEC9] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-[#090909] tabular-nums">
              {loading ? '—' : metrics?.whatsappInitiations ?? 0}
            </p>
            <p className="text-xs text-neutral-500">WhatsApp Checkouts Initiated</p>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEC9] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-purple-700" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-[#090909] tabular-nums">
              {loading ? '—' : metrics?.totalProducts ?? 0}
            </p>
            <p className="text-xs text-neutral-500">
              {metrics?.activeProducts ?? 0} active · {metrics?.outOfStockProducts ?? 0} out of stock
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Status Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Confirmation
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.pendingOrders ?? 0}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            Confirmed / Active
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.confirmedOrders ?? 0}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed / Delivered
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.completedOrders ?? 0}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#9A7422]" />
            Total Customers
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.totalCustomers ?? 0}</span>
        </div>
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E7DEC9] rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#090909]">
                Sales &amp; Order Activity
              </h3>
              <p className="text-xs text-neutral-500">
                Daily recorded orders and confirmed paid revenue for selected period
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-neutral-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF5A]" />
                Paid Revenue
              </span>
              <span className="inline-flex items-center gap-1.5 text-neutral-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#090909]" />
                Orders
              </span>
            </div>
          </div>

          {!metrics || metrics.dailySeries.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center bg-[#FAF5EE] rounded-xl border border-dashed border-[#D8CBB4] p-6">
              <ShoppingCart className="w-7 h-7 text-[#9A7422] mb-2" />
              <p className="text-sm font-semibold text-[#090909]">
                No orders recorded in this date range
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Real sales and WhatsApp checkout activity will plot automatically here as customer orders are created.
              </p>
            </div>
          ) : (
            <div className="h-60 flex items-end gap-2 pt-4 overflow-x-auto">
              {metrics.dailySeries.map((point) => {
                const orderPct = Math.round((point.orders / maxOrders) * 100);
                const revPct = Math.round((point.paidRevenue / maxRevenue) * 100);
                return (
                  <div
                    key={point.date}
                    className="flex-1 min-w-[38px] flex flex-col items-center gap-2 group"
                  >
                    <div className="w-full h-44 flex items-end justify-center gap-1">
                      <div
                        title={`${point.label}: ${formatPrice(
                          point.paidRevenue,
                          settings.currency_symbol
                        )} paid`}
                        className="w-3 sm:w-4 rounded-t bg-[#D4AF5A] transition-all"
                        style={{ height: `${Math.max(4, revPct)}%` }}
                      />
                      <div
                        title={`${point.label}: ${point.orders} order(s)`}
                        className="w-3 sm:w-4 rounded-t bg-[#090909] transition-all"
                        style={{ height: `${Math.max(6, orderPct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-[#E7DEC9] rounded-xl p-6">
          <h3 className="font-serif text-xl font-semibold text-[#090909] mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/products?new=1"
              className="p-4 rounded-xl bg-[#E8BE62]/30 border border-[#D4AF5A]/50 hover:bg-[#E8BE62]/45 transition-colors flex flex-col items-center text-center gap-2"
            >
              <Plus className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Add Product</span>
            </Link>
            <Link
              to="/admin/categories"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center text-center gap-2"
            >
              <FolderTree className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Manage Categories</span>
            </Link>
            <Link
              to="/admin/products"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center text-center gap-2"
            >
              <Tag className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Update Prices</span>
            </Link>
            <Link
              to="/admin/content"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center text-center gap-2"
            >
              <Globe className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Edit Website</span>
            </Link>
            <Link
              to="/admin/settings"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center text-center gap-2"
            >
              <Settings className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Store Settings</span>
            </Link>
            <Link
              to="/"
              target="_blank"
              className="p-4 rounded-xl bg-[#090909] text-white hover:bg-neutral-800 transition-colors flex flex-col items-center text-center gap-2"
            >
              <Eye className="w-5 h-5 text-[#D4AF5A]" />
              <span className="text-xs font-semibold">View Store</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E7DEC9] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-semibold text-[#090909]">
              Recent Orders
            </h3>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#090909] hover:text-[#9A7422]"
            >
              View All Orders
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!metrics || metrics.recentOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500">
              No customer orders have been placed in this timeframe yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="py-2.5 pr-3 font-medium">Reference</th>
                    <th className="py-2.5 pr-3 font-medium">Customer</th>
                    <th className="py-2.5 pr-3 font-medium">Items</th>
                    <th className="py-2.5 pr-3 font-medium">Total</th>
                    <th className="py-2.5 pr-3 font-medium">Status</th>
                    <th className="py-2.5 pr-3 font-medium">Date</th>
                    <th className="py-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {metrics.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF5EE]/60">
                      <td className="py-3 pr-3 font-mono font-medium text-[#090909]">
                        {order.order_reference}
                      </td>
                      <td className="py-3 pr-3 font-medium text-[#242424]">
                        {order.customer_name}
                      </td>
                      <td className="py-3 pr-3 text-neutral-600 tabular-nums">
                        {order.items?.length ?? 0} item(s)
                      </td>
                      <td className="py-3 pr-3 font-semibold tabular-nums">
                        {formatPrice(order.total, settings.currency_symbol)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded border text-[11px] font-medium ${statusBadgeClass(
                            order.order_status
                          )}`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-neutral-500 whitespace-nowrap">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/admin/orders?order=${order.id}`}
                          className="inline-block px-3 py-1 rounded bg-[#090909] text-white text-[11px] font-medium hover:bg-neutral-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-[#E7DEC9] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-semibold text-[#090909]">
              Top Selling Products
            </h3>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#090909] hover:text-[#9A7422]"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!metrics || metrics.topProducts.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500">
              Top products appear once orders are marked as Paid by an administrator.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-100 bg-[#FAF5EE]/50"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0">
                    <SafeImage
                      src={product.main_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#090909] truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-neutral-600 tabular-nums">
                      {formatPrice(product.regular_price, settings.currency_symbol)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 tabular-nums shrink-0">
                    {product.sales_count} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
