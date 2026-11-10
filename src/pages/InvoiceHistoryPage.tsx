import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FilePlus2, Search } from 'lucide-react';
import { InvoiceListItem } from '@/components/invoice/InvoiceListItem';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useInvoiceList } from '@/hooks/useInvoiceList';
import type { InvoiceSummary } from '@/types/invoice';
import { formatMonth } from '@/utils/format';

export default function InvoiceHistoryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim(), 300);
  const { invoices, loading, hasMore, error, loadMore } = useInvoiceList(search);

  return (
    <>
      <PageHeader title="History" subtitle="All saved invoices, newest first." />

      <label className="relative mb-4 block">
        <span className="sr-only">Search invoices</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, phone or invoice no."
          className="w-full rounded-xl border-0 bg-white py-3 pr-3 pl-9 text-base ring-1 ring-brand-100 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:outline-none sm:text-sm"
        />
      </label>

      {error && <Alert tone="error" title={error} />}

      {groupByMonth(invoices).map(([month, rows]) => (
        <section key={month} className="mb-4">
          <h2 className="mb-1.5 px-1 text-xs font-semibold tracking-wide text-brand-700 uppercase">{month}</h2>
          <ul className="divide-y divide-brand-50 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            {rows.map((invoice) => (
              <InvoiceListItem key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        </section>
      ))}

      {loading && (
        <div className="grid place-items-center py-8 text-brand-600">
          <Spinner />
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-brand-100">
          <p className="text-gray-600">{search ? 'No invoices match your search.' : 'No invoices yet.'}</p>
          {!search && (
            <Button className="mt-4" icon={<FilePlus2 className="size-4" />} onClick={() => navigate('/')}>
              Create the first one
            </Button>
          )}
        </div>
      )}

      {!loading && hasMore && (
        <Button variant="secondary" fullWidth onClick={loadMore}>
          Load more
        </Button>
      )}
    </>
  );
}

function groupByMonth(invoices: InvoiceSummary[]): [string, InvoiceSummary[]][] {
  const groups = new Map<string, InvoiceSummary[]>();
  for (const invoice of invoices) {
    const month = formatMonth(invoice.createdAt);
    groups.set(month, [...(groups.get(month) ?? []), invoice]);
  }
  return [...groups.entries()];
}
