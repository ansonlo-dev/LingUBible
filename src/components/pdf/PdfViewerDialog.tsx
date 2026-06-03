import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertCircle, Contrast, Download, ExternalLink, Loader2, X } from 'lucide-react';
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

  // Color inversion toggle — persisted across sessions via localStorage.
  const [inverted, setInverted] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('pdf-viewer-inverted') === 'true',
  );
  const toggleInverted = () => {
    setInverted((prev) => {
      const next = !prev;
      localStorage.setItem('pdf-viewer-inverted', String(next));
      return next;
    });
  };

  const [saveDialog, setSaveDialog] = useState<{
    open: boolean; fileName: string; buffer: ArrayBuffer | null; preparing: boolean;
  }>({ open: false, fileName: '', buffer: null, preparing: false });

  const bodyRef = useRef<HTMLDivElement>(null);
  // Holds the embedpdf PluginRegistry once the viewer fires onReady. Used to
  // re-request fit-width after the container is properly laid out.
  const registryRef = useRef<any>(null);
  // Captured in onReady when we know the shadow root exists. More reliable
  // than calling querySelector each time an effect re-runs.
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  // Tracks whether we pushed a history entry for this open. Used to clean it
  // up if the dialog closes via a means other than the back gesture.
  const pushedHistoryRef = useRef(false);

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
  useEffect(() => { setViewerReady(false); registryRef.current = null; shadowRootRef.current = null; }, [themePreference, viewerLocale]);

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

  // Push a history entry when the dialog opens so the mobile back gesture closes
  // the PDF instead of navigating away from the page that triggered it.
  // - On open: pushState so back goes "into" the dialog.
  // - popstate (back gesture): close the dialog; history is already popped.
  // - Cleanup (closed via X / Esc / external): pop our pushed entry via history.back().
  useEffect(() => {
    if (!open) return;
    history.pushState({ pdfOpen: true }, '');
    pushedHistoryRef.current = true;
    const onPopState = () => {
      pushedHistoryRef.current = false;
      onOpenChange(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        history.back();
      }
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
    // After the resize-nudges settle the container reaches its final dimensions,
    // then we re-request fit-width so the zoom is calculated against the correct
    // size (the defaultZoomLevel config is read at init, before the container is
    // fully laid out, so the first calculation is off). Applies to all devices.
    const zoomTimer = setTimeout(() => {
      const zoomCap = registryRef.current?.getPlugin?.('zoom')?.provides?.();
      zoomCap?.requestZoom?.('fit-width');
    }, 2600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(zoomTimer);
      if (el) el.style.paddingRight = '';
    };
  }, [ready, blobUrl, error, viewerReady, isMobile]);

  // When the viewer is ready, subscribe to document-opened events and open the
  // outline (bookmark) sidebar panel automatically when the PDF has bookmarks.
  // If there are no bookmarks the sidebar stays closed (full-width view).
  useEffect(() => {
    if (!(ready && blobUrl && !error && viewerReady)) return;
    const registry = registryRef.current;
    if (!registry) return;

    const docManager = registry.getPlugin?.('document-manager')?.provides?.();
    const bookmarkCap = registry.getPlugin?.('bookmark')?.provides?.();
    const uiCap = registry.getPlugin?.('ui')?.provides?.();
    if (!docManager || !bookmarkCap || !uiCap) return;

    let outlineOpened = false;

    const tryOpenOutline = (documentId: string) => {
      if (outlineOpened) return;
      // getBookmarks() throws synchronously if the document hasn't finished
      // loading yet — guard with try/catch so an unready doc never crashes.
      try {
        bookmarkCap.forDocument(documentId).getBookmarks().wait(
          ({ bookmarks }) => {
            if (!outlineOpened && bookmarks && bookmarks.length > 0) {
              outlineOpened = true;
              uiCap.setActiveSidebar('left', 'main', 'sidebar-panel', documentId, 'outline');
            }
          },
          () => {}, // no bookmarks or outline data unavailable — leave sidebar closed
        );
      } catch {
        // document not ready yet; onDocumentOpened will retry when it is
      }
    };

    // Handle documents already fully loaded when this effect runs.
    // Skip any document still in 'loading' state — onDocumentOpened will fire
    // for it once loading completes.
    for (const doc of docManager.getOpenDocuments?.() ?? []) {
      if (doc?.status === 'loaded') tryOpenOutline(doc.id);
    }

    // Handle documents that finish loading after this effect mounts.
    const unsubscribe = docManager.onDocumentOpened((doc: any) => {
      if (doc?.id) tryOpenOutline(doc.id);
    });

    return () => { unsubscribe?.(); };
  }, [ready, blobUrl, error, viewerReady]);

  // Inject/remove an inversion filter into the embedpdf shadow root when the
  // inversion toggle changes. Pages are rendered as <img> tiles (blob URLs from
  // PDFium), so the filter targets img elements. The toolbar uses SVG icons and
  // has no img elements, so it is unaffected. shadowRootRef is populated in
  // onReady when we know the element is in the DOM; we re-run on viewerReady
  // changes so the style is re-injected after a viewer remount.
  useEffect(() => {
    const STYLE_ID = 'pdf-invert-style';
    const shadow = shadowRootRef.current;
    if (!inverted) {
      shadow?.querySelector(`#${STYLE_ID}`)?.remove();
      return;
    }
    if (!viewerReady || !shadow) return;
    let styleEl = shadow.querySelector(`#${STYLE_ID}`) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      shadow.appendChild(styleEl);
    }
    styleEl.textContent = 'img { filter: invert(1) hue-rotate(180deg); }';
  }, [inverted, viewerReady]);

  // Inject ::selection reset into shadow root once so the site's red primary
  // color doesn't override the browser-default selection highlight inside the viewer.
  useEffect(() => {
    if (!viewerReady || !shadowRootRef.current) return;
    const shadow = shadowRootRef.current;
    const STYLE_ID = 'pdf-selection-reset';
    if (shadow.querySelector(`#${STYLE_ID}`)) return;
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = '*::selection { background-color: Highlight; color: HighlightText; }';
    shadow.appendChild(styleEl);
  }, [viewerReady]);

  // Ctrl+S / Cmd+S opens the save dialog when the viewer is open.
  useEffect(() => {
    if (!open) return;
    const onCtrlS = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 's') return;
      e.preventDefault();
      const registry = registryRef.current;
      if (!registry) return;
      const exportCap = (registry as any).getPlugin?.('export')?.provides?.();
      const docManager = (registry as any).getPlugin?.('document-manager')?.provides?.();
      if (!exportCap || !docManager) return;
      const docs: any[] = docManager.getOpenDocuments?.() ?? [];
      const docId = docs.find((d: any) => d.status === 'loaded')?.id;
      if (!docId) return;
      const baseName = (title || 'document').replace(/\.pdf$/i, '');
      const defaultName = `${baseName}_exported.pdf`;
      setSaveDialog({ open: true, fileName: defaultName, buffer: null, preparing: true });
      exportCap.forDocument(docId).saveAsCopy().wait(
        (buffer: ArrayBuffer) => setSaveDialog(prev => ({ ...prev, buffer, preparing: false })),
        () => setSaveDialog(prev => ({ ...prev, preparing: false })),
      );
    };
    window.addEventListener('keydown', onCtrlS);
    return () => window.removeEventListener('keydown', onCtrlS);
  }, [open, title]);

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

  const handleOpenInNewTab = () => {
    if (src) window.open(src, '_blank', 'noopener,noreferrer');
  };

  const handleExport = () => {
    const registry = registryRef.current;
    if (!registry) return;
    const exportCap = (registry as any).getPlugin?.('export')?.provides?.();
    const docManager = (registry as any).getPlugin?.('document-manager')?.provides?.();
    if (!exportCap || !docManager) return;
    const docs: any[] = docManager.getOpenDocuments?.() ?? [];
    const docId = docs.find((d: any) => d.status === 'loaded')?.id;
    if (!docId) return;
    exportCap.forDocument(docId).saveAsCopy().wait(
      (buffer: ArrayBuffer) => {
        const baseName = (title || 'document').replace(/\.pdf$/i, '');
        const fileName = `${baseName}_exported.pdf`;
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      () => {},
    );
  };

  const triggerDownload = (buffer: ArrayBuffer, fileName: string) => {
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDialogDownload = () => {
    const { buffer, fileName } = saveDialog;
    if (!buffer) return;
    triggerDownload(buffer, fileName);
    setSaveDialog(prev => ({ ...prev, open: false }));
  };

  const handleSaveToFolder = async () => {
    const { buffer, fileName } = saveDialog;
    if (!buffer) return;
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(buffer);
      await writable.close();
      setSaveDialog(prev => ({ ...prev, open: false }));
    } catch (e: any) {
      if (e.name !== 'AbortError') triggerDownload(buffer, fileName);
    }
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
      <div
        ref={bodyRef}
        className="relative flex-1 min-h-0 bg-muted/30"
      >
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
              onReady={(registry) => {
                registryRef.current = registry;
                // Move search and comment panels from the right-side group to sit
                // next to the pan/pointer buttons in center-group, separated by a
                // vertical divider. This keeps the right side of the toolbar free
                // so our custom overlay buttons (ExternalLink, Download, X) can
                // sit at the far right without overlapping the native UI.
                const uiCap = (registry as any).getPlugin?.('ui')?.provides?.();
                if (uiCap) {
                  const schema = uiCap.getSchema?.();
                  const mainToolbar = schema?.toolbars?.['main-toolbar'];
                  if (mainToolbar?.items) {
                    const items = (mainToolbar.items as any[]).map((item: any) => {
                      if (item.id === 'center-group') {
                        return {
                          ...item,
                          items: [
                            ...item.items,
                            { type: 'divider', id: 'search-panel-divider', orientation: 'vertical' },
                            { type: 'command-button', id: 'search-button', commandId: 'panel:toggle-search', variant: 'icon', categories: ['panel', 'panel-search'] },
                            { type: 'command-button', id: 'comment-button', commandId: 'panel:toggle-comment', variant: 'icon', categories: ['panel', 'panel-comment'] },
                          ],
                        };
                      }
                      if (item.id === 'right-group') {
                        return { ...item, items: [] };
                      }
                      return item;
                    });
                    uiCap.mergeSchema?.({
                      toolbars: {
                        'main-toolbar': { id: 'main-toolbar', position: mainToolbar.position, items } as any,
                      },
                    });
                  }
                  const documentMenu = schema?.menus?.['document-menu'];
                  if (documentMenu?.items) {
                    const filteredItems = (documentMenu.items as any[]).filter((item: any) =>
                      item.id !== 'document:open' && item.id !== 'document:close' &&
                      item.id !== 'divider-10' && item.id !== 'document:protect' &&
                      item.id !== 'document:export',
                    );
                    uiCap.mergeSchema?.({
                      menus: {
                        'document-menu': { ...documentMenu, items: filteredItems } as any,
                      },
                    });
                  }
                }
                // Capture shadow root now while we know the element exists.
                const epdfEl = bodyRef.current?.querySelector('embedpdf-container');
                shadowRootRef.current = (epdfEl as any)?.shadowRoot ?? null;
                setViewerReady(true);
              }}
              defaultPanMode={isMobile ? 'always' : 'never'}
              defaultZoomLevel="fit-width"
            />
          </Suspense>
        )}

        {/* Floating actions — Search/Comment are now in center-group (via
            mergeSchema), so the right side of the embedpdf toolbar is free.
            ExternalLink/Download sit just left of the close button. */}
        {!error && (
          <div
            className="absolute top-1.5 z-10 hidden lg:flex items-center gap-0.5 rounded-lg bg-background/70 px-0.5 backdrop-blur-sm"
            style={{ right: 48 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn('h-9 w-9', inverted && 'border-2 border-blue-400 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300')}
                  onClick={toggleInverted}
                  aria-label={t('components.pdfViewer.invertColors')}
                  aria-pressed={inverted}
                >
                  <Contrast className="h-[18px] w-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0" style={{ backgroundColor: 'rgb(var(--foreground))', color: 'rgb(var(--background))', zIndex: 2147483001 }}>
                {t('components.pdfViewer.invertColors')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={handleExport}
                  disabled={!viewerReady}
                  aria-label={t('components.pdfViewer.download')}
                >
                  <Download className="h-[18px] w-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0" style={{ backgroundColor: 'rgb(var(--foreground))', color: 'rgb(var(--background))', zIndex: 2147483001 }}>
                {t('components.pdfViewer.download')}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Close button — pinned to the top-right corner now that the embedpdf
            right-group is empty (Search/Comment moved to center-group). */}
        <div className="absolute top-1.5 z-10 hidden lg:flex" style={{ right: 4 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-lg bg-background/70 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
                aria-label={t('components.pdfViewer.close')}
              >
                <X className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="border-0" style={{ backgroundColor: 'rgb(var(--foreground))', color: 'rgb(var(--background))', zIndex: 2147483001 }}>
              {t('components.pdfViewer.close')}
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Save dialog — shown on Ctrl+S */}
        {saveDialog.open && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSaveDialog(prev => ({ ...prev, open: false })); }}
          >
            <div className="bg-background rounded-xl p-6 shadow-2xl w-full max-w-sm mx-4">
              <h2 className="text-base font-semibold mb-4">{t('components.pdfViewer.saveDialog.title')}</h2>
              <div className="mb-5">
                <label className="text-sm text-muted-foreground mb-1.5 block">{t('components.pdfViewer.saveDialog.filename')}</label>
                <Input
                  value={saveDialog.fileName}
                  onChange={(e) => setSaveDialog(prev => ({ ...prev, fileName: e.target.value }))}
                  className="w-full"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && saveDialog.buffer) handleDialogDownload(); }}
                />
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setSaveDialog(prev => ({ ...prev, open: false }))}>
                  {t('components.pdfViewer.saveDialog.cancel')}
                </Button>
                {'showSaveFilePicker' in window && (
                  <Button variant="outline" size="sm" onClick={handleSaveToFolder} disabled={!saveDialog.buffer || saveDialog.preparing}>
                    {t('components.pdfViewer.saveDialog.saveToFolder')}
                  </Button>
                )}
                <Button size="sm" onClick={handleDialogDownload} disabled={!saveDialog.buffer || saveDialog.preparing}>
                  {saveDialog.preparing ? t('components.pdfViewer.saveDialog.preparing') : t('components.pdfViewer.saveDialog.download')}
                </Button>
              </div>
            </div>
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
