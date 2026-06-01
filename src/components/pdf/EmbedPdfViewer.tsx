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
}

export const EmbedPdfViewer: React.FC<EmbedPdfViewerProps> = ({
  src,
  preference,
  locale,
  onReady,
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
      // Keep the hand tool off by default so native wheel / touch scrolling
      // stays available (pan mode sets touch-action:none and captures pointers).
      // Users can still enable it from the toolbar.
      pan: { defaultMode: 'never' },
    }}
  />
);

export default EmbedPdfViewer;
