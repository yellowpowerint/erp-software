import api from '@/lib/api';

function getFilenameFromContentDisposition(contentDisposition?: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition);
  const raw = decodeURIComponent(match?.[1] || match?.[2] || '').trim();
  return raw || null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function postAndDownload(path: string, data: any, fallbackFilename: string) {
  const response = await api.post(path, data, { responseType: 'blob' });
  const filename =
    getFilenameFromContentDisposition(response.headers?.['content-disposition']) || fallbackFilename;
  downloadBlob(new Blob([response.data]), filename);
}

export type PageNumberPosition =
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left'
  | 'top-right'
  | 'top-center'
  | 'top-left';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export const pdfToolsApi = {
  merge: async (documentIds: string[], fileName?: string) =>
    postAndDownload('/documents/merge', { documentIds, fileName }, `merged-${Date.now()}.pdf`),

  split: async (documentId: string) =>
    postAndDownload(`/documents/${documentId}/split`, {}, `split-${documentId}.zip`),

  extractPages: async (documentId: string, pages: number[], fileName?: string) =>
    postAndDownload(
      `/documents/${documentId}/extract-pages`,
      { pages, fileName },
      `extracted-${documentId}.pdf`,
    ),

  reorder: async (documentId: string, order: number[], fileName?: string) =>
    postAndDownload(
      `/documents/${documentId}/reorder`,
      { order, fileName },
      `reordered-${documentId}.pdf`,
    ),

  rotate: async (documentId: string, rotationDegrees: number, pages?: number[], fileName?: string) =>
    postAndDownload(
      `/documents/${documentId}/rotate`,
      { rotationDegrees, pages, fileName },
      `rotated-${documentId}.pdf`,
    ),

  addPageNumbers: async (
    documentId: string,
    opts: { position?: PageNumberPosition; startAt?: number; fontSize?: number; margin?: number; fileName?: string },
  ) => postAndDownload(`/documents/${documentId}/add-page-numbers`, opts, `numbered-${documentId}.pdf`),

  addHeadersFooters: async (
    documentId: string,
    opts: { headerText?: string; footerText?: string; fontSize?: number; margin?: number; fileName?: string },
  ) => postAndDownload(`/documents/${documentId}/add-headers-footers`, opts, `headers-footers-${documentId}.pdf`),

  compress: async (
    documentId: string,
    opts: { rasterize?: boolean; density?: number; jpegQuality?: number; fileName?: string },
  ) => postAndDownload(`/documents/${documentId}/compress`, opts, `compressed-${documentId}.pdf`),

  combineWith: async (documentId: string, otherDocumentId: string, fileName?: string) =>
    postAndDownload(
      `/documents/${documentId}/combine-with`,
      { otherDocumentId, fileName },
      `combined-${documentId}.pdf`,
    ),

  watermark: async (
    documentId: string,
    opts: { text: string; opacity?: number; rotationDegrees?: number; fontSize?: number; fileName?: string },
  ) => postAndDownload(`/documents/${documentId}/watermark`, opts, `watermarked-${documentId}.pdf`),

  stamp: async (
    documentId: string,
    opts: { text: string; page?: number; x?: number; y?: number; fontSize?: number; rotationDegrees?: number; fileName?: string },
  ) => postAndDownload(`/documents/${documentId}/stamp`, opts, `stamped-${documentId}.pdf`),

  redact: async (
    documentId: string,
    opts: {
      redactions: Array<{ page: number; x: number; y: number; width: number; height: number }>;
      density?: number;
      fileName?: string;
    },
  ) => postAndDownload(`/documents/${documentId}/redact`, opts, `redacted-${documentId}.pdf`),

  annotateText: async (
    documentId: string,
    opts: { text: string; page: number; x: number; y: number; fontSize?: number; rotationDegrees?: number; fileName?: string },
  ) => postAndDownload(`/documents/${documentId}/annotate-text`, opts, `annotated-${documentId}.pdf`),

  highlight: async (
    documentId: string,
    opts: {
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      color?: HighlightColor;
      opacity?: number;
      fileName?: string;
    },
  ) => postAndDownload(`/documents/${documentId}/highlight`, opts, `highlighted-${documentId}.pdf`),

  batchCompress: async (documentIds: string[], opts: { rasterize?: boolean; density?: number; jpegQuality?: number } = {}) =>
    postAndDownload(`/documents/batch-compress`, { documentIds, ...opts }, `batch-compress-${Date.now()}.zip`),

  batchWatermark: async (
    documentIds: string[],
    opts: { text: string; opacity?: number; rotationDegrees?: number; fontSize?: number },
  ) => postAndDownload(`/documents/batch-watermark`, { documentIds, ...opts }, `batch-watermark-${Date.now()}.zip`),

  batchAddPageNumbers: async (
    documentIds: string[],
    opts: { position?: PageNumberPosition; startAt?: number; fontSize?: number; margin?: number } = {},
  ) =>
    postAndDownload(
      `/documents/batch-add-page-numbers`,
      { documentIds, ...opts },
      `batch-add-page-numbers-${Date.now()}.zip`,
    ),
};
