import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Flame,
  Clock,
  BookOpen,
  FileText,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';

export default function ExamModePage() {
  const { subjectSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulated exam countdown (e.g. 14 days 6 hours)
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 8, minutes: 25, seconds: 40 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadExamMode() {
      try {
        setLoading(true);
        const res = await api.getExamMode(subjectSlug);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load exam mode');
      } finally {
        setLoading(false);
      }
    }
    loadExamMode();
  }, [subjectSlug]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h2 className="text-xl font-bold">Exam Mode Unavailable</h2>
        <p className="mt-2 text-xs text-slate-500">{error}</p>
        <Link
          to="/search"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Search
        </Link>
      </div>
    );
  }

  const { subject, meta, frequentTopics, pyqList, quickNotes } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Nav */}
      <div>
        <Link
          to={`/subjects/${subject.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {subject.name}
        </Link>

        {/* Exam Mode Header */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/30">
                <Flame className="h-4 w-4 text-rose-400 animate-pulse" />
                <span>EXAM MODE ACTIVATED</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
                {subject.name} ({subject.code})
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl">
                High-yield revision console with verified historical exam frequency analytics and fast revision notes.
              </p>
            </div>

            {/* Exam Countdown Widget */}
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md self-start lg:self-auto">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-300">
                Estimated Exam Countdown
              </span>
              <div className="mt-2 flex items-center gap-2 font-mono text-xl sm:text-2xl font-bold">
                <div className="text-center">
                  <span>{timeLeft.days}</span>
                  <span className="block text-[9px] font-sans text-slate-400 font-normal">DAYS</span>
                </div>
                <span>:</span>
                <div className="text-center">
                  <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="block text-[9px] font-sans text-slate-400 font-normal">HRS</span>
                </div>
                <span>:</span>
                <div className="text-center">
                  <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="block text-[9px] font-sans text-slate-400 font-normal">MIN</span>
                </div>
                <span>:</span>
                <div className="text-center text-rose-400">
                  <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="block text-[9px] font-sans text-slate-400 font-normal">SEC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strict Ethical Disclaimer Box */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-bold">Historical Frequency Data:</span> {meta.disclaimer}
        </div>
      </div>

      {/* Main Grid: Frequently Appearing Topics & Quick Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Frequently Appearing Topics Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  🔥 Frequently Appearing Exam Topics
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {meta.totalPapersIndexed} Papers Analyzed ({meta.yearRange})
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {frequentTopics.map((item, index) => (
                <div key={item.topic} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.topic}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Appeared across {item.yearsAppeared.join(', ')} ({item.examTypes.join(', ')})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.frequencyCount} of {meta.totalPapersIndexed} papers
                      </span>
                      <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-rose-500"
                          style={{ width: `${item.percentageOfPapers}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      to={`/search?q=${encodeURIComponent(item.topic)}`}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Study Topic →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous 5 Years Fast Access */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Previous 5 Years Question Papers
                </h3>
              </div>
              <Link to={`/subjects/${subject.slug}/pyqs`} className="text-xs font-bold text-brand-600 hover:underline">
                View full PYQ archive →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pyqList.slice(0, 4).map((paper) => (
                <div
                  key={paper._id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{paper.examType} {paper.examYear}</span>
                    <span className="text-slate-400">{paper.viewsCount} views</span>
                  </div>
                  <h5 className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {paper.title}
                  </h5>
                  <Link
                    to={`/resources/${paper.slug}/view`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Open in Viewer →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Notes & High-Yield Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Study Notes</h3>
            </div>

            <div className="mt-4 space-y-3">
              {quickNotes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-2xl border border-slate-100 p-3.5 hover:border-brand-300 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 transition-all"
                >
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {note.title}
                  </h5>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {note.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">{note.viewsCount} reads</span>
                    <Link
                      to={`/resources/${note.slug}/view`}
                      className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Read Note →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Mode Study Checklist */}
          <div className="rounded-3xl border border-brand-200/80 bg-brand-50/50 p-6 dark:border-brand-900/50 dark:bg-brand-950/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Exam Mode Tips
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Focus heavily on top 4 recurring topics during early revision.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Simulate timed question paper solving for Mid-Sem 2025.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Review BCNF & 3NF decomposition proofs in Module 3.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
