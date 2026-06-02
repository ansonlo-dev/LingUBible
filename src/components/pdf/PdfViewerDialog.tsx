import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, ExternalLink, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

// The viewer pulls in the PDFium WebAssembly engine (several MB), so we
// lazy-load it. The heavy chunk is only fetched the first time a user actually
// opens a document, keeping it out of the main bundle.
const importViewer = () => import('./EmbedPdfViewer');

const EmbedPdfViewer = lazy(importViewer);

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
 * It is built on a plain portal overlay rather than the Radix Dialog on purpose:
 * Radix's scroll lock (react-remove-scroll) blocks native wheel/touch scrolling
 * inside the embedded viewer's `overflow:auto` viewport, which left the document
 * un-scrollable except by dragging. A bare overlay keeps native scrolling intact.
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
  const { t, language } = useLanguage();
  // Read the effective theme straight from <html> so it always reflects the
  // live site theme. (The useTheme hook keeps per-instance state that doesn't
  // update when the theme is toggled elsewhere, which left the viewer stale.)
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains('dark'));
    update();
    const mo = new MutationObserver(update);
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  // embedpdf reads theme/locale only at init; we pass a resolved light/dark.
  const themePreference: 'light' | 'dark' = isDark ? 'dark' : 'light';
  // embedpdf's locale codes line up with ours; fall back to English otherwise.
  const viewerLocale = language === 'zh-TW' || language === 'zh-CN' ? language : 'en';

  // Detect touch device once at mount — drives pan mode and button visibility.
  const [isMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  );

  const bodyRef = useRef<HTMLDivElement>(null);
  // Holds the embedpdf PluginRegistry once the viewer fires onReady. Used to
  // re-request fit-width after the container is properly laid out.
  const registryRef = useRef<any>(null);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Mount the viewer one frame after opening so its container is laid out (and
  // sized) before it takes its first measurement.
  const [ready, setReady] = useState(false);
  // Becomes true once the viewer fires onReady (plugins registered, document
  // loading). Used to drive the resize-nudge so it lands after the pages exist.
  const [viewerReady, setViewerReady] = useState(false);

  // Warm the viewer/engine chunk in the background once mounted.
  useEffect(() => { prefetchViewer(); }, []);

  // Theme/locale are only read by embedpdf at init, so we remount the viewer
  // (via `key`) when they change. Reset the ready flag so the first-paint nudge
  // re-runs against the freshly mounted instance.
  useEffect(() => { setViewerReady(false); registryRef.current = null; }, [themePreference, viewerLocale]);

  // Lock background scrolling and wire Esc-to-close while open.
  useEffect(() => {
    if (!open) { setReady(false); setViewerReady(false); return; }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    const id = setTimeout(() => setReady(true), 50);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      clearTimeout(id);
    };
  }, [open, onOpenChange]);

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
    // Desktop only: after the resize-nudges settle the container reaches its
    // final dimensions, then we re-request fit-width so the zoom is calculated
    // against the correct size (the defaultZoomLevel config is read at init,
    // before the container is fully laid out, so the first calculation is off).
    const zoomTimer = !isMobile
      ? setTimeout(() => {
          const zoomCap = registryRef.current?.getPlugin?.('zoom')?.provides?.();
          zoomCap?.requestZoom?.('fit-width');
        }, 2600)
      : null;
    return () => {
      timers.forEach(clearTimeout);
      if (zoomTimer !== null) clearTimeout(zoomTimer);
      if (el) el.style.paddingRight = '';
    };
  }, [ready, blobUrl, error, viewerReady, isMobile]);

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

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || t('components.pdfViewer.title')}
      className="pdf-viewer-portal flex flex-col bg-background"
      // Position/size/stacking are set inline (not via Tailwind classes) so the
      // full-screen overlay reliably covers the site chrome regardless of any
      // global CSS — earlier the site header bled through the top.
      style={{ position: 'fixed', inset: 0, zIndex: 2147483000 }}
    >
      {/* Viewer body fills the whole overlay; there is no separate header bar. */}
      <div ref={bodyRef} className="relative flex-1 min-h-0 bg-muted/30">
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
            <EmbedPdfViewer
              key={`${themePreference}-${viewerLocale}`}
              src={blobUrl}
              preference={themePreference}
              locale={viewerLocale}
              onReady={(registry) => { registryRef.current = registry; setViewerReady(true); }}
              defaultPanMode={isMobile ? 'always' : 'never'}
              defaultZoomLevel={isMobile ? undefined : 'fit-width'}
            />
          </Suspense>
        )}

        {/* Floating actions, sitting in embedpdf's top-right toolbar band next to
            its search / comment icons (offset from the right to clear them). */}
        {!error && (
          <div
            className="absolute top-1.5 z-10 hidden md:flex items-center gap-0.5 rounded-lg bg-background/70 px-0.5 backdrop-blur-sm"
            style={{ right: 96 }}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={handleOpenInNewTab}
              disabled={!src}
              title={t('components.pdfViewer.openInNewTab')}
              aria-label={t('components.pdfViewer.openInNewTab')}
            >
              <ExternalLink className="h-[18px] w-[18px]" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              asChild
              disabled={!blobUrl}
              title={t('components.pdfViewer.download')}
              aria-label={t('components.pdfViewer.download')}
            >
              <a href={blobUrl || undefined} download={title || true}>
                <Download className="h-[18px] w-[18px]" />
              </a>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={() => onOpenChange(false)}
              title={t('components.pdfViewer.close')}
              aria-label={t('components.pdfViewer.close')}
            >
              <X className="h-[18px] w-[18px]" />
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

const PdfViewerLoading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-full w-full items-center justify-center gap-2 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
    <span className="text-sm">{label}</span>
  </div>
);

export default PdfViewerDialog;
