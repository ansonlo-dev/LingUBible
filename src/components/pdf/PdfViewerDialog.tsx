import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, ExternalLink, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/theme/useTheme';

// The drop-in viewer pulls in the PDFium WebAssembly engine (several MB), so we
// lazy-load it. The heavy chunk is only fetched the first time a user actually
// opens a document, keeping it out of the main bundle.
const importViewer = () => import('@embedpdf/react-pdf-viewer');

const PDFViewer = lazy(async () => {
  const mod = await importViewer();
  return { default: mod.PDFViewer };
});

// Warm the (large) viewer + PDFium engine chunk ahead of the first open so the
// click feels responsive instead of waiting on a multi-MB download. Runs once,
// at idle, regardless of how many dialogs mount.
let viewerPrefetched = false;
const prefetchViewer = () => {
  if (viewerPrefetched) return;
  viewerPrefetched = true;
  const run = () => { importViewer().catch(() => { viewerPrefetched = false; }); };
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run, { timeout: 3000 });
  } else {
    setTimeout(run, 1200);
  }
};

interface PdfViewerDialogProps {
  // The PDF source URL (e.g. an Appwrite `getFileView` URL).
  src: string | null;
  // Document title shown in the dialog header / tab.
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * A full-screen modal PDF viewer (powered by @embedpdf/react-pdf-viewer) that
 * opens documents in-place instead of handing off to the browser's native PDF
 * viewer in a new tab. Reusable for any openable PDF (course syllabus, past
 * exam papers, …).
 *
 * We fetch the bytes ourselves with `credentials: 'include'` and feed the viewer
 * a same-origin blob URL, rather than letting the engine fetch the Appwrite URL
 * directly. The Appwrite endpoint (appwrite.lingubible.com) is cross-origin to
 * the app, so the engine's default fetch would omit the session cookie and a
 * `read("users")` bucket would reject it — our explicit credentialed fetch sends
 * the cookie. The blob is also reused for the download button.
 */
export const PdfViewerDialog: React.FC<PdfViewerDialogProps> = ({
  src,
  title,
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();
  const { currentMode } = useTheme();
  // The viewer accepts 'light' | 'dark' | 'system' — mirror the app's setting.
  const themePreference = currentMode === 'dark' ? 'dark' : currentMode === 'light' ? 'light' : 'system';

  const bodyRef = useRef<HTMLDivElement>(null);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // The viewer measures its container on mount; if it mounts while the dialog's
  // open animation is still running it can end up with a 0-height viewport and
  // never render the page (until something forces a resize). So we wait for the
  // animation to settle before mounting it.
  const [ready, setReady] = useState(false);
  // Becomes true once the viewer fires onReady (plugins registered, document
  // loading). Used to drive the resize-nudge so it lands after the pages exist.
  const [viewerReady, setViewerReady] = useState(false);

  // Warm the viewer/engine chunk in the background once mounted.
  useEffect(() => { prefetchViewer(); }, []);

  useEffect(() => {
    if (!open) { setReady(false); setViewerReady(false); return; }
    const id = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(id);
  }, [open]);

  // The drop-in viewer's <div> only paints its pages when its internal
  // ResizeObserver reports a container size change. Its very first measurement
  // happens while plugins are still initializing (no pages yet), so nothing
  // renders until the user manually resizes it (e.g. toggles the sidebar).
  // Once the viewer is ready we toggle a 1px padding on its wrapper several
  // times, spaced out to outlast document parsing, so a resize fires *after*
  // the pages are available. Plain window 'resize' events don't help because
  // the observer only reacts to its own element's box changing.
  useEffect(() => {
    if (!(ready && blobUrl && !error && viewerReady)) return;
    const el = bodyRef.current;
    if (!el) return;
    const timers = [120, 350, 700, 1300, 2200].map((delay, i) =>
      setTimeout(() => { el.style.paddingRight = i % 2 === 0 ? '1px' : ''; }, delay),
    );
    return () => {
      timers.forEach(clearTimeout);
      if (el) el.style.paddingRight = '';
    };
  }, [ready, blobUrl, error, viewerReady]);

  // Fetch (with credentials) whenever an opened dialog has a source. Revoke the
  // object URL on cleanup so we never leak blobs.
  useEffect(() => {
    if (!open || !src) return;
    let cancelled = false;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(false);
    setBlobUrl(null);
    fetch(src, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, src]);

  // Top-level navigation still carries the session cookie (SameSite=Lax), so the
  // new-tab fallback works even when the in-page fetch is blocked.
  const handleOpenInNewTab = () => {
    if (src) window.open(src, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-screen h-[100dvh] p-0 gap-0 flex flex-col rounded-none border-0 overflow-hidden"
      >
        {/* Header: title + actions. The dialog's built-in close (X) sits at top-right. */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0 pr-12">
          <DialogTitle className="flex-1 min-w-0 truncate text-sm font-medium">
            {title || t('components.pdfViewer.title')}
          </DialogTitle>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={handleOpenInNewTab}
            disabled={!src}
            title={t('components.pdfViewer.openInNewTab')}
            aria-label={t('components.pdfViewer.openInNewTab')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            asChild
            disabled={!blobUrl}
            title={t('components.pdfViewer.download')}
            aria-label={t('components.pdfViewer.download')}
          >
            <a href={blobUrl || undefined} download={title || true}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Viewer body */}
        <div ref={bodyRef} className="flex-1 min-h-0 bg-muted/30">
          {error ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground px-6 text-center">
              <AlertCircle className="h-6 w-6" />
              <span className="text-sm">{t('components.pdfViewer.error')}</span>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab} disabled={!src}>
                <ExternalLink className="h-4 w-4 mr-1.5" />
                {t('components.pdfViewer.openInNewTab')}
              </Button>
            </div>
          ) : loading || !blobUrl || !ready ? (
            <PdfViewerLoading label={t('components.pdfViewer.loading')} />
          ) : (
            <Suspense fallback={<PdfViewerLoading label={t('components.pdfViewer.loading')} />}>
              <PDFViewer
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
                onReady={() => setViewerReady(true)}
                config={{
                  src: blobUrl,
                  theme: { preference: themePreference },
                  // Enable click-and-drag panning on desktop too (default is
                  // mobile-only, which left desktop users unable to drag).
                  pan: { defaultMode: 'always' },
                }}
              />
            </Suspense>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PdfViewerLoading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-full w-full items-center justify-center gap-2 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
    <span className="text-sm">{label}</span>
  </div>
);

export default PdfViewerDialog;
