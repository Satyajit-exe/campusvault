import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Folder, ArrowRight, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import ResourceCard from '../components/resource/ResourceCard';

export default function SavedMaterialsPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const res = await api.getBookmarks();
      if (res.bookmarks) {
        setBookmarks(res.bookmarks);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleBookmarkToggle = (resourceId, isBookmarked) => {
    if (!isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.resource?._id !== resourceId));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-brand-500 fill-brand-500" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              My Saved Materials
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Quickly jump back into bookmarked question papers, formulas, and lecture notes.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          {bookmarks.length} Saved
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <Bookmark className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">No saved materials yet</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Click the bookmark icon on any question paper or note card to save it for offline revision.
          </p>
          <Link
            to="/search"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Explore Materials
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bm) => (
            <ResourceCard
              key={bm._id}
              resource={bm.resource}
              initialBookmarked={true}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
