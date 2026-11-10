import { useEffect, useState } from 'react';
import { listInvoices, PAGE_SIZE } from '@/services/invoiceService';
import type { InvoiceSummary } from '@/types/invoice';

/** Last unfiltered list, kept in memory so History opens instantly on revisit. */
let cachedFirstPage: InvoiceSummary[] | null = null;

/** Loads the history list (newest first) with search and "load more". */
export function useInvoiceList(search: string) {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>(() => (search ? [] : (cachedFirstPage ?? [])));
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  // A new search starts again from the first page.
  const [previousSearch, setPreviousSearch] = useState(search);
  if (search !== previousSearch) {
    setPreviousSearch(search);
    setPage(0);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listInvoices({ search, page })
      .then((rows) => {
        if (cancelled) return;
        setInvoices((previous) => (page === 0 ? rows : [...previous, ...rows]));
        setHasMore(rows.length === PAGE_SIZE);
        if (page === 0 && !search) cachedFirstPage = rows;
      })
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, page]);

  return { invoices, loading, hasMore, error, loadMore: () => setPage((p) => p + 1) };
}

/** Forget the cached list (after creating, editing or deleting an invoice). */
export function invalidateInvoiceList(): void {
  cachedFirstPage = null;
}
