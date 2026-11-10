import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { useInvoiceDraft } from '@/hooks/useInvoiceDraft';
import { useInvoiceExport } from '@/hooks/useInvoiceExport';
import { createInvoice, updateInvoice } from '@/services/invoiceService';
import type { Invoice, InvoiceDraft } from '@/types/invoice';
import { calculateTotals } from '@/utils/invoiceCalc';
import { draftFromInvoice, draftFromParsedOrder, draftsEqual, validateDraft } from '@/utils/invoiceDraft';
import { preloadExportLibraries } from '@/utils/invoiceExport';
import { parseOrder } from '@/utils/order/parseOrder';
import { ChargesSection } from './ChargesSection';
import { CustomerSection } from './CustomerSection';
import { ExportBar } from './ExportBar';
import { InvoiceDocument } from './InvoiceDocument';
import { InvoicePreview } from './InvoicePreview';
import { ItemsSection } from './ItemsSection';
import { PasteOrderBox } from './PasteOrderBox';

interface InvoiceEditorProps {
  initialDraft: InvoiceDraft;
  /** Pass an invoice to edit it (keeps its number). Omit for a new invoice. */
  initialInvoice?: Invoice | null;
  /** Show the "paste the order" box (new invoices only). */
  allowPaste?: boolean;
  onDraftChange?: (draft: InvoiceDraft, saved: Invoice | null) => void;
  onSaved?: (invoice: Invoice) => void;
}

/**
 * The whole invoice workflow on one screen:
 * paste → check customer → prices → delivery/payment → preview → PDF/JPG/Share.
 * The invoice is saved (and gets its number) the first time it's downloaded or shared.
 */
export function InvoiceEditor({ initialDraft, initialInvoice = null, allowPaste = false, onDraftChange, onSaved }: InvoiceEditorProps) {
  const [draft, dispatch] = useInvoiceDraft(initialDraft);
  const [saved, setSaved] = useState<Invoice | null>(initialInvoice);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [zoneDetected, setZoneDetected] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const documentRef = useRef<HTMLDivElement>(null);
  const issuedToday = useMemo(() => new Date(), []);

  const isDirty = !saved || !draftsEqual(draft, draftFromInvoice(saved));
  const totals = calculateTotals(draft);

  const { busy, result, exportAs, clearResult } = useInvoiceExport({ documentRef, ensureSaved });

  useEffect(() => {
    // Fetch the PDF/JPG libraries while the owner is still filling the form.
    const id = window.setTimeout(preloadExportLibraries, 1200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    onDraftChange?.(draft, saved);
  }, [draft, saved, onDraftChange]);

  function handleOrderPasted(text: string) {
    const order = parseOrder(text);
    dispatch({ type: 'replace', draft: draftFromParsedOrder(order, text) });
    setWarnings(order.warnings);
    setZoneDetected(order.deliveryZoneDetected);
    setErrors([]);
    clearResult();
    setSaved(null); // a newly pasted order is always a new invoice
  }

  async function ensureSaved(): Promise<Invoice | null> {
    const problems = validateDraft(draft);
    setErrors(problems);
    if (problems.length > 0) return null;
    if (saved && !isDirty) return saved;

    const invoice = saved ? await updateInvoice(saved.id, draft) : await createInvoice(draft);
    // Render the real invoice number into the document before it's captured.
    flushSync(() => {
      setSaved(invoice);
      dispatch({ type: 'replace', draft: draftFromInvoice(invoice) });
    });
    onSaved?.(invoice);
    return invoice;
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-6">
      {/* Form */}
      <div className="space-y-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        {allowPaste && <PasteOrderBox onRead={handleOrderPasted} />}
        {warnings.length > 0 && <Alert tone="warning" title="Please check" messages={warnings} />}
        <CustomerSection customer={draft.customer} dispatch={dispatch} />
        <ItemsSection items={draft.items} dispatch={dispatch} />
        <ChargesSection
          draft={draft}
          dispatch={dispatch}
          zoneHint={
            zoneDetected && (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="size-3.5" /> Detected from the order
              </span>
            )
          }
        />
      </div>

      {/* Preview */}
      <div className="mt-6 lg:col-start-2 lg:row-start-2 lg:mt-0">
        <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
          <h2 className="text-base font-semibold text-gray-900">Preview</h2>
          <p className="text-right text-xs text-gray-500">
            {!saved && 'Number is assigned on first download'}
            {saved && !isDirty && `Saved as ${saved.invoiceNo}`}
            {saved && isDirty && `Changes will update ${saved.invoiceNo}`}
          </p>
        </div>
        <InvoicePreview>
          <InvoiceDocument
            ref={documentRef}
            draft={draft}
            invoiceNo={saved?.invoiceNo ?? null}
            issuedAt={saved?.createdAt ?? issuedToday}
          />
        </InvoicePreview>
      </div>

      {/* Actions — sticky at the bottom on phones, above the preview on desktop */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 sm:bottom-0 -mx-4 mt-4 border-t border-brand-100 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:col-start-2 lg:row-start-1 lg:mx-0 lg:mt-0 lg:mb-4 lg:rounded-2xl lg:border-0 lg:p-4 lg:shadow-sm lg:ring-1 lg:ring-brand-100">
        {(errors.length > 0 || result) && (
          <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
            {errors.length > 0 && <Alert tone="error" title="Fix these to continue" messages={errors} />}
            {result && <Alert tone={result.tone} title={result.text} />}
          </div>
        )}
        <ExportBar amountDue={totals.amountDue} busy={busy} onExport={exportAs} />
      </div>
    </div>
  );
}
