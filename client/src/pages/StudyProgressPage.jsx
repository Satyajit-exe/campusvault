import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Award, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function StudyProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const res = await api.getProgress();
        setData(res);
      } catch (err) {
        console.error('Failed to load study progress:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const subjectProgress = data?.subjectProgress || [];

  // Calculate overall semester completion
  const totalItems = subjectProgress.reduce((sum, sp) => sum + sp.totalResources, 0);
  const totalStudied = subjectProgress.reduce((sum, sp) => sum + sp.studiedCount, 0);
  const overallPercentage = totalItems > 0 ? Math.round((totalStudied / totalItems) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Semester Study Progress
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Track your completion of syllabus modules, question paper practice, and notes.
            </p>
          </div>

          {/* Overall Meter */}
          <div className="flex items-center gap-4 self-start sm:self-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Overall Completed
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{overallPercentage}%</span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Per Subject Progress Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Subjects Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjectProgress.map((sp) => (
            <div
              key={sp.subject._id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {sp.subject.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{sp.subject.name}</h3>
                </div>
                <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {sp.percentage}%
                </span>
              </div>

              {/* Graphical Progress Bar */}
              <div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-violetAccent-500 transition-all duration-700"
                    style={{ width: `${sp.percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {sp.studiedCount} of {sp.totalResources} materials studied
                  </span>
                  <span>{sp.inProgressCount} in progress</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                  to={`/subjects/${sp.subject.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Continue Subject <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
