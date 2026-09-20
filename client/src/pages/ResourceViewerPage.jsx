import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import SecurePdfViewer from '../components/viewer/SecurePdfViewer';

export default function ResourceViewerPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadResource() {
      try {
        setLoading(true);
        setError(null);
        const detail = await api.getResourceById(slug);
        if (detail?.resource) {
          setResource(detail.resource);
        } else {
          setError('Resource not found');
        }
      } catch (err) {
        console.error('Failed to load viewer resource:', err);
        setError(err.message || 'Resource not found or unauthorized');
      } finally {
        setLoading(false);
      }
    }

    loadResource();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <span className="text-xs font-semibold text-slate-400">Opening CampusVault PDF Viewer...</span>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resource Unavailable</h2>
        <p className="mt-1 text-xs text-slate-500">{error}</p>
        <Link
          to="/search"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white"
        >
          Return to Explorer
        </Link>
      </div>
    );
  }

  return <SecurePdfViewer resource={resource} />;
}
