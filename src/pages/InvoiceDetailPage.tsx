import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { invalidateInvoiceList } from '@/hooks/useInvoiceList';
import { deleteInvoice, getInvoice } from '@/services/invoiceService';
import type { Invoice } from '@/types/invoice';
import { formatDate } from '@/utils/format';
import { draftFromInvoice } from '@/utils/invoiceDraft';

/** View, edit, re-download or delete a saved invoice. */
export default function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInvoice(id)
      .then((result) => !cancelled && setInvoice(result))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!invoice || !window.confirm(`Delete invoice ${invoice.invoiceNo}? This can’t be undone.`)) return;
    setDeleting(true);
    try {
      await deleteInvoice(invoice.id);
      invalidateInvoiceList();
      navigate('/invoices', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  const back = (
    <Button variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={() => navigate('/invoices')} className="-ml-3 mb-2">
      History
    </Button>
  );

  if (error && !invoice) {
    return (
      <>
        {back}
        <Alert tone="error" title={error} />
      </>
    );
  }

  if (!invoice) {
    return (
      <div className="grid place-items-center py-24 text-brand-600">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={invoice.invoiceNo}
        subtitle={`${invoice.customer.name} · ${formatDate(invoice.createdAt)}`}
        action={
          <Button variant="danger" icon={<Trash2 className="size-4" />} loading={deleting} onClick={handleDelete}>
            <span className="hidden sm:inline">Delete</span>
          </Button>
        }
      />
      {error && (
        <div className="mb-4">
          <Alert tone="error" title={error} />
        </div>
      )}
      {invoice.rawOrderText && (
        <details className="mb-4 rounded-2xl bg-white p-4 text-sm ring-1 ring-brand-100">
          <summary className="cursor-pointer font-medium text-gray-700">Original order message</summary>
          <pre className="mt-3 font-sans whitespace-pre-wrap text-gray-600">{invoice.rawOrderText}</pre>
        </details>
      )}
      <InvoiceEditor
        key={invoice.id}
        initialDraft={draftFromInvoice(invoice)}
        initialInvoice={invoice}
        onSaved={(updated) => {
          invalidateInvoiceList();
          setInvoice(updated);
        }}
      />
    </>
  );
}
