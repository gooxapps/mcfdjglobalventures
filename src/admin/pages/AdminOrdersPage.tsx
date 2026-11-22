import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Eye,
  MessageCircle,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  fetchAdminOrders,
  updateAdminOrder,
} from '@/src/services/adminService';
import type { Order, OrderStatus, PaymentStatus } from '@/src/types/store';
import { downloadCsv } from '@/src/utils/csv';
import { formatDateTime, formatPrice } from '@/src/utils/format';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

const ORDER_STATUSES: OrderStatus[] = [
  'New',
  'Pending Confirmation',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'Unpaid',
  'Awaiting Payment',
  'Paid',
  'Partially Paid',
  'Refunded',
];

export function AdminOrdersPage() {
  const { settings } = useStore();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending Confirmation');
  const [editPayment, setEditPayment] = useState<PaymentStatus>('Unpaid');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editDeliveryCharge, setEditDeliveryCharge] = useState(0);
  const [editInternalNotes, setEditInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminOrders();
      setOrders(list);
      const targetId = searchParams.get('order');
      if (targetId) {
        const found = list.find((o) => o.id === targetId);
        if (found) openOrder(found);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.order_status);
    setEditPayment(order.payment_status);
    setEditDeliveryAddress(order.delivery_address);
    setEditDeliveryCharge(order.delivery_charge);
    setEditInternalNotes(order.internal_notes || '');
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter && o.order_status !== orderStatusFilter) return false;
      if (paymentStatusFilter && o.payment_status !== paymentStatusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !o.order_reference.toLowerCase().includes(q) &&
          !o.customer_name.toLowerCase().includes(q) &&
          !o.customer_phone.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, search, orderStatusFilter, paymentStatusFilter]);

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await updateAdminOrder(
        selectedOrder.id,
        {
          order_status: editStatus,
          payment_status: editPayment,
          delivery_address: editDeliveryAddress,
          delivery_charge: editDeliveryCharge,
          internal_notes: editInternalNotes,
        },
        selectedOrder.order_reference
      );
      showToast(`Order ${selectedOrder.order_reference} updated.`);
      setSelectedOrder(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      'mcfdj-orders.csv',
      [
        'order_reference',
        'customer_name',
        'customer_phone',
        'customer_email',
        'delivery_address',
        'subtotal',
        'delivery_charge',
        'total',
        'order_status',
        'payment_status',
        'created_at',
      ],
      filtered.map((o) => [
        o.order_reference,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.delivery_address,
        o.subtotal,
        o.delivery_charge,
        o.total,
        o.order_status,
        o.payment_status,
        o.created_at,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#090909]">
            Order Management
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            WhatsApp checkouts start as Pending Confirmation / Unpaid until verified by an administrator.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-semibold hover:border-[#090909]"
        >
          <Download className="w-3.5 h-3.5" />
          Export Orders CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E7DEC9] rounded-xl p-4 flex flex-wrap gap-3 no-print">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference (#MCFD-...), customer name, or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 text-xs"
          />
        </div>
        <select
          value={orderStatusFilter}
          onChange={(e) => setOrderStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white"
        >
          <option value="">All Order Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white"
        >
          <option value="">All Payment Statuses</option>
          {PAYMENT_STATUSES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden no-print">
        {loading ? (
          <div className="p-10 text-center text-xs text-neutral-500">
            Loading orders...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No orders match the current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E7DEC9] text-neutral-600">
                <tr>
                  <th className="p-3.5 font-semibold">Reference</th>
                  <th className="p-3.5 font-semibold">Customer</th>
                  <th className="p-3.5 font-semibold">Items</th>
                  <th className="p-3.5 font-semibold">Total</th>
                  <th className="p-3.5 font-semibold">Order Status</th>
                  <th className="p-3.5 font-semibold">Payment</th>
                  <th className="p-3.5 font-semibold">Date</th>
                  <th className="p-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF5EE]/60">
                    <td className="p-3.5 font-mono font-semibold text-[#090909]">
                      {order.order_reference}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-[#090909]">{order.customer_name}</p>
                      <p className="text-[11px] text-neutral-500">{order.customer_phone}</p>
                    </td>
                    <td className="p-3.5 tabular-nums text-neutral-600">
                      {order.items?.length ?? 0} item(s)
                    </td>
                    <td className="p-3.5 font-semibold tabular-nums">
                      {formatPrice(order.total, settings.currency_symbol)}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[11px] font-medium">
                        {order.order_status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          order.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.payment_status === 'Refunded'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-neutral-500 whitespace-nowrap">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openOrder(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#090909] text-white text-[11px] font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF5A]" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal (also print-ready) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl border border-[#E7DEC9] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#090909] text-white flex items-center justify-between no-print">
              <div>
                <p className="text-[11px] font-mono text-[#E8BE62]">
                  {selectedOrder.order_reference}
                </p>
                <h3 className="font-serif text-xl font-semibold">
                  Order Details — {selectedOrder.customer_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveOrder}
              className="p-6 overflow-y-auto space-y-6 text-xs"
            >
              {/* Print Header */}
              <div className="hidden print:block border-b pb-4">
                <h2 className="font-serif text-2xl font-bold">
                  MCFD J GLOBAL VENTURES — Order Summary
                </h2>
                <p className="font-mono text-sm mt-1">
                  Reference: {selectedOrder.order_reference} · Date:{' '}
                  {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF5EE] p-4 rounded-xl border border-[#E7DEC9]">
                <div>
                  <p className="text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                    Customer Contact
                  </p>
                  <p className="font-semibold text-sm text-[#090909]">
                    {selectedOrder.customer_name}
                  </p>
                  <p className="text-neutral-700">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && (
                    <p className="text-neutral-700">{selectedOrder.customer_email}</p>
                  )}
                </div>
                <div>
                  <p className="text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                    Customer Notes
                  </p>
                  <p className="text-neutral-700">
                    {selectedOrder.customer_notes || 'No instructions provided.'}
                  </p>
                </div>
              </div>

              {/* Ordered Items */}
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                  Ordered Items
                </h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 border-b text-neutral-500">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Variant</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedOrder.items || []).map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-medium text-[#090909]">
                            {item.product_name}
                            {item.product_sku && (
                              <span className="block text-[10px] font-mono text-neutral-500">
                                {item.product_sku}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-neutral-600">
                            {[item.size, item.colour].filter(Boolean).join(' / ') || 'Standard'}
                          </td>
                          <td className="p-3 text-right tabular-nums">{item.quantity}</td>
                          <td className="p-3 text-right tabular-nums">
                            {formatPrice(item.unit_price, settings.currency_symbol)}
                          </td>
                          <td className="p-3 text-right font-semibold tabular-nums">
                            {formatPrice(item.subtotal, settings.currency_symbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex flex-col items-end space-y-1 tabular-nums">
                <p>
                  Subtotal:{' '}
                  <strong>
                    {formatPrice(selectedOrder.subtotal, settings.currency_symbol)}
                  </strong>
                </p>
                <p>
                  Delivery:{' '}
                  <strong>
                    {formatPrice(editDeliveryCharge, settings.currency_symbol)}
                  </strong>
                </p>
                <p className="text-base font-bold text-[#090909]">
                  Total:{' '}
                  {formatPrice(
                    Number(selectedOrder.subtotal) +
                      Number(selectedOrder.tax_amount) +
                      Number(editDeliveryCharge || 0),
                    settings.currency_symbol
                  )}
                </p>
              </div>

              {/* Admin Update Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t no-print">
                <div>
                  <label className="block font-semibold mb-1">Order Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Payment Status</label>
                  <select
                    value={editPayment}
                    onChange={(e) => setEditPayment(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  >
                    {PAYMENT_STATUSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Delivery Charge</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editDeliveryCharge}
                    onChange={(e) => setEditDeliveryCharge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
                <div>
                  <label className="block font-semibold mb-1">Delivery Address</label>
                  <textarea
                    rows={2}
                    value={editDeliveryAddress}
                    onChange={(e) => setEditDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Internal Admin Notes</label>
                  <textarea
                    rows={2}
                    value={editInternalNotes}
                    onChange={(e) => setEditInternalNotes(e.target.value)}
                    placeholder="Courier tracking ID, payment verification notes..."
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t no-print">
                <div className="flex items-center gap-2">
                  {normalizeWhatsAppDigits(selectedOrder.customer_phone).length >= 7 && (
                    <a
                      href={buildWhatsAppUrl(
                        selectedOrder.customer_phone,
                        `Hello ${selectedOrder.customer_name}, regarding your MCFD J GLOBAL VENTURES order ${selectedOrder.order_reference}...`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp Customer
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Summary
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-lg border font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-[#090909] text-white font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save Order Update'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
