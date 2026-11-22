import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, MessageCircle, Search, X } from 'lucide-react';
import { useStore } from '@/src/contexts/StoreContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  fetchAdminCustomers,
  fetchAdminOrders,
  updateAdminCustomer,
} from '@/src/services/adminService';
import type { Customer, Order } from '@/src/types/store';
import { downloadCsv } from '@/src/utils/csv';
import { formatDateTime, formatPrice, formatShortDate } from '@/src/utils/format';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

export function AdminCustomersPage() {
  const { settings } = useStore();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [custs, ords] = await Promise.all([
        fetchAdminCustomers(),
        fetchAdminOrders(),
      ]);
      setCustomers(custs);
      setOrders(ords);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const customerOrders = useMemo(() => {
    if (!selected) return [];
    return orders.filter(
      (o) => o.customer_id === selected.id || o.customer_phone === selected.phone
    );
  }, [selected, orders]);

  const openCustomer = (c: Customer) => {
    setSelected(c);
    setEditName(c.full_name);
    setEditEmail(c.email || '');
    setEditAddress(c.default_address || '');
    setEditNotes(c.notes || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await updateAdminCustomer(selected.id, {
        full_name: editName,
        email: editEmail,
        default_address: editAddress,
        notes: editNotes,
      });
      showToast('Customer record updated.');
      setSelected(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    downloadCsv(
      'mcfdj-customers.csv',
      ['full_name', 'phone', 'email', 'default_address', 'total_orders', 'last_order_at', 'notes'],
      filtered.map((c) => [
        c.full_name,
        c.phone,
        c.email,
        c.default_address,
        c.total_orders,
        c.last_order_at || '',
        c.notes,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#090909]">
            Customer Directory
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Private client records protected by administrator-only Row Level Security.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-semibold hover:border-[#090909]"
        >
          <Download className="w-3.5 h-3.5" />
          Export Customers CSV
        </button>
      </div>

      <div className="bg-white border border-[#E7DEC9] rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 text-xs"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-neutral-500">
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No customer records found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E7DEC9] text-neutral-600">
                <tr>
                  <th className="p-3.5 font-semibold">Customer</th>
                  <th className="p-3.5 font-semibold">Phone</th>
                  <th className="p-3.5 font-semibold">Email</th>
                  <th className="p-3.5 font-semibold">Recorded Orders</th>
                  <th className="p-3.5 font-semibold">Last Order</th>
                  <th className="p-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF5EE]/60">
                    <td className="p-3.5 font-semibold text-[#090909]">{c.full_name}</td>
                    <td className="p-3.5 font-mono text-neutral-700">{c.phone}</td>
                    <td className="p-3.5 text-neutral-600">{c.email || '—'}</td>
                    <td className="p-3.5 tabular-nums font-semibold">{c.total_orders}</td>
                    <td className="p-3.5 text-neutral-500">
                      {formatShortDate(c.last_order_at)}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openCustomer(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#090909] text-white text-[11px] font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF5A]" />
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl border border-[#E7DEC9] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#090909] text-white flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold">{selected.full_name}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Default Delivery Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Concierge Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                />
              </div>

              <div>
                <h4 className="font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                  Order History ({customerOrders.length})
                </h4>
                {customerOrders.length === 0 ? (
                  <p className="text-neutral-500">No orders linked yet.</p>
                ) : (
                  <div className="border rounded-xl divide-y max-h-48 overflow-y-auto">
                    {customerOrders.map((ord) => (
                      <div key={ord.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-mono font-semibold">{ord.order_reference}</p>
                          <p className="text-neutral-500">{formatDateTime(ord.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">
                            {formatPrice(ord.total, settings.currency_symbol)}
                          </p>
                          <p className="text-neutral-600">
                            {ord.order_status} · {ord.payment_status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                {normalizeWhatsAppDigits(selected.phone).length >= 7 ? (
                  <a
                    href={buildWhatsAppUrl(
                      selected.phone,
                      `Hello ${selected.full_name} from MCFD J GLOBAL VENTURES.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message on WhatsApp
                  </a>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 rounded-lg border font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-[#090909] text-white font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save Customer'}
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
