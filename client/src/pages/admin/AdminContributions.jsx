import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  User,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminContributions() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingContributions();
      if (res.contributions) setContributions(res.contributions);
    } catch (err) {
      console.error('Failed to load pending contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve and publish this document to the public repository?')) return;
    try {
      await api.reviewContribution(id, { action: 'approve' });
      loadPending();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    setProcessing(true);
    try {
      await api.reviewContribution(rejectModalItem._id, {
        action: 'reject',
        rejectionReason: rejectionReason || 'Content does not meet CampusVault verification criteria.',
      });
      setRejectModalItem(null);
      setRejectionReason('');
      loadPending();
    } catch (err) {
      alert(err.message || 'Failed to reject submission');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Pending Student Contributions
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Review academic authenticity, quality, and licensing before publishing to the campus vault.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {contributions.length} Waiting Review
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : contributions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Queue Clear!</h3>
          <p className="mt-1">All student submissions have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contributions.map((item) => (
            <div
              key={item._id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-brand-50 px-2.5 py-0.5 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {item.materialType}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {item.subject?.code} - {item.subject?.name}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Submitted: {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>

                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Uploader:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.uploadedBy?.fullName || 'Student'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Source License:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.sourceType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Exam Year:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.examYear || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">File Size:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Decision Buttons */}
              <div className="flex items-center gap-2.5 self-end lg:self-center">
                <Link
                  to={`/resources/${item.slug || item._id}/view`}
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  <Eye className="h-4 w-4" /> Preview
                </Link>

                <button
                  type="button"
                  onClick={() => setRejectModalItem(item)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(item._id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Publish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal with Reason feedback */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reject Submission</h3>
            <p className="mt-1 text-xs text-slate-500">
              Provide specific feedback to <strong>{rejectModalItem.uploadedBy?.fullName}</strong> so they understand why
              and can fix it for resubmission.
            </p>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rejection Reason / Guidance
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Please crop out blank pages and re-scan page 3 which is blurry."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
