import React, { useState, useEffect } from 'react';
import { Layers, Plus, School, GitBranch, BookOpen, Check, Trash2, AlertTriangle, Search, Loader2, X } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminHierarchy() {
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Subject Modal & state
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Subject Modal
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    semesterNumber: 3,
    credits: 4,
    description: '',
  });
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [subjectCreated, setSubjectCreated] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getFilterOptions();
      if (res.data) setOptions(res.data);
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!options?.branches?.[0] || !options?.colleges?.[0]) return;
    setCreatingSubject(true);

    try {
      const branch = options.branches[0];
      const college = options.colleges[0];
      const course = options.courses[0];

      await api.createSubject({
        ...newSubject,
        branch: branch._id,
        college: college._id,
        course: course._id,
      });

      setSubjectCreated(true);
      setNewSubject({ name: '', code: '', semesterNumber: 3, credits: 4, description: '' });
      await loadData();
      setTimeout(() => setSubjectCreated(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setDeletingSubject(true);
    setFeedback(null);

    try {
      const res = await api.deleteSubject(subjectToDelete._id);
      setFeedback({
        type: 'success',
        text: res.message || `Subject "${subjectToDelete.name}" deleted successfully.`,
      });
      setSubjectToDelete(null);
      await loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to delete subject.',
      });
    } finally {
      setDeletingSubject(false);
    }
  };

  const filteredSubjects = (options?.subjects || []).filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.code?.toLowerCase().includes(term) ||
      s.slug?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Academic Hierarchy Architecture
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          College ➔ Course ➔ Branch ➔ Academic Year ➔ Semester ➔ Subject ➔ Module.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Existing Structure Tree (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Indexed Academic Subjects</span>
              {options?.subjects && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {filteredSubjects.length}
                </span>
              )}
            </h3>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code or name..."
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl p-3 text-xs font-medium flex items-center justify-between gap-2 shadow-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-900/60'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-200/60 dark:border-rose-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
              {filteredSubjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {searchTerm ? 'No subjects match your search.' : 'No subjects indexed yet.'}
                </div>
              ) : (
                filteredSubjects.map((s) => (
                  <div key={s._id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          {s.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {s.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Semester {s.semesterNumber} • Slug: /{s.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Active
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubjectToDelete(s)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-transparent text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all"
                        title={`Delete subject ${s.code}`}
                        aria-label={`Delete subject ${s.code}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add New Subject Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Curriculum Subject</h3>

            {subjectCreated && (
              <div className="rounded-xl bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Subject created successfully!
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Code</label>
                  <input
                    type="text"
                    required
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    placeholder="CSE402"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Semester</label>
                  <select
                    value={newSubject.semesterNumber}
                    onChange={(e) => setNewSubject({ ...newSubject, semesterNumber: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Brief course objectives..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingSubject}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                {creatingSubject ? 'Adding...' : 'Add Subject to Hierarchy'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-subject-modal-title"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="delete-subject-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Subject
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {subjectToDelete.code} - {subjectToDelete.name}
                  </span>
                  ?
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50/70 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 leading-relaxed">
              <strong>Warning:</strong> Deleting this subject will also delete all associated modules, study materials, bookmarks, and student requests for this subject. This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingSubject}
                onClick={() => setSubjectToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingSubject}
                onClick={handleDeleteSubject}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-all"
              >
                {deletingSubject ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Subject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
