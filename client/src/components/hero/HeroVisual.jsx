import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, ArrowRight, BookOpen, Sparkles, CheckCircle2, Shield, Layers } from 'lucide-react';

export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Background Glows */}
      <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl filter pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-violetAccent-500/20 blur-3xl filter pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyanAccent-500/10 blur-3xl filter pointer-events-none" />

      {/* Main SaaS Dashboard Container */}
      <div className="relative rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        {/* Top Header Mock */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
              CampusVault Discovery Console
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        {/* Floating Resource Cards Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: PYQ Paper */}
          <div className="group relative rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-400 hover:shadow-hover dark:border-indigo-950/50 dark:from-indigo-950/20 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                Question Paper
              </span>
              <span className="text-[10px] font-semibold text-slate-400">2025</span>
            </div>

            <h4 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">
              DBMS Mid-Sem 2025
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Database Management Systems • CSE
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400 dark:border-slate-800">
              <span className="flex items-center gap-1 text-[11px]">
                <Eye className="h-3 w-3 text-slate-400" />
                1.2K views
              </span>
              <Link
                to="/subjects/dbms"
                className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-0.5 dark:text-brand-400 transition-transform"
              >
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Module Notes */}
          <div className="group relative rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-400 hover:shadow-hover dark:border-violet-950/50 dark:from-violet-950/20 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-violetAccent-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violetAccent-600 dark:bg-violetAccent-500/20 dark:text-violetAccent-400">
                Notes
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Solved
              </span>
            </div>

            <h4 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">
              Module 3: Normalization
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              DBMS • 1NF to BCNF with 15 Solved Qs
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400 dark:border-slate-800">
              <span className="flex items-center gap-1 text-[11px]">
                <BookOpen className="h-3 w-3 text-slate-400" />
                12 sub-topics
              </span>
              <Link
                to="/subjects/dbms"
                className="flex items-center gap-1 text-xs font-bold text-violetAccent-600 group-hover:translate-x-0.5 dark:text-violetAccent-400 transition-transform"
              >
                Open <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Exam Mode Frequency Pill */}
          <div className="sm:col-span-2 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50/40 via-white to-brand-50/40 p-4 shadow-sm dark:border-cyan-950/50 dark:from-cyan-950/20 dark:via-slate-900 dark:to-brand-950/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-brand-500 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Exam Mode Frequency Engine
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    "Normalization appeared in 4 out of 5 previous exam papers"
                  </p>
                </div>
              </div>
              <Link
                to="/subjects/dbms/exam-mode"
                className="rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-brand-600 shadow-sm hover:bg-brand-50 dark:bg-slate-800 dark:text-brand-300 transition-colors"
              >
                Launch Exam Mode →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
            Zero download barrier
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            Legally verified
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-violetAccent-500" />
            3-click access
          </span>
        </div>
      </div>
    </div>
  );
}
