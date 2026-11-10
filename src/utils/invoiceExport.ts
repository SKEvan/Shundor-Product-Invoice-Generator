/**
 * Turns the on-screen invoice (an HTML element) into JPG / PDF files.
 *
 * Why an image first? The browser draws the invoice exactly as previewed
 * (fonts, colours, layout). We capture that as a high-resolution JPG and,
 * for the PDF, place the same image on the page — so PDF and JPG always
 * match the preview.
 *
 * The libraries are loaded on demand so they don't slow down the first page load.
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

let cachedFontCss: string | undefined;

/** Starts downloading the export libraries in the background (call after the page has loaded). */
export function preloadExportLibraries(): void {
  void import('html-to-image');
  void import('jspdf');
}

async function renderJpegDataUrl(node: HTMLElement): Promise<string> {
  const { toJpeg, getFontEmbedCSS } = await import('html-to-image');
  await document.fonts.ready;
  // Embedding fonts is the slow part; do it once and reuse it.
  cachedFontCss ??= await getFontEmbedCSS(node);
  return toJpeg(node, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    fontEmbedCSS: cachedFontCss,
    width: node.offsetWidth,
    height: node.offsetHeight,
  });
}

export async function createInvoiceJpeg(node: HTMLElement): Promise<Blob> {
  const dataUrl = await renderJpegDataUrl(node);
  return (await fetch(dataUrl)).blob();
}

export async function createInvoicePdf(node: HTMLElement, title: string): Promise<Blob> {
  const [dataUrl, { jsPDF }] = await Promise.all([renderJpegDataUrl(node), import('jspdf')]);

  // A4 width; taller pages if an order has many items.
  const imageHeightMm = (A4_WIDTH_MM * node.offsetHeight) / node.offsetWidth;
  const pageHeightMm = Math.max(A4_HEIGHT_MM, imageHeightMm);

  const pdf = new jsPDF({ unit: 'mm', format: [A4_WIDTH_MM, pageHeightMm], orientation: 'portrait', compress: true });
  pdf.setProperties({ title, creator: 'Shundor Product' });
  pdf.addImage(dataUrl, 'JPEG', 0, 0, A4_WIDTH_MM, imageHeightMm);
  return pdf.output('blob');
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** True on browsers (e.g. Android Chrome) that can share files to WhatsApp/Messenger. */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  const probe = new File([''], 'probe.jpg', { type: 'image/jpeg' });
  return navigator.canShare({ files: [probe] });
}

/** Opens the phone's share sheet. Resolves quietly if the owner cancels. */
export async function shareBlob(blob: Blob, fileName: string, title: string): Promise<void> {
  const file = new File([blob], fileName, { type: blob.type });
  try {
    await navigator.share({ files: [file], title });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    throw error;
  }
}

/** "SP-2611-001", "Rahim Uddin", "pdf" → "SP-2611-001_Rahim-Uddin.pdf" */
export function invoiceFileName(invoiceNo: string, customerName: string, extension: 'pdf' | 'jpg'): string {
  const safeName = customerName.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  return `${invoiceNo}${safeName ? `_${safeName}` : ''}.${extension}`;
}
