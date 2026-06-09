import React from 'react';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import type { PluginRegistry } from '@embedpdf/react-pdf-viewer';

// Lazy-loaded on purpose: importing this module pulls in the whole embedpdf
// snippet (viewer + bundled locale dictionaries). Keeping every @embedpdf import
// confined here means it all lands in the on-demand `pdf-viewer` chunk.

export type ViewerLocale = 'en' | 'zh-TW' | 'zh-CN';
export type ViewerPreference = 'light' | 'dark' | 'system';

interface EmbedPdfViewerProps {
  src: string;
  preference: ViewerPreference;
  locale: ViewerLocale;
  onReady?: (registry: PluginRegistry) => void;
  /** 'always' on touch devices (drag-to-scroll); 'never' on desktop (text cursor). */
  defaultPanMode?: 'never' | 'always';
  /** Initial zoom level. Defaults to 'fit-width' for all devices. */
  defaultZoomLevel?: 'fit-width' | 'fit-page' | 'automatic' | number;
  /** Filename used by the built-in Export menu item (mobile). */
  exportFileName?: string;
}

export const EmbedPdfViewer: React.FC<EmbedPdfViewerProps> = ({
  src,
  preference,
  locale,
  onReady,
  defaultPanMode = 'never',
  defaultZoomLevel,
  exportFileName,
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
      // Only set when caller provides a value.
      ...(defaultZoomLevel !== undefined && { zoom: { defaultZoomLevel } }),
      // Don't fetch the default stamp libraries from jsDelivr — they 404 for
      // locales like zh-TW and we don't need built-in stamps anyway.
      stamp: { manifests: [] },
      // Set the filename used by the built-in Export command (mobile menu).
      // The export plugin names the file after the *document's* name
      // (`coreDoc.name ?? defaultFileName`), and a doc loaded from a plain
      // `src` blob URL gets a random UUID name (extracted from the blob URL).
      // So we must load it via documentManager with an explicit `name` —
      // setting `export.defaultFileName` alone is never reached. We pass src
      // through `initialDocuments` here; the snippet merges our documentManager
      // config last, so this overrides its default `[{ url: src }]` entry.
      ...(exportFileName !== undefined && {
        export: { defaultFileName: exportFileName },
        documentManager: { initialDocuments: [{ url: src, name: exportFileName }] },
      }),
    }}
  />
);

export default EmbedPdfViewer;
