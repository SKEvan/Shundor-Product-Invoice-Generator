import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import type { InvoiceSummary } from '@/types/invoice';
import { formatDate, formatMoney } from '@/utils/format';

export function InvoiceListItem({ invoice }: { invoice: InvoiceSummary }) {
  return (
    <li>
      <Link
        to={`/invoices/${invoice.id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50 active:bg-brand-100"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-semibold text-gray-900">{invoice.customerName}</p>
            <p className="shrink-0 text-sm font-semibold text-brand-700">{formatMoney(invoice.amountDue)}</p>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-2 text-xs text-gray-500">
            <p className="truncate">
              {invoice.invoiceNo} · {invoice.customerPhone}
            </p>
            <p className="shrink-0">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-gray-300" />
      </Link>
    </li>
  );
}
