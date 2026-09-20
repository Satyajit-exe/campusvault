import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Check, X } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminReports();
      if (res.reports) setReports(res.reports);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAction = async (id, action) => {
    const reason = prompt(`Enter administrative note for this ${action} decision:`);
    if (reason === null) return;

    try {
      await api.resolveReport(id, { action, adminNotes: reason });
      loadReports();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Copyright & Content Concern Inquiries
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Investigate copyright infringement notices and execute takedowns or archival actions with audit trails.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
          <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
          <p className="font-bold text-slate-800 dark:text-slate-200">No active copyright complaints.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {report.concernType}
                </span>
                <span className="text-xs text-slate-400">
                  Filed: {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Resource: {report.resource?.title || 'Resource'}
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "{report.details}"
              </p>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>
                  Reported by: <strong className="text-slate-800 dark:text-slate-200">{report.reporterName}</strong> ({report.reporterEmail})
                </span>

                <div className="flex items-center gap-2">
                  {report.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(report._id, 'unpublish')}
                        className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700"
                      >
                        Unpublish & Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(report._id, 'archive')}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(report._id, 'dismiss')}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Resolved: {report.actionTaken}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
