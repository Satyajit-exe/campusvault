import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Ban, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers();
      if (res.users) setUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, { role: newRole });
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await api.updateUserRole(userId, { isActive: !currentActive });
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            User Accounts & Roles
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage student memberships, contributor statuses, and role privileges.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {users.length} Registered
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-4 py-4">College & Branch</th>
                <th className="px-4 py-4">Semester</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{u.college?.name || 'College'}</p>
                    <p className="text-[11px] text-slate-400">{u.branch?.code || 'CSE'}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold">Sem {u.currentSemester}</td>
                  <td className="px-4 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(u._id, u.isActive)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
