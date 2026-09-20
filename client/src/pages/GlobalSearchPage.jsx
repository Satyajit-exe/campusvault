import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Layers,
  FileText,
  BookOpen,
  HelpCircle,
  Briefcase,
  X,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import ResourceCard from '../components/resource/ResourceCard';
import { api } from '../services/api';

export default function GlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialMaterialType = searchParams.get('materialType') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'questionPapers' | 'notes' | 'importantQuestions' | 'caseStudies'

  // Advanced Filters State
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState(initialMaterialType);
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Load filter metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await api.getFilterOptions();
        if (res.data) setFilterOptions(res.data);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadMeta();
  }, []);

  // Perform search
  const executeSearch = async () => {
    setLoading(true);
    try {
      const params = {
        q: query,
        semester: selectedSemester,
        subject: selectedSubject,
        materialType: selectedMaterialType,
        examType: selectedExamType,
        year: selectedYear,
      };

      const res = await api.search(params);
      if (res.data) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [selectedSemester, selectedSubject, selectedMaterialType, selectedExamType, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
    executeSearch();
  };

  const clearFilters = () => {
    setSelectedSemester('');
    setSelectedSubject('');
    setSelectedMaterialType('');
    setSelectedExamType('');
    setSelectedYear('');
    setQuery('');
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedSemester || selectedSubject || selectedMaterialType || selectedExamType || selectedYear;

  const grouped = searchResults?.grouped || {
    questionPapers: [],
    notes: [],
    importantQuestions: [],
    caseStudies: [],
    other: [],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Search Bar with live filter toggle */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across subjects, topics, PYQs, years (e.g. 'DBMS 2025', 'Normalization', 'CN')..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none rounded-2xl bg-gradient-to-r from-brand-600 to-violetAccent-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                hasActiveFilters
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>
          </div>
        </form>

        {/* Filter Drawer / Bar */}
        {filterDrawerOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Subject filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
              >
                <option value="">All Subjects</option>
                {filterOptions?.subjects?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Type filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Material Type</label>
              <select
                value={selectedMaterialType}
                onChange={(e) => setSelectedMaterialType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
              >
                <option value="">All Types</option>
                {filterOptions?.materialTypes?.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Type filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Exam Type</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
              >
                <option value="">All Exams</option>
                {filterOptions?.examTypes?.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>

            {/* Year filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Exam Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
              >
                <option value="">All Years</option>
                {filterOptions?.years?.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div className="col-span-2 sm:col-span-3 lg:col-span-5 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:underline dark:text-rose-400 font-semibold"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs navigation for grouped search results */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Results ({searchResults?.totalCount || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questionPapers')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'questionPapers'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Question Papers ({grouped.questionPapers?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'notes'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Notes ({grouped.notes?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('importantQuestions')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'importantQuestions'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Important Questions ({grouped.importantQuestions?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('caseStudies')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'caseStudies'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>Case Studies ({grouped.caseStudies?.length || 0})</span>
        </button>
      </div>

      {/* Search Results Display */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <span className="text-xs font-semibold text-slate-500">Searching indexed repository...</span>
          </div>
        </div>
      ) : searchResults?.totalCount === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <Search className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No materials matched your query</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Try adjusting your search terms or remove specific filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Group: Question Papers */}
          {(activeTab === 'all' || activeTab === 'questionPapers') && grouped.questionPapers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  QUESTION PAPERS & SOLVED SETS ({grouped.questionPapers.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {grouped.questionPapers.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}

          {/* Group: Notes */}
          {(activeTab === 'all' || activeTab === 'notes') && grouped.notes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  CURATED NOTES & MODULE MATERIAL ({grouped.notes.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {grouped.notes.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}

          {/* Group: Important Questions */}
          {(activeTab === 'all' || activeTab === 'importantQuestions') && grouped.importantQuestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  IMPORTANT QUESTIONS & VIVA ({grouped.importantQuestions.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {grouped.importantQuestions.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}

          {/* Group: Case Studies */}
          {(activeTab === 'all' || activeTab === 'caseStudies') && grouped.caseStudies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-cyan-500" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  CASE STUDIES & LABS ({grouped.caseStudies.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {grouped.caseStudies.map((r) => (
                  <ResourceCard key={r._id} resource={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
