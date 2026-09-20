import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Bookmark,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';

export default function MyContributionsPage() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadContributions = async () => {
    try {
      setLoading(true);
      const res = await api.getMyContributions();
      if (res.contributions) {
        setContributions(res.contributions);
      }
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContributions();
  }, []);

  const handleCancelSubmission = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending submission?')) return;
    try {
      await api.cancelContribution(id);
      loadContributions();
    } catch (err) {
      alert(err.message || 'Failed to cancel submission');
    }
  };

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      await api.updateContribution(editingItem._id, { title: editTitle });
      setEditingItem(null);
      loadContributions();
    } catch (err) {
      alert(err.message || 'Failed to update submission');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-brand-500" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              My Contribution History
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track review status, rejection reasons, and engagement statistics for your submitted materials.
          </p>
        </div>

        <Link
          to="/contribute"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-brand-700 hover:to-violetAccent-600 self-start sm:self-auto"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload New PDF</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : contributions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">No contributions yet</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Share previous exam question papers or your handwritten notes with your college community.
          </p>
          <Link
            to="/contribute"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Upload Material
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contributions.map((item) => {
            const isApproved = item.status === 'approved';
            const isPending = item.status === 'pending';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="h-3 w-3" />
                        Pending Review
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved & Published
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </span>
                    )}

                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {item.materialType}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Submitted: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.subject?.name} ({item.subject?.code}) • Semester {item.semesterNumber} •{' '}
                    {item.academicYear}
                  </p>

                  {/* Rejection Reason Alert */}
                  {isRejected && (
                    <div className="mt-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      <span className="font-bold">Moderator Feedback:</span> {item.rejectionReason}
                    </div>
                  )}

                  {/* Engagement Metrics if Approved */}
                  {isApproved && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.viewsCount}</span> views
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="h-3.5 w-3.5 text-brand-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.savesCount}</span> saves
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelSubmission(item._id)}
                        className="flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit & Resubmit
                    </button>
                  )}

                  {isApproved && (
                    <Link
                      to={`/resources/${item.slug}/view`}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <span>View Resource</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit & Resubmit Resource</h3>
            <p className="mt-1 text-xs text-slate-500">
              Update the title or details before submitting back for admin review.
            </p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700"
                >
                  {savingEdit ? 'Resubmitting...' : 'Save & Resubmit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
