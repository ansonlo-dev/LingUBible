import React from 'react';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';

// Lazy-loaded on purpose: importing this module pulls in the whole embedpdf
// snippet (viewer + bundled locale dictionaries). Keeping every @embedpdf import
// confined here means it all lands in the on-demand `pdf-viewer` chunk.

export type ViewerLocale = 'en' | 'zh-TW' | 'zh-CN';
export type ViewerPreference = 'light' | 'dark' | 'system';

interface EmbedPdfViewerProps {
  src: string;
  preference: ViewerPreference;
  locale: ViewerLocale;
  onReady?: () => void;
  /** 'always' on touch devices (drag-to-scroll); 'never' on desktop (text cursor). */
  defaultPanMode?: 'never' | 'always';
  /** Initial zoom level. 'fit-width' recommended for desktop; omit to use viewer default on mobile. */
  defaultZoomLevel?: 'fit-width' | 'fit-page' | 'automatic' | number;
}

export const EmbedPdfViewer: React.FC<EmbedPdfViewerProps> = ({
  src,
  preference,
  locale,
  onReady,
  defaultPanMode = 'never',
  defaultZoomLevel,
}) => (
  <PDFViewer
    className="h-full w-full"
    style={{ height: '100%', width: '100%' }}
    onReady={onReady}
    config={{
      src,
      theme: { preference },
      // The viewer bundles dictionaries for en / zh-TW / zh-CN (and more) in its
      // default config; we only override the active locale. (We intentionally
      // don't pass `locales` — that would replace the bundled set, and the
      // dictionaries aren't exported for us to re-supply.)
      i18n: { defaultLocale: locale, fallbackLocale: 'en' },
      // Mobile: 'always' so drag scrolls the PDF. Desktop: 'never' keeps the
      // text cursor and lets users select text (pan mode sets touch-action:none
      // and captures pointers, which blocks text selection on desktop).
      pan: { defaultMode: defaultPanMode },
      // Only set when caller provides a value (desktop sets 'fit-width'; mobile omits to keep viewer default).
      ...(defaultZoomLevel !== undefined && { zoom: { defaultZoomLevel } }),
      // Don't fetch the default stamp libraries from jsDelivr — they 404 for
      // locales like zh-TW and we don't need built-in stamps anyway.
      stamp: { manifests: [] },
    }}
  />
);

export default EmbedPdfViewer;
