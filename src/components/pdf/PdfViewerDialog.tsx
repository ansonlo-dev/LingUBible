import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Contrast, Download, ExternalLink, GripVertical, Loader2, Pause, Play, X } from 'lucide-react';
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

// Per-document key for remembering the last-read page. The query string is
// stripped so a refreshed Appwrite file token doesn't orphan the saved spot.
const pageStorageKey = (s: string | null) =>
  s ? `pdf-viewer-page:${s.split('?')[0]}` : null;

// mm:ss formatter for the audio player timestamps.
const formatAudioTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

interface InlineAudioPlayerProps {
  src: string;
  isMobile: boolean;
  // Lifted to the parent so a dragged position survives the remount that
  // happens (via `key`) when a new audio clip starts playing.
  pos: { left: number; top: number } | null;
  setPos: (pos: { left: number; top: number } | null) => void;
  onClose: () => void;
  t: (key: string) => string;
}

/**
 * A compact, theme-aware audio player for in-document pronunciation links.
 *
 * The native `<audio controls>` widget can't be themed cross-browser — it
 * renders an opaque light bar even in dark mode, and washes out against the
 * white PDF page. So we hide the native element and drive it through our own
 * controls (play/pause, seek, timestamps, speed menu).
 *
 * IMPORTANT: this project's theme tokens are stored as comma-separated RGB
 * triples (e.g. `--background: 255, 255, 255`), but Tailwind maps several of
 * them through `rgb(var(--x) / <alpha-value>)` / `hsl(var(--x))`, which yields
 * *invalid* colours (`rgb(255, 255, 255 / 1)`) that render transparent. So the
 * `bg-background` / `text-foreground` / `border-border` utilities silently
 * don't work here — we apply colours via inline `rgb(var(--…))` instead, the
 * same pattern the rest of the viewer chrome uses.
 */
// Playback speeds offered in the speed menu (descending, YouTube-style).
const AUDIO_RATES = [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5];
// Shared hover tint that works regardless of the broken theme utilities.
const AUDIO_BTN = 'shrink-0 rounded-full hover:bg-black/5 dark:hover:bg-white/10';

const InlineAudioPlayer: React.FC<InlineAudioPlayerProps> = ({ src, isMobile, pos, setPos, onClose, t }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  // `pos` is lifted to the parent (see props): null = device-aware default CSS
  // position; once dragged, explicit viewport coords (the overlay is fixed
  // inset-0, so its offset-parent box matches the viewport).
  const [dragging, setDragging] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; left: number; top: number } | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onPause);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onPause);
    };
  }, []);

  // Keep the media element's rate in sync with our state (also re-applies after
  // a source swap, since playbackRate resets to 1 on load).
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, src]);

  // Close the speed menu on any outside pointer-down.
  useEffect(() => {
    if (!speedOpen) return;
    const onDown = (e: PointerEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) setSpeedOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [speedOpen]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {}); else el.pause();
  };

  // --- Progress bar: click anywhere to jump, hold + drag to scrub. ---
  const seekToClientX = (clientX: number) => {
    const bar = barRef.current;
    const el = audioRef.current;
    if (!bar || !el || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const time = ratio * duration;
    el.currentTime = time;
    setCurrent(time);
  };
  const onBarPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubbing(true);
    seekToClientX(e.clientX);
  };
  const onBarPointerMove = (e: React.PointerEvent) => {
    if (scrubbing) seekToClientX(e.clientX);
  };
  const onBarPointerUp = (e: React.PointerEvent) => {
    setScrubbing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // --- Drag handle: reposition the whole player anywhere in the viewer. ---
  const onHandleDown = (e: React.PointerEvent) => {
    const root = rootRef.current;
    if (!root) return;
    e.preventDefault();
    const rect = root.getBoundingClientRect();
    dragState.current = { startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
    setPos({ left: rect.left, top: rect.top }); // pin to current spot, no jump
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    const root = rootRef.current;
    if (!ds || !root) return;
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const left = Math.min(Math.max(8, ds.left + (e.clientX - ds.startX)), window.innerWidth - w - 8);
    const top = Math.min(Math.max(8, ds.top + (e.clientY - ds.startY)), window.innerHeight - h - 8);
    setPos({ left, top });
  };
  const onHandleUp = (e: React.PointerEvent) => {
    setDragging(false);
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const surface = {
    backgroundColor: 'rgb(var(--background))',
    borderColor: 'rgb(var(--border))',
    color: 'rgb(var(--foreground))',
  } as const;

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div
      ref={rootRef}
      className={cn(
        'absolute flex items-center gap-1.5 rounded-full border py-1.5 pl-1 pr-2 shadow-lg',
        // Device-aware default position, dropped once the player is dragged:
        // desktop = bottom-right (clear of left TOC + centred page bar);
        // mobile = above the centred page-control bar.
        !pos && (isMobile ? 'bottom-20 left-1/2 -translate-x-1/2' : 'bottom-3 right-3'),
      )}
      style={{ zIndex: 15, maxWidth: 'calc(100% - 24px)', ...surface, ...(pos ? { left: pos.left, top: pos.top } : {}) }}
    >
      {/* Native element drives playback but is visually hidden. */}
      <audio ref={audioRef} src={src} autoPlay aria-label={t('components.pdfViewer.audio')} className="hidden" />
      {/* Drag handle — press and drag to move the player anywhere. */}
      <div
        role="button"
        aria-label={t('components.pdfViewer.movePlayer')}
        title={t('components.pdfViewer.movePlayer')}
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        className={cn('flex h-8 w-5 shrink-0 touch-none items-center justify-center rounded-full opacity-50 hover:opacity-100', dragging ? 'cursor-grabbing' : 'cursor-grab')}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Button
        size="icon"
        variant="ghost"
        className={cn('h-8 w-8', AUDIO_BTN)}
        onClick={toggle}
        aria-label={t(playing ? 'components.pdfViewer.pauseAudio' : 'components.pdfViewer.playAudio')}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </Button>
      <span className="w-9 text-right text-xs tabular-nums opacity-70">{formatAudioTime(current)}</span>
      {/* Custom progress bar — click to jump, drag to scrub. */}
      <div
        ref={barRef}
        role="slider"
        aria-label={t('components.pdfViewer.audio')}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        onPointerDown={onBarPointerDown}
        onPointerMove={onBarPointerMove}
        onPointerUp={onBarPointerUp}
        className="relative h-4 w-28 shrink-0 cursor-pointer touch-none select-none sm:w-40"
      >
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ backgroundColor: 'rgba(var(--foreground), 0.2)' }} />
        {/* filled portion */}
        <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ width: `${progress}%`, backgroundColor: 'rgb(var(--primary))' }} />
        {/* thumb */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow"
          style={{ left: `${progress}%`, backgroundColor: 'rgb(var(--primary))' }}
        />
      </div>
      <span className="w-9 text-xs tabular-nums opacity-70">{formatAudioTime(duration)}</span>
      {/* Playback speed — opens a YouTube-style list to pick a rate. */}
      <div className="relative shrink-0" ref={speedRef}>
        <Button
          size="sm"
          variant="ghost"
          className={cn('h-8 w-11 px-0 text-xs font-medium tabular-nums', AUDIO_BTN)}
          onClick={() => setSpeedOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={speedOpen}
          aria-label={t('components.pdfViewer.playbackSpeed')}
          title={t('components.pdfViewer.playbackSpeed')}
        >
          {rate}×
        </Button>
        {speedOpen && (
          <div
            role="listbox"
            aria-label={t('components.pdfViewer.playbackSpeed')}
            className="absolute bottom-full right-0 mb-2 max-h-64 w-24 overflow-auto rounded-xl border py-1 shadow-xl"
            style={surface}
          >
            {AUDIO_RATES.map((r) => (
              <button
                key={r}
                role="option"
                aria-selected={r === rate}
                onClick={() => { setRate(r); setSpeedOpen(false); }}
                className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-xs tabular-nums hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Check className={cn('h-3.5 w-3.5 shrink-0', r === rate ? 'opacity-100' : 'opacity-0')} />
                <span>{r === 1 ? t('components.pdfViewer.normalSpeed') : `${r}×`}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className={cn('h-8 w-8', AUDIO_BTN)}
        onClick={onClose}
        aria-label={t('components.pdfViewer.closeAudio')}
      >
        <X className="h-[18px] w-[18px]" />
      </Button>
    </div>
  );
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
  // Dragged player position, kept here (not in the player) so it persists when
  // a new clip remounts the player. Reset only when the viewer itself closes.
  const [audioPos, setAudioPos] = useState<{ left: number; top: number } | null>(null);

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
    if (!open) { setReady(false); setViewerReady(false); setAudio(null); setAudioPos(null); return; }
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
    // Snapshot the saved page *before* any onPageChange fires, so the page-save
    // effect (which writes page 1 during initial load) can't clobber the value
    // we're about to restore to.
    const key = pageStorageKey(src);
    const savedPage = key ? parseInt(localStorage.getItem(key) || '', 10) : NaN;
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    // After the resize-nudges settle the container reaches its final dimensions,
    // then we re-request fit-width so the zoom is calculated against the correct
    // size (the defaultZoomLevel config is read at init, before the container is
    // fully laid out, so the first calculation is off). Applies to all devices.
    const zoomTimer = setTimeout(() => {
      const zoomCap = registryRef.current?.getPlugin?.('zoom')?.provides?.();
      zoomCap?.requestZoom?.('fit-width');
      // Restore the last-read page only after the final fit-width layout is in
      // place — scrolling earlier would land on the wrong pixel once the zoom
      // shift relays out the pages.
      if (savedPage > 1) {
        restoreTimer = setTimeout(() => {
          const scrollCap = registryRef.current?.getPlugin?.('scroll')?.provides?.();
          if (!scrollCap?.scrollToPage) return;
          const total = scrollCap.getTotalPages?.() ?? 0;
          if (total === 0 || savedPage <= total) {
            scrollCap.scrollToPage({ pageNumber: savedPage, behavior: 'auto' });
          }
        }, 150);
      }
    }, 2600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(zoomTimer);
      if (restoreTimer) clearTimeout(restoreTimer);
      if (el) el.style.paddingRight = '';
    };
  }, [ready, blobUrl, error, viewerReady, isMobile, src]);

  // Remember the last-read page per document so reopening lands where the user
  // left off. We persist on every page change; the restore (in the zoom effect)
  // reads the value snapshotted before any change fires, so writing page 1
  // during the initial load can't clobber the position we restore to.
  useEffect(() => {
    if (!(ready && blobUrl && !error && viewerReady)) return;
    const key = pageStorageKey(src);
    if (!key) return;
    const scrollCap = registryRef.current?.getPlugin?.('scroll')?.provides?.();
    if (!scrollCap?.onPageChange) return;
    const unsubscribe = scrollCap.onPageChange((e: any) => {
      if (e?.pageNumber > 0) localStorage.setItem(key, String(e.pageNumber));
    });
    return () => unsubscribe?.();
  }, [ready, blobUrl, error, viewerReady, src]);

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

  // Ctrl+I / Cmd+I toggles colour inversion (desktop only — mobile uses the menu).
  useEffect(() => {
    if (!open || isMobile) return;
    const onCtrlI = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'i') return;
      e.preventDefault();
      toggleInvertedRef.current();
    };
    window.addEventListener('keydown', onCtrlI);
    return () => window.removeEventListener('keydown', onCtrlI);
  }, [open, isMobile]);

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
                      // Keep the "import document" entry (and its divider) on
                      // desktop; drop them on mobile to keep the menu compact.
                      (item.id !== 'document:open' || !isMobile) && item.id !== 'document:close' &&
                      (item.id !== 'divider-10' || !isMobile) && item.id !== 'document:protect' &&
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
            tapped. It positions itself (device-aware default + drag-to-move)
            and seeks via a custom progress bar; see InlineAudioPlayer. */}
        {audio && (
          <InlineAudioPlayer
            key={audio.key}
            src={audio.src}
            isMobile={isMobile}
            pos={audioPos}
            setPos={setAudioPos}
            onClose={() => setAudio(null)}
            t={t}
          />
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
