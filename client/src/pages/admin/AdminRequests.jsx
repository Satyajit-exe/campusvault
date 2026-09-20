import React, { useState, useEffect } from 'react';
import { FileQuestion, CheckCircle2, Users } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminRequests();
      if (res.requests) setRequests(res.requests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleFulfill = async (id) => {
    try {
      await api.fulfillRequest(id, {});
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to fulfill request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Student Material Demand
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ranked by demand volume so contributors and faculty know what missing question papers to prioritize.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
          No material requests submitted.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Requested Material</th>
                <th className="px-4 py-4">Student Demand</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    {r.subject?.code} - {r.subject?.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{r.requestedMaterial}</span>
                    {r.details && <p className="text-[11px] text-slate-400 mt-0.5">{r.details}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      <Users className="h-3 w-3" /> {r.requestCount} Students
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === 'fulfilled'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status !== 'fulfilled' && (
                      <button
                        type="button"
                        onClick={() => handleFulfill(r._id)}
                        className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        Mark Fulfilled
                      </button>
                    )}
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
