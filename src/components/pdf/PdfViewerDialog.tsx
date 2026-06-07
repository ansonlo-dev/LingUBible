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

  // Detect whether we're running inside an installed PWA (standalone display
  // mode). Used to hide the fullscreen button — it's redundant in a PWA but
  // still useful for in-browser mobile users.
  const [isStandalonePWA] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true),
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
  // Ref so the mobile menu command always calls the latest toggle without stale closure.
  const toggleInvertedRef = useRef(toggleInverted);
  useEffect(() => { toggleInvertedRef.current = toggleInverted; });

  const [saveDialog, setSaveDialog] = useState<{
    open: boolean; fileName: string; buffer: ArrayBuffer | null; preparing: boolean;
  }>({ open: false, fileName: '', buffer: null, preparing: false });

  // In-document audio links (e.g. pronunciation .mp3 buttons) play in a small
  // inline player overlay instead of opening a new tab, so the user can listen
  // while still reading the document (important inside the installed PWA). The
  // `key` forces the <audio> to remount + autoplay when the same link is reused.
  const [audio, setAudio] = useState<{ src: string; key: number } | null>(null);

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
    if (!open) { setReady(false); setViewerReady(false); setAudio(null); return; }
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
              // The tabs component (bx) uses local useState(tabs[0].id) and never reads
              // the Redux sidebarTabs state, so setActiveSidebar's activeTab is ignored for
              // rendering. We must programmatically click the outline tab after the sidebar
              // has mounted (tabs[0] = thumbnails, tabs[1] = outline).
              const clickOutlineTab = () => {
                const shadow = shadowRootRef.current;
                if (!shadow) return false;
                const sidebarEl = shadow.querySelector('[data-sidebar-id="sidebar-panel"]');
                const tabButtons = sidebarEl?.querySelectorAll('[role="tab"]');
                if (tabButtons && tabButtons.length > 1) {
                  (tabButtons[1] as HTMLElement).click();
                  return true;
                }
                return false;
              };
              requestAnimationFrame(() => {
                if (!clickOutlineTab()) setTimeout(() => { if (!clickOutlineTab()) setTimeout(clickOutlineTab, 200); }, 100);
              });
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

  // Make link annotations follow on a single click, like the browser's native
  // PDF reader. By default embedpdf only *selects* a clicked link and surfaces a
  // "Go to Link" button you must tap again. We watch the annotation selection
  // and, when a single link annotation gets selected, immediately replicate the
  // built-in `annotation:goto-link` action (jump to a destination / open a URI
  // or embedded audio via the engine's autoOpenLinks handler) and clear the
  // selection so the toolbar never lingers.
  useEffect(() => {
    if (!(ready && blobUrl && !error && viewerReady)) return;
    const annotation = registryRef.current?.getPlugin?.('annotation')?.provides?.();
    if (!annotation?.onStateChange) return;

    const LINK_TYPE = 2; // PdfAnnotationSubtype.LINK

    const unsubscribe = annotation.onStateChange((payload: any) => {
      const documentId = payload?.documentId;
      const selectedUids = payload?.state?.selectedUids;
      // Only act on a single selected annotation (a deliberate link click).
      if (!documentId || !Array.isArray(selectedUids) || selectedUids.length !== 1) return;

      const scope = annotation.forDocument?.(documentId);
      const selected = scope?.getSelectedAnnotation?.();
      if (!selected) return;

      // Resolve the link object: either the annotation itself is a LINK, or it
      // carries attached links (mirrors the goto-link command's logic).
      let link = null;
      if (selected.object?.type === LINK_TYPE) {
        link = selected.object;
      } else {
        const attached = scope.getAttachedLinks?.(selected.object?.id) ?? [];
        if (attached.length > 0) link = attached[0].object;
      }

      if (link?.target) {
        // If the link is a URI action pointing at an audio file, play it inline
        // instead of letting the engine's autoOpenLinks handler open a new tab —
        // that way the user can listen while still reading the document. The
        // PDFs' audio links now point at our own Appwrite bucket (e.g.
        // appwrite.lingubible.com/v1/storage/buckets/mp3/files/x.mp3/view?...),
        // so the extension is followed by `/view` rather than being at the end —
        // hence the trailing `/` in the match group.
        const action = link.target?.action;
        const uri = typeof action?.uri === 'string' ? action.uri : null;
        const isAudio = !!uri && /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus)(\?|#|\/|$)/i.test(uri);
        if (isAudio) {
          setAudio({ src: uri!, key: Date.now() });
        } else {
          scope.navigateTarget(link.target);
        }
        scope.deselectAnnotation?.(); // dismiss the "Go to Link" toolbar
      }
    });

    return () => { unsubscribe?.(); };
  }, [ready, blobUrl, error, viewerReady]);

  // Cap the smooth-scroll duration for in-document jumps (link targets,
  // bookmarks, …). embedpdf scrolls its viewport with the browser-native
  // `element.scrollTo({ behavior: 'smooth' })`, whose duration scales with the
  // distance — a jump across a long document can take ~4s. We override the
  // viewport element's `scrollTo` to run our own rAF animation clamped to ~1s.
  useEffect(() => {
    if (!(ready && blobUrl && !error && viewerReady)) return;

    const MAX_DURATION = 1000; // ms — long jumps land in ~1s instead of ~4s
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let rafId = 0;
    let patched: { el: HTMLElement; native: typeof HTMLElement.prototype.scrollTo } | null = null;

    const patch = () => {
      const el = shadowRootRef.current?.querySelector('.bg-bg-app') as HTMLElement | null;
      if (!el) return false;
      const native = el.scrollTo.bind(el);
      patched = { el, native };
      el.scrollTo = function (optionsOrX?: ScrollToOptions | number, y?: number) {
        const opts: ScrollToOptions =
          typeof optionsOrX === 'object' && optionsOrX !== null
            ? optionsOrX
            : { left: optionsOrX as number, top: y };
        // Only intercept smooth scrolls; instant scrolls pass straight through.
        if (opts.behavior !== 'smooth') { native(opts); return; }

        cancelAnimationFrame(rafId);
        const startLeft = el.scrollLeft;
        const startTop = el.scrollTop;
        const targetLeft = opts.left ?? startLeft;
        const targetTop = opts.top ?? startTop;
        const distance = Math.max(Math.abs(targetTop - startTop), Math.abs(targetLeft - startLeft));
        if (distance < 1) return;
        // Proportional to distance but capped at MAX_DURATION; short hops stay snappy.
        const duration = Math.min(MAX_DURATION, Math.max(200, distance * 0.5));
        const startTime = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - startTime) / duration);
          const e = easeInOutCubic(p);
          el.scrollLeft = startLeft + (targetLeft - startLeft) * e;
          el.scrollTop = startTop + (targetTop - startTop) * e;
          if (p < 1) rafId = requestAnimationFrame(step);
        };
        rafId = requestAnimationFrame(step);
      } as typeof el.scrollTo;
      return true;
    };

    // The viewport may not be mounted the instant viewerReady flips; retry a few frames.
    let attempts = 0;
    const tryPatch = () => {
      if (patch() || attempts++ > 20) return;
      rafId = requestAnimationFrame(tryPatch);
    };
    tryPatch();

    return () => {
      cancelAnimationFrame(rafId);
      if (patched) patched.el.scrollTo = patched.native;
    };
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

  // Replace the hardcoded "Initializing plugins..." text in the embedpdf shadow root
  // with the translated equivalent. The text appears before onReady fires, so we use
  // rAF to find the shadow root as early as possible, then a MutationObserver to catch
  // the text node whenever it's inserted.
  useEffect(() => {
    if (!(ready && blobUrl && !error)) return;
    const translatedText = t('components.pdfViewer.initializingPlugins');
    let rafId: number;
    let observer: MutationObserver | null = null;

    const replaceText = (root: ShadowRoot) => {
      const p = root.querySelector('p.text-lg');
      if (p && p.textContent === 'Initializing plugins...') p.textContent = translatedText;
    };

    const init = () => {
      const epdfEl = bodyRef.current?.querySelector('embedpdf-container');
      const shadow = (epdfEl as any)?.shadowRoot as ShadowRoot | null;
      if (shadow) {
        replaceText(shadow);
        observer = new MutationObserver(() => replaceText(shadow));
        observer.observe(shadow, { childList: true, subtree: true, characterData: true });
        return;
      }
      rafId = requestAnimationFrame(init);
    };

    init();
    return () => { cancelAnimationFrame(rafId); observer?.disconnect(); };
  }, [ready, blobUrl, error, t]);

  // Ctrl+S / Cmd+S opens the save dialog when the viewer is open.
  // openSaveDialog reads registryRef (always current) and title (stable during session).
  useEffect(() => {
    if (!open) return;
    const onCtrlS = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 's') return;
      e.preventDefault();
      openSaveDialog();
    };
    window.addEventListener('keydown', onCtrlS);
    return () => window.removeEventListener('keydown', onCtrlS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const openSaveDialog = () => {
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
              exportFileName={`${(title || 'document').replace(/\.pdf$/i, '')}_exported.pdf`}
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
                  // Register a custom invert-colors command (for mobile menu).
                  const commandsCap = (registry as any).getPlugin?.('commands')?.provides?.();
                  if (commandsCap && isMobile) {
                    commandsCap.registerCommand({
                      id: 'custom:invert-colors',
                      label: t('components.pdfViewer.invertColors'),
                      icon: 'palette',
                      categories: ['custom'],
                      active: () => toggleInvertedRef.current !== undefined && localStorage.getItem('pdf-viewer-inverted') === 'true',
                      action: () => { toggleInvertedRef.current(); },
                    });
                  }
                  const documentMenu = schema?.menus?.['document-menu'];
                  if (documentMenu?.items) {
                    const filtered = (documentMenu.items as any[]).filter((item: any) =>
                      item.id !== 'document:open' && item.id !== 'document:close' &&
                      item.id !== 'divider-10' && item.id !== 'document:protect' &&
                      (isMobile || item.id !== 'document:export') &&
                      // Hide the print button on mobile.
                      !(isMobile && item.id === 'document:print') &&
                      // Hide fullscreen when running as an installed PWA on mobile
                      // (keep it for in-browser mobile users).
                      !(isMobile && isStandalonePWA && item.id === 'document:fullscreen'),
                    );
                    // On mobile, splice the invert-colors item just before export.
                    const menuItems = [...filtered];
                    if (isMobile) {
                      const exportIdx = menuItems.findIndex((item: any) => item.id === 'document:export');
                      const invertItem = { type: 'command', id: 'custom:invert-colors', commandId: 'custom:invert-colors', categories: ['custom'] };
                      if (exportIdx >= 0) menuItems.splice(exportIdx, 0, invertItem as any);
                      else menuItems.push(invertItem as any);
                    }
                    uiCap.mergeSchema?.({
                      menus: {
                        'document-menu': { ...documentMenu, items: menuItems } as any,
                      },
                    });
                  }
                  // Fullscreen also lives in the page-settings menu — drop it
                  // there too when running as an installed PWA on mobile.
                  const pageSettingsMenu = schema?.menus?.['page-settings-menu'];
                  if (pageSettingsMenu?.items && isMobile && isStandalonePWA) {
                    const psItems = (pageSettingsMenu.items as any[]).filter(
                      (item: any) => item.id !== 'document:fullscreen' && item.id !== 'divider-15',
                    );
                    uiCap.mergeSchema?.({
                      menus: {
                        'page-settings-menu': { ...pageSettingsMenu, items: psItems } as any,
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
                  className="h-9 w-9"
                  onClick={openSaveDialog}
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
        {/* Inline audio player — appears when an in-document audio link is
            tapped, pinned bottom-centre so playback continues while reading. */}
        {audio && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-background/95 px-3 py-2 shadow-lg ring-1 ring-border/60 backdrop-blur-sm"
            style={{ zIndex: 15, maxWidth: 'calc(100% - 24px)' }}
          >
            <audio
              key={audio.key}
              src={audio.src}
              controls
              autoPlay
              aria-label={t('components.pdfViewer.audio')}
              className="h-9"
              style={{ maxWidth: 'min(70vw, 360px)' }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={() => setAudio(null)}
              aria-label={t('components.pdfViewer.closeAudio')}
            >
              <X className="h-[18px] w-[18px]" />
            </Button>
          </div>
        )}
        {/* Save dialog — shown on Ctrl+S or download button */}
        {saveDialog.open && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 20, backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSaveDialog(prev => ({ ...prev, open: false })); }}
          >
            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl w-full max-w-sm mx-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">{t('components.pdfViewer.saveDialog.title')}</h2>
                <Button size="icon" variant="ghost" className="h-7 w-7 -mr-1" onClick={() => setSaveDialog(prev => ({ ...prev, open: false }))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                <Button variant="ghost" size="sm" onClick={() => setSaveDialog(prev => ({ ...prev, open: false }))}>
                  {t('components.pdfViewer.saveDialog.cancel')}
                </Button>
                {'showSaveFilePicker' in window && (
                  <Button variant="outline" size="sm" onClick={handleSaveToFolder} disabled={!saveDialog.buffer || saveDialog.preparing}>
                    {t('components.pdfViewer.saveDialog.saveToFolder')}
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                  onClick={handleDialogDownload}
                  disabled={!saveDialog.buffer || saveDialog.preparing}
                >
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
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-muted-foreground shadow-md ring-1 ring-border/50 backdrop-blur-sm">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  </div>
);

export default PdfViewerDialog;
