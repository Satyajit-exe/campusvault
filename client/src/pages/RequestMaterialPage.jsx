import React, { useState, useEffect } from 'react';
import { FileQuestion, ThumbsUp, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RequestMaterialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [subjectId, setSubjectId] = useState('');
  const [requestedMaterial, setRequestedMaterial] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, subjRes] = await Promise.all([
        api.getRequests(),
        api.getSubjects(),
      ]);

      if (reqRes.requests) setRequests(reqRes.requests);
      if (subjRes.subjects) {
        setSubjects(subjRes.subjects);
        if (subjRes.subjects.length > 0) setSubjectId(subjRes.subjects[0]._id);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.submitRequest({
        subjectId,
        requestedMaterial,
        details,
      });
      setMessage(res.message || 'Request posted successfully!');
      setRequestedMaterial('');
      setDetails('');
      loadData();
    } catch (err) {
      setMessage(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (req) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.submitRequest({
        subjectId: req.subject?._id || req.subject,
        requestedMaterial: req.requestedMaterial,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileQuestion className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Request Missing Academic Material
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Can't find a past exam paper or lecture notes? Request it here to notify student contributors and university moderators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">New Material Request</h3>

            {message && (
              <div className="rounded-xl bg-brand-50 p-3 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Subject <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Requested Material Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={requestedMaterial}
                  onChange={(e) => setRequestedMaterial(e.target.value)}
                  placeholder="e.g. 2024 Mid-Sem Question Paper with Answers"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Specific Details / Chapters Needed
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Need Module 3 Normalization questions or faculty solution key if available..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 py-3 text-xs font-bold text-white shadow-md hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Post Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Community Requests (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Most Requested Materials
            </h3>
            <span className="text-xs text-slate-400">Sorted by demand count</span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              No pending material requests. Be the first to submit!
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {req.subject?.name || req.subjectName}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {req.requestedMaterial}
                    </h4>
                    {req.details && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{req.details}</p>
                    )}
                    <p className="text-[10px] text-slate-400 pt-1">
                      Requested by <strong className="text-slate-700 dark:text-slate-300">{req.requestCount}</strong> students
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpvote(req)}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-brand-950/40 transition-all flex-shrink-0"
                    title="I also need this material"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-[11px] font-bold mt-1">+{req.requestCount}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
