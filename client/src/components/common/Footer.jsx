import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, FileText, AlertTriangle } from 'lucide-react';
import CampusVaultLogo from './CampusVaultLogo';
import CopyrightModal from '../resource/CopyrightModal';

export default function Footer() {
  const [copyrightModalOpen, setCopyrightModalOpen] = useState(false);

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="md:col-span-2">
            <CampusVaultLogo size="md" />
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Your College. Everything You Need. One Search. An open, legally-curated academic archive designed for
              effortless exam preparation, notes sharing, and peer discovery.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Legally shareable academic resources</span>
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Study Vault
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/search?materialType=Question+Paper" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Previous Year Papers (PYQs)
                </Link>
              </li>
              <li>
                <Link to="/search?materialType=Notes" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Module & Lecture Notes
                </Link>
              </li>
              <li>
                <Link to="/search?materialType=Question+Bank" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Question Banks & Solved Sets
                </Link>
              </li>
              <li>
                <Link to="/subjects/dbms/exam-mode" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Exam Mode (Frequency Analysis)
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Hub */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Student Hub
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/contribute" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Contribute Materials
                </Link>
              </li>
              <li>
                <Link to="/request" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Request Missing Paper
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-brand-600 dark:hover:text-brand-400">
                  My Saved Bookmarks
                </Link>
              </li>
              <li>
                <Link to="/progress" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Track Study Progress
                </Link>
              </li>
            </ul>
          </div>

          {/* Rights & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Content & Legal
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setCopyrightModalOpen(true)}
                  className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Report Copyright Concern
                </button>
              </li>
              <li className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal pt-1">
                CampusVault prohibits unauthorized distribution of proprietary commercial textbooks or paid course wares.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/80 pt-6 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} CampusVault. All educational trademarks belong to their respective institutions.</p>
          <p className="flex items-center gap-1">
            Engineered for students with modern academic technology
          </p>
        </div>
      </div>

      {/* Global Copyright Reporting Modal */}
      {copyrightModalOpen && (
        <CopyrightModal isOpen={copyrightModalOpen} onClose={() => setCopyrightModalOpen(false)} />
      )}
    </footer>
  );
}
