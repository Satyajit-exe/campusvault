import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Briefcase,
  FlaskConical,
  Flame,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import ResourceCard from '../components/resource/ResourceCard';
import { api } from '../services/api';

export default function SubjectPage() {
  const { slug } = useParams();
  const [subjectData, setSubjectData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pyqs' | 'notes' | 'questionBanks' | 'caseStudies' | 'assignments' | 'labManuals'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSubject() {
      try {
        setLoading(true);
        const res = await api.getSubject(slug);
        if (res.success) {
          setSubjectData(res);
        }
      } catch (err) {
        setError(err.message || 'Subject not found');
      } finally {
        setLoading(false);
      }
    }
    loadSubject();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !subjectData) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subject Not Found</h2>
        <p className="mt-2 text-xs text-slate-500">{error}</p>
        <Link
          to="/search"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Back to Explorer
        </Link>
      </div>
    );
  }

  const { subject, modules, categories, sections } = subjectData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers, count: categories.all.length },
    { id: 'pyqs', label: 'PYQs', icon: FileText, count: categories.pyqs.length },
    { id: 'notes', label: 'Notes', icon: BookOpen, count: categories.notes.length },
    { id: 'questionBanks', label: 'Question Bank', icon: HelpCircle, count: categories.questionBanks.length },
    { id: 'caseStudies', label: 'Case Studies', icon: Briefcase, count: categories.caseStudies.length },
    { id: 'assignments', label: 'Assignments', icon: FileText, count: categories.assignments.length },
    { id: 'labManuals', label: 'Lab Manuals', icon: FlaskConical, count: categories.labManuals.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Subject Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-violetAccent-500 text-white text-2xl font-bold shadow-lg shadow-brand-500/20">
              📚
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono">
                  {subject.code}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {subject.branch?.code} • Semester {subject.semesterNumber}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  • {subject.credits} Credits
                </span>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {subject.name}
              </h1>

              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                {subject.description}
              </p>
            </div>
          </div>

          {/* Quick CTA: Exam Mode Launch Button */}
          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3">
            <Link
              to={`/subjects/${subject.slug}/exam-mode`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-3 text-xs font-bold text-white shadow-md hover:from-rose-600 hover:to-amber-600 transition-all shadow-rose-500/20"
            >
              <Flame className="h-4 w-4" />
              <span>Exam Mode (Frequent Topics)</span>
            </Link>

            <Link
              to={`/subjects/${subject.slug}/pyqs`}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-all"
            >
              <FileText className="h-4 w-4 text-brand-500" />
              <span>Dedicated PYQ Explorer</span>
            </Link>
          </div>
        </div>

        {/* Modules Chips */}
        {modules.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Syllabus Modules:
            </h4>
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <div
                  key={m._id}
                  className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  <span className="font-bold text-brand-600 dark:text-brand-400 mr-1">M{m.moduleNumber}:</span>
                  <span>{m.title.replace(/^Module \d+:\s*/i, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isSelected ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <div className="space-y-10">
          {/* Section: Most Useful */}
          {sections.mostUseful.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  🔥 Most Useful Materials
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sections.mostUseful.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Previous Year Questions */}
          {categories.pyqs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                    📝 Previous Year Questions (PYQs)
                  </h3>
                </div>
                <Link
                  to={`/subjects/${subject.slug}/pyqs`}
                  className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
                >
                  View all PYQs by year →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.pyqs.slice(0, 3).map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Curated Notes */}
          {categories.notes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  📚 Curated Module Notes
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.notes.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Important Questions & Viva */}
          {categories.importantQuestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  🎯 Important Questions & Solved Problems
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.importantQuestions.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}

          {/* Section: Case Studies */}
          {categories.caseStudies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-cyan-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  🧩 Real-World Case Studies
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.caseStudies.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Specific Tab Category View */
        <div>
          {categories[activeTab]?.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-sm font-semibold">No materials published in this category yet.</p>
              <Link
                to="/contribute"
                className="mt-3 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
              >
                Be the first to contribute
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories[activeTab]?.map((r) => (
                <ResourceCard key={r._id} resource={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
