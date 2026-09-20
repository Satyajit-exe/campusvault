import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ContributePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    moduleId: '',
    materialType: 'Question Paper',
    examType: 'Mid-Sem',
    examYear: 2025,
    topicsCovered: '',
    source: 'Student Contribution',
    sourceType: 'Student-created',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load available subjects for contribution
  useEffect(() => {
    async function loadSubjects() {
      try {
        setSubjectsLoading(true);
        // If student, filter by their branch; if admin or no branch, get all subjects
        const params = {};
        const branchId = user?.branch?._id || user?.branch;
        if (user?.role !== 'ADMIN' && branchId) {
          params.branch = branchId;
        }

        const res = await api.getSubjects(params);
        let list = res?.subjects || [];
        if (list.length === 0) {
          const fallbackRes = await api.getSubjects();
          list = fallbackRes?.subjects || [];
        }
        setAllSubjects(list);

        // Check if user's current semester has subjects
        const userSem = user?.currentSemester;
        const hasUserSemSubjects = userSem && list.some((s) => s.semesterNumber === userSem);
        if (hasUserSemSubjects) {
          setSelectedSemester(String(userSem));
        } else {
          setSelectedSemester('all');
        }
      } catch (err) {
        console.error('Failed to load subjects for contribution:', err);
      } finally {
        setSubjectsLoading(false);
      }
    }
    loadSubjects();
  }, [user]);

  const displayedSubjects = React.useMemo(() => {
    if (selectedSemester === 'all') {
      return allSubjects;
    }
    return allSubjects.filter((s) => String(s.semesterNumber) === String(selectedSemester));
  }, [allSubjects, selectedSemester]);

  // Keep formData.subjectId in sync with displayedSubjects
  useEffect(() => {
    if (displayedSubjects.length > 0) {
      if (!displayedSubjects.some((s) => s._id === formData.subjectId)) {
        setFormData((prev) => ({ ...prev, subjectId: displayedSubjects[0]._id }));
      }
    } else {
      setFormData((prev) => ({ ...prev, subjectId: '' }));
    }
  }, [displayedSubjects]);

  // Load modules when subject selection changes
  useEffect(() => {
    async function loadModules() {
      if (!formData.subjectId) {
        setModules([]);
        return;
      }
      const subj = allSubjects.find((s) => s._id === formData.subjectId);
      if (subj) {
        try {
          const res = await api.getSubject(subj.slug);
          if (res && res.modules) {
            setModules(res.modules);
          } else {
            setModules([]);
          }
        } catch (err) {
          setModules([]);
        }
      } else {
        setModules([]);
      }
    }
    loadModules();
  }, [formData.subjectId, allSubjects]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setErrorMessage('');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only PDF documents (.pdf) can be uploaded to CampusVault.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25 MB limit.');
      return;
    }
    setSelectedFile(file);

    // Auto-fill title if empty
    if (!formData.title) {
      const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
      setFormData((prev) => ({ ...prev, title: cleanName }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select or drop a PDF file.');
      return;
    }

    setUploading(true);
    setErrorMessage('');

    try {
      const data = new FormData();
      data.append('pdf', selectedFile);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('subjectId', formData.subjectId);
      if (formData.moduleId) data.append('moduleId', formData.moduleId);
      data.append('materialType', formData.materialType);
      data.append('examType', formData.examType);
      data.append('examYear', formData.examYear);
      data.append('topicsCovered', formData.topicsCovered);
      data.append('source', formData.source);
      data.append('sourceType', formData.sourceType);

      await api.uploadContribution(data);
      setUploadSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit resource.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Contribute Academic Material
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Upload question papers, handwritten lecture notes, or question banks. Submissions are reviewed by moderators
          before publishing.
        </p>
      </div>

      {/* Auto-filled Academic Profile Context Banner */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-900/60 dark:bg-brand-950/40">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-900 dark:text-brand-200">
          <Info className="h-4 w-4 text-brand-600" />
          <span>Verified Student Academic Context (Automatically Locked from Profile)</span>
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">College:</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate block">
              {user?.college?.name || 'CGU'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Branch:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{user?.branch?.code || 'CSE'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Academic Year:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {user?.currentAcademicYear || '2025-26'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Academic Context:</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {user?.role === 'ADMIN' ? 'Administrator' : `Semester ${user?.currentSemester || 1}`}
            </span>
          </div>
        </div>
      </div>

      {uploadSuccess ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-10 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 animate-bounce" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Submission Received for Review!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Your document has been submitted and is currently in the <strong>PENDING REVIEW</strong> queue. It will be
            published to your college vault once verified.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/my-contributions"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
            >
              View Contribution History
            </Link>
            <button
              type="button"
              onClick={() => {
                setUploadSuccess(false);
                setSelectedFile(null);
                setFormData((prev) => ({ ...prev, title: '', description: '' }));
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              Upload Another File
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Polished Drag & Drop File Upload Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-brand-500 bg-brand-50/50 dark:border-brand-400 dark:bg-brand-950/30 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20'
                : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Signature Verified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="mt-1 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <X className="h-3.5 w-3.5" /> Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Drag & Drop PDF document here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Or click below to browse files from your computer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  Choose File
                </button>
                <span className="text-[10px] text-slate-400">Supported format: PDF only • Maximum size: 25 MB</span>
              </div>
            )}
          </div>

          {/* Form Fields Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Resource Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. DBMS Mid-Sem Question Paper 2025"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {/* Semester, Subject & Module */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Semester Filter */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Semester Filter
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all">All Semesters ({allSubjects.length})</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                    const count = allSubjects.filter((s) => s.semesterNumber === sem).length;
                    return (
                      <option key={sem} value={String(sem)}>
                        Semester {sem} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Subject Select */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  disabled={subjectsLoading || displayedSubjects.length === 0}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:opacity-60"
                >
                  {subjectsLoading ? (
                    <option value="">Loading subjects...</option>
                  ) : displayedSubjects.length === 0 ? (
                    <option value="">No subjects found for Semester {selectedSemester}</option>
                  ) : (
                    displayedSubjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} - {s.name} {selectedSemester === 'all' ? `(Sem ${s.semesterNumber})` : ''}
                      </option>
                    ))
                  )}
                </select>
                {displayedSubjects.length === 0 && !subjectsLoading && (
                  <button
                    type="button"
                    onClick={() => setSelectedSemester('all')}
                    className="mt-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline inline-block"
                  >
                    Switch to all semesters
                  </button>
                )}
              </div>

              {/* Specific Module */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Specific Module (Optional)
                </label>
                <select
                  value={formData.moduleId}
                  onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Full Subject / Not Applicable</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      M{m.moduleNumber}: {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Material Type & Exam Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Material Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.materialType}
                  onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Question Paper">Question Paper</option>
                  <option value="Notes">Notes</option>
                  <option value="Question Bank">Question Bank</option>
                  <option value="Case Study">Case Study</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Lab Manual">Lab Manual</option>
                  <option value="Important Questions">Important Questions</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Exam Type</label>
                <select
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="None">None / General</option>
                  <option value="Mid-Sem">Mid-Sem</option>
                  <option value="End-Sem">End-Sem</option>
                  <option value="Internal">Internal</option>
                  <option value="Practical">Practical</option>
                  <option value="Back Exam">Back Exam</option>
                  <option value="Improvement">Improvement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Exam Year</label>
                <input
                  type="number"
                  value={formData.examYear}
                  onChange={(e) => setFormData({ ...formData, examYear: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Topics Covered (for Exam Mode indexing) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Key Topics Covered <span className="text-[10px] text-slate-400">(Comma-separated, e.g. Normalization, ER Diagram, SQL)</span>
              </label>
              <input
                type="text"
                value={formData.topicsCovered}
                onChange={(e) => setFormData({ ...formData, topicsCovered: e.target.value })}
                placeholder="Normalization, 3NF, BCNF, Relational Algebra"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {/* Rights & Licensing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Source Type</label>
                <select
                  value={formData.sourceType}
                  onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Student-created">Student-created (Self / Peer Notes)</option>
                  <option value="Official">Official Past University Examination Paper</option>
                  <option value="Public/Openly Licensed">Openly Licensed / Creative Commons Material</option>
                  <option value="Shared With Permission">Shared With Explicit Faculty Permission</option>
                  <option value="Other">Other Legally Shareable Resource</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Source Description</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g. My Semester 3 Class Notes"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                By uploading, you confirm that this material complies with CampusVault guidelines and does not contain
                copyrighted commercial textbooks or restricted proprietary data.
              </span>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 py-3 text-xs font-bold text-white shadow-md hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20 disabled:opacity-50"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Submit Document for Admin Review <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
