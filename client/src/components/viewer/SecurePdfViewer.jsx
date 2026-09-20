import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Bookmark,
  CheckCircle,
  Share2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  Check,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CopyrightModal from '../resource/CopyrightModal';

// Set up PDF.js local worker via Vite URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function SecurePdfViewer({ resource }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const blobUrlRef = useRef(null);

  const DEFAULT_SCALE = 0.8; // 80% default zoom

  const getAutoFitScale = (unscaledWidth) => {
    if (!unscaledWidth) return DEFAULT_SCALE;
    const screenWidth = containerRef.current?.clientWidth || window.innerWidth || 390;
    // Mobile (<640px) uses minimal padding (16px total) so PDF fills phone screen width
    const padding = screenWidth < 640 ? 16 : 48;
    const availableWidth = Math.max(screenWidth - padding, 260);
    const fitScale = Number((availableWidth / unscaledWidth).toFixed(2));
    return screenWidth < 640 ? Math.min(fitScale, DEFAULT_SCALE) : DEFAULT_SCALE;
  };

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [studiedStatus, setStudiedStatus] = useState('Not Started');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [viewerMode, setViewerMode] = useState('canvas'); // 'canvas' | 'embedded'

  // Load PDF stream from authenticated backend endpoint
  useEffect(() => {
    let active = true;

    async function loadPdf() {
      try {
        setLoading(true);
        setLoadError(null);

        const token = localStorage.getItem('cv_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch controlled PDF stream binary data
        const identifier = resource._id || resource.slug;
        const streamUrl = `/api/resources/${identifier}/stream`;
        const response = await fetch(streamUrl, {
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to load document stream (${response.status}: ${response.statusText})`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Create ephemeral blob URL for embedded viewing/fallback
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = blobUrl;

        if (active) {
          setPdfBlobUrl(blobUrl);
        }

        // Attempt PDF.js canvas initialization
        try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const doc = await loadingTask.promise;

          if (active) {
            setPdfDoc(doc);
            setTotalPages(doc.numPages);
            setLoading(false);
          }
        } catch (canvasErr) {
          console.warn('PDF.js canvas init failed, falling back to embedded reader mode:', canvasErr);
          if (active) {
            setViewerMode('embedded');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('PDF loading error:', err);
        if (active) {
          setLoadError(err.message || 'Unable to render PDF document');
          setLoading(false);
        }
      }
    }

    if (resource?._id || resource?.slug) {
      loadPdf();
    }

    return () => {
      active = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [resource?._id, resource?.slug]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || viewerMode !== 'canvas') return;

    let renderTask = null;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : null;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, viewerMode]);

  // Apply 80% default zoom (or responsive fit for narrow phone screens)
  useEffect(() => {
    if (!pdfDoc) return;
    let active = true;

    async function applyDefaultScale() {
      try {
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
          const page = await pdfDoc.getPage(currentPage || 1);
          if (!active) return;
          const unscaledViewport = page.getViewport({ scale: 1.0 });
          const fitScale = getAutoFitScale(unscaledViewport.width);
          setScale(fitScale);
        } else {
          setScale(DEFAULT_SCALE);
        }
      } catch (err) {
        setScale(DEFAULT_SCALE);
      }
    }

    applyDefaultScale();

    return () => {
      active = false;
    };
  }, [pdfDoc]);

  // Check initial bookmark & study progress
  useEffect(() => {
    if (user && resource?._id) {
      api.checkBookmark(resource._id).then((res) => {
        setIsBookmarked(res.isBookmarked);
      });
      api.getProgressStatus(resource._id).then((res) => {
        setStudiedStatus(res.status);
      });
    }
  }, [user, resource?._id]);

  // Prevent default context menu to deter casual saving
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleZoomIn = () => setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.35));
  const handleResetZoom = () => setScale(DEFAULT_SCALE);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.toggleBookmark(resource._id);
      setIsBookmarked(res.isBookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsStudied = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const newStatus = studiedStatus === 'Studied' ? 'In Progress' : 'Studied';
    try {
      await api.updateProgress({
        resourceId: resource._id,
        status: newStatus,
        lastViewedPage: currentPage,
        completionPercentage: newStatus === 'Studied' ? 100 : Math.round((currentPage / totalPages) * 100),
      });
      setStudiedStatus(newStatus);

      if (newStatus === 'Studied') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const fallbackUrl = resource?.subject?.slug
      ? `/subjects/${resource.subject.slug}`
      : resource?.subject?._id
      ? `/subjects/${resource.subject._id}`
      : '/dashboard';

    // If there is active in-app history, go back; otherwise go directly to the subject/dashboard
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className="flex h-screen flex-col bg-slate-900 text-slate-100 select-none overflow-hidden"
    >
      {/* Top Controls Bar */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 relative z-20">
        {/* Left: Back button + Resource Title */}
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex-shrink-0 cursor-pointer active:scale-95"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="truncate">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {resource?.title}
            </h2>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              {resource?.subject ? (
                <button
                  type="button"
                  onClick={() => navigate(resource?.subject?.slug ? `/subjects/${resource.subject.slug}` : '/dashboard')}
                  className="hover:text-brand-400 hover:underline transition-colors text-left truncate"
                >
                  {resource?.subject?.name}
                </button>
              ) : null}
              {resource?.subject ? <span>•</span> : null}
              <span>{resource?.materialType} {resource?.examYear ? `(${resource.examYear})` : ''}</span>
            </p>
          </div>
        </div>

        {/* Center: Page Controls (Canvas Mode) */}
        {viewerMode === 'canvas' && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-900 px-2 py-1 border border-slate-800">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Right: Zoom + View Mode + Actions (NO DOWNLOAD BUTTON) */}
        <div className="flex items-center gap-1.5">
          {/* Reader View Mode Toggle */}
          {pdfBlobUrl && (
            <button
              type="button"
              onClick={() => setViewerMode((m) => (m === 'canvas' ? 'embedded' : 'canvas'))}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewerMode === 'embedded'
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={viewerMode === 'canvas' ? 'Switch to Continuous Scroll View' : 'Switch to Page-by-Page View'}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{viewerMode === 'canvas' ? 'Continuous View' : 'Page View'}</span>
            </button>
          )}

          {/* Zoom buttons (Canvas Mode) */}
          {viewerMode === 'canvas' && (
            <div className="hidden md:flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 text-[10px] font-mono text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mark as Studied */}
          <button
            type="button"
            onClick={handleMarkAsStudied}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              studiedStatus === 'Studied'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{studiedStatus === 'Studied' ? 'Studied' : 'Mark Studied'}</span>
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleBookmarkToggle}
            className={`rounded-lg p-1.5 transition-all ${
              isBookmarked
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={isBookmarked ? 'Bookmarked' : 'Save bookmark'}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Share link */}
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Share CampusVault Link"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Report Issue */}
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400"
            title="Report concern"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="relative flex-1 overflow-auto bg-slate-900/90 p-1.5 sm:p-4 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-xs text-slate-400">Loading secure academic document...</p>
          </div>
        )}

        {loadError && !pdfBlobUrl && (
          <div className="max-w-md rounded-2xl border border-red-900/50 bg-red-950/40 p-6 text-center text-red-200">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
            <h4 className="text-sm font-bold">Document Unavailable</h4>
            <p className="mt-1 text-xs text-red-300">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Embedded Reader View */}
        {!loading && pdfBlobUrl && (viewerMode === 'embedded' || loadError) && (
          <div className="h-full w-full max-w-5xl flex items-center justify-center">
            <object
              data={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              type="application/pdf"
              className="h-[calc(100vh-8.5rem)] w-full rounded-xl border border-slate-800 shadow-2xl bg-white"
              title={resource?.title}
            >
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0&view=FitH`}
                title={resource?.title}
                className="h-[calc(100vh-8.5rem)] w-full rounded-xl border-0"
              />
            </object>
          </div>
        )}

        {/* Canvas Page View */}
        {!loading && !loadError && viewerMode === 'canvas' && (
          <div className="w-full flex items-center justify-center overflow-x-auto py-1">
            <canvas
              ref={canvasRef}
              className="mx-auto rounded-lg shadow-2xl transition-all max-w-full h-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Toolbar */}
      <div className="flex sm:hidden h-12 items-center justify-between border-t border-slate-800 bg-slate-950 px-2.5 text-xs z-20">
        {viewerMode === 'canvas' ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-[11px] text-slate-300">
              {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">Continuous</span>
        )}

        {/* Mobile Zoom Controls */}
        {viewerMode === 'canvas' && (
          <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="rounded p-1 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 text-[10px] font-mono text-brand-400 hover:text-brand-300 font-bold"
              title="Reset Zoom to 80%"
            >
              80%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="rounded p-1 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {pdfBlobUrl && (
            <button
              type="button"
              onClick={() => setViewerMode((m) => (m === 'canvas' ? 'embedded' : 'canvas'))}
              className="rounded bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300"
            >
              {viewerMode === 'canvas' ? 'Scroll' : 'Pages'}
            </button>
          )}

          <button
            type="button"
            onClick={handleMarkAsStudied}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
              studiedStatus === 'Studied' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 bg-slate-800'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{studiedStatus === 'Studied' ? 'Done' : 'Mark'}</span>
          </button>
        </div>
      </div>

      {reportModalOpen && (
        <CopyrightModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          resourceId={resource?._id}
          resourceTitle={resource?.title}
        />
      )}
    </div>
  );
}
