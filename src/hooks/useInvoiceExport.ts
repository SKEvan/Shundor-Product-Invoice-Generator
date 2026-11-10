import { useState, type RefObject } from 'react';
import type { Invoice } from '@/types/invoice';
import {
  createInvoiceJpeg,
  createInvoicePdf,
  downloadBlob,
  invoiceFileName,
  shareBlob,
} from '@/utils/invoiceExport';

export type ExportKind = 'pdf' | 'jpg' | 'share';

export interface ExportResult {
  tone: 'success' | 'error';
  text: string;
}

interface UseInvoiceExportOptions {
  /** The rendered <InvoiceDocument>. */
  documentRef: RefObject<HTMLDivElement | null>;
  /** Saves the invoice if needed and returns it, or null if the form has errors. */
  ensureSaved: () => Promise<Invoice | null>;
}

/** Save → render → download/share, with a busy state per button. */
export function useInvoiceExport({ documentRef, ensureSaved }: UseInvoiceExportOptions) {
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);

  async function exportAs(kind: ExportKind) {
    setBusy(kind);
    setResult(null);
    try {
      const invoice = await ensureSaved();
      const node = documentRef.current;
      if (!invoice || !node) return;

      const title = `Invoice ${invoice.invoiceNo}`;
      if (kind === 'pdf') {
        downloadBlob(await createInvoicePdf(node, title), invoiceFileName(invoice.invoiceNo, invoice.customer.name, 'pdf'));
      } else {
        const jpeg = await createInvoiceJpeg(node);
        const fileName = invoiceFileName(invoice.invoiceNo, invoice.customer.name, 'jpg');
        if (kind === 'share') await shareBlob(jpeg, fileName, title);
        else downloadBlob(jpeg, fileName);
      }
      setResult({ tone: 'success', text: `Invoice ${invoice.invoiceNo} saved.` });
    } catch (error) {
      // Android only allows sharing shortly after a tap; a slow network can miss that window.
      const needsNewTap = error instanceof DOMException && error.name === 'NotAllowedError';
      setResult({
        tone: 'error',
        text: needsNewTap ? 'Invoice is ready — tap Share once more.' : error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(null);
    }
  }

  return { busy, result, exportAs, clearResult: () => setResult(null) };
}
