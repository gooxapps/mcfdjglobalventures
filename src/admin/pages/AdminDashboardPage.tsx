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

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'CL'
  );
}

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

  const chartGeometry = useMemo(() => {
    const series = metrics?.dailySeries || [];
    if (series.length === 0) return null;

    const width = 640;
    const height = 210;
    const padX = 28;
    const padTop = 18;
    const padBottom = 26;
    const plotW = width - padX * 2;
    const plotH = height - padTop - padBottom;

    const maxRev = Math.max(1, ...series.map((d) => d.paidRevenue));
    const maxOrd = Math.max(1, ...series.map((d) => d.orders));

    const revPoints = series.map((d, i) => {
      const x =
        series.length === 1 ? padX + plotW / 2 : padX + (i / (series.length - 1)) * plotW;
      const y = padTop + plotH - (d.paidRevenue / maxRev) * plotH;
      return { x, y, point: d };
    });

    const ordPoints = series.map((d, i) => {
      const x =
        series.length === 1 ? padX + plotW / 2 : padX + (i / (series.length - 1)) * plotW;
      const y = padTop + plotH - (d.orders / maxOrd) * (plotH * 0.65);
      return { x, y, point: d };
    });

    const revLine = revPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const ordLine = ordPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const baseLineY = padTop + plotH;
    const revArea = `${padX},${baseLineY} ${revLine} ${revPoints[revPoints.length - 1].x.toFixed(
      1
    )},${baseLineY}`;

    return { width, height, padTop, baseLineY, revPoints, ordPoints, revLine, ordLine, revArea };
  }, [metrics]);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Delivered':
        return 'bg-purple-50 text-purple-700 border-purple-200';
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#090909]">
            Boutique Performance Overview
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Live metrics computed directly from your Neon PostgreSQL orders, recorded payments, products, and customers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center bg-white border border-neutral-200 rounded-lg p-1 gap-1">
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
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
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
            <div className="flex flex-wrap items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs">
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

      {/* Primary KPI Grid matching Pastel Wave Luxury Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7DEC9] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="absolute right-0 bottom-0 w-24 h-24 rounded-tl-full bg-[#FAF2DC]/70 pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-[#FAF0D4] flex items-center justify-center shrink-0 relative z-10">
            <Package className="w-5 h-5 text-[#B4882D]" />
          </div>
          <div className="min-w-0 relative z-10">
            <p className="text-2xl font-bold text-[#090909] tabular-nums">
              {loading ? '—' : metrics?.totalProducts ?? 0}
            </p>
            <p className="text-xs font-medium text-neutral-600">Total Products</p>
            <p className="text-[11px] text-neutral-500">
              {metrics?.activeProducts ?? 0} active · {metrics?.outOfStockProducts ?? 0} sold out
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEC9] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="absolute right-0 bottom-0 w-24 h-24 rounded-tl-full bg-sky-50 pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center shrink-0 relative z-10">
            <ShoppingCart className="w-5 h-5 text-sky-700" />
          </div>
          <div className="min-w-0 relative z-10">
            <p className="text-2xl font-bold text-[#090909] tabular-nums">
              {loading ? '—' : metrics?.totalOrders ?? 0}
            </p>
            <p className="text-xs font-medium text-neutral-600">Total Orders</p>
            <p className="text-[11px] text-neutral-500">
              {metrics?.pendingOrders ?? 0} pending confirmation
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEC9] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="absolute right-0 bottom-0 w-24 h-24 rounded-tl-full bg-purple-50 pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0 relative z-10">
            <DollarSign className="w-5 h-5 text-purple-700" />
          </div>
          <div className="min-w-0 relative z-10">
            <p className="text-xl sm:text-2xl font-bold text-[#090909] tabular-nums truncate">
              {loading
                ? '—'
                : formatPrice(metrics?.confirmedSalesTotal || 0, settings.currency_symbol)}
            </p>
            <p className="text-xs font-medium text-neutral-600">Confirmed Paid Sales</p>
            <p className="text-[11px] text-neutral-500">
              {metrics?.totalCustomers ?? 0} client profile(s)
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEC9] rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="absolute right-0 bottom-0 w-24 h-24 rounded-tl-full bg-emerald-50 pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 relative z-10">
            <MessageCircle className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0 relative z-10">
            <p className="text-2xl font-bold text-[#090909] tabular-nums">
              {loading ? '—' : metrics?.whatsappInitiations ?? 0}
            </p>
            <p className="text-xs font-medium text-neutral-600">WhatsApp Inquiries</p>
            <p className="text-[11px] text-neutral-500">Checkouts initiated via WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Secondary Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Confirmation
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.pendingOrders ?? 0}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            Confirmed / Active
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.confirmedOrders ?? 0}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed / Delivered
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.completedOrders ?? 0}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#9A7422]" />
            Total Customers
          </span>
          <span className="text-sm font-semibold tabular-nums">{metrics?.totalCustomers ?? 0}</span>
        </div>
      </div>

      {/* Store Performance Chart + 3x2 Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-white border border-[#E7DEC9] rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#090909]">
                Store Performance
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

          {!chartGeometry ? (
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
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                className="w-full h-56 min-w-[420px]"
                role="img"
                aria-label="Store performance trend chart"
              >
                <defs>
                  <linearGradient id="mcfdjChartGoldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF5A" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#D4AF5A" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y =
                    chartGeometry.padTop +
                    (chartGeometry.baseLineY - chartGeometry.padTop) * ratio;
                  return (
                    <line
                      key={ratio}
                      x1={24}
                      y1={y}
                      x2={chartGeometry.width - 24}
                      y2={y}
                      stroke="#EDE5D6"
                      strokeWidth="1"
                    />
                  );
                })}

                <polygon points={chartGeometry.revArea} fill="url(#mcfdjChartGoldFill)" />
                <polyline
                  fill="none"
                  stroke="#D4AF5A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartGeometry.revLine}
                />
                <polyline
                  fill="none"
                  stroke="#090909"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartGeometry.ordLine}
                />

                {chartGeometry.revPoints.map((p, idx) => (
                  <g key={p.point.date}>
                    <circle cx={p.x} cy={p.y} r="3.5" fill="#D4AF5A" stroke="#fff" strokeWidth="1.5">
                      <title>{`${p.point.label}: ${formatPrice(
                        p.point.paidRevenue,
                        settings.currency_symbol
                      )} paid`}</title>
                    </circle>
                    <circle
                      cx={chartGeometry.ordPoints[idx].x}
                      cy={chartGeometry.ordPoints[idx].y}
                      r="3"
                      fill="#090909"
                      stroke="#fff"
                      strokeWidth="1"
                    >
                      <title>{`${p.point.label}: ${p.point.orders} order(s)`}</title>
                    </circle>
                    {(chartGeometry.revPoints.length <= 10 ||
                      idx % Math.ceil(chartGeometry.revPoints.length / 8) === 0) && (
                      <text
                        x={p.x}
                        y={chartGeometry.height - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#737373"
                      >
                        {p.point.label}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Exact 3x2 Quick Actions Grid */}
        <div className="xl:col-span-5 bg-white border border-[#E7DEC9] rounded-2xl p-5 sm:p-6">
          <h3 className="font-serif text-xl font-semibold text-[#090909] mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              to="/admin/products?new=1"
              className="p-4 rounded-xl bg-gradient-to-br from-[#F7E3AC] to-[#E8BE62]/75 border border-[#D4AF5A]/50 hover:brightness-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
            >
              <Plus className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Add Product</span>
            </Link>
            <Link
              to="/admin/categories"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
            >
              <FolderTree className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Manage Categories</span>
            </Link>
            <Link
              to="/admin/products"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
            >
              <Tag className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Update Prices</span>
            </Link>
            <Link
              to="/admin/content"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
            >
              <Globe className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Edit Website</span>
            </Link>
            <Link
              to="/admin/settings"
              className="p-4 rounded-xl bg-[#FAF5EE] border border-[#E7DEC9] hover:border-[#090909] transition-colors flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
            >
              <Settings className="w-5 h-5 text-[#090909]" />
              <span className="text-xs font-semibold text-[#090909]">Store Settings</span>
            </Link>
            <Link
              to="/"
              target="_blank"
              className="p-4 rounded-xl bg-[#090909] text-white hover:bg-neutral-800 transition-colors flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
            >
              <Eye className="w-5 h-5 text-[#D4AF5A]" />
              <span className="text-xs font-semibold">View Store</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white border border-[#E7DEC9] rounded-2xl p-5 sm:p-6">
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
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {metrics.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#E7DEC9] bg-[#FAF5EE]/40 p-3.5 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-[#FAF0D4] text-[#9A7422] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {getInitials(order.customer_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#090909] truncate">
                            {order.customer_name}
                          </p>
                          <p className="font-mono text-[11px] text-neutral-500">
                            {order.order_reference}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-semibold shrink-0 ${statusBadgeClass(
                          order.order_status
                        )}`}
                      >
                        {order.order_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E7DEC9]/60">
                      <div className="text-neutral-600">
                        <span className="font-semibold text-[#090909] tabular-nums">
                          {formatPrice(order.total, settings.currency_symbol)}
                        </span>{' '}
                        · {order.items?.length ?? 0} item(s)
                      </div>
                      <Link
                        to={`/admin/orders?order=${order.id}`}
                        className="px-3 py-1 rounded bg-[#090909] text-white text-[11px] font-semibold"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500">
                      <th className="py-2.5 pr-3 font-medium">#</th>
                      <th className="py-2.5 pr-3 font-medium">Customer</th>
                      <th className="py-2.5 pr-3 font-medium">Products</th>
                      <th className="py-2.5 pr-3 font-medium">Total</th>
                      <th className="py-2.5 pr-3 font-medium">Status</th>
                      <th className="py-2.5 pr-3 font-medium">Date</th>
                      <th className="py-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {metrics.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF5EE]/60">
                        <td className="py-3 pr-3 font-mono font-semibold text-[#090909]">
                          {order.order_reference}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full bg-[#FAF0D4] text-[#9A7422] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {getInitials(order.customer_name)}
                            </span>
                            <span className="font-medium text-[#242424]">
                              {order.customer_name}
                            </span>
                          </div>
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
            </>
          )}
        </div>

        <div className="xl:col-span-4 bg-white border border-[#E7DEC9] rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-semibold text-[#090909]">
              Top Products
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
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-[#FAF5EE]/50"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-[#E7DEC9]/60">
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
