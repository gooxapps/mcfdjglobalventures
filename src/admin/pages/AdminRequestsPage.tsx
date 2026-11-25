import React, { useEffect, useState } from 'react';
import {
  Crown,
  Download,
  ExternalLink,
  MessageCircle,
  Palette,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '@/src/contexts/ToastContext';
import {
  deleteAdminAsoOkeEnquiry,
  deleteAdminCustomRequest,
  fetchAdminAsoOkeEnquiries,
  fetchAdminCustomRequests,
  updateAdminAsoOkeEnquiry,
  updateAdminCustomRequest,
} from '@/src/services/adminService';
import type { AsoOkeEnquiry, CustomDesignRequest, InquiryStatus } from '@/src/types/store';
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from '@/src/utils/whatsapp';

const INQUIRY_STATUSES: InquiryStatus[] = [
  'New',
  'In Review',
  'Quoted',
  'In Production',
  'Completed',
  'Cancelled',
];

function escapeCsvCell(val: string): string {
  const s = val.replace(/\r?\n/g, ' ');
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function AdminRequestsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'custom' | 'aso-oke'>('custom');
  const [customRequests, setCustomRequests] = useState<CustomDesignRequest[]>([]);
  const [asoOkeEnquiries, setAsoOkeEnquiries] = useState<AsoOkeEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustom, setSelectedCustom] = useState<CustomDesignRequest | null>(null);
  const [selectedAso, setSelectedAso] = useState<AsoOkeEnquiry | null>(null);
  const [editStatus, setEditStatus] = useState<InquiryStatus>('New');
  const [editQuote, setEditQuote] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reqs, enqs] = await Promise.all([
        fetchAdminCustomRequests(),
        fetchAdminAsoOkeEnquiries(),
      ]);
      setCustomRequests(reqs);
      setAsoOkeEnquiries(enqs);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCustomDetail = (item: CustomDesignRequest) => {
    setSelectedAso(null);
    setSelectedCustom(item);
    setEditStatus(item.status);
    setEditQuote(item.quoted_amount !== null ? String(item.quoted_amount) : '');
    setEditNotes(item.internal_notes || '');
  };

  const openAsoDetail = (item: AsoOkeEnquiry) => {
    setSelectedCustom(null);
    setSelectedAso(item);
    setEditStatus(item.status);
    setEditQuote(item.quoted_amount !== null ? String(item.quoted_amount) : '');
    setEditNotes(item.internal_notes || '');
  };

  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedQuote = editQuote.trim() ? Number(editQuote) : null;
      if (selectedCustom) {
        await updateAdminCustomRequest(selectedCustom.id, {
          status: editStatus,
          quoted_amount: parsedQuote,
          internal_notes: editNotes,
        });
        showToast(`Updated ${selectedCustom.request_reference}.`);
        setSelectedCustom(null);
      } else if (selectedAso) {
        await updateAdminAsoOkeEnquiry(selectedAso.id, {
          status: editStatus,
          quoted_amount: parsedQuote,
          internal_notes: editNotes,
        });
        showToast(`Updated ${selectedAso.enquiry_reference}.`);
        setSelectedAso(null);
      }
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustom = async (item: CustomDesignRequest) => {
    try {
      await deleteAdminCustomRequest(item.id);
      showToast(`Removed ${item.request_reference}.`);
      setSelectedCustom(null);
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  const handleDeleteAso = async (item: AsoOkeEnquiry) => {
    try {
      await deleteAdminAsoOkeEnquiry(item.id);
      showToast(`Removed ${item.enquiry_reference}.`);
      setSelectedAso(null);
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  const exportCsv = () => {
    if (tab === 'custom') {
      const headers = [
        'Reference',
        'Name',
        'WhatsApp',
        'Email',
        'Type',
        'Quantity',
        'Event Date',
        'Location',
        'Status',
        'Quote',
        'Description',
      ];
      const rows = customRequests.map((r) =>
        [
          r.request_reference,
          r.name,
          r.whatsapp_number,
          r.email,
          r.customization_type,
          String(r.quantity),
          r.event_date,
          r.delivery_location,
          r.status,
          r.quoted_amount !== null ? String(r.quoted_amount) : '',
          r.description,
        ]
          .map(escapeCsvCell)
          .join(',')
      );
      const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mcfdj-custom-design-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        'Reference',
        'Name',
        'WhatsApp',
        'Email',
        'Enquiry Type',
        'Group Size',
        'Quantity',
        'Event Date',
        'Location',
        'Status',
        'Quote',
        'Notes',
      ];
      const rows = asoOkeEnquiries.map((e) =>
        [
          e.enquiry_reference,
          e.name,
          e.whatsapp_number,
          e.email,
          e.enquiry_type,
          e.group_size,
          String(e.quantity),
          e.event_date,
          e.delivery_location,
          e.status,
          e.quoted_amount !== null ? String(e.quoted_amount) : '',
          e.notes,
        ]
          .map(escapeCsvCell)
          .join(',')
      );
      const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mcfdj-aso-oke-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#090909]">
            Custom Designs &amp; Aso Oke Enquiries
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Review sample uploads, custom design specifications, and wedding or group outfit enquiries.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-semibold hover:bg-neutral-50"
        >
          <Download className="w-4 h-4 text-[#9A6B19]" />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1.5 bg-white border border-[#E7DEC9] rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => setTab('custom')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'custom' ? 'bg-[#3B0E3F] text-[#E8BE62]' : 'text-neutral-600 hover:text-[#090909]'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Custom Design Requests ({customRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('aso-oke')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'aso-oke'
              ? 'bg-[#3B0E3F] text-[#E8BE62]'
              : 'text-neutral-600 hover:text-[#090909]'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Aso Oke &amp; Group Enquiries ({asoOkeEnquiries.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-10 text-center text-xs text-neutral-500">
          Loading requests...
        </div>
      ) : tab === 'custom' ? (
        <div className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden shadow-2xs">
          {customRequests.length === 0 ? (
            <div className="p-10 text-center text-xs text-neutral-500">
              No custom design requests recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] border-b border-[#E7DEC9] text-neutral-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Qty / Event</th>
                    <th className="px-4 py-3">Sample</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1E8DC]">
                  {customRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#FAF5EE]/60">
                      <td className="px-4 py-3 font-mono font-semibold text-[#3B0E3F]">
                        {req.request_reference}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#090909]">{req.name}</p>
                        <p className="text-[11px] text-neutral-500">{req.whatsapp_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#090909]">{req.customization_type}</p>
                        <p className="text-[11px] text-neutral-500 truncate max-w-[220px]">
                          {req.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <p>{req.quantity} pcs</p>
                        <p className="text-[11px] text-neutral-500">{req.event_date || 'Flexible'}</p>
                      </td>
                      <td className="px-4 py-3">
                        {req.reference_image_url ? (
                          <img
                            src={req.reference_image_url}
                            alt="Sample"
                            className="w-10 h-10 rounded object-cover border border-[#E7DEC9]"
                          />
                        ) : (
                          <span className="text-neutral-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F5ECDF] text-[#3B0E3F] font-semibold">
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openCustomDetail(req)}
                          className="px-3 py-1.5 rounded-lg bg-[#090909] text-white font-semibold hover:bg-neutral-800"
                        >
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(req)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg align-middle"
                          aria-label="Delete request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden shadow-2xs">
          {asoOkeEnquiries.length === 0 ? (
            <div className="p-10 text-center text-xs text-neutral-500">
              No Aso Oke or group outfit enquiries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] border-b border-[#E7DEC9] text-neutral-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Focus</th>
                    <th className="px-4 py-3">Group / Qty</th>
                    <th className="px-4 py-3">Sample</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1E8DC]">
                  {asoOkeEnquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-[#FAF5EE]/60">
                      <td className="px-4 py-3 font-mono font-semibold text-[#3B0E3F]">
                        {enq.enquiry_reference}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#090909]">{enq.name}</p>
                        <p className="text-[11px] text-neutral-500">{enq.whatsapp_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#090909]">{enq.enquiry_type}</p>
                        <p className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                          {enq.delivery_location}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <p>{enq.group_size}</p>
                        <p className="text-[11px] text-neutral-500">{enq.quantity} outfits</p>
                      </td>
                      <td className="px-4 py-3">
                        {enq.reference_image_url ? (
                          <img
                            src={enq.reference_image_url}
                            alt="Sample"
                            className="w-10 h-10 rounded object-cover border border-[#E7DEC9]"
                          />
                        ) : (
                          <span className="text-neutral-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F5ECDF] text-[#3B0E3F] font-semibold">
                          {enq.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openAsoDetail(enq)}
                          className="px-3 py-1.5 rounded-lg bg-[#090909] text-white font-semibold hover:bg-neutral-800"
                        >
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAso(enq)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg align-middle"
                          aria-label="Delete enquiry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail & Status Update Modal */}
      {(selectedCustom || selectedAso) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
          <div className="bg-white border border-[#E7DEC9] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div>
                <p className="font-mono text-[#7D4B16] font-semibold">
                  {selectedCustom
                    ? selectedCustom.request_reference
                    : selectedAso?.enquiry_reference}
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#090909]">
                  {selectedCustom ? selectedCustom.name : selectedAso?.name}
                </h3>
                <p className="text-neutral-500">
                  WhatsApp: {selectedCustom ? selectedCustom.whatsapp_number : selectedAso?.whatsapp_number}{' '}
                  {(selectedCustom?.email || selectedAso?.email) &&
                    `· ${selectedCustom?.email || selectedAso?.email}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustom(null);
                  setSelectedAso(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-[#090909]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF5EE] rounded-xl p-4 space-y-2">
              {selectedCustom ? (
                <>
                  <p>
                    <strong>Type:</strong> {selectedCustom.customization_type} ·{' '}
                    <strong>Qty:</strong> {selectedCustom.quantity}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedCustom.delivery_location || '—'} ·{' '}
                    <strong>Event Date:</strong> {selectedCustom.event_date || '—'}
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedCustom.description}
                  </p>
                </>
              ) : selectedAso ? (
                <>
                  <p>
                    <strong>Focus:</strong> {selectedAso.enquiry_type} ·{' '}
                    <strong>Group Size:</strong> {selectedAso.group_size} ·{' '}
                    <strong>Qty:</strong> {selectedAso.quantity}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedAso.delivery_location || '—'} ·{' '}
                    <strong>Event Date:</strong> {selectedAso.event_date || '—'}
                  </p>
                  <p>
                    <strong>Notes:</strong> {selectedAso.notes || 'None provided'}
                  </p>
                </>
              ) : null}

              {(selectedCustom?.reference_image_url || selectedAso?.reference_image_url) && (
                <div className="pt-2">
                  <p className="font-semibold mb-1.5">Attached Reference Photo:</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedCustom?.reference_image_url || selectedAso?.reference_image_url}
                      alt="Reference sample"
                      className="w-24 h-24 rounded-lg object-cover border"
                    />
                    {(selectedCustom?.reference_image_url || selectedAso?.reference_image_url)?.startsWith('http') && (
                      <a
                        href={selectedCustom?.reference_image_url || selectedAso?.reference_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#3B0E3F] font-semibold hover:underline"
                      >
                        Open Full Resolution
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveDetail} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as InquiryStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                  >
                    {INQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Quoted Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editQuote}
                    onChange={(e) => setEditQuote(e.target.value)}
                    placeholder="e.g. 450.00"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Internal Atelier Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {(() => {
                  const phone = selectedCustom?.whatsapp_number || selectedAso?.whatsapp_number || '';
                  const digits = normalizeWhatsAppDigits(phone);
                  if (digits.length < 10) return <span />;
                  const ref = selectedCustom?.request_reference || selectedAso?.enquiry_reference;
                  return (
                    <a
                      href={buildWhatsAppUrl(
                        digits,
                        `Hello ${(selectedCustom || selectedAso)?.name}, regarding your MCFD J Global Ventures request ${ref}:`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1EA34D] text-white font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message Client on WhatsApp
                    </a>
                  );
                })()}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#090909] text-white font-semibold"
                >
                  <Save className="w-4 h-4 text-[#D4AF5A]" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
