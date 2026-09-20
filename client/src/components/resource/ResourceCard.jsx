import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Eye,
  Bookmark,
  Share2,
  CheckCircle2,
  Calendar,
  Layers,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CopyrightModal from './CopyrightModal';

export default function ResourceCard({
  resource,
  initialBookmarked = false,
  onBookmarkToggle = null,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [savesCount, setSavesCount] = useState(resource.savesCount || 0);
  const [copied, setCopied] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'PDF';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    setBookmarkLoading(true);
    try {
      const res = await api.toggleBookmark(resource._id);
      setBookmarked(res.isBookmarked);
      setSavesCount((prev) => (res.isBookmarked ? prev + 1 : Math.max(0, prev - 1)));
      if (onBookmarkToggle) onBookmarkToggle(resource._id, res.isBookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/resources/${resource.slug}/view`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'Question Paper':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      case 'Notes':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'Question Bank':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'Case Study':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800';
      case 'Important Questions':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-hover dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50">
        <div>
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-tight ${getBadgeColor(
                resource.materialType
              )}`}
            >
              {resource.materialType}
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              {resource.examYear && (
                <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                  <Calendar className="h-3 w-3" />
                  {resource.examYear}
                </span>
              )}
              {resource.examType && resource.examType !== 'None' && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {resource.examType}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-3 text-base font-bold leading-snug text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors">
            <Link to={`/resources/${resource.slug}/view`}>{resource.title}</Link>
          </h3>

          {/* Subject & Semester Breadcrumbs */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {resource.subject && (
              <Link
                to={`/subjects/${resource.subject.slug}`}
                className="font-medium text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 hover:underline"
              >
                {resource.subject.name}
              </Link>
            )}
            <span>•</span>
            <span>
              {resource.branch?.code || 'CSE'} • Sem {resource.semesterNumber || '3'}
            </span>
          </div>

          {/* Topics Covered Chips */}
          {resource.topicsCovered && resource.topicsCovered.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {resource.topicsCovered.slice(0, 3).map((topic, i) => (
                <span
                  key={i}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                >
                  #{topic}
                </span>
              ))}
              {resource.topicsCovered.length > 3 && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 self-center">
                  +{resource.topicsCovered.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer info & CTA */}
        <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
          {/* Stats Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" title="Views">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span>{resource.viewsCount?.toLocaleString() || 0}</span>
              </span>
              <span className="flex items-center gap-1" title="Saves">
                <Bookmark className="h-3.5 w-3.5 text-brand-500" />
                <span>{savesCount.toLocaleString()}</span>
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              PDF • {formatFileSize(resource.fileSize)}
            </span>
          </div>

          {/* Action Buttons: View PDF & Save (NO Download Button as mandated) */}
          <div className="flex items-center gap-2">
            <Link
              to={`/resources/${resource.slug}/view`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 py-2 text-xs font-semibold text-white shadow-sm hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/10"
            >
              <FileText className="h-3.5 w-3.5" />
              View PDF
            </Link>

            <button
              type="button"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              title={bookmarked ? 'Saved to bookmarks' : 'Save to bookmarks'}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                bookmarked
                  ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-400'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="Copy CampusVault link"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {reportModalOpen && (
        <CopyrightModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          resourceId={resource._id}
          resourceTitle={resource.title}
        />
      )}
    </>
  );
}
