import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Archive,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadResources = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminResources({ status: statusFilter });
      if (res.resources) setResources(res.resources);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateResourceStatus(id, newStatus);
      loadResources();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Resource Catalog & Moderation
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Publish, unpublish, archive, or perform administrative backups of academic materials.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved & Published</option>
            <option value="pending">Pending Review</option>
            <option value="archived">Archived</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
          No resources found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-4">Title & Details</th>
                <th className="px-4 py-4">Subject</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Views / Saves</th>
                <th className="px-6 py-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {resources.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                    <Link
                      to={`/resources/${r.slug || r._id}/view`}
                      target="_blank"
                      className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline transition-colors"
                      title="Open Document Preview"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">{r.subject?.code || 'N/A'}</td>
                  <td className="px-4 py-4">{r.materialType}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : r.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px]">
                    {r.viewsCount} / {r.savesCount}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {/* Admin Preview Button */}
                    <Link
                      to={`/resources/${r.slug || r._id}/view`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                      title="Preview Document"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>

                    {/* Admin PDF Download Link (for moderation backup) */}
                    <a
                      href={`/api/resources/${r._id}/admin-download`}
                      download
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                      title="Admin Moderation Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>

                    {r.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r._id, 'approved')}
                        className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        Publish
                      </button>
                    )}

                    {r.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r._id, 'archived')}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Archive
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
