import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  TrendingUp,
  Clock,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  Bookmark,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ResourceCard from '../components/resource/ResourceCard';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [trendingResources, setTrendingResources] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [studyProgress, setStudyProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [subjectsRes, trendingRes, progressRes] = await Promise.all([
          api.getSubjects({
            branch: user?.branch?._id || user?.branch,
            semester: user?.currentSemester || 3,
          }),
          api.getTrending(),
          api.getProgress().catch(() => ({ subjectProgress: [] })),
        ]);

        if (subjectsRes.subjects && subjectsRes.subjects.length > 0) {
          setSemesterSubjects(subjectsRes.subjects);
        } else {
          // Fallback to all branch subjects if current semester has none indexed yet
          const fallbackRes = await api.getSubjects({
            branch: user?.branch?._id || user?.branch,
          });
          if (fallbackRes?.subjects && fallbackRes.subjects.length > 0) {
            setSemesterSubjects(fallbackRes.subjects);
          } else {
            const allRes = await api.getSubjects();
            setSemesterSubjects(allRes?.subjects || []);
          }
        }
        if (trendingRes.data) {
          setTrendingResources(trendingRes.data.trending || []);
          setRecentResources(trendingRes.data.recentlyAdded || []);
        }
        if (progressRes) {
          setStudyProgress(progressRes);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const studentFirstName = user?.fullName?.split(' ')[0] || 'Student';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Greeting */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>{user?.college?.name || 'C.V. Raman Global University'}</span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            {getGreeting()}, {studentFirstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Ready to study? Your semester materials are indexed and updated for your upcoming exams.
          </p>

          {/* Quick Search inside banner */}
          <form onSubmit={handleSearch} className="mt-6 flex max-w-lg items-center rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20">
            <Search className="ml-3 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything in your semester..."
              className="w-full bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-slate-300 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* Floating background ornament */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Your Semester Subjects Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">YOUR SEMESTER</h2>
              <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {user?.branch?.code || 'CSE'} • Semester {user?.currentSemester || 3}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Academic Year: {user?.currentAcademicYear || '2025-26'}
            </p>
          </div>

          <Link
            to="/contribute"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-brand-700 hover:to-violetAccent-600 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Contribute Material</span>
          </Link>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {semesterSubjects.map((subject) => (
            <div
              key={subject._id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-400 hover:shadow-hover dark:border-slate-800 dark:bg-slate-900 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-mono">
                    {subject.code}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{subject.credits} Credits</span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors">
                  <Link to={`/subjects/${subject.slug}`}>{subject.name}</Link>
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {subject.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <Link
                  to={`/subjects/${subject.slug}/pyqs`}
                  className="font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
                >
                  PYQs →
                </Link>
                <Link
                  to={`/subjects/${subject.slug}/exam-mode`}
                  className="font-bold text-brand-600 hover:underline dark:text-brand-400 flex items-center gap-1"
                >
                  <Flame className="h-3.5 w-3.5 text-rose-500" />
                  Exam Mode
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Continue Studying / Study Progress Shortcut */}
      {studyProgress && studyProgress.subjectProgress?.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-brand-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">CONTINUE STUDYING</h3>
            </div>
            <Link to="/progress" className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400">
              View All Progress →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {studyProgress.subjectProgress.map((sp) => (
              <div key={sp.subject._id} className="rounded-xl border border-slate-100 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="truncate max-w-[120px]">{sp.subject.code}</span>
                  <span className="text-brand-600 dark:text-brand-400">{sp.percentage}%</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violetAccent-500 transition-all duration-500"
                    style={{ width: `${sp.percentage}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {sp.studiedCount} of {sp.totalResources} materials studied
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Today & Recently Added 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trending Today */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-rose-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">TRENDING TODAY</h3>
            </div>
            <Link to="/search" className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400">
              View more
            </Link>
          </div>

          <div className="space-y-3">
            {trendingResources.slice(0, 3).map((res) => (
              <ResourceCard key={res._id} resource={res} />
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">RECENTLY ADDED</h3>
            </div>
            <Link to="/search" className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {recentResources.slice(0, 3).map((res) => (
              <ResourceCard key={res._id} resource={res} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
