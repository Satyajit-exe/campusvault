import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Eye,
  CheckSquare,
  Users,
  AlertTriangle,
  FileQuestion,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  Plus,
  Wrench,
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [dashRes, sysRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getSystemStatus().catch(() => null),
        ]);
        if (dashRes?.data) setStats(dashRes.data);
        if (sysRes) setMaintenance(Boolean(sysRes.maintenance));
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleToggleMaintenance = async () => {
    setUpdatingMaintenance(true);
    try {
      const res = await api.setMaintenanceMode({ enabled: !maintenance });
      setMaintenance(Boolean(res?.maintenance?.enabled));
    } catch (err) {
      alert(err.message || 'Failed to toggle maintenance mode');
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Published Resources',
      value: stats?.totalResources || 0,
      icon: FileText,
      color: 'text-brand-600 bg-brand-50 dark:bg-brand-950 dark:text-brand-300',
    },
    {
      title: 'Total Document Views',
      value: stats?.totalViews?.toLocaleString() || 0,
      icon: Eye,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingContributions || 0,
      icon: CheckSquare,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300',
      badge: stats?.pendingContributions > 0 ? 'Requires Attention' : null,
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      title: 'Active Material Requests',
      value: stats?.pendingRequests || 0,
      icon: FileQuestion,
      color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950 dark:text-cyan-300',
    },
    {
      title: 'Copyright Reports',
      value: stats?.pendingReports || 0,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-300',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Repository Administration
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time analytics, student submissions review, copyright moderation, and syllabus structure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/approvals"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-brand-700 hover:to-violetAccent-600"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Review Submissions ({stats?.pendingContributions || 0})</span>
          </Link>
        </div>
      </div>

      {/* Maintenance Mode Controller Card */}
      <div
        className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          maintenance
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl flex items-center justify-center ${
              maintenance
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Maintenance Mode</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  maintenance
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {maintenance ? 'ACTIVE (Users Blocked)' : 'OFF (Normal Access)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {maintenance
                ? 'All non-admin users currently see the scheduled maintenance upgrade screen while you upload or configure files.'
                : 'Enable maintenance mode during uploads or updates so users see a friendly upgrade notice.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleMaintenance}
          disabled={updatingMaintenance}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0 ${
            maintenance
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
          }`}
        >
          {updatingMaintenance
            ? 'Updating...'
            : maintenance
            ? 'Disable Maintenance Mode'
            : 'Enable Maintenance Mode'}
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.title}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{c.value}</span>
                {c.badge && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                    {c.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Logs Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Administrative Audit Logs</h3>
          </div>
          <span className="text-xs text-slate-400">Security Traceability</span>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {stats?.recentAuditLogs?.length === 0 ? (
            <p className="py-4 text-center text-slate-400">No actions recorded in audit log yet.</p>
          ) : (
            stats?.recentAuditLogs?.map((log) => (
              <div key={log._id} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{log.action}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    By {log.admin?.fullName || 'Admin'} • Target: {log.targetType}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
