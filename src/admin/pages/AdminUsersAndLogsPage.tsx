import React, { useEffect, useState } from 'react';
import { KeyRound, Plus, Shield, UserCheck } from 'lucide-react';
import { useAdminAuth } from '@/src/contexts/AdminAuthContext';
import { useToast } from '@/src/contexts/ToastContext';
import {
  fetchActivityLogs,
  fetchAdminUsers,
} from '@/src/services/adminService';
import type { ActivityLog, AdminRoleType, AdminUserRecord } from '@/src/types/store';
import { formatDateTime } from '@/src/utils/format';

export function AdminUsersAndLogsPage() {
  const { can, session, user, role, fullName, updatePassword } = useAdminAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'logs' | 'admins' | 'password'>('logs');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);

  // New Admin Form (Super Admin only)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRoleType>('store_manager');
  const [creating, setCreating] = useState(false);

  // Change own password
  const [ownPassword, setOwnPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  const load = async () => {
    try {
      const logList = await fetchActivityLogs(120);
      setLogs(logList);
      if (can('manage_admins')) {
        const adminList = await fetchAdminUsers();
        setAdmins(adminList);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load records.', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not create administrator.');
      showToast(`Administrator ${newEmail} created with role ${newRole}.`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error creating admin.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAdmin = async (record: AdminUserRecord) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/admin/users/${record.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: !record.is_active }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Update failed.');
      showToast('Administrator access updated.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPass(true);
    try {
      await updatePassword(ownPassword);
      showToast('Your administrator password has been updated.');
      setOwnPassword('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Password update failed.', 'error');
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-[#090909]">
          Administrators &amp; Audit Logs
        </h2>
        <p className="text-xs text-neutral-600 mt-0.5">
          Role-based access control, account security, and complete administrative activity history.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-white border border-[#E7DEC9] rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => setTab('logs')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'logs' ? 'bg-[#090909] text-[#E8BE62]' : 'text-neutral-600'
          }`}
        >
          Activity Log ({logs.length})
        </button>
        {can('manage_admins') && (
          <button
            type="button"
            onClick={() => setTab('admins')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold ${
              tab === 'admins' ? 'bg-[#090909] text-[#E8BE62]' : 'text-neutral-600'
            }`}
          >
            Administrators ({admins.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'password' ? 'bg-[#090909] text-[#E8BE62]' : 'text-neutral-600'
          }`}
        >
          My Profile &amp; Password
        </button>
      </div>

      {tab === 'logs' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-xs text-neutral-500">
              No administrative actions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] border-b border-[#E7DEC9] text-neutral-600">
                  <tr>
                    <th className="p-3.5 font-semibold">Timestamp</th>
                    <th className="p-3.5 font-semibold">Administrator</th>
                    <th className="p-3.5 font-semibold">Action</th>
                    <th className="p-3.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF5EE]/60">
                      <td className="p-3.5 text-neutral-500 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="p-3.5 font-medium text-[#090909]">
                        {log.admin_email || log.admin_id || 'System'}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#9A7422]">
                        {log.action}
                      </td>
                      <td className="p-3.5 text-neutral-700">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'admins' && can('manage_admins') && (
        <div className="space-y-6 text-xs">
          <form
            onSubmit={handleCreateAdmin}
            className="bg-white border border-[#E7DEC9] rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#9A7422]" />
              <h3 className="font-serif text-xl font-semibold text-[#090909]">
                Add Team Administrator
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full Name *"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email *"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <input
                type="password"
                required
                minLength={10}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password (min 10 chars) *"
                className="px-3 py-2 rounded-lg border border-neutral-300"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AdminRoleType)}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="store_manager">Store Manager</option>
                <option value="content_manager">Content Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <Plus className="w-4 h-4 text-[#D4AF5A]" />
              {creating ? 'Creating...' : 'Create Administrator'}
            </button>
          </form>

          <div className="bg-white border border-[#E7DEC9] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#FAF5EE] border-b border-[#E7DEC9] text-neutral-600">
                <tr>
                  <th className="p-3.5 font-semibold">Administrator</th>
                  <th className="p-3.5 font-semibold">Role</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3.5">
                      <p className="font-semibold text-[#090909]">
                        {a.profile?.full_name || 'Administrator'}
                      </p>
                      <p className="text-neutral-500">{a.profile?.email || a.user_id}</p>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">{a.role}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          a.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {a.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {a.user_id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(a)}
                          className="px-3 py-1 rounded border border-neutral-300 font-medium hover:border-[#090909]"
                        >
                          {a.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white border border-[#E7DEC9] rounded-xl p-6 max-w-lg space-y-5 text-xs">
          <div className="flex items-center gap-3 pb-4 border-b">
            <UserCheck className="w-5 h-5 text-[#9A7422]" />
            <div>
              <p className="font-semibold text-sm text-[#090909]">{fullName}</p>
              <p className="text-neutral-500">
                {user?.email} · Role: <span className="font-mono">{role}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">
                New Password (minimum 10 characters)
              </label>
              <input
                type="password"
                required
                minLength={10}
                value={ownPassword}
                onChange={(e) => setOwnPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={updatingPass}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#090909] text-white font-semibold"
            >
              <KeyRound className="w-4 h-4 text-[#D4AF5A]" />
              {updatingPass ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
