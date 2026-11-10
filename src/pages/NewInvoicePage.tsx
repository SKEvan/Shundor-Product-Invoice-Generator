import { useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import type { Invoice, InvoiceDraft } from '@/types/invoice';
import { draftsEqual, emptyDraft } from '@/utils/invoiceDraft';
import { readJson, removeKey, writeJson } from '@/utils/storage';

/** Unsaved work is kept on the device, so a reload or closed tab doesn't lose it. */
const DRAFT_STORAGE_KEY = 'sp:new-invoice-draft';

export default function NewInvoicePage() {
  // Changing the key remounts the editor with a blank form.
  const [editorKey, setEditorKey] = useState(0);
  const [initialDraft, setInitialDraft] = useState<InvoiceDraft>(() => readJson<InvoiceDraft>(DRAFT_STORAGE_KEY) ?? emptyDraft());
  const [hasContent, setHasContent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleDraftChange = useCallback((draft: InvoiceDraft, saved: Invoice | null) => {
    const blank = draftsEqual(draft, emptyDraft());
    setHasContent(!blank);
    setIsSaved(saved !== null);
    if (saved || blank) removeKey(DRAFT_STORAGE_KEY);
    else writeJson(DRAFT_STORAGE_KEY, draft);
  }, []);

  function startNew() {
    if (hasContent && !isSaved && !window.confirm('Discard this unsaved invoice?')) return;
    removeKey(DRAFT_STORAGE_KEY);
    setInitialDraft(emptyDraft());
    setEditorKey((key) => key + 1);
  }

  return (
    <>
      <PageHeader
        title="New invoice"
        subtitle="Paste the buyer’s order, add prices, then download or share."
        action={
          hasContent && (
            <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={startNew}>
              <span className="hidden sm:inline">Start new</span>
              <span className="sm:hidden">New</span>
            </Button>
          )
        }
      />
      <InvoiceEditor key={editorKey} initialDraft={initialDraft} allowPaste onDraftChange={handleDraftChange} />
    </>
  );
}
