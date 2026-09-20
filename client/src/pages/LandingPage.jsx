import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  UploadCloud,
  FileQuestion,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  Layers,
  UserPlus,
} from 'lucide-react';
import HeroVisual from '../components/hero/HeroVisual';
import ResourceCard from '../components/resource/ResourceCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingResources, setTrendingResources] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [popularSubjects, setPopularSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        const [trendingRes, subjectsRes] = await Promise.all([
          api.getTrending(),
          api.getSubjects(),
        ]);

        if (trendingRes.data) {
          setTrendingResources(trendingRes.data.trending || []);
          setRecentResources(trendingRes.data.recentlyAdded || []);
        }
        if (subjectsRes.subjects) {
          setPopularSubjects(subjectsRes.subjects.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (!user) {
        navigate('/login', {
          state: { from: { pathname: '/search', search: `?q=${encodeURIComponent(searchQuery.trim())}` } },
        });
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const popularSearchTags = [
    { label: 'DBMS Mid-Sem', query: 'DBMS Mid-Sem' },
    { label: 'Computer Networks', query: 'Computer Networks' },
    { label: 'Operating Systems', query: 'Operating Systems' },
    { label: 'Normalization', query: 'Normalization' },
    { label: 'Discrete Mathematics', query: 'Discrete Mathematics' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3.5 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>The Modern College Study Vault</span>
              </div>

              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white leading-[1.15]">
                Your College.{' '}
                <span className="bg-gradient-to-r from-brand-600 via-violetAccent-500 to-cyanAccent-500 bg-clip-text text-transparent">
                  Everything You Need.
                </span>{' '}
                One Search. 📚
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal">
                Previous papers, notes, question banks, case studies and study materials — legally curated and
                organized into your college's exact semester tree.
              </p>

              {/* Large Search Box */}
              <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl mx-auto lg:mx-0">
                <div className="relative flex items-center shadow-lg rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                  <Search className="ml-3 h-5 w-5 text-brand-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search "DBMS Mid-Sem 2025", "Normalization", "CN PYQ"...'
                    className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Popular Searches */}
              <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Popular:</span>
                {popularSearchTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!user) {
                        navigate('/login', {
                          state: { from: { pathname: '/search', search: `?q=${encodeURIComponent(tag.query)}` } },
                        });
                      } else {
                        navigate(`/search?q=${encodeURIComponent(tag.query)}`);
                      }
                    }}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950/60 dark:hover:text-brand-400 transition-colors"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Hero Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 px-6 py-3 text-sm font-bold text-white shadow-md hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20"
                    >
                      <UserPlus className="h-4 w-4" />
                      Register as Student
                    </Link>

                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 px-6 py-3 text-sm font-bold text-white shadow-md hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20"
                  >
                    <BookOpen className="h-4 w-4" />
                    Go to My Student Dashboard
                  </Link>
                )}
              </div>
            </div>

            {/* Right Hero Visual */}
            <div className="lg:col-span-5">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="border-y border-slate-200/80 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              The 3-Click Guarantee
            </h2>
            <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              How CampusVault Works
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              No dead Google Drive links, no noisy WhatsApp chat spam. Pure academic discovery.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold text-lg">
                1
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">One Global Search</h4>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Type any subject, exam year, or topic like "Normalization 2025" and get instantly grouped, verified papers.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violetAccent-500/10 text-violetAccent-600 dark:text-violetAccent-400 font-extrabold text-lg">
                2
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Secure In-App Viewer</h4>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Study directly in the clean, ad-light viewer with page jumps, zoom, fullscreen, and zero download hassle.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyanAccent-500/10 text-cyanAccent-600 dark:text-cyanAccent-400 font-extrabold text-lg">
                3
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Exam Frequency Engine</h4>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                See exactly which topics frequently recur across past 5 years of university examinations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Subjects */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Core Curriculum
              </h2>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Popular Subjects & PYQs
              </h3>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Browse all subjects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularSubjects.map((subject) => (
              <div
                key={subject._id}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-brand-300 hover:shadow-hover dark:border-slate-800 dark:bg-slate-900 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono">
                    {subject.code}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Semester {subject.semesterNumber}</span>
                </div>

                <h4 className="mt-3 text-base font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors">
                  <Link to={`/subjects/${subject.slug}`}>{subject.name}</Link>
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {subject.description || 'Comprehensive curriculum notes, PYQs, and question banks.'}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <Link
                    to={`/subjects/${subject.slug}/pyqs`}
                    className="font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
                  >
                    View PYQs →
                  </Link>
                  <Link
                    to={`/subjects/${subject.slug}/exam-mode`}
                    className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Exam Mode 🔥
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Today Section */}
      <section className="border-t border-slate-200/80 bg-slate-50/50 py-16 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              High Demand Right Now
            </h2>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-8">
            🔥 Trending Materials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingResources.slice(0, 3).map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        </div>
      </section>

      {/* Student Contribution & Request Material Banner */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Contribute Banner */}
            <div className="rounded-3xl border border-brand-200/80 bg-gradient-to-br from-brand-50/60 to-white p-8 dark:border-brand-900/40 dark:from-brand-950/30 dark:to-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                  Contribute Academic Material
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Have handwritten lecture notes, past exam question papers, or solved question banks? Help your
                  batchmates by contributing legally shareable academic PDFs.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/contribute"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
                >
                  Upload Material <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Request Banner */}
            <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 to-white p-8 dark:border-violet-900/40 dark:from-violet-950/30 dark:to-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violetAccent-600 text-white shadow-md">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                  Missing a Question Paper or Notes?
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Can't find a specific Mid-Sem or End-Sem question paper? Post a request to notify our contributor
                  network and academic moderators.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/request"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all"
                >
                  Request Material <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
