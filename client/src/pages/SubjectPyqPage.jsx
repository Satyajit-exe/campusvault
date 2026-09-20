import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Calendar, ArrowLeft, ArrowRight, Eye, Bookmark, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function SubjectPyqPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedExamType, setSelectedExamType] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPyqs() {
      try {
        setLoading(true);
        const res = await api.getSubjectPyqs(slug);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load PYQs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPyqs();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const { subject, yearsList, groupedByYear, totalPyqs } = data || {};

  const filteredYears =
    selectedYear === 'All' ? yearsList : yearsList.filter((y) => y.toString() === selectedYear);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          to={`/subjects/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {subject?.name || 'Subject'}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Previous Year Question Papers (PYQs)
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {subject?.name} ({subject?.code}) • {totalPyqs} Verified Exam Papers Grouped by Academic Year
            </p>
          </div>

          <Link
            to={`/subjects/${slug}/exam-mode`}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-rose-600 hover:to-amber-600 self-start sm:self-auto"
          >
            Launch Exam Mode 🔥
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="h-4 w-4 text-brand-500" />
          <span>Filter Papers:</span>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedYear('All')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedYear === 'All'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Years
          </button>
          {yearsList?.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr.toString())}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedYear === yr.toString()
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Exam Type Selector */}
        <div className="flex items-center gap-1 ml-auto">
          {['All', 'Mid-Sem', 'End-Sem', 'Internal'].map((et) => (
            <button
              key={et}
              type="button"
              onClick={() => setSelectedExamType(et)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedExamType === et
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {et === 'All' ? 'All Exams' : et}
            </button>
          ))}
        </div>
      </div>

      {/* Year-by-Year Timeline View */}
      <div className="space-y-8">
        {filteredYears?.map((year) => {
          const yearGroup = groupedByYear[year];
          let papersToShow = yearGroup.all;
          if (selectedExamType === 'Mid-Sem') papersToShow = yearGroup.midSem;
          else if (selectedExamType === 'End-Sem') papersToShow = yearGroup.endSem;
          else if (selectedExamType === 'Internal') papersToShow = yearGroup.internal;

          if (papersToShow.length === 0) return null;

          return (
            <div
              key={year}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold text-sm">
                  {year}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic Year {year}</h3>
                  <p className="text-xs text-slate-400">{papersToShow.length} Exam Paper(s) Available</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {papersToShow.map((paper) => (
                  <div
                    key={paper._id}
                    className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-brand-400 hover:bg-white hover:shadow-hover dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-brand-500/50 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {paper.examType}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {paper.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bookmark className="h-3 w-3" />
                          {paper.savesCount}
                        </span>
                      </div>
                    </div>

                    <h4 className="mt-2.5 text-sm font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors">
                      {paper.title}
                    </h4>

                    {paper.topicsCovered && paper.topicsCovered.length > 0 && (
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                        Topics: {paper.topicsCovered.join(', ')}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400">PDF • Authenticated</span>
                      <Link
                        to={`/resources/${paper.slug}/view`}
                        className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-1 dark:text-brand-400 transition-transform"
                      >
                        View Paper <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
