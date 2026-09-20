import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function CopyrightModal({ isOpen, onClose, resourceId = null, resourceTitle = '' }) {
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [concernType, setConcernType] = useState('Copyright Infringement');
  const [details, setDetails] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.reportCopyright({
        resourceId: resourceId || '6aabfd58d4cdba910fd6f5cc', // fallback or attached resource
        reporterName,
        reporterEmail,
        concernType,
        details: resourceTitle ? `Regarding: "${resourceTitle}".\n\n${details}` : details,
        evidenceUrl,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to file copyright report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Report Content or Copyright Concern</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">CampusVault takes intellectual property rights seriously.</p>
          </div>
        </div>

        {resourceTitle && (
          <div className="mt-4 rounded-lg bg-slate-100 p-2.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Target Resource:</span> {resourceTitle}
          </div>
        )}

        {success ? (
          <div className="mt-6 flex flex-col items-center py-6 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 animate-bounce" />
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Report Received</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Our legal and moderation committee will investigate this item immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Prof. Arvind Rao"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Official / Contact Email</label>
                <input
                  type="email"
                  required
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Nature of Concern</label>
              <select
                value={concernType}
                onChange={(e) => setConcernType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="Copyright Infringement">Copyright Infringement (Author/Publisher Rights)</option>
                <option value="Paid Textbook / Course Content">Paid Commercial Textbook or Courseware</option>
                <option value="Restricted Faculty Document">Restricted Internal Institutional Exam/Paper</option>
                <option value="Private Student Notes Without Consent">Private Notes Uploaded Without Consent</option>
                <option value="Incorrect / Inaccurate Material">Factually Inaccurate or Mislabeled Academic Material</option>
                <option value="Other">Other Policy Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Details & Rationale <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the claim, ownership context, or pages in question..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Evidence / Reference URL (Optional)
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting Report...' : 'Submit Takedown Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
